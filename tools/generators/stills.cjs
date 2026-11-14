// Screenshots held moments: node stills.cjs <outDir> <scene:beat[:t]> ...
const { chromium } = (() => { try { return require('playwright'); } catch { return require('@playwright/test'); } })();
const fs = require('fs');
const [out, ...items] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  // CHROME_PATH (or PW_CHROME) points at a browser: Playwright's own download may be a different build
  const exe = process.env.CHROME_PATH || process.env.PW_CHROME || undefined;
  const browser = await chromium.launch({
    executablePath: exe,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: Number(process.env.W || 1024), height: Number(process.env.H || 768) } });
  const logs = [];
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && !m.text().includes('Clock') && logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  for (const item of items) {
    const [id, beat, t] = item.split(':');
    await page.goto('about:blank');
    await page.goto(`http://localhost:5210/#/scene/${id}?beat=${beat}&still${t ? `&t=${t}` : ''}`);
    // the still driver lays a picture of the held frame over the stage once it is ready
    await page.waitForFunction(() => [...document.querySelectorAll('img')].some((i) => i.src.startsWith('data:image/jpeg')), null, { timeout: 120000 }).catch(() => logs.push(`${item}: no still`));
    await page.waitForTimeout(Number(process.env.WAIT || 6000));
    await page.screenshot({ path: `${out}/${id}-${beat}${t ? `-t${t}` : ''}.png`, timeout: 120000 }).catch((e) => logs.push(`${item}: screenshot failed ${e.message.split('\n')[0]}`));
  }
  fs.writeFileSync(`${out}/log.txt`, logs.join('\n'));
  await browser.close();
})();
