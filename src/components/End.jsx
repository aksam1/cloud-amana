import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ayah, chapterByNumber, sceneList } from '../lib/story.js';
import { STORY_PARTS } from '../lib/pyramid.js';
import { useStore } from '../lib/store.js';
import { track } from '../lib/usage.js';
import { go } from '../lib/router.js';
import { quranLink, share, shareMessage } from '../lib/site.js';
import { PATHS } from './Paths.jsx';
import { Icon, Rule, starPath } from './Ornaments.jsx';
import { Shell, Disclaimer } from './Pyramid.jsx';

/*
 * The end of the chronicle (#/end): what the reader has watched, what is still open, and where to
 * go next. It is not a result and it is not a reward: no grade, no score, nothing said about
 * anyone's standing with God. Plain counts, and doors back into the story.
 *
 * Chapter 19 (the Final Messenger ﷺ) is paused and has no scenes, so "the whole chronicle" means
 * every scene that exists.
 */

// The one verse of the closing. 12:111 — "There was certainly in the stories of the messengers a lesson for people of
// understanding." — which is what this chronicle is: the stories of the messengers, and what a reader learns from
// them. It comes from src/data/ayahs.json (Sahih International), so it is never typed in here.
const CLOSING_VERSE = '12:111';

export default function End() {
  const state = useStore();
  const reduced = useReducedMotion();
  const [note, setNote] = useState('');
  const seen = state.seen || {};
  const learned = state.learned || {};

  // the counts: the reader reached the end of the chronicle
  useEffect(() => {
    track('end.reached');
  }, []);

  const total = sceneList.length;
  const watched = sceneList.filter((s) => seen[s.id]).length;
  const lessons = STORY_PARTS.length;
  const lessonsDone = STORY_PARTS.filter((p) => learned[p.key]).length;

  // what is still open: the first scenes not yet watched, by chapter, and the lessons not finished
  const open = useMemo(() => {
    const byChapter = [];
    for (const s of sceneList) {
      if (seen[s.id]) continue;
      const ch = chapterByNumber[s.chapter];
      const last = byChapter.at(-1);
      // the FIRST unwatched scene of the chapter is the one to offer, so never overwrite it
      if (last && last.chapter === s.chapter) continue;
      byChapter.push({ chapter: s.chapter, title: ch?.title || `Chapter ${s.chapter}`, first: s });
    }
    const undone = STORY_PARTS.filter((p) => !learned[p.key]);
    return { chapters: byChapter, lessons: undone };
  }, [seen, learned]);

  const a = ayah(CLOSING_VERSE);

  return (
    <Shell here="stories" back="/map" title="The chronicle" stars>
      {/* the seal and its thread of light: the same gold the map ends with */}
      <div className="relative mx-auto mt-6 flex flex-col items-center">
        <svg viewBox="-60 -60 120 120" className="h-32 w-32 sm:h-40 sm:w-40" aria-hidden="true">
          <motion.circle
            r="52"
            fill="none"
            stroke="#e2bb68"
            strokeWidth="1.4"
            opacity="0.5"
            initial={{ pathLength: reduced ? 1 : 0, rotate: reduced ? 0 : -30 }}
            animate={{ pathLength: 1, rotate: 0 }}
            transition={{ duration: reduced ? 0 : 2.4, ease: 'easeOut' }}
            style={{ originX: '50%', originY: '50%' }}
          />
          <motion.path
            d={starPath(44, 0.72)}
            fill="none"
            stroke="#f7e0a3"
            strokeWidth="1.8"
            initial={{ pathLength: reduced ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduced ? 0 : 3.2, ease: 'easeOut' }}
          />
          <circle r="7" fill="#f7e0a3" />
        </svg>
        <h1 className="mt-4 max-w-[18ch] text-center font-display text-[clamp(1.7rem,7vw,2.6rem)] font-semibold leading-tight text-gold-hi">
          The chronicle, from the Creation to the Day of Judgment
        </h1>
        <Rule className="my-4 h-3 w-48 text-gold/70" />
        <p className="max-w-[44ch] text-center font-body text-[1.12rem] leading-snug text-ivory/80">
          Thank you for watching.
        </p>
        <p className="mt-2 max-w-[40ch] text-center font-body text-[1rem] italic leading-snug text-ivory/50">
          The Final Messenger ﷺ is coming later, so the chronicle ends here for now.
        </p>
      </div>

      {/* what has been done, in plain counts */}
      <section className="mt-6 rounded-2xl border border-gold/20 bg-black/25 p-5" aria-label="What you have watched">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-[1.15rem] font-semibold text-gold-hi">What you have watched</h2>
        </div>
        <p className="mt-2 font-body text-[1.15rem] leading-snug text-ivory/85">
          <span className="text-gold-hi">{watched}</span> of {total} scenes
        </p>
        <p className="font-body text-[1.15rem] leading-snug text-ivory/85">
          <span className="text-gold-hi">{lessonsDone}</span> of {lessons} lessons finished
        </p>
        <p className="mt-1 font-body text-[1rem] italic text-ivory/55">Counts of what you have seen, not a grade.</p>
      </section>

      {/* the closing verse */}
      {a && (
        <section className="mt-5 rounded-2xl border border-gold/20 bg-black/25 p-5" aria-label="A verse to end on">
          <figure>
            <p lang="ar" dir="rtl" className="quran text-[clamp(1.4rem,4vw,2rem)] leading-[2] text-gold-hi">
              {a.ar}
            </p>
            <figcaption className="mt-2 font-body text-[1.08rem] leading-snug text-ivory/85">
              “{a.en}”{' '}
              <a href={quranLink(CLOSING_VERSE)} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-gold-hi underline decoration-gold/40 underline-offset-4">
                Quran {CLOSING_VERSE}, {a.surah}
              </a>
            </figcaption>
          </figure>
        </section>
      )}

      {/* what is still open, as doors, not as a list of failures */}
      {(open.chapters.length > 0 || open.lessons.length > 0 || PATHS.length > 0) && (
        <section className="mt-6" aria-labelledby="open-h">
          <h2 id="open-h" className="font-display text-[1.15rem] font-semibold text-gold-hi">
            Still open
          </h2>
          {open.chapters.length > 0 && (
            <>
              <p className="mt-2 font-body text-[1.05rem] italic text-ivory/60">Scenes you have not watched</p>
              <ul className="mt-2 grid gap-2">
                {open.chapters.slice(0, 5).map((c) => (
                  <li key={c.chapter}>
                    <a href={`#/scene/${c.first.id}`} className="flex min-h-[48px] items-center gap-3 rounded-xl border border-gold/25 bg-black/25 px-3 py-2 hover:border-gold-hi">
                      <span className="min-w-0 flex-1">
                        <span className="block font-body text-[1.1rem] font-semibold leading-tight text-gold-hi">{c.title}</span>
                        <span className="block truncate font-body text-[1rem] italic text-ivory/65">{c.first.title}</span>
                      </span>
                      <Icon name="next" className="h-4 w-4 shrink-0 text-gold-hi" />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          {open.lessons.length > 0 && (
            <>
              <p className="mt-4 font-body text-[1.05rem] italic text-ivory/60">Lessons not yet finished</p>
              <ul className="mt-2 grid gap-2">
                {open.lessons.slice(0, 5).map((l) => (
                  <li key={l.key}>
                    <a href={`#/lesson/${l.chapter}/${l.key.split(':')[1]}`} className="flex min-h-[48px] items-center gap-3 rounded-xl border border-gold/25 bg-black/25 px-3 py-2 hover:border-gold-hi">
                      <span className="min-w-0 flex-1 font-body text-[1.08rem] leading-tight text-ivory/90">{l.title}</span>
                      <Icon name="next" className="h-4 w-4 shrink-0 text-gold-hi" />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-4 font-body text-[1.05rem] italic text-ivory/60">Paths through the stories</p>
          <ul className="mt-2 grid gap-2">
            {PATHS.slice(0, 4).map((p) => (
              <li key={p.id}>
                <a href={`#/path/${p.id}`} className="flex min-h-[48px] items-center gap-3 rounded-xl border border-gold/25 bg-black/25 px-3 py-2 hover:border-gold-hi">
                  <span className="min-w-0 flex-1 font-body text-[1.08rem] leading-tight text-ivory/90">{p.title}</span>
                  <Icon name="next" className="h-4 w-4 shrink-0 text-gold-hi" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* the ways back */}
      <section className="mt-6 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-gold" onClick={() => go('/')}>
          Back home
        </button>
        <button type="button" className="hud-btn" onClick={() => go('/map')}>
          See the map
        </button>
        <button type="button" className="hud-btn" onClick={() => go('/abodes')}>
          The two abodes
        </button>
        <button type="button" className="hud-btn" onClick={() => go('/stories')}>
          Revisit the stories
        </button>
        <button type="button" className="hud-btn" onClick={async () => setNote(shareMessage(await share()))}>
          Share Amanah
        </button>
      </section>
      {note && (
        <p role="status" className="mt-2 font-body text-[1rem] italic text-ivory/70">
          {note}
        </p>
      )}

      <Disclaimer />
    </Shell>
  );
}
