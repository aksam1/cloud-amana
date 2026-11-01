// How long a beat must stay on screen so its words can be read before auto-advance moves on.
// The player holds each beat for Math.max(beat.dur, captionHoldMs(text)), so returning 0
// means "trust the scene's own timing", which is what happens until this is implemented.

/**
 * @param {{ en?: string, ar?: string, say?: string }} text
 *   en  – English translation shown on screen with the verse (may be empty)
 *   ar  – Arabic shown above it; it is revealed right-to-left over ~2.4 s before it can be read
 *   say – the narration sentence for this beat, shown in the chronicle panel
 * @returns {number} minimum milliseconds the beat should stay before moving on
 */
export function captionHoldMs({ en = '', ar = '', say = '' }) {
  // TODO(human): turn the amount of text into a reading time.
  return 0;
}
