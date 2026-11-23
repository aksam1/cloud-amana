import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
// the verse the app is named for, as the home page's opening tells it (all of ayahs.json is about 280 KB)
import TRUST from 'virtual:ayah/33:72';
import { go } from '../lib/router.js';
import { FIRST_STORY, quranLink } from '../lib/site.js';
import { GUIDE_PLACES, newcomer } from '../lib/discover.js';
import { storyResume } from '../lib/sceneIndex.js';
import { dismissHint, markFound, setPref, useStore } from '../lib/store.js';
import { Icon } from './Ornaments.jsx';
import { Shell, whereInStory } from './Pyramid.jsx';

/*
 * The short guide (#/guide?step=<id>): four things to try, one at a time, then where to start. Each step is
 * done by doing it: move a practice scene on, open a verse's Arabic, answer one lesson question, find Story in
 * the real menu. Next appears once the step is done; "Skip the guide" is on every step.
 *
 * A newcomer is taken here from #/begin once they have chosen a view (src/lib/discover.js `newcomer`). Finishing
 * or skipping is remembered (prefs.guide), and from then on the guide is an offer: on the home page, on #/begin,
 * in Settings and About, and behind the ? in a story.
 *
 * `?step=all` is every place on one page (what is where), for those who would rather read than try.
 * The step buttons say Previous and Next, as the reflection's do: "Back" (top left) only ever means leave the page.
 */
// a hand on a screen is told about taps and swipes, a keyboard about the arrow keys
const TOUCH = typeof window !== 'undefined' && !!window.matchMedia?.('(hover: none)').matches;
const TAP = TOUCH ? 'tap' : 'click';
const TOUR = [
  {
    id: 'moments',
    title: 'A story, one moment at a time',
    line: 'Every scene is told in short moments, and you move it on.',
    todo: TOUCH ? 'Try it: tap the picture.' : 'Try it: click the picture, or press →.',
    done: TOUCH ? 'That is all a scene asks. A swipe the other way goes back.' : 'That is all a scene asks. ← goes back a moment.',
  },
  {
    id: 'verse',
    title: 'Every verse shows its source',
    line: 'When a scene quotes the Quran, it names the place.',
    todo: `Try it: ${TAP} the reference to read the Arabic.`,
    done: 'Every verse in Amanah opens like this.',
  },
  {
    id: 'lesson',
    title: 'A short lesson after each part',
    line: 'Each part of the story closes with a short lesson: a verse, a question, a thought. Always your choice.',
    todo: 'Try one question.',
    done: 'Yes. That Trust, the amanah, is what this app is named for.',
  },
  {
    id: 'menu',
    title: 'Your place, always',
    line: 'Story, in the menu, holds every chapter in order and keeps your place.',
    todo: `Try it: ${TAP} Story, lit up in the menu.`,
    done: 'Found it. More places join the menu as the story reaches them, each with a small gold dot the first time.',
  },
];
const LAST = 'start';
const ORDER = [...TOUR.map((s) => s.id), LAST];

// ── The practice scene ─────────────────────────────────────

const MOMENTS = ['Night, and a sky full of stars.', 'A thin line of light along the edge of the world.', 'Then morning.'];
const END = MOMENTS.length - 1;
// the same sky every time: [x, y, size] in a 160 × 90 frame
const STARS = [[9, 12, 0.7], [18, 30, 0.45], [27, 8, 0.6], [35, 22, 0.4], [46, 13, 0.75], [54, 31, 0.45], [62, 6, 0.55], [71, 19, 0.7], [79, 9, 0.4], [87, 26, 0.6], [95, 14, 0.5], [104, 5, 0.65], [112, 24, 0.4], [121, 11, 0.7], [130, 29, 0.45], [138, 7, 0.55], [147, 18, 0.65], [153, 33, 0.4], [14, 44, 0.35], [41, 41, 0.4], [67, 45, 0.35], [99, 40, 0.4], [126, 46, 0.35]];
const SKY = [
  ['#04050c', '#0d1226', '#151a33'],
  ['#080b1c', '#2a1c33', '#a0602e'],
  ['#35557f', '#9fa5a6', '#e8c27a'],
];

/**
 * A scene in miniature: no one in it, only a sky going from night to morning. The picture moves it on, as a
 * scene's does (tap, or swipe), with the scene's own buttons under it; → and ← are the Guide's.
 */
function Practice({ at, onNext, onPrev, reduce }) {
  const swipe = useRef(null);
  const ease = reduce ? 'none' : 'opacity 0.9s ease, transform 0.9s ease';
  return (
    <div className="mt-5">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gold/30 bg-night">
        <svg viewBox="0 0 160 90" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            {SKY.map((c, i) => (
              <linearGradient key={i} id={`guide-sky-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={c[0]} />
                <stop offset="0.6" stopColor={c[1]} />
                <stop offset="0.85" stopColor={c[2]} />
              </linearGradient>
            ))}
            <radialGradient id="guide-sun">
              <stop offset="0.45" stopColor="#fff3d0" />
              <stop offset="0.6" stopColor="#f1cf86" stopOpacity="0.55" />
              <stop offset="1" stopColor="#f1cf86" stopOpacity="0" />
            </radialGradient>
          </defs>
          {SKY.map((_, i) => (
            <rect key={i} width="160" height="90" fill={`url(#guide-sky-${i})`} style={{ opacity: i <= at ? 1 : 0, transition: ease }} />
          ))}
          <g style={{ opacity: [1, 0.45, 0][at], transition: ease }} fill="#f4ecd8">
            {STARS.map(([x, y, r]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
            ))}
          </g>
          <g style={{ transform: `translateY(${[34, 18, 0][at]}px)`, transition: ease }}>
            <circle cx="80" cy="60" r="20" fill="url(#guide-sun)" />
          </g>
          <path d="M0 72 Q18 66 36 70 T76 68 T118 71 T160 66 V90 H0 Z" fill="#07060a" />
        </svg>
        {/* the whole picture moves the practice on, as in a scene; the buttons below are the same, for every hand */}
        <div
          className="absolute inset-0 z-10 cursor-pointer"
          aria-hidden="true"
          onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
          onPointerUp={(e) => {
            const s = swipe.current;
            swipe.current = null;
            if (!s) return;
            const dx = e.clientX - s.x;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) (dx < 0 ? onNext : onPrev)();
            else if (Math.abs(dx) < 8 && Math.abs(e.clientY - s.y) < 8) onNext();
          }}
        />
        <p className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-3 font-body text-[1.12rem] leading-snug text-ivory [text-shadow:0_1px_10px_#000]" aria-live="polite">
          {MOMENTS[at]}
        </p>
      </div>
      <div className="mt-2 flex items-center justify-center gap-2">
        <button type="button" className="hud-btn icon border-transparent bg-transparent" onClick={onPrev} disabled={at === 0} aria-label="Previous moment (←)">
          <Icon name="prev" className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {MOMENTS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === at ? 'w-5 bg-gold-hi' : i < at ? 'w-1.5 bg-gold' : 'w-1.5 bg-ivory/30'}`} />
          ))}
        </div>
        <button type="button" className={`hud-btn icon border-transparent bg-transparent ${at < END ? 'text-gold-hi' : ''}`} onClick={onNext} disabled={at === END} aria-label="Next moment (→)">
          <Icon name="next" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** The verse as a scene cites it: the English, and its reference, which opens the Arabic in place. */
function Verse({ open, onOpen }) {
  return (
    <figure className="mt-5 rounded-xl border border-gold/30 bg-black/35 px-4 py-4">
      <blockquote className="font-body text-[1.12rem] leading-snug text-ivory/90">{TRUST.en}</blockquote>
      <figcaption className="mt-2">
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gold/50 bg-[#3c2a12]/50 px-4 font-body text-[1.02rem] italic text-gold-hi hover:border-gold-hi"
          aria-expanded={open}
          aria-controls="guide-arabic"
          onClick={onOpen}
        >
          <Icon name="book" className="h-4 w-4" />
          Quran 33:72
        </button>
      </figcaption>
      <div id="guide-arabic" hidden={!open}>
        <p lang="ar" dir="rtl" className="quran mt-3 text-[1.45rem] leading-[1.95] text-ivory">
          {TRUST.ar}
        </p>
        <p className="mt-1 font-body text-[0.95rem] italic text-ivory/55">
          {TRUST.surah}, Sahih International.{' '}
          <a href={quranLink(TRUST.ref)} target="_blank" rel="noopener noreferrer" className="underline decoration-gold/30 underline-offset-4 hover:text-ivory">
            Read it at quran.com
          </a>
        </p>
      </div>
    </figure>
  );
}

// One question, as a lesson asks it: the answer is in the verse of the step before (and the home page's opening).
const QUESTION = { ask: 'In Quran 33:72, who took on the Trust?', options: ['The mountains', 'Humankind', 'The heavens'], answer: 1 };

function Question({ picked, onPick }) {
  const right = picked === QUESTION.answer;
  return (
    <div className="mt-5 rounded-xl border border-gold/30 bg-black/35 px-4 py-4">
      <p id="guide-question" className="font-body text-[1.15rem] font-semibold leading-snug text-ivory">
        {QUESTION.ask}
      </p>
      <div className="mt-3 grid gap-2" role="group" aria-labelledby="guide-question">
        {QUESTION.options.map((o, k) => {
          const state = picked === k ? (right ? 'right' : 'wrong') : '';
          return (
            <button
              key={o}
              type="button"
              disabled={right}
              aria-pressed={picked === k}
              data-tap="on"
              onClick={() => onPick(k)}
              className={`flex min-h-[48px] items-center justify-between gap-3 rounded-lg border px-4 py-2 text-left font-body text-[1.08rem] transition-colors ${
                state === 'right' ? 'border-[#7fae5a] bg-[#3f6b2a]/30 text-ivory' : state === 'wrong' ? 'border-blood/70 bg-blood/15 text-ivory/80' : 'border-gold/35 text-ivory/90 hover:border-gold-hi disabled:opacity-60'
              }`}
            >
              {o}
              {state === 'right' && <Icon name="check" className="h-5 w-5 shrink-0 text-[#9fd07a]" />}
            </button>
          );
        })}
      </div>
      {picked !== null && !right && (
        <p className="mt-3 font-body text-[1rem] italic text-ivory/70" role="status">
          Not quite: the heavens, the earth and the mountains declined it. Try again.
        </p>
      )}
    </div>
  );
}

// ── The last step, and every place on one page ──────────────

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

function Start({ up }) {
  return (
    <>
      <StepTitle>Where would you like to start?</StepTitle>
      <p className="mt-1 font-body text-[1.1rem] text-ivory/70">That is all you need. The rest you will find as you go.</p>
      <div className="mt-5 grid gap-3">
        {up ? (
          <Way main autoFocus title="Continue the story" line={whereInStory(up)} onClick={() => go(`/scene/${up.id}`)} />
        ) : (
          <Way main autoFocus title="Watch the first story" line="The beginning of everything, in about a minute." onClick={() => go(`/scene/${FIRST_STORY}?first=1`)} />
        )}
        <Way title="See every chapter" line="The whole story in order: pick any chapter." onClick={() => go('/story')} />
        <Way title="Every place, on one page" line="The map, the pyramid, paths and more: what each is and where it waits." onClick={() => go('/guide?step=all')} />
      </div>
      <p className="mt-5 font-body text-[1rem] italic text-ivory/55">The guide stays on the home page, in Settings and About, and behind the ? in a story.</p>
    </>
  );
}

/** Every place in the app, what it is in a line and where it waits: the guide for readers rather than doers. */
export const PLACES = [
  { id: 'stories', icon: 'book', title: 'The story', line: 'The prophets, from the first light to the Last Day, told one moment at a time.', where: 'Story, in the menu: every chapter in order, and where you left off.', open: { label: 'Open the story', to: '/story' } },
  { id: 'map', icon: 'map', title: 'The map of time', line: 'Every story on one thread of light, from the Creation to the Hour. Tap a seal to see its stories.', where: 'Explore, in the menu.', open: { label: 'Open the map', to: '/map' } },
  { id: 'lessons', icon: 'check', title: 'Short lessons', line: 'After each part of the story: what to remember, a verse, a question to think about.', where: 'In Story, after each part. Any you leave also wait in Progress.' },
  { id: 'pyramid', icon: 'pyramid', title: 'The pyramid', line: 'Three levels of faith, each made of short lessons. A few private questions can suggest where to begin. Never a grade.', where: 'Explore, in the menu.', open: { label: 'See the pyramid', to: '/pyramid' } },
  { id: 'paths', icon: 'list', title: 'Paths', line: 'Other ways through the same stories: the women in them, the creatures, the dreams, the prayers.', where: 'Explore, in the menu.', open: { label: 'Open the paths', to: '/paths' } },
  { id: 'abodes', icon: 'diamond', title: 'The two abodes', line: 'Paradise and the Fire as the Quran describes them. Verses only; no one is ever placed there.', where: "Explore, in the menu, and the map's last stop.", open: { label: 'Open the two abodes', to: '/abodes' } },
  { id: 'progress', icon: 'bars', title: 'Your progress', line: 'What you have watched and learned, as stars in a sky, and your private notes. It stays on this device.', where: 'Progress, in the menu.', open: { label: 'Open Progress', to: '/pyramid/progress' } },
  { id: 'settings', icon: 'auto', title: 'Settings', line: 'The view, sound and tap sounds, keeping the story for offline, and your data.', where: 'On the home page, under the main button.', open: { label: 'Open Settings', to: '/settings' } },
];

/** A place's round seal: an icon from the set, or the two abodes' diamond (one shape above, one below). */
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

function All() {
  return (
    <>
      <h1 className="font-body text-[1.75rem] font-semibold leading-tight text-gold-hi">What is where</h1>
      <ul className="mt-4 grid gap-3">
        {PLACES.map((s) => (
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
          Try the short guide
        </button>
      </div>
    </>
  );
}

// ── The guide ───────────────────────────────────────────────

// One dot per step to try: the closing choice is not a step, so "Step 4 of 4" shows four dots, all filled after it.
function Dots({ at }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {TOUR.map(({ id }, i) => (
        <span key={id} className={`h-1.5 rounded-full transition-all ${i === at ? 'w-5 bg-gold-hi' : i < at ? 'w-1.5 bg-gold/70' : 'w-1.5 bg-ivory/25'}`} />
      ))}
    </div>
  );
}

// A step's heading takes the focus when the reader moves to it, so a screen reader starts the new step from the top,
// and the page scrolls back up with it (the steps share one page, which keeps the last step's scroll otherwise).
let moved = false;
function StepTitle({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!moved) return;
    for (let e = ref.current?.parentElement; e; e = e.parentElement) if (e.scrollTop > 0) e.scrollTop = 0;
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <h1 ref={ref} id="guide-title" tabIndex={-1} className="font-body text-[1.75rem] font-semibold leading-tight text-gold-hi outline-none">
      {children}
    </h1>
  );
}

const LINK = 'min-h-[44px] text-ivory/65 underline decoration-ivory/25 underline-offset-4 hover:text-ivory';

export default function Guide({ step }) {
  const reduce = useReducedMotion();
  const state = useStore();
  const isNew = newcomer(state);
  const taken = state.prefs.guide;
  const started = !!state.last || Object.keys(state.seen || {}).length > 0;
  const all = step === 'all';
  const at = Math.max(0, ORDER.indexOf(step));
  const id = ORDER[at];
  const s = TOUR[at];
  const prev = at > 0 ? ORDER[at - 1] : null;
  const next = at < ORDER.length - 1 ? ORDER[at + 1] : null;

  // what the reader has done in each step, kept while they move back and forth
  const [done, setDone] = useState(() => new Set());
  const [moment, setMoment] = useState(0);
  const [verseOpen, setVerseOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const finish = useCallback((k) => setDone((d) => (d.has(k) ? d : new Set(d).add(k))), []);
  const ok = done.has(id);

  // Doing a step brings its Next into view: on a phone the opened verse or the answer can push it under the tab bar.
  // Only on the doing itself, never when the reader comes back to a step already done.
  const nextBtn = useRef(null);
  const was = useRef({ id, ok });
  useEffect(() => {
    const w = was.current;
    was.current = { id, ok };
    if (ok && w.id === id && !w.ok) nextBtn.current?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }, [id, ok, reduce]);

  const nextMoment = useCallback(() => setMoment((m) => Math.min(m + 1, END)), []);
  const prevMoment = useCallback(() => setMoment((m) => Math.max(m - 1, 0)), []);
  useEffect(() => {
    if (moment === END) finish('moments');
  }, [moment, finish]);

  // Having opened the guide, the first-visit pointers that say "Show me around" have done their work.
  useEffect(() => {
    dismissHint('guide');
    return () => {
      moved = false;
    };
  }, []);
  // Every place on one page opens each place it shows, so the menu never lacks a tab the page points at.
  useEffect(() => {
    if (all) markFound(...Object.values(GUIDE_PLACES).flat());
  }, [all]);
  // Reaching the end is finishing the guide: from now on it is an offer, never the way in.
  useEffect(() => {
    if (id === LAST && !all && taken !== 'done') setPref('guide', 'done');
  }, [id, all, taken]);

  const move = useCallback((to) => {
    if (!to) return;
    moved = true;
    go(`/guide?step=${to}`);
  }, []);
  const skip = () => {
    if (!taken) setPref('guide', 'skipped');
    go('/begin');
  };

  useEffect(() => {
    if (all) return undefined;
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight') {
        if (id === 'moments' && moment < END) nextMoment();
        else if (ok) move(next);
      } else if (e.key === 'ArrowLeft') {
        if (id === 'moments' && moment > 0) prevMoment();
        else move(prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [all, id, moment, ok, next, prev, move, nextMoment, prevMoment]);

  const menuStep = !all && id === 'menu';
  return (
    <Shell back="/" title="A short guide" here="guide" spot={menuStep ? 'story' : null} onSpot={menuStep && !ok ? () => finish('menu') : null}>
      {all ? (
        <All />
      ) : (
        <section aria-labelledby="guide-title" className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <Dots at={at} />
            <span className="font-body text-[1rem] italic text-ivory/55" aria-live="polite">
              {s ? `Step ${at + 1} of ${TOUR.length}` : 'Ready to begin'}
            </span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={id} className="mt-5" initial={{ opacity: 0, x: reduce ? 0 : 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -18 }} transition={{ duration: 0.2 }}>
              {s ? (
                <>
                  <StepTitle>{s.title}</StepTitle>
                  <p className="mt-3 font-body text-[1.15rem] leading-snug text-ivory/85">{s.line}</p>
                  {id === 'moments' && <Practice at={moment} onNext={nextMoment} onPrev={prevMoment} reduce={reduce} />}
                  {id === 'verse' && (
                    <Verse
                      open={verseOpen}
                      onOpen={() => {
                        setVerseOpen((o) => !o);
                        finish('verse');
                      }}
                    />
                  )}
                  {id === 'lesson' && (
                    <Question
                      picked={picked}
                      onPick={(k) => {
                        setPicked(k);
                        if (k === QUESTION.answer) finish('lesson');
                      }}
                    />
                  )}
                  <p className={`mt-4 flex items-start gap-2 font-body text-[1.08rem] ${ok ? 'text-gold-hi' : 'text-ivory/75'}`} role="status">
                    <Icon name={ok ? 'check' : 'target'} className="mt-1 h-4 w-4 shrink-0 text-gold-hi" />
                    <span>{ok ? s.done : s.todo}</span>
                  </p>
                  <div className={`flex flex-wrap items-center gap-3 ${prev || ok ? 'mt-6' : ''}`}>
                    {prev && (
                      <button type="button" className="hud-btn" onClick={() => move(prev)}>
                        <Icon name="prev" className="h-4 w-4" />
                        Previous
                      </button>
                    )}
                    {ok && (
                      <button ref={nextBtn} type="button" className="btn-gold" onClick={() => move(next)} autoFocus data-tap="primary">
                        Next
                        <Icon name="next" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-6 font-body text-[1rem]">
                    <button type="button" className={LINK} onClick={skip}>
                      Skip the guide
                    </button>
                    {!isNew && (
                      <button type="button" className={LINK} onClick={() => go('/guide?step=all')}>
                        Every place on one page
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <Start up={started ? storyResume(state) : null} />
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
