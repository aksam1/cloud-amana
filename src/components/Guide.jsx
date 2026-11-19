import { useCallback, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { go } from '../lib/router.js';
import { FIRST_STORY } from '../lib/site.js';
import { dismissHint } from '../lib/store.js';
import { Icon } from './Ornaments.jsx';
import { Shell } from './Pyramid.jsx';

/*
 * The newcomer's guide (#/guide?step=<id>): what is where, one short step at a time. Each step is one place in
 * the app: what it is in a line, where to find it (the real menu below lights the item up), and a way to open it.
 * Nothing opens by itself; the last step asks where to start. Each step is its own address, so the browser's
 * Back button steps back. `?step=all` shows every step on one page for those who would rather skim.
 * The step buttons say Previous and Next, as the reflection's do: "Back" (top left) only ever means leave the page.
 */
export const STEPS = [
  {
    id: 'stories',
    icon: 'book',
    title: 'The stories',
    line: 'The prophets, from the first light to the Last Day, told one moment at a time. A scene takes a minute or two.',
    where: 'Stories, in the menu. Tap, or press →, for the next moment.',
    spot: 'stories',
    open: { label: 'Open the stories', to: '/stories' },
  },
  {
    id: 'map',
    icon: 'map',
    title: 'The map of time',
    line: 'Every story on one thread of light, from the Creation at the top to the Hour at the bottom. Tap a seal to see its stories.',
    where: 'Map, in the menu. Sound on or off is its top-right button.',
    spot: 'map',
    open: { label: 'Open the map', to: '/map' },
  },
  {
    id: 'lessons',
    icon: 'check',
    title: 'Short lessons',
    line: 'At the end of each part of the story you can take a short lesson: what to remember, a verse, a question to think about. It is always your choice.',
    where: 'Offered when a part ends. Any you leave wait for you in Progress.',
    spot: 'progress',
  },
  {
    id: 'pyramid',
    icon: 'pyramid',
    title: 'The pyramid',
    line: 'Three levels of faith, each made of short lessons with a story inside. Not sure where to begin? A few private questions suggest a place. It is never a grade.',
    where: 'Pyramid, in the menu. Tap a level to look closer.',
    spot: 'pyramid',
    open: { label: 'See the pyramid', to: '/pyramid' },
  },
  {
    id: 'paths',
    icon: 'list',
    title: 'Paths',
    line: 'Other ways through the same stories: the women in them, the creatures, the dreams, the prayers.',
    where: 'On the home page, under the main button.',
    spot: 'home',
    open: { label: 'Open the paths', to: '/paths' },
  },
  {
    id: 'abodes',
    icon: 'diamond',
    title: 'The two abodes',
    line: 'Paradise and the Fire, level by level, as the Quran describes them, and what it names as leading to each. Verses only; no one is ever placed there.',
    where: "The map's last stop, Judgment, and the home page.",
    spot: 'home',
    open: { label: 'Open the two abodes', to: '/abodes' },
  },
  {
    id: 'progress',
    icon: 'bars',
    title: 'Your progress',
    line: 'What you have watched and learned, as stars in a sky, and your private notes. It stays on this device: no streaks, nothing to compare.',
    where: 'Progress, in the menu.',
    spot: 'progress',
    open: { label: 'Open Progress', to: '/pyramid/progress' },
  },
  {
    id: 'settings',
    icon: 'auto',
    title: 'Settings',
    line: 'The view (Muslim or exploring), sound and tap sounds, keeping the story for offline, and your data.',
    where: 'On the home page, under the main button.',
    spot: 'home',
    open: { label: 'Open Settings', to: '/settings' },
  },
];

const LAST = 'start';
const ORDER = [...STEPS.map((s) => s.id), LAST];

/** A step's round seal: an icon from the set, or the two abodes' diamond (one shape above, one below). */
function Seal({ icon }) {
  return (
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-gold/50 bg-[radial-gradient(circle,#3c2a12_0%,#120d0a_80%)] text-gold-hi shadow-[0_0_24px_rgba(226,187,104,0.18)]" aria-hidden="true">
      {icon === 'diamond' ? (
        <svg viewBox="-12 -12 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M0 -10 L8 0 L0 10 L-8 0 Z" />
          <path d="M-8 0 H8" />
        </svg>
      ) : (
        <Icon name={icon} className="h-6 w-6" />
      )}
    </span>
  );
}

function Dots({ at }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {ORDER.map((id, i) => (
        <span key={id} className={`h-1.5 rounded-full transition-all ${i === at ? 'w-5 bg-gold-hi' : i < at ? 'w-1.5 bg-gold/70' : 'w-1.5 bg-ivory/25'}`} />
      ))}
    </div>
  );
}

// A way-in card, as on the Begin page.
function Way({ title, line, onClick, main = false, autoFocus = false }) {
  return (
    <button
      type="button"
      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors hover:border-gold-hi ${main ? 'border-gold-hi/70 bg-[#3c2a12]/55' : 'border-gold/35 bg-black/30'}`}
      onClick={onClick}
      autoFocus={autoFocus}
      data-tap={main ? 'primary' : undefined}
    >
      <span className="flex items-center gap-2 font-body text-[1.2rem] font-semibold text-gold-hi">
        {main && <Icon name="play" className="h-4 w-4" />}
        {title}
      </span>
      <span className="mt-1 block font-body text-[1.05rem] leading-snug text-ivory/80">{line}</span>
    </button>
  );
}

function Start() {
  return (
    <>
      <h1 id="guide-title" className="font-body text-[1.75rem] font-semibold leading-tight text-gold-hi">Where would you like to start?</h1>
      <p className="mt-1 font-body text-[1.1rem] text-ivory/70">Choose one. The rest will be where the guide showed you.</p>
      <div className="mt-5 grid gap-3">
        <Way main autoFocus title="Watch the first story" line="The beginning of everything, in about a minute." onClick={() => go(`/scene/${FIRST_STORY}?first=1`)} />
        <Way title="Open the map" line="Choose any story along the thread of time." onClick={() => go('/map')} />
        <Way title="Back home" line="Everything from the start screen." onClick={() => go('/')} />
      </div>
      <p className="mt-5 font-body text-[1rem] italic text-ivory/55">This guide stays in Settings and About, and behind the ? in a story.</p>
    </>
  );
}

/** Every step on one page, each with its way in. */
function All() {
  return (
    <>
      <h1 className="font-body text-[1.75rem] font-semibold leading-tight text-gold-hi">What is where</h1>
      <ul className="mt-4 grid gap-3">
        {STEPS.map((s) => (
          <li key={s.id} className="flex gap-3 rounded-xl border border-gold/25 bg-black/25 p-3">
            <Seal icon={s.icon} />
            <div className="min-w-0">
              <h2 className="font-body text-[1.2rem] font-semibold text-gold-hi">{s.title}</h2>
              <p className="font-body text-[1.05rem] leading-snug text-ivory/85">{s.line}</p>
              <p className="mt-1 font-body text-[1rem] italic text-ivory/60">{s.where}</p>
              {s.open && (
                <button type="button" className="min-h-[44px] font-body text-[1.05rem] text-gold-hi underline decoration-gold/40 underline-offset-4" onClick={() => go(s.open.to)}>
                  {s.open.label}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn-gold" onClick={() => go(`/guide?step=${LAST}`)}>
          Where to start
          <Icon name="next" className="h-4 w-4" />
        </button>
        <button type="button" className="hud-btn" onClick={() => go('/guide')}>
          One step at a time
        </button>
      </div>
    </>
  );
}

export default function Guide({ step }) {
  const reduce = useReducedMotion();
  const all = step === 'all';
  const at = Math.max(0, ORDER.indexOf(step));
  const id = ORDER[at];
  const s = STEPS[at];
  const prev = at > 0 ? ORDER[at - 1] : null;
  const next = at < ORDER.length - 1 ? ORDER[at + 1] : null;

  // Having opened the guide, the first-visit pointers that say "Show me around" have done their work.
  useEffect(() => {
    dismissHint('guide');
  }, []);

  const move = useCallback((to) => to && go(`/guide?step=${to}`), []);
  useEffect(() => {
    if (all) return undefined;
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') move(next);
      else if (e.key === 'ArrowLeft') move(prev);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [all, next, prev, move]);

  return (
    <Shell back="/" title="A short guide" here="guide" spot={all ? null : s?.spot}>
      {all ? (
        <All />
      ) : (
        <section aria-labelledby="guide-title" className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <Dots at={at} />
            <span className="font-body text-[1rem] italic text-ivory/55" aria-live="polite">
              {s ? `Step ${at + 1} of ${STEPS.length}` : 'Last step'}
            </span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={id} className="mt-5" initial={{ opacity: 0, x: reduce ? 0 : 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -18 }} transition={{ duration: 0.2 }}>
              {s ? (
                <>
                  <div className="flex items-center gap-4">
                    <Seal icon={s.icon} />
                    <h1 id="guide-title" className="font-body text-[1.75rem] font-semibold leading-tight text-gold-hi">
                      {s.title}
                    </h1>
                  </div>
                  <p className="mt-4 font-body text-[1.2rem] leading-snug text-ivory/90">{s.line}</p>
                  <p className="mt-3 flex items-start gap-2 font-body text-[1.05rem] text-ivory/70">
                    <Icon name="target" className="mt-1 h-4 w-4 shrink-0 text-gold-hi" />
                    <span>
                      <span className="italic text-gold/85">Where: </span>
                      {s.where}
                    </span>
                  </p>
                  {s.open && (
                    <button type="button" className="mt-3 min-h-[44px] font-body text-[1.08rem] text-gold-hi underline decoration-gold/40 underline-offset-4" onClick={() => go(s.open.to)}>
                      {s.open.label}
                    </button>
                  )}
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    {prev && (
                      <button type="button" className="hud-btn" onClick={() => move(prev)}>
                        <Icon name="prev" className="h-4 w-4" />
                        Previous
                      </button>
                    )}
                    <button type="button" className="btn-gold" onClick={() => move(next)} autoFocus>
                      Next
                      <Icon name="next" className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-6 font-body text-[1rem]">
                    <button type="button" className="min-h-[44px] text-ivory/65 underline decoration-ivory/25 underline-offset-4 hover:text-ivory" onClick={() => go('/guide?step=all')}>
                      See it all on one page
                    </button>
                    <button type="button" className="min-h-[44px] text-ivory/65 underline decoration-ivory/25 underline-offset-4 hover:text-ivory" onClick={() => move(LAST)}>
                      Skip to where to start
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <Start />
                  <button type="button" className="hud-btn mt-4" onClick={() => move(prev)}>
                    <Icon name="prev" className="h-4 w-4" />
                    Previous
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      )}
    </Shell>
  );
}
