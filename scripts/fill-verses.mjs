// Turns each beat's `pendingVerse` {ref, place, ar?, en?} into a real `verse` once its ayat are in
// src/data/ayahs.json (fetch them first with `npm run words -- <ref>`):
//   npm run verses
// A whole ayah or passage takes its English verbatim from ayahs.json. A part of an ayah needs `ar`
// [first, last] (or one range per ayah) and its matching `en` excerpt chosen by hand from the words
// output; those are reported, never guessed. The ref is added to the scene's `ayahs`.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ayahs = JSON.parse(readFileSync(join(root, 'src/data/ayahs.json'), 'utf8'));
const expand = (ref) => {
  const m = /^(\d+):(\d+)(?:-(\d+))?$/.exec(ref);
  if (!m) return [ref];
  return m[3] ? Array.from({ length: +m[3] - +m[2] + 1 }, (_, i) => `${m[1]}:${+m[2] + i}`) : [ref];
};
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

// written back as text, so the hand-laid-out scene files keep their shape
const compact = (o) => `{ ${Object.entries(o).map(([k, v]) => `"${k}": ${JSON.stringify(v)}`).join(', ')} }`;

let filled = 0;
const waiting = [];
for (const file of walk(join(root, 'src/story/chapters')).filter((f) => f.endsWith('.json') && !f.endsWith('chapter.json'))) {
  let text = readFileSync(file, 'utf8');
  const scene = JSON.parse(text);
  const refs = [];
  let skipped = 0; // pending verses left in the text ahead of the one being filled
  scene.beats.forEach((beat, i) => {
    const p = beat.pendingVerse;
    if (!p) return;
    const parts = expand(p.ref);
    const missing = parts.filter((r) => !ayahs[r]);
    const where = `${scene.id} beat ${i} (${p.ref})`;
    const wait = (why) => {
      skipped++;
      waiting.push(`${where}: ${why}`);
    };
    if (missing.length) return wait(`not fetched yet (${missing.join(', ')}); run npm run words -- ${p.ref}`);
    if (p.ar && !p.en) return wait('part of an ayah: add the matching Sahih International "en" excerpt to pendingVerse');
    const verse = { ref: p.ref, ...(p.ar ? { ar: p.ar } : {}), place: p.place ?? 'lower', en: p.en ?? parts.map((r) => ayahs[r].en).join(' ') };
    let n = 0;
    text = text.replace(/"pendingVerse": \{[^{}]*\}/g, (m) => (n++ === skipped ? `"verse": ${compact(verse)}` : m));
    refs.push(p.ref);
    filled++;
  });
  if (!refs.length) continue;
  const all = [...new Set([...(scene.ayahs ?? []), ...refs])];
  text = text.replace(/"ayahs": \[[^\]]*\]/, `"ayahs": ${JSON.stringify(all).replace(/","/g, '", "')}`);
  JSON.parse(text);
  writeFileSync(file, text);
}
console.log(`${filled} verse beat(s) filled.`);
if (waiting.length) console.log(`Still pending:\n  ${waiting.join('\n  ')}`);
