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
  `npm run verses` fills it (a `"part"` note marks part of an ayah, whose `ar`/`en` are then chosen by
  hand); never stand in other text or another edition.
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
  x 725–1372, y ~490–724. During a verse beat keep the subject in the upper ~55% of the frame, or, when
  the subject stands on the floor (a room, a tent, a crowd), place the verse `"sky"` (top, centred, y
  ~100–400 px at 1024×768) and keep the subject in the middle band. The sheet outlines a pending verse
  as a medium-sized panel. To place things by numbers: a design point (x, y) on depth d stands at
  world (800 + (x−800)/d, 450 + (y−450)/d, 1000 − 1000/d); the vertical half-view is tan⁻¹ 0.45.

## Scale (keep things true to size)

- A person of 1.7 m stands 255 × depth design units tall (1 m = 150 × depth): at depth 0.24 about 61, at
  0.42 about 107. Size every prop the same way: a 1 m brazier (`s` ≈ 2 × depth), a 1.8 m well curb
  (`w` ≈ 270 × depth, `h` ≈ 135 × depth), a 2.6 m tent, a 2 m camel's hump (`animals` `size` ≈ 3.3 × depth),
  a sheep 0.9 m and a cow 1.4 m (per-pair `s`), a stall 2.2 m (`s` ≈ 3.44 × depth). A crowd's `size` is a
  person's height in design units at its depth, like `h`.
- To make a group read larger, bring the whole group nearer (higher depth) rather than enlarging one
  thing: Chapter 9's generator does it with a `zoom(k, cx, cy, …)` helper (depth × k, sizes × k, positions
  spread about (cx, cy) by k), which leaves the group where it was from the reference camera. Keep a near
  grass band in front of the group's new depth.

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
- GL-native types: `light` (people of light: `pose` stand/walk/raise/reach/kneel/bow (prostration)/babe
  (an infant lying; give it `w` ~1)/gone, `path` with z for true 3D walks, `delay`, `w`, `bright`, `solid`,
  `kind: "flame"`, `kind: "bird"` (wings beat along its path, fold when it lands; `pos` is its middle),
  `kind: "ember"` (a figure of shadow in a smouldering glow of `color`: Iblis)),
  `crowd` (people or `kind: "army"`; `ground` for world-space bands; `y: [front, back]`; `out` puts lights
  out; `orbit` {center [x, z], radius [rx, rz], band, speed, half} circles a centre anticlockwise, with a
  "back" and a "front" half as two layers around what they circle, centre z on that card's plane;
  `kind: "angels"` stands columns of light in ranks or rings (orbit at speed 0); `bow` 1 bends them low in
  a wave toward `bowTo`), `dust` (`blend: "normal"` for smoke/sand), `ribbons`,
  `cloth` (`pole`, `tear`), `storm`, `sun` (the visible one streams god-rays), `heavens` (a living sky:
  per-beat `tod` [from, to, ms] hours run the sky through night, dawn, day and dusk; `star`, `moon`, `sun`
  {rise, set, x0, x1, peak} rise and set behind the hills; it drives the scene's light and haze while shown,
  so use it instead of a `sky` card; `tod` [from, to, ms, days] runs whole days past first), `fire`
  (ink-wash flame sheets: `pos`, `w`, `h`, `heat`; `cool` 0–1 eases it to calm silver-blue light over
  `coolDur`), `masonry` (a building of stone raised course by course on one plane: `pos` foot middle, `w`,
  `h`, `side` face receding to `horizon`, `courses`, `blocks`, `built` 0–1 or `build` [from, to, ms,
  delay], `door` {x, w, h, lift}, `robe` 0–1 black cloth with a gold band), `spring` (a pool welling up:
  `pos`, `r`, `squash`, `well` 0–1 or `rise` [from, to, ms, delay], `rim` 0–1 bank of sand), `cosmos` (the
  beginning: a `point` of light, `thread` of gold light, the joined `mass`, swirling `smoke`, `split` parting
  it with a burst ring, `skies` 0–7 shells of light, `stars`, molten `lava` below; `colors`/`gold`/`base` recolour
  it (ember for the jinn, violet for dreams, gold for the angels' court); a backdrop that eases between beats), `globe` (the earth's curve with
  every life a light on the land: `pos`, `r`, `r0`/`zoomDur`, `phase` appear/dark/gold).
- A card can `shatter` {delay, dur, spread, gravity, spin, floor, cols, rows} (usually set in `at` for the
  beat it breaks): it is cut into shards that fly, tumble and rest on the `floor` line; a negative `delay`
  shows it already broken, and a break from an earlier beat's `at` shows already fallen. A card's `move`
  can `rot` [x°, z°] to turn it over as it goes (both faces are drawn; it turns about the card's middle).
  A `move` set in an earlier beat restarts when a later beat is entered directly or held in a still:
  give the later beats its end state (`path: [[end]]`, `dur: 1`), as The Morning does.
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
- `animals` (`src/layers/creatures.jsx`) also draws `cow` and `leancow` (ribs showing: the king's dream); for
  standing herds give single-point paths, `fade: "none"` and an `area`, as the camels do.
- `ears` (creatures.jsx) draws stalks of grain (`n`, `x0`, `x1`, `y`, `h`, `state` green or dry); `balance`
  (`src/layers/madyan.jsx`) a merchant's balance on a post (`h`, `w`, `tilt` degrees: 0 is a fair measure).
- Musa's story (`src/layers/musa.jsx`): `basket` (reed basket, `w`), `reeds` (papyrus clumps `x0`–`x1` on `y`,
  `h`), `staff` (`len`; `state: "serpent"` draws the ink serpent, `face`), `seawall` (a towering wall of water
  `x0`–`x1` from the sea floor `y` up `h`, its sheer `face` side onto the path; part the sea with two walls
  whose `move` slides them apart and up, as The Sea Parts does).
  `tablets` (two stone tablets, `h`, rows of strokes for writing, `glow`) and `boat` (`w`, `hole`). `animals`
  kinds `calf` (gold) and `yellowcow` (2:69). `ants` (creatures.jsx) is a file of ink ants (`x0`–`x1` on `y`, `count`, `s`, `home`). `whale` (musa.jsx) is a
  whale's back in ink breaking the water (`w`, `face`, `open`).
- Maryam's and Isa's story (`src/layers/isa.jsx`): `claybirds` (birds shaped of clay on a board, `x0`–`x1`,
  `count`, `s`, `wet`), `fruit` (a bowl of out-of-season fruit, `w`, `glow`) and `table` (the table sent down,
  `w`, `glow`; lower it with a `move`). A single angel is a `crowd` of `kind: "angels"` with `count` 1 in a
  tiny `area` (a column of light, never a figure).
- Crowds of people read best at `glow` 0.1–0.15 and `dim` 0.4 by day: brighter, hundreds of them wash out
  into a band of white.
- Ibrahim's land (`src/layers/ur.jsx`): `idol` (faceless; `kind` stone, wood, gilt, clay), `ziggurat`
  (stepped temple tower with stairs and shrine), `tent` (goat hair, `lit` lamp inside) and `ram` (only as
  light). `numerals` can `count` plainly from one (Hajar's seven runs).
- Arabic titles must not quote the Quran even when its ayat are not fetched yet (the checker can only catch
  phrases from fetched ayat): "يوم الزينة", "مجمع البحرين" and "المن والسلوى" were caught by hand.
- A wide `seawall` or `waves` card in front of a ship in the storm scene (The Lots) blacked out the whole
  stage in the headless renderer; a dark `water` band in front works. Check every new scene's still is not black.
- Scene ids are unique across all chapters (`son`, `call`, `warning` were taken): `npm run check` says so.
- Painters drawn on a live 2D canvas (`useCanvas`, such as the old `globe`) do not paint onto GL cards; a GL
  native with the same type name takes over in GL scenes (`heavens`, `globe`).
- A shader's clock (`clock.elapsedTime`) can be very large in a still or after long play: never let it push
  a threshold that should settle (the globe's lights once switched off for good as it turned).
- Chapter 1 was rebuilt for the GL stage keeping each scene's words, verses and timing; its old 2D
  compositions are in git history.
- A `dust` box is in world units ([x − 800, 450 − y, z], not scaled by depth): to fill the air over a far
  city (depth 0.1, z −9000) its x and y spans must be ten times wider, and `size` large (points shrink with
  distance).
- A card's dry-brush flecks fall only on real edges (where its cover changes sharply); soft washes such as
  clouds stay whole. Before, half-clear paintings broke into a blocky mosaic.
- Daylight figures of light blow out to white: use `glow` 0.1–0.3, `bright` ~0.85, `solid` ~0.5.
- Cards draw in depth order with no depth buffer: a floor card must stand behind everything on it, a
  crowd's whole mesh sorts by its middle Z, and a dune band in front hides whatever stands below its crest.
- Never set `renderOrder` on a three.js group (it sorts all children before every card).
- Depth-of-field blurs cards only (mip bias); crowds and lights stay sharp.
- `postprocessing` needs three < 0.187 (pinned 0.186.0). A composer disposes its effects on unmount.
- Bash heredocs break on JSX and apostrophes: write code with the Write tool, or a `.cjs` patch file.
- `captionHoldMs` in `src/lib/pacing.js` is the user's TODO(human); leave it for them.
