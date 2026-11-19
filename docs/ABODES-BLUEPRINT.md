# The Two Abodes: blueprint (rough work, 18 Nov 2026)

A second monument for Amanah: Paradise as a pyramid of **seven gardens** rising to al-Firdaus, with the Throne
above it, and the Fire as an inverted pyramid of **seven levels** narrowing to its lowest depth. The two meet at
the waist, where the bridge is laid over the Fire. Each level shows **what the Quran names as leading there**,
in the words of the verses that name that level.

Status: blueprint only. Nothing is built. It will be built after the current batches (A, B, C) are applied.

**Owner's decisions (18 Nov 2026):**
- "for now focus on 7 levels for both heaven and hell, and what leads a worshipper to go to those levels". This
  replaces the 100-grades choice made earlier the same day.
- "show the punishment too": each Fire level also shows what the Quran says of it, as verse text only (§4.2).
  Each garden shows the same for symmetry.
- "shelf [the 100 grades] for now": §8 is shelved, not planned.
- "start building".

## 1. The shape

```
                 ( ═══ )            the Throne: a canopy of light, a creation (labelled)
                   /\
                  /1 \              1 al-Firdaus            (highest)
                 / 2  \             2 Jannat ʿAdn
                /  3   \            3 Jannat an-Naʿim
               /   4    \           4 Jannat al-Maʾwa
              /    5     \          5 Dar as-Salam
             /     6      \         6 Dar al-Muqamah
            /      7       \        7 Jannat al-Khuld      (widest)
    ════════════════════════════    the bridge laid over the Fire  ·  the wall with a door
             \     1      /         1 Jahannam
              \    2     /          2 Laza
               \   3    /           3 al-Hutamah
                \  4   /            4 as-Saʿir
                 \ 5  /             5 Saqar
                  \6 /              6 al-Jahim
                   \7/              7 al-Hawiyah            (the lowest depth, 4:145)
```

Paradise is drawn larger than the Fire: "a garden as wide as the heavens and earth" (3:133, 57:21). The page
opens on the Throne and Paradise and ends there too.

## 2. What is from the sources and what is from tradition

Every one of the fourteen names is in the Quran. **Arranging them as seven floors, in this order, is a
well-known later tradition, not a ranking the Quran or sahih hadith give.** The one exception is al-Firdaus as
the highest, which is sahih (Bukhari 7423, also 2790). So:

- The page carries one quiet line: "The names are from the Quran. Their order as levels is from later scholars."
  The order is a tradition note (`art` style), shown once, not on every card.
- **The popular list of "which religion goes to which level of the Fire" is not used, at all.** It has no
  basis in the Quran or sahih hadith, and it breaks the app's rule never to predict anyone's afterlife.
  Each level shows only the deeds named in the verses that name it.
- **Dar al-Khuld** is avoided as a garden's name, because 41:28 uses "the home of eternity" for the Fire.
  The seventh garden is **Jannat al-Khuld**, "the Garden of Eternity" (25:15).
- **The punishment is shown in the Quran's own words, never in pictures.** Each level's card has "What the Quran
  says of it" (for example 70:15-16, 74:26-30, 104:4-9), in our plain line plus the verse from `ayahs.json`. The
  drawing stays dark stone: no figures, no shaped flames, nothing suffering.

## 3. The fourteen levels and what leads there

All verses below were checked against the Sahih International text (api.alquran.cloud, 18 Nov 2026). The
"line" is our plain wording; the verse itself is always shown from `ayahs.json`, never typed in.

### Paradise, from the top

| # | Level | The verse that names it | What the Quran names as leading there |
|---|---|---|---|
| 1 | **Al-Firdaus**, the highest | 23:11, 18:107 | Humble in prayer, turning from idle talk, paying zakah, chaste, keeping trusts and promises, guarding the prayers (23:1-10). The Prophet ﷺ told us to ask God for al-Firdaus (Bukhari 7423) |
| 2 | **Jannat ʿAdn**, Gardens of perpetual residence | 13:23 | Keeping God's covenant, joining what He ordered joined, patience for His sake, prayer, giving in secret and in public, answering evil with good (13:20-22) |
| 3 | **Jannat an-Naʿim**, Gardens of Pleasure | 10:9, 31:8 | Belief and righteous deeds. There, their call is God's praise and their greeting is peace (10:9-10) |
| 4 | **Jannat al-Maʾwa**, Gardens of Refuge | 32:19, 79:41 | Fearing the standing before one's Lord, and holding the soul back from its desires (79:40) |
| 5 | **Dar as-Salam**, the Home of Peace | 10:25, 6:127 | Doing good, with excellence. God Himself invites to it (10:25-26) |
| 6 | **Dar al-Muqamah**, the home of duration | 35:35 | Reciting God's Book, praying, giving in secret and in public (35:29). Among those who enter are some who wronged themselves, by His bounty (35:32-35) |
| 7 | **Jannat al-Khuld**, the Garden of Eternity | 25:15 | Promised to the righteous, those mindful of God (25:15-16) |

Under the Paradise side, always: **"Deeds are the way, but it is God's mercy that admits anyone."** The source
is Bukhari 6463 / Muslim 2816, added to `hadith.json` as `bukhari-6463` (checked 18 Nov 2026, draft until a
scholar reviews it). The Firdaus line and the Throne use `bukhari-7423` (also 2790), whose wording states "above
it is the Throne of the Most Merciful" without the sub-narrator's doubt found in 2790.

### The Fire, from the top

| # | Level | The verse that names it | What the Quran names as leading there |
|---|---|---|---|
| 1 | **Jahannam**, the Fire's general name | 40:60, 16:29 | Being too proud to worship God, who says "Call upon Me; I will respond to you" (40:60). Arrogance (16:29) |
| 2 | **Laza**, the Flame | 70:15 | Turning away from the truth, gathering wealth and hoarding it (70:17-18) |
| 3 | **Al-Hutamah**, the Crusher | 104:4 | Scorning and mocking others, counting wealth as if it would make one immortal (104:1-3) |
| 4 | **As-Saʿir**, the Blaze | 4:10, 67:10 | Devouring orphans' property unjustly (4:10). Refusing to listen or to reason (67:10) |
| 5 | **Saqar** | 74:26, 74:42 | Not praying, not feeding the poor, joining in vain talk, denying the Day (74:43-46) |
| 6 | **Al-Jahim**, Hellfire | 79:39 | Transgressing, and preferring the life of this world (79:37-38) |
| 7 | **Al-Hawiyah**, the abyss, the lowest | 101:9, 4:145 | Scales light with good (101:8). The Quran names the hypocrites in the lowest depths (4:145) |

### What the Quran says of each level (added 18 Nov 2026, "show the punishment too")

Shown on every card under "What the Quran says of it", as a plain line plus the verse. On the Fire side the
picture never shows it: only the words do.

| Level | Says | Level | Says |
|---|---|---|---|
| Al-Firdaus | They inherit it and stay for ever, never wishing to move (23:10-11, 18:107-108) | Jahannam | It has seven gates, each with its share (15:43-44): the basis for seven levels |
| ʿAdn | They enter with the righteous of their families, and angels come in from every gate with peace (13:23-24) | Laza | A flame that strips away the skin (70:15-16) |
| An-Naʿim | Rivers flow beneath them; their call is God's praise, their greeting peace (10:9-10) | Al-Hutamah | God's fire, kept burning, rising over the hearts, closed over them in long columns (104:5-9) |
| Al-Maʾwa | A place of welcome, given for what they used to do (32:19) | As-Saʿir | There they admit their sin, and are kept far away (67:11) |
| Dar as-Salam | With their Lord, and He is their protecting friend (6:127) | Saqar | It spares nothing and leaves nothing; nineteen angels are over it (74:27-30) |
| Dar al-Muqamah | No sorrow, no fatigue, no weariness; its people praise God (35:33-35) | Al-Jahim | Its welcome is scalding water and the burning of Hellfire (56:92-94) |
| Al-Khuld | Whatever they wish is theirs, for ever (25:16) | Al-Hawiyah | An abyss, and a fire burning intensely hot (101:9-11) |

**Every Fire card ends with the way back,** shown as part of the card, not hidden behind a tap:
- for levels 1-6: "Do not despair of God's mercy" (39:53), and "except those who repent" (25:70);
- for level 7: the very next verse, "except for those who repent, correct themselves… sincere" (4:146).

## 4. Hard rules for this page (on top of CLAUDE.md's content rules)

1. **Never place the reader, or anyone, on a level.**
   - No quiz, meter, score, checklist or Pyramid of Righteousness result ever leads here or links to a level.
   - No "which level are you", and no "you will".
   - The deeds are what the verses say, not a test to take.
2. **No one is drawn in either abode.**
   - The Fire is cold, near-black courses with faint seams (no glow and no red), with no figures, no shaped flames and no sound of
     voices. What it is like is told only by the verses, as text.
   - Paradise is gold courses of light.
3. **God is never depicted.** The Throne is a wide canopy, never a point or a sun. It always carries the label
   "The Throne, which God created", and under it: "God is not shown and cannot be pictured (42:11)."
4. **Mercy is first and last.**
   - The page opens with 7:156, "My mercy encompasses all things" (on file).
   - The camera starts at the Throne.
   - Every Fire card carries the way back (§3).
   - The last button returns to the top.
5. Every claim on screen is a verse by ref from `ayahs.json`, or a sahih hadith by id from `hadith.json`. The
   order of the levels carries the tradition note (§2).
6. Little text: under about 80 words before any tap. Use "God" in the text; `inMode` shows Allah in the Muslim
   view. Arabic is one tap away on every verse.

## 5. The screen and the interaction

- Route `#/abodes`, a lazy page in `Shell`, at night. The style matches the pyramid page (`Monument.jsx`):
  gilded courses, round seals, and a `focus` zoom that animates the viewBox. The shape is a diamond on a night sky.
- **First view:**
  - the Throne's canopy, then the seven gardens in warm gold;
  - the waist as a thin bright line;
  - the seven levels below in cold, near-black stone, with no glow and no red.
  - Title: "The two abodes". The line under it: "What the Quran says about Paradise and the Fire, and what
    leads there."
- **Tap a level:** it zooms in (`focus`) and a `Brief` opens with:
  - the name, in Arabic transliteration and in the Sahih English;
  - the verse that names it;
  - "What leads there": the plain line, then the verse in full, with Arabic one tap away;
  - "What the Quran says of it": the same, from §3's second table;
  - on the Fire side, the way back (§3).
  - Escape or Close zooms back out. Next and Previous move one level up or down.
- **On the waist:** the bridge (Bukhari 806, 19:71), the wall with a door (57:13) and the heights (7:46), as
  three small seals.
- **Ways in** (no new item in the four-item menu):
  - after chapter 21's last scene (The Day of Judgment), offered as "The two abodes";
  - from the map's last stop (`judgment`);
  - from the About page's list of pages.
- **Reduced motion:** a cross-fade instead of the zoom.
- **Phones:** the diamond fills the height, and the brief rises from the bottom like the pyramid's.

## 6. Data (content as data, like `units.json`)

`src/pyramid/abodes.json`, one entry per level (two shown):

```json
{
  "opening": { "ref": "7:156" },
  "orderNote": "The names are from the Quran. Their order as levels is from later scholars.",
  "throne": { "title": "The Throne", "line": "Above the highest garden is the Throne, which God created.",
              "refs": ["69:17", "39:75"], "note": { "ref": "42:11", "line": "God is not shown and cannot be pictured." } },
  "paradise": {
    "mercy": { "line": "Deeds are the way, but it is God's mercy that admits anyone.", "hadith": ["bukhari-6463"] },
    "levels": [
      { "id": "firdaus", "rank": 1, "name": "Al-Firdaus", "en": "The highest garden", "named": ["23:11", "18:107"],
        "leads": { "line": "Humble in prayer, turning from idle talk, paying zakah, chaste, keeping trusts and promises, guarding the prayers.",
                   "refs": ["23:1-9"], "hadith": ["bukhari-7423"] } }
    ]
  },
  "between": [
    { "id": "bridge", "title": "The bridge", "refs": ["19:71"], "hadith": ["bukhari-806"] },
    { "id": "wall", "title": "The wall with a door", "refs": ["57:13"] },
    { "id": "heights", "title": "The heights", "refs": ["7:46"] }
  ],
  "fire": {
    "levels": [
      { "id": "saqar", "rank": 5, "name": "Saqar", "named": ["74:26", "74:42"],
        "leads": { "line": "Not praying, not feeding the poor, joining in vain talk, denying the Day.", "refs": ["74:43-46"] },
        "wayBack": { "refs": ["39:53", "25:70"] } }
    ]
  }
}
```

`npm run check` gains an `abodes` pass. It checks that:
- there are exactly seven levels a side, ranks 1-7;
- every ref is in `ayahs.json`;
- every hadith id is in `hadith.json` with a sahih grade;
- every level has `leads` and `says`, and every Fire level has a `wayBack`;
- no verse is shown twice on one card;
- the banned words are absent: test, exam, score, "you will", "your level", "your place".

## 7. Files to build

| File | What |
|---|---|
| `src/pyramid/abodes.json` | The fourteen levels, the waist, the Throne, and the notes |
| `src/components/Abodes.jsx` | The page (lazy): `Shell`, the title, the monument, the `Brief` with Next/Previous, and the end buttons |
| `src/components/AbodesMonument.jsx` | The SVG diamond: the canopy, seven gold courses, the waist, seven dark courses, and the `focus` zoom (reuse `Monument.jsx`'s helpers) |
| `src/lib/router.js` | The `abodes` route |
| ScenePlayer / the chapter 21 end, `CampaignMap.jsx`, `About.jsx` | The three ways in |
| `src/data/ayahs.json` | Done 2026-11-18 (606 ayat identical to the API). Fetched with `npm run words`, checked with `node scripts/verify-ayahs.mjs`: 23:3-11, 18:107-108, 13:20-24, 10:9-10, 31:8, 79:37-41, 32:19, 10:25-26, 6:127, 35:29-35, 25:15-16, 40:60, 16:29, 70:15, 70:17-18, 104:1-4, 4:10, 67:10, 74:26, 74:42-47, 101:8, 4:145-146, 39:53, 25:70, 3:133, 69:17, 39:75, 19:71, 57:13, 7:46 |
| `src/data/hadith.json` | Done 2026-11-18: Bukhari 7423 (ask for al-Firdaus; also 2790), Bukhari 6463 (mercy admits) and Bukhari 806 (the bridge). Check each against sunnah.com, fill in `checked`, and set `status: "draft"` until a scholar reviews them |
| `tests/` | A unit test (the data rules above), an e2e test (open, tap a level, Next, Escape, back to the top) and an axe scan |

## 8. Shelved for now: 100 grades

Shelved by the owner on 18 Nov 2026 ("shelf no 5 for now"). Kept here only so it isn't lost.

Bukhari 2790 says Paradise has one hundred grades, with al-Firdaus the highest and the Throne above it. Paradise
also has eight gates (Bukhari 3257). If the owner later prefers the strictly sahih picture, the Paradise half
becomes 100 fine courses with five seals:
- al-Firdaus;
- the high rooms "like a distant star" (Bukhari 3256);
- the rivers (47:15);
- the gate of ar-Rayyan (Bukhari 3257);
- the last to enter (Bukhari 6571).

The seven names then become seals on those courses instead of floors. The data model above supports both: switch
`paradise.levels` for `paradise.grades: 100` plus `seals`.
