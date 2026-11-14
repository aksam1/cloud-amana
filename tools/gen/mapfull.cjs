// The whole map as one image: node mapfull.cjs <outDir> <hash> <label> [wait]
const { chromium } = (() => { try { return require('playwright'); } catch { return require('@playwright/test'); } })();
const fs = require('fs');
const [out, hash, label, wait] = process.argv.slice(2);
console.log('argv', JSON.stringify({ out, hash, label, wait }));
// Git Bash rewrites a leading "#" into a Windows path, so the route is given
// without its hash (map, map?from=x) and put back here.
const route = hash.startsWith('#') ? hash : `#${hash}`;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const exe = process.env.CHROME_PATH || process.env.PW_CHROME || undefined;
  const browser = await chromium.launch({
    executablePath: exe,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: Number(process.env.W || 1400), height: Number(process.env.H || 900) } });
  const logs = [];
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  await page.goto('about:blank');
  await page.waitForTimeout(300);
  await page.goto(`http://localhost:5210/${route}`);
  await page.waitForTimeout(Number(wait || 5000));
  // the map may take a moment to mount; wait for the svg to appear
  await page
    .waitForFunction(() => Array.from(document.querySelectorAll('svg')).some((e) => e.getAttribute('aria-label')), null, { timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(500);
  const found = await page.evaluate(() => {
    const s = Array.from(document.querySelectorAll('svg')).find((e) => e.getAttribute('aria-label'));
    return s ? { w: Number(s.getAttribute('width')), h: Number(s.getAttribute('height')) } : null;
  });
  console.log('found', JSON.stringify(found));
  if (!found) {
    const labels = await page.evaluate(() => Array.from(document.querySelectorAll('svg')).map((e) => e.getAttribute('aria-label')).join('|'));
    throw new Error(`the map svg was not found; svgs: ${labels}`);
  }
  console.log(JSON.stringify(found));
  await page.setViewportSize({ width: found.w, height: found.h });
  await page.evaluate(() => {
    const p = document.querySelector('.parchment');
    p.style.transform = 'none';
    p.style.left = '0px';
    p.style.top = '0px';
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${label}.png` });
  fs.writeFileSync(`${out}/${label}.log.txt`, logs.join('\n'));
  await browser.close();
})();
