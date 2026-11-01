---
name: chapter
description: Turn a pasted Amanah chapter brief (scenes with visuals, camera, sound and an on-screen ayah) into scene JSON files, verified beat by beat and published. Use whenever the user pastes the next chapter or asks to add, rework or publish scenes of the Amanah story app.
---

# Making an Amanah chapter

Read `CLAUDE.md` first: its content rules are absolute, and its WebGL notes explain every option used here.

## 1. Read the brief into a plan (no code yet)

For each scene note: id (one short word), order, title, the ayah ref, the beats (3–5: openers that
`say` something, one verse beat last), which shots need their own `set`, the sound beds per beat, and
anything imagined that must go in `art`. Note brief items the engine cannot do and say so at the end
rather than faking them (for example, a glyph's true stroke order is not available; outlines stand in).

Watch the brief's wording against the rules: a prophet is only light seen from far or behind; the
answer in a verse may be God's words, not the prophet's (never attribute it in narration); suffering is
never shown, lights go out; no instruments.

## 2. Ayat first

```
npm run words -- 26:128-130 7:65 11:58
```
This fetches anything missing into `src/data/ayahs.json` and prints word indexes. Copy English verbatim
from its output (Sahih International, including brackets and its spelling of names, such as 'Aad);
use `…` for a gap. Single ayah: `ar: [first, last]`. Passage: `"ref": "69:6-7"` with `ar` per ayah.

## 3. Chapter file

`src/story/chapters/c<N>/chapter.json`: number, title, arabic (plain), `nodes` (map nodes from
`src/story/timeline.json`), `parts` [{title, from, to}] covering every scene order.

## 4. Scenes

Scaffold with `npm run scene -- <N> <order> <id> "<Title>" --gl`, then write the layers. Patterns that work:

- Start each shot from the reference view: sky (`fog: 0`), sun, far dunes/backdrop, then cards from far
  to near, natives (light, crowd, dust) at their depths, overlays last.
- Keep camera moves modest (magnification under ~1.4 on any card) and raise `ppu` on cards it nears.
- Long continuous moves through several places: one `set` per place with `dx` (sideways) or `dz`
  (forward) and its own `show`; the beat's `cam` carries the same `dx`/`dz`.
- Walks into the distance: a `light` `path` of `[x, y, z]` points (design x, y as seen from the reference
  camera at world depth z). The walker must stay in front of any card it walks over.
- Time-lapse: change a card's art in `at` (wither, water, dry, colour); it crossfades each beat.
- Day/night: beat `world.cycle` {period, min} with a `numerals` overlay `every` = period × 500.
- Verse beat: subject in the upper ~55% of the frame; the verse panel takes the lower third.
- Daylight figures: `glow` 0.1–0.3, `bright` ~0.85, `solid` ~0.5. Night or interiors: defaults.

Add any new painter to `src/layers/<theme>.jsx` with a doc comment and a `bounds(cfg)` when it draws in a
small region, register it in `src/layers/index.js`, and add new sound beds to `src/lib/audio.js` (the
checker rejects unknown names).

## 5. Check and look at every beat

```
npm run check
```
Then for each scene and beat open `#/scene/<id>?beat=n&still` (and `&t=0.4` for walks, moves and
reveals), `location.reload()` after editing JSON, and look for: blown-out figures, cards hiding what
stands on them, subjects under the caption panels, empty frames, and the Arabic in the panel. Also open
`&t=0` for each scene's beat 0 and every beat that opens a set (where the camera starts: what shows
through the dissolve), and look for a card's edge, a gap between cards onto something dark far behind,
or plain haze where the shot should be. Finish with `#/sheet/<N>` for desk and phone. Fix, then look again.

## 6. Publish

```
npm run prompts
npm run publish
```
Publish `deploy/index.html` to the artifact URL in `CLAUDE.md` with the files map it prints (it adds the
new hashed assets and removes the old ones listed in `deploy/assets.json`). Update the memory note for
the app, and tell the user what was verified, what was approximated, and anything in the brief left
unanswered.
