# Amanah — The Story of the Trust

An illustrated campaign that tells the story of creation and humanity in Islam, from the first light
to the Last Day. Painterly ink-and-gold scenes (Troy × Three Kingdoms), short narration on parchment,
every ayah in Uthmani Arabic with Sahih International, and a campaign map as the main navigation.

**Built so far:** Chapter 1, *The Beginning*: 18 scenes in two parts (From Light to the Garden ·
Adam's Family on Earth). Chapter 2, *Prophet Idris and the Generations Before Nuh*: scenes 19–26 in two
parts (Shith and Idris · The Generations Before Nuh). Chapter 3, *Prophet Nuh and the Great Flood*: scenes
27–38 in two parts (The Call · The Ark and the Flood). Chapter 4, *Prophet Hud*: scenes 39–48 in two parts
(The Pride of ʿAd · The Wind), the first chapter rendered in WebGL. The map holds all 33 events in order, and
chapters 5–21 (the prophets from Salih to Isa, the Final Messenger ﷺ, the Signs of the Hour, the Day of
Judgment) are planned: each has a `chapter.json` naming its map events, and their nodes show "In
preparation" with the chapter that will tell them.

**Making the next chapter:** `CLAUDE.md` holds the rules and conventions, and the `chapter` skill in
`.claude/skills/chapter/` is the workflow from a pasted brief to published scenes.

## Run

```bash
npm install
npm run dev
```

Opens on <http://localhost:5210>. The `amanah` entry in `LocalChat/.claude/launch.json` starts the same server.

| Script | What it does |
| --- | --- |
| `npm run ayahs` | Fetches every cited ayah (Uthmani + Sahih International) into `src/data/ayahs.json`. Cached; only new refs are fetched. |
| `npm run words -- 11:58 69:6-8` | Prints each ayah's Arabic words with their indexes and its Sahih English (fetching any that are missing), for writing `ar` ranges and verbatim captions. |
| `npm run scene -- 5 49 id "Title" [--gl]` | Scaffolds a scene file in its chapter from a 2D or WebGL template; `npm run check` flags any TODO left. |
| `npm run check` | Validates the story: every caption's English is a verbatim Sahih excerpt (`…` marks gaps), every Arabic word range exists, Arabic titles never quote the Quran, nodes, layer types and sound names exist, narration is 2–4 sentences. |
| `npm run prompts` | Writes `docs/IMAGE-PROMPTS.md` from the scenes (shared style + content rules added). |
| `npm run build` | Production build into `dist/`. |
| `npm run publish` | Builds, writes the single-page `deploy/index.html` and prints the artifact's files map. |

## Where things live

```
src/story/timeline.json        map skeleton: eras + 33 events (from timelinev1.netlify.app, oldest first)
src/story/chapters/c<n>/*.json chapter.json + one file per scene (auto-discovered, no code changes); a planned
                               chapter is a chapter.json alone: number, title, arabic, `nodes`, `parts`
src/data/ayahs.json            verified Quran text (generated)
src/layers/                    the art vocabulary (sky, land, life in the valley, towns, townsfolk, crafts, beings, fx,
                               canvas, flood, creatures, iram); every painter also works as a WebGL card
src/gl/                        the WebGL stage: cards, people of light, crowds, particles, cloth, storm, camera, ink-wash
src/components/                ScenePlayer, Stage (camera), Captions, Chronicle, CampaignMap, Title, Sheet (contact sheet)
src/lib/                       story loader, store (progress), audio (synthesized ambience), pacing
docs/INTERACTION.md            interaction spec: story arcs, state machines, microinteractions
docs/IMAGE-PROMPTS.md          one image prompt per scene + the map
```

## Writing a scene

A scene is data. Copy a file in `src/story/chapters/c1/`, change its `id`, `order` and `node`, run
`npm run ayahs` if you cite new verses, then `npm run check`.

| Field | Meaning |
| --- | --- |
| `node` | Map event it belongs to. A node with scenes becomes playable on the map. |
| `source` | `quran`, `tradition` or `mixed`; shown as a badge. |
| `notes` / `art` | Details from hadith or tradition / artistic choices; listed under "sources" in the chronicle. |
| `ayahs` | Refs shown in full under "The full ayat" (`"5:27-28"` ranges work). |
| `focus` | Depth of the subjects, so camera values frame that plane exactly. |
| `dissolve` | How long layers take to come and go, in ms (default 1400); a layer's own `fade` overrides it. |
| `captions` | `"parchment"` for bright scenes, so verses sit on parchment instead of over the sky. |
| `then` | `"map"` ends a part with the map arrival ceremony (path draws, next node lights). |
| `beats[]` | Moments. `dur` ms, `cam {x,y,z,r,dur,ease,cut}`, `say` (one narration sentence), `verse`, `ambient`, `sfx`. |
| `verse` | `{ ref, ar: [from, to], en, who, style, place, showAr }`. Arabic is chosen by word index, never typed; `en` must be a verbatim excerpt. `place: "lower"` sets it on parchment in the lower third: beside the chronicle on wide screens, just above it on tablets, at the top on phones (where the chronicle fills the lower third). Frame the subject in the upper half of those beats. |
| `layers[]` | `{ type, depth, show: [from, to), ...props, at: { "<beat>": { ...changes } } }`; `show` can also be a list of ranges for a layer that keeps coming back (day and night intercut); `sat`/`bright`/`blur` animate a colour drain; `sweep` (ms) paints the layer in left to right when it appears. |

Layer types: `sky stars sun rays mist clouds thread nebula heavens radiance tint image earth ridge
range peak water ground hillpath shelter garden tree mound altar dwelling plots villagers haze town lane room
stalls statues terrace doorway pillars throng deeds journeys followers refusal scribbles blooms ark flood
springs waves oven animals figure crowd angels flame cities clay crow eyes calligraphy orbit wisp trail beam
lightning inkdrop scroll guidance pen garment constellations woodwork particles flock globe dunes column iram
monument floor facade platform brazier pool palms terraces riverbed cloudbank sandwall trunks cliffs works block
jeers numerals`, and in WebGL scenes also `light crowd dust ribbons cloth storm sun set`.

A few that carry a whole sequence: `shelter` paints itself in stroke by stroke from `delay` ms (a village
rises one home at a time), with `kindle` holding back its fire; `plots` are tilled fields brushed in at
their `beat` and dressed by `season`; `villagers` is the family at work seen from afar, or gathered round
`fires` with `mode: "gather"`; `tree` with `kind: "living"` turns through `season` (snow, bud, blossom,
green, gold); `ground` with `tilt` becomes a hillside; `figure` with `act: "hoe"` works the soil.

Chapter 2 adds the built world. `town` grows by `grade` (`hut`, `village`, `town`, `city`), can be ringed
by a `wall` with a gate, greys with `grey` and lights its windows at `night`; `ground`, `garden`, `range`
and `ridge` take `x0`/`x1` so one wide panorama can hold several lands. `lane` is one pair of street walls
at its depth (stack several for a street; `end: true` closes it with a lit door). `throng` is townspeople
seen from afar: walkers, `listeners` and flickering `mockers` around a `focus`, `mode: "mourn"` or
`"kneel"`, a `dim` that spares the steady white `faithful`, groups round `fires`. `deeds` are five lights
doing good that rise and fade as `gone` counts up; `statues` are carved, given `lamps` and `offerings`
and cast a lengthening `shadow`; `pen`, `garment` and `constellations` are the craft sequence;
`guidance` drifts letters from a scroll onto listeners and `journeys` walks lights along paths. `clouds`
can `part` (after `partDelay` ms) and close again; `beam` takes a `top` for cameras that tilt up the column.

Chapter 3 adds the flood. `ark` is built in stages (`built` 1 ribs, 2 planks, 3 pitched with its house),
lowers its `ramp` toward the viewer (`"lower"` shows it coming down), draws as a `sketch` (the plan in the
sky) or as the `view: "deck"` you stand on. `flood` moves its surface to `level` over `dur` ms, covering
whatever is drawn beneath it, stills to a mirror with `calm`, and carries an `ark` {x, floor, s} that floats
on it and settles on `floor` (the ground, or a mountaintop) when the water falls below. `waves` are rows of
ink-wash crests, and `surge` raises one that fills the frame; `springs` burst from cracks; `oven` is the
clay oven that wells over. `animals` walk `pairs` along paths (lion, camel, horse, deer, sheep, birds in
flight, and `light` for believers), fading in or out at a door. `followers` gathers the few who believed
one at a time as `count` rises; `refusal` is the close-up of people stopping their ears as the call breaks
against them; `scribbles` are mockery blowing away; `blooms` paint flowers along a walk; `terrace` is the
chiefs' marble terrace seen from `behind` them or from `below`; `doorway` shuts on a lamplit household;
`pillars` is a land of sand and stone columns with a distant city; `hillpath` stirs its grass as someone walks
it; `woodwork` is hands shaping timber. `figure` walks a `path` of [x, y, scale] points (shrinking as it goes
away), moves an `arm` (`raise`, `reach`, `down`), kneels lower (`kneelLow`) and can be `unsteady`;
`calligraphy` can `drip` like wax (proud words) or `waver` (a voice turning away); `town` can fall to `ruin`;
`statues` take a `color` and `weather`; `throng` takes a `pace` for a time-lapse.

Chapter 4 adds the land of ʿAd (`src/layers/iram.jsx`). `dunes` are bands of blade-crested dunes with violet
slip faces; `column` is one great column (`broken`, `shadow`); `iram` is the city of columns and stepped
palaces (`red` at sunset, `avenue` leaves a gap). `monument` (tower, obelisk, arch on a hill), `works` (a
tower half built with its ramp) and `block` (a great stone with `ropes`) are the builders; `floor` is
polished or paved stone in perspective (`reflect`, `shadows`); `facade` is a wall with `doors`, an open
`gate` and `towers`; `platform` is broad steps to a dais with `thrones`; `brazier`, `pool` (`water`,
`dry`), `palms` and `terraces` (both `wither`) and `riverbed` show the gardens and the drought;
`cloudbank` and `sandwall` are the cloud and the storm; `trunks` are fallen hollow palm trunks; `cliffs`
are red rock with carved homes. `jeers` swirl jagged strokes round a `center` without touching it;
`numerals` count days and nights; `calligraphy` writes word by word with `pen`, or is cut in stone with
`carve`, `crack` and `recede`.

To look at one moment while writing, open `#/scene/<id>?beat=<n>`: the scene starts there, camera in place.
Add `&still` to hold the end of that beat for review, and `&t=0.4` to hold a WebGL scene's walks, moves and
reveals part way. `#/sheet/<chapter>` lays out every beat of a chapter, desk and phone, with the caption
panels' zones.

## WebGL scenes

`"renderer": "gl"` stands every layer in a true 3D space as a painted card at its `depth`, so the camera
can move through it with real perspective. An ink-wash pass (paper grain, ink bleed, pooling, vignette,
heat haze), bloom and god-rays finish every frame. Cameras glide along splines with eased acceleration and
a faint handheld drift, and `focus` racks the depth of field. `"pen": true` writes the verse panel's Arabic
word by word with ink that thins as it settles, and fades the English in word by word.

| Field | Meaning |
| --- | --- |
| `world` | `fog`, `fogNear`, `fogFar`, `light`, `rays`, `bloom`, `haze`/`hazeY`, `shake`, `dof`, `cycle` {period, min}; beats override it with their own `world`. |
| `cam` | `pos` and `look` [x, y, z] (design x, y; world z, 1000 is the reference camera), `path`, `ease`, `focus`, `dur`, `cut`, and `dx`/`dz` to frame a montage `set`. |
| card options | `reveal` {dir, dur, delay} paints a card in with brush strokes, `move` slides it, `fog` (0 for skies), `light`, `sat`, `tint`, `area`, `ppu`; changing its art in `at` crossfades it. |
| `light` | A person of light with a breathing core, halo and outer glow; `path` [x, y, z] walks in 3D, `pose`, `w`, `bright`, `solid`, `kind: "flame"`. |
| `crowd` | Thousands of people of light (`flow`, `mill`, `out`), or `kind: "army"` marching with shields glinting; `ground` lays them out in world units. |
| `dust`, `ribbons`, `storm`, `cloth`, `sun` | Particles on a noise field (`blend: "normal"` for smoke), sand off crests, wind as ink strokes, hanging cloth and banners (`pole`, `tear`), the light source of the god-rays. |
| `set` | One shot of a montage: its `layers` composed as if from the reference camera, stood `dx`/`dz` along the flight, sharing a `show`. |

Phones and small GPUs get a lighter version (fewer particles, no god-rays, lower resolution), reduced motion
holds the camera still, and each scene shows once its opening beat is painted while the rest paint behind it.

**Replacing placeholder art:** the procedural layers are placeholders. Put a generated painting in
`public/art/` and add `{ "type": "image", "src": "/art/heavens-sky.webp", "depth": 0.1 }` beneath (or instead
of) the procedural layers; parallax and camera moves keep working.

## Content rules (enforced in code and data)

- Allah is never depicted. Divine speech appears only as gold light and calligraphy; the court of heaven has no figure at its centre.
- Prophets, Adam and Hawwa appear only as soft figures of light seen from afar or behind: no faces, no detail.
- Angels are columns of light; jinn are smokeless fire; Iblis is a shadowed flame with a smouldering rim, never a cartoon devil.
- Every verse cites surah:ayah, the Arabic is exact Uthmani text, and the full ayah is one tap away.
- Hadith or tradition details are labelled per scene; scenes based on tradition say so on screen.
- No violence is shown (the first murder is a single drop of ink; a people's end is their lights going out). Sound is synthesized wind, fire and water: no music.
