// Lessons are data, like scenes. Each chapter may have src/story/lessons/c<N>.json holding one lesson per
// part (`part` is the part's index in chapter.json `parts`). They live in their own folder so the scene
// generators, which rewrite chapter.json, never overwrite them. `npm run check` validates every file.
//
// A lesson: watchFor (shown before the part), questions [{ q, options, answer (index), replay {scene, beat} }],
// lesson { text, curious?, ref }, carry { title, ref } (Muslim view only), reflect { muslim, curious },
// act (Muslim view only). Verses are given by `ref` alone and always shown from src/data/ayahs.json.
import { chapterByNumber, sceneById } from './story.js';

const files = import.meta.glob('../story/lessons/*.json', { eager: true, import: 'default' });
const byChapter = Object.fromEntries(Object.values(files).map((f) => [f.chapter, f]));

export const lessonKey = (chapter, part) => `${chapter}:${part}`;

/** The lesson for part `part` of chapter `chapter`, or null. */
export function lessonFor(chapter, part) {
  return byChapter[chapter]?.parts.find((p) => p.part === part) || null;
}

/** The index of the part a scene belongs to. */
export function partOf(scene) {
  const parts = chapterByNumber[scene.chapter]?.parts || [];
  return parts.findIndex((p) => p.from !== undefined && scene.order >= p.from && scene.order <= p.to);
}

/** If `scene` closes a part that has a lesson, that part's index; otherwise null. */
export function lessonAfter(scene) {
  const parts = chapterByNumber[scene.chapter]?.parts || [];
  const i = partOf(scene);
  if (i < 0 || parts[i].to !== scene.order) return null;
  return lessonFor(scene.chapter, i) ? i : null;
}

/** The "watch for" question shown before a part starts, if the part's first scene is `scene`. */
export function watchForAt(scene) {
  const parts = chapterByNumber[scene.chapter]?.parts || [];
  const i = partOf(scene);
  if (i < 0 || parts[i].from !== scene.order) return null;
  return lessonFor(scene.chapter, i)?.watchFor || null;
}

/** Link that replays the moment a question is about. */
export const replayHref = (r) => (sceneById[r.scene] ? `/scene/${r.scene}?beat=${r.beat}` : null);
