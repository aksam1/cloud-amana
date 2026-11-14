// Probe one unit page for a crash: node tools/gen/unitprobe.cjs <unitId>
const { chromium } = (() => { try { return require('playwright'); } catch { return require('@playwright/test'); } })();
const id = process.argv[2] || 'sabr';
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const logs = [];
  page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.stack || e.message}`));
  await page.goto(`http://localhost:5210/#/unit/${id}`);
  await page.waitForTimeout(6000);
  console.log('URL', page.url());
  console.log('TEXT:', (await page.evaluate(() => document.body.innerText)).slice(0, 1500));
  console.log('LOGS:\n' + logs.join('\n').slice(0, 6000));
  await browser.close();
})();
