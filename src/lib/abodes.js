import data from '../pyramid/abodes.json';
import ayahs from '../data/ayahs.json';
import hadith from '../data/hadith.json';

/*
 * The Two Abodes page's data, read from src/pyramid/abodes.json (plan and rules: docs/ABODES-BLUEPRINT.md).
 * This module stays small on purpose: it reads ayahs.json directly instead of src/lib/story.js (about 1 MB).
 */

export const ABODES = data;

/** "23:1-9" → ["23:1", …, "23:9"]. The same rule as story.js, kept here so this page never loads the story. */
export function expandRef(ref) {
  const m = /^(\d+):(\d+)(?:-(\d+))?$/.exec(String(ref));
  if (!m) return [String(ref)];
  const [, s, a, b] = m;
  if (!b) return [`${s}:${a}`];
  return Array.from({ length: +b - +a + 1 }, (_, i) => `${s}:${+a + i}`);
}

/** The ayat of a ref, each { surah, ar, en } or null while it is not on file. */
export const ayat = (ref) => expandRef(ref).map((r) => ayahs[r] || null);
export const hadithById = (id) => hadith[id] || null;

const byRank = (levels) => [...levels].sort((a, b) => a.rank - b.rank);
export const PARADISE = byRank(data.paradise.levels);
export const FIRE = byRank(data.fire.levels);

/**
 * Every stop on the page, top to bottom: the Throne, the gardens from the highest down, the ground between
 * the two, then the Fire's levels downwards. ↑ and ↓ in the pop-up walk this list.
 */
export const STOPS = [
  { id: 'throne', side: 'throne', name: data.throne.title, entry: data.throne },
  ...PARADISE.map((l) => ({ id: l.id, side: 'paradise', name: l.name, entry: l })),
  { id: 'between', side: 'between', name: data.between.title, entry: data.between },
  ...FIRE.map((l) => ({ id: l.id, side: 'fire', name: l.name, entry: l })),
].map((s, index) => ({ ...s, index }));

export const stopById = Object.fromEntries(STOPS.map((s) => [s.id, s]));

/** The way back shown on a Fire level: its own (al-Hawiyah's 4:146), or the one every Fire level carries. */
export const wayBackOf = (level) => level.wayBack || data.fire.wayBack;

/** Every verse ref and hadith id one pop-up shows, in order (a ref must never appear twice on one card). */
export function cardSources(id) {
  const s = stopById[id];
  if (!s) return { refs: [], hadith: [] };
  const e = s.entry;
  const refs = [];
  const hs = [];
  const add = (x) => {
    if (!x) return;
    refs.push(...(x.refs || []));
    hs.push(...(x.hadith || []));
  };
  if (s.side === 'throne') {
    add(e);
    refs.push(e.note.ref);
  } else if (s.side === 'between') {
    e.items.forEach(add);
  } else {
    add(e.leads);
    add(e.says);
    if (s.side === 'paradise') add(data.paradise.mercy);
    else add(wayBackOf(e));
  }
  return { refs, hadith: hs };
}
