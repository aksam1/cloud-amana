// The two ways to walk through the story. Everyone sees the same scenes and verses; the mode only changes
// the words around them (Allah or God in narration) and which lesson steps appear.
//
// To rename the modes, change the labels here: every screen reads them from this one place.
import { setPref, useStore } from './store.js';

export const MODES = {
  muslim: {
    pick: "I'm Muslim",
    short: 'Muslim view',
    blurb: 'Says Allah, and adds a dua to learn and a private reflection after each part.',
  },
  curious: {
    pick: "I'm exploring Islam",
    short: 'Exploring view',
    blurb: 'Says God, and explains what Muslims take from each story.',
  },
};

// "God" is swapped for "Allah" only when it is used as His name. When it is a common noun ("the God of
// Musa", "your God", "one God") it stays, so Pharaoh's and the brothers' words still read naturally.
// Lowercase "god" and "gods" (idols, Pharaoh) are never touched: the match is case-sensitive.
const NAME = /(?<!\b(?:the|The|your|Your|one|One|a|my|his|their|our|Musa's) )\bGod\b/g;

/** Narration or lesson text as this mode reads it. */
export function inMode(text, mode) {
  if (!text || mode !== 'muslim') return text;
  return text.replace(NAME, 'Allah');
}

/** The current mode ('muslim', 'curious', or null before the reader has chosen) and a text filter for it. */
export function useMode() {
  const mode = useStore((s) => s.prefs.mode);
  return { mode, say: (text) => inMode(text, mode) };
}

export const setMode = (mode) => setPref('mode', mode);
