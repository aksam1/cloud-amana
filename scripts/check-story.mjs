// Validates story data so scripture on screen is always exact:
//  · every caption's English is a verbatim excerpt of the Sahih International text ("…" marks gaps)
//  · every Arabic word range exists in the Uthmani text
//  · a scene's Arabic title is never a typed Quran phrase (Quran words come only from ayahs.json)
//  · scene nodes exist on the map, layer types exist in the registry (2D, or GL for renderer "gl"),
//    sound beds and effects exist in the audio engine, narration is 2–4 sentences, and no TODO from a
//    scaffolded scene is left
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ayahs = JSON.parse(readFileSync(join(root, 'src/data/ayahs.json'), 'utf8'));
const timeline = JSON.parse(readFileSync(join(root, 'src/story/timeline.json'), 'utf8'));
const registry = readFileSync(join(root, 'src/layers/index.js'), 'utf8');
const layerTypes = new Set([...registry.matchAll(/^\s+(\w+):\s*\w+,?$/gm)].map((m) => m[1]).concat('range'));
const nodes = new Set(timeline.nodes.map((n) => n.id));
const glTypes = new Set(JSON.parse(readFileSync(join(root, 'src/gl/types.json'), 'utf8')));
const audio = readFileSync(join(root, 'src/lib/audio.js'), 'utf8');
const beds = new Set([...audio.matchAll(/this\.bed\('(\w+)'/g)].map((m) => m[1]));
const effects = new Set([...audio.slice(audio.indexOf('const fx = {')).matchAll(/^\s{6}(\w+): \(\) =>/gm)].map((m) => m[1]));
// layers inside montage sets count as the scene's own
const flat = (layers) => layers.flatMap((l) => (l.type === 'set' ? flat(l.layers || []) : [l]));
// Arabic folded for comparison: no harakat, Quranic marks or tatweel, one form of alif and ya.
const fold = (s) =>
  s
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/[ٱأإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
const quran = Object.values(ayahs).map((a) => fold(a.ar));

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const scenes = walk(join(root, 'src/story/chapters'))
  .filter((f) => f.endsWith('.json') && !f.endsWith('chapter.json'))
  .map((f) => ({ file: f.slice(root.length + 1), ...JSON.parse(readFileSync(f, 'utf8')) }));

const norm = (s) => s.replace(/[“”"]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
const errors = [];
const warns = [];
const ids = new Set();

const expand = (ref) => {
  const m = /^(\d+):(\d+)(?:-(\d+))?$/.exec(ref);
  if (!m) return [ref];
  return m[3] ? Array.from({ length: +m[3] - +m[2] + 1 }, (_, i) => `${m[1]}:${+m[2] + i}`) : [ref];
};

for (const s of scenes) {
  const where = `${s.file}`;
  if (ids.has(s.id)) errors.push(`${where}: duplicate id "${s.id}"`);
  ids.add(s.id);
  if (!nodes.has(s.node)) errors.push(`${where}: unknown map node "${s.node}"`);
  for (const ref of (s.ayahs || []).flatMap(expand)) if (!ayahs[ref]) errors.push(`${where}: ayah ${ref} not fetched (run npm run ayahs)`);
  if (JSON.stringify(s).includes('TODO')) warns.push(`${where}: TODO left from the scaffold`);
  const title = fold(s.arabic || '');
  if (title.split(' ').length > 1 && quran.some((q) => q.includes(title))) errors.push(`${where}: Arabic title "${s.arabic}" quotes the Quran; use a plain Arabic title`);
  for (const name of [...(s.ambient || []), ...s.beats.flatMap((b) => b.ambient || [])]) if (!beds.has(name)) errors.push(`${where}: unknown sound bed "${name}"`);
  for (const name of s.beats.flatMap((b) => [].concat(b.sfx || []).map((x) => (typeof x === "string" ? x : x.name)))) if (!effects.has(name)) errors.push(`${where}: unknown sound effect "${name}"`);
  for (const l of flat(s.layers)) {
    if (!layerTypes.has(l.type) && !(s.renderer === 'gl' && glTypes.has(l.type))) errors.push(`${where}: unknown layer type "${l.type}"`);
    if (l.ref && !ayahs[l.ref]) errors.push(`${where}: layer ayah ${l.ref} not fetched`);
    if (l.ref && l.ar) {
      const n = ayahs[l.ref]?.ar.split(/\s+/).length ?? 0;
      if (l.ar[1] >= n) errors.push(`${where}: layer word range ${l.ar} outside ${l.ref} (${n} words)`);
    }
  }
  for (const [i, b] of s.beats.entries()) if (b.pendingVerse) warns.push(`${where}: beat ${i} still waits for its verse ${b.pendingVerse.ref} (fetch it, then npm run verses)`);
  const says = s.beats.filter((b) => b.say).length;
  if (says < 2 || says > 4) warns.push(`${where}: ${says} narration sentences (brief asks for 2–4)`);
  s.beats.forEach((b, i) => {
    const v = b.verse;
    if (!v) return;
    // a passage ("89:6-8") shows each ayah in full, or by one word range per ayah in `ar`
    const refs = expand(v.ref);
    const missing = refs.filter((r) => !ayahs[r]);
    if (missing.length) return errors.push(`${where} beat ${i}: ayah ${missing.join(', ')} not fetched`);
    const ranges = refs.length > 1 ? v.ar ?? refs.map(() => null) : [v.ar];
    refs.forEach((r, k) => {
      const words = ayahs[r].ar.split(/\s+/).length;
      const range = ranges[k];
      if (refs.length > 1 && range === null) return;
      if (!range || range[0] < 0 || range[1] >= words || range[0] > range[1]) errors.push(`${where} beat ${i}: Arabic range ${JSON.stringify(range)} invalid for ${r} (${words} words)`);
    });
    const full = norm(refs.map((r) => ayahs[r].en).join(' '));
    for (const frag of norm(v.en).split('…').map((f) => f.trim().replace(/^[\s,;:]+|[\s,;:]+$/g, '')).filter(Boolean)) {
      if (!full.includes(frag)) errors.push(`${where} beat ${i}: "${frag}" is not in Sahih ${v.ref}`);
    }
  });
}

warns.forEach((w) => console.warn('warn ', w));
errors.forEach((e) => console.error('ERROR', e));
console.log(`${scenes.length} scenes · ${scenes.reduce((n, s) => n + s.beats.filter((b) => b.verse).length, 0)} verse captions · ${errors.length} errors · ${warns.length} warnings`);
process.exit(errors.length ? 1 : 0);
