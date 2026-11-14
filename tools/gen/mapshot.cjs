// Screenshots of the campaign map: node mapshot.cjs <outDir> <hash> <label> [wait]
const { chromium } = (() => { try { return require('playwright'); } catch { return require('@playwright/test'); } })();
const fs = require('fs');
const [out, hash, label, wait] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const exe = process.env.CHROME_PATH || process.env.PW_CHROME || undefined;
  const browser = await chromium.launch({
    executablePath: exe,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: Number(process.env.W || 1024), height: Number(process.env.H || 768) } });
  const logs = [];
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && logs.push(`${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  // Git Bash rewrites a leading '#' into a Windows path, so rebuild the hash inside Node.
  const route = hash.startsWith('#') ? hash : `#${hash}`;
  await page.goto('about:blank');
  await page.goto(`http://localhost:5210/${route}`);
  await page.waitForTimeout(Number(wait || 5000));
  await page.screenshot({ path: `${out}/${label}.png` });
  fs.writeFileSync(`${out}/${label}.log.txt`, logs.join('\n'));
  await browser.close();
})();
