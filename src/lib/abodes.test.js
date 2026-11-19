// The Two Abodes page's rules (docs/ABODES-BLUEPRINT.md), checked on every run of `npm test`.
import { describe, expect, it } from 'vitest';
import { ABODES, ayat, cardSources, expandRef, FIRE, hadithById, PARADISE, STOPS, stopById, wayBackOf } from './abodes.js';
import { viewOf } from '../components/AbodesMonument.jsx';

const LEVELS = [...PARADISE, ...FIRE];

// Every piece of wording on the page that comes from the data (the Arabic names and the file's own note aside).
function strings(node, path = '') {
  if (typeof node === 'string') return [{ path, text: node }];
  if (Array.isArray(node)) return node.flatMap((x, i) => strings(x, `${path}[${i}]`));
  if (node && typeof node === 'object') return Object.entries(node).flatMap(([k, v]) => (k === '_note' || k === 'ar' ? [] : strings(v, path ? `${path}.${k}` : k)));
  return [];
}

describe('the seven levels on either side', () => {
  it('has seven levels in Paradise and seven in the Fire, ranked 1 to 7 from the top', () => {
    for (const side of [PARADISE, FIRE]) {
      expect(side).toHaveLength(7);
      expect(side.map((l) => l.rank)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    }
    expect(PARADISE[0].id).toBe('firdaus'); // the one placing a sahih hadith gives: the highest garden
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(14);
  });

  it('says on every level what leads there and what the Quran says of it, each with its verses', () => {
    for (const l of LEVELS) {
      for (const part of ['leads', 'says']) {
        expect(l[part]?.line, `${l.id}.${part}`).toBeTruthy();
        expect(l[part].refs?.length, `${l.id}.${part}.refs`).toBeGreaterThan(0);
      }
      expect(l.named?.length, `${l.id}.named`).toBeGreaterThan(0);
      expect(l.name && l.en, l.id).toBeTruthy();
    }
  });

  it('shows a way back on every level of the Fire (al-Hawiyah its own, 4:146)', () => {
    for (const l of FIRE) {
      const w = wayBackOf(l);
      expect(w.line, l.id).toBeTruthy();
      expect(w.refs.length, l.id).toBeGreaterThan(0);
    }
    expect(wayBackOf(FIRE[6]).refs).toEqual(['4:146']);
    expect(ABODES.paradise.mercy.hadith).toContain('bukhari-6463');
  });

  it('walks the page top to bottom: the Throne, the gardens, the ground between, the Fire', () => {
    expect(STOPS).toHaveLength(16);
    expect(STOPS[0].id).toBe('throne');
    expect(STOPS[8].id).toBe('between');
    expect(STOPS.map((s) => s.index)).toEqual(STOPS.map((_, i) => i));
  });
});

describe('sources', () => {
  const allRefs = [ABODES.opening.ref, ...LEVELS.flatMap((l) => l.named), ...STOPS.flatMap((s) => cardSources(s.id).refs)];
  const allHadith = STOPS.flatMap((s) => cardSources(s.id).hadith);

  it('has the text of every verse it cites on file (none shown as pending)', () => {
    for (const ref of allRefs) expect(ayat(ref).every(Boolean), ref).toBe(true);
  });

  it('cites only sahih hadith that are on file', () => {
    expect(allHadith.length).toBeGreaterThan(0);
    for (const id of allHadith) {
      const h = hadithById(id);
      expect(h, id).toBeTruthy();
      expect(h.grade, id).toMatch(/^Sahih/);
    }
  });

  it('never shows the same ayah or saying twice in one pop-up', () => {
    for (const s of STOPS) {
      const { refs, hadith } = cardSources(s.id);
      const each = refs.flatMap(expandRef);
      expect(new Set(each).size, `${s.id}: ${each.join(' ')}`).toBe(each.length);
      expect(new Set(hadith).size, s.id).toBe(hadith.length);
    }
  });

  it('cites the hadith that names the Throne above al-Firdaus without the narrator’s doubt (7423, not 2790)', () => {
    expect(ABODES.throne.hadith).toEqual(['bukhari-7423']);
    expect(JSON.stringify(ABODES)).not.toContain('bukhari-2790');
  });
});

describe('wording', () => {
  const lines = strings(ABODES);

  it('never speaks of a test, a score, or the reader’s own level or place', () => {
    const banned = /\b(test|tests|exam|quiz|score|scores)\b|\byou will\b|\byour level\b|\byour place\b/i;
    for (const { path, text } of lines) expect(text, path).not.toMatch(banned);
  });

  it('writes God, never Allah (the Muslim view swaps the name), and never puts a paraphrase in God’s mouth', () => {
    for (const { path, text } of lines) {
      expect(text, path).not.toMatch(/\bAllah\b/);
      expect(text, path).not.toMatch(/\b(God|He) says\b|\bsays: ["“]?(My|Me|I)\b/);
    }
  });

  it('says once that the order of the levels is from later scholars, and that only God knows where anyone will be', () => {
    expect(ABODES.orderNote).toMatch(/later scholars/);
    expect(ABODES.closing).toMatch(/Only God knows/);
  });
});

describe('the picture', () => {
  const a = 400 / 530;

  it('shows the whole diamond when nothing is chosen', () => {
    expect(viewOf(null)).toEqual([0, 0, 400, 530]);
  });

  it('frames every stop at the picture’s own shape, never closer than about twice', () => {
    for (const s of STOPS) {
      for (const side of [true, false]) {
        const [, , w, h] = viewOf(s.id, side);
        expect(w, s.id).toBeGreaterThanOrEqual(210);
        expect(w, s.id).toBeLessThanOrEqual(400);
        expect(w / h).toBeCloseTo(a, 2);
      }
    }
  });

  it('keeps each level inside the frame, in its middle beside the pop-up and in the upper part above it', () => {
    for (const l of LEVELS) {
      const [, y, , h] = viewOf(l.id, true);
      const [, yUp, , hUp] = viewOf(l.id, false);
      const course = LEVELS.indexOf(l) < 7 ? 70 + PARADISE.indexOf(l) * 30 : 310 + FIRE.indexOf(l) * 30;
      const mid = course + 15;
      expect((mid - y) / h, l.id).toBeCloseTo(0.5, 2);
      expect((mid - yUp) / hUp, l.id).toBeCloseTo(0.24, 2);
    }
  });

  it('has a stop for every id the page can open', () => {
    for (const s of STOPS) expect(stopById[s.id]).toBe(s);
  });
});
