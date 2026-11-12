import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { deleteAllData, savePlacement, useStore } from '../lib/store.js';
import { inMode, useMode } from '../lib/words.js';
import { go } from '../lib/router.js';
import { download, FIRST_STORY, share, shareMessage } from '../lib/site.js';
import { climb, completed, DISCLAIMER, HISTORY_PARTS, levelById, LEVELS, partName, pathOf, placementQuestions, placementResult, playable, PLAYABLE, SCALE, unitById, UNITS, unitStatus } from '../lib/pyramid.js';
import { GeoField, Icon, Rule } from './Ornaments.jsx';
import { ModePicker } from './ModePicker.jsx';
import Monument from './Monument.jsx';
import Nav from './Nav.jsx';
import Sky from './Sky.jsx';
import heroStars from '../assets/hero-stars.webp';
import imgHeavens from '../assets/previews/heavens.webp';
import imgSearch from '../assets/previews/search.webp';
import imgStars from '../assets/previews/stars.webp';
import imgRestored from '../assets/previews/restored.webp';
import imgSea from '../assets/previews/sea.webp';
import imgGourd from '../assets/previews/gourd.webp';

/*
 * The Pyramid of Righteousness (hadith of Jibril: Islam, Iman, Ihsan). One component, four views:
 *   landing   #/                  the monument, the view choice, where you stand, what to do next
 *   placement #/pyramid/placement reflection questions, one per screen (never a "test")
 *   result    #/pyramid/result    the starting point glowing, strongest and growing units, a first unit
 *   progress  #/pyramid/progress  every meter, and "Delete my data"
 * Scores are private to this browser: no leaderboards, no comparisons.
 */
export default function Pyramid({ view = 'landing' }) {
  if (view === 'placement') return <Placement />;
  if (view === 'result') return <Result />;
  if (view === 'progress') return <Progress />;
  if (view === 'home') return <Home />;
  if (view === 'begin') return <Begin />;
  if (view === 'begun') return <Begun />;
  return <Landing />;
}

// ── Shared pieces ─────────────────────────────────────────

export function Shell({ children, back, title, stars = false, here, wide = false }) {
  return (
    <div className="thin-scroll relative h-full w-full overflow-y-auto" style={{ background: NIGHT }}>
      {stars && <Stars />}
      {/* the same header as the pyramid page: the name home, the menu (a tab bar on phones) */}
      <header className="relative z-20 mx-auto flex w-full max-w-[1100px] items-center justify-between gap-6 px-5 pt-5 sm:px-10">
        <a href="#/" onClick={(e) => { e.preventDefault(); go('/'); }} aria-label="Amanah, home" className="inline-flex min-h-[44px] items-center font-display text-[1.35rem] font-semibold tracking-[0.06em] text-gold-hi">
          Amanah
        </a>
        {here && (
          <div className="sm:w-[580px]">
            <Nav here={here} />
          </div>
        )}
      </header>
      <div className={`relative z-10 mx-auto flex min-h-full ${wide ? 'max-w-[860px]' : 'max-w-[600px]'} flex-col px-5 pb-28 pt-3 sm:pb-10`}>
        {(back || title) && (
          <div className="mb-2 flex min-h-[48px] items-center gap-3">
            {back && (
              <button type="button" className="hud-btn icon" onClick={() => go(back)} aria-label="Back">
                <Icon name="prev" className="h-4 w-4" />
              </button>
            )}
            {title && <div className="font-body text-[1.1rem] italic text-gold/85">{title}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// The same night as the home page's sky, without the dusk: the pages after it feel like one place.
const NIGHT = 'linear-gradient(180deg, #070a1a 0%, #0e1530 34%, #171427 70%, #0b0a0e 100%) fixed';

// A sparse field of stars over the night sky (fixed positions, so it never shifts between renders).
const STARS = Array.from({ length: 46 }, (_, i) => ({ x: (i * 37.7) % 100, y: (i * 23.3) % 46, r: i % 7 === 0 ? 1.4 : 0.8, o: 0.25 + ((i * 13) % 50) / 100 }));
function Stars() {
  return (
    <svg className="pointer-events-none absolute inset-x-0 top-0 h-[46%] w-full" preserveAspectRatio="none" viewBox="0 0 100 50" aria-hidden="true">
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.12} fill="#f3e7cc" opacity={s.o} />
      ))}
    </svg>
  );
}

export function Disclaimer({ tone = 'night' }) {
  return (
    <p className={`mx-auto mt-6 max-w-[46ch] text-center font-body text-[0.98rem] italic leading-snug ${tone === 'night' ? 'text-ivory/60' : 'text-ink-soft'}`} role="note">
      {DISCLAIMER}
    </p>
  );
}

export function Meter({ value, label, tone = 'night' }) {
  return (
    <div>
      {label && (
        <div className={`mb-1 flex justify-between font-body text-[0.98rem] ${tone === 'night' ? 'text-ivory/80' : 'text-ink-soft'}`}>
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      )}
      <div className={`h-2 overflow-hidden rounded-full ${tone === 'night' ? 'bg-ivory/12' : 'bg-[#5a3d22]/15'}`} {...(label ? { role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': value, 'aria-label': label } : { 'aria-hidden': true })}>
        <motion.div className="h-full rounded-full bg-gradient-to-r from-[#c99a45] to-[#f7e0a3]" initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1.1, ease: 'easeOut' }} />
      </div>
    </div>
  );
}

/** Everything the monument needs from saved state. */
function useClimb() {
  const state = useStore();
  return useMemo(() => {
    const c = climb(state);
    const done = Object.fromEntries(UNITS.map((u) => [u.id, completed(state, u.id)]));
    const lit = Object.fromEntries(c.levels.map((l) => [l.id, l.lit]));
    return { state, ...c, done, lit };
  }, [state]);
}

/** The unit to suggest next: placement's recommendation until it is done, then the next open lesson path. */
function suggestion(state, current) {
  const rec = state.placement && placementResult(state.placement.path, state.placement.answers).recommended;
  if (rec && !completed(state, rec)) return rec;
  const order = [...UNITS.filter((u) => u.level === current), ...UNITS];
  return order.find((u) => playable(u.id) && !completed(state, u.id))?.id || PLAYABLE[0];
}

/** A unit's or level's plain-English words as the current view reads them (Allah in the Muslim view). */
const useSay = () => {
  const { mode } = useMode();
  return (t) => inMode(t, mode);
};

// Messengers is the chronicle: its stone goes straight back into the story, not to a second home page.
export const unitHref = (id) => (unitStatus(id) === 'history' ? '/stories' : `/unit/${id}`);

const DAY = 864e5;
/** "Continue where you left off": the most recent unfinished unit or story scene, if any. */
function resumePoint(state) {
  const drafts = Object.entries(state.drafts || {}).map(([id, d]) => ({ kind: 'unit', id, at: d.at, step: d.step }));
  const scene = state.recent?.kind === 'scene' && !state.seen[state.recent.id] ? [{ kind: 'scene', id: state.recent.id, title: state.recent.title, at: state.recent.at }] : [];
  return [...drafts, ...scene].sort((a, b) => (b.at || '').localeCompare(a.at || ''))[0] || null;
}
const STEP_NAME = { story: 'the story', choice: 'the choice', teaching: 'the teaching', check: 'the understanding check', reflection: 'the reflection' };

function UnitChip({ id }) {
  const u = unitById[id];
  const say = useSay();
  return (
    <button type="button" onClick={() => go(unitHref(id))} className="rounded-full border border-gold/35 bg-black/25 px-3 py-1.5 font-body text-[1rem] text-ivory hover:border-gold-hi">
      {u.title} <span className="ml-1 text-ivory/60">{say(u.english)}</span>
    </button>
  );
}

// ── Landing ───────────────────────────────────────────────

/*
 * The start screen: one painting from the chronicle, full screen (Yusuf's eleven stars), the name, one line,
 * one button. Like a game's title screen. The pyramid lives on its own page (#/pyramid).
 */
function Home() {
  const { mode } = useMode();
  const c = useClimb();
  const placed = !!c.state.placement;
  const resume = resumePoint(c.state);
  const resumeUnit = resume?.kind === 'unit' && unitById[resume.id];
  const next = placed ? suggestion(c.state, c.current) : null;
  const cta = resume
    ? { label: 'Continue', href: resumeUnit ? `/unit/${resume.id}` : `/scene/${resume.id}`, note: resumeUnit ? `${resumeUnit.title}: you were on ${STEP_NAME[resume.step] || 'the lesson'}.` : `You were at “${resume.title}”.` }
    : placed
      ? { label: 'Continue your climb', href: unitHref(next), note: unitStatus(next) === 'history' ? 'Next: the stories of the prophets.' : `Next: ${inMode(unitById[next].english, mode).toLowerCase()}.` }
      : { label: 'Begin your journey', href: '/begin', note: 'Free, private, no account.' };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#05060d]">
      <motion.img
        src={heroStars}
        alt=""
        className="absolute inset-x-0 top-0 h-[64%] w-full object-cover object-[50%_75%] [mask-image:linear-gradient(180deg,#000_70%,transparent)] sm:h-full sm:[mask-image:none]"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.4, ease: 'easeOut' }}
      />
      {/* darken top and bottom so the words read; keep the stars in the middle */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,13,0.75)_0%,rgba(5,6,13,0)_30%,rgba(5,6,13,0)_55%,rgba(5,6,13,0.92)_100%)]" />

      <div className="relative z-10 mx-auto flex h-full max-w-[1100px] flex-col px-6 pb-28 pt-5 sm:px-10 sm:pb-12 short:pb-3 short:pt-3">
        <header className="flex items-center justify-between gap-6">
          <span className="font-display text-[1.35rem] font-semibold tracking-[0.06em] text-gold-hi tiny:invisible">Amanah</span>
          <div className="sm:w-[580px]">
            <Nav here="home" />
          </div>
        </header>

        <motion.main className="mt-auto flex flex-col items-center text-center" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 1.2 }}>
          <h1 className="bg-gradient-to-b from-[#fff1cc] to-[#d9a54e] bg-clip-text font-display text-[clamp(3rem,15vw,6.5rem)] font-semibold leading-none tracking-[0.06em] text-transparent [filter:drop-shadow(0_4px_24px_rgba(0,0,0,0.6))] short:text-[2.6rem] tiny:text-[2.5rem]">
            Amanah
          </h1>
          <p className="mt-4 max-w-[30ch] font-body text-[clamp(1.25rem,4.8vw,1.6rem)] leading-snug text-ivory/90 short:mt-1 short:max-w-none short:text-[1.15rem] tiny:mt-2 tiny:text-[1.15rem]">The stories of the prophets, told in light.</p>
          <button type="button" className="btn-gold mt-6 short:mt-2 tiny:mt-3" onClick={() => go(cta.href)} autoFocus>
            <Icon name="play" className="h-4 w-4" />
            {cta.label}
          </button>
          <p className="mt-3 max-w-[36ch] font-body text-[1.05rem] italic text-ivory/65 short:mt-1 short:max-w-none">{cta.note}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-6 font-body text-[1.08rem] short:mt-0 tiny:mt-1 tiny:gap-x-4 tiny:text-[1rem]">
            <button type="button" className="min-h-[44px] text-gold-hi/90 underline decoration-gold/40 underline-offset-4" onClick={() => go('/stories')}>
              Watch the stories
            </button>
            <button type="button" className="min-h-[44px] text-gold-hi/90 underline decoration-gold/40 underline-offset-4" onClick={() => go('/paths')}>
              Paths
            </button>
            <button type="button" className="min-h-[44px] text-gold-hi/90 underline decoration-gold/40 underline-offset-4" onClick={() => go('/pyramid')}>
              See the pyramid
            </button>
            <button type="button" className="min-h-[44px] text-gold-hi/90 underline decoration-gold/40 underline-offset-4" onClick={() => go('/about')}>
              About
            </button>
          </div>
          <p className="mt-4 max-w-[48ch] font-body text-[0.92rem] italic text-ivory/45 short:mt-0 short:max-w-none tiny:mt-0 tiny:text-[0.84rem] tiny:leading-tight">{DISCLAIMER}</p>
        </motion.main>
      </div>
    </div>
  );
}

/**
 * Story first. A new visitor chooses a view, and the first scene of the story plays at once: no questions
 * stand between them and it. (#/begin)
 */
function Begin() {
  const { mode } = useMode();
  useEffect(() => {
    if (mode) window.location.replace(`#/scene/${FIRST_STORY}?first=1`);
  }, [mode]);
  if (mode) return null;
  return (
    <Shell back="/" title="Begin">
      <h1 className="mt-6 font-body text-[1.75rem] font-semibold leading-tight text-gold-hi">First, how would you like to explore?</h1>
      <p className="mt-1 font-body text-[1.1rem] text-ivory/70">Only the wording changes. You can switch at any time.</p>
      <div className="mt-5">
        <ModePicker full />
      </div>
    </Shell>
  );
}

/** After that first scene: keep watching, or take one of the other ways in. The questions are an offer now. (#/begin/next) */
function Begun() {
  const { mode } = useMode();
  const n = placementQuestions(pathOf(mode)).length;
  const way = 'w-full rounded-xl border border-gold/35 bg-black/30 px-4 py-3 text-left transition-colors hover:border-gold-hi';
  return (
    <Shell here="home" back="/" title="Your first story">
      <h1 className="mt-4 font-body text-[1.75rem] font-semibold leading-tight text-gold-hi">That was the first minute</h1>
      <p className="mt-2 font-body text-[1.12rem] leading-snug text-ivory/80">The story goes on, one short scene at a time.</p>
      <button type="button" className="btn-gold mt-5 self-start" onClick={() => go('/stories')} autoFocus>
        <Icon name="play" className="h-4 w-4" />
        Keep watching
      </button>
      <p className="mt-6 font-body text-[1.05rem] italic text-ivory/60">Or take another way in</p>
      <div className="mt-2 grid gap-3">
        <button type="button" className={way} onClick={() => go('/pyramid/placement')}>
          <span className="block font-body text-[1.2rem] font-semibold text-gold-hi">Find where to begin on the pyramid</span>
          <span className="mt-1 block font-body text-[1.05rem] leading-snug text-ivory/80">{n} private questions. Not a grade.</span>
        </button>
        <button type="button" className={way} onClick={() => go('/paths')}>
          <span className="block font-body text-[1.2rem] font-semibold text-gold-hi">Follow a path</span>
          <span className="mt-1 block font-body text-[1.05rem] leading-snug text-ivory/80">Women, creatures, dreams, prayers.</span>
        </button>
        <button type="button" className={way} onClick={() => go('/pyramid')}>
          <span className="block font-body text-[1.2rem] font-semibold text-gold-hi">See the pyramid</span>
          <span className="mt-1 block font-body text-[1.05rem] leading-snug text-ivory/80">Three levels of faith.</span>
        </button>
      </div>
      <Disclaimer />
    </Shell>
  );
}

// Stills from the chronicle, in story order (captured from the scenes themselves; about 48 KB together).
// What each level holds, in a sentence, for the close-up panel.
const LEVEL_NOTE = {
  islam: 'The five pillars: what a Muslim does. The declaration of faith, prayer, giving, fasting and the pilgrimage.',
  iman: 'The six beliefs: what a Muslim holds true. God, the angels, the books, the messengers, the Last Day and the decree.',
  ihsan: 'Excellence: worshipping God as though you see Him. The qualities of the heart that grow from the levels below.',
};

// The pop-up brief over the pyramid: a level (its lessons as chips) or one lesson, with Start and Learn more.
function Brief({ focus, unit, c, say, onLevel, onUnit, onClose }) {
  const level = levelById[focus];
  const fi = LEVELS.findIndex((l) => l.id === focus);
  const u = unit && unitById[unit];
  const status = u && unitStatus(u.id);
  const ready = u && status !== 'soon';
  const m = u ? c.meters[u.id] || 0 : 0;
  const firstOpen = level.units.find((x) => unitStatus(x.id) !== 'soon');
  const openCount = level.units.filter((x) => unitStatus(x.id) !== 'soon').length;
  const start = u ? (ready ? unitHref(u.id) : null) : firstOpen ? unitHref(firstOpen.id) : null;
  const more = u && ready ? (status === 'history' ? '/map' : `/unit/${u.id}?step=teaching`) : null;
  const ref = useRef(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), [focus, unit]);
  return (
    <motion.div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-label={u ? `${u.title}: ${u.english}` : `${level.title}: ${level.meaning.split(':')[0]}`}
      className="fixed inset-x-3 bottom-[92px] z-50 max-h-[calc(100svh-92px-46vw-80px)] sm:max-h-[60svh] lg:max-h-[80svh] overflow-y-auto rounded-2xl border border-gold/35 bg-[#1b130c]/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)] outline-none backdrop-blur-md sm:inset-x-auto sm:bottom-8 sm:left-1/2 sm:w-[460px] sm:-translate-x-1/2 lg:bottom-auto lg:left-auto lg:right-[max(24px,calc(50vw-620px))] lg:top-1/2 lg:w-[400px] lg:translate-x-0 lg:-translate-y-1/2"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-1">
        {u ? (
          <button type="button" onClick={() => onLevel(focus)} className="-ml-2 flex min-h-[44px] items-center gap-1 px-2 font-body text-[1rem] text-gold-hi/85 hover:text-gold-hi">
            ‹ {level.title}
          </button>
        ) : (
          <>
            {fi < LEVELS.length - 1 && (
              <button type="button" onClick={() => onLevel(LEVELS[fi + 1].id)} aria-label={`Up to ${LEVELS[fi + 1].title}`} className="min-h-[44px] rounded-full border border-gold/25 px-3 font-body text-[0.98rem] text-ivory/75 hover:border-gold-hi/60">
                ↑ {LEVELS[fi + 1].title}
              </button>
            )}
            {fi > 0 && (
              <button type="button" onClick={() => onLevel(LEVELS[fi - 1].id)} aria-label={`Down to ${LEVELS[fi - 1].title}`} className="min-h-[44px] rounded-full border border-gold/25 px-3 font-body text-[0.98rem] text-ivory/75 hover:border-gold-hi/60">
                ↓ {LEVELS[fi - 1].title}
              </button>
            )}
          </>
        )}
        <button type="button" onClick={onClose} aria-label="Close and see the whole pyramid" className="-mr-2 ml-auto grid h-11 w-11 place-items-center rounded-full text-ivory/70 hover:bg-white/5 hover:text-ivory">
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>

      {u ? (
        <>
          <div className="mt-1 font-body text-[1rem] italic text-ivory/55">{level.title}</div>
          <h2 className="font-display text-[1.6rem] font-semibold leading-tight text-gold-hi">{u.title}</h2>
          <p className="font-body text-[1.15rem] italic text-ivory/75">{say(u.english)}</p>
          <p className="mt-2 font-body text-[1.1rem] leading-snug text-ivory/85">{say(u.brief)}</p>
          {ready && m > 0 && (
            <div className="mt-3">
              <div className="flex justify-between font-body text-[0.98rem] text-ivory/60">
                <span>Your meter</span>
                <span>{m}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-[#b9822c] to-[#ffe08a]" style={{ width: `${m}%` }} />
              </div>
            </div>
          )}
          {!ready && <p className="mt-3 font-body text-[1.02rem] italic text-ivory/55">This lesson is still being written. The gold seals are open now.</p>}
        </>
      ) : (
        <>
          <div className="mt-1 font-body text-[1rem] italic text-ivory/55">{{ islam: 'The base', iman: 'The middle', ihsan: 'The peak' }[focus]}</div>
          <h2 className="font-display text-[1.6rem] font-semibold leading-tight text-gold-hi">
            {level.title} <span className="font-body text-[1.15rem] font-normal italic text-ivory/70">{say(level.meaning.split(':')[0])}</span>
          </h2>
          <p className="mt-1 font-body text-[1.08rem] leading-snug text-ivory/85">{say(LEVEL_NOTE[focus])}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {level.units.map((x) => {
              const open = unitStatus(x.id) !== 'soon';
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => onUnit(x.id)}
                  className={`flex min-h-[44px] items-center gap-2 rounded-full border px-3 font-body text-[1rem] ${open ? 'border-gold/50 text-ivory hover:bg-gold/10' : 'border-white/10 text-ivory/45 hover:border-white/25'}`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${open ? 'bg-[#f0c768] shadow-[0_0_8px_#f0c768]' : 'bg-[#5a3d1f]'}`} />
                  {x.title}
                </button>
              );
            })}
          </div>
          <p className="mt-2 font-body text-[0.98rem] italic text-ivory/50">{openCount ? `${openCount} of ${level.units.length} open now. Tap one to read about it.` : 'These lessons are still being written.'}</p>
        </>
      )}

      {(start || more) && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {start && (
            <button type="button" className="btn-gold" onClick={() => go(start)}>
              <Icon name="play" className="h-4 w-4" />
              {u ? (status === 'history' ? 'Watch the stories' : 'Start') : `Start with ${firstOpen.title}`}
            </button>
          )}
          {more && (
            <button type="button" className="min-h-[44px] font-body text-[1.08rem] text-gold-hi/90 underline decoration-gold/40 underline-offset-4 hover:decoration-gold-hi" onClick={() => go(more)}>
              {status === 'history' ? 'See the map' : 'Learn more'}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

const STORIES = [
  { id: 'heavens', img: imgHeavens, title: 'The heavens and the earth are created', who: 'Creation, chapter 1' },
  { id: 'search', img: imgSearch, title: 'The star, the moon and the sun', who: 'Ibrahim, chapter 6' },
  { id: 'stars', img: imgStars, title: 'Eleven stars', who: 'Yusuf, chapter 9' },
  { id: 'restored', img: imgRestored, title: 'Restored', who: 'Ayyub, chapter 10' },
  { id: 'sea', img: imgSea, title: 'The sea parts', who: 'Musa, chapter 12' },
  { id: 'gourd', img: imgGourd, title: 'Cast on the shore', who: 'Yunus, chapter 15' },
];

/*
 * The home page. One bold element: the monument at dusk, lit by the last sun, its levels carved in Arabic.
 * Everything around it stays quiet: a headline, one sentence, one main button for where this person is.
 */
function Landing() {
  const { mode } = useMode();
  const say = useSay();
  const c = useClimb();
  const [selected, setSelected] = useState(null);
  const placed = !!c.state.placement;
  const next = suggestion(c.state, c.current);
  const resume = resumePoint(c.state);
  const stale = placed && Date.now() - new Date(c.state.placement.at || 0).getTime() > 30 * DAY;

  // The one main action for this visitor, and the line under it.
  const resumeUnit = resume?.kind === 'unit' && unitById[resume.id];
  const cta = resume
    ? {
        label: resumeUnit ? `Continue ${resumeUnit.title}` : 'Continue the story',
        href: resumeUnit ? `/unit/${resume.id}` : `/scene/${resume.id}`,
        note: resumeUnit ? `${inMode(resumeUnit.english, mode)}: you were on ${STEP_NAME[resume.step] || 'the lesson'}.` : `You were at “${resume.title}”.`,
        region: true,
      }
    : placed
      ? {
          label: unitStatus(next) === 'history' ? 'Continue the stories' : mode === 'curious' ? `Explore ${unitById[next].title}` : `Begin ${unitById[next].title}`,
          href: unitHref(next),
          note: unitStatus(next) === 'history' ? 'Next on your climb: the stories of the prophets.' : `Next on your climb: ${inMode(unitById[next].english, mode).toLowerCase()}.`,
        }
      : { label: 'Begin your journey', href: '/pyramid/placement', note: 'A few private questions first. About 3 minutes, and never a grade.' };
  const secondary = placed ? { label: 'Your progress', href: '/pyramid/progress' } : { label: 'Watch the stories first', href: '/stories' };

  const Cta = (
    <div className="flex flex-col items-center gap-2" role={cta.region ? 'region' : undefined} aria-label={cta.region ? 'Continue where you left off' : undefined}>
      <button type="button" className="btn-gold" onClick={() => go(cta.href)}>
        <Icon name="play" className="h-4 w-4" />
        {cta.label}
      </button>
      <p className="max-w-[34ch] text-center font-body text-[1.05rem] italic leading-snug text-ivory/70">{cta.note}</p>
      <button type="button" className="min-h-[44px] font-body text-[1.08rem] text-gold-hi/90 underline decoration-gold/40 underline-offset-4 hover:decoration-gold-hi" onClick={() => go(secondary.href)}>
        {secondary.label}
      </button>
    </div>
  );

  const [focus, setFocus] = useState(null);
  // On a phone the pop-up takes the lower half, so the title steps aside and the pyramid rises to meet it.
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 1023px)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(max-width: 1023px)');
    if (!mq) return undefined;
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const fromPyramid = (id) => {
    setFocus(unitById[id].level);
    setSelected(id);
  };
  const look = (levelId) => {
    setSelected(null);
    setFocus(levelId);
  };
  const back = () => {
    const was = focus;
    setFocus(null);
    setSelected(null);
    // keyboard focus returns to the level that was open, not to the top of the page
    requestAnimationFrame(() => document.querySelector(`[data-level="${was}"]`)?.focus({ preventScroll: true }));
  };
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && focus && back();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="thin-scroll relative h-full w-full overflow-y-auto overflow-x-hidden bg-night">
      {/* ── The monument at dusk: title, the pyramid, one button ── */}
      <section className="relative isolate overflow-hidden" style={{ background: SKY }}>
        <Stars />
        <div className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-col px-5 pt-5 sm:px-10">
          <header className="flex items-center justify-between gap-6">
            <a href="#/" onClick={(e) => { e.preventDefault(); go('/'); }} aria-label="Amanah, home" className="inline-flex min-h-[44px] items-center">
              <span className="font-display text-[1.35rem] font-semibold tracking-[0.06em] text-gold-hi">Amanah</span>
            </a>
            <div className="sm:w-[580px]">
              <Nav here="pyramid" />
            </div>
          </header>

          <motion.div className="overflow-hidden text-center short:!mt-1" initial={{ opacity: 0, y: 10 }} animate={focus && narrow ? { opacity: 0, height: 0, marginTop: 0 } : { opacity: 1, y: 0, height: 'auto', marginTop: narrow ? 32 : 48 }} transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}>
            <p className="font-body text-[1.15rem] italic text-gold-hi/80 short:hidden">Islam, Iman and Ihsan</p>
            <h1 className="mt-1 bg-gradient-to-b from-[#fff1cc] to-[#d9a54e] bg-clip-text font-display text-[clamp(2.4rem,10vw,4.2rem)] font-semibold leading-none tracking-[0.04em] text-transparent [filter:drop-shadow(0_3px_18px_rgba(0,0,0,0.55))] short:text-[1.5rem]">
              The Pyramid
            </h1>
            <p className="mx-auto mt-4 max-w-[36ch] font-body text-[clamp(1.1rem,4.2vw,1.35rem)] leading-snug text-ivory/85 short:hidden">
              Three levels of faith. Each gold seal is a lesson you can open.
            </p>
          </motion.div>

          <motion.div className="relative mx-auto mt-6 w-full max-w-[max(300px,min(640px,calc((100svh-440px)*1.33)))] short:mt-1 short:max-w-[min(380px,calc((100svh-110px)*1.33))]" initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.25, duration: 1.4, ease: 'easeOut' }}>
            <Monument
              className={`relative z-10 -mb-6 w-full sm:-mb-10 ${focus ? '[mask-image:radial-gradient(ellipse_70%_75%_at_50%_50%,#000_60%,transparent_100%)]' : ''}`}
              scenery={false}
              meters={c.meters}
              done={c.done}
              lit={c.lit}
              peak={c.peak}
              start={placed ? c.current : undefined}
              recommended={placed ? next : undefined}
              selected={selected}
              onSelect={fromPyramid}
              focus={focus}
              onFocus={look}
            />
          </motion.div>
        </div>
        <div className="relative">
          <Dunes />
          <div className="h-[64px] sm:h-[92px]" />
        </div>
        <div className={`relative bg-[#1d140d] px-5 pb-12 pt-3 ${focus && narrow ? 'invisible' : ''}`} aria-hidden={focus && narrow ? true : undefined}>
          {Cta}
          <p className="mx-auto mt-3 text-center font-body text-[1rem] italic text-ivory/55">Tap any part of the pyramid to look closer.</p>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {focus && <Brief key={`${focus}-${selected || ''}`} focus={focus} unit={selected} c={c} say={say} onLevel={look} onUnit={(id) => setSelected(id)} onClose={back} />}
      </AnimatePresence>

      {placed && (
        <section className="bg-[#1d140d] px-5 pb-6 sm:px-8">
          <div className="mx-auto max-w-[600px]">
            <ClimbCard c={c} stale={stale} />
          </div>
        </section>
      )}

      <footer className={`mx-auto max-w-[640px] px-5 pb-32 pt-10 text-center sm:pb-12 ${focus && narrow ? 'invisible' : ''}`}>
        {mode && (
          <div className="flex justify-center">
            <ModePicker />
          </div>
        )}
        <Disclaimer />
        <a href="#/about" className="mt-2 inline-flex min-h-[44px] items-center font-body text-[1.02rem] text-gold-hi/85 underline decoration-gold/40 underline-offset-4">
          About Amanah: sources and privacy
        </a>
      </footer>
    </div>
  );
}

// Night overhead, the last light low behind the monument (further right on wide screens, where it stands).
const SKY =
  'radial-gradient(115% 62% at var(--glow-x, 50%) 100%, rgba(240,150,82,0.58) 0%, rgba(184,92,52,0.3) 32%, rgba(59,42,74,0) 64%), linear-gradient(180deg, #070a1a 0%, #0e1530 30%, #251f43 55%, #4f2f47 74%, #8d4533 90%, #b85a33 100%)';

function Dunes() {
  return (
    <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-[64px] w-full sm:h-[92px]" viewBox="0 0 1200 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 52 C170 26 330 50 520 38 C700 26 860 52 1020 36 C1100 28 1160 34 1200 38 V100 H0z" fill="#4a2c1b" opacity="0.85" />
      <path d="M0 70 C220 52 420 78 640 62 C840 50 1000 74 1200 60 V100 H0z" fill="#2c1b11" />
      <path d="M0 88 C300 80 600 92 900 84 C1050 80 1150 86 1200 84 V100 H0z" fill="#1d140d" />
    </svg>
  );
}

function StoriesStrip() {
  return (
    <section className="mx-auto max-w-[1120px] px-5 pt-12 sm:px-8" aria-labelledby="stories-heading">
      <h2 id="stories-heading" className="font-body text-[1.7rem] font-semibold leading-tight text-gold-hi">
        Walk through the stories
      </h2>
      <p className="mt-1 max-w-[56ch] font-body text-[1.12rem] leading-[1.45] text-ivory/75">
        192 painted scenes, from the creation of the heavens to the prophets of old, with verses of the Quran in Arabic and English. Allah is never depicted, and the prophets appear only as distant light.
      </p>
      <ul className="-mx-5 mt-5 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto px-5 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0">
        {STORIES.map((s) => (
          <li key={s.id} className="w-[76vw] max-w-[340px] shrink-0 snap-start sm:w-auto sm:max-w-none">
            <a
              href={`#/scene/${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                go(`/scene/${s.id}`);
              }}
              className="group block rounded-lg outline-none"
            >
              <img src={s.img} alt="" loading="lazy" width="800" height="450" className="aspect-video w-full rounded-lg object-cover ring-1 ring-gold/20 transition-shadow group-hover:ring-gold/60 group-focus-visible:ring-2 group-focus-visible:ring-gold-hi" />
              <span className="mt-2 block font-body text-[1.15rem] leading-snug text-ivory">{s.title}</span>
              <span className="block font-body text-[1rem] italic text-ivory/60">{s.who}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** For someone who has placed themselves: where they are on the climb. */
function ClimbCard({ c, stale }) {
  const level = levelById[c.current];
  const idx = LEVELS.findIndex((l) => l.id === c.current);
  const above = LEVELS[idx + 1];
  return (
    <section className="mt-6 rounded-xl border border-gold/20 bg-black/25 p-4" aria-label="Your climb">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="font-body text-[1.05rem] italic text-ivory/65">{c.peak ? 'Every stone is lit' : 'You are climbing'}</div>
          <div className="font-display text-[1.45rem] font-semibold text-gold-hi">{level.title}</div>
        </div>
      </div>
      <div className="mt-3">
        <Meter value={c.currentProgress} label={above && !c.peak ? `Toward ${above.title}` : `${level.title} progress`} />
      </div>
      <p className="mt-2 font-body text-[0.98rem] text-ivory/55">Overall understanding {c.overall}%</p>
      {stale && (
        <p className="mt-3 font-body text-[1.02rem] text-ivory/75">
          It has been a while since you last reflected.{' '}
          <button type="button" className="text-gold-hi underline underline-offset-4" onClick={() => go('/pyramid/placement')}>
            Reflect again
          </button>
        </p>
      )}
    </section>
  );
}

function UnitCard({ id, meter, done, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  }, [id]);
  const u = unitById[id];
  const status = unitStatus(id);
  const learned = useStore((s) => Object.keys(s.learned).length);
  const seen = useStore((s) => s.seen);
  const say = useSay();
  return (
    <motion.section
      ref={ref}
      className="parchment cartouche relative mt-3 scroll-mb-28 px-5 pb-4 pt-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      aria-label={`${u.title}: ${u.english}`}
    >
      <button type="button" className="absolute right-2 top-2 grid h-11 w-11 place-items-center text-ink-soft hover:text-ink" onClick={onClose} aria-label="Close">
        <Icon name="close" className="h-4 w-4" />
      </button>
      <div className="font-body text-[1rem] italic text-ink-soft">{levelById[u.level].title}</div>
      <div className="flex items-baseline gap-3 pr-10">
        <h2 className="font-display text-[1.3rem] font-semibold text-ink">{u.title}</h2>
      </div>
      <p className="font-body text-[1.05rem] text-ink-soft">{say(u.english)}</p>
      <div className="mt-2">
        <Meter value={meter} label={done ? 'Completed' : 'Your meter'} tone="parchment" />
      </div>
      {status === 'ready' && (
        <button type="button" className="btn-gold mt-3" onClick={() => go(`/unit/${id}`)}>
          <Icon name="play" className="h-4 w-4" />
          {done ? 'Take it again' : 'Begin'}
        </button>
      )}
      {status === 'history' && (
        <>
          <p className="mt-2 font-body text-[1rem] leading-snug text-ink-soft">
            The stories of the prophets live here. This stone fills as you finish the story's lessons ({learned} so far).
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-gold" onClick={() => go('/stories')}>
              <Icon name="book" className="h-4 w-4" />
              {learned || Object.keys(seen).length ? 'Continue the stories' : 'Begin the stories'}
            </button>
            <button type="button" className="btn-ink" onClick={() => go('/map')}>
              <Icon name="map" className="h-4 w-4" />
              Map
            </button>
          </div>
        </>
      )}
      {status === 'soon' && (
        <>
          <p className="mt-2 font-body text-[1rem] italic text-ink-soft">This lesson path is still being written. Meanwhile, you can explore:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PLAYABLE.map((pid) => (
              <button key={pid} type="button" className="btn-ink" onClick={() => go(unitHref(pid))}>
                {unitStatus(pid) === 'history' ? 'The stories of the prophets' : `${unitById[pid].title}, ${say(unitById[pid].english).toLowerCase()}`}
              </button>
            ))}
          </div>
        </>
      )}
    </motion.section>
  );
}

// ── Placement ─────────────────────────────────────────────

function Placement() {
  const { mode } = useMode();
  const path = pathOf(mode);
  const questions = placementQuestions(path);
  const [i, setI] = useState(-1); // -1 = the opening page
  const [answers, setAnswers] = useState({}); // questionId → points (what is saved)
  const [picked, setPicked] = useState({}); // questionId → option index (which button is lit)

  if (!mode) {
    return (
      <Shell back="/" title="Reflection">
        <h1 className="mt-6 font-body text-[1.75rem] font-semibold leading-tight text-gold-hi">First, how would you like to explore?</h1>
        <p className="mt-1 font-body text-[1.1rem] text-ivory/70">This changes the wording around the stories, not the stories themselves. You can switch at any time.</p>
        <div className="mt-5">
          <ModePicker full />
        </div>
      </Shell>
    );
  }

  const finish = (all) => {
    const r = placementResult(path, all);
    savePlacement({ path, answers: all, at: new Date().toISOString(), start: r.start });
    go('/pyramid/result');
  };
  const answer = (q, k, points) => {
    const all = { ...answers, [q.id]: points };
    setAnswers(all);
    setPicked({ ...picked, [q.id]: k });
    setTimeout(() => (i + 1 < questions.length ? setI(i + 1) : finish(all)), 260);
  };

  if (i < 0) {
    return (
      <Shell back="/" title="Reflection">
        <div className="parchment cartouche mt-6 px-6 py-6">
          <h1 className="font-display text-[1.4rem] font-semibold text-ink">Before you climb</h1>
          <p className="mt-2 font-body text-[1.12rem] leading-snug text-ink">
            {mode === 'muslim'
              ? `${questions.length} questions about where you are today. The pyramid then suggests where to begin.`
              : `${questions.length} questions about your own values. The pyramid then suggests where to begin.`}
          </p>
          <p className="mt-2 font-body text-[1.05rem] text-ink-soft">Not a grade. Only you see your answers.</p>
          <div className="mt-5 flex justify-end">
            <button type="button" className="btn-gold" onClick={() => setI(0)} autoFocus>
              Begin
            </button>
          </div>
        </div>
        <Disclaimer />
      </Shell>
    );
  }

  const q = questions[i];
  const options = q.type === 'scale' ? SCALE : q.options;
  return (
    <Shell back="/" title="Reflection">
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {questions.map((x, k) => (
          <span key={x.id} className={`h-1 flex-1 rounded-full ${k < i ? 'bg-gold' : k === i ? 'bg-gold-hi' : 'bg-ivory/15'}`} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.section key={q.id} className="mt-6 flex flex-1 flex-col" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }}>
          <p className="font-body text-[1.08rem] italic text-gold/85">
            Question {i + 1} of {questions.length}
          </p>
          <h1 className="mt-2 font-body text-[1.45rem] leading-snug text-ivory">{inMode(q.text, mode)}</h1>
          <div className="mt-5 grid gap-2.5" role="radiogroup" aria-label={inMode(q.text, mode)}>
            {options.map((o, k) => {
              const on = picked[q.id] === k;
              return (
                <button
                  key={o.label}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => answer(q, k, o.points)}
                  className={`min-h-[52px] rounded-xl border px-4 py-3 text-left font-body text-[1.12rem] transition-colors ${
                    on ? 'border-gold-hi bg-[#3c2a12]/80 text-gold-hi' : 'border-gold/30 bg-black/30 text-ivory hover:border-gold/70'
                  }`}
                >
                  {inMode(o.label, mode)}
                </button>
              );
            })}
          </div>
          <div className="mt-auto flex justify-between pt-6">
            <button type="button" className="hud-btn" onClick={() => setI(i - 1)}>
              <Icon name="prev" className="h-4 w-4" />
              {i === 0 ? 'About these questions' : 'Previous'}
            </button>
            {answers[q.id] !== undefined && (
              <button type="button" className="hud-btn" onClick={() => (i + 1 < questions.length ? setI(i + 1) : finish(answers))}>
                Next
                <Icon name="next" className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.section>
      </AnimatePresence>
    </Shell>
  );
}

// ── Result ────────────────────────────────────────────────

function Result() {
  const { mode } = useMode();
  const c = useClimb();
  const p = c.state.placement;
  useEffect(() => {
    if (!p) go('/pyramid/placement');
  }, [p]);
  if (!p) return null;
  const r = placementResult(p.path, p.answers);
  const level = levelById[r.start];
  const rec = r.recommended && unitById[r.recommended];
  return (
    <Shell here="pyramid">
      <Monument className="mx-auto w-full max-w-[460px]" meters={c.meters} done={c.done} lit={c.lit} peak={c.peak} start={r.start} recommended={r.recommended} />
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}>
        <p className="text-center font-body text-[1.08rem] italic text-gold/85">{mode === 'curious' ? 'A good place to start exploring' : 'Begin your climb at'}</p>
        <h1 className="text-center font-display text-[2rem] font-semibold text-gold-hi">{level.title}</h1>
        <p className="text-center font-body text-[1.05rem] text-ivory/75">{inMode(level.meaning, mode)}</p>
        {!r.startReady && rec && (
          <p className="mx-auto mt-2 max-w-[44ch] text-center font-body text-[1rem] italic text-ivory/65">
            The lessons for {level.title} are still being written, so for now we suggest {unitStatus(rec.id) === 'history' ? 'the stories of the prophets' : rec.english.toLowerCase()} below.
          </p>
        )}
        <Rule className="mx-auto my-4 h-3 w-44 text-gold/60" />

        <h2 className="font-body text-[1.08rem] italic text-gold/85">Where you feel strong</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {r.strongest.map((id) => (
            <UnitChip key={id} id={id} />
          ))}
        </div>
        {r.growing.length > 0 && (
          <>
            <h2 className="mt-4 font-body text-[1.08rem] italic text-gold/85">Where you can grow</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {r.growing.map((id) => (
                <UnitChip key={id} id={id} />
              ))}
            </div>
          </>
        )}

        {rec && (
          <div className="parchment cartouche mt-5 px-5 py-4">
            <div className="font-body text-[1.05rem] italic text-ink-soft">{mode === 'curious' ? 'A good first lesson' : 'A good first step'}</div>
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-[1.25rem] font-semibold text-ink">{rec.title}</h2>
            </div>
            <p className="font-body text-[1.05rem] text-ink-soft">{inMode(rec.english, mode)}</p>
            <button type="button" className="btn-gold mt-3" onClick={() => go(unitHref(rec.id))} ref={(el) => el?.focus({ preventScroll: true })}>
              <Icon name="play" className="h-4 w-4" />
              {unitStatus(rec.id) === 'history' ? 'Begin the stories' : mode === 'curious' ? `Explore ${rec.title}` : `Begin ${rec.title}`}
            </button>
          </div>
        )}
        <p className="mt-4 font-body text-[1rem] leading-snug text-ivory/65">
          {mode === 'muslim'
            ? 'This is a starting point, not a verdict. Every level is open to you; reflect again whenever you like.'
            : 'This is only a suggestion of where to start. Every level is open to you.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="hud-btn" onClick={() => go('/pyramid')}>
            See the whole pyramid
          </button>
          <button type="button" className="hud-btn" onClick={() => go('/pyramid/placement')}>
            Reflect again
          </button>
        </div>
      </motion.section>
      <Disclaimer />
    </Shell>
  );
}

// ── Progress ──────────────────────────────────────────────

function Progress() {
  const c = useClimb();
  const say = useSay();
  const [confirm, setConfirm] = useState(false);
  const [gone, setGone] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [shared, setShared] = useState('');
  const [openLevel, setOpenLevel] = useState(null); // a level's lessons show when its row is tapped
  const learned = Object.keys(c.state.learned || {}).length;
  const here = levelById[c.current];
  // The reader's private reflections, in the pyramid's order, then the story's.
  const notes = Object.entries(c.state.journal || {})
    .filter(([, text]) => text && text.trim())
    .map(([key, text]) => {
      const unit = key.startsWith('unit:') && unitById[key.slice(5)];
      return unit
        ? { key, text, label: unit.title, sub: say(unit.english), href: `/unit/${unit.id}?step=reflection`, order: UNITS.indexOf(unit) }
        : { key, text, label: partName(key), sub: 'Story lesson', href: `/lesson/${key.split(':')[0]}/${key.split(':')[1]}`, order: 100 + Number(key.split(':')[0]) * 10 + Number(key.split(':')[1]) };
    })
    .sort((a, b) => a.order - b.order);
  const levelsTopDown = [...LEVELS].reverse();
  return (
    <Shell here="progress" stars wide>
      <motion.header className="mt-4 text-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <p className="font-body text-[1.1rem] italic text-gold-hi/80">Your climb, private to you</p>
        <h1 className="mt-1 bg-gradient-to-b from-[#fff1cc] to-[#d9a54e] bg-clip-text font-display text-[clamp(2rem,8vw,3rem)] font-semibold leading-none tracking-[0.03em] text-transparent">Progress</h1>
      </motion.header>

      <div className="mt-6 grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Monument className="mx-auto w-full max-w-[380px]" meters={c.meters} done={c.done} lit={c.lit} peak={c.peak} start={c.state.placement ? c.current : undefined} />
        <section className="rounded-2xl border border-gold/25 bg-black/30 p-5" aria-label="Where you are">
          <div className="font-body text-[1.05rem] italic text-ivory/60">{c.peak ? 'Every stone is lit' : 'You are climbing'}</div>
          <div className="font-display text-[1.7rem] font-semibold leading-tight text-gold-hi">{here.title}</div>
          <p className="font-body text-[1.02rem] leading-snug text-ivory/65">{say(here.meaning.split(':')[0])}</p>
          <div className="mt-4 space-y-3">
            {[...c.levels].reverse().map((l) => (
              <Meter key={l.id} value={l.progress} label={`${l.title}: ${l.done} of ${l.total} lessons${l.lit ? ', lit' : ''}`} />
            ))}
          </div>
          <p className="mt-4 border-t border-gold/15 pt-3 font-body text-[1.02rem] text-ivory/70">
            <span className="mr-5 inline-block whitespace-nowrap">
              Overall understanding <span className="text-gold-hi">{c.overall}%</span>
            </span>
            <span className="inline-block whitespace-nowrap">
              Story lessons <span className="text-gold-hi">{learned} of {HISTORY_PARTS}</span>
            </span>
          </p>
        </section>
      </div>

      <section className="mt-8" aria-labelledby="sky-h">
        <h2 id="sky-h" className="font-body text-[1.35rem] font-semibold text-gold-hi">
          Your sky
        </h2>
        <Sky className="mt-2" learned={c.state.learned} done={c.done} />
        <a href="#/paths" className="mt-2 inline-flex min-h-[44px] items-center font-body text-[1.05rem] text-gold-hi/90 underline decoration-gold/40 underline-offset-4">
          Paths through the stories
        </a>
      </section>

      <div className="mt-8 space-y-3">
        {levelsTopDown.map((l) => (
          <section key={l.id} className="rounded-2xl border border-gold/20 bg-[linear-gradient(160deg,rgba(255,226,160,0.07),rgba(255,226,160,0.015))] px-4 py-1 sm:px-5" aria-labelledby={`lv-${l.id}`}>
            <h2 id={`lv-${l.id}`}>
              <button type="button" className="flex min-h-[56px] w-full items-center justify-between gap-3 text-left" aria-expanded={openLevel === l.id} onClick={() => setOpenLevel(openLevel === l.id ? null : l.id)}>
                <span className="font-display text-[1.25rem] font-semibold text-gold-hi">{l.title}</span>
                <span className="font-body text-[1rem] italic text-ivory/60">
                  {l.units.filter((u) => c.done[u.id]).length} of {l.units.length}, {openLevel === l.id ? 'hide' : 'show'} lessons
                </span>
              </button>
            </h2>
            <ul className={`divide-y divide-gold/10 border-t border-gold/15 ${openLevel === l.id ? '' : 'hidden'}`}>
              {l.units.map((u) => {
                const status = unitStatus(u.id);
                const m = c.meters[u.id] || 0;
                const done = c.done[u.id];
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      className="group flex min-h-[60px] w-full items-center gap-3 py-2 text-left disabled:opacity-55"
                      onClick={() => go(unitHref(u.id))}
                      disabled={status === 'soon'}
                      aria-label={`${u.title}, ${say(u.english)}: ${m}%${done ? ', completed' : ''}. Open`}
                    >
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${status !== 'soon' ? 'bg-[radial-gradient(circle_at_35%_30%,#fff4cf,#e9b95a_55%,#a8711f)]' : 'bg-[#5a3d1f]/70'} ${done ? 'shadow-[0_0_14px_rgba(255,224,138,0.7)]' : ''}`}>
                        {done && <Icon name="check" className="h-3.5 w-3.5 text-[#3a2208]" />}
                      </span>
                      <span className="w-[42%] min-w-0 shrink-0 sm:w-[34%]">
                        <span className="block font-display text-[0.98rem] font-semibold leading-tight text-ivory group-hover:text-gold-hi">{u.title}</span>
                        <span className="block truncate font-body text-[0.95rem] leading-tight text-ivory/55">
                          {u.history ? `${learned} of ${HISTORY_PARTS} story lessons` : say(u.english)}
                        </span>
                      </span>
                      <span className="flex-1">
                        <Meter value={m} />
                      </span>
                      <span className="w-11 shrink-0 text-right font-body text-[0.98rem] text-ivory/65">{m}%</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-gold/20 bg-black/25 p-5" aria-labelledby="notes-h">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="notes-h" className="font-display text-[1.15rem] font-semibold text-gold-hi">
            Your private notes
          </h2>
          <span className="font-body text-[1rem] italic text-ivory/55">{notes.length ? `${notes.length} written` : 'None yet'}</span>
        </div>
        <p className="mt-1 font-body text-[1.02rem] leading-snug text-ivory/65">Kept only in this browser.</p>
        {notes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="hud-btn" onClick={() => setShowNotes((v) => !v)} aria-expanded={showNotes}>
              {showNotes ? 'Hide my notes' : 'Show my notes'}
            </button>
            <button
              type="button"
              className="hud-btn"
              onClick={() => download('amanah-notes.txt', `My Amanah notes\n\n${notes.map((n) => `${n.label}\n${n.sub}\n${n.text}`).join('\n\n')}\n`)}
            >
              Download my notes
            </button>
          </div>
        )}
        {notes.length > 0 && <p className="mt-2 font-body text-[0.95rem] italic text-ivory/50">Clearing the browser erases them. Download a copy to keep.</p>}
        <AnimatePresence initial={false}>
          {showNotes && (
            <motion.ul className="mt-4 space-y-3" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              {notes.map((n) => (
                <li key={n.key} className="rounded-xl border border-gold/15 bg-white/[0.03] p-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-[0.98rem] font-semibold text-ivory">{n.label}</span>
                    <button type="button" className="shrink-0 font-body text-[1rem] text-gold-hi/85 underline decoration-gold/40 underline-offset-4" onClick={() => go(n.href)}>
                      Open
                    </button>
                  </div>
                  <div className="font-body text-[0.95rem] italic text-ivory/50">{n.sub}</div>
                  <p className="mt-1 whitespace-pre-wrap font-body text-[1.05rem] leading-snug text-ivory/85">{n.text}</p>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" className="hud-btn" onClick={() => go('/pyramid/placement')}>
          Reflect again
        </button>
        <button type="button" className="hud-btn" onClick={() => go('/pyramid')}>
          Back to the pyramid
        </button>
        <button type="button" className="hud-btn" onClick={async () => setShared(shareMessage(await share()))}>
          Share Amanah
        </button>
        {shared && (
          <span role="status" className="font-body text-[1rem] italic text-ivory/70">
            {shared}
          </span>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-blood/40 bg-black/30 p-5" aria-live="polite">
        <h2 className="font-display text-[1.05rem] text-ivory">Your data</h2>
        <p className="mt-1 font-body text-[1rem] leading-snug text-ivory/70">
          Stored only in this browser. Nothing is sent anywhere.{' '}
          <a href="#/about" className="text-gold-hi/85 underline decoration-gold/40 underline-offset-4">
            More about privacy and sources
          </a>
        </p>
        {gone ? (
          <p className="mt-3 font-body text-[1rem] text-gold-hi">Your data has been deleted from this browser.</p>
        ) : confirm ? (
          <div className="mt-3">
            <p className="font-body text-[1rem] text-ivory">
              This removes your reflection answers, every unit's progress, the chronicle's progress, your private notes and your settings. It can't be undone.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="hud-btn border-blood/70 text-[#f0b3a6]"
                onClick={() => {
                  deleteAllData();
                  setGone(true);
                  setConfirm(false);
                }}
              >
                Delete everything
              </button>
              <button type="button" className="hud-btn" onClick={() => setConfirm(false)} autoFocus>
                Keep my data
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="hud-btn mt-3" onClick={() => setConfirm(true)}>
            Delete my data
          </button>
        )}
      </section>
      <Disclaimer />
    </Shell>
  );
}
