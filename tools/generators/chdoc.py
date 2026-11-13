import json, glob, re
import os; R=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..')) + '/'
import sys
N=sys.argv[1] if len(sys.argv)>1 else '9'
# Windows' default encoding is cp1252, which cannot hold the Arabic titles: always read and write UTF-8.
ch=json.load(open(R+f'src/story/chapters/c{N}/chapter.json', encoding='utf-8'))
sc=sorted((json.load(open(f, encoding='utf-8')) for f in glob.glob(R+f'src/story/chapters/c{N}/s*.json')), key=lambda s: s['order'])
INTRO={'9': ["# Chapter 9 — Yaqub and Yusuf (يعقوب ويوسف)", "",
"The house of Yaqub in Canaan and the story the Quran calls the best of stories: Yusuf's dream of eleven",
"stars, the well, the caravan, the house of the Aziz, the torn shirt, the prison, the king's dream and the",
"storehouses, the brothers in Egypt, Yaqub's patient grief, and the dream fulfilled when the family is",
"reunited.", "",
"**Content rules kept throughout.** God is never depicted. The prophets (Yaqub, Yusuf) appear only as",
"steady lights; the brothers, the wife of the Aziz, the king and the people as dim figures of light; no",
"faces. The temptation is told in narration only (a run to the door); nothing of the well, the prison or",
"the grief is shown as suffering. The dream's stars, sun and moon only dip toward Yusuf's light. Imagined",
"and commentary details are labelled in each scene's `art`. No music.", "",
"**Scale.** Everything stands at true size: a person of 1.7 m is 255 × depth design units tall (a 1 m",
"brazier, a 1.8 m well curb, a 2 m camel's hump, a 2.6 m tent), and each scene's people and props are",
"brought nearer the camera together so they read clearly.", "",
"**Verses.** Every verse beat waits as `pendingVerse` (placed sky) until api.alquran.cloud can be reached;",
"12:18, 12:23, 12:76 and 12:100 are parts of ayat whose words are chosen by hand once fetched.", ""],
'10': ["# Chapter 10 — Ayyub and Shu'ayb (أيوب وشعيب)", "",
"Two prophets of patience and of honesty. Ayyub, blessed with land, herds and children, loses everything",
"and suffers long illness, yet never stops praising God; at God's word he strikes the ground, a spring",
"wells up to heal him, and his family is given back to him with as many again. Shu'ayb is sent to Madyan,",
"a rich trading town whose merchants give short measure and rob the roads; they mock him and threaten to",
"drive him out, and on the day of the black cloud their lights go out.", "",
"**Content rules kept throughout.** God is never depicted. The prophets appear only as steady lights;",
"Ayyub's wife and children, Madyan's people and the believers as dim or small white lights; no faces.",
"Ayyub's illness is never shown (his light only dims); the losses and the punishment are lights going",
"out, nothing more. Mockery is jagged strokes. Commentary details are labelled in `art`. No music.", "",
"**Scale.** Built at true size from the start: the people and props stand on a subject plane at depth",
"0.42, where a grown man is about 107 design units, a sheep 38, a cow 63 and the merchant's balance 95.", "",
"**Verses.** Every verse beat waits as `pendingVerse` (placed sky) until api.alquran.cloud can be reached;",
"4:163, 11:84, 11:88 and 38:44 are parts of ayat whose words are chosen by hand once fetched.", ""]}
INTRO['11'] = ["# Chapter 11 — Musa: The Nile to the Mountain (موسى من النيل إلى الطور)", "",
"Pharaoh's Egypt and the boy he could not stop: Musa's mother sets him on the Nile in a basket, Pharaoh's",
"wife takes him in, and God returns him to his mother to nurse. Grown, he strikes a man who dies, repents",
"and flees to Madyan, waters the flock of two sisters, and serves their father ten years. On the way home",
"he sees a fire on the mountain, is called in the blessed valley, and is given the staff and the shining hand.", "",
"**Content rules kept throughout.** God is never depicted: the fire is only a fire on a tree as Musa saw it,",
"and the call is told in words. Musa appears only as a steady light; his mother, sister and Asiya as soft",
"lights; Pharaoh and his men as cold grey lights. Pharaoh's order against the boys and the man's death",
"are told, never shown (a light goes out). The serpent is drawn in ink. No music.", "",
"**Verses.** Every verse beat waits as `pendingVerse` (placed sky) until api.alquran.cloud can be reached.", ""]
INTRO['12'] = ["# Chapter 12 — Musa and Pharaoh (موسى وفرعون)", "",
"Musa and Harun before Pharaoh: the staff and the shining hand, the magicians on the day of the festival",
"and their belief, the signs over Egypt, the flight by night, the sea parting into walls like mountains,",
"Pharaoh's army taken by the closing sea, and the Children of Israel safe on the far shore.", "",
"**Content rules kept throughout.** God is never depicted. Musa and Harun appear only as steady lights;",
"Pharaoh, his chiefs, the magicians and the army as dim grey or violet lights; the Children of Israel as a",
"river of small warm lights. The signs fall on the land and the river, never on people; the drowning is",
"the sea closing and the army's lights going out. Mockery is jagged strokes. No music.", "",
"**Verses.** Every verse beat waits as `pendingVerse` (placed sky) until api.alquran.cloud can be reached.", ""]
INTRO['13'] = ["# Chapter 13 — Musa in the Wilderness (موسى في التيه)", "",
"After the sea: manna and quails under the shading clouds, twelve springs from the rock, Musa's forty nights",
"on the mountain and the mountain crumbling to dust, the tablets, the golden calf and Harun's warning, Musa's",
"return, the yellow cow, Musa's journey with the servant of God (the boat, the boy, the wall, and the hidden",
"reasons), and forty years of wandering.", "",
"**Content rules kept throughout.** God is never depicted, in any form or light: on the mountain only the",
"mountain is seen, crumbling. Musa and Harun appear only as steady lights; the servant of God (al-Khidr in the",
"hadith) as a soft green-white light; the Samiri as a cold light. The dead man, the cow's slaughter and the",
"boy are told in words, never shown. The tablets carry rows of strokes, never letters. No music.", "",
"**Verses.** Every verse beat waits as `pendingVerse` (placed sky) until api.alquran.cloud can be reached;",
"2:57, 2:60, 7:143 and 18:82 are parts of ayat whose words are chosen by hand once fetched.", ""]
INTRO['14'] = ["# Chapter 14 — Dawud and Sulayman (داود وسليمان)", "",
"Dhul-Kifl, who kept his word; Talut's army tested at the river; young Dawud bringing down Jalut; the",
"mountains and birds joining Dawud's praise; iron made soft in his hands; Sulayman's wiser judgment of the",
"trampled vineyard; his kingdom of men, jinn and birds; the ant's warning; the hoopoe's news of Saba; the",
"queen on the floor of glass; and Sulayman's death, leaning on his staff, unknown to the jinn.", "",
"**Content rules kept throughout.** God is never depicted. The prophets appear only as steady lights;",
"Talut, Jalut, the armies, the queen and the people as dim lights; the jinn as smouldering shadows. Jalut's",
"fall and Sulayman's death are lights going out. Dawud's recitation is a wordless voice, never music.", "",
"**Verses.** 21:85 is shown in full. Every other verse beat waits as `pendingVerse` (placed sky) until",
"api.alquran.cloud can be reached; several are parts of ayat chosen by hand once fetched.", ""]
INTRO['15'] = ["# Chapter 15 — Ilyas, Al-Yasa' and Yunus (إلياس واليسع ويونس)", "",
"Ilyas calling his people away from the idol Ba'l; Al-Yasa' carrying on after him; and Yunus, who left his",
"city in anger, was cast into the stormy sea, prayed in the darkness of the whale, was healed under a gourd",
"vine, and returned to find a whole city of a hundred thousand believing.", "",
"**Content rules kept throughout.** God is never depicted. The prophets appear only as steady lights; the",
"people and sailors as dim lights. Ba'l is a faceless gilded idol. Yunus going into the sea is his light",
"slipping into the dark; the whale is drawn in ink. Mockery is jagged strokes. No music.", "",
"**Verses.** Every verse beat waits as `pendingVerse` (placed sky) until api.alquran.cloud can be reached.", ""]
INTRO['16'] = ["# Chapter 16 — Zakariya, Yahya and Maryam (زكريا ويحيى ومريم)", "",
"The family of Imran: a mother's vow and the birth of Maryam; Maryam in the temple with fruit out of season;",
"the old prophet Zakariya's secret prayer and the angels' good news of Yahya; Yahya's gentle, devoted youth;",
"the angel Jibril sent to Maryam; the stream and ripe dates beneath the palm; and the infant Isa speaking from",
"his mother's arms.", "",
"**Content rules kept throughout.** God is never depicted. The prophets (Zakariya, Yahya, Isa) appear only",
"as steady lights; Maryam and her mother as soft lights; the people as dim lights. Angels, Jibril among",
"them, are columns of light, never figures. Maryam's pain is never shown. Reproach is jagged strokes.", "",
"**Verses.** Every verse beat waits as `pendingVerse` (placed sky) until api.alquran.cloud can be reached.", ""]
INTRO['17'] = ["# Chapter 17 — Isa (عيسى)", "",
"The signs of Isa, each by God's permission: birds shaped from clay that fly, the blind and the leper healed,",
"the dead brought back to life; the disciples by the lake; the table sent down from heaven; his good news of",
"a messenger to come named Ahmad; and the plot against him, foiled as God raised him up to Himself.", "",
"**Content rules kept throughout.** God is never depicted. Isa appears only as a steady light; the disciples",
"and people as soft or dim lights. As the Quran tells (4:157–158), he was neither killed nor crucified:",
"nothing of a crucifixion appears; his light only rises into the night. The final messenger is spoken of,",
"never shown. No music.", "",
"**Verses.** Every verse beat waits as `pendingVerse` (placed sky) until api.alquran.cloud can be reached.", ""]
INTRO['18'] = ["# Chapter 18 — Stories of Wisdom (قصص وعبر)", "",
"Stories the Quran tells whose time is uncertain, or which stand outside the line of prophets: the young men",
"who slept for centuries in the cave and woke to a changed world; Dhul-Qarnayn, the just king who travelled",
"to the setting and the rising sun and built the wall of iron; the parable of the proud man's two gardens;",
"the man who slept a hundred years beside a ruined town; and Luqman's advice to his son.", "",
"**Content rules kept throughout.** God is never depicted. Everyone appears only as a light. Ya'juj and",
"Ma'juj are never shown, only the wall that holds them back. The man's death is his light going out; his",
"donkey is drawn back in, nothing more. Commentary details (the number of the sleepers, 'Uzayr) are labelled.", "",
"**Verses.** Every verse beat waits as `pendingVerse` (placed sky) until api.alquran.cloud can be reached.", ""]
INTRO['20'] = ["# Chapter 20 — The Signs of the Hour (أشراط الساعة)", "",
"The last two chapters are not a story with people in it: they are the Quran's own pictures of the end. This",
"chapter holds the signs. The first half is the hadith of the eleven signs — the signs that come *before* the",
"Hour, seen on the ground, in the world people actually live in: religious knowledge taken away, earthquakes",
"increasing, time passing quickly, wealth so abundant that charity is refused, and people competing to build",
"higher and higher. The second half is the Hour itself, in the Quran's pictures: the sun wrapped up in",
"darkness, the stars falling dispersing, the mountains removed, and the sun rising from the West.", "",
"**Content rules kept throughout.** Nobody is depicted — not one person in these four scenes. There is no",
"crowd to show, no prophet to stand as light, no antagonist to put out. These chapters are made of sky,",
"earth, light and stillness. God is never depicted either, and that matters most here: these are exactly the",
"scenes where a maker would be tempted to show a throne, a face behind the clouds, or a light that stands for",
"the One giving the command. The sun in 81:1 is the sun. Where the Quran says God commands something, the",
"scene shows the thing happening to the world, not the One commanding it.", "",
"**What is Quran and what is tradition.** The two scenes of the minor signs rest on a hadith, not on the Quran",
"(al-Bukhari 7121, Sahih Muslim 2935), and the sun rising from the West rests on al-Bukhari 4635 and 7121;",
"both are named as tradition in the scene's `art`, so the reader can see at once which is which. The scenes of",
"the Hour itself are Quran throughout (81:1-3, 6:158, 89:6). No Quran text is typed into these files: every",
"verse comes from `src/data/ayahs.json` by word range.", "",
"**The sky does the work.** Every scene here is built on the `heavens` layer: a living sky that runs the hour",
"on each beat's own clock, and drives the scene's light and haze with it. The lamps go out as the dusk deepens",
"(`tod` 17.4 → 19.4); the folded sun is a noon sky that closes to black; the sunrise runs the wrong way across",
"the sky, from the west; the judgment chapter holds the night and then lets the last light go. Because the sky",
"drives the light, a night scene switches the sun off with `\"sun\": null` rather than dimming it.", "",
"**Verses.** 81:14, 89:6, 81:1-3 and 6:158, all on file in `src/data/ayahs.json` and shown in Arabic and in",
"Sahih International's English, verbatim.", ""]
INTRO['21'] = ["# Chapter 21 — The Day of Judgment (يوم الدين)", "",
"The Hour itself, in the pictures the Quran uses for it: the earth levelled and pounded, the mountains fluffed",
"like wool, the people like scattered moths, the scales weighed so that an atom's weight of good or of evil",
"will be seen, the keepers who record, the soul at the collar bones, the wrongdoer's wish to be sent back, and",
"the command that is entirely with God.", "",
"**Content rules kept throughout.** Nothing of the Day is shown. The earth opens; the mountains lie down",
"like wool; the people are points of light drifting like moths; a light at the collar bones dims and goes out;",
"the scales are never drawn. Every life on the globe is a point of light, as the Quran says of the earth (5:32),",
"but what each life carried is not shown, because only God knows it. There is no suffering on screen and no",
"violence: the dying is a light going out, and the earth being crushed is the ground cracking.", "",
"**God is never depicted**, in any form or light, and never stood for. 82:19 says the command on that Day is",
"entirely with God; the scene shows the closed horizon and a small warm light standing at it, and nothing",
"more. No person appears in these seven scenes; there is no crowd, no prophet and no antagonist to put out.", "",
"**The sky does the work.** All seven scenes run on the `heavens` layer — a living sky that carries the hour",
"on each beat's clock and drives the light. The judgment scenes hold deep night (`sun: null`); the one dawn",
"scene (`moths`) lets the sun come up low on the left; `keepers` and `soul` sit at first light and at the end",
"of the day. Because the sky drives the scene's light, a night sky switches the sun off with `\"sun\": null`",
"rather than dimming it.", "",
"**Verses.** 89:21-22, 101:4-5, 99:7-8, 82:10-12, 75:13-14, 75:26-28 and 82:19, all on file in",
"`src/data/ayahs.json` and shown in Arabic and in Sahih International's English, verbatim. Several are parts",
"of a longer ayah, with the word range chosen by hand.", ""]
out=INTRO[N]+["## Parts", "", "| Part | Scenes |", "|---|---|"]
out+= [f"| {p['title']} | {p['from']}–{p['to']} |" for p in ch['parts']]
out+=["","## Scenes",""]
for s in sc:
    vb=[(i,b) for i,b in enumerate(s['beats']) if 'pendingVerse' in b or 'verse' in b]
    refs=', '.join((b.get('pendingVerse') or b.get('verse'))['ref'] for _,b in vb)
    out.append(f"### {s['order']} · {s['title']} · {s['arabic']} (`{s['id']}`)")
    out.append(f"- **Ayah:** {refs}. **Node:** {s['node']}.")
    beats=[]
    for i,b in enumerate(s['beats']):
        if 'say' in b: beats.append(f"({i+1}) *Say:* {b['say']}")
        v=b.get('pendingVerse') or b.get('verse')
        if v: beats.append(f"({i+1}) **Verse {v['ref']}**" + (f" ({v['part']})" if v.get('part') else '') + ", placed " + (v.get('place') or 'sky') + ".")
    out.append("- **Beats.** " + ' '.join(beats))
    out.append("- **Sound:** " + ' → '.join(', '.join(b.get('ambient', s['ambient'])) for b in s['beats']) + ". **Art:** " + ' '.join(s['art']))
    out.append("- **Image prompt:** " + s['imagePrompt'])
    out.append("")
open(R+{'9':'docs/CHAPTER-9-YAQUB-YUSUF.md','10':'docs/CHAPTER-10-AYYUB-SHUAYB.md','11':'docs/CHAPTER-11-MUSA-NILE.md','12':'docs/CHAPTER-12-MUSA-PHARAOH.md','13':'docs/CHAPTER-13-MUSA-WILDERNESS.md','14':'docs/CHAPTER-14-DAWUD-SULAYMAN.md','15':'docs/CHAPTER-15-ILYAS-YUNUS.md','16':'docs/CHAPTER-16-ZAKARIYA-MARYAM.md','17':'docs/CHAPTER-17-ISA.md','18':'docs/CHAPTER-18-WISDOM.md','20':'docs/CHAPTER-20-SIGNS.md','21':'docs/CHAPTER-21-JUDGMENT.md'}[N],'w',encoding='utf-8').write('\n'.join(out))
print('doc ok')
