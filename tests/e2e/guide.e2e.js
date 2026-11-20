// The newcomer's guide (#/guide) and the first-visit tips: a newcomer is shown what is where and then chooses,
// never sent anywhere. Each test starts from a fresh browser.
import { expect, test } from '@playwright/test';
import { skipOpening } from './opening.js';

const ringed = (page) => page.locator('nav[aria-label="Main"] li.guide-spot');

test('a newcomer steps through the guide, sees where each place is in the menu, and chooses where to start', async ({ page }) => {
  await page.goto('/#/');
  await skipOpening(page);
  await page.getByRole('button', { name: 'Guide', exact: true }).click();
  await expect(page).toHaveURL(/#\/guide$/);
  await expect(page.getByRole('heading', { name: 'The story' })).toBeVisible();
  await expect(page.getByText('Step 1 of 8')).toBeVisible();
  await expect(ringed(page)).toHaveText('Story'); // the real menu lights up where the place is

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).toHaveURL(/step=map$/);
  await expect(page.getByRole('heading', { name: 'The map of time' })).toBeVisible();
  await expect(page.getByText('Step 2 of 8')).toBeVisible();
  await expect(ringed(page)).toHaveText('Explore'); // the map is one of Explore's doors

  // "Previous" steps back inside the guide; "Back" (top left) leaves it, and the two are never the same name
  await expect(page.getByRole('button', { name: 'Back', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Previous' }).click();
  await expect(page.getByRole('heading', { name: 'The story' })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading', { name: 'The map of time' })).toBeVisible();

  // the whole guide on one page, for those who would rather skim
  await page.getByRole('button', { name: 'See it all on one page' }).click();
  await expect(page.getByRole('heading', { name: 'What is where' })).toBeVisible();
  for (const h of ['The story', 'The map of time', 'Short lessons', 'The pyramid', 'Paths', 'The two abodes', 'Your progress', 'Settings']) {
    await expect(page.getByRole('heading', { name: h, exact: true })).toBeVisible();
  }
  await expect(ringed(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'One step at a time' }).click();
  await expect(page.getByText('Step 1 of 8')).toBeVisible();

  // the last step asks; nothing opens by itself
  await page.getByRole('button', { name: 'Skip to where to start' }).click();
  await expect(page.getByRole('heading', { name: 'Where would you like to start?' })).toBeVisible();
  await expect(page.getByText('Last step')).toBeVisible();
  for (const w of [/^Watch the first story/, /^See every chapter/, /^Back home/]) await expect(page.getByRole('button', { name: w })).toBeVisible();
  await page.waitForTimeout(2000);
  await expect(page).toHaveURL(/step=start$/);
  await page.getByRole('button', { name: /^See every chapter/ }).click();
  await expect(page).toHaveURL(/#\/story$/);

  // the home page keeps the guide as a plain link, one tap away, and never presses it on anyone
  await page.goto('/#/');
  await expect(page.getByRole('button', { name: 'Guide', exact: true })).toBeVisible();
});

test("the map's first-visit tip shows the guide, closes for good, and Settings brings the tips back", async ({ page }) => {
  await page.goto('/#/map');
  const tip = page.getByRole('note', { name: 'Tip' });
  await expect(tip).toContainText('The map of time');
  await tip.getByRole('button', { name: 'Show me around' }).click();
  await expect(page).toHaveURL(/#\/guide$/);

  await page.goto('/#/map');
  await expect(tip).toBeVisible(); // still there until the reader closes it
  await tip.getByRole('button', { name: 'No more tips' }).click();
  await expect(tip).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sound', exact: true })).toBeVisible();
  await expect(tip).toHaveCount(0);

  await page.goto('/#/settings');
  const reset = page.getByRole('button', { name: 'Show the first-visit tips again' });
  await reset.click();
  await expect(page.getByRole('button', { name: 'The first-visit tips are on' })).toBeDisabled();
  await page.getByRole('button', { name: 'The short guide: what is where' }).click();
  await expect(page).toHaveURL(/#\/guide$/);

  await page.goto('/#/map');
  await expect(tip).toBeVisible();
  await tip.getByRole('button', { name: 'Got it' }).click();
  await expect(tip).toHaveCount(0);
});

test("the map's sound switch says whether it is on, in words, on every screen size", async ({ page }) => {
  await page.goto('/#/map');
  const sound = page.getByRole('button', { name: 'Sound', exact: true });
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  await expect(sound).toContainText('off');
  await sound.click();
  await expect(sound).toHaveAttribute('aria-pressed', 'true');
  await expect(sound).toContainText('on');
  await sound.click();
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
});
