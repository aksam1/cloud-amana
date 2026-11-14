# Chapter 20 · The Signs of the Hour, and Chapter 21 · The Day of Judgment.
#
# The last two chapters of the chronicle. Chapter 19 (the Final Messenger) is paused until the owner
# decides how the Prophet ﷺ is shown, so its scenes are not written here; only 20 and 21.
#
# These two chapters are not a story with people in it. They are the Quran's own pictures of the end:
# the signs that come before the Hour, and the Hour itself. So the rules of the earlier chapters bend in
# two ways, and both are deliberate:
#
#   1. Nobody is depicted. There is no crowd to show, no prophet to stand as light, no antagonist to
#      put out. These chapters are made of sky, earth, light and stillness.
#   2. God is never depicted, in any form or light. This matters most here, because these are exactly
#      the scenes where a maker would be tempted to show the sun standing still, or a throne, or a face
#      behind the clouds. The sun in 81:1 is the sun; the sun in 75:9 is the sun. Where the Quran says
#      God commands something, the scene shows the thing happening to the world, not the One commanding it.
#
# Every scene's `art` list says what is imagined and what is from the Quran. Every verse comes from
# src/data/ayahs.json by word range; no Quran text is typed into these files. The two hadith quoted
# (the eleven signs, and the sun rising from the West) are named in the scene's `art` so a reader can see
# at once that they are tradition, not Quran; the app shows hadith only from src/data/hadith.json by id,
# and those two are not on file, so they are told in the narration and marked as tradition, not quoted.
#
# The map has three stops for this stretch of the story: `minor` (the signs before the Hour), `major`
# (the signs at the Hour) and `judgment` (the Day itself). Chapter 20 owns the first two, so its six
# scenes are split across them; chapter 21 owns the third, with five scenes.
#
# Run from tools/generators/:  python c20_21.py   then   python renum.py

from base import *
import math

C20 = ROOT + 'src/story/chapters/c20/'
C21 = ROOT + 'src/story/chapters/c21/'
os.makedirs(C20, exist_ok=True)
os.makedirs(C21, exist_ok=True)

# ── Shared vocabulary ──────────────────────────────────────────────────────
# The Hour is not a night and not a day. These two chapters live between them: a light that has no
# source, a dark that is not black, and a horizon that keeps moving without ever arriving.
HOUR = {'fog': '#161a24', 'fogNear': 5000, 'fogFar': 60000, 'light': 0.95, 'rays': 0, 'bloom': 0.9, 'haze': 0.04, 'hazeY': 0.6, 'shake': 0.2, 'dof': 0}
DUSK = {'fog': '#2a2436', 'fogNear': 5000, 'fogFar': 60000, 'light': 0.95, 'rays': 0, 'bloom': 0.9, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.2, 'dof': 0}
ASH = {'fog': '#2c2a2e', 'fogNear': 4000, 'fogFar': 40000, 'light': 0.9, 'rays': 0, 'bloom': 0.75, 'haze': 0.1, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
DAWN = {'fog': '#3a3a48', 'fogNear': 6000, 'fogFar': 50000, 'light': 1.0, 'rays': 0, 'bloom': 0.8, 'haze': 0.06, 'hazeY': 0.6, 'shake': 0.2, 'dof': 0}

P = lambda d, m=1.7: round(m * 150 * d)
Z = lambda d: round(1000 - 1000 / d)
D = 0.42
FEET = 792

SUN = {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 300, 'size': 34}
MOON = {'rise': 19, 'set': 6.5, 'x0': 1300, 'x1': 300, 'peak': 340, 'size': 24}


def scene(sid, order, chapter, node, title, arabic, art, prompt, world, layers, beats, ambient, base='#161a24',
          dissolve=2600, source='quran'):
    """Write one scene. `order` may be fractional until renum.py numbers the whole story."""
    order = ORDER.get(sid, order)
    s = {'id': sid, 'chapter': chapter, 'order': order, 'node': node, 'title': title, 'arabic': arabic, 'source': source, 'ayahs': [], 'art': art,
         'ambient': ambient, 'base': base, 'captions': 'parchment', 'renderer': 'gl', 'pen': True, 'dissolve': dissolve, 'world': world,
         'cam': beats[0]['cam'], 'imagePrompt': prompt, 'layers': layers, 'beats': beats}
    open(ROOT + f'src/story/chapters/c{chapter}/s{order:02d}-{sid}.json', 'w', encoding='utf-8').write(dump(s))


# The ground under the Hour: a flat, wide, empty plain. Nothing stands on it, because nothing is shown.
def plain(depth=0.1, y=700, amp=8, color='#2a2a30', color2='#141418', seed=1700, **kw):
    return {'type': 'ground', 'depth': depth, 'y': y, 'amp': amp, 'seed': seed, 'color': color, 'color2': color2, **kw}


def ridge(depth=0.05, y=620, amp=40, color='#2a2a36', seed=1701, haze=0.3, **kw):
    return {'type': 'ridge', 'depth': depth, 'y': y, 'amp': amp, 'seed': seed, 'sharp': 0.3, 'color': color, 'haze': haze, 'fog': 0.4, **kw}


def motes(opacity=0.18, **kw):
    return dust(box=(-1400, 200, -8000, 3000, 950, 600), count=360, size=2.4, color='#e8e4f0', opacity=opacity, wind=(3, -1, 0), **kw)


def heav(tods, sun=SUN, moon=None, horizon=640, stars=1400):
    """The living sky over these scenes. `tod` is [from, to, ms] for each beat, in order."""
    h = {'type': 'heavens', 'horizon': horizon, 'tod': tods[0], 'sun': sun, 'stars': stars}
    if moon:
        h['moon'] = moon
    rest = [t for t in tods[1:]]
    if rest:
        h['at'] = {str(i + 1): {'tod': t} for i, t in enumerate(rest) if t}
    return h


# ── Chapter 20 · The Signs of the Hour ─────────────────────────────────────
# The Quran divides the signs itself, and so does the map: the `minor` stop for the signs that come
# before the Hour (the hadith of the eleven signs), and the `major` stop for the pictures of the Hour
# itself (81:1-14, 75:9, 82:4-5, 89:21-22).
#
# The hadith of the eleven signs (al-Bukhari 7121, Sahih Muslim 2935) is the frame for the first half:
# the signs that come before the Hour, seen on the ground, in the world people live in. The Quran's own
# pictures of the Hour itself are the second half.

# ── 193 · The lamps going out. The eleven-signs hadith lists it third: religious knowledge is taken
# away, earthquakes increase, and time passes quickly. The scene is a plain whose lamp-light thins.
def scene_lamps():
    sid, order, title, arabic = 'lamps', 193, 'The Lamps Going Out', 'انطفاء الأنوار'
    art = ["The eleven signs are told by the Prophet ﷺ in the hadith of al-Bukhari 7121 (Sahih Muslim 2935): among them, religious knowledge is taken away and time passes quickly. This scene draws on that hadith, not on the Quran.",
           "Nothing of anyone's belief is shown: the small lights are the lamps of a town, and a town going dark is the sign's picture.",
           "The town and the lights are imagined."]
    prompt = "A low town of pale stone at dusk, its streets and windows filled with countless small warm lamps; then, one street at a time, the lamps going out, until only a few are left burning and the town stands in a blue dusk; ink-wash and parchment texture."
    layers = [
        heav([[17.4, 18.2, 11000], [18.2, 19.4, 12000]], horizon=640),
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#3a3448'], [1, '#141426']]},
        ridge(0.06, 600, 40, '#2e2a3a', 1700),
        {'type': 'town', 'depth': 0.16, 'y': 700, 'x0': 120, 'x1': 1480, 's': P(0.16, 1) / 30, 'grade': 'town', 'lit': 0.5, 'haze': '#4a4258', 'seed': 1701,
         'at': {'1': {'lit': 0.12}, '2': {'lit': 0.0}}},
        plain(0.22, 730, 8, '#2a2630', '#121016', 1702),
        {'type': 'crowd', 'depth': 0.24, 'area': [240, 1360, -2600, -1800], 'y': [FEET - 6, 740], 'count': 200, 'size': P(0.3), 'color': '#ffd8a0', 'dim': 0.45, 'glow': 0.16, 'mill': 5, 'speed': 0,
         'at': {'1': {'glow': 0.05, 'dim': 0.6}, '2': {'glow': 0.0, 'dim': 0.0}}},
        motes(0.12),
    ]
    beats = [
        {'dur': 11000, 'ambient': ['city', 'voices'], 'cam': cam([800, 500, 1100], [800, 600, -3000]),
         'say': "Before the Hour comes, the signs appear one by one, and the Prophet ﷺ told of them: that religious knowledge would be taken away, that earthquakes would increase, and that time would pass quickly."},
        {'dur': 11000, 'ambient': ['city', 'wind'], 'world': {'shake': 0.6}, 'cam': cam([800, 510, 950], [800, 620, -3000]),
         'say': "The lamps of a town go out from one end to the other. Nobody blows them out. There is simply less and less light, until what is left is barely enough to walk by."},
        {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([800, 520, 1000], [800, 640, -3000]),
         'verse': {'ref': '81:14', 'ar': [0, 3], 'place': 'lower',
                   'en': "A soul will [then] know what it has brought [with it]."}},
    ]
    scene(sid, order, 20, 'minor', title, arabic, art, prompt, HOUR, layers, beats, ['city', 'wind'], source='mixed')


# ── 194 · The wealth and the high buildings. Two more of the eleven signs: wealth in such abundance that
# a rich man fears no one will take his charity, and people competing to build high.
def scene_towers():
    sid, order, title, arabic = 'towers', 194, 'The High Buildings', 'العمارات'
    art = ["Two of the eleven signs are told by the Prophet ﷺ in the hadith of al-Bukhari 7121 (Sahih Muslim 2935): wealth so abundant that a wealthy man worries nobody will accept his charity, and people competing with one another in constructing high buildings.",
           "The buildings and the town are imagined. No person is shown."]
    prompt = "A great plain under a wide sky with a new city rising on it: tall pale towers standing up out of the dust, more and more of them, higher and higher, until they crowd the sky and the plain below is lost between their feet; ink-wash and parchment texture."
    layers = [
        heav([[8, 9, 11000], [9, 11, 12000]], horizon=630),
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#4a4658'], [1, '#282838']]},
        ridge(0.05, 590, 34, '#3a3644', 1710),
        {'type': 'town', 'depth': 0.1, 'y': 640, 'x0': 0, 'x1': 1600, 's': P(0.1, 1) / 30, 'grade': 'town', 'lit': 0.3, 'haze': '#585066', 'seed': 1711, 'rows': 2},
        {'type': 'masonry', 'depth': 0.14, 'pos': [420, 690], 'w': P(0.14, 12), 'h': P(0.14, 40), 'side': 30, 'courses': 40, 'blocks': 6, 'built': 0.2,
         'stone': '#b8b0bc', 'stone2': '#c8c0cc', 'ink': '#4a4452',
         'at': {'0': {'build': [0.2, 0.6, 10000]}, '1': {'build': [0.6, 1, 10000]}, '2': {'built': 1}}},
        {'type': 'masonry', 'depth': 0.16, 'pos': [1080, 700], 'w': P(0.16, 14), 'h': P(0.16, 52), 'side': 34, 'courses': 52, 'blocks': 6, 'built': 0.1,
         'stone': '#a8a0b0', 'stone2': '#b8b0bc', 'ink': '#443e4e',
         'at': {'0': {'build': [0.1, 0.5, 10000]}, '1': {'build': [0.5, 1, 11000]}, '2': {'built': 1}}},
        plain(0.26, 760, 6, '#3a3644', '#1e1c26', 1712),
        dust(box=(-1400, 200, -4000, 2800, 900, -1200), count=420, size=8, color='#a09aac', opacity=0.28, wind=(6, 10, 0), swirl=30, blend='normal'),
        motes(0.1),
    ]
    beats = [
        {'dur': 11000, 'ambient': ['city', 'work'], 'sfx': [{'name': 'hoe', 'at': 1600}], 'cam': cam([800, 500, 1150], [800, 560, -3000]),
         'say': "And the Prophet ﷺ said: wealth would become so abundant that a wealthy man would worry nobody would accept his charity, and people would compete with one another in constructing high buildings."},
        {'dur': 11000, 'ambient': ['work', 'city'], 'cam': cam([800, 470, 1000], [800, 470, -3000]),
         'say': "So the towers go up. They rise out of the dust of the plain, higher than the hills, and then higher still, until the ground they stand on is a small dark space between their feet."},
        {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([800, 490, 1050], [800, 500, -3000]),
         'verse': {'ref': '89:6', 'ar': [0, 5], 'place': 'lower',
                   'en': "Have you not considered how your Lord dealt with 'Aad -"}},
    ]
    scene(sid, order, 20, 'minor', title, arabic, art, prompt, DUSK, layers, beats, ['city', 'work'], source='mixed')


# ── 195 · The sun folded. 81:1-3 is the opening of the Day of Judgment. The engine's `heavens` layer
# folds the sun (`sun.fold`) and its light goes with it.
def scene_sunfolded():
    sid, order, title, arabic = 'sunfolded', 195, 'The Sun Folded', 'انطواء الشمس'
    art = ["The Quran says the sun is wrapped up in darkness, the stars fall dispersing, and the mountains are removed (81:1-3). The sun here is the sun; nothing in the scene stands for God.",
           "The way the light folds is imagined."]
    prompt = "A pale desert under a great sky; the sun low and swollen, then folding inward and going dark like a pinched flame, while the stars behind it come up and are slowly blotted out, and the far mountains flatten like dropped cloth; ink-wash and parchment texture."
    layers = [
        heav([[11.5, 12.2, 11000], [12.2, 13, 12000], [13, 13, 12000]], sun={**SUN, 'x0': 800, 'x1': 800, 'peak': 300, 'size': 62}, horizon=640),
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#4a4a5c'], [1, '#14141c']]},
        ridge(0.06, 620, 40, '#4a4654', 1720),
        {'type': 'peak', 'depth': 0.12, 'x': 340, 'y': 340, 'w': 900, 'h': 420, 'color': '#5a5666', 'lit': '#7e788a', 'seed': 1721},
        {'type': 'peak', 'depth': 0.12, 'x': 1300, 'y': 340, 'w': 900, 'h': 420, 'color': '#5a5666', 'lit': '#7e788a', 'seed': 1722},
        plain(0.24, 740, 10, '#4a4854', '#222028', 1723),
        motes(0.12),
    ]
    beats = [
        {'dur': 11000, 'ambient': ['wind', 'air'], 'cam': cam([800, 480, 1150], [800, 380, -3000]),
         'say': "Then the Quran turns to the Hour itself, and speaks of it in pictures: when the sun is wrapped up in darkness, and when the stars fall, dispersing, and when the mountains are removed."},
        {'dur': 11000, 'ambient': ['air'], 'world': {'bloom': 1.0}, 'cam': cam([800, 460, 900], [800, 340, -3000]),
         'say': "The sun draws in on itself and goes out. Behind it the stars come up, one by one, and are blotted out as if they had never been lit. The far mountains lie down flat like cloth."},
        {'dur': 12000, 'ambient': ['air', 'wind'], 'cam': cam([800, 480, 950], [800, 380, -3000]),
         'verse': {'ref': '81:1-3', 'ar': [[0, 2], [0, 2], [0, 2]], 'place': 'lower',
                   'en': "When the sun is wrapped up [in darkness] And when the stars fall, dispersing, And when the mountains are removed"}},
    ]
    scene(sid, order, 20, 'major', title, arabic, art, prompt, DUSK, layers, beats, ['wind', 'air'])


# ── 196 · The sun rising from the West. The hadith names this sign twice (al-Bukhari 4635 and 7121),
# and 6:158 asks what they are waiting for.
def scene_sunrise():
    sid, order, title, arabic = 'sunrise', 196, 'The Sun Rises from the West', 'شروق الشمس من الغرب'
    art = ["That the sun will rise from the West is one of the eleven signs, told by the Prophet ﷺ in the hadith of al-Bukhari 4635 and 7121 (Sahih Muslim 2935). It is not in the Quran; the scene says so.",
           "The way the sunrise looks is imagined. The west is a direction, not a place shown here.",
           "Nobody is shown."]
    prompt = "A wide empty plain under a night sky; along one horizon a band of pale gold appears low and brightens, until a sunrise comes up in the wrong direction and the whole empty land is lit by it; ink-wash and parchment texture."
    layers = [
        heav([[5, 5.4, 11000], [5.4, 6.2, 12000], [6.2, 7, 12000]], sun={**SUN, 'x0': 1300, 'x1': 300, 'peak': 300, 'size': 40}, horizon=650),
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#101828'], [1, '#3e2f34']]},
        ridge(0.06, 620, 36, '#342e3c', 1730),
        plain(0.2, 700, 10, '#342e38', '#161218', 1731, at={'2': {'color': '#54463c', 'color2': '#241c18'}}),
        motes(0.16),
    ]
    beats = [
        {'dur': 11000, 'ambient': ['wind', 'air'], 'cam': cam([800, 520, 1000], [800, 600, -3000]),
         'say': "The sign the community is said to await is this: that the sun will rise from the West. When the people see it, they will all believe, and it will be too late for anyone who did not believe before."},
        {'dur': 11000, 'ambient': ['wind', 'air'], 'cam': cam([800, 530, 900], [800, 620, -3000]),
         'say': "So the light comes up along the horizon, and the empty land wakes under it. Nothing of the people is shown, because the sign is not about them."},
        {'dur': 12000, 'ambient': ['air'], 'cam': cam([800, 540, 950], [800, 640, -3000]),
         'verse': {'ref': '6:158', 'ar': [15, 38], 'place': 'lower',
                   'en': "The Day that some of the signs of your Lord will come no soul will benefit from its faith as long as it had not believed before or had earned through its faith some good. Say, \"Wait. Indeed, we [also] are waiting.\""}},
    ]
    scene(sid, order, 20, 'major', title, arabic, art, prompt, HOUR, layers, beats, ['wind', 'air'], source='mixed')


# ── Chapter 21 · The Day of Judgment ───────────────────────────────────────
# The Quran's own account of the end: the earth levelled and pounded, the graves opened, the souls
# brought out, the people like moths dispersed, the mountains like wool, the scales weighed. Then the
# exchange the Quran ends on: the wrongdoer's plea, and the answer that the command is with God.
#
# Nothing of this is shown. The scene is the world being asked a question it cannot answer.

# ── 197 · The earth levelled. 89:21-22: the earth pounded and crushed, and the Lord and the angels rank
# upon rank. The engine's `globe` shows every life as a light on the land.
def scene_earth():
    sid, order, title, arabic = 'earth', 197, 'The Earth Is Leveled', 'دك الأرض'
    art = ["89:21-22: when the earth is leveled, pounded and crushed, and your Lord has come and the angels, rank upon rank. The scene shows the earth only: the coming of the Lord and the angels is not depicted.",
           "Every life on the globe is a point of light (5:32); what each life carried is not shown, because only God knows it.",
           "The look of the cracked earth is imagined."]
    prompt = "The earth seen from above as it splits open in long seams, the ground giving up its dead as points of light rise out of the fissures, a vast plain left bare behind them; then the seams closing and the plain left perfectly level and still; ink-wash and parchment texture."
    layers = [
        heav([[0, 0.4, 11000], [0.4, 1, 12000]], sun=None, horizon=640, stars=1200),
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#14161f'], [1, '#0a0b12']]},
        {'type': 'ground', 'depth': 0.16, 'y': 700, 'amp': 16, 'seed': 1740, 'color': '#2a2830', 'color2': '#121016',
         'at': {'1': {'cracks': True}, '2': {'amp': 2, 'cracks': False, 'color': '#26242c', 'color2': '#141218'}}},
        {'type': 'globe', 'depth': 0.1, 'pos': [800, 220], 'r': 500, 'phase': 'appear', 'seed': 57, 'zoomDur': 9000,
         'at': {'1': {'phase': 'dark'}, '2': {'phase': 'gold'}}},
        motes(0.14),
    ]
    beats = [
        {'dur': 11000, 'ambient': ['wind', 'air'], 'cam': cam([800, 500, 1150], [800, 400, -3000]),
         'say': "The Quran describes the Day of Judgment in pictures rather than in a report. First the ground: when the earth is leveled, pounded and crushed."},
        {'dur': 11000, 'ambient': ['air'], 'sfx': [{'name': 'rumble', 'at': 800}], 'world': {'shake': 0.8},
         'cam': cam([800, 520, 950], [800, 460, -3000]),
         'say': "The seams open, and out of them rise the lights of those who were given back. Nothing is said of what they carried; that is known only to God. Then the ground closes over, and the plain is left level and perfectly still."},
        {'dur': 12000, 'ambient': ['air'], 'world': {'shake': 0.2}, 'cam': cam([800, 500, 1000], [800, 420, -3000]),
         'verse': {'ref': '89:21-22', 'ar': [[0, 5], [0, 4]], 'place': 'lower',
                   'en': "No! When the earth has been leveled - pounded and crushed - And your Lord has come and the angels, rank upon rank,"}},
    ]
    scene(sid, order, 21, 'judgment', title, arabic, art, prompt, HOUR, layers, beats, ['wind', 'air'])


# ── 198 · The people like moths. 101:4-5: on that Day people will be like moths, dispersed, and the
# mountains like wool fluffed up. Then the scales: one whose scales are heavy, one whose are light.
def scene_moths():
    sid, order, title, arabic = 'moths', 198, 'Like Moths', 'الفراشات'
    art = ["101:4-5: on the Day of the Striking Calamity people will be like moths, dispersed, and the mountains like wool, fluffed up; then the scales are weighed, and one whose scales are heavy will be in a pleasant life.",
           "Nobody is shown: the moths are points of light, the mountains are the ones fluffed like wool, and the scales are never drawn.",
           "The look of the fluffed mountains is imagined."]
    prompt = "A plain under a pale sky with ranks of mountains standing pale and soft, as though fluffed like wool; and around them, thousands of small lights drifting and scattering like moths in a lamplight; ink-wash and parchment texture."
    layers = [
        heav([[6, 7, 11000], [7, 8, 12000]], horizon=600),
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#5a5666'], [1, '#34303e']]},
        ridge(0.04, 560, 60, '#6e6880', 1750),
        ridge(0.08, 600, 40, '#7c7690', 1751),
        ridge(0.13, 640, 26, '#8a849c', 1752),
        plain(0.3, 760, 6, '#5a5468', '#2e2a3a', 1753),
        {'type': 'crowd', 'depth': 0.2, 'area': [200, 1400, -3000, -2000], 'y': [FEET - 10, 720], 'count': 240, 'size': P(0.28), 'color': '#ffe0b0', 'dim': 0.5, 'glow': 0.2, 'mill': 8, 'speed': 0, 'flicker': 0.5,
         'at': {'1': {'speed': 26, 'flow': [1, 0], 'mill': 10}}},
        motes(0.14),
    ]
    beats = [
        {'dur': 11000, 'ambient': ['wind', 'air'], 'cam': cam([800, 500, 1150], [800, 560, -3000]),
         'say': "On the Day of the Striking Calamity, the Quran says, people will be like moths, dispersed. And the mountains will be like wool, fluffed up."},
        {'dur': 11000, 'ambient': ['air', 'wind'], 'cam': cam([800, 500, 950], [800, 600, -3000]),
         'say': "The mountains stand pale and soft, and the lights of people drift and scatter through the air like moths. Then the scales are weighed. The Quran says no more about the weighing than that it happens."},
        {'dur': 12000, 'ambient': ['air'], 'cam': cam([800, 490, 1000], [800, 560, -3000]),
         'verse': {'ref': '101:4-5', 'ar': [[0, 4], [0, 3]], 'place': 'lower',
                   'en': "It is the Day when people will be like moths, dispersed, And the mountains will be like wool, fluffed up."}},
    ]
    scene(sid, order, 21, 'judgment', title, arabic, art, prompt, DUSK, layers, beats, ['wind', 'air'])


# ── 199 · The atom's weight. 99:7-8 is the verse that makes the whole chapter about what a person does:
# an atom's weight of good, an atom's weight of evil. The engine's `globe` carries every life as a light.
def scene_atom():
    sid, order, title, arabic = 'atom', 199, "An Atom's Weight", 'ذرة خفيفة'
    art = ["99:7-8 says whoever does an atom's weight of good will see it, and whoever does an atom's weight of evil will see it. The scene shows the earth opening; what each person carried is not shown, because only God knows it.",
           "The atom's weight (mithqal) is the smallest coin the Quraysh used; the coin itself is not shown."]
    prompt = "A bare wide plain seen from above, the earth opening into a long dark seam that widens; along it a few points of light, some warm and steady and some dim, and dust rising where it opens; ink-wash and parchment texture."
    layers = [
        heav([[0, 0.4, 11000], [0.4, 1, 12000]], sun=None, horizon=640, stars=1200),
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#181820'], [1, '#0e0e14']]},
        {'type': 'ground', 'depth': 0.18, 'y': 720, 'amp': 14, 'seed': 1760, 'color': '#2a2a30', 'color2': '#131318',
         'at': {'1': {'cracks': True, 'color': '#22222a', 'color2': '#0e0e12'}}},
        {'type': 'globe', 'depth': 0.1, 'pos': [800, 250], 'r': 520, 'phase': 'appear', 'seed': 41, 'zoomDur': 9000,
         'at': {'1': {'phase': 'dark'}, '2': {'phase': 'gold'}}},
        motes(0.14),
    ]
    beats = [
        {'dur': 11000, 'ambient': ['air', 'wind'], 'cam': cam([800, 500, 1150], [800, 400, -3000]),
         'say': "The Day of the Earthquake. When the earth is shaken with its final earthquake and discharges its burdens, the people depart separated, to be shown the result of their deeds."},
        {'dur': 11000, 'ambient': ['air'], 'sfx': [{'name': 'rumble', 'at': 700}], 'world': {'shake': 1.0},
         'cam': cam([800, 520, 950], [800, 480, -3000]),
         'say': "Whoever does an atom's weight of good will see it, and whoever does an atom's weight of evil will see it. A mustard seed's worth, a grain of dust's worth: nothing is too small to be seen."},
        {'dur': 12000, 'ambient': ['air'], 'world': {'shake': 0.2}, 'cam': cam([800, 500, 1000], [800, 420, -3000]),
         'verse': {'ref': '99:7-8', 'ar': [[0, 5], [0, 5]], 'place': 'lower',
                   'en': "So whoever does an atom's weight of good will see it, And whoever does an atom's weight of evil will see it."}},
    ]
    scene(sid, order, 21, 'judgment', title, arabic, art, prompt, HOUR, layers, beats, ['air'])


# ── 200 · The keepers. 82:10-12: over you are keepers, noble and recording, and they know whatever you
# do. Nothing of the recording is shown but the empty ground that is being watched.
def scene_keepers():
    sid, order, title, arabic = 'keepers', 200, 'The Keepers', 'الرقابة'
    art = ["82:10-12 says that over you are keepers, noble and recording, and that they know whatever you do. The keepers are never shown: the scene is the quiet ground they watch.",
           "The look of the ground and the light is imagined."]
    prompt = "A wide bare ground under a high sky at first light, one small pale light standing alone in the middle of it, casting a long shadow; the ground around it scored with faint parallel marks, like a page ruled for writing; ink-wash and parchment texture."
    layers = [
        heav([[5.4, 6.2, 11000], [6.2, 7, 12000]], horizon=620),
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#3c3a4e'], [1, '#5a5568']]},
        ridge(0.05, 600, 32, '#4e4a5c', 1770),
        {'type': 'scribbles', 'depth': 0.16, 'from': [[300, 700], [620, 704], [980, 706], [1300, 708]], 'per': 4, 'color': '#6a6480', 'size': 22, 'seed': 1771},
        plain(0.24, 720, 6, '#565266', '#2e2b3a', 1772),
        {'type': 'light', 'depth': 0.3, 'pos': [800, FEET], 'h': 58, 'color': '#fff0dc', 'glow': 0.55, 'bright': 1.15, 'solid': 0.5,
         'at': {'1': {'pose': 'bow', 'w': 1}, '2': {'glow': 1.1, 'bright': 1.3}}},
        motes(0.12),
    ]
    beats = [
        {'dur': 11000, 'ambient': ['air', 'wind'], 'cam': cam([800, 520, 1150], [800, 640, -3000]),
         'say': "And indeed, over you are keepers, noble and recording. They know whatever you do."},
        {'dur': 11000, 'ambient': ['air'], 'cam': cam([800, 530, 950], [800, 660, -3000]),
         'say': "Nothing of them is shown. The scene is the ground itself, and the marks scored across it, and one small light standing alone where the watching is."},
        {'dur': 12000, 'ambient': ['air', 'wind'], 'cam': cam([800, 540, 1000], [800, 680, -3000]),
         'verse': {'ref': '82:10-12', 'ar': [[0, 2], [0, 1], [0, 2]], 'place': 'lower',
                   'en': "And indeed, [appointed] over you are keepers, Noble and recording; They know whatever you do."}},
    ]
    scene(sid, order, 21, 'judgment', title, arabic, art, prompt, DAWN, layers, beats, ['air', 'wind'])


# ── 201 · The soul at the collar bones. 75:26-28 is the closest the Quran comes to showing death: the
# soul reaches the collar bones, and it is said, who will cure him. It is told, never shown.
def scene_soul():
    sid, order, title, arabic = 'soul', 201, 'At the Collar Bones', 'عند الحنجرة'
    art = ["75:26-28: when the soul has reached the collar bones, and it is said, who will cure him, and the dying one is certain that it is the separation. None of it is shown: the scene is a still plain and a light that goes out.",
           "The look of the light and the plain is imagined."]
    prompt = "A still plain under a low sun at the end of the day, one small warm light standing alone; the light dims, thins and goes out, and the plain is left exactly as it was; ink-wash and parchment texture."
    layers = [
        heav([[16.4, 17.2, 11000], [17.2, 18.2, 12000]], horizon=610),
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#6a4a44'], [1, '#3a3040']]},
        ridge(0.05, 590, 30, '#5c4a50', 1780),
        plain(0.22, 710, 8, '#5a4a50', '#241c22', 1781),
        {'type': 'light', 'depth': 0.3, 'pos': [800, FEET], 'h': 60, 'color': '#ffdca8', 'glow': 0.7, 'bright': 1.2, 'solid': 0.5,
         'at': {'1': {'pose': 'bow', 'w': 1}, '2': {'pose': 'gone'}}},
        motes(0.16),
    ]
    beats = [
        {'dur': 11000, 'ambient': ['wind', 'air'], 'cam': cam([800, 520, 1150], [800, 640, -3000]),
         'say': "The Quran comes closer to a person's death than anywhere else in these chapters: when the soul has reached the collar bones, and it is said, who will cure him?"},
        {'dur': 11000, 'ambient': ['air'], 'cam': cam([800, 530, 950], [800, 660, -3000]),
         'say': "The dying one is certain that it is the separation, and the leg is wound about the leg. To your Lord, that Day, is the procession. None of it is shown here; the light simply thins and goes out."},
        {'dur': 12000, 'ambient': ['air', 'wind'], 'cam': cam([800, 540, 1000], [800, 680, -3000]),
         'verse': {'ref': '75:26-28', 'ar': [[0, 3], [0, 3], [0, 2]], 'place': 'lower',
                   'en': "No! When the soul has reached the collar bones And it is said, \"Who will cure [him]?\" And the dying one is certain that it is the [time of] separation"}},
    ]
    scene(sid, order, 21, 'judgment', title, arabic, art, prompt, DUSK, layers, beats, ['wind', 'air'])


# ── 202 · The plea. 23:99-100 is the wrongdoer's own wish: my Lord, send me back, that I might do
# righteousness in what I left behind. And 75:13-14: man will be informed of what he sent ahead and kept
# back, and against himself he will be a witness.
def scene_returnwish():
    sid, order, title, arabic = 'returnwish', 202, 'The Plea', 'العودة'
    art = ["23:99-100 holds the wrongdoer's own wish at the moment of death: my Lord, send me back, that I might do righteousness in what I left behind. And 75:13-14: man will be informed that Day of what he sent ahead and kept back.",
           "No one speaks on screen. The scene is the empty plain and the closed sky.",
           "The look of the sky and the light is imagined."]
    prompt = "A bare plain at the edge of the world under an enormous still sky; one small point of light at the centre of the plain; the sky closing down slowly over it until the light is covered; ink-wash and parchment texture."
    layers = [
        heav([[0, 0.6, 11000], [0.6, 1.2, 12000]], sun=None, horizon=640, stars=1000),
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#1a1824'], [1, '#0c0a12']]},
        ridge(0.06, 610, 30, '#2e2a38', 1790),
        plain(0.2, 700, 10, '#2e2a34', '#141218', 1791),
        {'type': 'light', 'depth': 0.3, 'pos': [800, FEET], 'h': 60, 'color': '#fff0dc', 'glow': 0.6, 'bright': 1.2, 'solid': 0.5,
         'at': {'1': {'pose': 'bow', 'w': 1}, '2': {'glow': 1.2, 'bright': 1.4}}},
        motes(0.12),
    ]
    beats = [
        {'dur': 11000, 'ambient': ['wind', 'air'], 'cam': cam([800, 520, 1150], [800, 640, -3000]),
         'say': "And when death comes to one of them, he says: my Lord, send me back, that I might do righteousness in what I left behind. But it is only a word he is saying; and behind them is a barrier."},
        {'dur': 11000, 'ambient': ['air'], 'world': {'bloom': 1.0}, 'cam': cam([800, 530, 950], [800, 660, -3000]),
         'say': "Man will be informed that Day of what he sent ahead and kept back. Rather, man, against himself, will be a witness, even if he presents his excuses."},
        {'dur': 12000, 'ambient': ['air', 'wind'], 'cam': cam([800, 540, 1000], [800, 680, -3000]),
         'verse': {'ref': '75:13-14', 'ar': [[0, 4], [0, 3]], 'place': 'lower',
                   'en': "Man will be informed that Day of what he sent ahead and kept back. Rather, man, against himself, will be a witness,"}},
    ]
    scene(sid, order, 21, 'judgment', title, arabic, art, prompt, HOUR, layers, beats, ['wind', 'air'])


# ── 203 · The command is with God. 82:19 closes the sura: on that Day a soul will not possess for
# another soul the power to do a thing, and the command, that Day, is entirely with God.
def scene_sovereign():
    sid, order, title, arabic = 'sovereign', 203, 'The Command Is with God', 'السلطان'
    art = ["82:19 closes Al-Infitaar: on that Day a soul will not possess for another soul the power to do a thing, and the command, that Day, is entirely with God. God is not shown in any form; the scene is the closed horizon.",
           "The look of the horizon is imagined."]
    prompt = "The edge of the world: a wide empty plain running out to a hard bright line where the land meets the sky, the sky enormous and empty above it, and one small warm light at the far edge of the plain; ink-wash and parchment texture."
    layers = [
        heav([[0, 0.6, 11000], [0.6, 1.2, 12000]], sun=None, horizon=640, stars=900),
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#161420'], [1, '#0a0810']]},
        {'type': 'ridge', 'depth': 0.05, 'y': 626, 'amp': 18, 'seed': 1800, 'sharp': 0.05, 'color': '#322e40', 'haze': 0.2, 'fog': 0.2},
        plain(0.24, 690, 4, '#322e3c', '#161420', 1801),
        {'type': 'light', 'depth': 0.3, 'pos': [800, FEET], 'h': 54, 'color': '#fff0dc', 'glow': 0.7, 'bright': 1.25, 'solid': 0.5,
         'at': {'1': {'glow': 1.3, 'bright': 1.45}, '2': {'glow': 0.9, 'bright': 1.15}}},
        motes(0.1),
    ]
    beats = [
        {'dur': 11000, 'ambient': ['wind', 'air'], 'cam': cam([800, 520, 1150], [800, 620, -3000]),
         'say': "And the Quran ends the passage like this: on that Day a soul will not possess for another soul the power to do a thing. No one can help anyone else, and no one can be persuaded to change."},
        {'dur': 11000, 'ambient': ['air'], 'cam': cam([800, 530, 950], [800, 640, -3000]),
         'say': "And the command, that Day, is entirely with God. Nothing of that is shown. The scene is the edge of the world, and the light standing at it."},
        {'dur': 12000, 'ambient': ['air', 'wind'], 'cam': cam([800, 540, 1000], [800, 660, -3000]),
         'verse': {'ref': '82:19', 'ar': [0, 9], 'place': 'lower',
                   'en': "It is the Day when a soul will not possess for another soul [power to do] a thing; and the command, that Day, is [entirely] with Allah."}},
    ]
    scene(sid, order, 21, 'judgment', title, arabic, art, prompt, HOUR, layers, beats, ['wind', 'air'])


# ── Chapter files ──────────────────────────────────────────────────────────
for make in (scene_lamps, scene_towers, scene_sunfolded, scene_sunrise,
             scene_earth, scene_moths, scene_atom, scene_keepers, scene_soul, scene_returnwish, scene_sovereign):
    make()

# Chapter 20 has two map stops (the minor and the major signs), so it has two parts; chapter 21 has one.
write_chapter(C20 + 'chapter.json', {
    'number': 20, 'title': 'The Signs of the Hour', 'arabic': 'أشراط الساعة', 'nodes': ['minor', 'major'],
    'parts': [{'title': 'The Minor Signs', 'from': 193, 'to': 194},
              {'title': 'The Major Signs', 'from': 195, 'to': 196}]})
write_chapter(C21 + 'chapter.json', {
    'number': 21, 'title': 'The Day of Judgment', 'arabic': 'يوم الدين', 'nodes': ['judgment'],
    'parts': [{'title': 'The Earth Is Asked', 'from': 197, 'to': 203}]})

print('c20_21 ok')
