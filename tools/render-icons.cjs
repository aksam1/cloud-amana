// Renders the app's PNG icons from public/seal.svg, so the installed app (and the phone's home
// screen) shows the same gold seal the site uses.
//
//   node tools/render-icons.cjs
//
// Playwright's own Chromium is not installed on every machine: point CHROME_PATH at an installed
// Chrome (the e2e tests read the same variable).
const { chromium } = require('@playwright/test');
const { readFileSync, mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const icons = join(root, 'public', 'icons');
mkdirSync(icons, { recursive: true });

const BG = '#05060d';
const seal = readFileSync(join(root, 'public', 'seal.svg'), 'utf8');

// The same seal, drawn on the app's night colour, at a given size.
// `inset` shrinks the seal: a maskable icon must keep its mark inside the safe zone (the middle
// 80% of the picture), because the launcher may cut the edges away.
function page(size, { inset = 0, opaque = true } = {}) {
  const s = (100 - inset * 2) / 100;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:${opaque ? BG : 'transparent'};}
    .wrap{width:${size}px;height:${size}px;display:grid;place-items:center;background:${opaque ? BG : 'transparent'};}
    svg{width:${Math.round(size * s)}px;height:${Math.round(size * s)}px;display:block;}
  </style></head><body><div class="wrap">${seal}</div></body></html>`;
}

const TARGETS = [
  { file: 'icon-192.png', size: 192, opts: { inset: 8 } },
  { file: 'icon-512.png', size: 512, opts: { inset: 8 } },
  // maskable: the seal inside the safe zone, on the dark background
  { file: 'icon-maskable-512.png', size: 512, opts: { inset: 18 } },
  // the phone's own icon for "add to home screen" (always opaque)
  { file: 'apple-touch-icon.png', size: 180, opts: { inset: 8, opaque: true } },
];

// Playwright's own Chromium is not installed on every machine: point CHROME_PATH at an installed
// Chrome (the e2e tests read the same variable). A standard Windows install is found by itself.
const { existsSync } = require('node:fs');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const browser = await chromium.launch({
    executablePath: existsSync(CHROME) ? CHROME : undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  for (const t of TARGETS) {
    const page_ = await browser.newPage({ viewport: { width: t.size, height: t.size }, deviceScaleFactor: 1 });
    await page_.setContent(page(t.size, t.opts));
    const buf = await page_.screenshot({ omitBackground: !t.opts.opaque, type: 'png' });
    writeFileSync(join(icons, t.file), buf);
    await page_.close();
    console.log(`icons/${t.file}  ${t.size}×${t.size}`);
  }
  await browser.close();
})();
