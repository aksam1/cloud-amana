// Builds the app and prepares the private Artifact update in one step:
//   npm run publish
// Writes deploy/index.html (the page skeleton pointing at the new hashed assets) and prints the `files`
// map for the Artifact publish call: every new asset, plus null for each asset of the last publish that
// is gone. deploy/assets.json remembers what was published; it is updated here.
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL = 'https://claude.ai/artifact/HRp6qy5JJwz6rBJGtARwLq';
execSync('npx vite build', { cwd: root, stdio: 'inherit' });

const assets = readdirSync(join(root, 'dist/assets'));
const css = assets.find((f) => /^index-.*\.css$/.test(f));
const js = assets.find((f) => /^index-.*\.js$/.test(f));
const fonts = readFileSync(join(root, 'index.html'), 'utf8').match(/https:\/\/fonts\.googleapis\.com\/css2\?[^"]+/)?.[0];
mkdirSync(join(root, 'deploy'), { recursive: true });
writeFileSync(
  join(root, 'deploy/index.html'),
  [
    '<!DOCTYPE html>',
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<meta name="theme-color" content="#0e1530" />',
    '<meta name="description" content="Learn Islam through the stories of the prophets, and watch your understanding rise, stone by stone." />',
    '<title>Amanah</title>',
    '<link rel="preconnect" href="https://fonts.googleapis.com" />',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
    `<link href="${fonts}" rel="stylesheet" />`,
    `<link rel="stylesheet" href="assets/${css}" />`,
    '<div id="root"></div>',
    `<script type="module" src="assets/${js}"></script>`,
    '',
  ].join('\n'),
);

const ledger = join(root, 'deploy/assets.json');
const before = existsSync(ledger) ? JSON.parse(readFileSync(ledger, 'utf8')) : [];
const files = Object.fromEntries(assets.map((f) => [`assets/${f}`, `dist/assets/${f}`]));
for (const f of before) if (!assets.includes(f)) files[`assets/${f}`] = null;
writeFileSync(ledger, `${JSON.stringify(assets, null, 2)}\n`);

console.log(`\nPublish deploy/index.html to ${URL} with files:\n${JSON.stringify(files, null, 2)}`);
