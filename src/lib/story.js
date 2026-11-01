// Story content is data: drop a chapter folder of JSON into src/story/chapters and it appears
// in the player and on the campaign map. No code changes needed to add scenes.
import timeline from '../story/timeline.json';
import ayahs from '../data/ayahs.json';
import { lerp, mixColor } from './geo.js';

const files = import.meta.glob('../story/chapters/**/*.json', { eager: true, import: 'default' });

export const chapters = [];
const scenes = [];
for (const [path, data] of Object.entries(files)) {
  (path.endsWith('/chapter.json') ? chapters : scenes).push(data);
}
chapters.sort((a, b) => a.number - b.number);
scenes.sort((a, b) => a.chapter - b.chapter || a.order - b.order);

export { timeline };
export const sceneList = scenes;
export const sceneById = Object.fromEntries(scenes.map((s) => [s.id, s]));
export const nodeById = Object.fromEntries(timeline.nodes.map((n) => [n.id, n]));
export const eraById = Object.fromEntries(timeline.eras.map((e) => [e.id, e]));
export const chapterByNumber = Object.fromEntries(chapters.map((c) => [c.number, c]));

export const sceneIndex = (id) => scenes.findIndex((s) => s.id === id);
export const nextScene = (id) => scenes[sceneIndex(id) + 1] || null;
export const prevScene = (id) => scenes[sceneIndex(id) - 1] || null;
export const nodeScenes = (nodeId) => scenes.filter((s) => s.node === nodeId);
export const chapterScenes = (n) => scenes.filter((s) => s.chapter === n);
/** The chapter that tells a map event, including chapters still planned (a chapter.json with no scenes yet). */
export const chapterForNode = (nodeId) => chapters.find((c) => c.nodes?.includes(nodeId)) || null;

/** Where the camera stands when beat `n` begins: the scene's opening framing, then each earlier beat's move. */
export function cameraAt(scene, n) {
  const c = { x: 0, y: 0, z: 1, r: 0, ...scene.cam };
  scene.beats.slice(0, n).forEach((bt) => {
    for (const k of ['x', 'y', 'z', 'r']) if (bt.cam?.[k] !== undefined) c[k] = bt.cam[k];
  });
  return c;
}

export function nextNodeId(nodeId) {
  const i = timeline.nodes.findIndex((n) => n.id === nodeId);
  return timeline.nodes[i + 1]?.id ?? null;
}

// ── Quran text ───────────────────────────────────────────

export function expandRef(ref) {
  const m = /^(\d+):(\d+)(?:-(\d+))?$/.exec(ref);
  if (!m) return [ref];
  const [, s, a, b] = m;
  if (!b) return [`${s}:${a}`];
  return Array.from({ length: +b - +a + 1 }, (_, i) => `${s}:${+a + i}`);
}

export const ayah = (ref) => ayahs[ref] || null;

const PAUSE_MARKS = /^[ۖ-۞۩\s]+|[ۖ-۞۩\s]+$/g;

/** Exact Uthmani words [from, to] (inclusive) of an ayah — captions never retype Arabic. */
export function arabicWords(ref, range) {
  const a = ayahs[ref];
  if (!a) return '';
  if (!range) return a.ar;
  return a.ar.split(/\s+/).slice(range[0], range[1] + 1).join(' ').replace(PAUSE_MARKS, '');
}

const DIGITS = '٠١٢٣٤٥٦٧٨٩';
const ayahMark = (ref) => `﴿${ref.split(':')[1].replace(/\d/g, (d) => DIGITS[d])}﴾`;

/**
 * A caption's Arabic. One ayah: its words [from, to]. A passage (`ref` "89:6-8"): each ayah in full, or
 * by the word ranges in `ar` (one per ayah), each closed by its numbered end-of-ayah mark.
 */
export function verseArabic(verse) {
  const refs = expandRef(verse.ref);
  if (refs.length === 1) return arabicWords(verse.ref, verse.ar);
  return refs.map((r, i) => `${arabicWords(r, verse.ar?.[i] ?? null)} ${ayahMark(r)}`).join(' ');
}

/** The first ayah of a caption (for its surah name). */
export const verseAyah = (verse) => ayah(expandRef(verse.ref)[0]);

// ── Layers ───────────────────────────────────────────────

/**
 * Expand composite layers. A `range` of mountains becomes one parallax ridge per depth. A `set` is one shot
 * of a WebGL montage: its `layers` are composed as if seen from the usual reference camera, then stood `dx`
 * across and `dz` along the camera's flight (a beat's `cam.dx`/`cam.dz` takes the camera there), sharing
 * the set's `show`.
 */
export function expandLayers(layers, from = {}) {
  return layers.flatMap((layer, i) => {
    const key = (from.key ? `${from.key}-` : '') + (layer.key || `${layer.type}-${i}`);
    if (layer.type === 'set') return expandLayers(layer.layers || [], { key, dx: (from.dx ?? 0) + (layer.dx ?? 0), dz: (from.dz ?? 0) + (layer.dz ?? 0), show: layer.show ?? from.show });
    const l = { ...layer, key };
    if (from.dx) l.dx = from.dx + (layer.dx ?? 0);
    if (from.dz) l.dz = from.dz + (layer.dz ?? 0);
    if (from.show && !layer.show) l.show = from.show;
    if (l.type !== 'range') return [l];
    const n = l.count || 4;
    return Array.from({ length: n }, (_, k) => {
      const t = n === 1 ? 1 : k / (n - 1);
      const pick = (v) => (Array.isArray(v) ? lerp(v[0], v[1], t) : v);
      return {
        ...l,
        type: 'ridge',
        key: `${key}-${k}`,
        y: pick(l.y),
        amp: pick(l.amp),
        depth: pick(l.depth ?? [0.3, 1]),
        sharp: pick(l.sharp ?? 0.45),
        // A range's `fade` (or `haze`) is how far each ridge fades into the haze below it;
        // the ridge's own `fade` stays the stage's dissolve time.
        haze: pick(l.haze ?? l.fade ?? [0.05, 0.25]),
        fade: l.dissolve,
        color: mixColor(l.colors[0], l.colors[1], t),
        seed: (l.seed || 1) + k * 13,
        delay: (l.stagger ?? 0.35) * k,
      };
    });
  });
}

/** `show: [from, to)`, or a list of such ranges for a layer that comes back (day and night intercut). */
export function visibleAt(layer, beat) {
  const ranges = Array.isArray(layer.show?.[0]) ? layer.show : [layer.show || []];
  return ranges.some(([from = 0, to = null]) => beat >= from && (to === null || beat < to));
}

/** Merge a layer's per-beat overrides (`at: { "3": {...} }`) cumulatively up to `beat`. */
export function resolveLayer(layer, beat) {
  if (!layer.at) return layer;
  const out = { ...layer };
  Object.keys(layer.at)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((k) => k <= beat && Object.assign(out, layer.at[k]));
  return out;
}
