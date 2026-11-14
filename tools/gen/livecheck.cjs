// Check the live artifact in a browser: node tools/gen/livecheck.cjs <url>
const { chromium } = (() => { try { return require('playwright'); } catch { return require('@playwright/test'); } })();
const url = process.argv[2] || 'https://claude.ai/artifact/HRp6qy5JJwz6rBJGtARwLq';
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const logs = [];
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => logs.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(12000);
  console.log('URL', page.url());
  console.log('TEXT:', (await page.evaluate(() => document.body.innerText)).slice(0, 800));
  const crashed = await page.evaluate(() => !!document.querySelector('[role="alert"]'));
  console.log('crashed:', crashed);
  console.log('LOGS:\n' + logs.join('\n').slice(0, 4000));
  // the map, the newest thing
  await page.goto(`${url}#/map`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: 'out/map/live-map.png' });
  console.log('map text:', (await page.evaluate(() => document.body.innerText)).slice(0, 600));
  await browser.close();
})();
