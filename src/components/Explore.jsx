import { useEffect, useState } from 'react';
import { DOORS, GUIDE_DOOR, fresh, opened } from '../lib/discover.js';
import { go } from '../lib/router.js';
import { getState, markFound, useStore } from '../lib/store.js';
import { Icon } from './Ornaments.jsx';
import { Shell } from './Pyramid.jsx';

/**
 * #/explore: the other ways into the same stories. None of them is a step on the path: the path is Journey.
 *
 * The doors open as the story reaches them (src/lib/discover.js). An open door is listed first, marked "New" on
 * the visit after it opened; a door still ahead says how it opens and can be opened now, by choice. Nothing here
 * is required, and nothing here opens by itself.
 */
export default function Explore() {
  const open = useStore(opened);
  // the doors that are new on this visit, taken before the visit counts as having seen them
  const [news] = useState(() => fresh(getState()));
  const ready = DOORS.filter((d) => open[d.id]);
  const ahead = DOORS.filter((d) => !open[d.id]);
  const readyIds = ready.map((d) => d.id).join(' ');
  useEffect(() => {
    if (readyIds) markFound(...readyIds.split(' '));
  }, [readyIds]);
  return (
    <Shell here="explore" stars guide>
      <h1 className="mt-4 font-display text-[1.8rem] font-semibold leading-tight text-gold-hi">Explore</h1>
      <p className="mt-2 font-body text-[1.1rem] leading-snug text-ivory/80">Other ways into the same stories. Nothing here is required.</p>
      <ul className="mt-5 grid gap-3">
        {[...ready, GUIDE_DOOR].map((d) => (
          <li key={d.id}>
            <button type="button" onClick={() => go(d.to)} className="flex w-full items-start gap-3 rounded-xl border border-gold/35 bg-black/30 px-4 py-3 text-left transition-colors hover:border-gold-hi">
              <Mark icon={d.icon} />
              <span className="min-w-0">
                <span className="flex flex-wrap items-baseline gap-x-2 font-body text-[1.22rem] font-semibold leading-tight text-gold-hi">
                  {d.title}
                  {news[d.id] && <span className="rounded-full border border-gold/50 px-2 py-px text-[0.95rem] font-normal italic text-gold-hi">New</span>}
                </span>
                <span className="mt-1 block font-body text-[1.05rem] leading-snug text-ivory/80">{d.line}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {ahead.length > 0 && (
        <section className="mt-7" aria-labelledby="ahead">
          <h2 id="ahead" className="font-body text-[1.2rem] font-semibold text-ivory/85">
            Still ahead
          </h2>
          <p className="mt-1 font-body text-[1.02rem] italic leading-snug text-ivory/60">These open as you go. You can open any of them now.</p>
          <ul className="mt-3 grid gap-2">
            {ahead.map((d) => (
              <li key={d.id} className="flex items-start gap-3 rounded-xl border border-dashed border-gold/20 bg-black/15 px-4 pb-1 pt-3">
                <Mark icon={d.icon} dim />
                <span className="min-w-0 flex-1">
                  <span className="block font-body text-[1.12rem] font-semibold leading-tight text-ivory/75">{d.title}</span>
                  <span className="mt-0.5 block font-body text-[1rem] leading-snug text-ivory/65">{d.line}</span>
                  <span className="mt-0.5 block font-body text-[0.98rem] italic leading-snug text-ivory/50">{d.opens}</span>
                  {/* the way to open it now, always in the same place: under what it is and how it opens */}
                  <span className="block">
                    <button type="button" className="min-h-[44px] font-body text-[1rem] text-gold-hi/85 underline decoration-gold/35 underline-offset-4 hover:text-gold-hi" onClick={() => go(d.to)} aria-label={`Open ${d.title.toLowerCase()} now`}>
                      Open it now
                    </button>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button type="button" className="hud-btn mt-6 self-start" onClick={() => go('/story')}>
        <Icon name="book" className="h-4 w-4" />
        Or follow the whole story in order
      </button>
    </Shell>
  );
}

/** A door's round seal (the two abodes keep their diamond: one shape above, one below, as in the guide). */
function Mark({ icon, dim = false }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border ${
        dim ? 'h-9 w-9 border-gold/20 bg-black/30 text-gold/50' : 'mt-0.5 h-11 w-11 border-gold/45 bg-[radial-gradient(circle,#3c2a12_0%,#120d0a_80%)] text-gold-hi'
      }`}
      aria-hidden="true"
    >
      {icon === 'diamond' ? (
        <svg viewBox="-12 -12 24 24" className={dim ? 'h-4 w-4' : 'h-5 w-5'} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M0 -10 L8 0 L0 10 L-8 0 Z" />
          <path d="M-8 0 H8" />
        </svg>
      ) : (
        <Icon name={icon} className={dim ? 'h-4 w-4' : 'h-5 w-5'} />
      )}
    </span>
  );
}
