// The offline journey: a real web build, served by `vite preview`, with the service worker in
// place. It is separate from the main suite because it needs its own build (VITE_TARGET=web) and
// its own server.
//
//   npm run e2e:offline
//
// On a machine without Playwright's own Chromium, set CHROME_PATH to an installed Chrome.
import { defineConfig, devices } from '@playwright/test';

const launchOptions = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};
const PORT = process.env.PREVIEW_PORT || 5213;
const baseURL = `http://localhost:${PORT}/`;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/offline.e2e.js',
  timeout: 120_000,
  retries: 0,
  reporter: 'list',
  use: { baseURL, trace: 'retain-on-failure', launchOptions, serviceWorkers: 'allow' },
  projects: [{ name: 'offline', use: { ...devices['Pixel 7'], launchOptions, serviceWorkers: 'allow' } }],
  // The web build first, then the built app is served. The build must finish before the server
  // starts, so the two are chained in one command.
  webServer: {
    command: `npx vite build --mode web && npx vite preview --port ${PORT} --strictPort`,
    env: { VITE_TARGET: 'web' },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
