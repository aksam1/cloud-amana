// How long a beat must stay on screen so its words can be read before auto-advance moves on.
// The player holds each beat for Math.max(beat.dur, captionHoldMs(text)): a scene's own timing
// wins whenever it is already long enough, and only beats with more words than time are held.

// Characters a reader takes in per second. Subtitle guidance for adults is 15–17; a verse in
// translation is denser than dialogue, so this sits at the slow end.
export const READ_CPS = 15;
// The eye finds the panel at the start and lets the last line sink in at the end.
const SETTLE_MS = 1200;
// Never hold one beat longer than this (the reader can always pause or tap on).
const MAX_HOLD_MS = 30000;

// Mirrors Captions.jsx: the Arabic is painted in over revealMs and the English starts at 55% of it.
const arabicRevealMs = (ar) => (ar ? Math.min(3200, 900 + ar.length * 32) : 0);
const readMs = (s) => (s.trim().length / READ_CPS) * 1000;

/**
 * @param {{ en?: string, ar?: string, say?: string }} text
 *   en  – English translation shown on screen with the verse (may be empty)
 *   ar  – Arabic shown above it; it is revealed right-to-left over ~2.4 s before it can be read
 *   say – the narration sentence for this beat, shown in the chronicle panel
 * @returns {number} minimum milliseconds the beat should stay before moving on
 */
export function captionHoldMs({ en = '', ar = '', say = '' }) {
  if (!en.trim() && !say.trim()) return 0;
  // The narration can be read while the Arabic paints in; the verse's English cannot start
  // before it appears, so the reader finishes whichever comes later, then reads the English.
  const englishFrom = en.trim() ? arabicRevealMs(ar) * 0.55 : 0;
  const ms = Math.max(readMs(say), englishFrom) + readMs(en) + SETTLE_MS;
  return Math.min(MAX_HOLD_MS, Math.round(ms));
}
