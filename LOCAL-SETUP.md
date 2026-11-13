# Running Amanah on your own computer

Follow these steps in order. Each one should work before you move to the next.

## Step 1. Install the tools (once)
1. **Git**: https://git-scm.com/downloads
2. **Node.js 22** (LTS): https://nodejs.org. Check with `node -v` (it should say v22 or higher).
3. **Python 3** (for the scene generators): https://www.python.org. Check with `python3 --version`.
4. **Claude Code** (the desktop app, or the CLI: `npm install -g @anthropic-ai/claude-code`), signed in
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

## Things that are different from the cloud chats
- Quran verses: `npm run words` and `npm run ayahs` fetch from api.alquran.cloud, which works on a normal
  internet connection (no network settings needed).
- The scene generators are in `tools/generators/` (run them from that folder with `python3`). Some are
  older than later hand edits: after running one, `git diff --stat src/` and keep only the scenes you meant
  to change.
- Don't work on the same branch from a cloud chat and your computer at the same time. If you must, always
  `git pull` before you start and push when you stop.
