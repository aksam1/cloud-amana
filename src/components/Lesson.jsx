import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ayah, chapterByNumber } from '../lib/story.js';
import { lessonFor, lessonKey, replayHref } from '../lib/lessons.js';
import { markAnswered, markLearned, saveJournal, useStore } from '../lib/store.js';
import { inMode, useMode } from '../lib/words.js';
import { go } from '../lib/router.js';
import { roman } from '../lib/geo.js';
import { GeoField, Icon, Rule } from './Ornaments.jsx';
import { ModePicker } from './ModePicker.jsx';

/*
 * The lesson after a part: Remember (quick questions; a wrong answer can replay that moment) → The lesson
 * (one line and its verse) → Carry it (a dua to learn; Muslim view) → Reflect (private; plus one action in
 * the Muslim view) → the map. Every verse is shown from ayahs.json by its ref, never typed.
 */
export default function Lesson({ chapter, part, then }) {
  const data = lessonFor(chapter, part);
  const ch = chapterByNumber[chapter];
  const { mode } = useMode();
  const key = lessonKey(chapter, part);
  const here = `/lesson/${chapter}/${part}${then ? `?then=${encodeURIComponent(then)}` : ''}`;
  const onward = then || '/map';

  const steps = data ? ['remember', 'lesson', ...(mode === 'muslim' ? ['carry'] : []), 'reflect'] : [];
  const [step, setStep] = useState(0);
  const at = steps[Math.min(step, steps.length - 1)];

  const finish = () => {
    markLearned(key);
    go(onward);
  };

  if (!data) {
    return (
      <Shell>
        <p className="font-body text-lg text-ink">There is no lesson for this part yet.</p>
        <div className="mt-4 flex justify-end">
          <button type="button" className="btn-ink" onClick={() => go(onward)}>
            Continue
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="caps text-[0.62rem] text-ink-soft">
        Lesson · Chapter {roman(chapter)} · {ch?.parts?.[part]?.title}
      </div>

      {!mode ? (
        <div className="mt-3">
          <h2 className="font-display text-[1.3rem] font-semibold leading-tight text-ink">Before the lesson: how would you like to explore?</h2>
          <p className="mt-1 font-body text-[1rem] text-ink-soft">You can switch at any time.</p>
          <div className="mt-4">
            <ModePicker full tone="parchment" />
          </div>
        </div>
      ) : (
        <>
          <ol className="mt-2 flex gap-1.5" aria-label="Lesson steps">
            {steps.map((s, i) => (
              <li key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-[#a5772f]' : 'bg-[#a5772f]/25'}`} aria-current={i === step ? 'step' : undefined}>
                <span className="sr-only">{LABELS[s]}</span>
              </li>
            ))}
          </ol>
          <AnimatePresence mode="wait">
            <motion.div key={at} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
              {at === 'remember' && <Remember data={data} mode={mode} lessonKey={key} here={here} onDone={() => setStep(step + 1)} />}
              {at === 'lesson' && <TheLesson data={data} mode={mode} onDone={() => setStep(step + 1)} />}
              {at === 'carry' && <Carry data={data} onDone={() => setStep(step + 1)} />}
              {at === 'reflect' && <Reflect data={data} mode={mode} lessonKey={key} onDone={finish} />}
            </motion.div>
          </AnimatePresence>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#8a6a4e]/25 pt-3">
            <ModePicker tone="parchment" />
            <button type="button" className="font-body text-[0.95rem] text-ink-soft underline-offset-4 hover:underline" onClick={() => go(onward)}>
              Skip for now
            </button>
          </div>
        </>
      )}
    </Shell>
  );
}

const LABELS = { remember: 'Remember', lesson: 'The lesson', carry: 'Carry it', reflect: 'Reflect' };

function Shell({ children }) {
  return (
    <div className="parchment-night thin-scroll relative grid h-full w-full place-items-center overflow-y-auto px-4 py-8">
      <GeoField opacity={0.06} size={140} />
      <article className="parchment ruled cartouche relative z-10 w-full max-w-[600px] px-6 pb-5 pt-5 shadow-[0_30px_70px_-20px_rgba(0,0,0,.9)] sm:px-8">{children}</article>
    </div>
  );
}

function Heading({ children }) {
  return <h2 className="mt-4 font-display text-[1.35rem] font-semibold leading-tight text-ink">{children}</h2>;
}

function Next({ onClick, children = 'Next' }) {
  return (
    <div className="mt-5 flex justify-end">
      <button type="button" className="btn-gold" onClick={onClick} autoFocus>
        {children}
      </button>
    </div>
  );
}

/** One question at a time. Right: on to the next. Wrong: try again, or replay the moment it is about. */
function Remember({ data, mode, lessonKey: key, here, onDone }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const q = data.questions[i];
  const right = picked === q.answer;
  const replay = q.replay && replayHref(q.replay);
  const choose = (k) => {
    setPicked(k);
    if (k === q.answer) markAnswered(`${key}:${i}`);
  };
  const next = () => {
    setPicked(null);
    if (i + 1 < data.questions.length) setI(i + 1);
    else onDone();
  };
  return (
    <section aria-labelledby="q">
      <Heading>Remember</Heading>
      <p className="caps mt-1 text-[0.6rem] text-ink-soft">
        Question {i + 1} of {data.questions.length}
      </p>
      <p id="q" className="mt-2 font-body text-[1.2rem] leading-snug text-ink">
        {inMode(q.q, mode)}
      </p>
      <div className="mt-3 grid gap-2">
        {q.options.map((o, k) => {
          const state = picked === null ? '' : k === q.answer && right ? 'right' : k === picked ? 'wrong' : '';
          return (
            <button
              key={o}
              type="button"
              disabled={right}
              onClick={() => choose(k)}
              className={`flex min-h-[48px] items-center justify-between gap-3 rounded-lg border px-4 py-2 text-left font-body text-[1.05rem] text-ink transition-colors ${
                state === 'right' ? 'border-[#3f6b2a] bg-[#3f6b2a]/12' : state === 'wrong' ? 'border-blood/70 bg-blood/8' : 'border-[#8a6a4e]/45 hover:bg-black/5'
              }`}
            >
              {inMode(o, mode)}
              {state === 'right' && <Icon name="check" className="h-5 w-5 shrink-0 text-[#3f6b2a]" />}
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {picked !== null && !right && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="font-body text-[1rem] italic text-ink-soft">Not quite. Try again, or watch that moment once more.</p>
            {replay && (
              <button type="button" className="btn-ink" onClick={() => go(`${replay}&back=${encodeURIComponent(here)}`)}>
                <Icon name="play" className="h-3.5 w-3.5" />
                See the moment again
              </button>
            )}
          </div>
        )}
      </div>
      {right && <Next onClick={next}>{i + 1 < data.questions.length ? 'Next question' : 'On to the lesson'}</Next>}
    </section>
  );
}

/** A verse shown in full from the verified file. */
function Verse({ refId }) {
  const a = ayah(refId);
  if (!a) return <p className="mt-3 font-body text-[0.95rem] italic text-ink-soft">Verse {refId} will appear here once it is fetched.</p>;
  return (
    <figure className="mt-3 rounded-md border border-[#8a6a4e]/35 bg-[#5a3d22]/5 p-3">
      <p lang="ar" className="quran text-[1.6rem] leading-[1.9] text-ink">
        {a.ar}
      </p>
      <figcaption className="mt-1 font-body text-[1.02rem] leading-snug text-ink">
        {a.en} <span className="caps whitespace-nowrap text-[0.56rem] text-ink-soft">{a.surah} · {refId}</span>
      </figcaption>
    </figure>
  );
}

function TheLesson({ data, mode, onDone }) {
  const text = mode === 'curious' && data.lesson.curious ? data.lesson.curious : data.lesson.text;
  return (
    <section>
      <Heading>The lesson</Heading>
      <p className="mt-2 font-body text-[1.2rem] leading-snug text-ink">{inMode(text, mode)}</p>
      {data.lesson.ref && <Verse refId={data.lesson.ref} />}
      <Next onClick={onDone} />
    </section>
  );
}

/** A dua to learn: read it, then hide the English and the Arabic in turn to practise. */
function Carry({ data, onDone }) {
  const [hide, setHide] = useState(false);
  const a = ayah(data.carry.ref);
  return (
    <section>
      <Heading>Carry it with you</Heading>
      <p className="mt-1 font-body text-[1.05rem] text-ink-soft">{data.carry.title}</p>
      {a ? (
        <figure className="mt-3 rounded-md border border-[#8a6a4e]/35 bg-[#5a3d22]/5 p-3">
          <p lang="ar" className={`quran text-[1.7rem] leading-[1.9] text-ink transition-[filter] duration-500 ${hide ? 'blur-[7px]' : ''}`}>
            {a.ar}
          </p>
          <figcaption className="mt-1 font-body text-[1.02rem] leading-snug text-ink">
            {a.en} <span className="caps whitespace-nowrap text-[0.56rem] text-ink-soft">{a.surah} · {data.carry.ref}</span>
          </figcaption>
        </figure>
      ) : (
        <Verse refId={data.carry.ref} />
      )}
      {a && (
        <button type="button" className="btn-ink mt-3" onClick={() => setHide((h) => !h)} aria-pressed={hide}>
          {hide ? 'Show the Arabic' : 'Hide the Arabic to practise'}
        </button>
      )}
      <Next onClick={onDone} />
    </section>
  );
}

/** A private question for the reader's own life, kept only in this browser. */
function Reflect({ data, mode, lessonKey: key, onDone }) {
  const saved = useStore((s) => s.journal[key] || '');
  const [text, setText] = useState(saved);
  const question = data.reflect?.[mode] || data.reflect?.muslim;
  return (
    <section>
      <Heading>Reflect</Heading>
      <label htmlFor="reflect" className="mt-2 block font-body text-[1.15rem] leading-snug text-ink">
        {inMode(question, mode)}
      </label>
      <textarea
        id="reflect"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => saveJournal(key, text)}
        placeholder="Write a few words, or just think it over."
        className="mt-3 w-full rounded-lg border border-[#8a6a4e]/45 bg-[#fffaf0]/60 p-3 font-body text-[1.05rem] text-ink placeholder:text-ink-soft/60 focus:border-[#a5772f] focus:outline-none"
      />
      <p className="mt-1 font-body text-[0.9rem] italic text-ink-soft">Only you can see this. It stays on this device.</p>
      {mode === 'muslim' && data.act && (
        <div className="mt-4 rounded-md border border-[#a5772f]/50 bg-[#a5772f]/8 px-3 py-2">
          <div className="caps text-[0.6rem] text-ink-soft">This week</div>
          <p className="font-body text-[1.08rem] leading-snug text-ink">{inMode(data.act, mode)}</p>
        </div>
      )}
      <Rule className="mx-auto mt-4 h-3 w-40 text-[#7a5a2e]" />
      <Next
        onClick={() => {
          saveJournal(key, text);
          onDone();
        }}
      >
        Finish the lesson
      </Next>
    </section>
  );
}
