// The guide: the whole of Amanah as one path, in order.
//
// Every step a reader can take, in one list: choose a view, how Amanah works, then for each part of the story its
// scenes, its lesson and the pyramid lessons that replay it. Each place (the pyramid, the two abodes, the map,
// Paths) is shown once, at the point where the story makes sense of it.
//
// A step is done by the reader's own progress, however they reached it: a part watched from the map is done in the
// guide too. The guide stands at a step (`journey.at`, the first step when none) and its next step is the first one
// from there that is not done yet. "Skip" moves it one step on. Closing the guide (`journey.off`) leaves it where it
// stands: the reader roams freely, and when they pick it up again it carries on from the same step, with an offer
// to jump to where they have got to in the story.
//
// Light on purpose: the home page shows the next step, so nothing here loads a scene, a lesson or a unit.
import units from 'virtual:unit-index';
import { begun, DOORS, newcomer } from './discover.js';
import { CHAPTERS, playable, STORY_PARTS, unitById } from './pyramid.js';
import { sceneAt, scenesOf, storyResume } from './sceneIndex.js';
import { getState, update } from './store.js';

/** `journey.at` once the reader has skipped past the last step. */
const END = 'end';
const door = Object.fromEntries(DOORS.map((d) => [d.id, d]));
const chapterOf = Object.fromEntries(CHAPTERS.map((c) => [c.number, c]));

// Where each place is shown: straight after a part's lesson, before that part's pyramid lessons.
const chaptersShown = [...new Set(STORY_PARTS.map((p) => p.chapter))];
const lastPartOf = (n) => STORY_PARTS.filter((p) => p.chapter === n).at(-1)?.key;
const placesAfter = {};
const showPlace = (key, id) => key && door[id] && (placesAfter[key] ||= []).push(id);
showPlace(STORY_PARTS[0]?.key, 'pyramid'); // the pyramid, just before its first lesson
showPlace(lastPartOf(chaptersShown[0]), 'abodes'); // the two abodes, when the first chapter ends
showPlace(lastPartOf(chaptersShown[1]), 'map'); // the map of time, once a second prophet has been met
showPlace(lastPartOf(chaptersShown[2]), 'paths'); // Paths, once there are enough stories to follow by theme

/** The written pyramid units that replay part `i` of chapter `n`, in the order their stories begin. */
const unitsOf = (n, i) =>
  units
    .filter((u) => u.chapter === n && u.part === i && unitById[u.id] && playable(u.id))
    .sort((a, b) => (sceneAt[a.from]?.order ?? 0) - (sceneAt[b.from]?.order ?? 0));

/** Every step, in order. */
export const STEPS = [
  { id: 'view', kind: 'view' },
  { id: 'tour', kind: 'tour' },
  ...STORY_PARTS.flatMap(({ key, chapter }) => {
    const i = Number(key.split(':')[1]);
    const c = chapterOf[chapter];
    const p = c.parts[i];
    const scenes = scenesOf(chapter)
      .filter((s) => s.order >= p.from && s.order <= p.to)
      .map((s) => s.id);
    const title = p.title || c.title;
    const where = { key, chapter, part: i, title, chapterTitle: c.title };
    return [
      { id: `part:${key}`, kind: 'part', ...where, scenes },
      { id: `lesson:${key}`, kind: 'lesson', ...where },
      ...(placesAfter[key] || []).map((id) => ({ id: `place:${id}`, kind: 'place', chapter, place: id, title: door[id].title })),
      ...unitsOf(chapter, i).map((u) => ({ id: `unit:${u.id}`, kind: 'unit', chapter, unit: u.id, title: unitById[u.id].title })),
    ];
  }),
];
const indexOf = Object.fromEntries(STEPS.map((s, i) => [s.id, i]));
/** The part step each scene belongs to. */
const partStepOf = Object.fromEntries(STEPS.filter((s) => s.kind === 'part').flatMap((s) => s.scenes.map((id) => [id, s])));
/** The part step a scene belongs to (undefined for an id that is not a scene). */
export const partOfScene = (id) => partStepOf[id];

/** Is the guide on? (It is, until the reader closes it.) */
export const guiding = (state) => !state?.journey?.off;

/** Has the reader done this step, by any route? */
export function isDone(step, state) {
  switch (step.kind) {
    case 'view':
      // chosen, or begun without it (from the map, or a link): a lesson asks for the view when it needs one
      return !!state?.prefs?.mode || begun(state);
    case 'tour':
      // taken, skipped, or never needed: someone who has already begun is not sent back to it (Begin's own rule)
      return !newcomer(state);
    case 'part':
      return step.scenes.every((id) => state?.seen?.[id]);
    case 'lesson':
      return !!state?.learned?.[step.key];
    case 'unit':
      return !!state?.units?.[step.unit];
    case 'place':
      return !!state?.found?.[step.place];
    default:
      return true;
  }
}

/** Where the guide stands: the index of its step (0 when it has not moved; the length when it is past the end). */
function standing(state) {
  const at = state?.journey?.at;
  if (at === END) return STEPS.length;
  return indexOf[at] ?? 0;
}

/** The guide's next step: the first step from where it stands that is not done. Null once everything is. */
export function nextStep(state) {
  for (let i = standing(state); i < STEPS.length; i++) if (!isDone(STEPS[i], state)) return STEPS[i];
  return null;
}

/** The step after `step` that the guide would show (skipping what is done), or null. */
export function stepAfter(state, step) {
  for (let i = (indexOf[step.id] ?? STEPS.length) + 1; i < STEPS.length; i++) if (!isDone(STEPS[i], state)) return STEPS[i];
  return null;
}

/** Where a step is: the address that does it. */
export function stepHref(step, state) {
  switch (step.kind) {
    case 'view':
      return '/begin';
    case 'tour':
      return '/guide';
    case 'part':
      return `/scene/${step.scenes.find((id) => !state?.seen?.[id]) || step.scenes[0]}`;
    case 'lesson':
      return `/lesson/${step.chapter}/${step.part}?then=${encodeURIComponent('/next')}`;
    case 'unit':
      return `/unit/${step.unit}`;
    case 'place':
      return door[step.place].to;
    default:
      return '/';
  }
}

/**
 * What the guide says about a step: `action` (the button), `title` (what it is) and `line` (one plain sentence).
 * `say` puts a line in the reader's view ("God" or "Allah").
 */
export function stepCopy(step, state, say = (t) => t) {
  switch (step.kind) {
    case 'view':
      return { action: 'Begin your journey', title: 'How you would like to explore', line: 'Choose a view first. You can change it later.' };
    case 'tour':
      return { action: 'See how it works', title: 'How Amanah works', line: 'Four short things to try.' };
    case 'part': {
      const started = step.scenes.some((id) => state?.seen?.[id]);
      const chapter = step.title === step.chapterTitle ? `Chapter ${step.chapter}` : `Chapter ${step.chapter}, ${step.chapterTitle}`;
      return { action: started ? 'Continue the story' : 'Watch the story', title: step.title, line: `${chapter}. ${step.scenes.length === 1 ? 'One scene' : `${step.scenes.length} short scenes`}.` };
    }
    case 'lesson':
      return { action: 'Take the short lesson', title: `The lesson of ${step.title}`, line: 'What this part of the story teaches, in a few short steps.' };
    case 'unit': {
      const u = unitById[step.unit];
      return { action: 'Open the pyramid lesson', title: `The pyramid: ${u.title}`, line: `${say(u.english)}, through the story you just watched.` };
    }
    case 'place':
      return { action: 'Have a look', title: door[step.place].title, line: say(door[step.place].line) };
    default:
      return { action: 'Go on', title: '', line: '' };
  }
}

/** A step's short name, for the line of steps (Rail.jsx). */
export function stepName(step) {
  switch (step.kind) {
    case 'view':
      return 'Choose your view';
    case 'tour':
      return 'How Amanah works';
    case 'lesson':
      return 'Its lesson'; // it always follows the part it belongs to
    case 'unit':
      return `The pyramid: ${step.title}`;
    default:
      return step.title;
  }
}

/**
 * The journey close to the reader, in order: the last step done before the guide's next one, that next step, and
 * what follows it (`n` in all). Each is `{ step, is }`, `is` being 'done', 'now' or 'next'. Empty once all is done.
 */
export function stepsAround(state, n = 3) {
  const now = nextStep(state);
  if (!now) return [];
  let i = indexOf[now.id] - 1;
  while (i >= 0 && !isDone(STEPS[i], state)) i--;
  const out = i >= 0 ? [{ step: STEPS[i], is: 'done' }] : [];
  out.push({ step: now, is: 'now' });
  for (let s = stepAfter(state, now); s && out.length < n; s = stepAfter(state, s)) out.push({ step: s, is: 'next' });
  return out;
}

/** The steps that come straight after a part's lesson: a place to see, and the pyramid lessons that replay the part. */
export function stepsAfterLesson(key) {
  const out = [];
  for (let i = (indexOf[`lesson:${key}`] ?? STEPS.length) + 1; i < STEPS.length && STEPS[i].kind !== 'part'; i++) out.push(STEPS[i]);
  return out;
}

/**
 * Where the reader has got to in the story, when that is further on than the guide: the part step of the scene
 * they would pick up next. Null when the guide is level with them or ahead (or they have not started).
 */
export function aheadOfGuide(state) {
  if (!state?.last) return null;
  const next = nextStep(state);
  const here = partStepOf[storyResume(state).id];
  if (!next || !here) return null;
  // level with the guide when they wait at the very part it comes to next (after a lesson, a place or a unit)
  const coming = STEPS.slice(indexOf[next.id]).find((s) => s.kind === 'part');
  return coming && indexOf[here.id] > indexOf[coming.id] ? here : null;
}

/**
 * The guide's stop at the end of scene `id`: the step to offer there, or null when the story's own way on (to
 * `nextId`, the next scene, perhaps by way of the map) is the guide's way too. Only for a reader following the guide,
 * that is when the scene belongs to the guide's current step; someone watching elsewhere goes on as the story does.
 */
export function stopAfter(state, id, nextId) {
  const part = partStepOf[id];
  if (!part || !guiding(state)) return null;
  const without = { ...state, seen: { ...state?.seen, [id]: false } };
  if (nextStep(without)?.id !== part.id) return null;
  const withIt = { ...state, seen: { ...state?.seen, [id]: true } };
  const step = nextStep(withIt);
  if (!step) return null; // every step done: the story's own ending
  if (step.kind === 'part' && stepHref(step, withIt) === `/scene/${nextId}`) return null;
  return step;
}

// ── What the reader does with the guide ──────────────────────────────────────

const setJourney = (patch) => update((s) => void (s.journey = { ...(s.journey || {}), ...patch }));

/** Pass one step by: the guide moves on to the step after it. */
export function skipStep(step) {
  const i = indexOf[step.id];
  if (i === undefined) return;
  setJourney({ at: STEPS[i + 1]?.id ?? END });
}
/** Move the guide to a step (the reader's own place in the story). */
export const jumpTo = (step) => setJourney({ at: step.id });
/** Close the guide: the reader roams freely, and the guide waits where it is. */
export const closeGuide = () => setJourney({ off: true });
/** Pick the guide up again, from where it was left. */
export const resumeGuide = () => setJourney({ off: false });

/** The address of the guide's next step for the reader now (the end of the chronicle when every step is done). */
export const nextHref = (state = getState()) => {
  const step = nextStep(state);
  return step ? stepHref(step, state) : '/end';
};
