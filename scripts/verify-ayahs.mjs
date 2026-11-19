// Compare every ayah in ayahs.json with api.alquran.cloud (whole surahs, same processing as fetch-ayahs.mjs).
import fs from 'node:fs';
const file = process.argv[2] || new URL("../src/data/ayahs.json", import.meta.url);
const ayahs = JSON.parse(fs.readFileSync(file, 'utf8'));
const surahs = [...new Set(Object.keys(ayahs).map((k) => +k.split(':')[0]))].sort((a, b) => a - b);
let same = 0, diff = [];
for (const s of surahs) {
  let res;
  for (let i = 0; i < 4; i++) {
    res = await fetch(`https://api.alquran.cloud/v1/surah/${s}/editions/quran-uthmani,en.sahih`).catch(() => null);
    if (res && res.ok) break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (!res || !res.ok) { diff.push(`${s}: surah fetch failed`); continue; }
  const { data } = await res.json();
  const ar = data.find((d) => d.edition.identifier === 'quran-uthmani');
  const en = data.find((d) => d.edition.identifier === 'en.sahih');
  for (const k of Object.keys(ayahs).filter((k) => +k.split(':')[0] === s)) {
    const n = +k.split(':')[1];
    const a = ar.ayahs.find((x) => x.numberInSurah === n);
    const e = en.ayahs.find((x) => x.numberInSurah === n);
    let arText = a.text.replace(/﻿/g, '').trim();
    if (n === 1 && s !== 1 && arText.startsWith('بِسْمِ')) arText = arText.split(/\s+/).slice(4).join(' ');
    const okA = arText === ayahs[k].ar, okE = e.text.trim() === ayahs[k].en;
    if (okA && okE) same++; else diff.push(`${k}: ${okA ? '' : 'AR differs '}${okE ? '' : 'EN differs'}`);
  }
}
console.log(`checked ${Object.keys(ayahs).length} ayat in ${surahs.length} surahs: ${same} identical`);
console.log(diff.length ? diff.join('\n') : 'no differences');
