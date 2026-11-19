// The anonymous usage counts, end to end, on a real web build (playwright.usage.config.js: `npm run e2e:usage`).
//
// Nothing reaches Firestore: the page's sendBeacon is replaced by one that keeps what it was handed, and any
// request to Google's servers is refused (and fails the test). What is checked is what *would* have been sent:
//   · one record per page-part, holding exactly the thirteen fields the Firestore rules accept
//   · never the chosen view, never anything typed, never an email address
//   · nothing at all when the reader turns the counts off, or the browser sends Global Privacy Control
import { expect, test } from '@playwright/test';

const FIELDS = ['app', 'd', 'dev', 'err', 'ev', 'exp', 'lang', 'p', 'pv', 'ref', 'ret', 'sec', 'v'];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__beacons = [];
    navigator.sendBeacon = (url, data) => {
      window.__beacons.push({ url: String(url), data });
      return true;
    };
  });
  // belt and braces: if anything tried the network instead, it is stopped and the test says so
  page.__leaked = [];
  await page.route(/googleapis\.com/, (route) => {
    page.__leaked.push(route.request().url());
    return route.abort();
  });
});

test.afterEach(async ({ page }) => {
  expect(page.__leaked, 'nothing may reach Google from a test').toEqual([]);
});

/** Send the counts now, as the browser does when the page is hidden or closed. */
const flush = (page) => page.evaluate(() => window.dispatchEvent(new Event('pagehide')));

/** What would have been sent: [{ url, fields, text }]. */
const sent = (page) =>
  page.evaluate(() =>
    Promise.all(
      window.__beacons.map(async (b) => {
        const text = typeof b.data === 'string' ? b.data : await b.data.text();
        return { url: b.url, fields: JSON.parse(text).fields, text };
      }),
    ),
  );

const goHash = async (page, hash) => {
  await page.evaluate((h) => {
    window.location.hash = h;
  }, hash);
  await expect(page).toHaveURL(new RegExp(`${hash.replace(/[?/]/g, '\\$&')}$`));
};

test("a visit's counts hold only the fields the rules accept, and never the view the reader chose", async ({ page }) => {
  await page.goto('/#/');
  // a reader who chose the Muslim view: that choice must never leave the device
  await page.evaluate(() => localStorage.setItem('amanah:v1', JSON.stringify({ prefs: { mode: 'muslim' } })));
  await page.reload();

  // the home page links to the privacy page
  await page.getByRole('button', { name: 'Privacy', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your privacy' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Usage counts' })).toBeVisible();
  await goHash(page, '#/about');
  await expect(page.getByRole('heading', { name: 'About Amanah' })).toBeVisible();

  await flush(page);
  const out = await sent(page);
  expect(out).toHaveLength(1);
  const [{ url, fields, text }] = out;
  expect(url).toMatch(/^https:\/\/firestore\.googleapis\.com\/v1\/projects\/amanah-stories\/databases\/\(default\)\/documents\/ev\?key=/);
  expect(Object.keys(fields).sort()).toEqual(FIELDS);
  expect(fields.v.integerValue).toBe('1');
  expect(fields.p.integerValue).toBe('0');
  expect(Object.keys(fields.pv.mapValue.fields)).toEqual(expect.arrayContaining(['privacy', 'about']));
  expect(text).not.toMatch(/muslim|curious/i);

  // a second part of the same visit is numbered on, and an empty one sends nothing
  await flush(page);
  expect(await sent(page)).toHaveLength(1);
  await goHash(page, '#/settings');
  await flush(page);
  const again = await sent(page);
  expect(again).toHaveLength(2);
  expect(again[1].fields.p.integerValue).toBe('1');
});

test('what is typed into the contact form never goes into the counts', async ({ page }) => {
  let posted = '';
  await page.route(
    (url) => url.pathname === '/',
    (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      posted = route.request().postData() || '';
      return route.fulfill({ status: 200, body: '' });
    },
  );
  await page.goto('/#/contact?kind=question');
  await expect(page.getByRole('heading', { name: 'Write to us' })).toBeVisible();
  await expect(page.getByLabel('What is it about')).toHaveValue('question');
  await page.getByLabel('Your message').fill('I prayed for my mother last night');
  await page.getByLabel(/Your email/).fill('reader@example.com');
  await page.getByRole('button', { name: 'Send the message' }).click();
  await expect(page.getByText('Your message has been sent.')).toBeVisible();

  // the form went to the host with its kind; the counts say only that a message was sent
  expect(new URLSearchParams(posted).get('kind')).toBe('question');
  expect(new URLSearchParams(posted).get('form-name')).toBe('report');
  await flush(page);
  const [{ fields, text }] = await sent(page);
  expect(fields.ev.arrayValue.values.map((v) => v.stringValue)).toContain('report.sent');
  expect(text).not.toMatch(/prayed|mother|reader|example\.com/);
});

test('turning the counts off in Settings sends nothing, and forgets the first day', async ({ page }) => {
  await page.goto('/#/settings');
  const share = page.getByRole('switch', { name: 'Share anonymous usage counts' });
  await expect(share).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => localStorage.getItem('amanah:firstSeen'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  await share.click();
  await expect(share).toHaveAttribute('aria-checked', 'false');
  expect(await page.evaluate(() => localStorage.getItem('amanah:firstSeen'))).toBeNull();

  await goHash(page, '#/about');
  await flush(page);
  expect(await sent(page)).toHaveLength(0);

  // it stays off on the next visit
  await page.reload();
  await goHash(page, '#/privacy');
  await flush(page);
  expect(await sent(page)).toHaveLength(0);
});

test('a browser that sends Global Privacy Control sends nothing, and Settings says why', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true, configurable: true });
  });
  await page.goto('/#/settings');
  const share = page.getByRole('switch', { name: 'Share anonymous usage counts' });
  await expect(share).toHaveAttribute('aria-checked', 'false');
  await expect(share).toBeDisabled();
  await expect(page.getByText('Your browser asks sites not to track, so nothing is sent.')).toBeVisible();

  await goHash(page, '#/about');
  await flush(page);
  expect(await sent(page)).toHaveLength(0);
});
