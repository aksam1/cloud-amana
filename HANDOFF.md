# Amanah: handover brief for a new chat

Read this first, then `CLAUDE.md` (the rules and engine notes), then `.claude/skills/chapter/SKILL.md`.

## 1. What this is
- An Islamic story app: the prophets' stories from the Quran as painted, animated WebGL scenes.
- Vite + React 19 + three/R3F. Each scene is one JSON file in `src/story/chapters/c<N>/s<NN>-<id>.json`.
- Live app (public artifact, version 20: the Pyramid of Righteousness is now the home page; blueprint in docs/PYRAMID-BLUEPRINT.md): https://claude.ai/artifact/HRp6qy5JJwz6rBJGtARwLq
- Repo: `aksam1/cloud-amana`, working branch `claude/hopeful-volta-f4sesq`.

## 1b. The bigger vision (from the user)
The web app is meant to have two parts:
1. **The story (built):** visual storytelling of the history of our ancestors, the prophets, so we can learn from it.
2. **A faith check (not started):** lets someone reflect on where their faith stands. The user first described it
   as "check your faith rank and where it may land you in the afterlife".
   - Care needed: in Islam only God knows and judges anyone's final place, so the app should never tell a
     person they are headed to Paradise or Hell. Frame it as private self-reflection and growth (prayer,
     Quran, character, charity, kindness), with encouragement from Quran and authentic hadith and next
     steps to improve. Agree the framing with the user before building it.

## 2. How the user likes to work
- They find it hard to conceptualise things: give every report as **ordered, numbered steps**.
- They want **ambitious visuals**. Keep going without waiting unless a decision is truly theirs.
- Publish to the same artifact URL after each batch, then commit and push.

## 3. Where the story stands (192 scenes)
| Ch | Story | Ch | Story |
|---|---|---|---|
| 1 | Creation, Adam, Iblis | 10 | Ayyub and Shu'ayb |
| 2–5 | Nuh, Hud, Salih and others | 11–13 | Musa (Nile, Pharaoh, wilderness) |
| 6 | Ibrahim | 14 | Dawud and Sulayman |
| 7 | Lut | 15 | Yunus and others |
| 8 | Ismail and Ishaq | 16 | Zakariya, Yahya and Maryam |
| 9 | Yaqub and Yusuf | 17 | Isa |
| | | 18 | Stories of Wisdom (Cave, Dhul-Qarnayn, Luqman…) |

- Chapters 19–21 are placeholders on the map.
- Each chapter has a "Between the stories" bridge page (`bridge` in chapter.json).
- Latest change (v18): every distinct place has its own setting (`src/layers/interiors.jsx`, `tools/generators/rooms.py`).

## 4. Waiting on the user (do not decide these yourself)
1. **How the Prophet Muhammad ﷺ is shown.** Recommendation given: never shown in any form. Chapter 19 is paused until they answer.
2. **Missing verses.** ~144 beats hold a `pendingVerse`. Once `api.alquran.cloud` is allowed in the environment's Network access, run `npm run words -- <ref>` for each, then `npm run verses`, then `npm run check`.
3. Deliberately left out (content rules), ask before adding: the Sabbath-breakers, the Companions of the Ditch, Ayyub's oath, Isa's return.

## 5. How to make changes
1. Most chapters are written by Python generators in `tools/generators/` (`c8.py`–`c17.py`, `extras*.py`, `wisdom.py`, `s*.py` for Ch1–7). Edit the generator, not the JSON, or your edit is overwritten next run.
2. Run it from that folder: `python3 c10.py`, then **always** `python3 renum.py` (keeps scene numbers whole and part ranges right).
3. Shared helpers: `base.py` (P(d, m) true scale, scene(), O()), `rooms.py` (one room per place), `bridges.py` (bridge pages), `chdoc.py N` (docs/CHAPTER-N).
4. `npm run check` must show 0 errors.
5. Review stills: `npm run dev`, then `node tools/generators/stills.cjs <outDir> sceneId:beat ...` (headless Playwright). Look at every changed beat; check nothing is black.
6. `npm run prompts` to refresh docs/IMAGE-PROMPTS.md.

## 6. How to publish
1. `npm run publish` prints a files map (new assets as paths, old ones as `null`).
2. Publish `deploy/index.html` with the Artifact tool to the URL above, passing that map as `files` (keep the nulls so old builds are removed).
3. Commit, push to the branch, report to the user in numbered steps.

## 7. Rules never to break (full list in CLAUDE.md)
- Allah never depicted. Prophets only as distant lights of steady light, no faces.
- Quran text only from `src/data/ayahs.json` (Sahih International), never typed by hand.
- Arabic scene titles never quote the Quran (check by hand).
- No music, no on-screen violence (lights go out). Narration says "God", 2–4 lines.
- Label imagined and tradition details in each scene's `art` list.
