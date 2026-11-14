// The arrival ceremony as the reader sees it: node arrival.cjs <outDir> <label> <from> <arrive> [wait]
const { chromium } = require('playwright');
const fs = require('fs');
const [out, label, from, arrive, wait] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const logs = [];
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  await page.goto(`http://localhost:5210/#/map?from=${from}&arrive=${arrive}`);
  await page.waitForTimeout(Number(wait || 3000));
  await page.screenshot({ path: `${out}/${label}.png` });
  fs.writeFileSync(`${out}/${label}.log.txt`, logs.join('\n'));
  console.log('wrote', `${out}/${label}.png`, logs.length, 'log lines');
  await browser.close();
})();
