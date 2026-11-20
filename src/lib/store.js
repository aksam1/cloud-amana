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
  journal: {}, // "chapter:part" or "unit:<id>" → the reader's own reflection; never leaves this browser
  journalAt: {}, // the same keys → when that reflection was written (ISO), so two devices can be merged
  // The pyramid (src/lib/pyramid.js): placement answers and result, and each unit's best meter.
  placement: null, // { path, answers: {questionId: points}, at: ISO date, start: levelId }
  units: {}, // unitId → { meter, check, choice, reflection, attempts, at }
  drafts: {}, // unitId → an unfinished attempt { step, choice, firsts, at }, so leaving never loses a place
  recent: null, // the last thing opened, for "Continue where you left off": { kind: 'unit'|'scene', id, title, at }
  found: {}, // places the reader has come across (src/lib/discover.js): placeId → true; a place found stays open
  // mode: 'muslim' | 'curious' | null (not chosen); taps: the soft click on buttons; hints: the first-visit
  // pointers a reader has closed (hintId → true), so each one shows once
  // usage: the reader's own switch for the anonymous counts (off when set to false; the browser's own
  // Global Privacy Control or Do Not Track also stops them, whatever this says)
  // unfold: places open as the story reaches them (false shows every place at once)
  prefs: { sound: false, auto: true, chronicle: true, mode: null, installAsked: false, taps: true, hints: {}, usage: true, unfold: true },
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
/** Close a first-visit pointer for good ('all' closes every one, as "Don't show tips" does). */
export const dismissHint = (id) => update((s) => void (s.prefs.hints = { ...(s.prefs.hints || {}), [id]: true }));
/** Places the reader has now come across. Writes only when one is new, so visiting a page costs nothing. */
export function markFound(...ids) {
  const add = ids.filter((id) => id && !state.found?.[id]);
  if (!add.length) return;
  update((s) => {
    s.found = { ...(s.found || {}) };
    for (const id of add) s.found[id] = true;
  });
}
export const lightNode = (id) => update((s) => void (s.lit[id] = true));
export const setLast = (id, title) =>
  update((s) => {
    s.last = id;
    s.recent = { kind: 'scene', id, title: title || id, at: new Date().toISOString() };
  });
export const saveDraft = (unitId, draft, title) =>
  update((s) => {
    s.drafts[unitId] = { ...draft, at: new Date().toISOString() };
    s.recent = { kind: 'unit', id: unitId, title: title || unitId, at: new Date().toISOString() };
  });
export const clearDraft = (unitId) => update((s) => void delete s.drafts[unitId]);
export const markLearned = (key) => update((s) => void (s.learned[key] = true));
export const markAnswered = (key) => update((s) => void (s.answers[key] = true));
// A reflection is written with the time it was written, so two devices can be merged without guessing.
export const saveJournal = (key, text) =>
  update((s) => {
    s.journal[key] = text;
    s.journalAt[key] = new Date().toISOString();
  });
export const savePlacement = (p) => update((s) => void (s.placement = p));
// A retaken unit only ever raises its meter: the best attempt is kept, and attempts are counted.
export const saveUnit = (id, r) =>
  update((s) => {
    const prev = s.units[id];
    s.units[id] = prev && prev.meter > r.meter ? { ...prev, attempts: prev.attempts + 1 } : { ...r, attempts: (prev?.attempts || 0) + 1 };
    delete s.drafts[id];
  });
/** "Delete my data": everything this app stored in this browser, preferences and journal included. */
export function deleteAllData() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing stored */
  }
  state = structuredClone(DEFAULTS);
  subs.forEach((f) => f());
}
// Starting again keeps preferences and the reader's private journal; only progress is cleared.
// (The pyramid's placement and unit meters are kept too: this restarts the chronicle only. The places already
// found stay open: the reader knows their way around.)
export const resetProgress = () => update((s) => ({ ...structuredClone(DEFAULTS), prefs: s.prefs, journal: s.journal, journalAt: s.journalAt, placement: s.placement, units: s.units, drafts: s.drafts, found: s.found || {} }));

// ── Backup, restore and merge ─────────────────────────────────────────────────
//
// The reader can save their progress to a file and bring it back, on this device or on another one.
// The functions below are pure, so the same rules can be used now (restore from a file) and later
// (sync between devices): they never touch storage, and they never throw on rubbish input.

export const BACKUP_APP = 'amanah';
export const BACKUP_VERSION = 1;

/** The progress on this device, as a backup file's contents. */
export function exportState() {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), state: structuredClone(getState()) };
}

/** Plain counts of what a backup holds, for the reader to read before choosing what to do with it. */
export function countsOf(state) {
  const s = state && typeof state === 'object' ? state : {};
  const n = (o) => (o && typeof o === 'object' ? Object.keys(o).length : 0);
  const units = s.units && typeof s.units === 'object' ? Object.values(s.units) : [];
  return {
    scenes: n(s.seen),
    lessons: n(s.learned),
    notes: Object.entries(s.journal || {}).filter(([, t]) => typeof t === 'string' && t.trim()).length,
    units: units.length,
    answers: n(s.answers),
  };
}

/**
 * Is this a backup file Amanah can read? `{ ok, error?, counts }`. Never throws: a broken file is
 * answered with a plain reason, so the page can say what is wrong.
 */
export function validateBackup(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, error: 'This file is not an Amanah backup.' };
  if (obj.app !== BACKUP_APP) return { ok: false, error: 'This file was not made by Amanah.' };
  if (typeof obj.version !== 'number' || !Number.isFinite(obj.version)) return { ok: false, error: 'This backup has no readable version number.' };
  if (obj.version > BACKUP_VERSION) return { ok: false, error: 'This backup is from a newer version of Amanah. Update the app first.' };
  const state = obj.state;
  if (!state || typeof state !== 'object' || Array.isArray(state)) return { ok: false, error: 'This backup has no progress in it.' };
  for (const k of ['seen', 'lit', 'learned', 'answers', 'journal', 'journalAt', 'units', 'drafts', 'found']) {
    if (state[k] !== undefined && (typeof state[k] !== 'object' || state[k] === null || Array.isArray(state[k]))) {
      return { ok: false, error: `This backup is damaged (${k} is not readable).` };
    }
  }
  if (state.prefs !== undefined && (typeof state.prefs !== 'object' || state.prefs === null || Array.isArray(state.prefs))) {
    return { ok: false, error: 'This backup is damaged (preferences are not readable).' };
  }
  return { ok: true, counts: countsOf(state) };
}

// ── The merge rules ───────────────────────────────────────────────────────────
//  · seen, lit, learned, answers, found: a union (true wins)
//  · units: the higher meter wins; a tie goes to the newer one; attempts: the larger count
//  · journal: the newer text wins; without timestamps the local one is kept and the other follows it
//  · placement, recent: the newer one wins
//  · drafts: the newer one wins, unless the unit is already finished in the merged units
//  · last: follows the winning recent, when that is a scene
//  · prefs: the device's own wins, except the view (mode), which the device's own takes if it has one
//  · keys from a newer app version are kept, not dropped

const asTime = (v) => {
  const t = Date.parse(v || '');
  return Number.isFinite(t) ? t : 0;
};
const newer = (a, b) => asTime(a?.at) >= asTime(b?.at); // the newer of two timestamps (ties: the first)

/** The truthy union of two flag maps (true wins). */
const unionFlags = (a = {}, b = {}) => {
  const out = {};
  for (const k of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) {
    const va = a?.[k];
    const vb = b?.[k];
    if (va === true || vb === true) out[k] = true;
    else if (va !== undefined) out[k] = va;
    else out[k] = vb;
  }
  return out;
};

/** Two notes on the same key: the newer text wins; without timestamps, both are kept. */
function mergeNote(localText, localAt, otherText, otherAt) {
  const lt = localText ?? '';
  const ot = otherText ?? '';
  if (lt === ot) return { text: lt, at: localAt || otherAt || null };
  if (lt && !ot) return { text: lt, at: localAt || null };
  if (ot && !lt) return { text: ot, at: otherAt || null };
  const la = asTime(localAt);
  const oa = asTime(otherAt);
  if (la && oa) return la >= oa ? { text: lt, at: localAt } : { text: ot, at: otherAt };
  if (la && !oa) return { text: lt, at: localAt };
  if (oa && !la) return { text: ot, at: otherAt };
  // Neither side says when it was written. If one already holds the other (an earlier merge of these
  // two), keep the longer, so merging the same backup again changes nothing. Otherwise keep the local
  // note and add the other one below it.
  if (lt.includes(ot)) return { text: lt, at: null };
  if (ot.includes(lt)) return { text: ot, at: null };
  return { text: `${lt}\n\n(from another device)\n${ot}`, at: null };
}

/**
 * Combine two states into one. Neither argument is changed.
 * `local` is this device's state, `incoming` the one being brought in (a backup file, or another device).
 */
export function mergeStates(local, incoming) {
  const l = local && typeof local === 'object' ? local : {};
  const i = incoming && typeof incoming === 'object' ? incoming : {};
  const out = { ...l };
  // keys this version of the app knows nothing about are kept, not dropped (a newer app's data)
  for (const [k, v] of Object.entries(i)) if (!(k in out)) out[k] = v;

  // the flags: a union, true wins
  out.seen = unionFlags(l.seen, i.seen);
  out.lit = unionFlags(l.lit, i.lit);
  out.learned = unionFlags(l.learned, i.learned);
  out.answers = unionFlags(l.answers, i.answers);
  out.found = unionFlags(l.found, i.found);

  // units: the higher meter is kept; a tie goes to the newer; attempts: the larger count
  const units = { ...(i.units || {}) };
  for (const [id, u] of Object.entries(l.units || {})) {
    const other = units[id];
    if (!other) {
      units[id] = u;
      continue;
    }
    const lm = Number(u?.meter) || 0;
    const om = Number(other?.meter) || 0;
    let best = other;
    if (lm > om) best = u;
    else if (lm === om) best = newer(u, other) ? u : other;
    units[id] = { ...best, attempts: Math.max(Number(u?.attempts) || 0, Number(other?.attempts) || 0) };
  }
  out.units = units;

  // journal: per key, the newer text wins
  const journal = { ...(i.journal || {}) };
  const journalAt = { ...(i.journalAt || {}) };
  for (const [key, text] of Object.entries(l.journal || {})) {
    const other = i.journal?.[key];
    if (other === undefined) {
      journal[key] = text;
      if (l.journalAt?.[key]) journalAt[key] = l.journalAt[key];
      continue;
    }
    const merged = mergeNote(text, l.journalAt?.[key], other, i.journalAt?.[key]);
    journal[key] = merged.text;
    if (merged.at) journalAt[key] = merged.at;
    else delete journalAt[key];
  }
  out.journal = journal;
  out.journalAt = journalAt;

  // placement and recent: the newer one wins
  out.placement = newer(l.placement, i.placement) ? (l.placement ?? i.placement ?? null) : (i.placement ?? l.placement ?? null);
  if (!l.placement && !i.placement) out.placement = null;
  if (!l.recent && !i.recent) out.recent = null;
  else out.recent = newer(l.recent, i.recent) ? l.recent : i.recent;

  // drafts: the newer one wins, unless the unit is finished in the merged units, after the draft
  const drafts = {};
  for (const [id, d] of Object.entries({ ...(l.drafts || {}), ...(i.drafts || {}) })) {
    const ld = l.drafts?.[id];
    const idr = i.drafts?.[id];
    const chosen = ld && idr ? (newer(ld, idr) ? ld : idr) : (ld || idr);
    const finished = units[id];
    if (finished && asTime(finished.at) > asTime(chosen?.at)) continue; // the unit was finished later: the draft is dead
    drafts[id] = chosen;
  }
  out.drafts = drafts;

  // last: follows the winning recent, when that is a scene
  const rec = out.recent;
  out.last = rec && rec.kind === 'scene' ? rec.id : (l.last ?? null);

  // preferences belong to the device, except the view: the device's own wins if it has one
  out.prefs = { ...(i.prefs || {}), ...(l.prefs || {}) };
  if (!l.prefs?.mode && i.prefs?.mode) out.prefs.mode = i.prefs.mode;

  return out;
}

/** Put a validated state in place (restore). Keeps the same key, so old saves still load. */
export function replaceState(next) {
  const clean = { ...structuredClone(DEFAULTS), ...(next || {}) };
  clean.prefs = { ...DEFAULTS.prefs, ...(next?.prefs || {}) };
  for (const k of ['seen', 'lit', 'learned', 'answers', 'journal', 'journalAt', 'units', 'drafts', 'found']) {
    if (!clean[k] || typeof clean[k] !== 'object' || Array.isArray(clean[k])) clean[k] = {};
  }
  update(() => clean);
  return clean;
}
