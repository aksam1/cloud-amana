# Amanah: working notes for Claude

An Islamic story app (Vite 8, React 19, motion, Tailwind 4, three/R3F). Each scene is a JSON file in
`src/story/chapters/c<N>/`; the campaign map is the main navigation. It is published as a private
artifact at https://claude.ai/artifact/HRp6qy5JJwz6rBJGtARwLq. Chapters arrive as pasted briefs; the
`chapter` skill (`.claude/skills/chapter/SKILL.md`) is the step-by-step workflow for turning one into scenes.

## Content rules (never break these)

- Allah is never depicted, in any form, symbol or light.
- Prophets appear only as figures of steady light, far away or from behind. No faces, ever.
- Every ayah is cited in Arabic and English. English is Sahih International, verbatim; `…` marks a gap.
  Quran text is never typed into a scene: it comes from `src/data/ayahs.json` by word range
  (`ref` + `ar`). Run `npm run words -- 11:58` to see the indexes; it fetches missing ayat (from
  api.alquran.cloud, which the environment's network policy must allow). If they cannot be fetched, the
  verse beat holds its shot with `"pendingVerse": { "ref", "place" }` (the checker warns) until
  `npm run verses` fills it; never stand in other text or another edition.
- A scene's `arabic` title is plain Arabic, never a Quran phrase (the checker rejects it).
- Imagined details and tradition/hadith details are labelled in the scene's `art` list.
- No music and no instruments. Sound beds are synthesized wind, water, crowds and voices without words.
- No violence or suffering on screen: lights simply go out.
- Narration (`say`) is plain English for non-Muslims (God, not Allah, in narration), 2–4 per scene.
- Crowd scorn is drawn as jagged strokes, letters as single shapes: never invented words.

## Commands

```
npm run dev                 # localhost:5210 (preview name "amanah" in ../.claude/launch.json)
npm run words -- 26:128-130 # Arabic word indexes + Sahih English (fetches into ayahs.json)
npm run scene -- 5 49 id "Title" --gl   # scaffold a scene (drop --gl for a 2D scene)
npm run check               # verbatim English, Arabic ranges, titles, layer types, sound names
npm run prompts             # regenerate docs/ image prompts from scenes' imagePrompt
npm run publish             # build + deploy/index.html + the files map for the artifact
npm run verses              # turn each beat's pendingVerse into its verse once the ayat are fetched
```

## Reviewing scenes (do this for every beat)

- `#/scene/<id>?beat=n&still` holds the end of beat n (paused, camera where the beat ends).
- Add `&t=0.4` to hold walks, moves and reveals part way (a line of walkers mid-gate, a reveal half painted),
  with the camera part way along its move too. `&t=0` is where a beat begins: for a beat that opens a set,
  the opening framing seen through the dissolve; for beat 0, the scene's first framing. Check both.
- `#/sheet/<chapter>` is a contact sheet of every beat, desk and phone, with the caption panels' zones.
- The browser pane is usually hidden: WebGL stills still render (still mode advances frames by hand), but
  motion/CSS animations barely run there. Wait ~10–15 s after a full load; retry a blank screenshot.
- Scene JSON is not hot-reloaded: `location.reload()` after editing a scene file. Hash changes between beats
  of the same scene reuse painted cards and are fast.
- In DEV `window.__gl` is the R3F state (`__gl.scene`, `__gl.camera`, `__gl.advance(performance.now())`).

## Scene anatomy

- Layers: `{ "type": ..., "show": [from, to] | [[a,b],[c,d]], "at": { "2": {...per-beat overrides} } }`.
  Never name a layer option `at` (it is the per-beat override map).
- Beats: `dur`, `say`, `verse` ({ref, ar, place: "lower", en}), `ambient` (bed names), `sfx` ("gust" or
  `{ "name": "gate", "at": 12500 }`), `cam`, `world` (GL).
- Passages: `"ref": "89:6-8"`; `ar` omitted for whole ayat, or one range per ayah (`null` = whole ayah).
- Caption panels at lg (1024×768): chronicle bottom-left (x 228–697 design, y > ~630), verse panel
  x 725–1372, y ~490–724. During a verse beat keep the subject in the upper ~55% of the frame.

## WebGL scenes (`"renderer": "gl"`, from Chapter 4)

- Design frame 1600×900, y down. The reference camera at Z = 1000 sees it exactly. A layer at parallax
  `depth` d stands at Z = 1000 − 1000/d, scaled 1/d, so it looks as painted until the camera moves.
- Camera `pos`/`look` are `[x, y, z]` with x, y in design units and z in world units (1000 = reference).
  `path` adds spline points; `ease` (inOut, out, in, linear); `focus` racks depth of field; `dur`, `cut`.
- Any 2D painter becomes a card (painted offscreen to a texture). Card options: `reveal` {dir, dur, delay}
  (brush-stroke paint-in), `move` {path: [[dx, dy, dz]…], dur, delay}, `fog` (0 for skies), `light`,
  `sat`, `tint` [colour, amount], `area` (what it paints), `ppu` (texture pixels per unit; raise it for
  cards the camera gets close to, keep width × ppu ≤ 4096). Changing a card's art in `at` crossfades it
  (time-lapse: palms withering, a pool drying).
- GL-native types: `light` (people of light: `pose`, `path` with z for true 3D walks, `delay`, `w`,
  `bright`, `solid`, `kind: "flame"`), `crowd` (people or `kind: "army"`; `ground` for world-space bands;
  `y: [front, back]`; `out` puts lights out), `dust` (`blend: "normal"` for smoke/sand), `ribbons`,
  `cloth` (`pole`, `tear`), `storm`, `sun` (the visible one streams god-rays).
- Overlays stay flat on screen above the 3D world: calligraphy, guidance, jeers, numerals, lightning,
  tint, particles, inkdrop, flash (`OVERLAY` in `src/gl/GLStage.jsx`). Position them where the subject appears
  for that beat's camera, and keep the camera still while they play.
- Montage: a `set` layer groups a shot's layers, composed as if from the reference camera, and stands
  them `dx` across / `dz` along; a beat's `cam` with the same `dx`/`dz` frames it. Give each set a `show`
  range ending where the next set begins. Changing set dissolves: the stage waits (up to 3 s) until the
  new set is painted, snapshots the last frame and fades it over the new shot once that has been drawn,
  so nothing between the shots shows. Layers outside sets are shared backdrops (sky, sun, far dunes).
- World (scene `world`, beat `world` overrides, merged cumulatively): fog, fogNear, fogFar, light, rays,
  bloom, haze/hazeY (heat shimmer band), shake, dof, cycle {period, min} (days and nights flickering).

## Gotchas learned the hard way

- Colours in the GL stage are used exactly as written, like the painted cards' (`ColorManagement` is off in
  `GLStage.jsx`). Turning it back on darkens and oversaturates every hex colour (haze, glows, cloth, dust)
  against the paintings: a `#3a3a4a` haze came out near black.
- A card roughens its edges only where its painting runs off the card (checked when it is painted; sides
  always). A painting that ends inside its `area` keeps its own edge, so leave a few units of margin
  above a floor's far edge.
- A camera that moves in opens gaps between foreground cards onto whatever stands far behind (The Cloud
  looked through its roofs onto the dark base of the far dunes): hold such beats with `&still` and fill
  the gap with a card in between (there, a second plaza floor behind the roofs).
- Every material is compiled while the stage loads (`ReadyGate`); never rebuild the finishing passes per
  beat (a scene with god-rays in any beat keeps them, at weight 0 where a beat has none).
- A camera's `look` (and `pos`) y is not scaled by depth: to aim at something standing at design y on a
  card at depth d (z = 1000 − 1000/d), look at y' = 450 + (y − 450) × (1000 − z) / 1000.
- A card's own `fade` is a number (ms); a painter's `fade` word ("none", "out") is passed to the painter.
- Thamud's land (`src/layers/hijr.jsx`): `outcrop` (sandstone with carved `homes`, lamps `lit`, a `rift`
  of light), `shecamel` (only as light; poses stand, walk, drink, kneel) and `well` (`trough`, `frame`).
- Daylight figures of light blow out to white: use `glow` 0.1–0.3, `bright` ~0.85, `solid` ~0.5.
- Cards draw in depth order with no depth buffer: a floor card must stand behind everything on it, a
  crowd's whole mesh sorts by its middle Z, and a dune band in front hides whatever stands below its crest.
- Never set `renderOrder` on a three.js group (it sorts all children before every card).
- Depth-of-field blurs cards only (mip bias); crowds and lights stay sharp.
- `postprocessing` needs three < 0.187 (pinned 0.186.0). A composer disposes its effects on unmount.
- Bash heredocs break on JSX and apostrophes: write code with the Write tool, or a `.cjs` patch file.
- `captionHoldMs` in `src/lib/pacing.js` is the user's TODO(human); leave it for them.
