import { useState } from 'react';
import { aheadOfGuide, closeGuide, guiding, jumpTo, nextStep, resumeGuide, skipStep, stepCopy, stepHref } from '../lib/journey.js';
import { getState, useStore } from '../lib/store.js';
import { useMode } from '../lib/words.js';
import { go } from '../lib/router.js';
import { Icon } from './Ornaments.jsx';
import Rail from './Rail.jsx';

/** Said once, wherever the guide is closed. */
export const GUIDE_CLOSED = 'Guide closed. Pick it up again from Home, Journey or Settings.';

/*
 * The guide's next step, on the pages a reader moves between (Journey, Explore, Progress, Paths, the two abodes, the
 * pyramid, the end): what it is, one button that does it, and the quiet choices: pass this step by, see every step,
 * or close the guide. Closing it leaves the guide where it stands (src/lib/journey.js): the reader roams freely, and
 * Home, Journey and Settings offer it back. Nothing here ever opens a page by itself.
 * `rail` draws the steps around this one; the Journey page, which holds them all below, leaves it out.
 */
export default function GuideBar({ className = '', rail = true }) {
  const state = useStore();
  const { say } = useMode();
  // closed just now, on this page: say so once, with a way to undo it
  const [closedHere, setClosedHere] = useState(false);

  if (!guiding(state)) {
    if (!closedHere) return null;
    return (
      <div role="status" className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-ivory/10 bg-black/25 px-4 py-2 font-body text-[1rem] italic text-ivory/70 ${className}`}>
        <span>{GUIDE_CLOSED}</span>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center rounded-full px-3 not-italic font-semibold text-gold-hi hover:bg-ivory/5"
          onClick={() => {
            resumeGuide();
            setClosedHere(false);
          }}
        >
          Undo
        </button>
      </div>
    );
  }

  const step = nextStep(state);
  if (!step) return null;
  const copy = stepCopy(step, state, say);
  const ahead = aheadOfGuide(state);

  return (
    <section aria-label="Your guide" className={`relative rounded-2xl border border-gold/30 bg-[#120e0a]/70 p-4 pr-14 backdrop-blur-sm sm:p-5 sm:pr-16 ${className}`}>
      <button type="button" className="absolute right-1.5 top-1.5 inline-flex h-11 w-11 items-center justify-center rounded-full text-ivory/55 hover:bg-ivory/5 hover:text-ivory" aria-label="Close the guide" onClick={() => { closeGuide(); setClosedHere(true); }}>
        <Icon name="close" className="h-5 w-5" />
      </button>
      <p className="font-body text-[1rem] italic text-gold/85">Next in your guide</p>
      {rail && <Rail className="-mr-10 mb-4 mt-3" />}
      <h2 className="mt-1 font-body text-[1.25rem] font-semibold leading-snug text-ivory">{copy.title}</h2>
      <p className="mt-0.5 text-pretty font-body text-[1.02rem] leading-snug text-ivory/70">{copy.line}</p>
      <div className="-mr-10 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <button type="button" className="hud-btn border-gold text-gold-hi" onClick={() => go(stepHref(step, getState()))}>
          {copy.action}
          <Icon name="arrow" className="h-4 w-4" />
        </button>
        <div className="-mx-3 flex flex-wrap">
          <button type="button" className="inline-flex min-h-[44px] items-center rounded-full px-3 font-body text-[1rem] text-ivory/65 transition-colors hover:bg-ivory/5 hover:text-ivory" onClick={() => skipStep(step)}>
            Skip this step
          </button>
          {rail && <EveryStep />}
        </div>
      </div>
      {ahead && (
        <button
          type="button"
          className="-ml-3 mt-1 inline-flex min-h-[44px] items-center rounded-full px-3 text-left font-body text-[1rem] italic text-ivory/60 hover:bg-ivory/5 hover:text-ivory"
          onClick={() => {
            jumpTo(ahead);
            go(stepHref(ahead, getState()));
          }}
        >
          Or go on from where you are in the story: {ahead.title}
        </button>
      )}
    </section>
  );
}

/** The quiet way to the whole journey, every step in order (#/story). */
export function EveryStep({ className = '' }) {
  return (
    <button type="button" className={`inline-flex min-h-[44px] items-center rounded-full px-3 font-body text-[1rem] text-ivory/65 transition-colors hover:bg-ivory/5 hover:text-ivory ${className}`} onClick={() => go('/story')}>
      See every step
    </button>
  );
}

/** A quiet "Resume the guide" link, for the pages that offer the guide back once it has been closed. */
export function ResumeGuide({ className = '', then = null, ink = false }) {
  const off = useStore((s) => !guiding(s));
  const left = useStore((s) => !!nextStep(s));
  if (!off || !left) return null;
  // `ink` for parchment pages (a unit's end), where the night's ivory would not show
  const tone = ink ? 'text-ink-soft hover:bg-black/5 hover:text-ink' : 'text-ivory/65 hover:bg-ivory/5 hover:text-ivory';
  return (
    <button
      type="button"
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-3 font-body text-[1rem] ${tone} ${className}`}
      onClick={() => {
        resumeGuide();
        if (then) go(then);
      }}
    >
      <Icon name="play" className="h-3.5 w-3.5" />
      Resume the guide
    </button>
  );
}
