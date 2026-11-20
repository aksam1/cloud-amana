// The story's outline, light enough for the first screen: every scene's id, chapter, order and title, in story
// order (written at build time by the `virtual:scene-index` plugin in vite.config.js). Nothing here loads a scene.
import index from 'virtual:scene-index';

/** Every scene, `{ id, chapter, order, title }`, in story order. */
export const SCENES = index;
export const sceneAt = Object.fromEntries(index.map((s) => [s.id, s]));

const byChapter = {};
for (const s of index) (byChapter[s.chapter] ||= []).push(s);
/** A chapter's scenes, in order (none for a chapter still being written). */
export const scenesOf = (chapter) => byChapter[chapter] || [];

/** A scene's place in its own chapter, counted from 1: `{ n, of }` ("Scene 3 of 19"). */
export function placeOf(id) {
  const s = sceneAt[id];
  if (!s) return { n: 0, of: 0 };
  const list = byChapter[s.chapter];
  return { n: list.indexOf(s) + 1, of: list.length };
}

/** How many scenes this reader has watched. */
export const seenCount = (state) => index.reduce((n, s) => n + (state.seen?.[s.id] ? 1 : 0), 0);

/**
 * Where the reader picks the story up: the last scene opened if they left it unfinished, else the next unseen
 * scene after it, else the first unseen scene anywhere, else the very first. With its place in the chapter.
 */
export function storyResume(state) {
  const seen = state.seen || {};
  const last = state.last && sceneAt[state.last];
  let s = last && !seen[last.id] ? last : null;
  if (!s && last) s = index.slice(index.indexOf(last) + 1).find((x) => !seen[x.id]) || null;
  if (!s) s = index.find((x) => !seen[x.id]) || index[0];
  return { ...s, ...placeOf(s.id) };
}
