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
    // one whole ayah may leave `ar` out (as `npm run verses` writes it): then its English must be the whole ayah too
    const whole = refs.length === 1 && v.ar === undefined;
    if (whole && norm(v.en) !== norm(ayahs[refs[0]].en)) errors.push(`${where} beat ${i}: ${v.ref} has no Arabic range, so its English must be the whole ayah`);
    refs.forEach((r, k) => {
      const words = ayahs[r].ar.split(/\s+/).length;
      const range = ranges[k];
      if (whole || (refs.length > 1 && range === null)) return;
      if (!range || range[0] < 0 || range[1] >= words || range[0] > range[1]) errors.push(`${where} beat ${i}: Arabic range ${JSON.stringify(range)} invalid for ${r} (${words} words)`);
    });
    const full = norm(refs.map((r) => ayahs[r].en).join(' '));
    for (const frag of norm(v.en).split('…').map((f) => f.trim().replace(/^[\s,;:]+|[\s,;:]+$/g, '')).filter(Boolean)) {
      if (!full.includes(frag)) errors.push(`${where} beat ${i}: "${frag}" is not in Sahih ${v.ref}`);
    }
  });
}

// ── Lessons (src/story/lessons/c<N>.json): one per part, verses by ref only ──
const lessonDir = join(root, 'src/story/lessons');
const chapterFiles = walk(join(root, 'src/story/chapters')).filter((f) => f.endsWith('chapter.json')).map((f) => JSON.parse(readFileSync(f, 'utf8')));
const sceneIds = new Map(scenes.map((s) => [s.id, s]));
let lessonCount = 0;
for (const f of readdirSync(lessonDir).filter((f) => f.endsWith('.json'))) {
  const where = `src/story/lessons/${f}`;
  const L = JSON.parse(readFileSync(join(lessonDir, f), 'utf8'));
  const ch = chapterFiles.find((c) => c.number === L.chapter);
  if (!ch) { errors.push(`${where}: no chapter ${L.chapter}`); continue; }
  for (const p of L.parts || []) {
    const at = `${where} part ${p.part}`;
    lessonCount++;
    if (!ch.parts?.[p.part]) errors.push(`${at}: chapter ${L.chapter} has no part ${p.part}`);
    if (!p.watchFor) warns.push(`${at}: no watchFor question`);
    if (!p.questions?.length) errors.push(`${at}: needs at least one question`);
    (p.questions || []).forEach((q, i) => {
      if (!q.q || !Array.isArray(q.options) || q.options.length < 2) errors.push(`${at} question ${i}: needs q and 2+ options`);
      if (!(q.answer >= 0 && q.answer < (q.options || []).length)) errors.push(`${at} question ${i}: answer ${q.answer} is not one of the options`);
      if (new Set(q.options).size !== (q.options || []).length) errors.push(`${at} question ${i}: two options are the same`);
      if (q.replay) {
        const sc = sceneIds.get(q.replay.scene);
        if (!sc) errors.push(`${at} question ${i}: replay scene "${q.replay.scene}" does not exist`);
        else if (!(q.replay.beat >= 0 && q.replay.beat < sc.beats.length)) errors.push(`${at} question ${i}: scene "${sc.id}" has no beat ${q.replay.beat}`);
      } else warns.push(`${at} question ${i}: no replay moment`);
    });
    if (!p.lesson?.text) errors.push(`${at}: needs lesson.text`);
    if (!p.reflect?.muslim || !p.reflect?.curious) errors.push(`${at}: needs reflect.muslim and reflect.curious`);
    // verses are shown from ayahs.json by ref; the lesson file must never carry Quran text itself
    for (const [k, ref] of [['lesson', p.lesson?.ref], ['carry', p.carry?.ref]]) {
      if (ref && !ayahs[ref]) warns.push(`${at}: ${k} verse ${ref} not fetched yet (shown once it is)`);
    }
    const all = JSON.stringify(p);
    if (/[؀-ۿ]/.test(all)) errors.push(`${at}: Arabic typed into a lesson; give a verse ref instead`);
    if (/\bAllah\b/.test(all)) errors.push(`${at}: write "God" in lessons; the Muslim view shows Allah automatically`);
  }
}

// ── The pyramid (src/pyramid/): units, placement questions, unit lesson paths; hadith by id ──
const pyr = (f) => JSON.parse(readFileSync(join(root, 'src/pyramid', f), 'utf8'));
const structure = pyr('units.json');
const placement = pyr('placement.json');
const hadith = JSON.parse(readFileSync(join(root, 'src/data/hadith.json'), 'utf8'));
const pyUnits = new Map(structure.levels.flatMap((l) => l.units.map((u) => [u.id, l.id])));
const NEVER = /\b(test|tests|exam|exams|quiz)\b/i; // the blueprint: never call any part of it a test or exam
const noteless = (o) => JSON.stringify(o, (k, v) => (k.startsWith('_') ? undefined : v));
if (pyUnits.size !== structure.levels.reduce((n, l) => n + l.units.length, 0)) errors.push('src/pyramid/units.json: a unit id is used twice');
for (const [ch, id] of Object.entries(structure.chapterUnits || {})) {
  if (ch.startsWith('_')) continue;
  if (!pyUnits.has(id)) errors.push(`src/pyramid/units.json chapterUnits: chapter ${ch} → unknown unit "${id}"`);
  if (!chapterFiles.some((c) => String(c.number) === ch)) errors.push(`src/pyramid/units.json chapterUnits: no chapter ${ch}`);
}
for (const path of ['muslim', 'nonmuslim']) {
  const n = placement.questions.filter((q) => q.path === path).length;
  if (n < 10 || n > 15) warns.push(`src/pyramid/placement.json: ${n} ${path} questions (the blueprint asks for 10 to 15)`);
}
const qids = new Set();
for (const q of placement.questions) {
  const at = `src/pyramid/placement.json ${q.id}`;
  if (qids.has(q.id)) errors.push(`${at}: id used twice`);
  qids.add(q.id);
  if (!['muslim', 'nonmuslim'].includes(q.path)) errors.push(`${at}: path must be muslim or nonmuslim`);
  if (pyUnits.get(q.unit) !== q.level) errors.push(`${at}: unit "${q.unit}" is not in level "${q.level}"`);
  if (q.type === 'scenario') {
    if (!(q.options?.length >= 3 && q.options.length <= 4)) errors.push(`${at}: a scenario needs 3 or 4 options`);
    if (q.options?.some((o) => !(o.points >= 0 && o.points <= 4))) errors.push(`${at}: option points run 0 to 4`);
  } else if (q.type !== 'scale') errors.push(`${at}: type must be scale or scenario`);
  if (NEVER.test(q.text)) errors.push(`${at}: never call any part of it a test or exam`);
}
const pyUnitDir = join(root, 'src/pyramid/units');
let unitCount = 0;
for (const f of readdirSync(pyUnitDir).filter((f) => f.endsWith('.json'))) {
  const at = `src/pyramid/units/${f}`;
  const u = JSON.parse(readFileSync(join(pyUnitDir, f), 'utf8'));
  unitCount++;
  if (!pyUnits.has(u.id)) errors.push(`${at}: "${u.id}" is not a unit in units.json`);
  for (const id of [u.story?.from, u.story?.until].filter(Boolean)) if (!sceneIds.has(id)) errors.push(`${at}: story scene "${id}" does not exist`);
  for (const v of ['muslim', 'curious']) {
    if (!u.story?.intro?.[v]) errors.push(`${at}: needs story.intro.${v}`);
    if (!u.choice?.[v]?.options?.length) errors.push(`${at}: needs choice.${v} with options`);
    if (!u.reflection?.[v]) errors.push(`${at}: needs reflection.${v}`);
    if (!u.teaching?.heading?.[v]) errors.push(`${at}: needs teaching.heading.${v}`);
  }
  for (const q of u.teaching?.quran || []) {
    const missing = expand(q.ref).filter((r) => !ayahs[r]);
    if (missing.length) warns.push(`${at}: verse ${q.ref} not fetched yet (shown once it is)`);
  }
  for (const h of u.teaching?.hadith || []) {
    if (!hadith[h.id]) errors.push(`${at}: hadith "${h.id}" is not in src/data/hadith.json`);
  }
  for (const x of u.teaching?.insights || []) if (x.status !== 'reviewed') warns.push(`${at}: insight from "${x.who}" awaits scholar review`);
  const n = u.check?.length || 0;
  if (n < 3 || n > 5) errors.push(`${at}: the understanding check needs 3 to 5 questions (has ${n})`);
  (u.check || []).forEach((q, i) => {
    if (!(q.answer >= 0 && q.answer < q.options.length)) errors.push(`${at} check ${i}: answer is not one of the options`);
    if (!q.why) warns.push(`${at} check ${i}: no "why" explanation`);
  });
  const text = noteless(u);
  if (/[؀-ۿ]/.test(text)) errors.push(`${at}: Arabic typed into a unit; give a verse ref or a hadith id instead`);
  if (/\bAllah\b/.test(text)) errors.push(`${at}: write "God"; the Muslim view shows Allah automatically`);
  if (NEVER.test(text)) errors.push(`${at}: never call any part of it a test or exam`);
}
for (const [id, h] of Object.entries(hadith)) {
  if (id.startsWith('_')) continue;
  if (!h.collection || !h.number || !h.en) errors.push(`src/data/hadith.json ${id}: needs collection, number and en`);
  if (h.status !== 'reviewed') warns.push(`src/data/hadith.json ${id}: wording awaits review against a verified translation and by a scholar`);
}

warns.forEach((w) => console.warn('warn ', w));
errors.forEach((e) => console.error('ERROR', e));
console.log(`${scenes.length} scenes · ${scenes.reduce((n, s) => n + s.beats.filter((b) => b.verse).length, 0)} verse captions · ${lessonCount} lessons · ${unitCount} pyramid units · ${errors.length} errors · ${warns.length} warnings`);
process.exit(errors.length ? 1 : 0);
