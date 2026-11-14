// Downscale a PNG so it can be looked at: node mapview.cjs <png> <out> [width]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const [src, out, w] = process.argv.slice(2);
  const width = Number(w || 760);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  const b64 = fs.readFileSync(path.resolve(src)).toString('base64');
  await page.setContent(`<body style="margin:0"><img src="data:image/png;base64,${b64}" style="width:${width}px;display:block"></body>`);
  await page.waitForTimeout(500);
  const h = await page.evaluate(() => document.querySelector('img').getBoundingClientRect().height);
  await page.setViewportSize({ width, height: Math.ceil(h) });
  await page.waitForTimeout(200);
  await page.screenshot({ path: out });
  console.log('wrote', out, width, Math.ceil(h));
  await browser.close();
})();
