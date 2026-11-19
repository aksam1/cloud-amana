// End-to-end journeys in a real browser: `npm run e2e`.
// Locally, set CHROME_PATH to use an installed Chrome; CI installs Playwright's own Chromium.
//
// The suite runs against this copy's own dev server on PORT (5212 by default). It is not the
// app's usual port 5210: another copy of the app may already be running there, and Playwright
// would then test that one instead of this one.
import { defineConfig, devices } from '@playwright/test';

const launchOptions = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};
const PORT = process.env.PORT || 5212;
const baseURL = `http://localhost:${PORT}/`;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.e2e.js',
  // the offline and usage journeys run against a built web app (playwright.offline.config.js, playwright.usage.config.js)
  testIgnore: ['**/offline.e2e.js', '**/usage.e2e.js'],
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL, trace: 'retain-on-failure', launchOptions },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], launchOptions } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 860 }, launchOptions } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
