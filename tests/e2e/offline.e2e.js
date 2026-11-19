// The offline journey: the app keeps working with no connection.
//
// Run it on its own (it needs a web build):
//   npm run e2e:offline
import { expect, test } from '@playwright/test';

test('the app opens with no connection, after the service worker has saved it', async ({ page, context }) => {
  // the worker registers and takes over
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 60_000 });

  // the shell is saved: let the worker finish its precache, then go offline
  await page.waitForTimeout(1500);
  await context.setOffline(true);

  await page.reload();
  // the home page still renders, from the saved page and script
  await expect(page.getByRole('heading', { name: 'Amanah' })).toBeVisible({ timeout: 30_000 });

  await context.setOffline(false);
});
