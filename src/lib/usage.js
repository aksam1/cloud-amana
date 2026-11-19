// The usage counts: what this site can tell its owner, and nothing more.
//
// The rules live in usageRules.js (pure, testable on their own). This file is the part that runs
// in the browser: it holds what has happened since the last send, and sends it when the page is
// hidden or closed.
//
// The whole module is behind one compile-time guard (USAGE_ON). In the hosted artifact the guard
// is false, so the bundler drops every call and the counts' code never reaches the reader's
// browser at all.
//
// The rules (kept deliberately narrow):
//   · nothing is sent when the reader's browser asks sites not to track (Global Privacy Control,
//     Do Not Track), or when the reader's own switch is off
//   · no cookie, no identifier, no address, no picture of the reader: a document holds a day, a
//     part number, the device, the language, the site the reader came from, and what happened
//   · never an answer, a reflection, a note, an email address, or anything the reader typed
//   · each visit's document is separate: nothing links one visit to another, or to a person

import {
  buildDoc,
  deviceKind,
  eventName,
  MAX_ERRORS,
  MAX_EVENTS,
  referrerHost,
  returningSince,
  routeName,
  scrubError,
  toFirestore,
} from './usageRules.js';
import { WEB_TARGET } from './target.js';

/** True only in the web build (the artifact build never counts anything). */
export const USAGE_ON = WEB_TARGET;

const FIRST_SEEN = 'amanah:firstSeen';

// ── The gates ──────────────────────────────────────────────────────────────────

/** The reader's browser asks sites not to track (Global Privacy Control, or Do Not Track). */
export function trackingOff() {
  try {
    if (navigator.globalPrivacyControl === true) return true;
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return true;
  } catch {
    /* a browser that will not say: go on */
  }
  return false;
}

/** Is this a test browser, a bot, or a machine address? Nothing is sent from one. */
export function machineAddress() {
  try {
    if (navigator.webdriver) return true;
    const host = location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
  } catch {
    /* no browser: go on */
  }
  return false;
}

/** Why the counts are not being sent, in plain words (or '' when they are). */
export function offReason(prefs = {}) {
  if (trackingOff()) return 'Your browser asks sites not to track, so nothing is sent.';
  if (prefs && prefs.usage === false) return 'You turned the counts off.';
  if (machineAddress()) return 'Nothing is counted here.';
  return '';
}

/** The day this browser was first here (kept here, never sent). */
export function firstSeenDay() {
  try {
    const raw = localStorage.getItem(FIRST_SEEN);
    if (raw) return raw;
    const day = new Date().toISOString().slice(0, 10);
    localStorage.setItem(FIRST_SEEN, day);
    return day;
  } catch {
    return '';
  }
}

/** Forget the first-seen day: when the reader turns the counts off, or deletes their data. */
export function forgetUsage() {
  try {
    localStorage.removeItem(FIRST_SEEN);
  } catch {
    /* nothing kept */
  }
}

// ── The tracker ────────────────────────────────────────────────────────────────

/**
 * A tracker for one page load. The sender is injected, so the rules can be tested with no
 * network at all: `send` is handed the body that would go out, and returns nothing.
 *
 * `allowed` is asked once per send. `visit` holds the small facts about this visit.
 */
export function createTracker({ send, now = () => Date.now(), allowed = () => true, visit = {} } = {}) {
  let part = 0;
  let events = [];
  let errors = [];
  let routes = {};
  let seconds = 0;
  let visibleSince = 0;

  /** The document for this part, as it would be sent. */
  function summary() {
    return buildDoc({
      now: now(),
      part,
      device: visit.device || 'desktop',
      lang: visit.lang || 'en',
      ref: visit.ref || '',
      app: !!visit.app,
      ret: returningSince(visit.firstSeen || '', now()),
      seconds,
      routes,
      events,
      errors,
    });
  }

  /** Record something that happened. The name must be one of the whitelisted shapes. */
  function track(kind, ...args) {
    if (!allowed()) return;
    const name = eventName(kind, ...args);
    if (!name) return;
    events.push(name);
    if (events.length > MAX_EVENTS * 2) events = events.slice(-MAX_EVENTS);
  }

  /** Record a failure, cleaned of anything that could point at a person. */
  function trackError(error, where = '') {
    if (!allowed()) return;
    const text = `${where ? `${where}: ` : ''}${scrubError(error)}`;
    errors.push(text.slice(0, 140));
    if (errors.length > MAX_ERRORS * 2) errors = errors.slice(-MAX_ERRORS);
  }

  /** Count the page the reader is on, by its name only. */
  function trackRoute(hash = '') {
    if (!allowed()) return;
    const name = routeName(hash);
    if (!name) return;
    routes[name] = (routes[name] || 0) + 1;
  }

  /** The page came in front of the reader: start counting its visible seconds. */
  function resume() {
    if (!visibleSince) visibleSince = now();
  }

  /** The page went out of sight: add the seconds it was visible, and stop counting. */
  function countVisible() {
    if (visibleSince) {
      seconds += Math.max(0, Math.round((now() - visibleSince) / 1000));
      visibleSince = 0;
    }
  }

  /** Send what has happened since the last send. Does nothing when there is nothing to send. */
  function flush() {
    if (!allowed()) return false;
    countVisible();
    if (!events.length && !Object.keys(routes).length && !errors.length && !seconds) return false;
    const doc = summary();
    const body = toFirestore(doc);
    events = [];
    errors = [];
    routes = {};
    seconds = 0;
    part += 1;
    try {
      send(body);
    } catch {
      /* a failure is quiet: nothing is retried, nothing is shown */
    }
    return true;
  }

  return {
    track,
    trackError,
    trackRoute,
    flush,
    summary,
    resume,
    countVisible,
    get part() {
      return part;
    },
  };
}

// ── The page's own tracker ─────────────────────────────────────────────────────

let tracker = null;
let started = false;

/** Post one document. Uses a beacon when the page is going away, and fetch otherwise. */
async function post(url, body) {
  const text = JSON.stringify(body);
  try {
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(url, new Blob([text], { type: 'text/plain;charset=UTF-8' }));
      if (ok) return true;
    }
  } catch {
    /* fall through to fetch */
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: text,
    });
    return !!res.ok;
  } catch {
    return false; // a failure is quiet: nothing is retried, nothing is shown
  }
}

/** The small facts about this visit, read once. */
function visitFacts() {
  let device = 'desktop';
  let app = false;
  try {
    const coarse = matchMedia('(pointer: coarse)').matches;
    device = deviceKind(window.innerWidth || 0, coarse);
    app = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  } catch {
    /* go on with the defaults */
  }
  let ref = '';
  try {
    ref = referrerHost(document.referrer, location.hostname);
  } catch {
    /* no referrer */
  }
  return {
    device,
    app,
    ref,
    lang: (navigator.language || 'en').slice(0, 2).toLowerCase(),
    // the first-seen day is only written to this browser when the counts may be sent at all
    firstSeen: usageAllowed() ? firstSeenDay() : '',
  };
}

/** The tracker for this page load (created once). */
export function getTracker() {
  if (!tracker) {
    const url = import.meta.env.VITE_FIREBASE_API_KEY
      ? `https://firestore.googleapis.com/v1/projects/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/ev?key=${import.meta.env.VITE_FIREBASE_API_KEY}`
      : '';
    tracker = createTracker({
      send: (body) => {
        if (!url) return;
        post(url, body);
      },
      allowed: () => usageAllowed(),
      visit: visitFacts(),
    });
  }
  return tracker;
}

/** May the counts be sent on this visit? */
export function usageAllowed() {
  if (!USAGE_ON) return false;
  if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID) return false;
  if (trackingOff() || machineAddress()) return false;
  try {
    const state = JSON.parse(localStorage.getItem('amanah:v1') || 'null');
    if (state?.prefs?.usage === false) return false;
  } catch {
    /* no stored state: go on */
  }
  return true;
}

// ── The calls the app makes ────────────────────────────────────────────────────

/** Record something that happened. Does nothing when counting is off. */
export function track(kind, ...args) {
  if (!USAGE_ON) return;
  getTracker().track(kind, ...args);
}

/** Record a failure, cleaned. */
export function trackError(error, where = '') {
  if (!USAGE_ON) return;
  getTracker().trackError(error, where);
}

/** Count the page the reader is on, by its name only. */
export function trackRoute(hash = '') {
  if (!USAGE_ON) return;
  getTracker().trackRoute(hash);
}

/** Start listening: the counts are sent when the page is hidden or closed. */
export function start() {
  if (!USAGE_ON || started) return;
  started = true;
  const t = getTracker();
  if (!document.hidden) t.resume();
  const send = () => t.flush();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) send();
    else t.resume();
  });
  window.addEventListener('pagehide', send);
  window.addEventListener('hashchange', () => trackRoute(window.location.hash));
  trackRoute(window.location.hash);
}
