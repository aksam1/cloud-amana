import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { go } from '../lib/router.js';
import { CHAPTERS, STORY_PARTS } from '../lib/pyramid.js';
import { SCENES, scenesOf, seenCount, storyResume } from '../lib/sceneIndex.js';
import { Icon } from './Ornaments.jsx';
import { Shell, whereInStory } from './Pyramid.jsx';
import Unveiled from './Unveiled.jsx';

/**
 * #/story: the one path through Amanah. Every chapter in order, each chapter's parts, each part's scenes, and the
 * short lesson that closes each part. The chapter where the reader is stands open; the others fold away.
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
  const [open, setOpen] = useState(() => new Set([up.chapter]));
  const toggle = (n) =>
    setOpen((was) => {
      const now = new Set(was);
      if (now.has(n)) now.delete(n);
      else now.add(n);
      return now;
    });

  return (
    <Shell here="story" stars>
      <h1 className="mt-4 font-display text-[1.8rem] font-semibold leading-tight text-gold-hi">The story</h1>
      <p className="mt-2 font-body text-[1.1rem] leading-snug text-ivory/80">From the first light to the Last Day, in order. A short lesson closes each part.</p>
      <p className="mt-1 font-body text-[1rem] italic text-ivory/60" role="status">
        {watched} of {SCENES.length} scenes watched, {lessons} of {STORY_PARTS.length} lessons
      </p>
      <button type="button" className="btn-gold mt-5 self-start" onClick={() => go(`/scene/${up.id}`)} autoFocus>
        <Icon name="play" className="h-4 w-4" />
        {all ? 'Watch again from the beginning' : started ? 'Continue the story' : 'Start at the beginning'}
      </button>
      {started && !all && <p className="mt-2 font-body text-[1.02rem] italic text-ivory/65">{whereInStory(up)}</p>}
      <Unveiled className="mt-5" />

      <ol className="mt-6 grid gap-2" aria-label="Chapters">
        {CHAPTERS.map((c) => (
          <Chapter key={c.number} c={c} seen={seen} learned={learned} up={all ? null : up.id} open={open.has(c.number)} onToggle={() => toggle(c.number)} />
        ))}
      </ol>
    </Shell>
  );
}

/** One chapter: a row that opens to its parts, scenes and lessons. A chapter still being written is a quiet line. */
function Chapter({ c, seen, learned, up, open, onToggle }) {
  const scenes = scenesOf(c.number);
  if (!scenes.length) {
    return (
      <li className="flex items-center gap-3 rounded-xl border border-gold/15 px-4 py-3">
        <ChapterMark n={c.number} quiet />
        <span className="min-w-0">
          <span className="block font-body text-[1.12rem] leading-tight text-ivory/60">{c.title}</span>
          <span className="block font-body text-[0.98rem] italic text-ivory/45">Still being written.</span>
        </span>
      </li>
    );
  }
  const done = scenes.filter((s) => seen[s.id]).length;
  const here = scenes.some((s) => s.id === up);
  const parts = (c.parts || []).map((p, i) => ({ p, i })).filter(({ p }) => p.from !== undefined);
  const id = `chapter-${c.number}`;
  return (
    <li className={`rounded-xl border ${here ? 'border-gold/55 bg-[#3c2a12]/30' : 'border-gold/25 bg-black/25'}`}>
      <h2>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle} className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left">
          <ChapterMark n={c.number} done={done === scenes.length} />
          <span className="min-w-0 flex-1">
            <span className="block font-body text-[1.18rem] font-semibold leading-tight text-gold-hi">{c.title}</span>
            <span className="block font-body text-[0.98rem] italic text-ivory/60">
              {done === scenes.length ? `All ${scenes.length} scenes watched` : `${done} of ${scenes.length} scenes watched`}
              {here ? ', you are here' : ''}
            </span>
          </span>
          <Icon name="chevron" className={`h-5 w-5 shrink-0 text-gold/70 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      {open && (
        <div id={id} className="px-2 pb-3 sm:px-3">
          {parts.map(({ p, i }) => (
            <Part key={i} c={c} p={p} i={i} titled={parts.length > 1 || p.title !== c.title} scenes={scenes} seen={seen} learned={learned} up={up} />
          ))}
        </div>
      )}
    </li>
  );
}

/** One part: its scenes, then the lesson that closes it. */
function Part({ c, p, i, titled, scenes, seen, learned, up }) {
  const list = scenes.filter((s) => s.order >= p.from && s.order <= p.to);
  if (!list.length) return null;
  const last = list[list.length - 1];
  const key = `${c.number}:${i}`;
  const href = `#/lesson/${c.number}/${i}?then=${encodeURIComponent('/story')}`;
  const row = 'flex min-h-[48px] items-center gap-3 rounded-lg px-2 py-2';
  return (
    <section className="mt-2" aria-label={p.title}>
      {titled && <h3 className="px-2 pb-1 pt-2 font-body text-[1.02rem] italic text-gold/80">{p.title}</h3>}
      <ol className="grid gap-0.5">
        {list.map((s) => {
          const isUp = s.id === up;
          const n = scenes.indexOf(s) + 1;
          return (
            <li key={s.id}>
              <a href={`#/scene/${s.id}`} aria-current={isUp ? 'step' : undefined} className={`${row} transition-colors hover:bg-black/30 ${isUp ? 'border border-gold/60 bg-[#3c2a12]/55' : ''}`}>
                <Dot n={n} done={!!seen[s.id]} />
                <span className="min-w-0 flex-1 font-body text-[1.06rem] leading-snug text-ivory">
                  {s.title}
                  {seen[s.id] && <span className="sr-only"> (watched)</span>}
                </span>
                {isUp && <span className="shrink-0 font-body text-[0.94rem] italic text-gold-hi">Up next</span>}
              </a>
            </li>
          );
        })}
        <li>
          {learned[key] ? (
            <a href={href} className={`${row} hover:bg-black/30`}>
              <LessonMark done />
              <span className="min-w-0 flex-1 font-body text-[1.04rem] leading-snug text-ivory/80">Lesson: {p.title}</span>
              <span className="shrink-0 font-body text-[0.94rem] italic text-ivory/55">Done</span>
            </a>
          ) : seen[last.id] ? (
            <a href={href} className={`${row} border border-gold/60 bg-[#3c2a12]/55 hover:border-gold-hi`}>
              <LessonMark ready />
              <span className="min-w-0 flex-1 font-body text-[1.06rem] font-semibold leading-snug text-gold-hi">Take the lesson: {p.title}</span>
            </a>
          ) : (
            <div className={row}>
              <LessonMark />
              <span className="min-w-0 flex-1 font-body text-[1.02rem] leading-snug text-ivory/50">
                Lesson: {p.title}
                <span className="block text-[0.94rem] italic">Opens after the last scene of this part.</span>
              </span>
            </div>
          )}
        </li>
      </ol>
    </section>
  );
}

function ChapterMark({ n, done = false, quiet = false }) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border font-display text-[1.02rem] ${
        quiet ? 'border-gold/20 text-ivory/40' : done ? 'border-gold-hi bg-[#a5772f] text-[#1a1208]' : 'border-gold/50 text-gold-hi'
      }`}
    >
      {done ? <Icon name="check" className="h-4 w-4" /> : n}
    </span>
  );
}

function Dot({ n, done }) {
  return (
    <span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border font-body text-[0.9rem] ${done ? 'border-gold-hi bg-[#a5772f] text-[#1a1208]' : 'border-gold/40 text-ivory/70'}`}>
      {done ? <Icon name="check" className="h-3.5 w-3.5" /> : n}
    </span>
  );
}

function LessonMark({ done = false, ready = false }) {
  return (
    <span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border ${done ? 'border-gold-hi bg-[#a5772f] text-[#1a1208]' : ready ? 'border-gold-hi text-gold-hi' : 'border-gold/25 text-ivory/40'}`}>
      <Icon name={done ? 'check' : 'book'} className="h-3.5 w-3.5" />
    </span>
  );
}
