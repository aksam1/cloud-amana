import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.js';
import { go } from '../lib/router.js';
import { DOORS } from '../lib/discover.js';
import { CHAPTERS, STORY_PARTS, unitById } from '../lib/pyramid.js';
import { SCENES, scenesOf, seenCount, storyResume } from '../lib/sceneIndex.js';
import { useMode } from '../lib/words.js';
import { Icon } from './Ornaments.jsx';
import { Shell, whereInStory } from './Pyramid.jsx';
import Unveiled from './Unveiled.jsx';
import { ResumeGuide } from './GuideBar.jsx';
import { guiding, isDone, nextStep, stepHref, stepName, STEPS, stepsAfterLesson } from '../lib/journey.js';

const FIRST_STEPS = STEPS.filter((s) => s.kind === 'view' || s.kind === 'tour');
const doorIcon = Object.fromEntries(DOORS.map((d) => [d.id, d.icon]));
/** Which group of the page a step is in: 'start', or its chapter's number. */
const groupOf = (step) => step.chapter ?? 'start';
/** The row a step is drawn as: a part is its first scene not yet watched. */
const rowOf = (step, seen) => (step.kind === 'part' ? `scene:${step.scenes.find((id) => !seen[id]) || step.scenes[0]}` : step.id);

/**
 * #/story, "Journey" in the menu: the whole of Amanah as one line, in the guide's own order (src/lib/journey.js).
 * First the two steps that get a reader started, then every chapter: each part's scenes, the short lesson that closes
 * it, and what follows from it (a place to see, the pyramid lessons that replay it). One row is lit, where the reader
 * is, and its group stands open; the others fold away. Every row opens what it names, so the order is never a lock.
 * It reads only the light scene index (vite.config.js, `virtual:scene-index`), never the scenes themselves.
 */
export default function StoryPage() {
  const state = useStore();
  const seen = state.seen || {};
  const learned = state.learned || {};
  const started = !!state.last || Object.keys(seen).length > 0;
  const up = storyResume(state);
  const watched = seenCount(state);
  const all = watched >= SCENES.length;
  const lessons = STORY_PARTS.filter((p) => learned[p.key]).length;
  const step = nextStep(state);
  const guided = guiding(state) && !!step;
  const upRow = all ? null : `scene:${up.id}`;
  // the one lit row: the guide's next step while it is on; with it closed, the story's next scene
  const marks = {
    here: guided ? rowOf(step, seen) : upRow,
    label: guided ? 'You are here' : 'Up next',
    // and, quietly, the other place a reader may want: where the story was left, or where the closed guide waits
    other: guided ? (started ? upRow : null) : step && rowOf(step, seen),
    otherLabel: guided ? 'You stopped here' : 'The guide waits here',
  };
  const group = guided ? groupOf(step) : all ? null : up.chapter;
  const [open, setOpen] = useState(() => new Set([group]));
  // the lit row moves on (a step skipped, the guide closed or picked up): its group opens, so it can be seen
  useEffect(() => setOpen((was) => (was.has(group) ? was : new Set([...was, group]))), [group]);
  const toggle = (g) =>
    setOpen((was) => {
      const now = new Set(was);
      if (now.has(g)) now.delete(g);
      else now.add(g);
      return now;
    });

  return (
    <Shell here="story" stars guide="plain">
      <h1 className="mt-2 font-display text-[1.8rem] font-semibold leading-tight text-gold-hi">Your journey</h1>
      <p className="mt-2 text-pretty font-body text-[1.1rem] leading-snug text-ivory/80">Every step in order, from the first light to the Last Day. Follow it, or open any step you like.</p>
      <p className="mt-1 font-body text-[1rem] italic text-ivory/60" role="status">
        {watched} of {SCENES.length} scenes watched, {lessons} of {STORY_PARTS.length} lessons
      </p>
      {/* While the guide is on, its card above is the way on; without it, the story's own next scene is. */}
      {!guided && (
        <button type="button" className="btn-gold mt-5 self-start" onClick={() => go(`/scene/${up.id}`)} autoFocus>
          <Icon name="play" className="h-4 w-4" />
          {all ? 'Watch again from the beginning' : started ? 'Continue the story' : 'Start at the beginning'}
        </button>
      )}
      {!guided && started && !all && <p className="mt-2 font-body text-[1.02rem] italic text-ivory/65">{whereInStory(up)}</p>}
      <ResumeGuide className="-ml-3 mt-2 self-start" />
      <Unveiled className="mt-5" />

      <ol className="mt-6 grid gap-2" aria-label="Every step, in order">
        <Fold
          id="start"
          mark={FIRST_STEPS.every((s) => isDone(s, state)) ? 'done' : <Icon name="play" className="h-3.5 w-3.5" />}
          title="Getting started"
          line={FIRST_STEPS.every((s) => isDone(s, state)) ? 'Both steps done' : 'Two short steps'}
          here={group === 'start'}
          open={open.has('start')}
          onToggle={() => toggle('start')}
        >
          <ol className="grid gap-0.5">
            {FIRST_STEPS.map((s) => (
              <StepRow key={s.id} step={s} state={state} marks={marks} />
            ))}
          </ol>
        </Fold>
        {CHAPTERS.map((c) => (
          <Chapter key={c.number} c={c} state={state} marks={marks} here={group === c.number} open={open.has(c.number)} onToggle={() => toggle(c.number)} />
        ))}
      </ol>
    </Shell>
  );
}

// the line of light from one group to the next
const LINKED = 'relative before:absolute before:-top-[9px] before:left-[34px] before:h-[9px] before:w-px before:bg-gold/45 first:before:hidden';

/** A group of steps: a row that opens to them. */
function Fold({ id, mark, title, line, here, open, onToggle, children }) {
  return (
    <li className={`${LINKED} rounded-xl border ${here ? 'border-gold/55 bg-[#3c2a12]/30' : 'border-gold/25 bg-black/25'}`}>
      <h2>
        <button type="button" aria-expanded={open} aria-controls={`steps-${id}`} onClick={onToggle} className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left">
          <Mark done={mark === 'done'}>{mark}</Mark>
          <span className="min-w-0 flex-1">
            <span className="block font-body text-[1.18rem] font-semibold leading-tight text-gold-hi">{title}</span>
            <span className="block font-body text-[0.98rem] italic text-ivory/60">
              {line}
              {here ? ', you are here' : ''}
            </span>
          </span>
          <Icon name="chevron" className={`h-5 w-5 shrink-0 text-gold/70 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      {open && (
        <div id={`steps-${id}`} className="px-2 pb-3 sm:px-3">
          {/* one line down through the steps; each step's mark stands on it */}
          <div className="relative before:absolute before:bottom-6 before:left-[22.5px] before:top-0 before:w-px before:bg-gold/30">{children}</div>
        </div>
      )}
    </li>
  );
}

/** One chapter: its parts, each with its scenes, its lesson and what follows. A chapter still being written is a quiet line. */
function Chapter({ c, state, marks, here, open, onToggle }) {
  const seen = state.seen || {};
  const scenes = scenesOf(c.number);
  if (!scenes.length) {
    return (
      <li className={`${LINKED} flex items-center gap-3 rounded-xl border border-gold/15 px-4 py-3`}>
        <Mark quiet>{c.number}</Mark>
        <span className="min-w-0">
          <span className="block font-body text-[1.12rem] leading-tight text-ivory/60">{c.title}</span>
          <span className="block font-body text-[0.98rem] italic text-ivory/45">Still being written.</span>
        </span>
      </li>
    );
  }
  const done = scenes.filter((s) => seen[s.id]).length;
  const parts = (c.parts || []).map((p, i) => ({ p, i })).filter(({ p }) => p.from !== undefined);
  return (
    <Fold
      id={`chapter-${c.number}`}
      mark={done === scenes.length ? 'done' : c.number}
      title={c.title}
      line={done === scenes.length ? `All ${scenes.length} scenes watched` : `${done} of ${scenes.length} scenes watched`}
      here={here}
      open={open}
      onToggle={onToggle}
    >
      {parts.map(({ p, i }) => (
        <Part key={i} c={c} p={p} i={i} titled={parts.length > 1 || p.title !== c.title} scenes={scenes} state={state} marks={marks} />
      ))}
    </Fold>
  );
}

/** One part: its scenes, the lesson that closes it, then the places and pyramid lessons that come from it. */
function Part({ c, p, i, titled, scenes, state, marks }) {
  const seen = state.seen || {};
  const list = scenes.filter((s) => s.order >= p.from && s.order <= p.to);
  if (!list.length) return null;
  const last = list[list.length - 1];
  const key = `${c.number}:${i}`;
  const lesson = `lesson:${key}`;
  const href = `#/lesson/${c.number}/${i}?then=${encodeURIComponent('/story')}`;
  const learned = !!state.learned?.[key];
  const open = learned || seen[last.id] || marks.here === lesson;
  return (
    <section className="mt-2 first:mt-0" aria-label={p.title}>
      {titled && <h3 className="relative pb-1 pl-12 pr-2 pt-2 font-body text-[1.02rem] italic text-gold/80">{p.title}</h3>}
      <ol className="grid gap-0.5">
        {list.map((s) => (
          <Row key={s.id} id={`scene:${s.id}`} href={`#/scene/${s.id}`} mark={scenes.indexOf(s) + 1} done={!!seen[s.id]} doneWord="watched" marks={marks}>
            {s.title}
          </Row>
        ))}
        <Row
          id={lesson}
          href={open ? href : null}
          square
          mark={<Icon name="book" className="h-3.5 w-3.5" />}
          done={learned}
          ready={open && !learned}
          note={open ? null : 'Opens after the last scene of this part.'}
          marks={marks}
        >
          {open && !learned ? 'Take the lesson' : 'Lesson'}: {p.title}
        </Row>
        {stepsAfterLesson(key).map((s) => (
          <StepRow key={s.id} step={s} state={state} marks={marks} />
        ))}
      </ol>
    </section>
  );
}

/** A step that is one thing to do: the two first steps, a place to see, a pyramid lesson. */
function StepRow({ step, state, marks }) {
  const { say } = useMode();
  const done = isDone(step, state);
  const icon = { view: 'target', tour: 'help', unit: 'pyramid' }[step.kind] || doorIcon[step.place];
  return (
    <Row
      id={step.id}
      href={`#${step.kind === 'view' && done ? '/settings' : stepHref(step, state)}`}
      square={step.kind !== 'view' && step.kind !== 'tour'}
      mark={<StepIcon name={icon} />}
      done={done}
      note={step.kind === 'unit' ? say(unitById[step.unit].english) : null}
      tag={step.kind === 'view' && done ? 'Change' : null}
      marks={marks}
    >
      {step.kind === 'place' ? `A place to see: ${step.title}` : stepName(step)}
    </Row>
  );
}

/** One step on the line. Lit when it is where the reader is. */
function Row({ id, href, mark, square = false, done, doneWord = 'done', ready = false, note = null, tag = null, marks, children }) {
  const here = id === marks.here;
  const other = !here && id === marks.other;
  const word = here ? marks.label : other ? marks.otherLabel : tag || (done && doneWord === 'done' ? 'Done' : null);
  const look = here ? 'border-gold/60 bg-[#3c2a12]/55 hover:border-gold-hi' : `border-transparent ${href ? 'hover:bg-black/30' : ''}`;
  const tone = here || ready ? 'font-semibold text-gold-hi' : href ? 'text-ivory' : 'text-ivory/50';
  const Tag = href ? 'a' : 'div';
  return (
    <li className="relative">
      <Tag {...(href ? { href, 'aria-current': here ? 'step' : undefined } : {})} className={`flex min-h-[48px] items-center gap-3 rounded-lg border px-2 py-2 transition-colors ${look}`}>
        <span
          aria-hidden="true"
          className={`grid h-7 w-7 shrink-0 place-items-center border font-body text-[0.9rem] ${square ? 'rounded-md' : 'rounded-full'} ${
            done ? 'border-gold-hi bg-[#a5772f] text-[#1a1208]' : here || ready ? 'border-gold-hi bg-[#1d150b] text-gold-hi' : 'border-gold/40 bg-[#0d0b10] text-ivory/70'
          } ${here ? 'shadow-[0_0_0_4px_rgba(226,187,104,0.18),0_0_18px_rgba(226,187,104,0.45)]' : ''}`}
        >
          {done ? <Icon name="check" className="h-3.5 w-3.5" /> : mark}
        </span>
        <span className={`min-w-0 flex-1 font-body text-[1.06rem] leading-snug ${tone}`}>
          {children}
          {done && <span className="sr-only"> ({doneWord})</span>}
          {note && <span className="block text-[0.96rem] font-normal italic text-ivory/60">{note}</span>}
        </span>
        {word && <span className={`shrink-0 font-body text-[0.94rem] italic ${here ? 'text-gold-hi' : 'text-ivory/60'}`} aria-hidden={word === 'Done' ? true : undefined}>{word}</span>}
      </Tag>
    </li>
  );
}

/** An icon from the set, or the two abodes' diamond (one shape above, one below). */
function StepIcon({ name }) {
  if (name !== 'diamond') return <Icon name={name} className="h-3.5 w-3.5" />;
  return (
    <svg viewBox="-12 -12 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M0 -10 L8 0 L0 10 L-8 0 Z" />
      <path d="M-8 0 H8" />
    </svg>
  );
}

/** A group's round mark: its number, or a tick once all of it is done. */
function Mark({ done = false, quiet = false, children }) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border font-display text-[1.02rem] ${
        quiet ? 'border-gold/20 text-ivory/40' : done ? 'border-gold-hi bg-[#a5772f] text-[#1a1208]' : 'border-gold/50 bg-[#0d0b10] text-gold-hi'
      }`}
    >
      {done ? <Icon name="check" className="h-4 w-4" /> : children}
    </span>
  );
}
