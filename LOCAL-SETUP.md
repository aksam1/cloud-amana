# Running Amanah on your own computer

Follow these steps in order. Each one should work before you move to the next.

## Step 1. Install the tools (once)
1. **Git**: https://git-scm.com/downloads
2. **Node.js 22** (LTS): https://nodejs.org. Check with `node -v` (it should say v22 or higher).
3. **Python 3** (for the scene generators): https://www.python.org. Check with `python3 --version`.
4. **Claude Code** (the desktop app, or the CLI: `npm install -g @anthropic-code/claude-code`), signed in
   with the same account you use on claude.ai. That's what keeps publishing to the same app link possible.

## Step 2. Get the project
The latest work is on the branch `claude/hopeful-volta-f4sesq` (the `main` branch is older; see Step 7).

```bash
git clone -b claude/hopeful-volta-f4sesq https://github.com/aksam1/cloud-amana.git amanah
```

```bash
cd amanah
```

## Step 3. Install and run
```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5210 in your browser. You should see the start screen.

## Step 4. Check everything is healthy
```bash
npm run verify
```
This runs the story checker, the tests and a build. It should end with no errors.

For the review screenshots (stills) and the browser tests, install the browser once:
```bash
npx playwright install chromium
```

## Step 5. Open it in Claude Code
1. Open the `amanah` folder in Claude Code (desktop app: open folder; CLI: run `claude` inside it).
2. Claude reads `CLAUDE.md` (the rules) and the `chapter` skill automatically.
3. Start with: *"Read HANDOFF.md and LOCAL-SETUP.md, then tell me where the project stands."*

## Step 6. Publishing to the same app link
1. `npm run publish` builds the app and prints a files map.
2. Ask Claude Code to publish `deploy/index.html` to **https://claude.ai/artifact/HRp6qy5JJwz6rBJGtARwLq**
   with that files map. It must pass that URL (or it creates a new link), and it reads the artifact first.
3. Commit and push after each publish so GitHub and the app stay the same.

## Step 7. Make `main` the up-to-date branch (recommended, once)
All the work since Nov 1 lives on `claude/hopeful-volta-f4sesq`. Merge it into `main` on GitHub
(open a pull request from that branch into `main` and merge it), then locally:
```bash
git checkout main
```

```bash
git pull
```
From then on, work on `main` or on short branches you merge into it.

## The website build (the second build)

There are two builds of the same app, and they differ in one switch.

| Build | Command | What it is |
| --- | --- | --- |
| The artifact | `npm run publish` | One page for the Claude app link. No service worker, no install, no offline. |
| The website | `node tools/build-web.mjs` | A full web app: a service worker, an installable icon, offline reading, the mistake-report form. |

`VITE_TARGET=web` is the switch. It is set for you by `tools/build-web.mjs`; nothing else changes.

Everything web-only (the "On this device" part of Settings, the install invitation, the report
form) is hidden unless that switch is on, so the artifact keeps working exactly as before.

### Hosting it on Netlify
`netlify.toml` is already in the project. It sets the build command (`npm run build`), the folder
to publish (`dist`), Node 22, and the site's address. On Netlify, the build command must be
`node tools/build-web.mjs` (so the service worker is written) and `VITE_SITE_URL` must be set to
the site's real address, so link previews and the canonical link point at it.

### The icons and the link preview
Both are drawn by the app's own mark (`public/seal.svg`):

```bash
node tools/render-icons.cjs   # public/icons/*.png and public/apple-touch-icon.png
node tools/render-og.cjs      # public/og-image.png (1200×630, for link previews)
```

Both need a browser. They use Playwright's Chromium if it is installed, or the Chrome on the
machine: set `CHROME_PATH` if it is somewhere unusual.

### Checking that it works offline
```bash
npm run e2e:offline
```
This builds the web app, serves it, waits for the service worker to take over, turns the network
off, reloads, and checks that the home page still appears. On a machine without Playwright's own
Chromium, use `npm run e2e:offline:chrome` instead (it points at the installed Chrome).

To try it by hand: run `node tools/build-web.mjs`, then `npx vite preview --port 5211`, open it,
turn off the network (in the browser's developer tools, or by switching off Wi-Fi), and reload. The
app opens from the saved files. In Settings, "Keep the whole story" saves every scene, so the
whole chronicle works with no connection.

## Things that are different from the cloud chats
- Quran verses: `npm run words` and `npm run ayahs` fetch from api.alquran.cloud, which works on a normal
  internet connection (no network settings needed).
- The scene generators are in `tools/generators/` (run them from that folder with `python3`). Some are
  older than later hand edits: after running one, `git diff --stat src/` and keep only the scenes you meant
  to change.
- Don't work on the same branch from a cloud chat and your computer at the same time. If you must, always
  `git pull` before you start and push when you stop.
