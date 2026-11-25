// Runs once, after the dev server is up and before the first test. Vite compiles a page's modules the first time
// they are asked for, and the map, a scene and the two abodes are each hundreds of them: without this, whichever
// tests start first sit on "Loading" for longer than a test waits, and fail for a reason that is not the app's.
import { chromium } from '@playwright/test';

const PAGES = ['', '#/story', '#/guide', '#/map', '#/scene/heavens?still', '#/lesson/1/0', '#/abodes', '#/pyramid'];

export default async function warm(config) {
  const { baseURL, launchOptions } = config.projects[0].use;
  const browser = await chromium.launch(launchOptions);
  try {
    const page = await browser.newPage();
    for (const hash of PAGES) {
      await page.goto('about:blank');
      await page.goto(`${baseURL}${hash}`);
      // the page has come in once nothing says "Loading"; a page that never does is the tests' to report, not this one's
      await page.getByRole('status', { name: 'Loading' }).waitFor({ state: 'detached', timeout: 60_000 }).catch(() => {});
    }
  } finally {
    await browser.close();
  }
}
