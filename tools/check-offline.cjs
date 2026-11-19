// A quick look at what the service worker keeps, and whether the page opens offline.
//   node tools/check-offline.cjs
const { chromium } = require('@playwright/test');
const { existsSync } = require('node:fs');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.PREVIEW_BASE || 'http://localhost:5213';

(async () => {
  const browser = await chromium.launch({ executablePath: existsSync(CHROME) ? CHROME : undefined });
  const ctx = await browser.newContext({ serviceWorkers: 'allow' });
  const page = await ctx.newPage();
  page.on('console', (m) => console.log('  console:', m.text()));
  page.on('requestfailed', (r) => console.log('  failed:', r.url(), r.failure()?.errorText));
  page.on('response', (r) => { if (r.status() >= 400) console.log('  ', r.status(), r.url()); });

  await page.goto(`${BASE}/`);
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 60000 }).catch(() => console.log('  no controller'));
  await page.waitForTimeout(2500);
  const keys = await page.evaluate(async () => {
    const names = await caches.keys();
    const out = {};
    for (const n of names) {
      const c = await caches.open(n);
      out[n] = (await c.keys()).map((r) => new URL(r.url).pathname);
    }
    return out;
  });
  console.log('caches:', JSON.stringify(keys, null, 1).slice(0, 2000));
  await ctx.setOffline(true);
  const resp = await page.reload().catch((e) => console.log('  reload failed:', e.message));
  console.log('  reload status:', resp?.status());
  await page.waitForTimeout(3000);
  console.log('  body length:', (await page.content()).length);
  console.log('  text:', (await page.evaluate(() => document.body.innerText)).slice(0, 300));
  await browser.close();
})();
