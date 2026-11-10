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
// The icon travels inside the page (the published page has no folder of its own for it).
const icon = `data:image/svg+xml,${encodeURIComponent(readFileSync(join(root, 'public/seal.svg'), 'utf8'))}`;
const DESCRIPTION = 'Learn Islam through the stories of the prophets, told in light. Free, private, no account.';
mkdirSync(join(root, 'deploy'), { recursive: true });
writeFileSync(
  join(root, 'deploy/index.html'),
  [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />',
    '<meta name="theme-color" content="#0e1530" />',
    `<meta name="description" content="${DESCRIPTION}" />`,
    '<title>Amanah</title>',
    `<link rel="icon" href="${icon}" type="image/svg+xml" />`,
    // Link previews (a picture needs the site's own address: add og:image once it has one).
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Amanah" />',
    '<meta property="og:title" content="Amanah: the stories of the prophets, told in light" />',
    '<meta property="og:description" content="Learn Islam one story at a time. Free, private, no account." />',
    `<meta property="og:url" content="${URL}" />`,
    '<meta name="twitter:card" content="summary" />',
    // Fonts are bundled with the site (src/fonts.css): nothing is fetched from another host.
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
