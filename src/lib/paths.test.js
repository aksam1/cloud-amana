import { describe, expect, it } from 'vitest';
import data from '../data/paths.json';
import hadith from '../data/hadith.json';
import { sceneById, sceneList } from './story.js';
import { FIRST_STORY } from './site.js';
import { STORY_PARTS, UNITS } from './pyramid.js';
import { STORY_STARS, UNIT_STARS } from '../components/Sky.jsx';

describe('paths through the stories', () => {
  it('every stop plays scenes that exist, in story order', () => {
    for (const path of data.paths) {
      expect(path.stops.length).toBeGreaterThan(2);
      for (const stop of path.stops) {
        const a = sceneList.indexOf(sceneById[stop.from]);
        const b = sceneList.indexOf(sceneById[stop.to || stop.from]);
        expect(a, `${path.id}: ${stop.title} starts at a real scene`).toBeGreaterThanOrEqual(0);
        expect(b, `${path.id}: ${stop.title} ends at or after its start`).toBeGreaterThanOrEqual(a);
        expect(b - a, `${path.id}: ${stop.title} stays short`).toBeLessThan(4);
        expect(stop.line).not.toMatch(/\bAllah\b/); // write "God"; the Muslim view shows Allah
      }
    }
    expect(new Set(data.paths.map((p) => p.id)).size).toBe(data.paths.length);
  });
});

describe('story first', () => {
  it("a new visitor's first scene is the first scene of the story", () => {
    expect(FIRST_STORY).toBe(sceneList[0].id);
  });
});

describe('the sky', () => {
  it('has one star for every story lesson and every pyramid lesson, each in its own place', () => {
    expect(STORY_STARS.length).toBe(STORY_PARTS.length);
    expect(UNIT_STARS.length).toBe(UNITS.length);
    const spots = [...STORY_STARS, ...UNIT_STARS].map((s) => `${Math.round(s.x / 6)}:${Math.round(s.y / 6)}`);
    expect(new Set(spots).size).toBe(spots.length);
    for (const s of [...STORY_STARS, ...UNIT_STARS]) {
      expect(s.x).toBeGreaterThan(8);
      expect(s.x).toBeLessThan(632);
      expect(s.y).toBeGreaterThan(8);
      expect(s.y).toBeLessThan(422);
    }
  });
});

describe('hadith', () => {
  it('only sahih hadith are on file, and outside Bukhari and Muslim the grader is named', () => {
    for (const [id, h] of Object.entries(hadith)) {
      if (id.startsWith('_')) continue;
      expect(h.grade, id).toMatch(/^Sahih/);
      if (!/Bukhari|Muslim/.test(h.collection)) expect(h.gradedBy, id).toBeTruthy();
    }
  });
});
