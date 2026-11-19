// The usage journey: a real web build, served by `vite preview`, with the counts switched on.
//
//   npm run e2e:usage
//
// It is separate from the main suite because it needs its own build (VITE_TARGET=web and
// VITE_USAGE_TEST=1, so the counts may be sent from a test browser on localhost) and its own
// server. The test flag is never set by tools/build-web.mjs or by netlify.toml.
//
// On a machine without Playwright's own Chromium, set CHROME_PATH to an installed Chrome.
import { defineConfig, devices } from '@playwright/test';

const launchOptions = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {};
const PORT = process.env.USAGE_PORT || 5214;
const baseURL = `http://localhost:${PORT}/`;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/usage.e2e.js',
  timeout: 60_000,
  retries: 0,
  reporter: 'list',
  use: { baseURL, trace: 'retain-on-failure', launchOptions },
  projects: [{ name: 'usage', use: { ...devices['Pixel 7'], launchOptions } }],
  // The web build first (into its own folder), then the built app is served. The build must
  // finish before the server starts, so the two are chained in one command.
  webServer: {
    command: `node tools/build-web.mjs --outDir=dist-usage --test && npx vite preview --outDir dist-usage --port ${PORT} --strictPort`,
    env: { VITE_TARGET: 'web', VITE_USAGE_TEST: '1', VITE_FIREBASE_API_KEY: 'AIzaSyCW8gim_Tcs-4Nv8WSwjax-g5llpCtvDsE', VITE_FIREBASE_PROJECT_ID: 'amanah-stories' },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
