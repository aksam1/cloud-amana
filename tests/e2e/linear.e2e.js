// The guide (src/lib/journey.js): one path through everything, in order. A reader can close it wherever they meet it
// and pick it up again later from the same step. Each test starts from a fresh browser.
import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { skipOpening } from './opening.js';

const PART_ONE = ['heavens', 'jinn', 'khalifah', 'adam', 'refusal', 'banished', 'garden', 'whisper', 'repentance', 'descent'];
const LESSON = 'The lesson of From Light to the Garden';
const CLOSED = 'Guide closed. Pick it up again from Home, Journey or Settings.';

const seen = (ids) => Object.fromEntries(ids.map((id) => [id, true]));
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('amanah:v1')));
const guide = (page) => page.getByRole('region', { name: 'Your guide' });
const button = (where, name) => where.getByRole('button', { name, exact: true });
/** The line of steps (Rail.jsx): the one just done, the one the reader is at, and the next. */
const rail = (page) => page.getByRole('list', { name: 'Your journey, around here' });
const railNow = (page) => rail(page).locator('[aria-current="step"]');

/** Begin from saved progress, on a page that changes none of it. */
async function from(page, state) {
  const whole = { prefs: { mode: 'curious', guide: 'done', sound: false }, ...state };
  await page.goto('/#/privacy');
  // a dev server that has just started may reload the page once by itself, under this: try again if it does
  await expect(async () => {
    await page.evaluate((s) => localStorage.setItem('amanah:v1', JSON.stringify(s)), whole);
    await page.reload();
    expect(await saved(page)).toMatchObject(whole);
  }).toPass({ timeout: 20_000 });
}

test('the guide can be closed and picked up again where it was, on home, the Journey page, settings, Begin and the map', async ({ page }) => {
  await from(page, { seen: seen(PART_ONE), last: 'descent' });

  // home: one button, the guide's next step. Closed, the button is the story's own again and the guide waits
  await page.goto('/#/');
  await expect(button(page, 'Take the short lesson')).toBeVisible();
  await expect(railNow(page)).toHaveText('Its lesson');
  await button(page, 'Close the guide').click();
  await expect(rail(page)).toHaveCount(0);
  await expect(button(page, 'Take the short lesson')).toHaveCount(0);
  await expect(button(page, 'Continue the story')).toBeVisible();
  await page.reload(); // closed stays closed
  await button(page, 'Resume the guide').click();
  await expect(railNow(page)).toHaveText('Its lesson'); // the very step it was left at
  await expect(page).toHaveURL(/#\/$/); // and picking it up opens nothing by itself

  // the Journey page: closed with a way to undo it, and offered back
  await page.goto('/#/story');
  const card = guide(page);
  await expect(card.getByRole('heading', { name: LESSON })).toBeVisible();
  await button(card, 'Close the guide').click();
  await expect(card).toHaveCount(0);
  await expect(page.getByText(CLOSED)).toBeVisible();
  await button(page, 'Undo').click();
  await expect(card.getByRole('heading', { name: LESSON })).toBeVisible();
  await button(card, 'Close the guide').click();
  await button(page, 'Resume the guide').click();
  await expect(card.getByRole('heading', { name: LESSON })).toBeVisible();

  // a step passed by moves the guide one step on
  await button(card, 'Skip this step').click();
  await expect(card.getByRole('heading', { name: 'The pyramid', exact: true })).toBeVisible();

  // settings: a switch, which says where the guide waits
  await page.goto('/#/settings');
  const toggle = page.getByRole('switch', { name: /Guide me, one step at a time/ });
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByText(/It waits at: The pyramid\./)).toBeVisible();

  // closed, Begin asks where to start, and one of the ways is the guide from where it was left
  await page.goto('/#/begin');
  await expect(page.getByRole('heading', { name: 'Where would you like to start?' })).toBeVisible();
  for (const w of [/^Continue the story/, /^See how Amanah works/, /^Look around on my own/]) await expect(page.getByRole('button', { name: w })).toBeVisible();
  await page.getByRole('button', { name: /^Follow the guide again/ }).click();
  await expect(page).toHaveURL(/#\/pyramid$/);
  expect((await saved(page)).journey.off).toBe(false);

  // the map: the next step at its foot, with its own ×; closed there, it is closed everywhere
  await page.goto('/#/map');
  await button(guide(page), 'Close the guide').click();
  await expect(guide(page)).toHaveCount(0);
  await page.goto('/#/explore');
  await expect(page.getByRole('heading', { name: 'Explore', exact: true })).toBeVisible();
  await expect(guide(page)).toHaveCount(0);
  expect((await saved(page)).journey.off).toBe(true);
});

test('at the end of a part the guide offers its next step, to take, skip or close, and never moves on by itself', async ({ page }) => {
  test.setTimeout(300_000); // it waits for a scene's last moment to play out, three times
  const atTheEnd = async () => {
    await from(page, { seen: seen(PART_ONE.slice(0, -1)), last: 'descent' });
    await page.goto('/#/scene/descent?beat=99');
    await expect(guide(page)).toContainText(`Next in your guide: ${LESSON}`, { timeout: 90_000 });
  };

  // take it: the lesson of the part just watched, which comes back to the guide
  await atTheEnd();
  await page.waitForTimeout(3000);
  await expect(page).toHaveURL(/#\/scene\/descent/); // it waits for the reader
  await button(guide(page), 'Take the short lesson').click();
  await expect(page).toHaveURL(/#\/lesson\/1\/0\?then=%2Fnext$/);

  // skip it: on to the step after the lesson
  await atTheEnd();
  await button(guide(page), 'Skip this step').click();
  await expect(page).toHaveURL(/#\/pyramid$/);

  // close it: the reader stays where they are, with the scene's own buttons
  await atTheEnd();
  await button(guide(page), 'Close the guide').click();
  await expect(guide(page)).toHaveCount(0);
  await expect(page.getByText(CLOSED)).toBeVisible();
  await expect(button(page, 'Take the short lesson')).toBeVisible();
  await expect(page).toHaveURL(/#\/scene\/descent/);
  expect((await saved(page)).journey.off).toBe(true);
});

test('a reader who began before the guide existed goes on with the story, not back to how Amanah works', async ({ page }) => {
  await from(page, { seen: seen(['heavens', 'jinn']), last: 'jinn', prefs: { mode: 'curious', sound: false } });
  await page.goto('/#/');
  await expect(button(page, 'See how it works')).toHaveCount(0);
  await button(page, 'Continue the story').click();
  await expect(page).toHaveURL(/#\/scene\/khalifah/);
});

/** Every scene's id in story order, read from the files (a folder lists them as text: s1, s10, s11 … s2). */
function sceneIds() {
  const root = 'src/story/chapters';
  return readdirSync(root)
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
    .flatMap((c) =>
      readdirSync(`${root}/${c}`)
        .filter((f) => /^s\d+-.+\.json$/.test(f))
        .map((f) => JSON.parse(readFileSync(`${root}/${c}/${f}`, 'utf8')))
        .sort((a, b) => a.order - b.order)
        .map((s) => s.id),
    );
}

test('home draws the journey as one line: the step just done, the one the reader is at, and the next', async ({ page }) => {
  const names = async () => (await rail(page).getByRole('listitem').allTextContents()).map((t) => t.replace(/\s+/g, ' ').trim());

  // a first visit: the first step is lit, with the two after it
  await page.goto('/#/');
  await skipOpening(page);
  await expect(rail(page)).toBeVisible();
  expect(await names()).toEqual(['Choose your view', 'How Amanah works', 'From Light to the Garden']);
  await expect(railNow(page)).toHaveText('Choose your view');

  // part way through the first part of the story
  await from(page, { seen: seen(PART_ONE.slice(0, 3)), last: 'khalifah' });
  await page.goto('/#/');
  await expect(railNow(page)).toHaveText('From Light to the Garden');
  expect(await names()).toEqual(['How Amanah works (done)', 'From Light to the Garden', 'Its lesson']);

  // the part watched: its lesson is lit, the part is done and the pyramid comes next
  await from(page, { seen: seen(PART_ONE), last: 'descent' });
  await page.goto('/#/');
  await expect(railNow(page)).toHaveText('Its lesson');
  expect(await names()).toEqual(['From Light to the Garden (done)', 'Its lesson', 'The pyramid']);

  // and every other step is one tap away
  await button(page, 'See every step').click();
  await expect(page).toHaveURL(/#\/story$/);
  await expect(page.getByRole('heading', { name: 'Your journey', exact: true })).toBeVisible();
});

test('the Journey page is the whole sequence in order, with one step lit, and with the guide closed it says where it waits', async ({ page }) => {
  await from(page, { seen: seen(PART_ONE), last: 'descent' });
  await page.goto('/#/story');
  const path = page.getByRole('list', { name: 'Every step, in order' });
  const lit = path.locator('a[aria-current="step"]');
  await expect(lit).toHaveCount(1);
  await expect(lit).toContainText('Take the lesson: From Light to the Garden');
  await expect(lit).toContainText('You are here');

  // everything unfolded: the two first steps, then every scene once, in story order
  await expect(async () => {
    const folded = path.getByRole('button', { expanded: false });
    while (await folded.count()) await folded.first().click({ timeout: 2000 });
  }).toPass({ timeout: 30_000 });
  const hrefs = await path.getByRole('link').evaluateAll((all) => all.map((a) => a.getAttribute('href')));
  expect(hrefs[1]).toBe('#/guide'); // after the view, already chosen (which leads to Settings)
  expect(hrefs.filter((h) => h.startsWith('#/scene/'))).toEqual(sceneIds().map((id) => `#/scene/${id}`));
  // what follows from a part comes straight after its lesson: the pyramid, then the pyramid lesson that replays it
  const lesson = hrefs.indexOf('#/lesson/1/0?then=%2Fstory');
  expect(hrefs[lesson - 1]).toBe('#/scene/descent');
  expect(hrefs[lesson + 1]).toBe('#/pyramid');
  expect(hrefs[lesson + 2]).toMatch(/^#\/unit\//);

  // closed, the story's own next scene is lit instead, and the step the guide waits at says so
  await button(guide(page), 'Close the guide').click();
  await expect(lit).toContainText('Up next');
  await expect(path.getByRole('link', { name: /The guide waits here/ })).toContainText('Take the lesson: From Light to the Garden');
  await button(page, 'Resume the guide').click();
  await expect(lit).toContainText('You are here');
  await expect(lit).toContainText('Take the lesson: From Light to the Garden');
});
