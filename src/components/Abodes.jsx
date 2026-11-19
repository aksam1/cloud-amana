import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { inMode, useMode } from '../lib/words.js';
import { go } from '../lib/router.js';
import { quranLink } from '../lib/site.js';
import { ABODES, ayat, hadithById, STOPS, stopById, wayBackOf } from '../lib/abodes.js';
import { Icon } from './Ornaments.jsx';
import { Shell } from './Pyramid.jsx';
import AbodesMonument from './AbodesMonument.jsx';

/*
 * The two abodes (#/abodes): Paradise and the Fire as one diamond under the Throne, and for each of the
 * seven named levels on either side, what the Quran names as leading there and what it says of it.
 * Plan and rules: docs/ABODES-BLUEPRINT.md. Every line here is plain wording; every verse and saying comes
 * from ayahs.json / hadith.json by reference. Nobody is ever placed on a level, and no answer, score or
 * progress of the reader's is linked to one.
 */

const ease = [0.65, 0, 0.35, 1];
// Chapter 21, The Day of Judgment: its first and last scenes. The page's way into the story that leads here,
// played with ?back so it returns to the abodes instead of running on to the end of the chronicle.
const JUDGMENT = { from: 'earth', to: 'sovereign' };
const SIDE_QUERY = '(min-width: 1024px), (orientation: landscape) and (max-height: 500px)';
const NARROW_QUERY = '(max-width: 1023px)';
const LINK = 'inline-flex min-h-[44px] items-center font-body text-[1.08rem] text-gold-hi/90 underline decoration-gold/40 underline-offset-4 hover:decoration-gold-hi';
const FOLD = 'inline-flex min-h-[44px] items-center font-body text-[1rem] font-semibold not-italic text-gold-hi/90 underline decoration-gold/40 underline-offset-4 hover:decoration-gold-hi';

function useMatch(query) {
  const [on, setOn] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const set = () => setOn(mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, [query]);
  return on;
}

export default function Abodes({ at }) {
  const { mode } = useMode();
  const say = (t) => inMode(t, mode);
  const still = useReducedMotion();
  const side = useMatch(SIDE_QUERY);
  const narrow = useMatch(NARROW_QUERY);
  const [focus, setFocus] = useState(() => (at && stopById[at] ? at : null));
  // The page stays mounted when only its address changes (#/abodes?at=…, or Back): follow it.
  useEffect(() => setFocus(at && stopById[at] ? at : null), [at]);
  const wrap = useRef(null);
  const shut = focus && narrow; // a phone or tablet held upright: the pop-up takes the lower part of the screen

  const back = () => {
    const was = focus;
    setFocus(null);
    requestAnimationFrame(() => document.querySelector(`[data-level="${was}"]`)?.focus({ preventScroll: true }));
  };
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && focus && back();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Keep the level being read in sight: beside the pop-up it is centred; above it, the page goes back to the top.
  useEffect(() => {
    if (!focus || !wrap.current) return;
    const behavior = still ? 'auto' : 'smooth';
    if (side) wrap.current.scrollIntoView({ block: 'center', behavior });
    else wrap.current.closest('.thin-scroll')?.scrollTo({ top: 0, behavior });
  }, [focus, side, still]);

  const toTop = () => {
    setFocus(null);
    wrap.current?.closest('.thin-scroll')?.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
  };

  return (
    <Shell stars here="abodes">
      <motion.div
        className="overflow-hidden text-center"
        initial={false}
        animate={shut ? { opacity: 0, height: 0 } : { opacity: 1, height: 'auto' }}
        transition={{ duration: still ? 0 : 0.6, ease }}
        aria-hidden={shut || undefined}
      >
        <h1 className="mt-6 bg-gradient-to-b from-[#fff1cc] to-[#d9a54e] bg-clip-text font-display text-[clamp(2.2rem,9vw,3.6rem)] font-semibold leading-none tracking-[0.04em] text-transparent short:mt-1 short:text-[1.6rem]">
          {ABODES.title}
        </h1>
        <p className="mx-auto mt-3 max-w-[38ch] font-body text-[clamp(1.08rem,4vw,1.25rem)] leading-snug text-ivory/85 short:hidden">{say(ABODES.sub)}</p>
        <div className="mx-auto mt-4 max-w-[400px] text-left short:hidden">
          <Verse refId={ABODES.opening.ref} about={say(ABODES.opening.line)} />
        </div>
        <p className="mx-auto mt-3 max-w-[40ch] font-body text-[1rem] italic leading-snug text-ivory/60">
          {say(ABODES.throne.note.line)} <span className="whitespace-nowrap">(Quran {ABODES.throne.note.ref})</span>
        </p>
      </motion.div>

      <motion.div
        ref={wrap}
        className="relative mx-auto mt-4 w-full max-w-[max(260px,min(560px,calc((100svh-260px)*0.755)))] short:max-w-[calc((100svh-72px)*0.755)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, x: focus && side ? -190 : 0 }}
        transition={{ duration: still ? 0 : 0.8, ease }}
      >
        <AbodesMonument className="block w-full" focus={focus} onFocus={setFocus} side={side} throneLabel={say(ABODES.throne.label)} />
      </motion.div>

      <div className={shut ? 'invisible' : undefined} aria-hidden={shut || undefined}>
        <p className="mt-3 text-center font-body text-[1rem] italic text-ivory/55">Tap a level to read what the verses say.</p>
        <footer className="mx-auto mt-8 max-w-[46ch] text-center">
          <p className="font-body text-[1rem] italic leading-snug text-ivory/60">{ABODES.orderNote}</p>
          <p className="mt-3 font-body text-[1.08rem] leading-snug text-ivory/85">{say(ABODES.closing)}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6">
            <button type="button" className={LINK} onClick={() => go(`/scene/${JUDGMENT.from}?back=${encodeURIComponent('/abodes')}&until=${JUDGMENT.to}`)}>
              Watch the Day of Judgment
            </button>
            <button type="button" className={LINK} onClick={() => go('/unit/lastday')}>
              Belief in the Last Day
            </button>
            <button type="button" className={LINK} onClick={() => go('/map?at=judgment')}>
              The map
            </button>
            <button type="button" className={LINK} onClick={toTop}>
              Back to the top
            </button>
          </div>
        </footer>
      </div>

      <AnimatePresence mode="wait">{focus && <Brief key={focus} stop={stopById[focus]} say={say} still={still} onGo={setFocus} onClose={back} />}</AnimatePresence>
    </Shell>
  );
}

// ── The pop-up for one stop ─────────────────────────────────

function Brief({ stop, say, still, onGo, onClose }) {
  const ref = useRef(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), [stop.id]);
  const up = STOPS[stop.index - 1];
  const down = STOPS[stop.index + 1];
  const e = stop.entry;
  return (
    <motion.div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-label={stop.side === 'paradise' || stop.side === 'fire' ? `${e.name}: ${e.en}` : stop.name}
      className="thin-scroll fixed inset-x-3 bottom-[92px] z-50 max-h-[calc(100svh-92px-240px)] overflow-y-auto rounded-2xl border border-gold/35 bg-[#120f1c]/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)] outline-none backdrop-blur-md sm:inset-x-auto sm:bottom-8 sm:left-1/2 sm:max-h-[calc(100svh-32px-300px)] sm:w-[460px] sm:-translate-x-1/2 lg:bottom-auto lg:left-auto lg:right-[max(24px,calc(50vw-620px))] lg:top-1/2 lg:max-h-[80svh] lg:w-[400px] lg:translate-x-0 lg:-translate-y-1/2 short:!inset-x-auto short:!bottom-3 short:!left-auto short:!right-3 short:!top-3 short:!max-h-none short:!w-[min(400px,55vw)] short:!translate-x-0 short:!translate-y-0"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: still ? 0 : 0.3, ease: 'easeOut' }}
    >
      <div className="flex flex-wrap items-center gap-1">
        {up && (
          <button type="button" onClick={() => onGo(up.id)} aria-label={`Up to ${up.name}`} className="min-h-[44px] rounded-full border border-gold/25 px-3 font-body text-[0.98rem] text-ivory/75 hover:border-gold-hi/60">
            ↑ {up.name}
          </button>
        )}
        {down && (
          <button type="button" onClick={() => onGo(down.id)} aria-label={`Down to ${down.name}`} className="min-h-[44px] rounded-full border border-gold/25 px-3 font-body text-[0.98rem] text-ivory/75 hover:border-gold-hi/60">
            ↓ {down.name}
          </button>
        )}
        <button type="button" onClick={onClose} aria-label="Close and see both abodes" className="-mr-2 ml-auto grid h-11 w-11 place-items-center rounded-full text-ivory/70 hover:bg-white/5 hover:text-ivory">
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>

      {stop.side === 'throne' ? <ThroneCard e={e} say={say} /> : stop.side === 'between' ? <BetweenCard e={e} say={say} /> : <LevelCard e={e} side={stop.side} say={say} />}
    </motion.div>
  );
}

const Kicker = ({ children }) => <div className="mt-1 font-body text-[1rem] italic text-ivory/55">{children}</div>;
const Title = ({ children, sub }) => (
  <h2 className="font-display text-[1.6rem] font-semibold leading-tight text-gold-hi">
    {children} {sub && <span className="font-body text-[1.15rem] font-normal italic text-ivory/70">{sub}</span>}
  </h2>
);
const Heading = ({ children }) => <h3 className="mt-4 font-body text-[1.02rem] italic text-gold/85">{children}</h3>;
const Line = ({ children }) => <p className="mt-1 font-body text-[1.08rem] leading-snug text-ivory/85">{children}</p>;

function Sources({ refs = [], hadith = [] }) {
  return (
    <>
      {refs.map((r) => (
        <Verse key={r} refId={r} />
      ))}
      {hadith.map((h) => (
        <Saying key={h} id={h} />
      ))}
    </>
  );
}

function ThroneCard({ e, say }) {
  return (
    <>
      <Kicker>Above the highest garden</Kicker>
      <Title>{e.title}</Title>
      <Line>{say(e.line)}</Line>
      <Sources refs={e.refs} hadith={e.hadith} />
      <Mercy heading="Not pictured" line={say(e.note.line)} refs={[e.note.ref]} />
    </>
  );
}

function BetweenCard({ e, say }) {
  return (
    <>
      <Kicker>Where the two meet</Kicker>
      <Title>{e.title}</Title>
      {e.items.map((it) => (
        <section key={it.id}>
          <Heading>{it.title}</Heading>
          <Line>{say(it.line)}</Line>
          <Sources refs={it.refs} hadith={it.hadith} />
        </section>
      ))}
    </>
  );
}

const named = (refs) => (refs.length > 1 ? `${refs.slice(0, -1).join(', ')} and ${refs[refs.length - 1]}` : refs[0]);

function LevelCard({ e, side, say }) {
  const paradise = side === 'paradise';
  const way = paradise ? ABODES.paradise.mercy : wayBackOf(e);
  return (
    <>
      <Kicker>{paradise ? 'In Paradise' : 'In the Fire'}</Kicker>
      <Title sub={e.en}>{e.name}</Title>
      <p className="mt-1 font-body text-[0.98rem] italic text-ivory/55">Named in Quran {named(e.named)}</p>

      <Heading>What leads there</Heading>
      <Line>{say(e.leads.line)}</Line>
      <Sources refs={e.leads.refs} hadith={e.leads.hadith} />

      <Heading>What the Quran says of it</Heading>
      <Line>{say(e.says.line)}</Line>
      <Sources refs={e.says.refs} hadith={e.says.hadith} />

      <Mercy heading={paradise ? 'Mercy' : 'The way back'} line={say(way.line)} refs={way.refs} hadith={way.hadith} />
    </>
  );
}

function Mercy({ heading, line, refs, hadith }) {
  return (
    <section className="mt-5 rounded-xl border border-gold/30 bg-gold/[0.06] p-3">
      <h3 className="font-body text-[1.02rem] italic text-gold-hi/90">{heading}</h3>
      <p className="mt-1 font-body text-[1.08rem] leading-snug text-ivory/90">{line}</p>
      <Sources refs={refs} hadith={hadith} />
    </section>
  );
}

// ── Verses and sayings, folded: the reference shows; the text opens on request ──

function Verse({ refId, about }) {
  const list = ayat(refId);
  const ready = list.every(Boolean);
  const surah = list[0]?.surah;
  const [open, setOpen] = useState(false);
  return (
    <figure className="mt-2 rounded-lg border border-gold/15 bg-white/[0.03] px-3 pb-1 pt-2">
      {about && <p className="font-body text-[1.08rem] leading-snug text-ivory/90">{about}</p>}
      {open &&
        (ready ? (
          <>
            <p lang="ar" dir="rtl" className="quran mt-1 text-[1.45rem] leading-[1.9] text-ivory">
              {list.map((a) => a.ar).join(' ۝ ')}
            </p>
            <p className="mt-1 font-body text-[1.04rem] leading-snug text-ivory/90">{list.map((a) => a.en).join(' ')}</p>
          </>
        ) : (
          <a href={quranLink(refId)} target="_blank" rel="noopener noreferrer" className={LINK}>
            Read this verse at quran.com
          </a>
        ))}
      <figcaption className="flex flex-wrap items-center justify-between gap-x-3 font-body text-[0.98rem] italic text-ivory/60">
        <span>
          Quran {refId}
          {surah ? `, ${surah}` : ''}
        </span>
        <button type="button" className={FOLD} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Hide the verse' : 'Read the verse'}
        </button>
      </figcaption>
    </figure>
  );
}

function Saying({ id }) {
  const h = hadithById(id);
  const [open, setOpen] = useState(false);
  if (!h) return null;
  return (
    <figure className="mt-2 rounded-lg border border-gold/15 bg-white/[0.03] px-3 pb-1 pt-2">
      {open && (
        <>
          {h.context && <p className="font-body text-[1rem] leading-snug text-ivory/65">{h.context}</p>}
          {h.ar && (
            <p lang="ar" dir="rtl" className="quran mt-1 text-[1.35rem] leading-[1.9] text-ivory">
              {h.ar}
            </p>
          )}
          <blockquote className="mt-1 font-body text-[1.06rem] leading-snug text-ivory/90">“{h.en}”</blockquote>
          <p className="mt-1 font-body text-[0.96rem] italic text-ivory/60">
            Narrated by {h.narrator}
            {h.also ? `. Also ${h.also}` : ''}
            {h.gradedBy ? `. Graded sahih by ${h.gradedBy}` : ''}
          </p>
        </>
      )}
      <figcaption className="flex flex-wrap items-center justify-between gap-x-3">
        <span className="flex flex-wrap items-center gap-2 font-body text-[0.98rem] italic text-ivory/60">
          {h.collection} {h.number}
          {h.status !== 'reviewed' && <span className="rounded-full border border-gold/30 px-2 py-0.5 text-[0.8rem] text-ivory/60">Awaiting scholar review</span>}
        </span>
        <button type="button" className={FOLD} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Hide the saying' : 'Read the saying'}
        </button>
      </figcaption>
    </figure>
  );
}
