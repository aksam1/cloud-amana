// The Pyramid of Righteousness: data loading and the scoring engine. Pure functions over the saved state,
// so every screen computes the same numbers. The score measures understanding and reflection, never the
// person: nothing here predicts or implies anyone's standing with God.
//
// Data (all editable without code changes):
//   src/pyramid/units.json      levels → units, and chapterUnits (history chapter → related unit)
//   src/pyramid/placement.json  the reflection questions that find a starting point
//   src/pyramid/units/<id>.json one lesson path per unit (five steps)
//   src/pyramid/config.json     DEFAULT weights and thresholds
import structure from '../pyramid/units.json';
import placementData from '../pyramid/placement.json';
import config from '../pyramid/config.json';
import { chapters } from './story.js';

const unitFiles = import.meta.glob('../pyramid/units/*.json', { eager: true, import: 'default' });
export const unitContent = Object.fromEntries(Object.values(unitFiles).map((u) => [u.id, u]));

export const LEVELS = structure.levels;
export const UNITS = LEVELS.flatMap((l) => l.units.map((u) => ({ ...u, level: l.id })));
export const unitById = Object.fromEntries(UNITS.map((u) => [u.id, u]));
export const levelById = Object.fromEntries(LEVELS.map((l) => [l.id, l]));
export const CONFIG = config;
export const DISCLAIMER = config.disclaimer;

/** The app's view ('muslim' | 'curious') as the blueprint's path ('muslim' | 'nonmuslim'). */
export const pathOf = (mode) => (mode === 'curious' ? 'nonmuslim' : 'muslim');

/** Is there a lesson path to take for this unit yet? ('history' for Messengers, which is the chronicle.) */
export function unitStatus(id) {
  if (unitById[id]?.history) return 'history';
  return unitContent[id] ? 'ready' : 'soon';
}

/** The unit a history chapter links to at its end, if any. */
export const unitForChapter = (n) => {
  const id = structure.chapterUnits?.[String(n)];
  return id && unitById[id] ? unitById[id] : null;
};

// ── Placement ─────────────────────────────────────────────

export const SCALE = placementData.scale;
export const placementQuestions = (path) => placementData.questions.filter((q) => q.path === path);
const optionsOf = (q) => (q.type === 'scale' ? SCALE : q.options);
export const maxPoints = (q) => Math.max(...optionsOf(q).map((o) => o.points));

/**
 * From answers ({questionId: points}) to a starting point. Each answered unit and level gets a share
 * (0–1) of the top answer. Placement starts at the lowest level that is not yet "firm" (config.placement.firm);
 * the recommended unit is the gentlest-scoring unit there that has a lesson path ready (else any unit there).
 */
export function placementResult(path, answers) {
  const qs = placementQuestions(path).filter((q) => answers[q.id] !== undefined);
  const byUnit = {};
  for (const q of qs) {
    const u = (byUnit[q.unit] ||= { got: 0, max: 0 });
    u.got += answers[q.id];
    u.max += maxPoints(q);
  }
  const unitShare = Object.fromEntries(Object.entries(byUnit).map(([id, v]) => [id, v.max ? v.got / v.max : 0]));
  const levelShare = Object.fromEntries(
    LEVELS.map((l) => {
      const ids = l.units.map((u) => u.id).filter((id) => id in unitShare);
      return [l.id, ids.length ? ids.reduce((a, id) => a + unitShare[id], 0) / ids.length : 0];
    }),
  );
  const start = (LEVELS.find((l) => levelShare[l.id] < config.placement.firm) || LEVELS[LEVELS.length - 1]).id;
  const ranked = Object.entries(unitShare).sort((a, b) => b[1] - a[1]);
  const strongest = ranked.slice(0, 2).map(([id]) => id);
  const growing = ranked.slice(-2).reverse().map(([id]) => id).filter((id) => !strongest.includes(id));
  const inStart = ranked.filter(([id]) => unitById[id]?.level === start).reverse();
  const recommended =
    (inStart.find(([id]) => unitStatus(id) === 'ready') || inStart.find(([id]) => unitStatus(id) === 'history') || inStart[0] || [])[0] ||
    UNITS.find((u) => unitStatus(u.id) === 'ready')?.id;
  return { start, unitShare, levelShare, strongest, growing, recommended };
}

// ── Unit meters and the climb ─────────────────────────────

/**
 * A unit's meter (0–100): understanding check (DEFAULT 70%) + the choice and reflection steps (DEFAULT 15% each).
 * check: share of questions right first time; choice: the chosen option's points over the best; reflection: 1 if done.
 */
export function unitMeter({ check, choice, reflection }) {
  const w = config.weights;
  return Math.round(100 * (w.check * check + w.choice * choice + w.reflection * (reflection ? 1 : 0)));
}

// The history chronicle is the Messengers unit: its meter grows with every part of the story whose lesson is
// finished, out of every part in the chronicle (so it fills as lessons are written and learned).
const HISTORY_PARTS = chapters.reduce((n, c) => n + (c.parts?.length || 0), 0);
const historyMeter = (learned) => Math.round((100 * Object.keys(learned || {}).length) / Math.max(1, HISTORY_PARTS));

/** Every unit's meter from saved state. */
export function meters(state) {
  return Object.fromEntries(UNITS.map((u) => [u.id, u.history ? historyMeter(state.learned) : state.units?.[u.id]?.meter || 0]));
}

/** A unit counts as completed once it has been taken through to the end (any meter), or for Messengers, once full. */
export function completed(state, id) {
  if (unitById[id]?.history) return historyMeter(state.learned) >= 100;
  return !!state.units?.[id];
}

/** The whole climb: level progress (average of its unit meters), overall score, which levels are lit, and where you stand. */
export function climb(state) {
  const m = meters(state);
  const levels = LEVELS.map((l) => {
    const ids = l.units.map((u) => u.id);
    const progress = Math.round(ids.reduce((a, id) => a + m[id], 0) / ids.length);
    const done = ids.filter((id) => completed(state, id)).length;
    return { id: l.id, title: l.title, progress, done, total: ids.length, lit: done === ids.length };
  });
  const overall = Math.round(UNITS.reduce((a, u) => a + m[u.id], 0) / UNITS.length);
  // Where you stand: from your placement's starting level, the first level not yet lit.
  const startIdx = Math.max(0, LEVELS.findIndex((l) => l.id === state.placement?.start));
  const here = levels.slice(startIdx).find((l) => !l.lit) || levels[levels.length - 1];
  const peak = levels.every((l) => l.lit);
  return { meters: m, levels, overall, current: here.id, currentProgress: here.progress, peak };
}
