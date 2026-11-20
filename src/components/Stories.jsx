import { useEffect } from 'react';
import { storyResume } from '../lib/sceneIndex.js';
import { getState } from '../lib/store.js';

/** #/stories: straight back into the story where the reader left it (no second home page in between). */
export default function Stories() {
  useEffect(() => {
    window.location.replace(`#/scene/${storyResume(getState()).id}`);
  }, []);
  return null;
}
