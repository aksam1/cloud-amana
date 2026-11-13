# Amanah: handover brief for a new chat

Working on your own computer? Start with `LOCAL-SETUP.md`.

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

## 3. Where the story stands (203 scenes)
| Ch | Story | Ch | Story |
|---|---|---|---|
| 1 | Creation, Adam, Iblis | 10 | Ayyub and Shu'ayb |
| 2–5 | Nuh, Hud, Salih and others | 11–13 | Musa (Nile, Pharaoh, wilderness) |
| 6 | Ibrahim | 14 | Dawud and Sulayman |
| 7 | Lut | 15 | Yunus and others |
| 8 | Ismail and Ishaq | 16 | Zakariya, Yahya and Maryam |
| 9 | Yaqub and Yusuf | 17 | Isa |
| | | 18 | Stories of Wisdom (Cave, Dhul-Qarnayn, Luqman…) |
| | | 19 | The Final Messenger ﷺ — **paused** (see §4.1) |
| | | 20 | The Signs of the Hour (the minor and the major signs) |
| | | 21 | The Day of Judgment |

- Chapter 19 is a placeholder on the map; its three parts carry no `from`/`to` and it has no scenes.
- Chapters 20 and 21 are written (11 scenes) and are the end of the chronicle. Neither shows a single person:
  they are the Quran's own pictures of the end — sky, earth, light, stillness. Generator: `tools/generators/c20_21.py`.
  Docs: `docs/CHAPTER-20-SIGNS.md`, `docs/CHAPTER-21-JUDGMENT.md`.
- Each chapter has a "Between the stories" bridge page (`bridge` in chapter.json).
- Every distinct place has its own setting (`src/layers/interiors.jsx`, `tools/generators/rooms.py`); the same place may
  look the same in later scenes. Since v31 all 203 scenes run on the WebGL stage: chapters 2–3 were rebuilt from their 2D
  originals by `tools/generators/c2_3.py` (the originals are kept in `tools/generators/legacy2d/`).

## 4. Waiting on the user (do not decide these yourself)
1. **How the Prophet Muhammad ﷺ is shown.** Recommendation given: never shown in any form. Chapter 19 is paused until they answer.
2. Deliberately left out (content rules), ask before adding: the Sabbath-breakers, the Companions of the Ditch, Ayyub's oath, Isa's return.
3. All 503 ayat are on file and **no verse is pending** any more; every verse moment, unit ref and lesson ref shows
   its text. When new ayat are needed and api.alquran.cloud is blocked, use the two-mirror method in
   `src/data/ayahs.SOURCE.md`.

## 5. How to make changes
1. Most chapters are written by Python generators in `tools/generators/` (`s*.py` for Ch1, `c2_3.py` for Ch2–3, `c8.py`–`c17.py`, `c20_21.py` for Ch20–21, `extras*.py`, `wisdom.py`; Ch4–7 have no generator here, so edit their JSON). Edit the generator, not the JSON, or your edit is overwritten next run.
   Scene 1 (`s01-heavens.json`) was refined by hand after its generator: do not re-run `s01_06.py` over it.
2. Run it from that folder: `python c10.py`, then **always** `python renum.py` (keeps scene numbers whole and part ranges right).
   On Windows use `python` (there is no `python3`), and every generator that reads or writes Arabic must pass
   `encoding='utf-8'` — the default is cp1252 and it cannot hold an Arabic title.
3. Shared helpers: `base.py` (P(d, m) true scale, scene(), O()), `rooms.py` (one room per place), `bridges.py` (bridge pages), `chdoc.py N` (docs/CHAPTER-N).
4. `npm run check` must show 0 errors.
5. Review stills: `npm run dev`, then `node tools/generators/stills.cjs <outDir> sceneId:beat ...` (headless Playwright). Look at every changed beat; check nothing is black.
6. `npm run prompts` to refresh docs/IMAGE-PROMPTS.md.

## 6. How to publish
1. `npm run publish` prints a files map (new assets as paths, old ones as `null`).
2. Publish `deploy/index.html` with the Artifact tool to the URL above, passing that map as `files` (keep the nulls so old builds are removed).
3. Commit, push to the branch, report to the user in numbered steps.

The Artifact tool needs a claude.ai login, so it is refused while `ANTHROPIC_AUTH_TOKEN`
(the orbit1 relay) is set. `tools/publish-artifact.sh` runs the publish in a nested CLI session with
the relay unset (`CLAUDE_CODE_ARTIFACT=1 CLAUDE_CODE_ARTIFACT_MCP=1`), which is how it was done
on 13 Nov 2026. `tools/make-publish-prompt.py` writes the exact publish call to
`deploy/publish-prompt.txt` (not committed; `deploy/` is ignored).

Two refusals to expect, and their fixes:
- *"you hadn't viewed the live version"*: read the artifact first in the same session
  (`action=read` with the `url`) — the publish prompt does this.
- *"some files changed since Claude last saw them"*: the 22 old bundles being removed must be
  named in `overwrite_unread` on the publish call.

## 7. Rules never to break (full list in CLAUDE.md)
- Allah never depicted. Prophets only as distant lights of steady light, no faces.
- Quran text only from `src/data/ayahs.json` (Sahih International), never typed by hand.
- Arabic scene titles never quote the Quran (check by hand).
- No music, no on-screen violence (lights go out). Narration says "God", 2–4 lines.
- Label imagined and tradition details in each scene's `art` list.
