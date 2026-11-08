// The journeys a real person takes, start to finish. Each test starts from a fresh browser (no saved data).
import { expect, test } from '@playwright/test';

async function reflect(page, pick = 2, view = /I'm Muslim/) {
  await page.getByRole('button', { name: /Begin your journey/ }).click();
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
  await expect(page.getByRole('heading', { name: 'The Pyramid of Righteousness' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Stories' }).click();
  await expect(page).toHaveURL(/#\/scene\//);
});
