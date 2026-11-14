const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const logs = [];
  p.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`${m.type()}: ${m.text()}`));
  p.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  await p.goto('about:blank');
  await p.waitForTimeout(300);
  await p.goto('http://localhost:5210/#/map');
  await p.waitForTimeout(6000);
  await p.waitForFunction(() => Array.from(document.querySelectorAll('svg')).some((e) => e.getAttribute('aria-label')), null, { timeout: 15000 }).catch(() => {});
  const found = await p.evaluate(() => {
    const s = Array.from(document.querySelectorAll('svg')).find((e) => e.getAttribute('aria-label'));
    return s ? { w: Number(s.getAttribute('width')), h: Number(s.getAttribute('height')) } : null;
  });
  console.log('found', JSON.stringify(found));
  console.log('logs', logs.join('\n'));
  await b.close();
})();
