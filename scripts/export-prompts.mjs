// Writes docs/IMAGE-PROMPTS.md from each scene's `imagePrompt`, adding the shared style and rules.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const STYLE =
  'Painterly epic matte painting in the manner of a Total War campaign cutscene: warm golds, deep reds, dramatic skies, heroic scale, as in Total War Saga: Troy, rendered with ink-wash and watercolour textures on aged parchment, an elegant brush-stroke border and a stylised campaign-map feel (as in Total War: Three Kingdoms). The built world is true to its own age: mud-brick and reed huts of the first generations, low flat-roofed towns of Sumer and Canaan, Egyptian pylon gates and limestone terraces, Assyrian crenellated walls, dressed-stone Jerusalem, low lime-plastered Galilean houses — no modern-era towers, no tall buildings before their time, every wall the height of the age it belongs to. Arabic calligraphy in place of Chinese calligraphy; Islamic eight-pointed-star geometry in the border corners. Cinematic 16:9.';
const RULES =
  'Never depict God in any form; divine presence only as light, text or atmosphere. No faces or detailed bodies for prophets, Adam or Hawwa: only soft figures of light seen from far away or from behind, or silhouettes. Angels only as light, wings or radiance; jinn as smokeless fire; Iblis as a shadowy flame-like form, never a cartoon devil. No gore. No lettering except the calligraphy described.';
const NEGATIVE = 'faces, detailed human anatomy, horns, pitchfork, halo over a person, cartoon, modern objects, Chinese characters, Latin text, gore, blood spatter, weapons';

const MAP_PROMPT =
  'A map of time painted on aged parchment, not a map of land: a single thread of gold light descending from a point of light at the top down through five horizontal strata of time — Creation, Adam and His Children, The Prophets, The Final Messenger, The Last Day — each stratum its own muted tone (lapis blue, olive green, ochre, deep green, dark red) ruled with faint lines like rock layers; along the thread, bronze seal markers each with an eight-pointed star, the seals crowding tight together where the prophets lived close in time and spreading far apart where ages passed; the thread already walked glowing gold, the rest faint and dashed; a soft glow of the Hour at the bottom; no mountains, no rivers, no sea, no compass, no road; warm sepia, bronze and muted lapis.';

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const scenes = walk(join(root, 'src/story/chapters'))
  .filter((f) => f.endsWith('.json') && !f.endsWith('chapter.json'))
  .map((f) => JSON.parse(readFileSync(f, 'utf8')))
  .sort((a, b) => a.chapter - b.chapter || a.order - b.order);

const out = [
  '# Image prompts',
  '',
  'Generated from the scene files by `npm run prompts`. Each prompt = scene description + shared style + content rules.',
  '',
  `**Shared style.** ${STYLE}`,
  '',
  `**Content rules (append to every prompt).** ${RULES}`,
  '',
  `**Negative prompt.** ${NEGATIVE}`,
  '',
  '## Campaign map',
  '',
  MAP_PROMPT,
  '',
  ...scenes.flatMap((s) => [`## ${s.order}. ${s.title} (\`${s.id}\`)`, '', s.imagePrompt, '', `> ${STYLE} ${RULES}`, '']),
];
writeFileSync(join(root, 'docs/IMAGE-PROMPTS.md'), out.join('\n'));
console.log(`docs/IMAGE-PROMPTS.md · ${scenes.length} scenes + map`);
