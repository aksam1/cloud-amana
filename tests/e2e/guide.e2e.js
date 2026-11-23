// The short guide (#/guide) and the first-visit tips. A newcomer is taken into the guide once they have chosen a
// view, learns by doing (move a practice scene on, open a verse, answer a question, find Story in the menu), and
// can skip it from any step; after that it is an offer like any other. Each test starts from a fresh browser.
import { expect, test } from '@playwright/test';
import { skipOpening } from './opening.js';

const ringed = (page) => page.locator('nav[aria-label="Main"] li.guide-spot');
const button = (page, name) => page.getByRole('button', { name, exact: true });

async function arrive(page) {
  await page.goto('/#/');
  await skipOpening(page);
  await page.getByRole('button', { name: /Begin your journey/ }).click();
  await page.getByRole('button', { name: /I'm exploring Islam/ }).click();
  await expect(page).toHaveURL(/#\/guide$/);
}

test('a newcomer is taken into the guide, tries each thing once, and then chooses where to start', async ({ page }) => {
  await arrive(page);
  await expect(page.getByRole('heading', { name: 'A story, one moment at a time' })).toBeVisible();
  await expect(page.getByText('Step 1 of 4')).toBeVisible();
  await expect(button(page, 'Skip the guide')).toBeVisible();
  await expect(button(page, 'Every place on one page')).toHaveCount(0); // a newcomer is shown, not handed a list
  await expect(button(page, 'Next')).toHaveCount(0); // a step is done by doing it

  // 1. the practice scene moves on by a tap on the picture, by → and back by ←, and is done at its last moment
  await page.locator('.aspect-video > div.cursor-pointer').click();
  await expect(page.getByText('A thin line of light along the edge of the world.')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByText('Night, and a sky full of stars.')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await button(page, 'Next moment (→)').click();
  await expect(page.getByText('Then morning.')).toBeVisible();
  await expect(page.getByText(/That is all a scene asks/)).toBeVisible();
  await page.keyboard.press('ArrowRight'); // now → moves to the next step
  await expect(page).toHaveURL(/step=verse$/);

  // 2. a verse's reference opens its Arabic in place
  await expect(page.getByText('Step 2 of 4')).toBeVisible();
  await expect(button(page, 'Next')).toHaveCount(0);
  const ref = button(page, 'Quran 33:72');
  await expect(ref).toHaveAttribute('aria-expanded', 'false');
  await ref.click();
  await expect(ref).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#guide-arabic [lang="ar"]')).toBeVisible();
  await expect(button(page, 'Next')).toBeInViewport({ ratio: 1 }); // the Arabic never pushes Next under a phone's tab bar
  await expect(page.locator('#guide-arabic').getByRole('link', { name: 'Read it at quran.com' })).toHaveAttribute('href', /quran\.com\/33\/72/);
  // "Previous" steps back inside the guide; "Back" (top left) leaves it, and the two are never the same name
  await expect(button(page, 'Back')).toHaveCount(1);
  await button(page, 'Next').click();

  // 3. one lesson question: a wrong answer says why and lets the reader try again
  await expect(page).toHaveURL(/step=lesson$/);
  await expect(page.getByRole('heading', { name: 'A short lesson after each part' })).toBeInViewport(); // each step starts at its top
  await button(page, 'The mountains').click();
  await expect(page.getByText(/Not quite: the heavens, the earth and the mountains declined it/)).toBeVisible();
  await expect(button(page, 'Next')).toHaveCount(0);
  await button(page, 'Humankind').click();
  await expect(page.getByText(/what this app is named for/)).toBeVisible();
  await button(page, 'Next').click();

  // 4. the real menu: Story is lit, and tapping it there is practice, not a way out
  await expect(page).toHaveURL(/step=menu$/);
  await expect(ringed(page)).toHaveText('Story');
  await expect(page.locator('nav[aria-label="Main"] li')).toHaveCount(2); // a newcomer's menu is Home and Story
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Story' }).click();
  await expect(page).toHaveURL(/step=menu$/);
  await expect(page.getByText(/^Found it\./)).toBeVisible();
  await button(page, 'Previous').click();
  await expect(page).toHaveURL(/step=lesson$/);
  await expect(button(page, 'Humankind')).toBeDisabled(); // what was done stays done
  await button(page, 'Next').click();
  await button(page, 'Next').click();

  // the last step asks; nothing opens by itself
  await expect(page.getByRole('heading', { name: 'Where would you like to start?' })).toBeVisible();
  await expect(page.getByText('Ready to begin')).toBeVisible();
  for (const w of [/^Watch the first story/, /^See every chapter/, /^Every place, on one page/]) await expect(page.getByRole('button', { name: w })).toBeVisible();
  await page.waitForTimeout(2000);
  await expect(page).toHaveURL(/step=start$/);

  // every place on one page, for those who would rather read
  await page.getByRole('button', { name: /^Every place, on one page/ }).click();
  await expect(page.getByRole('heading', { name: 'What is where' })).toBeVisible();
  for (const h of ['The story', 'The map of time', 'Short lessons', 'The pyramid', 'Paths', 'The two abodes', 'Your progress', 'Settings']) {
    await expect(page.getByRole('heading', { name: h, exact: true })).toBeVisible();
  }
  await expect(ringed(page)).toHaveCount(0);

  // finished: Begin no longer sends anyone into the guide, it offers it
  await page.goto('/#/begin');
  await expect(page.getByRole('heading', { name: 'Where would you like to start?' })).toBeVisible();
  await page.getByRole('button', { name: /Take the short guide/ }).click();
  await expect(page.getByText('Step 1 of 4')).toBeVisible();
  await expect(button(page, 'Every place on one page')).toBeVisible(); // no longer a newcomer
});

test('a newcomer can skip the guide from any step, and find it again later', async ({ page }) => {
  await arrive(page);
  await button(page, 'Skip the guide').click();
  await expect(page).toHaveURL(/#\/begin$/);
  await expect(page.getByRole('heading', { name: 'Where would you like to start?' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Where would you like to start?' })).toBeVisible(); // never taken in again
  await page.getByRole('button', { name: /Take the short guide/ }).click();
  await expect(page.getByRole('heading', { name: 'A story, one moment at a time' })).toBeVisible();

  // the home page keeps the guide as a plain link, one tap away
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
