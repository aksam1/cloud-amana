// Not a test file (the suite runs *.e2e.js): a helper the journeys share.
import { expect } from '@playwright/test';

/**
 * A first visit to the home page opens on the Trust (Quran 33:72). While its lines arrive, the first tap or key
 * only shows them whole, so a click at that moment would not reach the button under it. This presses a key that
 * opens nothing until the opening is done; on a page with no opening it changes nothing.
 */
export async function skipOpening(page) {
  await expect(page.getByRole('heading', { name: 'Amanah' })).toBeAttached();
  await expect(async () => {
    await page.keyboard.press('Shift');
    await expect(page.locator('.hook-done')).toBeAttached({ timeout: 300 });
  }).toPass({ timeout: 10_000 });
}
