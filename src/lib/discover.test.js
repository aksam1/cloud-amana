// The places that open as the story reaches them (src/lib/discover.js), checked on every run of `npm test`.
import { describe, expect, it } from 'vitest';
import paths from '../data/paths.json';
import { DOORS, earned, fresh, GUIDE_PLACES, newcomer, opened, placeOfRoute, unfolds } from './discover.js';
import { SCENES, scenesOf } from './sceneIndex.js';
import { getState, markFound, mergeStates, replaceState, resetProgress, validateBackup } from './store.js';

const seen = (...ids) => Object.fromEntries(ids.map((id) => [id, true]));
const NONE = { map: false, paths: false, pyramid: false, abodes: false, progress: false, explore: false };

describe('a new visitor', () => {
  it('has only Home and Story: every door, Explore and Progress are still to find', () => {
    expect(opened({})).toEqual(NONE);
    expect(opened({ seen: {}, learned: {}, units: {}, drafts: {}, placement: null, found: {}, prefs: {} })).toEqual(NONE);
    expect(fresh({})).toEqual({});
  });
});

describe('what the story opens', () => {
  it('opens the map, Explore and Progress with the first scene, and announces them', () => {
    const s = { seen: seen(SCENES[0].id) };
    expect(opened(s)).toMatchObject({ map: true, explore: true, progress: true, paths: false, pyramid: false, abodes: false });
    expect(fresh(s)).toEqual({ map: true, progress: true });
  });

  it('opens Paths at any path stop, and not before', () => {
    const stops = paths.paths.flatMap((p) => p.stops.map((x) => x.from));
    for (const id of stops) expect(earned({ seen: seen(id) }).paths, id).toBe(true);
    const before = SCENES.find((s) => !stops.includes(s.id));
    expect(earned({ seen: seen(before.id) }).paths).toBe(false);
  });

  it('opens Paths partway through the first chapter, so a newcomer meets it early', () => {
    const stops = new Set(paths.paths.flatMap((p) => p.stops.map((x) => x.from)));
    expect(scenesOf(1).some((s) => stops.has(s.id))).toBe(true);
  });

  it('opens the pyramid with a lesson, the questions, a unit or an unfinished unit', () => {
    for (const s of [{ learned: { '1:0': true } }, { placement: { path: 'x' } }, { units: { tawhid: { meter: 1 } } }, { drafts: { tawhid: { step: 1 } } }]) {
      expect(opened(s).pyramid, JSON.stringify(s)).toBe(true);
      expect(opened(s).explore).toBe(true);
      expect(opened(s).progress).toBe(true);
    }
  });

  it('opens the two abodes at the end of the first chapter, not a scene sooner', () => {
    const first = scenesOf(1).map((s) => s.id);
    expect(earned({ seen: seen(...first) }).abodes).toBe(true);
    expect(earned({ seen: seen(...first.slice(0, -1)) }).abodes).toBe(false);
  });

  it('opens the two abodes from the last chapters or the Last Day lesson too', () => {
    const late = SCENES.find((s) => s.chapter >= 20);
    expect(late).toBeTruthy();
    expect(earned({ seen: seen(late.id) }).abodes).toBe(true);
    expect(earned({ units: { lastday: { meter: 2 } } }).abodes).toBe(true);
    expect(earned({ drafts: { lastday: { step: 1 } } }).abodes).toBe(true);
  });
});

describe('never locked', () => {
  it('keeps a place open once it has been found, with no progress at all', () => {
    expect(opened({ found: { abodes: true } })).toMatchObject({ abodes: true, explore: true, map: false });
    expect(opened({ found: { explore: true } })).toMatchObject({ explore: true, map: false });
    expect(opened({ found: { progress: true } }).progress).toBe(true);
  });

  it('stops announcing a place once it has been found', () => {
    const s = { seen: seen(SCENES[0].id), found: { map: true } };
    expect(fresh(s)).toEqual({ progress: true });
  });

  it('shows every place, and announces none, when the reader turns unfolding off', () => {
    const s = { seen: seen(SCENES[0].id), prefs: { unfold: false } };
    expect(unfolds(s)).toBe(false);
    expect(Object.values(opened(s)).every(Boolean)).toBe(true);
    expect(fresh(s)).toEqual({});
    expect(unfolds({ prefs: {} })).toBe(true);
  });

  it('says how each door opens, and every door can be found by visiting it', () => {
    for (const d of DOORS) {
      expect(d.opens, d.id).toMatch(/^Opens /);
      expect(opened({ found: { [d.id]: true } })[d.id]).toBe(true);
    }
  });

  it('opens what each step of the guide points at', () => {
    for (const [step, places] of Object.entries(GUIDE_PLACES)) {
      const s = { found: Object.fromEntries(places.map((p) => [p, true])) };
      expect(opened(s)[step], step).toBe(true);
    }
  });
});

describe('which page is which place', () => {
  it('counts a visit to a door, Explore or Progress, and nothing else', () => {
    expect(placeOfRoute({ name: 'map' })).toBe('map');
    expect(placeOfRoute({ name: 'paths', id: 'dreams' })).toBe('paths');
    expect(placeOfRoute({ name: 'abodes' })).toBe('abodes');
    expect(placeOfRoute({ name: 'explore' })).toBe('explore');
    expect(placeOfRoute({ name: 'unit', id: 'tawhid' })).toBe('pyramid');
    expect(placeOfRoute({ name: 'pyramid', view: 'landing' })).toBe('pyramid');
    expect(placeOfRoute({ name: 'pyramid', view: 'placement' })).toBe('pyramid');
    expect(placeOfRoute({ name: 'pyramid', view: 'progress' })).toBe('progress');
    for (const view of ['home', 'begin', 'begun']) expect(placeOfRoute({ name: 'pyramid', view })).toBe(null);
    expect(placeOfRoute({ name: 'scene', id: 'heavens' })).toBe(null);
    expect(placeOfRoute({ name: 'story' })).toBe(null);
  });
});

describe('the found places in the store', () => {
  it('records a place once, and keeps it when the story is started again', () => {
    replaceState({});
    markFound('map', 'explore');
    markFound('map');
    expect(getState().found).toEqual({ map: true, explore: true });
    resetProgress();
    expect(getState().found).toEqual({ map: true, explore: true });
    replaceState({});
  });

  it('merges found places from two devices, and refuses a damaged list', () => {
    expect(mergeStates({ found: { map: true } }, { found: { abodes: true } }).found).toEqual({ map: true, abodes: true });
    expect(validateBackup({ app: 'amanah', version: 1, state: { found: [] } }).ok).toBe(false);
  });
});

describe('who is taken into the short guide', () => {
  it('takes a newcomer, whether the store is empty or holds only defaults and a chosen view', () => {
    expect(newcomer({})).toBe(true);
    expect(newcomer(undefined)).toBe(true);
    expect(newcomer({ seen: {}, learned: {}, prefs: { mode: 'curious', guide: null } })).toBe(true);
  });

  it('never takes anyone who finished or skipped it, or who has already begun', () => {
    expect(newcomer({ prefs: { guide: 'done' } })).toBe(false);
    expect(newcomer({ prefs: { guide: 'skipped' } })).toBe(false);
    expect(newcomer({ seen: seen(SCENES[0].id) })).toBe(false);
    expect(newcomer({ last: SCENES[0].id })).toBe(false);
    expect(newcomer({ learned: { '1:0': true } })).toBe(false);
    expect(newcomer({ units: { sabr: { meter: 0.4 } } })).toBe(false);
  });
});
