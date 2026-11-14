// A crop of a PNG at full resolution: node mapcrop.cjs <png> <out> <x> <y> <w> <h>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const [src, out, x, y, w, h] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
  const b64 = fs.readFileSync(path.resolve(src)).toString('base64');
  await page.setContent(
    `<body style="margin:0;overflow:hidden"><img src="data:image/png;base64,${b64}" style="position:absolute;left:${-x}px;top:${-y}px"></body>`
  );
  await page.waitForTimeout(400);
  await page.screenshot({ path: out });
  console.log('wrote', out);
  await browser.close();
})();
