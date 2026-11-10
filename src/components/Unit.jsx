import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ayah, expandRef, sceneById } from '../lib/story.js';
import { getState, saveDraft, saveJournal, saveUnit, useStore } from '../lib/store.js';
import { inMode, useMode } from '../lib/words.js';
import { go } from '../lib/router.js';
import { climb, CONFIG, completed, levelById, nextUnit, unitById, unitMeter, unitStatus, UNITS } from '../lib/pyramid.js';
import { quranLink, share, shareMessage } from '../lib/site.js';

// The lesson paths themselves load with this page only (the home page knows just which ones exist).
const unitFiles = import.meta.glob('../pyramid/units/*.json', { eager: true, import: 'default' });
const unitContent = Object.fromEntries(Object.values(unitFiles).map((u) => [u.id, u]));
import hadithData from '../data/hadith.json';
import { Icon, Rule } from './Ornaments.jsx';
import { ModePicker } from './ModePicker.jsx';
import { Disclaimer, Meter } from './Pyramid.jsx';
import Monument from './Monument.jsx';
import Nav from './Nav.jsx';

/*
 * One unit of the pyramid, in five steps, one per screen:
 *   1 Story      a scene from the chronicle (played with ?back= so it returns here)
 *   2 Choice     a real-life situation: what would you do?
 *   3 Teaching   the Quran, a hadith, and scholars' insight, each referenced (three short pages)
 *   4 Check      3–5 questions on what was just taught (first answers count; never called a test)
 *   5 Reflection one private prompt and an optional note
 * then the stone's meter. #/unit/<id>?step=<name> opens at a step (the story returns to "choice").
 */
const STEPS = ['story', 'choice', 'teaching', 'check', 'reflection'];
const LABEL = { story: 'Story', choice: 'Choice', teaching: 'Teaching', check: 'Check', reflection: 'Reflect' };

export default function Unit({ id, step: startStep }) {
  const u = unitById[id];
  const data = unitContent[id];
  const status = u ? unitStatus(id) : null;
  const { mode } = useMode();
  // An unfinished attempt picks up exactly where it was left (choice, first answers, step).
  const [draft] = useState(() => getState().drafts?.[id] || null);
  const [step, setStep] = useState(STEPS.includes(startStep) ? startStep : draft?.step || 'story');
  const [choice, setChoice] = useState(draft?.choice ?? null); // option index
  const [firsts, setFirsts] = useState(draft?.firsts || {}); // question index → first option picked
  const [reflected, setReflected] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (status === 'history') go('/stories');
  }, [status]);
  // Save the attempt as it goes, once it has begun (opening the story step alone is not an attempt).
  useEffect(() => {
    if (!data || result || (step === 'story' && choice === null && !draft)) return;
    saveDraft(id, { step, choice, firsts }, u?.title);
  }, [id, data, u, step, choice, firsts, result, draft]);

  if (!u) return <Frame id={id}>{<p className="font-body text-lg text-ink">There is no unit called “{id}”.</p>}</Frame>;
  if (!data) {
    return (
      <Frame id={id}>
        <Title u={u} />
        <p className="mt-3 font-body text-[1.1rem] italic text-ink-soft">This lesson path is still being written. Its stone will light once it is ready.</p>
        <div className="mt-4 flex justify-end">
          <button type="button" className="btn-ink" onClick={() => go('/pyramid')}>
            Back to the pyramid
          </button>
        </div>
      </Frame>
    );
  }
  if (!mode) {
    return (
      <Frame id={id}>
        <Title u={u} />
        <h2 className="mt-4 font-display text-[1.15rem] text-ink">First, how would you like to explore?</h2>
        <div className="mt-3">
          <ModePicker full tone="parchment" />
        </div>
      </Frame>
    );
  }

  const say = (t) => inMode(t, mode);
  const v = mode === 'curious' ? 'curious' : 'muslim';
  const ch = data.choice[v];
  const at = STEPS.indexOf(step);
  const nextStep = () => setStep(STEPS[at + 1]);

  const finish = () => {
    const q = data.check;
    const right = q.filter((x, i) => firsts[i] === x.answer).length;
    const best = Math.max(...ch.options.map((o) => o.points));
    const parts = { check: q.length ? right / q.length : 0, choice: choice === null ? 0 : ch.options[choice].points / best, reflection: true };
    const meter = unitMeter(parts);
    saveUnit(id, { ...parts, meter, at: new Date().toISOString() });
    setResult({ meter, right, total: q.length });
  };

  if (result) return <Done u={u} result={result} mode={mode} />;

  return (
    <Frame id={id}>
      <Title u={u} />
      <ol className="mt-3 grid grid-cols-5 gap-1.5" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === at ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full ${i <= at ? 'bg-[#a5772f]' : 'bg-[#a5772f]/25'}`} />
            <div className={`mt-1 hidden text-center font-body text-[0.92rem] sm:block ${i === at ? 'text-ink' : 'text-ink-soft/75'}`}>{LABEL[s]}</div>
          </li>
        ))}
      </ol>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
          {step === 'story' && <Story id={id} data={data} v={v} onNext={nextStep} />}
          {step === 'choice' && <Choice ch={ch} say={say} choice={choice} setChoice={setChoice} onNext={nextStep} />}
          {step === 'teaching' && <Teaching data={data} v={v} say={say} onNext={nextStep} />}
          {step === 'check' && <Check data={data} say={say} firsts={firsts} setFirsts={setFirsts} onNext={nextStep} />}
          {step === 'reflection' && <Reflection id={id} data={data} v={v} say={say} reflected={reflected} setReflected={setReflected} onFinish={finish} />}
        </motion.div>
      </AnimatePresence>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#8a6a4e]/25 pt-3">
        <ModePicker tone="parchment" />
        <button type="button" className="inline-flex min-h-[44px] items-center px-2 font-body text-[1rem] text-ink-soft underline-offset-4 hover:underline" onClick={() => go('/pyramid')}>
          Save and leave
        </button>
      </div>
    </Frame>
  );
}

function Frame({ children }) {
  return (
    <div className="thin-scroll relative h-full w-full overflow-y-auto pb-28 sm:pb-10" style={{ background: 'linear-gradient(180deg, #070a1a 0%, #0e1530 34%, #171427 70%, #0b0a0e 100%) fixed' }}>
      {/* the same header as every pyramid page: the name home, the menu (a tab bar on phones) */}
      <header className="relative z-20 mx-auto flex w-full max-w-[1100px] items-center justify-between gap-6 px-5 pt-5 sm:px-10">
        <a href="#/" onClick={(e) => { e.preventDefault(); go('/'); }} aria-label="Amanah, home" className="inline-flex min-h-[44px] items-center font-display text-[1.35rem] font-semibold tracking-[0.06em] text-gold-hi">
          Amanah
        </a>
        <div className="sm:w-[580px]">
          <Nav here="pyramid" />
        </div>
      </header>
      <div className="relative z-10 mx-auto mt-4 w-full max-w-[620px] px-4">
        <article className="parchment ruled cartouche relative px-5 pb-5 pt-5 shadow-[0_30px_70px_-20px_rgba(0,0,0,.9)] sm:px-8">{children}</article>
      </div>
    </div>
  );
}

function Title({ u }) {
  const { mode } = useMode();
  return (
    <header>
      <div className="font-body text-[0.98rem] italic text-ink-soft">{levelById[u.level].title}</div>
      <div className="flex items-baseline gap-3">
        <h1 className="font-display text-[1.45rem] font-semibold leading-tight text-ink">
          {u.title} <span className="ml-1 font-body text-[1.1rem] font-normal italic text-ink-soft">{inMode(u.english, mode)}</span>
        </h1>
      </div>
    </header>
  );
}

const H = ({ children }) => <h2 className="mt-4 font-display text-[1.2rem] font-semibold leading-tight text-ink">{children}</h2>;
function Next({ onClick, children = 'Next', disabled }) {
  return (
    <div className="mt-5 flex justify-end">
      <button type="button" className="btn-gold" onClick={onClick} disabled={disabled} autoFocus>
        {children}
      </button>
    </div>
  );
}

// 1 · Story: play the scenes from the chronicle and come back.
function Story({ id, data, v, onNext }) {
  const s = data.story;
  const seen = useStore((st) => st.seen);
  const first = sceneById[s.from];
  const watched = s.until && seen[s.until];
  const back = `/unit/${id}?step=choice`;
  return (
    <section>
      <H>Story</H>
      <p className="mt-2 font-body text-[1.15rem] leading-snug text-ink">{inMode(data.story.intro[v], v)}</p>
      {first && (
        <div className="mt-4 flex flex-col items-start gap-2">
          <button type="button" className="btn-gold" onClick={() => go(`/scene/${s.from}?back=${encodeURIComponent(back)}${s.until ? `&until=${s.until}` : ''}`)} autoFocus>
            <Icon name="play" className="h-4 w-4" />
            {watched ? 'Watch it again' : `Watch: ${first.title}`}
          </button>
          <span className="font-body text-[0.95rem] text-ink-soft">
            Chapter {s.chapter} of the chronicle: {s.length}.{watched ? " You've watched it." : ''}
          </span>
        </div>
      )}
      <div className="mt-5 flex justify-end">
        <button type="button" className={watched ? 'btn-gold' : 'btn-ink'} onClick={onNext}>
          {watched ? 'Next' : "I know this story, continue"}
        </button>
      </div>
    </section>
  );
}

// 2 · Choice: one situation; the first pick counts, with gentle feedback either way.
function Choice({ ch, say, choice, setChoice, onNext }) {
  return (
    <section>
      <H>What would you do?</H>
      <p className="mt-2 font-body text-[1.15rem] leading-snug text-ink">{say(ch.situation)}</p>
      <div className="mt-3 grid gap-2" role="radiogroup" aria-label={ch.prompt}>
        {ch.options.map((o, k) => (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={choice === k}
            disabled={choice !== null}
            onClick={() => setChoice(k)}
            className={`min-h-[50px] rounded-lg border px-4 py-2 text-left font-body text-[1.08rem] text-ink transition-colors ${
              choice === k ? 'border-[#a5772f] bg-[#a5772f]/15' : 'border-[#8a6a4e]/45 enabled:hover:bg-black/5 disabled:opacity-60'
            }`}
          >
            {say(o.label)}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {choice !== null && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 rounded-md border border-[#a5772f]/40 bg-[#a5772f]/8 px-3 py-2 font-body text-[1.05rem] italic leading-snug text-ink">
            {say(ch.options[choice].feedback)}
          </motion.p>
        )}
      </div>
      {choice !== null && <Next onClick={onNext}>See what is taught</Next>}
    </section>
  );
}

// 3 · Teaching: three short pages, each item referenced. Verses come from ayahs.json, hadith from hadith.json.
function Teaching({ data, v, say, onNext }) {
  const t = data.teaching;
  const pages = [
    t.quran?.length && { key: 'quran', title: 'The Quran' },
    t.hadith?.length && { key: 'hadith', title: 'The Sunnah' },
    t.insights?.length && { key: 'insights', title: 'Insight from the scholars' },
  ].filter(Boolean);
  const [p, setP] = useState(0);
  const page = pages[p];
  return (
    <section>
      <H>{t.heading[v]}</H>
      <div className="mt-1 font-body text-[0.98rem] italic text-ink-soft">
        {page.title}, {p + 1} of {pages.length}
      </div>
      <div className="mt-2 space-y-3">
        {page.key === 'quran' && t.quran.map((q) => <VerseCard key={q.ref} refId={q.ref} about={say(q.about)} />)}
        {page.key === 'hadith' && t.hadith.map((h) => <HadithCard key={h.id} id={h.id} about={say(h.about)} />)}
        {page.key === 'insights' &&
          t.insights.map((x) => (
            <figure key={x.text} className="rounded-md border border-[#8a6a4e]/35 bg-[#5a3d22]/5 p-3">
              <p className="font-body text-[1.08rem] leading-snug text-ink">{say(x.text)}</p>
              <figcaption className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-body text-[0.98rem] italic text-ink-soft">
                  {x.who}
                  {x.work ? `, ${x.work}` : ''}
                </span>
                {x.status !== 'reviewed' && <Draft />}
              </figcaption>
            </figure>
          ))}
      </div>
      <div className="mt-5 flex justify-between">
        {p > 0 ? (
          <button type="button" className="btn-ink" onClick={() => setP(p - 1)}>
            Back
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="btn-gold" onClick={() => (p + 1 < pages.length ? setP(p + 1) : onNext())} autoFocus>
          {p + 1 < pages.length ? 'Next' : 'Check your understanding'}
        </button>
      </div>
    </section>
  );
}

const Draft = () => <span className="rounded-full border border-[#8a6a4e]/50 px-2 py-0.5 font-body text-[0.8rem] italic text-ink-soft">Awaiting scholar review</span>;

function VerseCard({ refId, about }) {
  const refs = expandRef(refId);
  const ayat = refs.map(ayah);
  const ready = ayat.every(Boolean);
  const surah = ayat[0]?.surah;
  return (
    <figure className="rounded-md border border-[#8a6a4e]/35 bg-[#5a3d22]/5 p-3">
      <p className="font-body text-[1.02rem] italic leading-snug text-ink-soft">{about}</p>
      {ready ? (
        <>
          <p lang="ar" dir="rtl" className="quran mt-2 text-[1.5rem] leading-[1.9] text-ink">
            {ayat.map((a) => a.ar).join(' ۝ ')}
          </p>
          <p className="mt-1 font-body text-[1.04rem] leading-snug text-ink">{ayat.map((a) => a.en).join(' ')}</p>
        </>
      ) : (
        <p className="mt-2 font-body text-[1rem] leading-snug text-ink">
          <a href={quranLink(refId)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center font-semibold underline decoration-[#8a6a4e] underline-offset-4">
            Read this verse at quran.com
          </a>
          <span className="block font-body text-[0.9rem] italic text-ink-soft">Its text will show here once it has been checked against the source.</span>
        </p>
      )}
      <figcaption className="mt-1 font-body text-[0.98rem] italic text-ink-soft">
        Quran {refId}
        {surah ? `, ${surah}` : ''}
      </figcaption>
    </figure>
  );
}

function HadithCard({ id, about }) {
  const h = hadithData[id];
  if (!h) return null;
  return (
    <figure className="rounded-md border border-[#8a6a4e]/35 bg-[#5a3d22]/5 p-3">
      <p className="font-body text-[1.02rem] italic leading-snug text-ink-soft">{about}</p>
      {h.context && <p className="mt-2 font-body text-[1rem] leading-snug text-ink-soft">{h.context}</p>}
      {h.ar && (
        <p lang="ar" dir="rtl" className="quran mt-2 text-[1.4rem] leading-[1.9] text-ink">
          {h.ar}
        </p>
      )}
      <blockquote className="mt-1 font-body text-[1.08rem] leading-snug text-ink">“{h.en}”</blockquote>
      <figcaption className="mt-1 flex flex-wrap items-center gap-2">
        <span className="font-body text-[0.98rem] italic text-ink-soft">
          {h.collection} {h.number}
          {h.also ? `, also ${h.also}` : ''}, narrated by {h.narrator}
        </span>
        {h.status !== 'reviewed' && <Draft />}
      </figcaption>
    </figure>
  );
}

// 4 · Understanding: one question at a time. The first answer counts; the explanation shows either way.
function Check({ data, say, firsts, setFirsts, onNext }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const q = data.check[i];
  const pick = (k) => {
    if (picked !== null) return;
    setPicked(k);
    if (firsts[i] === undefined) setFirsts({ ...firsts, [i]: k });
  };
  const next = () => {
    setPicked(null);
    if (i + 1 < data.check.length) setI(i + 1);
    else onNext();
  };
  const right = picked === q.answer;
  return (
    <section>
      <H>Check your understanding</H>
      <div className="mt-1 font-body text-[0.98rem] italic text-ink-soft">
        {i + 1} of {data.check.length}
      </div>
      <p className="mt-2 font-body text-[1.2rem] leading-snug text-ink">{say(q.q)}</p>
      <div className="mt-3 grid gap-2">
        {q.options.map((o, k) => {
          const state = picked === null ? '' : k === q.answer ? 'right' : k === picked ? 'wrong' : '';
          return (
            <button
              key={o}
              type="button"
              onClick={() => pick(k)}
              disabled={picked !== null}
              className={`flex min-h-[50px] items-center justify-between gap-3 rounded-lg border px-4 py-2 text-left font-body text-[1.05rem] text-ink ${
                state === 'right' ? 'border-[#3f6b2a] bg-[#3f6b2a]/12' : state === 'wrong' ? 'border-blood/60 bg-blood/8' : 'border-[#8a6a4e]/45 enabled:hover:bg-black/5'
              }`}
            >
              {say(o)}
              {state === 'right' && <Icon name="check" className="h-5 w-5 shrink-0 text-[#3f6b2a]" />}
            </button>
          );
        })}
      </div>
      <div aria-live="polite">
        {picked !== null && (
          <p className="mt-3 font-body text-[1.04rem] leading-snug text-ink">
            <span className="font-semibold">{right ? 'Yes. ' : 'Not quite, and that is how learning works. '}</span>
            {say(q.why)}
          </p>
        )}
      </div>
      {picked !== null && <Next onClick={next}>{i + 1 < data.check.length ? 'Next' : 'On to reflection'}</Next>}
    </section>
  );
}

// 5 · Reflection: private; the note stays in this browser (journal key "unit:<id>").
function Reflection({ id, data, v, say, setReflected, onFinish }) {
  const key = `unit:${id}`;
  const saved = useStore((s) => s.journal[key] || '');
  const [text, setText] = useState(saved);
  return (
    <section>
      <H>Reflection</H>
      <label htmlFor="note" className="mt-2 block font-body text-[1.18rem] leading-snug text-ink">
        {say(data.reflection[v])}
      </label>
      <textarea
        id="note"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => saveJournal(key, text)}
        placeholder="An optional private note, or just think it over."
        className="mt-3 w-full rounded-lg border border-[#8a6a4e]/45 bg-[#fffaf0]/60 p-3 font-body text-[1.05rem] text-ink placeholder:text-ink-soft/60 focus:border-[#a5772f] focus:outline-none"
      />
      <p className="mt-1 font-body text-[0.9rem] italic text-ink-soft">Only you can see this. It stays on this device.</p>
      <Rule className="mx-auto mt-4 h-3 w-40 text-[#7a5a2e]" />
      <Next
        onClick={() => {
          saveJournal(key, text);
          setReflected(true);
          onFinish();
        }}
      >
        I've reflected
      </Next>
    </section>
  );
}

// The stone's meter after a unit, and where to go next.
function Done({ u, result, mode }) {
  const state = useStore();
  const best = Math.max(state.units[u.id]?.meter ?? 0, result.meter);
  const earlierBest = best > result.meter;
  const levelDone = useMemo(() => levelById[u.level].units.every((x) => completed(state, x.id)), [state, u]);
  const c = useMemo(() => climb(state), [state]);
  const done = useMemo(() => Object.fromEntries(UNITS.map((x) => [x.id, completed(state, x.id)])), [state]);
  const next = useMemo(() => nextUnit(state, u.id), [state, u]);
  const [note, setNote] = useState('');
  return (
    <Frame>
      <Title u={u} />
      <Monument
        className="mx-auto mt-2 w-full max-w-[340px] rounded-lg bg-[#1a140e]"
        meters={c.meters}
        done={done}
        lit={Object.fromEntries(c.levels.map((l) => [l.id, l.lit]))}
        peak={c.peak}
        selected={u.id}
      />
      <div className="mt-3 text-center">
        <div className="font-body text-[1.05rem] italic text-ink-soft">Your {u.title} stone</div>
        <motion.div className="font-display text-[3rem] font-semibold text-[#8a5e1c]" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7 }}>
          {best}%
        </motion.div>
      </div>
      <Meter value={best} tone="parchment" />
      <p className="mt-3 font-body text-[1.1rem] leading-snug text-ink">
        {mode === 'muslim'
          ? inMode(`Your understanding of ${u.english.toLowerCase()} is growing: ${result.right} of ${result.total} understood the first time. May God make it easy for you to live it.`, mode)
          : `You've explored what Islam teaches about ${u.english.toLowerCase()}: ${result.right} of ${result.total} understood the first time.`}
        {earlierBest && ` This time came to ${result.meter}%; your stone keeps your best.`}
      </p>
      <p className="mt-2 font-body text-[0.98rem] text-ink-soft">
        Understanding counts {Math.round(CONFIG.weights.check * 100)}%, your choice and reflection {Math.round((CONFIG.weights.choice + CONFIG.weights.reflection) * 100)}%. Take it again any time to raise your meter.
      </p>
      {levelDone && <p className="mt-2 font-body text-[1.05rem] italic text-[#8a5e1c]">Every stone of {levelById[u.level].title} is now lit.</p>}
      {next && (
        <div className="mt-5 flex justify-end">
          <button type="button" className="btn-gold" onClick={() => go(next.history ? '/stories' : `/unit/${next.id}`)} ref={(el) => el?.focus({ preventScroll: true })}>
            Next: {next.title}
            <Icon name="next" className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className={`${next ? 'mt-2' : 'mt-5'} flex flex-wrap items-center justify-end gap-2`}>
        <button type="button" className="btn-ink" onClick={() => go(`/unit/${u.id}?again=${Date.now()}`)}>
          Take it again
        </button>
        <button type="button" className={next ? 'btn-ink' : 'btn-gold'} onClick={() => go('/pyramid')} autoFocus={!next}>
          Back to the pyramid
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-end gap-x-3">
        {note && (
          <span role="status" className="font-body text-[0.98rem] italic text-ink-soft">
            {note}
          </span>
        )}
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center px-2 font-body text-[1rem] text-ink-soft underline underline-offset-4"
          onClick={async () => setNote(shareMessage(await share()))}
        >
          Share Amanah with someone
        </button>
      </div>
      <Disclaimer tone="parchment" />
    </Frame>
  );
}
