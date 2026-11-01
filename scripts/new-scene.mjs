// Scaffolds a scene file from a template, numbered into its chapter:
//   npm run scene -- 4 39 dunes "The Land of the Sand Dunes"          (2D layered scene)
//   npm run scene -- 4 39 dunes "The Land of the Sand Dunes" --gl     (WebGL scene of painted cards)
// The chapter's first map node is used; fill every TODO, then `npm run check` (it flags any left).
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const gl = args.includes('--gl');
const [chapter, order, id, title] = args.filter((a) => a !== '--gl');
if (!chapter || !order || !id || !title) {
  console.log('usage: npm run scene -- <chapter> <order> <id> "<Title>" [--gl]');
  process.exit(1);
}
const dir = join(root, 'src/story/chapters', `c${chapter}`);
const chapterFile = join(dir, 'chapter.json');
if (!existsSync(chapterFile)) {
  console.log(`No ${chapterFile}: add the chapter first.`);
  process.exit(1);
}
const ch = JSON.parse(readFileSync(chapterFile, 'utf8'));
const node = ch.nodes?.[0] ?? 'TODO';
const file = join(dir, `s${order}-${id}.json`);
if (existsSync(file)) {
  console.log(`${file} already exists.`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });

const head = {
  id,
  chapter: +chapter,
  order: +order,
  node,
  title,
  arabic: 'TODO plain Arabic title (never a typed Quran phrase)',
  source: 'quran',
  ayahs: ['TODO'],
  art: ['TODO what is imagined, and how prophets appear (only as light, far off or from behind)'],
  ambient: ['wind'],
  base: '#3e4a66',
  captions: 'parchment',
};
const beats = [
  { dur: 6500, cam: gl ? { pos: [800, 430, 1000], look: [800, 450, 0] } : { x: 0, y: 0, z: 1 }, say: 'TODO one narration sentence.' },
  { dur: 9000, cam: gl ? { pos: [800, 440, 900], look: [800, 450, 0] } : { y: 120, z: 1.04 }, verse: { ref: 'TODO', ar: [0, 0], place: 'lower', en: 'TODO verbatim Sahih International excerpt (… for gaps)' } },
];
const scene = gl
  ? {
      ...head,
      renderer: 'gl',
      // pen: the verse is written word by word and its English fades in word by word
      pen: true,
      dissolve: 2200,
      world: { fog: '#f0dcc0', fogNear: 6000, fogFar: 40000, light: 1, rays: 0.4, bloom: 0.6, haze: 0.15, hazeY: 0.6, shake: 0.6, dof: 0 },
      cam: { pos: [800, 450, 1000], look: [800, 450, 0] },
      imagePrompt: 'TODO',
      layers: [
        { type: 'sky', depth: 0.03, fog: 0, stops: [[0, '#9cc0da'], [0.45, '#f0e6d4'], [0.75, '#f6d6a8'], [1, '#eeb474']] },
        { type: 'sun', pos: [1200, 200, -26000], size: 30, color: '#fff0c8' },
        { type: 'dunes', depth: 0.05, y: 560, amp: 10, count: 14, seed: 1, haze: 0.5 },
        { type: 'dunes', depth: 0.3, y: 640, amp: 40, count: 5, seed: 2 },
        { type: 'dunes', depth: 0.8, y: 780, amp: 60, count: 4, seed: 3 },
        { type: 'light', depth: 0.5, pos: [800, 660], h: 60, color: '#fffaf0', glow: 1.2 },
        { type: 'dust', box: [-1400, 0, -3000, 3000, 1000, 1000], count: 1500, size: 3, color: '#ffe0b0', opacity: 0.4, wind: [16, -2, 0] },
      ],
      beats,
    }
  : {
      ...head,
      focus: 0.9,
      dissolve: 2000,
      cam: { x: 0, y: 0, z: 1 },
      imagePrompt: 'TODO',
      layers: [
        { type: 'sky', depth: 0.05, stops: [[0, '#6a8ab0'], [0.6, '#e8d4b0'], [1, '#f4dcb0']] },
        { type: 'range', count: 3, y: [520, 600], amp: [60, 90], depth: [0.2, 0.5], colors: ['#c8a888', '#8a6a50'], haze: [0.2, 0.5], seed: 1 },
        { type: 'ground', depth: 0.9, y: 700, color: '#c8a46e', color2: '#8a6a40' },
        { type: 'figure', depth: 0.9, x: 800, y: 700, h: 60, color: '#fff4d6', glow: 1.3 },
      ],
      beats,
    };
writeFileSync(file, `${JSON.stringify(scene, null, 2)}\n`);
console.log(`wrote ${file.slice(root.length + 1)} (node "${node}"). Add it to a part in chapter.json if the chapter has parts.`);
