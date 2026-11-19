// Runs the offline end-to-end journey with an installed Chrome (Playwright's own Chromium is not
// installed on every machine). It builds the web app (VITE_TARGET=web) and serves it.
//
//   node tools/run-e2e-offline.cjs
const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const env = { ...process.env };
if (existsSync(CHROME)) env.CHROME_PATH = CHROME;

const cli = join(__dirname, '..', 'node_modules', '@playwright', 'test', 'cli.js');
const args = [cli, 'test', '--config', 'playwright.offline.config.js', '--reporter=list', ...process.argv.slice(2)];
const r = spawnSync(process.execPath, args, { stdio: 'inherit', shell: false, env, windowsHide: true });
process.exit(r.status ?? 1);
