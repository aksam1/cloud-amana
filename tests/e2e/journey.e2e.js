// The journeys a real person takes, start to finish. Each test starts from a fresh browser (no saved data).
import { expect, test } from '@playwright/test';

async function reflect(page, pick = 2, view = /I'm Muslim/) {
  await page.goto('/#/pyramid/placement'); // the reflection is an offer now (story first), reached from the pyramid or after the first story
  await page.getByRole('button', { name: view }).click();
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  // answer every question; the flow moves on by itself after each answer
  for (;;) {
    const options = page.getByRole('radio');
    await options.first().waitFor();
    const n = await options.count();
    await options.nth(Math.min(pick, n - 1)).click();
    await page.waitForTimeout(450);
    if (page.url().includes('/pyramid/result')) break;
  }
}

test('a first-time visitor understands the app, reflects, and reaches a lesson that exists', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Amanah' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Begin your journey/ })).toBeInViewport();
  await expect(page.getByText(/only Allah knows the state of anyone's heart/i)).toBeAttached();
  await reflect(page, 2); // "Sometimes" to everything: the case that once led to an empty page
  await expect(page.getByText('Begin your climb at')).toBeVisible();
  await expect(page.getByText(/only Allah knows/i)).toBeVisible();
  await page.getByRole('button', { name: /^(Begin|Begin the stories)/ }).first().click();
  await expect(page.getByText(/still being written/)).toHaveCount(0);
});

test('someone who leaves a unit half way comes back to exactly where they were', async ({ page }) => {
  await page.goto('/');
  await reflect(page, 3);
  await page.goto('/#/unit/sabr');
  await page.getByRole('button', { name: /I know this story/ }).click();
  await page.getByRole('radio').nth(2).click();
  await page.getByRole('button', { name: /See what is taught/ }).click();
  await page.getByRole('button', { name: /Save and leave/ }).click();
  const resume = page.getByRole('region', { name: 'Continue where you left off' });
  await expect(resume).toContainText('Sabr');
  await expect(resume).toContainText('the teaching');
  await resume.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: /What God teaches|What Allah teaches/ })).toBeVisible();
});

test('finishing a unit lights its stone, and progress can be deleted', async ({ page }) => {
  await page.goto('/#/unit/sabr');
  await page.getByRole('button', { name: /I'm exploring Islam/ }).click();
  await page.getByRole('button', { name: /I know this story/ }).click();
  await page.getByRole('radio').nth(2).click();
  await page.getByRole('button', { name: /See what is taught/ }).click();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /^(Next|Check your understanding)$/ }).click();
  for (let i = 0; i < 5; i++) {
    await page.locator('section button').nth(1).click();
    await page.getByRole('button', { name: /^(Next|On to reflection)$/ }).click();
  }
  await page.getByRole('button', { name: /I've reflected/ }).click();
  await expect(page.getByText('Your Sabr stone')).toBeVisible();
  await page.getByRole('button', { name: 'Back to the pyramid' }).click();
  await expect(page).toHaveURL(/#\/pyramid/);
  await expect(page.getByRole('button', { name: /^Sabr, Patience: \d+%, completed/ })).toBeVisible();

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Progress' }).click();
  await page.getByRole('button', { name: 'Delete my data' }).click();
  await page.getByRole('button', { name: 'Delete everything' }).click();
  await expect(page.getByText(/has been deleted/)).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Begin your journey/ })).toBeVisible();
});

test('every part of the app has a way home', async ({ page }) => {
  await page.goto('/#/map');
  await page.getByRole('button', { name: 'Home' }).click();
  await expect(page.getByRole('heading', { name: 'Amanah' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Pyramid' }).click();
  await expect(page.getByRole('heading', { name: 'The Pyramid', exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Stories' }).click();
  await expect(page).toHaveURL(/#\/scene\//);
});

test('tapping a level of the pyramid looks closer, and the whole pyramid comes back', async ({ page }) => {
  await page.goto('/#/pyramid');
  await page.getByRole('button', { name: 'Look closer at Iman' }).dispatchEvent('click');
  await expect(page.getByRole('heading', { name: /^Iman/ })).toBeVisible();
  await page.getByRole('button', { name: 'Up to Ihsan' }).click();
  await expect(page.getByRole('heading', { name: /^Ihsan/ })).toBeVisible();
  await page.getByRole('button', { name: 'Close and see the whole pyramid' }).click();
  await expect(page.getByRole('button', { name: /Begin your journey/ })).toBeVisible();
});

test('a lesson chosen from the pyramid pop-up starts straight away', async ({ page }) => {
  await page.goto('/#/pyramid');
  await page.getByRole('button', { name: 'Look closer at Islam' }).dispatchEvent('click');
  const brief = page.getByRole('dialog');
  await brief.getByRole('button', { name: 'Zakat', exact: true }).click();
  await expect(brief.getByRole('heading', { name: 'Zakat' })).toBeVisible();
  await brief.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page).toHaveURL(/#\/unit\/zakat/);
  await page.getByRole('button', { name: /I'm exploring Islam/ }).click();
  await expect(page.getByText(/owned a fine garden/)).toBeVisible();
});

test('every pyramid lesson can be walked to its end', async ({ page }) => {
  test.setTimeout(240000);
  const ids = ['shahadah', 'salah', 'zakat', 'sawm', 'hajj', 'allah', 'angels', 'books', 'lastday', 'qadr', 'ikhlas', 'shukr', 'tawakkul', 'humility', 'character'];
  for (const [i, id] of ids.entries()) {
    await page.goto(`/#/unit/${id}`);
    if (i === 0) await page.getByRole('button', { name: /I'm Muslim/ }).click();
    await page.getByRole('button', { name: /I know this story/ }).click();
    await page.getByRole('radio').nth(2).click();
    await page.getByRole('button', { name: /See what is taught/ }).click();
    for (let k = 0; k < 3; k++) await page.getByRole('button', { name: /^(Next|Check your understanding)$/ }).click();
    for (let k = 0; k < 5; k++) {
      await page.locator('section button').nth(1).click();
      await page.getByRole('button', { name: /^(Next|On to reflection)$/ }).click();
    }
    await page.getByRole('button', { name: /I've reflected/ }).click();
    await expect(page.getByText(/^Your .+ stone$/)).toBeVisible();
  }
});

test('the lesson after a story part asks about what was just watched', async ({ page }) => {
  await page.goto('/#/lesson/6/2');
  await page.getByRole('button', { name: /I'm exploring Islam/ }).click();
  await page.getByRole('button', { name: /Did God command you this/ }).click();
  await expect(page.getByRole('button', { name: /Next question/ })).toBeVisible();
});

test('a finished lesson offers the next one, and the next one opens', async ({ page }) => {
  await page.goto('/#/unit/shahadah');
  await page.getByRole('button', { name: /I'm exploring Islam/ }).click();
  await page.getByRole('button', { name: /I know this story/ }).click();
  await page.getByRole('radio').nth(2).click();
  await page.getByRole('button', { name: /See what is taught/ }).click();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /^(Next|Check your understanding)$/ }).click();
  for (let i = 0; i < 5; i++) {
    await page.locator('section button').nth(1).click();
    await page.getByRole('button', { name: /^(Next|On to reflection)$/ }).click();
  }
  await page.getByRole('button', { name: /I've reflected/ }).click();
  const next = page.getByRole('button', { name: /^Next: / });
  await expect(next).toBeVisible();
  await next.click();
  await expect(page).toHaveURL(/#\/(unit\/(?!shahadah)|stories|scene)/);
  await expect(page.getByText(/still being written/)).toHaveCount(0);
});

test('the About page says where the words come from and what is stored, and a wrong address says so', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'About', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'About Amanah' })).toBeVisible();
  await expect(page.getByText(/Sahih International/)).toBeVisible();
  await expect(page.getByText(/stored only in this browser/)).toBeVisible();
  await expect(page.getByText(/only Allah knows the state of anyone's heart/i)).toBeVisible();
  await page.goto('/#/no-such-page');
  await expect(page.getByRole('heading', { name: 'That page does not exist' })).toBeVisible();
  await page.getByRole('button', { name: 'Go to the start' }).click();
  await expect(page.getByRole('button', { name: /Begin your journey/ })).toBeVisible();
});

test('a verse still waiting for its text shows its reference and a way to read it', async ({ page }) => {
  await page.goto('/#/unit/sabr?step=teaching');
  await page.getByRole('button', { name: /I'm exploring Islam/ }).click();
  const waiting = page.getByRole('link', { name: /Read this verse at quran\.com/ });
  if (await waiting.count()) await expect(waiting.first()).toHaveAttribute('href', /^https:\/\/quran\.com\/\d+\/\d+/);
  await expect(page.getByText(/appear here once it is fetched/)).toHaveCount(0);
});

test('story first: a new visitor chooses a view and the first scene plays, with no questions before it', async ({ page }) => {
  test.setTimeout(150000); // it waits for a scene's last moment to play out
  await page.goto('/');
  await page.getByRole('button', { name: /Begin your journey/ }).click();
  await expect(page.getByRole('heading', { name: /how would you like to explore/ })).toBeVisible();
  await page.getByRole('button', { name: /I'm exploring Islam/ }).click();
  await expect(page).toHaveURL(/#\/scene\/heavens\?first=1/);
  await expect(page.getByRole('radio')).toHaveCount(0);
  // the end of that first scene leads to the choice of where to go, not straight into more
  await page.goto('/#/scene/heavens?first=1&beat=7');
  const on = page.locator('button.btn-gold', { hasText: 'Continue' }); // the transport's skip button is also labelled Continue
  await on.waitFor({ timeout: 90000 });
  await on.click();
  await expect(page.getByRole('heading', { name: 'That was the first minute' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Keep watching/ })).toBeVisible();
  await page.getByRole('button', { name: /Find where to begin on the pyramid/ }).click();
  await expect(page.getByRole('heading', { name: 'Before you climb' })).toBeVisible();
});

test('a path lists its stops, plays one and comes back with it marked as watched', async ({ page }) => {
  test.setTimeout(150000);
  await page.goto('/#/paths');
  await expect(page.getByRole('heading', { name: 'Choose a path' })).toBeVisible();
  await page.getByRole('link', { name: /Dreams and what they meant/ }).click();
  await expect(page.getByRole('heading', { name: 'Dreams and what they meant' })).toBeVisible();
  await expect(page.getByText('0 of 5 watched')).toBeVisible();
  await page.getByRole('link', { name: /Yusuf's dream/ }).click();
  await expect(page).toHaveURL(/#\/scene\/stars\?back=/);
  await page.goto(`/#/scene/stars?back=${encodeURIComponent('/path/dreams')}&beat=3`);
  const back = page.getByRole('button', { name: 'Back to the path' });
  await back.waitFor({ timeout: 90000 });
  await back.click();
  await expect(page.getByText('1 of 5 watched')).toBeVisible();
});

test('the sky on Progress shows a star for every lesson and lights none for a new visitor', async ({ page }) => {
  await page.goto('/#/pyramid/progress');
  await expect(page.getByRole('img', { name: /Your sky: 0 of 67 stars lit/ })).toBeVisible();
});
