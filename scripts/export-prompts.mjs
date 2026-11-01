// Writes docs/IMAGE-PROMPTS.md from each scene's `imagePrompt`, adding the shared style and rules.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const STYLE =
  'Painterly epic matte painting in the manner of a Total War campaign cutscene: Bronze-Age grandeur (warm golds, deep reds, dramatic skies, marble and stone, heroic scale, as in Total War Saga: Troy) rendered with ink-wash and watercolour textures on aged parchment, an elegant brush-stroke border and a stylised campaign-map feel (as in Total War: Three Kingdoms). Arabic calligraphy in place of Chinese calligraphy; Islamic eight-pointed-star geometry in the border corners. Cinematic 16:9.';
const RULES =
  'Never depict God in any form; divine presence only as light, text or atmosphere. No faces or detailed bodies for prophets, Adam or Hawwa: only soft figures of light seen from far away or from behind, or silhouettes. Angels only as light, wings or radiance; jinn as smokeless fire; Iblis as a shadowy flame-like form, never a cartoon devil. No gore. No lettering except the calligraphy described.';
const NEGATIVE = 'faces, detailed human anatomy, horns, pitchfork, halo over a person, cartoon, modern objects, Chinese characters, Latin text, gore, blood spatter, weapons';

const MAP_PROMPT =
  'A campaign map painted on aged parchment in the Three Kingdoms style: ink-wash mountains, blue-grey rivers, a sea drawn in wave hatching, desert stipple, a winding road of bronze seal markers each with an eight-pointed star, five regions labelled in Arabic calligraphy and Roman capitals (Creation; Adam and His Children; The Prophets; The Final Messenger; The Last Day), a compass rose shaped as an eight-pointed star; warm sepia, bronze and muted lapis.';

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const scenes = walk(join(root, 'src/story/chapters'))
  .filter((f) => f.endsWith('.json') && !f.endsWith('chapter.json'))
  .map((f) => JSON.parse(readFileSync(f, 'utf8')))
  .sort((a, b) => a.chapter - b.chapter || a.order - b.order);

const out = [
  '# Image prompts — Chapter 1',
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
