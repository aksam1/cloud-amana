import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { deleteAllData, savePlacement, useStore } from '../lib/store.js';
import { inMode, useMode } from '../lib/words.js';
import { go } from '../lib/router.js';
import { climb, completed, DISCLAIMER, levelById, LEVELS, pathOf, placementQuestions, placementResult, playable, PLAYABLE, SCALE, unitById, UNITS, unitStatus } from '../lib/pyramid.js';
import { GeoField, Icon, Rule } from './Ornaments.jsx';
import { ModePicker } from './ModePicker.jsx';
import Monument from './Monument.jsx';
import Nav from './Nav.jsx';
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
  return <Landing />;
}

// ── Shared pieces ─────────────────────────────────────────

function Shell({ children, back, title, stars = false, here }) {
  return (
    <div className="thin-scroll relative h-full w-full overflow-y-auto" style={{ background: NIGHT }}>
      {stars && <Stars />}
      <div className="relative z-10 mx-auto flex min-h-full max-w-[600px] flex-col px-5 pb-28 pt-3 sm:pb-6">
        {here && (
          <div className="mb-3">
            <Nav here={here} />
          </div>
        )}
        {(back || title) && (
          <header className="mb-2 flex min-h-[48px] items-center gap-3">
            {back && (
              <button type="button" className="hud-btn icon" onClick={() => go(back)} aria-label="Back">
                <Icon name="prev" className="h-4 w-4" />
              </button>
            )}
            {title && <div className="font-body text-[1.1rem] italic text-gold/85">{title}</div>}
          </header>
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
      <div className={`h-2 overflow-hidden rounded-full ${tone === 'night' ? 'bg-ivory/12' : 'bg-[#5a3d22]/15'}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
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
      : { label: 'Begin your journey', href: '/pyramid/placement', note: 'A few private questions, then your first story. About 3 minutes.' };

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

      <div className="relative z-10 mx-auto flex h-full max-w-[1100px] flex-col px-6 pb-28 pt-5 sm:px-10 sm:pb-12">
        <header className="flex items-center justify-between gap-6">
          <span lang="ar" className="font-ruqaa text-[1.8rem] leading-none text-gold-hi" aria-hidden="true">
            الأمانة
          </span>
          <div className="sm:w-[580px]">
            <Nav here="home" />
          </div>
        </header>

        <motion.main className="mt-auto flex flex-col items-center text-center" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 1.2 }}>
          <h1 className="bg-gradient-to-b from-[#fff1cc] to-[#d9a54e] bg-clip-text font-display text-[clamp(3rem,15vw,6.5rem)] font-semibold leading-none tracking-[0.06em] text-transparent [filter:drop-shadow(0_4px_24px_rgba(0,0,0,0.6))]">
            Amanah
          </h1>
          <p className="mt-4 max-w-[30ch] font-body text-[clamp(1.25rem,4.8vw,1.6rem)] leading-snug text-ivory/90">The stories of the prophets, told in light.</p>
          <button type="button" className="btn-gold mt-8" onClick={() => go(cta.href)} autoFocus>
            <Icon name="play" className="h-4 w-4" />
            {cta.label}
          </button>
          <p className="mt-3 max-w-[36ch] font-body text-[1.05rem] italic text-ivory/65">{cta.note}</p>
          <div className="mt-4 flex gap-6 font-body text-[1.08rem]">
            <button type="button" className="min-h-[44px] text-gold-hi/90 underline decoration-gold/40 underline-offset-4" onClick={() => go('/stories')}>
              Watch the stories
            </button>
            <button type="button" className="min-h-[44px] text-gold-hi/90 underline decoration-gold/40 underline-offset-4" onClick={() => go('/pyramid')}>
              See the pyramid
            </button>
          </div>
          <p className="mt-6 max-w-[48ch] font-body text-[0.92rem] italic text-ivory/45">{DISCLAIMER}</p>
        </motion.main>
      </div>
    </div>
  );
}

// Stills from the chronicle, in story order (captured from the scenes themselves; about 48 KB together).
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
          label: unitStatus(next) === 'history' ? 'Continue the stories' : `Begin ${unitById[next].title}`,
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

  return (
    <div className="thin-scroll relative h-full w-full overflow-y-auto overflow-x-hidden bg-night">
      {/* ── One scene, one screen: dusk over the desert, the monument in the last light, one button ── */}
      <section className="relative isolate flex min-h-full flex-col overflow-hidden" style={{ background: SKY }}>
        <Stars />
        <div className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-5 pt-5 sm:px-10">
          <header className="flex items-center justify-between gap-6">
            <a href="#/" onClick={(e) => { e.preventDefault(); go('/'); }} aria-label="Amanah, home">
              <span lang="ar" className="font-ruqaa text-[1.8rem] leading-none text-gold-hi">
                الأمانة
              </span>
            </a>
            <div className="sm:w-[580px]">
              <Nav here="pyramid" />
            </div>
          </header>

          <motion.div className="mt-6 text-center sm:mt-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
            <h1 className="bg-gradient-to-b from-[#fff1cc] to-[#d9a54e] bg-clip-text font-display text-[clamp(2rem,9vw,3.6rem)] font-semibold leading-none tracking-[0.04em] text-transparent [filter:drop-shadow(0_3px_18px_rgba(0,0,0,0.55))]">
              The Pyramid
            </h1>
            <p className="mx-auto mt-3 max-w-[34ch] font-body text-[clamp(1.1rem,4.2vw,1.35rem)] leading-snug text-ivory/85">Islam, Iman and Ihsan: climb them one stone at a time.</p>
          </motion.div>

          <motion.div className="relative mx-auto mt-auto w-full max-w-[max(320px,min(620px,calc((100svh-500px)*1.14)))] pt-4" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1.3, ease: 'easeOut' }}>
            <Monument
              className="relative z-10 -mb-5 w-full sm:-mb-8"
              scenery={false}
              meters={c.meters}
              done={c.done}
              lit={c.lit}
              peak={c.peak}
              start={placed ? c.current : undefined}
              recommended={placed ? next : undefined}
              selected={selected}
              onSelect={(id) => setSelected((s) => (s === id ? null : id))}
            />
          </motion.div>
        </div>
        <div className="relative">
          <Dunes />
          <div className="h-[64px] sm:h-[92px]" />
        </div>
        <div className="relative bg-[#1d140d] px-5 pb-28 pt-2 sm:pb-10">
          {Cta}
          <p className="mx-auto mt-4 max-w-[40ch] text-center font-body text-[1rem] italic text-ivory/55">Gold-edged stones are ready. Tap one to open it.</p>
        </div>
      </section>

      {(selected || placed) && (
        <section className="bg-gradient-to-b from-[#1d140d] to-night px-5 pb-4 sm:px-8">
          <div className="mx-auto max-w-[600px]">
            <AnimatePresence>{selected && <UnitCard key={selected} id={selected} meter={c.meters[selected]} done={c.done[selected]} onClose={() => setSelected(null)} />}</AnimatePresence>
            {placed && <ClimbCard c={c} stale={stale} />}
          </div>
        </section>
      )}

      <footer className="mx-auto max-w-[640px] px-5 pb-32 pt-10 text-center sm:pb-12">
        {mode && (
          <div className="flex justify-center">
            <ModePicker />
          </div>
        )}
        <Disclaimer />
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
        <div lang="ar" dir="rtl" className="font-ruqaa text-[1.6rem] text-gold/80">
          {level.arabic}
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
        <span lang="ar" dir="rtl" className="font-quran text-[1.35rem] text-ink-soft">
          {u.arabic}
        </span>
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
              ? `These ${questions.length} questions are a moment to reflect on where you are today, so the pyramid can suggest where to begin.`
              : `These ${questions.length} questions ask about your own values and curiosity, so the pyramid can suggest where to begin.`}
          </p>
          <ul className="mt-3 space-y-1 font-body text-[1.05rem] text-ink-soft">
            <li>· It is not a grade, and there are no wrong answers.</li>
            <li>· Only you will see your answers. They stay on this device.</li>
            <li>· You can reflect again whenever you like.</li>
          </ul>
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
        <p className="text-center font-body text-[1.08rem] italic text-gold/85">Begin your climb at</p>
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
            <div className="font-body text-[1.05rem] italic text-ink-soft">A good first step</div>
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-[1.25rem] font-semibold text-ink">{rec.title}</h2>
              <span lang="ar" dir="rtl" className="font-quran text-[1.3rem] text-ink-soft">
                {rec.arabic}
              </span>
            </div>
            <p className="font-body text-[1.05rem] text-ink-soft">{inMode(rec.english, mode)}</p>
            <button type="button" className="btn-gold mt-3" onClick={() => go(unitHref(rec.id))} autoFocus>
              <Icon name="play" className="h-4 w-4" />
              {unitStatus(rec.id) === 'history' ? 'Begin the stories' : `Begin ${rec.title}`}
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
  const [confirm, setConfirm] = useState(false);
  const [gone, setGone] = useState(false);
  return (
    <Shell here="progress">
      <section className="rounded-xl border border-gold/25 bg-black/30 p-4">
        <div className="font-body text-[1.08rem] italic text-gold/85">You are climbing</div>
        <div className="font-display text-[1.6rem] font-semibold text-gold-hi">{levelById[c.current].title}</div>
        <div className="mt-3 space-y-3">
          {c.levels.map((l) => (
            <Meter key={l.id} value={l.progress} label={`${l.title}: ${l.done} of ${l.total} units${l.lit ? ', lit' : ''}`} />
          ))}
        </div>
        <p className="mt-3 font-body text-[1rem] text-ivory/60">Overall understanding {c.overall}%</p>
      </section>

      {LEVELS.map((l) => (
        <section key={l.id} className="mt-5">
          <h2 className="font-display text-[1rem] text-gold-hi">{l.title}</h2>
          <ul className="mt-2 divide-y divide-gold/10">
            {l.units.map((u) => {
              const status = unitStatus(u.id);
              return (
                <li key={u.id}>
                  <button type="button" className="flex min-h-[52px] w-full items-center gap-3 py-2 text-left disabled:opacity-55" onClick={() => go(unitHref(u.id))} disabled={status === 'soon'}>
                    <span className="w-28 shrink-0 font-display text-[0.95rem] text-ivory">{u.title}</span>
                    <span className="flex-1">
                      <Meter value={c.meters[u.id]} />
                    </span>
                    <span className="w-16 shrink-0 text-right font-body text-[0.95rem] text-ivory/60">{status === 'soon' ? 'soon' : `${c.meters[u.id]}%`}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="mt-6 flex flex-wrap gap-2">
        <button type="button" className="hud-btn" onClick={() => go('/pyramid/placement')}>
          Reflect again
        </button>
      </section>

      <section className="mt-6 rounded-xl border border-blood/40 bg-black/30 p-4" aria-live="polite">
        <h2 className="font-display text-[1.05rem] text-ivory">Your data</h2>
        <p className="mt-1 font-body text-[1rem] leading-snug text-ivory/70">
          Everything here is stored only in this browser. Nothing is sent anywhere, and no one else can see your answers or notes.
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
