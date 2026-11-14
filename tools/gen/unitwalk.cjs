// Walk one unit the way the e2e test does and report the first crash: node tools/gen/unitwalk.cjs <unitId>
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
  await page.waitForTimeout(3000);
  const step = async (label, fn) => {
    try { await fn(); } catch (e) { console.log('FAILED AT', label, '-', e.message.split('\n')[0]); }
    await page.waitForTimeout(1500);
    const crashed = await page.evaluate(() => !!document.querySelector('[role="alert"]'));
    console.log(`after ${label}: crashed=${crashed}`);
    if (crashed) {
      console.log('TEXT:', (await page.evaluate(() => document.body.innerText)).slice(0, 600));
      console.log('LOGS:\n' + logs.join('\n').slice(-4000));
      await browser.close();
      process.exit(0);
    }
  };
  await step('exploring', () => page.getByRole('button', { name: /I'm exploring Islam/ }).click());
  await step('know story', () => page.getByRole('button', { name: /I know this story/ }).click());
  await step('radio', () => page.getByRole('radio').nth(2).click());
  await step('see taught', () => page.getByRole('button', { name: /See what is taught/ }).click());
  for (let i = 0; i < 3; i++) {
    await step(`next${i}`, () => page.getByRole('button', { name: /^(Next|Check your understanding)$/ }).click());
  }
  for (let i = 0; i < 5; i++) {
    await step(`opt${i}`, () => page.locator('section button').nth(1).click());
    await step(`on${i}`, () => page.getByRole('button', { name: /^(Next|On to reflection)$/ }).click());
  }
  await step('reflected', () => page.getByRole('button', { name: /I've reflected/ }).click());
  console.log('TEXT:', (await page.evaluate(() => document.body.innerText)).slice(0, 800));
  console.log('LOGS:\n' + logs.join('\n').slice(-3000));
  await browser.close();
})();
