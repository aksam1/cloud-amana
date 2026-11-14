import { describe, expect, it } from 'vitest';
import { buildWorld, fillDates, parseDate } from './mapWorld.js';
import timeline from '../story/timeline.json';

describe('the map of time', () => {
  it('reads the dates a person would say', () => {
    expect(parseDate('570 CE')).toBe(2026 - 570);
    expect(parseDate('≈ 2000 BCE')).toBe(2026 + 2000);
    expect(parseDate('≈ 2000–3000 BCE')).toBe(2026 + 2500);
    expect(parseDate('≈ 4.54 billion years')).toBe(4.54e9);
    expect(parseDate('Unknown')).toBeNull();
    expect(parseDate('Times uncertain')).toBeNull();
  });

  it('fills the undated nodes between the dated ones', () => {
    const bp = fillDates(timeline.nodes);
    expect(bp.every((v) => Number.isFinite(v))).toBe(true);
    // the jinn sit between the Earth and Adam
    const byId = Object.fromEntries(timeline.nodes.map((n, i) => [n.id, bp[i]]));
    expect(byId.jinn).toBeGreaterThan(byId.adam);
    expect(byId.jinn).toBeLessThan(byId.earth);
    // humanity comes after the descent, so it is nearer in time than Adam;
    // Idris is nearer still, and Nuh nearer than Idris
    expect(byId.humanity).toBeLessThan(byId.adam);
    expect(byId.idris).toBeLessThan(byId.humanity);
    expect(byId.nuh).toBeLessThan(byId.idris);
  });

  it('keeps the order of the timeline', () => {
    const world = buildWorld(timeline);
    expect(world.nodes.map((n) => n.id)).toEqual(timeline.nodes.map((n) => n.id));
  });

  it('descends: every node is lower than the one before it', () => {
    const world = buildWorld(timeline);
    for (let i = 1; i < world.nodes.length; i++) {
      expect(world.nodes[i].y).toBeGreaterThan(world.nodes[i - 1].y);
    }
  });

  it('gives the early ages a longer fall than the later ones', () => {
    const world = buildWorld(timeline);
    const gap = (a, b) => world.byId[b].y - world.byId[a].y;
    // the Creation to Adam is longer than any two prophets
    expect(gap('earth', 'adam')).toBeGreaterThan(gap('ibrahim', 'lut'));
    expect(gap('earth', 'adam')).toBeGreaterThan(gap('musa', 'harun'));
  });

  it('has a segment for every consecutive pair, or the arrival ceremony breaks', () => {
    const world = buildWorld(timeline);
    expect(world.segs.length).toBe(timeline.nodes.length - 1);
    for (let i = 1; i < world.nodes.length; i++) {
      expect(world.segs[i - 1].from).toBe(timeline.nodes[i - 1].id);
      expect(world.segs[i - 1].to).toBe(timeline.nodes[i].id);
      expect(world.segs[i - 1].d).toMatch(/^M/);
    }
  });

  it('keeps every node inside its era’s band', () => {
    const world = buildWorld(timeline);
    for (const n of world.nodes) {
      const band = world.regions.find((g) => g.id === n.era);
      expect(band).toBeTruthy();
      expect(n.y).toBeGreaterThanOrEqual(band.y0);
      expect(n.y).toBeLessThanOrEqual(band.y1);
    }
  });

  it('is a finite world with a thread that fits', () => {
    const world = buildWorld(timeline);
    expect(Number.isFinite(world.W)).toBe(true);
    expect(Number.isFinite(world.H)).toBe(true);
    expect(world.W).toBeGreaterThan(0);
    expect(world.H).toBeGreaterThan(0);
    for (const n of world.nodes) {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
      expect(n.x).toBeGreaterThan(0);
      expect(n.x).toBeLessThan(world.W);
      expect(n.y).toBeGreaterThan(0);
      expect(n.y).toBeLessThan(world.H);
    }
  });

  it('draws the thread from the first seal to the last', () => {
    const world = buildWorld(timeline);
    const first = world.nodes[0];
    const last = world.nodes.at(-1);
    expect(first.y).toBeLessThan(last.y);
    // the thread starts at the first seal: the path's first point is its position
    const start = world.segs[0].d.match(/^M([\d.-]+),([\d.-]+)/);
    expect(Number(start[1])).toBeCloseTo(first.x, 1);
    expect(Number(start[2])).toBeCloseTo(first.y, 1);
  });
});
