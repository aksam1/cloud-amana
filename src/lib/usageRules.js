// The rules of the usage counts: what may be counted, and the shape of the document that is sent.
//
// Everything here is pure: no network, no SDK, no browser. It can be tested on its own, and the
// runtime (usage.js) is the only thing that ever talks to the network.
//
// The rules (kept deliberately narrow):
//   · no cookie, no identifier, no address, no picture of the reader: a document holds a day, a
//     part number, the device, the language, the site the reader came from, and what happened
//   · never an answer, a reflection, a note, an email address, or anything the reader typed
//   · each visit's document is separate: nothing links one visit to another, or to a person

/** The schema version of a document. */
export const USAGE_VERSION = 1;

/** The kinds of event this site counts, and how each one is named. */
export const EVENTS = {
  'scene.start': (id) => `scene.start:${id}`,
  'scene.end': (id) => `scene.end:${id}`,
  'scene.leave': (id, beat) => `scene.leave:${id}:${beat}`,
  'lesson.done': (ch, part) => `lesson.done:${ch}/${part}`,
  question: (ch, part, index, right) => `q:${ch}/${part}:${index}:${right ? 1 : 0}`,
  'unit.start': (id) => `unit.start:${id}`,
  'unit.done': (id) => `unit.done:${id}`,
  'placement.done': () => 'placement.done',
  'path.start': (id) => `path.start:${id}`,
  'end.reached': () => 'end.reached',
  'install.prompt': () => 'install.prompt',
  'install.done': () => 'install.done',
  'offline.chunk': () => 'offline.chunk',
  'backup.export': () => 'backup.export',
  'backup.restore': () => 'backup.restore',
  'signin.done': () => 'signin.done',
  'sync.error': () => 'sync.error',
  'report.sent': () => 'report.sent',
};

/** The most events one document may hold, and the most errors. */
export const MAX_EVENTS = 120;
export const MAX_ERRORS = 5;
export const MAX_EVENT_LEN = 64;
export const MAX_ERROR_LEN = 140;
export const MAX_ROUTES = 30;
export const MAX_SECONDS = 14400; // four hours: a day is the most one part can hold
export const TTL_DAYS = 90;

/**
 * The names the events are built from. An event name is kept only if it is one of these shapes:
 * a whitelisted prefix, then only the characters a scene id, a chapter number or a unit id can hold.
 */
const SHAPES = [
  /^scene\.start:[a-z0-9-]{1,40}$/,
  /^scene\.end:[a-z0-9-]{1,40}$/,
  /^scene\.leave:[a-z0-9-]{1,40}:\d{1,3}$/,
  /^lesson\.done:\d{1,3}\/\d{1,3}$/,
  /^q:\d{1,3}\/\d{1,3}:\d{1,3}:[01]$/,
  /^unit\.(start|done):[a-z0-9-]{1,40}$/,
  /^path\.start:[a-z0-9-]{1,40}$/,
  /^placement\.done$/,
  /^end\.reached$/,
  /^install\.(prompt|done)$/,
  /^offline\.chunk$/,
  /^backup\.(export|restore)$/,
  /^signin\.done$/,
  /^sync\.error$/,
  /^report\.sent$/,
];

export const isAllowedEvent = (name) => typeof name === 'string' && name.length <= MAX_EVENT_LEN && SHAPES.some((r) => r.test(name));

/**
 * The event name for a kind and its arguments, or '' when the kind is not one this site counts.
 */
export function eventName(kind, ...args) {
  const build = EVENTS[kind];
  if (!build) return '';
  let name = '';
  try {
    name = String(build(...args));
  } catch {
    return '';
  }
  return isAllowedEvent(name) ? name : '';
}

/** The day (UTC) a document belongs to. */
export const today = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

/** The words returningSince can give (the rules accept only these). */
export const RETURNS = ['new', '1d', '2-7d', '8-30d', '31d+'];

/**
 * How long ago this browser was first here, as a plain word. The first day is kept in this browser
 * and is never sent: only the word is.
 */
export function returningSince(firstSeen, now = Date.now()) {
  if (!firstSeen) return 'new';
  const days = Math.floor((now - Date.parse(`${firstSeen}T00:00:00Z`)) / 864e5);
  if (!Number.isFinite(days) || days <= 0) return 'new';
  if (days === 1) return '1d';
  if (days <= 7) return '2-7d';
  if (days <= 30) return '8-30d';
  return '31d+';
}

/** The kind of device, from the shape of the window. */
export function deviceKind(width = 0, coarse = false) {
  if (coarse) return width >= 820 ? 'tablet' : 'phone';
  return 'desktop';
}

/**
 * The site the reader came from, as a host name only, and only when it is another site.
 * The path, the query and the reader's address are never kept.
 */
export function referrerHost(referrer, here) {
  if (!referrer) return '';
  try {
    const u = new URL(referrer);
    if (!u.hostname || u.hostname === here) return '';
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** The route the reader is on, as its name only: the first part of the address, never the whole thing. */
export function routeName(hash = '') {
  const path = String(hash).replace(/^#/, '').split('?')[0];
  const first = path.split('/').filter(Boolean)[0];
  return first ? first.slice(0, 24) : '';
}

// The view the reader chose (Muslim or curious) is never counted: it says something about a person's faith,
// which US state privacy laws treat as sensitive, and an anonymous count is not worth that.

/**
 * An error, cleaned: no addresses, no numbers that could be a code, and no more than 140
 * characters. The component that failed is kept, because that is what makes it useful.
 */
export function scrubError(error) {
  const raw = typeof error === 'string' ? error : `${error?.name || 'Error'}: ${error?.message || ''}`;
  return raw
    // a browser's own message quotes what it choked on ("Unexpected token 'I', "I prayed f"... is not valid
    // JSON"): that could be a reader's note, so quoted text goes, except a short single-quoted name ('size')
    .replace(/"[^"]*"?/g, '"…"')
    .replace(/`[^`]*`?/g, '`…`')
    .replace(/'[^']*'/g, (m) => (m.length <= 26 && !/\s/.test(m) ? m : "'…'"))
    .replace(/https?:\/\/\S+/g, 'url')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, 'email')
    .replace(/\d[\d-]{3,}/g, 'n')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_ERROR_LEN);
}

/**
 * The one document one visit-part holds. Everything is checked here, so nothing can slip past
 * by accident: the caller cannot send a field this does not know about.
 */
export function buildDoc({ now = Date.now(), part = 0, device = 'desktop', lang = 'en', ref = '', app = false, ret = 'new', seconds = 0, routes = {}, events = [], errors = [], ttlDays = TTL_DAYS } = {}) {
  const sec = Math.max(0, Math.min(MAX_SECONDS, Math.round(Number(seconds) / 10) * 10));
  const ev = (events || []).filter((e) => typeof e === 'string' && e.length > 0 && e.length <= MAX_EVENT_LEN).slice(0, MAX_EVENTS);
  const err = (errors || []).filter((e) => typeof e === 'string' && e.length > 0).map((e) => e.slice(0, MAX_ERROR_LEN)).slice(0, MAX_ERRORS);
  const pv = {};
  let n = 0;
  for (const [k, v] of Object.entries(routes || {})) {
    if (n >= MAX_ROUTES) break;
    if (!k || k.length > 24) continue;
    pv[k] = Math.max(0, Number(v) || 0);
    n += 1;
  }
  return {
    v: USAGE_VERSION,
    d: today(now),
    p: Math.max(0, Math.round(Number(part) || 0)),
    dev: ['phone', 'tablet', 'desktop'].includes(device) ? device : 'desktop',
    lang: /^[a-z]{2}$/.test(String(lang || '').slice(0, 2)) ? String(lang).slice(0, 2) : '',
    ref: String(ref || '').slice(0, 64),
    app: !!app,
    ret: RETURNS.includes(ret) ? ret : 'new',
    sec,
    pv,
    ev,
    err,
    exp: new Date(now + ttlDays * 864e5).toISOString(),
  };
}

/** The document in Firestore's typed JSON, ready to post. */
export function toFirestore(doc) {
  return {
    fields: {
      v: { integerValue: String(doc.v) },
      d: { stringValue: doc.d },
      p: { integerValue: String(doc.p) },
      dev: { stringValue: doc.dev },
      lang: { stringValue: doc.lang },
      ref: { stringValue: doc.ref },
      app: { booleanValue: doc.app },
      ret: { stringValue: doc.ret },
      sec: { integerValue: String(doc.sec) },
      pv: { mapValue: { fields: Object.fromEntries(Object.entries(doc.pv).map(([k, v]) => [k, { integerValue: String(v) }])) } },
      ev: { arrayValue: { values: doc.ev.map((e) => ({ stringValue: e })) } },
      err: { arrayValue: { values: doc.err.map((e) => ({ stringValue: e })) } },
      exp: { timestampValue: doc.exp },
    },
  };
}
