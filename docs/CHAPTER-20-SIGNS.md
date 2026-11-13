# Chapter 20 — The Signs of the Hour (أشراط الساعة)

The last two chapters are not a story with people in it: they are the Quran's own pictures of the end. This
chapter holds the signs. The first half is the hadith of the eleven signs — the signs that come *before* the
Hour, seen on the ground, in the world people actually live in: religious knowledge taken away, earthquakes
increasing, time passing quickly, wealth so abundant that charity is refused, and people competing to build
higher and higher. The second half is the Hour itself, in the Quran's pictures: the sun wrapped up in
darkness, the stars falling dispersing, the mountains removed, and the sun rising from the West.

**Content rules kept throughout.** Nobody is depicted — not one person in these four scenes. There is no
crowd to show, no prophet to stand as light, no antagonist to put out. These chapters are made of sky,
earth, light and stillness. God is never depicted either, and that matters most here: these are exactly the
scenes where a maker would be tempted to show a throne, a face behind the clouds, or a light that stands for
the One giving the command. The sun in 81:1 is the sun. Where the Quran says God commands something, the
scene shows the thing happening to the world, not the One commanding it.

**What is Quran and what is tradition.** The two scenes of the minor signs rest on a hadith, not on the Quran
(al-Bukhari 7121, Sahih Muslim 2935), and the sun rising from the West rests on al-Bukhari 4635 and 7121;
both are named as tradition in the scene's `art`, so the reader can see at once which is which. The scenes of
the Hour itself are Quran throughout (81:1-3, 6:158, 89:6). No Quran text is typed into these files: every
verse comes from `src/data/ayahs.json` by word range.

**The sky does the work.** Every scene here is built on the `heavens` layer: a living sky that runs the hour
on each beat's own clock, and drives the scene's light and haze with it. The lamps go out as the dusk deepens
(`tod` 17.4 → 19.4); the folded sun is a noon sky that closes to black; the sunrise runs the wrong way across
the sky, from the west; the judgment chapter holds the night and then lets the last light go. Because the sky
drives the light, a night scene switches the sun off with `"sun": null` rather than dimming it.

**Verses.** 81:14, 89:6, 81:1-3 and 6:158, all on file in `src/data/ayahs.json` and shown in Arabic and in
Sahih International's English, verbatim.

## Parts

| Part | Scenes |
|---|---|
| The Minor Signs | 193–194 |
| The Major Signs | 195–196 |

## Scenes

### 193 · The Lamps Going Out · انطفاء الأنوار (`lamps`)
- **Ayah:** 81:14. **Node:** minor.
- **Beats.** (1) *Say:* Before the Hour comes, the signs appear one by one, and the Prophet ﷺ told of them: that religious knowledge would be taken away, that earthquakes would increase, and that time would pass quickly. (2) *Say:* The lamps of a town go out from one end to the other. Nobody blows them out. There is simply less and less light, until what is left is barely enough to walk by. (3) **Verse 81:14**, placed lower.
- **Sound:** city, voices → city, wind → wind, air. **Art:** The eleven signs are told by the Prophet ﷺ in the hadith of al-Bukhari 7121 (Sahih Muslim 2935): among them, religious knowledge is taken away and time passes quickly. This scene draws on that hadith, not on the Quran. Nothing of anyone's belief is shown: the small lights are the lamps of a town, and a town going dark is the sign's picture. The town and the lights are imagined.
- **Image prompt:** A low town of pale stone at dusk, its streets and windows filled with countless small warm lamps; then, one street at a time, the lamps going out, until only a few are left burning and the town stands in a blue dusk; ink-wash and parchment texture.

### 194 · The High Buildings · العمارات (`towers`)
- **Ayah:** 89:6. **Node:** minor.
- **Beats.** (1) *Say:* And the Prophet ﷺ said: wealth would become so abundant that a wealthy man would worry nobody would accept his charity, and people would compete with one another in constructing high buildings. (2) *Say:* So the towers go up. They rise out of the dust of the plain, higher than the hills, and then higher still, until the ground they stand on is a small dark space between their feet. (3) **Verse 89:6**, placed lower.
- **Sound:** city, work → work, city → wind, air. **Art:** Two of the eleven signs are told by the Prophet ﷺ in the hadith of al-Bukhari 7121 (Sahih Muslim 2935): wealth so abundant that a wealthy man worries nobody will accept his charity, and people competing with one another in constructing high buildings. The buildings and the town are imagined. No person is shown.
- **Image prompt:** A great plain under a wide sky with a new city rising on it: tall pale towers standing up out of the dust, more and more of them, higher and higher, until they crowd the sky and the plain below is lost between their feet; ink-wash and parchment texture.

### 195 · The Sun Folded · انطواء الشمس (`sunfolded`)
- **Ayah:** 81:1-3. **Node:** major.
- **Beats.** (1) *Say:* Then the Quran turns to the Hour itself, and speaks of it in pictures: when the sun is wrapped up in darkness, and when the stars fall, dispersing, and when the mountains are removed. (2) *Say:* The sun draws in on itself and goes out. Behind it the stars come up, one by one, and are blotted out as if they had never been lit. The far mountains lie down flat like cloth. (3) **Verse 81:1-3**, placed lower.
- **Sound:** wind, air → air → air, wind. **Art:** The Quran says the sun is wrapped up in darkness, the stars fall dispersing, and the mountains are removed (81:1-3). The sun here is the sun; nothing in the scene stands for God. The way the light folds is imagined.
- **Image prompt:** A pale desert under a great sky; the sun low and swollen, then folding inward and going dark like a pinched flame, while the stars behind it come up and are slowly blotted out, and the far mountains flatten like dropped cloth; ink-wash and parchment texture.

### 196 · The Sun Rises from the West · شروق الشمس من الغرب (`sunrise`)
- **Ayah:** 6:158. **Node:** major.
- **Beats.** (1) *Say:* The sign the community is said to await is this: that the sun will rise from the West. When the people see it, they will all believe, and it will be too late for anyone who did not believe before. (2) *Say:* So the light comes up along the horizon, and the empty land wakes under it. Nothing of the people is shown, because the sign is not about them. (3) **Verse 6:158**, placed lower.
- **Sound:** wind, air → wind, air → air. **Art:** That the sun will rise from the West is one of the eleven signs, told by the Prophet ﷺ in the hadith of al-Bukhari 4635 and 7121 (Sahih Muslim 2935). It is not in the Quran; the scene says so. The way the sunrise looks is imagined. The west is a direction, not a place shown here. Nobody is shown.
- **Image prompt:** A wide empty plain under a night sky; along one horizon a band of pale gold appears low and brightens, until a sunrise comes up in the wrong direction and the whole empty land is lit by it; ink-wash and parchment texture.
