// Walks the app and saves screenshots of the main screens, at a phone's size and a desktop's.
//
//   node tools/shots.cjs
//
// The pictures go to shots/. They are for looking at, not for shipping: nothing in the app reads
// them.
const { chromium } = require('@playwright/test');
const { existsSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.SHOT_BASE || 'http://localhost:5212';
const OUT = join(root, 'shots');

const SIZES = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

const ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log(`  ${name}.png`);
}

/** The pages to walk, in order. Each is [file name, hash route, extra]. */
const PAGES = [
  ['home-new', '#/', null],
  ['begin', '#/begin', null],
  ['pyramid', '#/pyramid', null],
  ['settings', '#/settings', null],
  ['privacy', '#/privacy', null],
  ['end', '#/end', null],
  ['about', '#/about', null],
  ['report', '#/report', null],
  ['map', '#/map', null],
  ['paths', '#/paths', null],
];

(async () => {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: existsSync(CHROME) ? CHROME : undefined, args: ARGS });
  for (const size of SIZES) {
    console.log(`${size.name} (${size.width}×${size.height})`);
    const ctx = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();

    // a new visitor
    await page.goto(`${BASE}/#/`);
    await wait(3500);
    await shot(page, `${size.name}-home-new`);

    // the view choice
    await page.goto(`${BASE}/#/begin`);
    await wait(2500);
    await shot(page, `${size.name}-begin`);

    // a returning visitor: some progress in this browser
    await page.evaluate(() => {
      const seen = {};
      for (const id of ['heavens', 'search', 'stars', 'restored', 'sea']) seen[id] = true;
      localStorage.setItem(
        'amanah:v1',
        JSON.stringify({
          seen,
          lit: { earth: true, heavens: true },
          last: 'sea',
          learned: { '1:0': true, '2:0': true },
          answers: {},
          journal: { '1:0': 'I noticed the light does not come near.' },
          journalAt: { '1:0': new Date().toISOString() },
          placement: null,
          units: {},
          drafts: {},
          recent: { kind: 'scene', id: 'sea', title: 'The Sea', at: new Date().toISOString() },
          prefs: { sound: false, auto: true, chronicle: true, mode: 'curious', installAsked: true },
        }),
      );
    });
    await page.goto(`${BASE}/#/`);
    await wait(3500);
    await shot(page, `${size.name}-home-returning`);

    for (const [name, hash] of PAGES) {
      if (name === 'home-new') continue;
      await page.goto(`${BASE}/${hash}`);
      await wait(name === 'map' ? 4500 : 2800);
      await shot(page, `${size.name}-${name}`);
    }

    // the map at every era: scroll down the world
    await page.goto(`${BASE}/#/map`);
    await wait(4000);
    for (let i = 1; i <= 4; i++) {
      await page.evaluate((k) => {
        const el = document.querySelector('[data-era-scroll], .map-scroll, main');
        if (el) el.scrollTop = (el.scrollHeight / 5) * k;
        else window.scrollTo(0, (document.body.scrollHeight / 5) * k);
      }, i);
      await wait(2200);
      await shot(page, `${size.name}-map-${i}`);
    }

    await ctx.close();
  }
  await browser.close();
  console.log(`\nscreenshots in ${OUT}`);
})();
