// Runs the end-to-end suite with an installed Chrome (Playwright's own Chromium is not installed
// on every machine). Same as `npm run e2e`, but with CHROME_PATH set.
//
//   node tools/run-e2e.cjs            the whole suite
//   node tools/run-e2e.cjs -g backup   only the tests whose name matches
const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const env = { ...process.env };
if (existsSync(CHROME)) env.CHROME_PATH = CHROME;

// Playwright's own runner, called directly: no shell, so the arguments are passed as they are.
const cli = join(__dirname, '..', 'node_modules', '@playwright', 'test', 'cli.js');
const args = [cli, 'test', '--reporter=list', ...process.argv.slice(2)];
const r = spawnSync(process.execPath, args, { stdio: 'inherit', shell: false, env, windowsHide: true });
process.exit(r.status ?? 1);
