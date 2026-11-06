// Progress + preferences, persisted per browser. Every storage access is guarded:
// private windows and blocked storage must still give a working (if forgetful) app.
import { useSyncExternalStore } from 'react';

const KEY = 'amanah:v1';
const DEFAULTS = {
  seen: {}, // sceneId → true once its last beat has played
  lit: { earth: true }, // map nodes the story has reached
  last: null, // last scene opened
  learned: {}, // "chapter:part" → true once that part's lesson is finished
  answers: {}, // "chapter:part:question" → true once answered right (for review on the next visit)
  journal: {}, // "chapter:part" → the reader's own reflection; never leaves this browser
  prefs: { sound: false, auto: true, chronicle: true, mode: null }, // mode: 'muslim' | 'curious' | null (not chosen)
};

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw) return structuredClone(DEFAULTS);
    return { ...structuredClone(DEFAULTS), ...raw, prefs: { ...DEFAULTS.prefs, ...raw.prefs } };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

let state = load();
const subs = new Set();

export function getState() {
  return state;
}

export function update(fn) {
  const draft = structuredClone(state);
  state = fn(draft) || draft;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: keep in memory only */
  }
  subs.forEach((f) => f());
}

function subscribe(f) {
  subs.add(f);
  return () => subs.delete(f);
}

export function useStore(select = (s) => s) {
  return select(useSyncExternalStore(subscribe, getState));
}

export const setPref = (k, v) => update((s) => void (s.prefs[k] = v));
export const markSeen = (id) => update((s) => void (s.seen[id] = true));
export const lightNode = (id) => update((s) => void (s.lit[id] = true));
export const setLast = (id) => update((s) => void (s.last = id));
export const markLearned = (key) => update((s) => void (s.learned[key] = true));
export const markAnswered = (key) => update((s) => void (s.answers[key] = true));
export const saveJournal = (key, text) => update((s) => void (s.journal[key] = text));
// Starting again keeps preferences and the reader's private journal; only progress is cleared.
export const resetProgress = () => update((s) => ({ ...structuredClone(DEFAULTS), prefs: s.prefs, journal: s.journal }));
