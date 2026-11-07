import { useEffect } from 'react';
import { sceneById, sceneList } from '../lib/story.js';
import { getState } from '../lib/store.js';

/** Where the reader should pick the story up: the last scene if unfinished, else the next unseen one. */
export function storyResume(state) {
  const last = state.last && sceneById[state.last];
  if (last && !state.seen[last.id]) return last;
  if (last) {
    const next = sceneList.slice(sceneList.indexOf(last) + 1).find((s) => !state.seen[s.id]);
    if (next) return next;
  }
  return sceneList.find((s) => !state.seen[s.id]) || sceneList[0];
}

/** #/stories: straight back into the story (no second home page in between). */
export default function Stories() {
  useEffect(() => {
    window.location.replace(`#/scene/${storyResume(getState()).id}`);
  }, []);
  return null;
}
