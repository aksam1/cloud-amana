// End-to-end journeys in a real browser: `npm run e2e`.
// Locally, set CHROME_PATH to use an installed Chrome; CI installs Playwright's own Chromium.
import { defineConfig, devices } from '@playwright/test';

const launchOptions = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.e2e.js',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:5210/', trace: 'retain-on-failure', launchOptions },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], launchOptions } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 860 }, launchOptions } },
  ],
  webServer: { command: 'npm run dev', url: 'http://localhost:5210/', reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
