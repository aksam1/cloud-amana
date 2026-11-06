import { useEffect } from 'react';
import { motion } from 'motion/react';
import { roman } from '../lib/geo.js';
import { useMode } from '../lib/words.js';

/**
 * The page between stories: before a chapter's first scene, a parchment card tells the reader where and
 * when they are, how this story follows from the last, and the family line that joins them. The scene
 * holds (paused) until the reader begins. `bridge` in chapter.json: { when, where, line: [names], text: [paragraphs] }.
 */
export function BridgeCard({ chapter, watchFor, onBegin }) {
  const { when, where, line = [], text = [] } = chapter.bridge;
  const { say } = useMode();
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onBegin();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onBegin]);
  return (
    <motion.div
      key="bridge"
      className="absolute inset-0 z-40 grid place-items-center bg-black/55 px-4 py-6 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
      onClick={onBegin}
    >
      <motion.article
        className="parchment ruled cartouche thin-scroll max-h-[88vh] w-full max-w-[560px] overflow-y-auto px-6 pb-5 pt-5 shadow-[0_30px_70px_-20px_rgba(0,0,0,.9)] sm:px-8"
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { delay: 0.2, duration: 0.7 } }}
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="bridge-title"
      >
        <div className="caps text-[0.62rem] text-ink-soft">Between the stories</div>
        <h2 id="bridge-title" className="font-display text-[1.3rem] font-semibold leading-tight text-ink">
          Chapter {roman(chapter.number)} · {chapter.title}
        </h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-body text-[0.98rem] text-ink">
          {when && (
            <>
              <dt className="caps pt-[3px] text-[0.6rem] text-ink-soft">When</dt>
              <dd>{when}</dd>
            </>
          )}
          {where && (
            <>
              <dt className="caps pt-[3px] text-[0.6rem] text-ink-soft">Where</dt>
              <dd>{where}</dd>
            </>
          )}
        </dl>
        {line.length > 0 && (
          <ol className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-display text-[0.95rem] text-ink" aria-label="Family line">
            {line.map((name, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true" className="text-[#8a6a2e]">→</span>}
                <span className={i === line.length - 1 ? 'font-semibold' : ''}>{name}</span>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-3 space-y-2 font-body text-[1.02rem] leading-relaxed text-ink">
          {text.map((p, i) => (
            <p key={i}>{say(p)}</p>
          ))}
        </div>
        {watchFor && (
          <div className="mt-4 rounded-md border border-[#8a6a2e]/40 bg-[#5a3d22]/5 px-3 py-2">
            <div className="caps text-[0.6rem] text-ink-soft">Watch for</div>
            <p className="font-body text-[1.02rem] leading-snug text-ink">{say(watchFor)}</p>
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button type="button" className="hud-btn" onClick={onBegin} autoFocus>
            Begin
          </button>
        </div>
      </motion.article>
    </motion.div>
  );
}
