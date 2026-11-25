// The guide through everything, in order (src/lib/journey.js), checked on every run of `npm test`.
import { describe, expect, it } from 'vitest';
import { aheadOfGuide, closeGuide, guiding, isDone, nextHref, nextStep, resumeGuide, skipStep, stepAfter, stepCopy, stepHref, stepName, STEPS, stepsAfterLesson, stepsAround, stopAfter } from './journey.js';
import { playable, STORY_PARTS, unitById } from './pyramid.js';
import { SCENES, sceneAt, storyResume } from './sceneIndex.js';
import { getState, mergeStates, replaceState, resetProgress, validateBackup } from './store.js';

const seen = (...ids) => Object.fromEntries(ids.map((id) => [id, true]));
const step = (id) => STEPS.find((s) => s.id === id);
const at = (id) => STEPS.findIndex((s) => s.id === id);
const begun = { prefs: { mode: 'curious', guide: 'done' } };

describe('the steps', () => {
  it('start with the view and how Amanah works, then the first part of the story', () => {
    expect(STEPS.slice(0, 3).map((s) => s.id)).toEqual(['view', 'tour', `part:${STORY_PARTS[0].key}`]);
  });

  it('have one id each', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(STEPS.length);
  });

  it('cover every scene once, in story order', () => {
    const scenes = STEPS.filter((s) => s.kind === 'part').flatMap((s) => s.scenes);
    expect(scenes).toEqual(SCENES.map((s) => s.id));
  });

  it('follow each part with its lesson', () => {
    for (const p of STORY_PARTS) expect(at(`lesson:${p.key}`), p.key).toBe(at(`part:${p.key}`) + 1);
  });

  it('give every written unit a place, after the lesson of the part it replays', () => {
    const units = STEPS.filter((s) => s.kind === 'unit');
    expect(units.length).toBeGreaterThan(0);
    for (const u of units) {
      expect(playable(u.unit), u.unit).toBe(true);
      expect(unitById[u.unit].history, u.unit).toBeFalsy();
      // the nearest lesson before it is the part the unit belongs to
      const lesson = STEPS.slice(0, at(u.id)).findLast((s) => s.kind === 'lesson');
      expect(at(u.id)).toBeGreaterThan(at(lesson.id));
    }
    expect(units.some((u) => u.unit === 'angels')).toBe(true);
  });

  it('show each place once, the pyramid before its first lesson', () => {
    const places = STEPS.filter((s) => s.kind === 'place').map((s) => s.place);
    expect([...places].sort()).toEqual(['abodes', 'map', 'paths', 'pyramid']);
    expect(at('place:pyramid')).toBeLessThan(STEPS.findIndex((s) => s.kind === 'unit'));
  });

  it('never send anyone to a scene that does not exist or a unit still being written', () => {
    for (const s of STEPS) {
      const href = stepHref(s, {});
      if (s.kind === 'part') expect(sceneAt[href.split('/')[2]], s.id).toBeTruthy();
      if (s.kind === 'unit') expect(playable(s.unit)).toBe(true);
    }
  });

  it('say what each step is, in plain words', () => {
    for (const s of STEPS) {
      const c = stepCopy(s, {});
      expect(c.action && c.title && c.line, s.id).toBeTruthy();
      expect(`${c.title} ${c.line}`, s.id).not.toMatch(/ · /);
    }
  });
});

describe('the next step', () => {
  it('is the view for a new visitor, then how Amanah works, then the first scene', () => {
    expect(nextStep({}).id).toBe('view');
    expect(nextStep({ prefs: { mode: 'muslim' } }).id).toBe('tour');
    expect(nextHref(begun)).toBe(`/scene/${SCENES[0].id}`);
  });

  it('never sends a reader who has already begun back to how Amanah works', () => {
    const old = { prefs: { mode: 'curious', guide: null } };
    expect(nextHref({ ...old, seen: seen(SCENES[0].id), last: SCENES[0].id })).toBe(`/scene/${SCENES[1].id}`);
    for (const s of [{ last: SCENES[0].id }, { learned: { '1:0': true } }, { units: { sabr: { meter: 0.4 } } }]) expect(nextStep({ ...old, ...s }).id).not.toBe('tour');
  });

  it('never asks a reader who began without choosing a view to begin again', () => {
    const s = { prefs: {}, seen: seen(SCENES[0].id) };
    expect(nextHref(s)).toBe(`/scene/${SCENES[1].id}`);
    // only looking at how Amanah works is not beginning: the view still comes first
    expect(nextStep({ prefs: { guide: 'skipped' } }).id).toBe('view');
  });

  it('picks a part up at its first unwatched scene', () => {
    const s = { ...begun, seen: seen(SCENES[0].id, SCENES[1].id) };
    expect(nextStep(s).kind).toBe('part');
    expect(nextHref(s)).toBe(`/scene/${SCENES[2].id}`);
    expect(stepCopy(nextStep(s), s).action).toBe('Continue the story');
  });

  it('offers the lesson once a part is watched, and comes back here after it', () => {
    const first = step(`part:${STORY_PARTS[0].key}`);
    const s = { ...begun, seen: seen(...first.scenes) };
    expect(nextStep(s).id).toBe(`lesson:${STORY_PARTS[0].key}`);
    expect(nextHref(s)).toMatch(/\?then=%2Fnext$/);
  });

  it('counts a step done however the reader did it, and passes it by', () => {
    const first = step(`part:${STORY_PARTS[0].key}`);
    const s = { ...begun, seen: seen(...first.scenes), learned: { [STORY_PARTS[0].key]: true }, found: { pyramid: true } };
    const after = nextStep(s);
    expect(after.kind).toBe('unit');
    expect(isDone(after, { ...s, units: { [after.unit]: { meter: 50 } } })).toBe(true);
  });

  it('is nothing once every step is done', () => {
    const all = {
      prefs: { mode: 'muslim', guide: 'done' },
      seen: seen(...SCENES.map((s) => s.id)),
      learned: Object.fromEntries(STORY_PARTS.map((p) => [p.key, true])),
      units: Object.fromEntries(STEPS.filter((s) => s.kind === 'unit').map((s) => [s.unit, { meter: 1 }])),
      found: { map: true, paths: true, pyramid: true, abodes: true },
    };
    expect(nextStep(all)).toBe(null);
    expect(nextHref(all)).toBe('/end');
  });

  it('moves on from where the guide stands, never back to a step it was skipped past', () => {
    const lesson = `lesson:${STORY_PARTS[0].key}`;
    const first = step(`part:${STORY_PARTS[0].key}`);
    const s = { ...begun, seen: seen(...first.scenes), journey: { at: STEPS[at(lesson) + 1].id } };
    expect(nextStep(s).id).not.toBe(lesson);
    expect(at(nextStep(s).id)).toBeGreaterThan(at(lesson));
    expect(stepAfter(s, step(lesson))).toEqual(nextStep(s));
  });
});

describe('the line of steps', () => {
  const ids = (state, n) => stepsAround(state, n).map(({ step: s, is }) => `${is} ${s.id}`);
  const first = STEPS.find((s) => s.kind === 'part');

  it('shows a new visitor the first step and the two after it', () => {
    expect(ids({})).toEqual(['now view', 'next tour', `next ${first.id}`]);
  });

  it('shows the step just done, the one the reader is at, and the next', () => {
    expect(ids({ ...begun, seen: seen(first.scenes[0]) })).toEqual(['done tour', `now ${first.id}`, `next lesson:${first.key}`]);
    expect(ids({ ...begun, seen: seen(...first.scenes) })[0]).toBe(`done ${first.id}`);
  });

  it('never shows a step the reader skipped as done, nor one they have done as still to come', () => {
    const lesson = `lesson:${first.key}`;
    const skipped = { ...begun, seen: seen(...first.scenes), journey: { at: STEPS[at(lesson) + 1].id } };
    expect(ids(skipped)[0]).toBe(`done ${first.id}`); // not the lesson, passed by
    const next = STEPS.filter((s) => s.kind === 'part')[1];
    const ran = { ...begun, seen: seen(...first.scenes, ...next.scenes), learned: { [first.key]: true } };
    expect(ids(ran, 9)).not.toContain(`next ${next.id}`);
  });

  it('ends with the journey', () => {
    expect(stepsAround({ ...begun, journey: { at: 'end' } })).toEqual([]);
  });

  it('names every step in a few plain words', () => {
    for (const s of STEPS) {
      const name = stepName(s);
      expect(name, s.id).toBeTruthy();
      expect(name.length, name).toBeLessThan(60);
      expect(name, s.id).not.toMatch(/ · /);
    }
  });

  it('leaves no step off the Journey page: the first two, each part, its lesson, and all that follows it', () => {
    const page = [...STEPS.slice(0, 2), ...STORY_PARTS.flatMap((p) => [step(`part:${p.key}`), step(`lesson:${p.key}`), ...stepsAfterLesson(p.key)])];
    expect(page.map((s) => s.id)).toEqual(STEPS.map((s) => s.id));
  });
});

describe('closing and picking up the guide', () => {
  it('is on until the reader closes it, and waits where it was', () => {
    replaceState({ prefs: { mode: 'muslim', guide: 'done' } });
    expect(guiding(getState())).toBe(true);
    const before = nextStep(getState()).id;
    closeGuide();
    expect(guiding(getState())).toBe(false);
    resumeGuide();
    expect(guiding(getState())).toBe(true);
    expect(nextStep(getState()).id).toBe(before);
  });

  it('moves one step on when a step is skipped', () => {
    replaceState({ prefs: { mode: 'muslim', guide: 'done' } });
    const lesson = step(`lesson:${STORY_PARTS[0].key}`);
    skipStep(lesson);
    expect(getState().journey.at).toBe(STEPS[at(lesson.id) + 1].id);
    skipStep(STEPS.at(-1));
    expect(nextStep(getState())).toBe(null);
  });

  it('offers to jump to where the reader has got to in the story, when that is further on', () => {
    const later = STEPS.filter((s) => s.kind === 'part')[3];
    const s = { ...begun, last: later.scenes[0], seen: {} };
    expect(aheadOfGuide(s)?.id).toBe(later.id);
    expect(aheadOfGuide(begun)).toBe(null); // nothing watched: nowhere to jump to
  });

  it('says nothing of being ahead when the reader waits at the very part the guide comes to next', () => {
    const [one, two] = STEPS.filter((s) => s.kind === 'part');
    const s = { ...begun, last: one.scenes.at(-1), seen: seen(...one.scenes), learned: { [one.key]: true } };
    expect(nextStep(s).kind).not.toBe('part'); // a place or a pyramid lesson comes first
    expect(storyResume(s).id).toBe(two.scenes[0]);
    expect(aheadOfGuide(s)).toBe(null);
  });

  it('goes back to its first step when the story starts again, and stays closed if it was closed', () => {
    replaceState({ prefs: { mode: 'muslim', guide: 'done' }, journey: { at: STEPS[20].id, off: true } });
    resetProgress();
    expect(getState().journey).toEqual({ at: null, off: true });
  });

  it('travels in a backup, and the device keeps its own on a merge', () => {
    expect(validateBackup({ app: 'amanah', version: 1, state: { journey: 'x' } }).ok).toBe(false);
    expect(validateBackup({ app: 'amanah', version: 1, state: { journey: { at: 'tour', off: false } } }).ok).toBe(true);
    expect(mergeStates({ journey: { at: 'tour', off: true } }, { journey: { at: 'view', off: false } }).journey).toEqual({ at: 'tour', off: true });
    expect(mergeStates({}, { journey: { at: 'view', off: false } }).journey).toEqual({ at: 'view', off: false });
  });
});

describe("the guide's stop at the end of a scene", () => {
  const first = STEPS.find((s) => s.kind === 'part');
  const before = (id) => first.scenes.slice(0, first.scenes.indexOf(id));
  const after = (id) => first.scenes[first.scenes.indexOf(id) + 1];

  it("is nothing mid-part, where the story's own next scene is the guide's way on", () => {
    const id = first.scenes[0];
    expect(stopAfter({ ...begun, seen: {} }, id, after(id))).toBeNull();
  });

  it("is the part's lesson at the part's last scene", () => {
    const id = first.scenes.at(-1);
    const state = { ...begun, seen: seen(...before(id)) };
    expect(stopAfter(state, id, SCENES[SCENES.findIndex((s) => s.id === id) + 1]?.id)?.id).toBe(`lesson:${first.key}`);
  });

  it('goes back for a scene of the part that was passed by', () => {
    const [skipped, ...rest] = first.scenes;
    if (!rest.length) return;
    const id = rest.at(-1);
    const state = { ...begun, seen: seen(...rest.slice(0, -1)) };
    expect(stopAfter(state, id, null)?.id).toBe(first.id);
    expect(stepHref(first, { ...state, seen: { ...state.seen, [id]: true } })).toBe(`/scene/${skipped}`);
  });

  it('is nothing with the guide closed, or for a scene away from where the guide stands', () => {
    const id = first.scenes.at(-1);
    const state = { ...begun, seen: seen(...before(id)) };
    expect(stopAfter({ ...state, journey: { off: true } }, id, null)).toBeNull();
    const later = STEPS.filter((s) => s.kind === 'part')[3];
    expect(stopAfter({ ...begun, seen: {} }, later.scenes.at(-1), null)).toBeNull();
  });
});
