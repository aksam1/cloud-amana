import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { deleteAllData, savePlacement, useStore } from '../lib/store.js';
import { inMode, useMode } from '../lib/words.js';
import { go } from '../lib/router.js';
import { climb, completed, DISCLAIMER, levelById, LEVELS, pathOf, placementQuestions, placementResult, SCALE, unitById, UNITS, unitStatus } from '../lib/pyramid.js';
import { GeoField, Icon, Rule } from './Ornaments.jsx';
import { ModePicker } from './ModePicker.jsx';
import Monument from './Monument.jsx';

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
  return <Landing />;
}

// ── Shared pieces ─────────────────────────────────────────

function Shell({ children, back, title, stars = false }) {
  return (
    <div className="parchment-night thin-scroll relative h-full w-full overflow-y-auto">
      <GeoField opacity={0.05} size={140} />
      {stars && <Stars />}
      <div className="relative z-10 mx-auto flex min-h-full max-w-[600px] flex-col px-5 pb-6 pt-4">
        {(back || title) && (
          <header className="mb-2 flex min-h-[48px] items-center gap-3">
            {back && (
              <button type="button" className="hud-btn icon" onClick={() => go(back)} aria-label="Back">
                <Icon name="prev" className="h-4 w-4" />
              </button>
            )}
            {title && <div className="caps text-[0.66rem] text-gold/85">{title}</div>}
          </header>
        )}
        {children}
      </div>
    </div>
  );
}

// A sparse field of stars over the night sky (fixed positions, so it never shifts between renders).
const STARS = Array.from({ length: 46 }, (_, i) => ({ x: (i * 37.7) % 100, y: (i * 23.3) % 46, r: i % 7 === 0 ? 1.4 : 0.8, o: 0.25 + ((i * 13) % 50) / 100 }));
function Stars() {
  return (
    <svg className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] w-full" preserveAspectRatio="none" viewBox="0 0 100 50" aria-hidden="true">
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
  return order.find((u) => unitStatus(u.id) === 'ready' && !completed(state, u.id))?.id || null;
}

const unitHref = (id) => (unitStatus(id) === 'history' ? '/chronicle' : `/unit/${id}`);

function UnitChip({ id }) {
  const u = unitById[id];
  return (
    <button type="button" onClick={() => go(unitHref(id))} className="rounded-full border border-gold/35 bg-black/25 px-3 py-1.5 font-body text-[1rem] text-ivory hover:border-gold-hi">
      {u.title} <span className="text-ivory/60">· {u.english}</span>
    </button>
  );
}

// ── Landing ───────────────────────────────────────────────

function Landing() {
  const { mode } = useMode();
  const c = useClimb();
  const [selected, setSelected] = useState(null);
  const placed = !!c.state.placement;
  const next = suggestion(c.state, c.current);
  const level = levelById[c.current];
  const idx = LEVELS.findIndex((l) => l.id === c.current);
  const above = LEVELS[idx + 1];

  return (
    <Shell stars>
      <div className="flex items-center justify-between">
        <div className="caps text-[0.62rem] text-gold/80">The hadith of Jibril</div>
        <button type="button" className="flex min-h-[44px] items-center gap-2 font-body text-[1rem] text-ivory/75 hover:text-ivory" onClick={() => go('/chronicle')}>
          <Icon name="book" className="h-4 w-4" /> The chronicle
        </button>
      </div>
      <motion.h1 className="mt-1 text-center font-display text-[1.7rem] font-semibold leading-tight text-gold-hi sm:text-[2.1rem]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
        The Pyramid of Righteousness
      </motion.h1>
      <p className="mt-1 text-center font-body text-[1.25rem] italic text-ivory/85">Where do you stand on the path?</p>

      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 1.1 }}>
        <Monument
          className="mx-auto mt-2 w-full max-w-[520px]"
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
      <p className="-mt-1 text-center font-body text-[0.95rem] text-ivory/55">Tap any stone to see its lesson.</p>

      <AnimatePresence>{selected && <UnitCard key={selected} id={selected} meter={c.meters[selected]} done={c.done[selected]} onClose={() => setSelected(null)} />}</AnimatePresence>

      {!mode ? (
        <section className="mt-5 flex flex-col items-center gap-3">
          <h2 className="text-center font-display text-[1.1rem] text-gold-hi">First, how would you like to explore?</h2>
          <ModePicker full />
        </section>
      ) : !placed ? (
        <section className="mt-5 flex flex-col items-center gap-3 text-center">
          <p className="max-w-[42ch] font-body text-[1.1rem] leading-snug text-ivory/85">
            {mode === 'muslim'
              ? inMode('A few short reflection questions will find where to begin your climb. It is not a grade, and only you will see your answers.', mode)
              : 'A few short questions about your own values and curiosity will suggest where to begin. It is not a grade, and only you will see your answers.'}
          </p>
          <button type="button" className="btn-gold" onClick={() => go('/pyramid/placement')} autoFocus>
            <Icon name="play" className="h-4 w-4" />
            Begin your reflection
          </button>
          <p className="font-body text-[0.95rem] text-ivory/55">{placementQuestions(pathOf(mode)).length} questions · about 3 minutes</p>
        </section>
      ) : (
        <section className="mt-5 rounded-xl border border-gold/25 bg-black/30 p-4">
          <div className="caps text-[0.6rem] text-gold/80">{c.peak ? 'Every stone is lit' : 'Where you are on the climb'}</div>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <div className="font-display text-[1.5rem] font-semibold text-gold-hi">{level.title}</div>
            <div lang="ar" dir="rtl" className="font-quran text-[1.5rem] text-gold/80">
              {level.arabic}
            </div>
          </div>
          <p className="font-body text-[1rem] text-ivory/70">{level.meaning}</p>
          <div className="mt-3">
            <Meter value={c.currentProgress} label={above && !c.peak ? `Toward ${above.title}` : `${level.title} progress`} />
          </div>
          <p className="mt-2 font-body text-[0.95rem] text-ivory/55">Overall understanding {c.overall}%</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {next && (
              <button type="button" className="btn-gold" onClick={() => go(unitHref(next))} autoFocus>
                <Icon name="play" className="h-4 w-4" />
                Next: {unitById[next].title} · {unitById[next].english}
              </button>
            )}
            <button type="button" className="hud-btn" onClick={() => go('/pyramid/progress')}>
              Your progress
            </button>
          </div>
        </section>
      )}

      {mode && (
        <div className="mt-4 flex justify-center">
          <ModePicker />
        </div>
      )}
      <Disclaimer />
    </Shell>
  );
}

function UnitCard({ id, meter, done, onClose }) {
  const u = unitById[id];
  const status = unitStatus(id);
  const learned = useStore((s) => Object.keys(s.learned).length);
  return (
    <motion.section
      className="parchment cartouche relative mt-3 px-5 pb-4 pt-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      aria-label={`${u.title}: ${u.english}`}
    >
      <button type="button" className="absolute right-2 top-2 grid h-11 w-11 place-items-center text-ink-soft hover:text-ink" onClick={onClose} aria-label="Close">
        <Icon name="close" className="h-4 w-4" />
      </button>
      <div className="caps text-[0.58rem] text-ink-soft">{levelById[u.level].title}</div>
      <div className="flex items-baseline gap-3 pr-10">
        <h2 className="font-display text-[1.3rem] font-semibold text-ink">{u.title}</h2>
        <span lang="ar" dir="rtl" className="font-quran text-[1.35rem] text-ink-soft">
          {u.arabic}
        </span>
      </div>
      <p className="font-body text-[1.05rem] text-ink-soft">{u.english}</p>
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
          <button type="button" className="btn-gold mt-3" onClick={() => go('/chronicle')}>
            <Icon name="book" className="h-4 w-4" />
            Enter the chronicle
          </button>
        </>
      )}
      {status === 'soon' && <p className="mt-2 font-body text-[1rem] italic text-ink-soft">This lesson path is still being written.</p>}
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
        <h1 className="mt-4 font-display text-[1.3rem] text-gold-hi">First, how would you like to explore?</h1>
        <div className="mt-4">
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
          <p className="caps text-[0.6rem] text-gold/80">
            {levelById[q.level].title} · {i + 1} of {questions.length}
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
    <Shell back="/" title="Your starting point">
      <Monument className="mx-auto w-full max-w-[460px]" meters={c.meters} done={c.done} lit={c.lit} peak={c.peak} start={r.start} recommended={r.recommended} />
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}>
        <p className="caps text-center text-[0.62rem] text-gold/80">Begin your climb at</p>
        <h1 className="text-center font-display text-[2rem] font-semibold text-gold-hi">{level.title}</h1>
        <p className="text-center font-body text-[1.05rem] text-ivory/75">{level.meaning}</p>
        <Rule className="mx-auto my-4 h-3 w-44 text-gold/60" />

        <h2 className="caps text-[0.62rem] text-gold/80">Where you feel strong</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {r.strongest.map((id) => (
            <UnitChip key={id} id={id} />
          ))}
        </div>
        {r.growing.length > 0 && (
          <>
            <h2 className="caps mt-4 text-[0.62rem] text-gold/80">Where you can grow</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {r.growing.map((id) => (
                <UnitChip key={id} id={id} />
              ))}
            </div>
          </>
        )}

        {rec && (
          <div className="parchment cartouche mt-5 px-5 py-4">
            <div className="caps text-[0.58rem] text-ink-soft">A good first step</div>
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-[1.25rem] font-semibold text-ink">{rec.title}</h2>
              <span lang="ar" dir="rtl" className="font-quran text-[1.3rem] text-ink-soft">
                {rec.arabic}
              </span>
            </div>
            <p className="font-body text-[1.05rem] text-ink-soft">{rec.english}</p>
            <button type="button" className="btn-gold mt-3" onClick={() => go(unitHref(rec.id))} autoFocus>
              <Icon name="play" className="h-4 w-4" />
              {unitStatus(rec.id) === 'history' ? 'Enter the chronicle' : `Begin ${rec.title}`}
            </button>
          </div>
        )}
        <p className="mt-4 font-body text-[1rem] leading-snug text-ivory/65">
          {mode === 'muslim'
            ? 'This is a starting point, not a verdict. Every level is open to you; reflect again whenever you like.'
            : 'This is only a suggestion of where to start. Every level is open to you.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="hud-btn" onClick={() => go('/')}>
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
    <Shell back="/" title="Your progress">
      <section className="rounded-xl border border-gold/25 bg-black/30 p-4">
        <div className="caps text-[0.6rem] text-gold/80">Where you are on the climb</div>
        <div className="font-display text-[1.6rem] font-semibold text-gold-hi">{levelById[c.current].title}</div>
        <div className="mt-3 space-y-3">
          {c.levels.map((l) => (
            <Meter key={l.id} value={l.progress} label={`${l.title} · ${l.done} of ${l.total} units${l.lit ? ' · lit' : ''}`} />
          ))}
        </div>
        <p className="mt-3 font-body text-[1rem] text-ivory/60">Overall understanding {c.overall}%</p>
      </section>

      {LEVELS.map((l) => (
        <section key={l.id} className="mt-5">
          <h2 className="caps text-[0.62rem] text-gold/80">{l.title}</h2>
          <ul className="mt-2 divide-y divide-gold/10">
            {l.units.map((u) => {
              const status = unitStatus(u.id);
              return (
                <li key={u.id}>
                  <button type="button" className="flex min-h-[52px] w-full items-center gap-3 py-2 text-left" onClick={() => go(unitHref(u.id))} disabled={status === 'soon'}>
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
