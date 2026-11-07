// Unit tests for the pyramid's engine: the rules a person relies on without seeing them.
// Run with `npm test`.
import { describe, expect, it } from 'vitest';
import { climb, CONFIG, LEVELS, placementQuestions, placementResult, playable, PLAYABLE, SCALE, unitById, unitMeter, UNITS, unitStatus } from './pyramid.js';

const answerAll = (path, pick) => Object.fromEntries(placementQuestions(path).map((q, i) => [q.id, pick(q, i)]));
const pointsOf = (q) => (q.type === 'scale' ? SCALE : q.options).map((o) => o.points);

describe('placement', () => {
  it('has 10 to 15 reflection questions for each path, as the blueprint asks', () => {
    for (const path of ['muslim', 'nonmuslim']) {
      const n = placementQuestions(path).length;
      expect(n).toBeGreaterThanOrEqual(10);
      expect(n).toBeLessThanOrEqual(15);
    }
  });

  it('never recommends a unit that cannot be started today (the dead end a new user once hit)', () => {
    // 600 random sets of answers across both paths: the first step must always be playable.
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 600; k++) {
      const path = k % 2 ? 'muslim' : 'nonmuslim';
      const r = placementResult(path, answerAll(path, (q) => { const p = pointsOf(q); return p[Math.floor(rand() * p.length)]; }));
      expect(playable(r.recommended), `recommended ${r.recommended}`).toBe(true);
    }
  });

  it('starts at the base when the base is not yet firm, and says when its lessons are not written yet', () => {
    const r = placementResult('muslim', answerAll('muslim', () => 2)); // "Sometimes" to everything
    expect(r.start).toBe('islam');
    expect(playable(r.recommended)).toBe(true);
    expect(r.startReady).toBe(PLAYABLE.some((id) => unitById[id].level === 'islam'));
  });

  it('climbs higher when answers are strong', () => {
    const r = placementResult('muslim', answerAll('muslim', (q) => Math.max(...pointsOf(q))));
    expect(r.start).toBe(LEVELS[LEVELS.length - 1].id);
  });

  it('names strongest and growing units without repeating one in both', () => {
    const r = placementResult('nonmuslim', answerAll('nonmuslim', (q, i) => pointsOf(q)[i % pointsOf(q).length]));
    for (const id of r.growing) expect(r.strongest).not.toContain(id);
  });
});

describe('unit meter', () => {
  it('weights add up to 100%', () => {
    const w = CONFIG.weights;
    expect(w.check + w.choice + w.reflection).toBeCloseTo(1);
  });
  it('is 100 for full understanding, the best choice and a reflection', () => {
    expect(unitMeter({ check: 1, choice: 1, reflection: true })).toBe(100);
  });
  it('still gives credit for reflecting, never zero for someone who took part', () => {
    expect(unitMeter({ check: 0, choice: 0, reflection: true })).toBe(Math.round(100 * CONFIG.weights.reflection));
  });
});

describe('the climb', () => {
  const empty = { seen: {}, learned: {}, units: {}, placement: null };

  it('starts at the base with nothing lit', () => {
    const c = climb(empty);
    expect(c.current).toBe('islam');
    expect(c.overall).toBe(0);
    expect(c.levels.every((l) => !l.lit)).toBe(true);
  });

  it('averages a level from its unit meters, and the overall from every unit', () => {
    const c = climb({ ...empty, units: { sabr: { meter: 86 } } });
    const ihsan = c.levels.find((l) => l.id === 'ihsan');
    expect(ihsan.progress).toBe(Math.round(86 / LEVELS.find((l) => l.id === 'ihsan').units.length));
    expect(c.overall).toBe(Math.round(86 / UNITS.length));
  });

  it('fills the Messengers stone from the chronicle lessons learned', () => {
    const c = climb({ ...empty, learned: { '1:0': true } });
    expect(c.meters.messengers).toBeGreaterThan(0);
  });

  it('keeps the placement level as where you stand until that level is lit', () => {
    const c = climb({ ...empty, placement: { start: 'iman' } });
    expect(c.current).toBe('iman');
  });

  it('marks Messengers as the chronicle and unwritten units as coming soon', () => {
    expect(unitStatus('messengers')).toBe('history');
    expect(unitStatus('sabr')).toBe('ready');
    expect(UNITS.filter((u) => unitStatus(u.id) === 'soon').every((u) => !playable(u.id))).toBe(true);
  });
});
