import data from '../data/paths.json';
import { sceneById, sceneList } from '../lib/story.js';
import { useStore } from '../lib/store.js';
import { inMode, useMode } from '../lib/words.js';
import { go } from '../lib/router.js';
import { Icon } from './Ornaments.jsx';
import { Shell } from './Pyramid.jsx';

export const PATHS = data.paths;

/** The scenes one stop plays, in story order. */
export function stopScenes(stop) {
  const a = sceneList.indexOf(sceneById[stop.from]);
  const b = sceneList.indexOf(sceneById[stop.to || stop.from]);
  return a < 0 || b < a ? [] : sceneList.slice(a, b + 1);
}

const minutes = (scenes) => Math.max(1, Math.round(scenes.reduce((ms, s) => ms + s.beats.reduce((n, b) => n + (b.dur ?? 6000), 0), 0) / 60000));
const watched = (stop, seen) => stopScenes(stop).every((s) => seen[s.id]);

/**
 * Paths through the stories: new doors into scenes that already exist (women, creatures, dreams, prayers).
 * `#/paths` lists them; `#/path/<id>` shows one path's stops. A stop plays its scenes and comes back here.
 * What has been watched is the story's own `seen` record: nothing new is stored, and nothing is counted by date.
 */
export default function Paths({ id }) {
  const { mode } = useMode();
  const say = (t) => inMode(t, mode);
  const seen = useStore((s) => s.seen);
  const path = id && PATHS.find((p) => p.id === id);

  if (id && !path) {
    return (
      <Shell here="stories" back="/paths" title="Paths">
        <h1 className="mt-6 font-body text-[1.6rem] font-semibold text-gold-hi">That path does not exist</h1>
        <button type="button" className="btn-gold mt-5 self-start" onClick={() => go('/paths')} autoFocus>
          See all the paths
        </button>
      </Shell>
    );
  }

  if (!path) {
    return (
      <Shell here="stories" back="/" title="Paths through the stories">
        <h1 className="mt-4 font-display text-[1.7rem] font-semibold leading-tight text-gold-hi">Choose a path</h1>
        <p className="mt-2 font-body text-[1.1rem] leading-snug text-ivory/75">The same stories, entered by a different door. Each stop is a short scene or two.</p>
        <ul className="mt-5 grid gap-3">
          {PATHS.map((p) => {
            const done = p.stops.filter((st) => watched(st, seen)).length;
            return (
              <li key={p.id}>
                <a
                  href={`#/path/${p.id}`}
                  className="block rounded-xl border border-gold/35 bg-black/30 px-4 py-3 transition-colors hover:border-gold-hi"
                >
                  <span className="block font-body text-[1.25rem] font-semibold text-gold-hi">{p.title}</span>
                  <span className="mt-1 block font-body text-[1.05rem] leading-snug text-ivory/80">{say(p.blurb)}</span>
                  <span className="mt-1 block font-body text-[0.98rem] italic text-ivory/60">
                    {p.stops.length} stops{done ? `, ${done} watched` : ''}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        <button type="button" className="hud-btn mt-6 self-start" onClick={() => go('/stories')}>
          Or follow the whole story in order
        </button>
      </Shell>
    );
  }

  const done = path.stops.filter((st) => watched(st, seen)).length;
  const nextUp = path.stops.findIndex((st) => !watched(st, seen));
  return (
    <Shell here="stories" back="/paths" title="Paths through the stories">
      <h1 className="mt-4 font-display text-[1.7rem] font-semibold leading-tight text-gold-hi">{path.title}</h1>
      <p className="mt-2 font-body text-[1.1rem] leading-snug text-ivory/75">{say(path.blurb)}</p>
      <p className="mt-1 font-body text-[1rem] italic text-ivory/60" role="status">
        {done === path.stops.length ? 'You have watched every stop on this path.' : `${done} of ${path.stops.length} watched`}
      </p>
      <ol className="mt-4 grid gap-2">
        {path.stops.map((st, i) => {
          const scenes = stopScenes(st);
          const seenAll = watched(st, seen);
          const first = scenes[0];
          const last = scenes[scenes.length - 1];
          if (!first) return null;
          const href = `/scene/${first.id}?back=${encodeURIComponent(`/path/${path.id}`)}${last !== first ? `&until=${last.id}` : ''}`;
          return (
            <li key={st.title}>
              <a
                href={`#${href}`}
                className={`flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors hover:border-gold-hi ${i === nextUp ? 'border-gold/60 bg-[#3c2a12]/45' : 'border-gold/25 bg-black/25'}`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border font-body text-[1rem] ${seenAll ? 'border-gold-hi bg-[#a5772f] text-[#1a1208]' : 'border-gold/50 text-gold-hi'}`}
                >
                  {seenAll ? <Icon name="check" className="h-4 w-4" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block font-body text-[1.15rem] font-semibold leading-tight text-ivory">{st.title}</span>
                  <span className="mt-0.5 block font-body text-[1.03rem] leading-snug text-ivory/75">{say(st.line)}</span>
                  <span className="mt-0.5 block font-body text-[0.96rem] italic text-ivory/55">
                    {scenes.length === 1 ? 'One scene' : `${scenes.length} scenes`}, about {minutes(scenes)} min{seenAll ? ', watched' : ''}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </Shell>
  );
}
