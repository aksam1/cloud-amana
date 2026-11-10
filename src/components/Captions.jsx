import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { verseArabic, verseAyah } from '../lib/story.js';
import { quranLink } from '../lib/site.js';

// Voices are told apart by colour and motion, never by a drawn face:
// divine speech is gold light; Iblis smoulders; Qabil's words shake; Habil's are still and white.
const VOICES = {
  divine: { ar: 'gold-text', en: 'text-[#f6e7c4]', shadow: '0 0 34px rgb(246 214 140 / .35)' },
  angels: { ar: 'text-[#eef3ff]', en: 'text-[#dfe6f6]', shadow: '0 0 26px rgb(210 225 255 / .5)' },
  iblis: { ar: 'text-[#ffa983]', en: 'text-[#f6cdb6]', shadow: '0 0 18px rgb(190 40 10 / .75), 0 2px 3px #000' },
  whisper: { ar: 'text-[#c9b3c4]', en: 'text-[#d9c9d4] italic', shadow: '0 0 22px rgb(60 30 50 / .9)' },
  qabil: { ar: 'text-[#ff6b4a]', en: 'text-[#f6b8a0]', shadow: '0 0 18px rgb(220 40 20 / .75)', shake: true },
  habil: { ar: 'text-white', en: 'text-[#f4f1ea]', shadow: '0 0 26px rgb(255 255 255 / .5)' },
  people: { ar: 'text-[#fff0d0]', en: 'text-[#f6e9cc]', shadow: '0 0 24px rgb(255 220 160 / .45)' },
  plain: { ar: 'text-[#f3e3bd]', en: 'text-[#efe3c8]', shadow: '0 2px 14px rgb(0 0 0 / .7)' },
};

const FIT_MIN = 0.66; // a long verse on a phone is never set smaller than this share of its usual size

const PLACE = {
  sky: 'top-[13%] sm:top-[11%] short:top-[3%]',
  center: 'top-1/2 -translate-y-1/2',
  // The lower third stacks just above the chronicle on tablets (`--dock` is the chronicle's top) and sits
  // beside it on wide screens, clear of the continue button. On phones the chronicle already fills the
  // lower third, so the verse rises to the top and the middle of the frame, where scenes put their
  // subject, stays clear.
  lower: 'top-[11%] sm:top-auto sm:bottom-[calc(var(--dock,140px)_+_12px)] short:top-[3%] short:bottom-auto lg:bottom-[150px] lg:left-[448px] lg:right-6 lg:mx-0 lg:w-auto',
};

/**
 * `tone: "parchment"` (scene-level) sets captions on parchment, for bright scenes where light text would vanish.
 * `dock` is how far up the screen the chronicle reaches (px), for verses placed in the lower third.
 * `onCrowded` is called when, on a phone, the verse cannot fit above the chronicle even at its smallest size.
 * `pen` (scene-level) writes the Arabic word by word, right to left, each word inked thick and settling
 * thin, and fades the English in word by word beneath it.
 */
export function VerseCaption({ verse, tone, dock, pen = false, onCrowded }) {
  const a = verseAyah(verse);
  if (!a) return null;
  const v = VOICES[verse.style || 'divine'] || VOICES.divine;
  const place = verse.place || 'sky';
  const lower = place === 'lower' || tone === 'parchment';
  const ar = verseArabic(verse);
  const revealMs = verse.showAr === false ? 900 : Math.min(3200, 900 + ar.length * 32);
  const arWords = ar.split(' ');
  const enWords = verse.en.split(' ');
  const enStart = (revealMs / 1000) * 0.55;

  // On a phone the verse sits above the chronicle. A long verse is set smaller, step by step, until all of it
  // shows in that room: no part of a verse may hide behind the chronicle.
  const box = useRef(null);
  const [fit, setFit] = useState(1);
  const asked = useRef(false);
  const seen = useRef(dock || 0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || window.innerWidth >= 640) return;
    // the chronicle has stepped aside (see below): set the verse afresh in the room it now has
    if ((dock || 0) < seen.current - 40) {
      seen.current = dock || 0;
      setFit(1);
      return;
    }
    seen.current = dock || 0;
    const room = window.innerHeight - (dock || 0) - 10 - el.offsetTop;
    if (el.offsetHeight <= room) return;
    if (fit > FIT_MIN) setFit((f) => Math.max(FIT_MIN, f * Math.min(0.94, Math.max(0.8, Math.sqrt(room / el.offsetHeight)))));
    // still too tall at its smallest (a small phone): ask the chronicle to fold away for this moment
    else if (!asked.current && onCrowded) {
      asked.current = true;
      onCrowded();
    }
  }, [dock, fit, onCrowded]);
  const arSize = place === 'lower' ? 'clamp(22px,2.4vw,40px)' : 'clamp(24px,3.2vw,50px)';

  return (
    <motion.figure
      ref={box}
      className={`pointer-events-none absolute inset-x-0 z-20 mx-auto w-[min(92vw,880px)] px-4 text-center ${PLACE[place] || PLACE.sky}`}
      style={dock ? { '--dock': `${dock}px` } : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.6 } }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <div className={lower ? `parchment ruled cartouche px-6 sm:px-10 ${fit < 1 ? 'py-3' : 'py-5'}` : 'relative'}>
        {!lower && <div className="absolute -inset-x-20 -inset-y-12 -z-10" style={{ background: 'radial-gradient(ellipse at center, rgb(6 5 4 / .74) 0%, rgb(6 5 4 / .5) 42%, transparent 72%)' }} />}
        {verse.who && (
          <figcaption className={`caps mb-2 text-[0.66rem] ${lower ? 'text-ink-soft' : 'text-[#e9d5a6]/85'}`}>
            {verse.who}
          </figcaption>
        )}
        {/* showAr: false when the same words are already written into the scene as calligraphy */}
        {verse.showAr !== false && (
          <div className={v.shake && !lower ? 'shake' : undefined}>
            <p
              lang="ar"
              dir={pen ? 'rtl' : undefined}
              // docked in the lower third, the verse sets smaller so it keeps to one line and the scene above stays clear
              className={`quran ${pen ? '' : 'ink-reveal'} ${place === 'lower' ? 'text-[clamp(22px,2.4vw,40px)]' : 'text-[clamp(24px,3.2vw,50px)]'} ${lower ? 'text-ink' : v.ar}`}
              style={{ '--dur': `${revealMs}ms`, textShadow: lower ? 'none' : v.shadow, ...(fit < 1 ? { fontSize: `calc(${arSize} * ${fit})`, lineHeight: 1.85 } : null) }}
            >
              {pen
                ? arWords.map((w, i) => (
                    <span key={i}>
                      {i > 0 && ' '}
                      <span className="pen-word" style={{ '--d': `${(i * revealMs) / arWords.length}ms`, '--w': `${Math.max(500, (revealMs / arWords.length) * 1.8)}ms` }}>
                        {w}
                      </span>
                    </span>
                  ))
                : ar}
            </p>
          </div>
        )}
        <motion.blockquote
          className={`mx-auto mt-1 max-w-[60ch] font-body text-[clamp(17px,1.55vw,24px)] leading-snug ${lower ? 'text-ink' : v.en}`}
          style={{ textShadow: lower ? 'none' : '0 1px 10px rgb(0 0 0 / .85)', ...(fit < 1 ? { fontSize: `calc(clamp(17px,1.55vw,24px) * ${Math.max(fit, 0.84)})` } : null) }}
          initial={pen ? false : { opacity: 0, y: 6 }}
          animate={pen ? undefined : { opacity: 1, y: 0 }}
          transition={{ delay: enStart, duration: 1.1 }}
        >
          {pen
            ? enWords.map((w, i) => (
                <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: enStart + i * 0.09, duration: 0.7, ease: 'easeOut' }}>
                  {i === 0 ? '“' : ''}
                  {w}
                  {i === enWords.length - 1 ? '”' : ' '}
                </motion.span>
              ))
            : `“${verse.en}”`}
        </motion.blockquote>
        <motion.div
          className={`caps mt-2 text-[0.6rem] ${lower ? 'text-ink-soft' : 'text-[#d9c08a]/80'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: pen ? enStart + enWords.length * 0.09 : (revealMs / 1000) * 0.8, duration: 1 }}
        >
          Quran {verse.ref.replace('-', '–')} · {a.surah}
        </motion.div>
      </div>
    </motion.figure>
  );
}

/**
 * A verse moment whose verified text has not been fetched yet. Quran text is never typed in, so the moment
 * shows its reference and a link to read the verse, in the place the verse will take.
 */
export function PendingCaption({ pending, dock }) {
  return (
    <motion.figure
      className={`pointer-events-none absolute inset-x-0 z-20 mx-auto w-[min(92vw,560px)] px-4 text-center ${PLACE[pending.place] || PLACE.sky}`}
      style={dock ? { '--dock': `${dock}px` } : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <a
        href={quranLink(pending.ref)}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto inline-flex min-h-[44px] flex-wrap items-center justify-center gap-x-2 rounded-full border border-gold/45 bg-black/60 px-5 py-2 font-body text-[1.05rem] leading-tight text-[#f6e7c4] backdrop-blur-sm"
      >
        <span>Quran {pending.ref.replace('-', '–')}</span>
        <span className="italic text-[#f6e7c4]/85">Read this verse at quran.com</span>
      </a>
    </motion.figure>
  );
}
