// Renders public/og-image.png (1200×630): the site's picture for a link preview, with the
// title set over it.
//
//   node tools/render-og.cjs
//
// The picture behind it is one of the app's own stills (src/assets/previews/heavens.webp, taken
// from the first scene), so the preview is a real frame of the app and not a picture of nothing.
//
// Playwright's own Chromium is not installed on every machine: point CHROME_PATH at an installed
// Chrome (the e2e tests and tools/render-icons.cjs read the same variable).
const { chromium } = require('@playwright/test');
const { readFileSync, writeFileSync } = require('node:fs');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const W = 1200;
const H = 630;

// The still, washed a little darker so the title reads on it.
const img = readFileSync(join(root, 'src', 'assets', 'previews', 'heavens.webp')).toString('base64');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;width:${W}px;height:${H}px;overflow:hidden;background:#05060d;}
  .frame{position:relative;width:${W}px;height:${H}px;}
  .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
  .veil{position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,6,13,.9) 0%,rgba(5,6,13,.72) 42%,rgba(5,6,13,.25) 100%);}
  .plate{position:absolute;left:74px;top:150px;width:660px;}
  h1{margin:0;font-family:'Times New Roman',serif;font-size:56px;line-height:1.12;color:#f7e0a3;font-weight:700;letter-spacing:.5px;}
  p{margin:26px 0 0;font-family:Georgia,serif;font-size:26px;color:rgba(247,231,196,.78);}
  .mark{position:absolute;left:74px;top:74px;width:74px;height:74px;opacity:.95;}
  .rule{position:absolute;left:74px;top:196px;width:120px;height:2px;background:#e3bd6a;opacity:.75;}
</style></head><body><div class="frame">
  <img class="bg" src="data:image/webp;base64,${img}">
  <div class="veil"></div>
  <img class="mark" src="data:image/svg+xml;base64,${Buffer.from(readFileSync(join(root, 'public', 'seal.svg'))).toString('base64')}">
  <div class="rule"></div>
  <div class="plate">
    <h1>Amanah</h1>
    <p>The stories of the prophets, told in light.</p>
  </div>
</div></body></html>`;

(async () => {
  const browser = await chromium.launch({
    executablePath: existsSync(CHROME) ? CHROME : undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.waitForTimeout(500);
  const buf = await page.screenshot({ type: 'png' });
  writeFileSync(join(root, 'public', 'og-image.png'), buf);
  await browser.close();
  console.log(`public/og-image.png  ${W}×${H}`);
})();
