import { MODES, setMode, useMode } from '../lib/words.js';

/**
 * The two ways in. `full` shows both choices as large cards (the first visit, or a lesson opened before
 * choosing); otherwise a single quiet switch shows the current view and flips to the other.
 */
export function ModePicker({ full = false, tone = 'night' }) {
  const { mode } = useMode();
  const ink = tone === 'parchment';
  if (full || !mode) {
    return (
      <div className="grid w-full max-w-[560px] gap-3 sm:grid-cols-2" role="group" aria-label="How would you like to explore the story?">
        {Object.entries(MODES).map(([id, m]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            aria-pressed={mode === id}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              ink
                ? `border-[#8a6a4e]/50 hover:bg-black/5 ${mode === id ? 'bg-[#5a3d22]/10' : ''}`
                : `border-gold/40 bg-black/30 hover:border-gold-hi ${mode === id ? 'border-gold-hi bg-[#3c2a12]/70' : ''}`
            }`}
          >
            <div className={`font-display text-[1.05rem] font-semibold ${ink ? 'text-ink' : 'text-gold-hi'}`}>{m.pick}</div>
            <div className={`mt-1 font-body text-[0.98rem] leading-snug ${ink ? 'text-ink-soft' : 'text-ivory/75'}`}>{m.blurb}</div>
          </button>
        ))}
      </div>
    );
  }
  const other = mode === 'muslim' ? 'curious' : 'muslim';
  return (
    <button
      type="button"
      onClick={() => setMode(other)}
      className={`flex min-h-[44px] items-center gap-2 font-body text-[1rem] ${ink ? 'text-ink-soft hover:text-ink' : 'text-ivory/75 hover:text-ivory'}`}
      aria-label={`Viewing as: ${MODES[mode].short}. Switch to ${MODES[other].short}`}
    >
      {MODES[mode].short}
      <span className={`underline underline-offset-4 ${ink ? 'text-ink-soft/80 decoration-[#8a6a4e]/50' : 'text-gold-hi/80 decoration-gold/40'}`}>Switch</span>
    </button>
  );
}
