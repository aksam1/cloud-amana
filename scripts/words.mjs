// Prints ayat with their Arabic words numbered, for choosing a caption's word range:
//   npm run words -- 11:58 89:6-8
// Any ref not yet in src/data/ayahs.json is fetched first (through fetch-ayahs.mjs).
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const refs = process.argv.slice(2).filter((a) => /^\d+:\d+(-\d+)?$/.test(a));
if (!refs.length) {
  console.log('usage: npm run words -- 11:58 89:6-8');
  process.exit(1);
}
const expand = (ref) => {
  const [, s, a, b] = /^(\d+):(\d+)(?:-(\d+))?$/.exec(ref);
  return b ? Array.from({ length: +b - +a + 1 }, (_, i) => `${s}:${+a + i}`) : [ref];
};
const file = join(root, 'src/data/ayahs.json');
const have = JSON.parse(readFileSync(file, 'utf8'));
if (refs.flatMap(expand).some((r) => !have[r])) spawnSync(process.execPath, [join(root, 'scripts/fetch-ayahs.mjs'), ...refs], { stdio: 'inherit' });
const ayahs = JSON.parse(readFileSync(file, 'utf8'));
for (const ref of refs.flatMap(expand)) {
  const a = ayahs[ref];
  if (!a) {
    console.log(`\n${ref}: not found`);
    continue;
  }
  console.log(`\n${ref}  ${a.surah ?? ''}\nEN  ${a.en}`);
  console.log(`AR  ${a.ar.split(/\s+/).map((w, i) => `${i}:${w}`).join('  ')}`);
}
