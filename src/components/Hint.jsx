import { dismissHint, useStore } from '../lib/store.js';
import { go } from '../lib/router.js';

/**
 * A first-visit pointer: one line about the page it sits on, shown until the reader closes it. "Got it" closes
 * this one; "No more tips" closes every one (Settings can bring them back); "Show me around" opens the guide.
 * It never covers a page's own controls: callers place it in the flow, or over open sky.
 */
export default function Hint({ id, children, className = '', guide = true }) {
  const hints = useStore((s) => s.prefs.hints || {});
  if (hints[id] || hints.all) return null;
  const small = 'min-h-[44px] px-1 font-body text-[1rem] underline decoration-gold/40 underline-offset-4';
  return (
    <div role="note" aria-label="Tip" className={`rounded-2xl border border-gold/40 bg-[#0c0b12]/90 px-4 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md ${className}`}>
      <p className="font-body text-[1.05rem] leading-snug text-ivory/90">{children}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-4">
        <button type="button" className={`${small} text-gold-hi`} onClick={() => dismissHint(id)}>
          Got it
        </button>
        {guide && (
          <button type="button" className={`${small} text-ivory/75 hover:text-ivory`} onClick={() => go('/guide')}>
            Show me around
          </button>
        )}
        <button type="button" className={`${small} text-ivory/55 hover:text-ivory`} onClick={() => dismissHint('all')}>
          No more tips
        </button>
      </div>
    </div>
  );
}
