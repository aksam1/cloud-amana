// The Two Abodes page (#/abodes): the journeys a reader takes through it. Each test starts from a fresh browser.
import { expect, test } from '@playwright/test';

const level = (page, id) => page.locator(`[data-level="${id}"]`);

test('a reader opens a level of the Fire and reads what leads there, what the Quran says of it, and the way back', async ({ page }) => {
  await page.goto('/#/abodes');
  await expect(page.getByRole('heading', { name: 'The two abodes' })).toBeVisible();
  await expect(page.getByText(/Only God knows where anyone will be/)).toBeAttached();

  await level(page, 'hawiyah').dispatchEvent('click');
  const card = page.getByRole('dialog', { name: /Al-Hawiyah/ });
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading', { name: 'What leads there' })).toBeVisible();
  await expect(card.getByRole('heading', { name: 'What the Quran says of it' })).toBeVisible();
  await expect(card.getByRole('heading', { name: 'The way back' })).toBeVisible();
  await expect(card.getByText('Quran 4:146, An-Nisaa')).toBeVisible(); // al-Hawiyah's own way back

  // a verse opens in Arabic and English, and folds again
  const read = card.getByRole('button', { name: 'Read the verse' }).first();
  await read.click();
  await expect(card.locator('[lang="ar"]').first()).toBeVisible();
  await card.getByRole('button', { name: 'Hide the verse' }).first().click();
  await expect(card.locator('[lang="ar"]')).toHaveCount(0);

  // ↑ walks up to the next level; Escape closes and gives the keyboard back to that level
  await card.getByRole('button', { name: 'Up to Al-Jahim' }).click();
  await expect(page.getByRole('dialog', { name: /Al-Jahim/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(level(page, 'jahim')).toBeFocused();
});

test('the Throne and the ground between the two have their own cards, and the keyboard reaches every stop', async ({ page }) => {
  await page.goto('/#/abodes');
  await level(page, 'throne').focus();
  await page.keyboard.press('Enter');
  const throne = page.getByRole('dialog', { name: 'The Throne' });
  await expect(throne.getByText(/cannot be pictured/)).toBeVisible();
  await expect(throne.getByText('Sahih al-Bukhari 7423')).toBeVisible();

  await page.goto('/#/abodes?at=between');
  const between = page.getByRole('dialog', { name: 'Between the two' });
  for (const h of ['The bridge', 'The wall with a door', 'The heights']) await expect(between.getByRole('heading', { name: h })).toBeVisible();
  await between.getByRole('button', { name: 'Close and see both abodes' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('[data-level]')).toHaveCount(16);
});

test('the Muslim view names Allah; the other view says God', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('amanah:v1', JSON.stringify({ prefs: { mode: 'muslim' } })));
  await page.goto('/#/abodes?at=throne');
  await expect(page.getByText(/Only Allah knows where anyone will be/)).toBeAttached();
  await expect(page.getByRole('dialog').getByText(/the Throne, which Allah created/)).toBeVisible();
});

test('on a phone the pop-up opens below the level it describes, never over it', async ({ page }) => {
  await page.goto('/#/abodes');
  if ((page.viewportSize()?.width ?? 1280) >= 1024) test.skip(true, 'phones and small tablets only');
  // tapped at once, while the opening move from the Throne still runs: the zoom to the level must still land
  await level(page, 'saqar').dispatchEvent('click');
  const card = page.getByRole('dialog', { name: /Saqar/ });
  await expect(card).toBeVisible();
  await expect
    .poll(async () => {
      const lv = await level(page, 'saqar').boundingBox();
      const box = await card.boundingBox();
      return lv.y + lv.height - box.y;
    }, { timeout: 4000 })
    .toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});

test('the end of the chronicle, the map\'s last stop and the About page all lead to the two abodes', async ({ page }) => {
  await page.goto('/#/end');
  await page.getByRole('button', { name: 'The two abodes' }).click();
  await expect(page).toHaveURL(/#\/abodes$/);

  await page.goto('/#/map');
  await page.locator('g[aria-label^="The Day of Judgment"]').dispatchEvent('click');
  const stop = page.getByRole('complementary', { name: 'The Day of Judgment' });
  await stop.getByRole('button', { name: 'The two abodes' }).click();
  await expect(page).toHaveURL(/#\/abodes$/);

  await page.goto('/#/about');
  await expect(page.getByRole('heading', { name: 'About Amanah' })).toBeVisible();
  await page.locator('summary', { hasText: 'The two abodes' }).click();
  await page.getByRole('link', { name: 'Open the two abodes' }).click();
  await expect(page).toHaveURL(/#\/abodes$/);
  await expect(page.getByRole('heading', { name: 'The two abodes' })).toBeVisible();
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the whole picture is there at once, with no zoom', async ({ page }) => {
    await page.goto('/#/abodes');
    await expect(page.locator('svg[role="group"]')).toHaveAttribute('viewBox', '0 0 400 530');
  });
});
