// Pulls every ayah the story cites (Uthmani Arabic + Sahih International) into src/data/ayahs.json.
// Run with `npm run ayahs` after adding a new ref to a scene, the timeline, or EXTRA below.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src/data/ayahs.json');

// Refs used outside scene files (title screen, map teasers).
const EXTRA = ['12:3', '33:72', '19:56', '19:57'];

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') ? [p] : [];
  });
}

export function expandRef(ref) {
  const m = /^(\d+):(\d+)(?:-(\d+))?$/.exec(ref.trim());
  if (!m) throw new Error(`Bad ref "${ref}"`);
  const [, s, a, b] = m;
  if (!b) return [`${s}:${a}`];
  return Array.from({ length: +b - +a + 1 }, (_, i) => `${s}:${+a + i}`);
}

function collectRefs() {
  const cli = process.argv.slice(2).filter((a) => /^\d+:\d+/.test(a)).flatMap(expandRef);
  const refs = new Set([...EXTRA, ...cli]);
  for (const file of walk(join(root, 'src/story'))) {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    (data.ayahs || []).forEach((r) => expandRef(r).forEach((x) => refs.add(x)));
    (data.beats || []).forEach((b) => b.verse && expandRef(b.verse.ref).forEach((x) => refs.add(x)));
    (data.layers || []).forEach((l) => l.ref && refs.add(l.ref));
    (data.nodes || []).forEach((n) => (n.ayahs || []).forEach((r) => expandRef(r).forEach((x) => refs.add(x))));
    (data.parts || []).forEach((p) => [p.lesson?.ref, p.carry?.ref].filter(Boolean).forEach((r) => expandRef(r).forEach((x) => refs.add(x))));
    (data.beats || []).forEach((b) => b.pendingVerse?.ref && expandRef(b.pendingVerse.ref).forEach((x) => refs.add(x)));
  }
  // The pyramid's lesson paths cite verses by ref too (teaching.quran).
  const unitDir = join(root, 'src/pyramid/units');
  if (existsSync(unitDir)) {
    for (const file of walk(unitDir)) {
      const u = JSON.parse(readFileSync(file, 'utf8'));
      (u.teaching?.quran || []).forEach((q) => expandRef(q.ref).forEach((x) => refs.add(x)));
    }
  }
  return [...refs].sort((a, b) => {
    const [s1, a1] = a.split(':').map(Number);
    const [s2, a2] = b.split(':').map(Number);
    return s1 - s2 || a1 - a2;
  });
}

const BISMILLAH_WORDS = 4;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchAyah(ref, attempt = 0) {
  const url = `https://api.alquran.cloud/v1/ayah/${ref}/editions/quran-uthmani,en.sahih`;
  const res = await fetch(url);
  if (res.status === 429 && attempt < 6) {
    await sleep(2000 * (attempt + 1));
    return fetchAyah(ref, attempt + 1);
  }
  if (!res.ok) throw new Error(`${ref}: HTTP ${res.status}`);
  const { data } = await res.json();
  const ar = data.find((d) => d.edition.identifier === 'quran-uthmani');
  const en = data.find((d) => d.edition.identifier === 'en.sahih');
  let arText = ar.text.replace(/﻿/g, '').trim();
  // The API prefixes ayah 1 of most surahs with the basmala; it is not part of the ayah itself.
  if (ar.numberInSurah === 1 && ar.surah.number !== 1 && arText.startsWith('بِسْمِ')) {
    arText = arText.split(/\s+/).slice(BISMILLAH_WORDS).join(' ');
  }
  return {
    surah: ar.surah.englishName,
    surahAr: ar.surah.name,
    ar: arText,
    en: en.text.trim(),
  };
}

const existing = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : {};
const refs = collectRefs();
const result = {};
for (const ref of refs) {
  if (existing[ref]) { result[ref] = existing[ref]; continue; }
  result[ref] = await fetchAyah(ref);
  writeFileSync(out, JSON.stringify({ ...existing, ...result }, null, 1) + '\n');
  console.log('fetched', ref);
  await sleep(450);
}
writeFileSync(out, JSON.stringify(result, null, 1) + '\n');
console.log(`${refs.length} ayahs → src/data/ayahs.json`);

if (process.argv.includes('--words')) {
  for (const ref of refs) {
    const words = result[ref].ar.split(/\s+/);
    console.log(`\n${ref}  ${result[ref].en}`);
    console.log(words.map((w, i) => `${i}:${w}`).join('  '));
  }
}
