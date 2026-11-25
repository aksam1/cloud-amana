// The places that open as the story reaches them.
//
// A new visitor's menu is Home and Journey, nothing else to learn. The first scene opens the map of time (and
// with it Explore) and Progress; reaching the first stop of a path opens Paths; the first lesson (or the
// pyramid's questions) opens the pyramid; the end of the first chapter opens the two abodes.
//
// Nothing is ever locked. Every address works for everyone; a visit opens a place for good; every sealed door
// in Explore says how it opens and offers "Open it now"; the guide opens each place it shows; and Settings can
// show everything at once (prefs.unfold = false).
import paths from '../data/paths.json';
import { SCENES, scenesOf } from './sceneIndex.js';

/** The doors in Explore that open as you go, in the order they usually open. */
export const DOORS = [
  { id: 'map', title: 'The map of time', line: 'Every prophet on one thread of light. Tap a seal to watch its stories.', icon: 'map', to: '/map', opens: 'Opens with your first story.' },
  { id: 'paths', title: 'Paths', line: 'The same stories by a theme: the women in them, the creatures, the dreams, the prayers.', icon: 'list', to: '/paths', opens: 'Opens when the story reaches the Garden.' },
  { id: 'pyramid', title: 'The pyramid', line: 'Three levels of faith, made of short lessons. A few private questions can suggest where to begin.', icon: 'pyramid', to: '/pyramid', opens: 'Opens with your first lesson.' },
  { id: 'abodes', title: 'The two abodes', line: 'Paradise and the Fire as the Quran describes them. Verses only.', icon: 'diamond', to: '/abodes', opens: 'Opens when the first chapter ends.' },
];
/** Always open: the guide is how a newcomer asks "what is where". */
export const GUIDE_DOOR = { id: 'guide', title: 'How Amanah works', line: 'Four short things to try, and what is where.', icon: 'help', to: '/guide' };

const PLACES = [...DOORS.map((d) => d.id), 'progress'];
// a path "begins" for the reader at any of its stops
const STOPS = new Set(paths.paths.flatMap((p) => p.stops.map((s) => s.from)));
// the pyramid's lesson on the Last Day (src/pyramid/units/lastday.json), whose "see also" is the two abodes
const LAST_DAY = 'lastday';
const has = (o) => !!o && typeof o === 'object' && Object.keys(o).length > 0;

/** What the reader's own progress has opened: `{ map, paths, pyramid, abodes, progress }`, each true or false. */
export function earned(state) {
  const seen = state?.seen || {};
  const watched = SCENES.some((s) => seen[s.id]);
  const first = scenesOf(1);
  const lessons = has(state?.learned) || !!state?.placement || has(state?.units) || has(state?.drafts);
  return {
    map: watched,
    paths: SCENES.some((s) => seen[s.id] && STOPS.has(s.id)),
    pyramid: lessons,
    abodes:
      (first.length > 0 && first.every((s) => seen[s.id])) ||
      SCENES.some((s) => s.chapter >= 20 && seen[s.id]) ||
      !!state?.units?.[LAST_DAY] ||
      !!state?.drafts?.[LAST_DAY],
    progress: watched || lessons,
  };
}

/** Do places open one by one for this reader? (Settings' "Reveal places as I go"; on unless turned off.) */
export const unfolds = (state) => state?.prefs?.unfold !== false;

/** Which places are open: the doors, `explore` (open once any door is) and `progress`. */
export function opened(state) {
  const all = !unfolds(state);
  const e = earned(state);
  const found = state?.found || {};
  const out = {};
  for (const id of PLACES) out[id] = all || e[id] || !!found[id];
  out.explore = all || !!found.explore || DOORS.some((d) => out[d.id]);
  return out;
}

/**
 * The places the reader's progress has opened that they have not come across yet: the "New" marks. Places shown
 * because the reader asked to see everything are not announced: they chose to see them.
 */
export function fresh(state) {
  const out = {};
  if (!unfolds(state)) return out;
  const e = earned(state);
  const found = state?.found || {};
  for (const id of PLACES) if (e[id] && !found[id]) out[id] = true;
  return out;
}

/** The place a page belongs to (a visit there counts as coming across it), or null. */
export function placeOfRoute(route) {
  switch (route?.name) {
    case 'map':
    case 'paths':
    case 'abodes':
    case 'explore':
    case 'guide':
      return route.name;
    case 'unit':
      return 'pyramid';
    case 'pyramid':
      if (route.view === 'progress') return 'progress';
      return ['home', 'begin', 'begun'].includes(route.view) ? null : 'pyramid';
    default:
      return null;
  }
}

/** The places the guide's "every place on one page" shows, so reading it opens what it points at. */
export const GUIDE_PLACES = { map: ['map', 'explore'], paths: ['paths', 'explore'], pyramid: ['pyramid', 'explore'], abodes: ['abodes', 'explore'], progress: ['progress'] };

/** Has the reader begun: a scene opened, or anything watched or learned? */
export const begun = (state) => !!state?.last || earned(state).progress;

/**
 * Is this a newcomer, who is shown how Amanah works (#/guide) before anything else? Nothing watched or learned yet,
 * no scene opened, and the guide neither finished nor skipped. Skipping is always one tap; after that the guide
 * is an offer like any other.
 */
export const newcomer = (state) => !state?.prefs?.guide && !begun(state);
