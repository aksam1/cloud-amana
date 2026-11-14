from base import *

# Chapter 15 · Ilyas, Al-Yasa' and Yunus. True scale: a person of 1.7 m is 255 × depth design units.
C15 = ROOT + 'src/story/chapters/c15/'
os.makedirs(C15, exist_ok=True)


def scene(sid, order, node, title, arabic, art, prompt, world, layers, beats, ambient, base='#1a1820', dissolve=2400):
    order = ORDER.get(sid, order)
    s = {'id': sid, 'chapter': 15, 'order': order, 'node': node, 'title': title, 'arabic': arabic, 'source': 'quran', 'ayahs': [], 'art': art,
         'ambient': ambient, 'base': base, 'captions': 'parchment', 'renderer': 'gl', 'pen': True, 'dissolve': dissolve, 'world': world,
         'cam': beats[0]['cam'], 'imagePrompt': prompt, 'layers': layers, 'beats': beats}
    open(C15 + f's{order}-{sid}.json', 'w').write(dump(s))


def pv(ref, part=None):
    v = {'ref': ref, 'place': 'sky'}
    if part:
        v['part'] = part
    return v


P = lambda d, m=1.7: round(m * 150 * d)
D = 0.42
FEET = 792
HILLS = {'fog': '#c8c0b0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.0, 'rays': 0, 'bloom': 0.65, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
SEA = {'fog': '#9aa8b4', 'fogNear': 6000, 'fogFar': 50000, 'light': 1.0, 'rays': 0, 'bloom': 0.7, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
STORM = {'fog': '#4a5260', 'fogNear': 3000, 'fogFar': 30000, 'light': 0.75, 'rays': 0, 'bloom': 0.7, 'haze': 0, 'hazeY': 0.6, 'shake': 0.6, 'dof': 0}
DEEP = {'fog': '#05080c', 'fogNear': 2000, 'fogFar': 20000, 'light': 0.7, 'rays': 0, 'bloom': 0.9, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}

prophet_d = dict(color='#fffaf0', glow=0.35, bright=1.1, solid=0.5)
prophet_n = dict(color='#fffaf0', glow=0.6, bright=1.35)
dim = dict(color='#ecc49a', glow=0.25, bright=0.95, solid=0.6)
SUN = {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 300, 'size': 34}
MOON = {'rise': 19, 'set': 6.5, 'x0': 1300, 'x1': 300, 'peak': 340, 'size': 24}
motes = lambda opacity=0.28, **kw: dust(box=(-1400, 200, -8000, 3000, 950, 600), count=400, size=2.6, color='#fff0d8', opacity=opacity, wind=(4, -2, 0), **kw)


def heav(tods, sun=SUN, moon=MOON, horizon=630):
    t0, *rest = tods
    h = {'type': 'heavens', 'horizon': horizon, 'tod': t0, 'sun': sun, 'moon': moon}
    if rest:
        h['at'] = {str(i + 1): {'tod': t} for i, t in enumerate(rest) if t}
    return h


def people(count=160, **kw):
    return {'type': 'crowd', 'area': [-200, 1800, -2600, -1600], 'y': [FEET + 6, 764], 'count': count, 'size': P(0.36), 'color': '#ffe0b0',
            'dim': 0.4, 'glow': 0.12, 'mill': 8, 'speed': 0, 'flicker': 0.1, **kw}


def sea(d=0.12, y=700, w=90, **kw):
    return {'type': 'water', 'depth': d, 'points': [[-4000, y - 4], [800, y], [6000, y + 4]], 'w0': w, 'w1': w, 'reflect': [['0', '#b8ccd8'], ['1', '#3a5a72']], **kw}


ART = "The prophets appear only as steady lights; the people and sailors as dim figures of light. The look of the lands is imagined."

# ── 152 · Ilyas and Ba'l ──────────────────────────────────────────────────
scene('baal', 152, 'ilyas', "Ilyas and Ba'l", 'إلياس والصنم',
  art=[ART, "Ba'l appears as a faceless gilded idol on a high place, as in the idols of Ibrahim's chapter."],
  prompt="A hill town of stone at dusk, crowds of dim lights gathered on a high place before a tall faceless gilded idol between braziers; a steady light standing at the edge of the crowd, calling to them; jagged dark strokes of scorn rising; ink-wash and parchment texture.",
  world=HILLS, ambient=['crowd', 'fire'], base='#c8c0b0',
  layers=[
    heav([[16.6, 17.4, 10000], [17.4, 18, 10000], [18, 18.8, 12000]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 50, 'seed': 1200, 'sharp': 0.4, 'color': '#7a7a70', 'haze': 0.35, 'fog': 0.4},
    {'type': 'town', 'depth': 0.12, 'y': 690, 'x0': 100, 'x1': 1500, 's': P(0.12, 1) / 30, 'grade': 'israelite', 'lit': 0.35, 'haze': '#a89888', 'seed': 1201},
    {'type': 'ground', 'depth': 0.18, 'y': 720, 'amp': 6, 'seed': 1202, 'color': '#8a8060', 'color2': '#5a5040'},
    {'type': 'platform', 'depth': 0.26, 'x': 1000, 'y': 760, 'w': P(0.26, 8), 'steps': 4, 'rise': P(0.26, 0.25), 'dais': P(0.26, 0.3), 'stone': '#b8a080', 'lit': '#e0c8a0', 'dark': '#5a4a38', 'ppu': 1},
    {'type': 'idol', 'depth': 0.261, 'x': 1000, 'y': 760 - 4 * P(0.26, 0.25) - P(0.26, 0.3), 'h': P(0.26, 4), 'kind': 'gilt', 'ppu': 1.2, 'seed': 7},
    {'type': 'brazier', 'depth': 0.27, 'x': 900, 'y': 762, 's': 0.55},
    {'type': 'light', 'kind': 'flame', 'depth': 0.27, 'pos': [900, 720], 'h': 18, 'color': '#ffb050', 'glow': 1.1},
    {'type': 'brazier', 'depth': 0.27, 'x': 1100, 'y': 762, 's': 0.55},
    {'type': 'light', 'kind': 'flame', 'depth': 0.27, 'pos': [1100, 720], 'h': 18, 'color': '#ffb050', 'glow': 1.1},
    people(160, area=[700, 1500, -2600, -1700]),
    light([620, FEET + 10], P(0.44), depth=0.44, **prophet_d, at={'1': {'pose': 'raise'}}),
    {'type': 'jeers', 'show': [1, 2], 'center': [700, 540], 'from': [1100, 380], 'clear': [80, 110], 'count': 22, 'size': 34, 'period': 6},
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['crowd', 'fire'], 'cam': cam([820, 520, 800], [840, 680, -3000]),
     'say': "Among the Children of Israel, the prophet Ilyas found his people worshipping an idol they called Ba'l."},
    {'dur': 10000, 'ambient': ['crowd', 'jeer'], 'cam': cam([760, 525, 700], [760, 720, -3000]),
     'say': "Will you not fear God? he asked them. Do you call upon Ba'l and abandon the best of creators, God, your Lord and the Lord of your forefathers?"},
    {'dur': 12000, 'ambient': ['fire', 'air'], 'cam': cam([800, 520, 800], [820, 690, -3000]), 'pendingVerse': pv('37:125-126')},
  ])

# ── 153 · Al-Yasa' ────────────────────────────────────────────────────────
scene('yasa', 153, 'alyasa', "Al-Yasa'", 'اليسع',
  art=[ART, "That Al-Yasa' followed Ilyas and carried on his work is from the commentaries; the Quran names him among the best (38:48)."],
  prompt="A road through green hills at morning, an older steady light walking ahead and a younger steady light following; then the younger light alone, teaching a small gathering of dim lights beneath an olive tree; ink-wash and parchment texture.",
  world=HILLS, ambient=['birds', 'wind'], base='#c8c0b0',
  layers=[
    heav([[7, 8, 10000], [8, 12, 10000, 3], [12, 13, 12000]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 50, 'seed': 1210, 'sharp': 0.3, 'color': '#8a8a78', 'haze': 0.35, 'fog': 0.4},
    {'type': 'ground', 'depth': 0.14, 'y': 690, 'amp': 10, 'seed': 1211, 'color': '#7a8a52', 'color2': '#4a5a32', 'grass': True, 'grassColor': '#9aaa62'},
    {'type': 'tree', 'depth': 0.3, 'x': 1060, 'y': 776, 'h': P(0.3, 6), 'kind': 'living', 'seed': 1212},
    light([700, FEET + 6], P(0.42), depth=0.42, **prophet_d, show=[0, 1], pose='walk', path=[[600, FEET + 6], [980, FEET]], dur=10000),
    light([600, FEET + 8], P(0.42), depth=0.42, **prophet_d, pose='walk', path=[[480, FEET + 8], [880, FEET + 2]], dur=10000,
          at={'1': {'pos': [940, FEET + 2], 'path': None, 'pose': 'raise'}, '2': {'pos': [940, FEET + 2], 'path': None}}),
    *[light([1040 + i * 40, FEET + 6 + (i % 2) * 4], P(0.42), depth=0.42, **dim, pose='kneel', show=[1, None]) for i in range(5)],
    {'type': 'ground', 'depth': 0.6, 'y': 880, 'amp': 6, 'seed': 1213, 'color': '#5a6a3a', 'color2': '#3a4a2a', 'grass': True, 'grassColor': '#7a8a4a', 'wind': 1},
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['birds', 'wind'], 'cam': cam([780, 525, 700], [800, 720, -3000]),
     'say': "After Ilyas came Al-Yasa', who carried on calling the Children of Israel back to God."},
    {'dur': 10000, 'ambient': ['birds', 'voices'], 'cam': cam([960, 525, 650], [980, 740, -3000]),
     'say': "Little is told of him, but the Quran counts him among the best of people."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([920, 520, 800], [940, 690, -3000]), 'pendingVerse': pv('38:48')},
  ])

# ── 154 · Yunus leaves his people ─────────────────────────────────────────
scene('leaving', 154, 'yunus', 'Yunus Leaves', 'خروج يونس',
  art=[ART, "That Yunus was sent to Nineveh is from the commentaries; the Quran tells that he went off in anger (21:87)."],
  prompt="A great walled city on a river at evening, crowds of dim lights in its streets ignoring a steady light; then the steady light walking away alone down a road toward the sea and a harbour where a laden ship waits; ink-wash and parchment texture.",
  world=SEA, ambient=['city', 'wind'], base='#a8b4c0', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 1], 'layers': [
      heav([[16, 17, 10000]]),
      {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 30, 'seed': 1220, 'sharp': 0.3, 'color': '#9a8a7a', 'haze': 0.4, 'fog': 0.4},
      {'type': 'town', 'depth': 0.12, 'y': 690, 'x0': 0, 'x1': 1600, 's': P(0.12, 1) / 30, 'grade': 'assyrian', 'lit': 0.3, 'haze': '#b8a898', 'seed': 1221},
      {'type': 'facade', 'depth': 0.18, 'x': 800, 'y': 720, 'w': P(0.18, 60), 'h': P(0.18, 7), 'gate': {'w': P(0.18, 4), 'h': P(0.18, 4.2)}, 'towers': True, 'stone': '#a87c5c', 'style': 'brick', 'ppu': 0.8},  # Nineveh: walls of red-brown mudbrick
      {'type': 'ground', 'depth': 0.22, 'y': 742, 'amp': 4, 'seed': 1222, 'color': '#a89878', 'color2': '#7a6a52'},
      people(140, area=[200, 1400, -3600, -2600], mill=12),
      light([800, FEET + 6], P(0.42), depth=0.42, **prophet_d, at={'0': {'pose': 'raise'}}),
    ]},
    {'type': 'set', 'show': [1, None], 'dx': 6000, 'layers': [
      heav([[17.4, 18.2, 10000], [18.2, 18.8, 12000]]),
      {'type': 'ridge', 'depth': 0.04, 'y': 640, 'amp': 20, 'seed': 1223, 'sharp': 0.3, 'color': '#8a8a94', 'haze': 0.4, 'fog': 0.5},
      sea(0.1, 690, 100),
      {'type': 'boat', 'depth': 0.2, 'x': 1100, 'y': 724, 'w': P(0.2, 16), 'area': [900, 520, 1300, 730]},
      {'type': 'ground', 'depth': 0.24, 'y': 752, 'amp': 4, 'seed': 1224, 'color': '#b8a888', 'color2': '#8a7a62'},
      light([700, FEET + 6], P(0.42), depth=0.42, **prophet_d, pose='walk', path=[[600, FEET + 8], [1000, FEET]], dur=11000),
    ]},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['city', 'voices'], 'cam': cam([800, 515, 900], [800, 660, -3000]),
     'say': "Yunus was sent to a great city, but its people would not listen. At last he left them in anger, before God had given him leave."},
    {'dur': 11000, 'ambient': ['sea', 'wind'], 'cam': cam([860, 515, 900], [880, 650, -3000], dx=6000),
     'say': "He went down to the sea and boarded a laden ship."},
    {'dur': 12000, 'ambient': ['sea', 'air'], 'cam': cam([860, 515, 950], [880, 640, -3000], dx=6000), 'pendingVerse': pv('37:139-140')},
  ])

# ── 155 · The storm and the lots ──────────────────────────────────────────
scene('lots', 155, 'yunus', 'The Lots', 'القرعة',
  art=[ART, "Casting lots to lighten the ship is from 37:141. Yunus going into the sea is shown only as his light slipping from the deck into the dark."],
  prompt="A wooden ship labouring in a black storm at sea, towering grey waves, dim lights of sailors gathered on deck around a small cast of lots; a steady light stepping to the rail and passing into the dark water; a great dark back of a whale rising beneath; ink-wash and parchment texture.",
  world=STORM, ambient=['storm', 'sea'], base='#2a3038',
  layers=[
    heav([[17.6, 18, 10000], [18, 18.4, 10000], [18.4, 18.8, 12000]]),
    {'type': 'storm', 'tone': 'dark', 'opacity': 0.75},
    sea(0.08, 680, 120, reflect=[['0', '#5a6a78'], ['1', '#1a2430']]),
    {'type': 'whale', 'show': [1, None], 'depth': 0.32, 'x': 1000, 'y': 858, 'w': P(0.32, 16), 'face': -1, 'area': [500, 700, 1500, 880],
     'move': {'path': [[0, 120, 0], [0, 0, 0]], 'dur': 5000, 'delay': 2500}},
    sea(0.3, 830, 160, reflect=[['0', '#4a5a68'], ['1', '#141c24']]),
    {'type': 'boat', 'depth': 0.34, 'x': 800, 'y': 812, 'w': P(0.34, 16), 'wood': '#5a3e28', 'area': [400, 400, 1200, 830], 'move': {'path': [[0, 0, 0], [0, -10, 0], [0, 6, 0], [0, -8, 0], [0, 0, 0]], 'dur': 10000}},
    *[light([700 + i * 46, 760], P(0.341, 1.7), depth=0.341, **dim) for i in range(4)],
    light([960, 760], P(0.342), depth=0.342, **prophet_n, at={'1': {'pos': [1040, 770], 'pose': 'walk', 'path': [[960, 760], [1080, 780], [1120, 860]], 'dur': 4000, 'delay': 600}, '2': {'pose': 'gone'}}),
    dust(box=(-1400, 0, -6000, 3000, 950, 600), count=800, size=3, color='#c8d0d8', opacity=0.45, wind=(-30, -110, 0)),
    {'type': 'lightning', 'show': [0, 2], 'flash': 1, 'x': 1200, 'seed': 6},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['storm', 'sea'], 'sfx': [{'name': 'thunder', 'at': 1500}, {'name': 'wave', 'at': 4000}], 'cam': cam([820, 500, 900], [840, 640, -3000]),
     'say': "A storm struck the ship. To lighten it, the sailors cast lots to choose who must go over the side, and the lot fell on Yunus."},
    {'dur': 11000, 'ambient': ['storm', 'sea'], 'sfx': [{'name': 'wave', 'at': 3600}], 'world': {'shake': 1.0}, 'cam': cam([860, 505, 900], [880, 650, -3000]),
     'say': "He went into the sea, and a great whale swallowed him."},
    {'dur': 12000, 'ambient': ['sea', 'wind'], 'cam': cam([840, 505, 950], [860, 640, -3000]), 'pendingVerse': pv('37:141-142')},
  ])

# ── 156 · In the darkness ─────────────────────────────────────────────────
scene('darkness', 156, 'yunus', 'In the Darkness', 'ظلمة البحر',
  art=[ART, "The darkness of the night, of the sea and of the whale's belly (from the commentaries on 21:87) is shown as deep darkness around a small steady light."],
  prompt="Total darkness of the deep sea at night, a faint vast shape of a whale gliding; within the dark a single small steady light kneeling in prayer, its glow slowly growing; ink-wash and parchment texture.",
  world=DEEP, ambient=['sea', 'air'], base='#030506',
  layers=[
    {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#06090e'], [1, '#020304']]},
    {'type': 'whale', 'depth': 0.18, 'x': 900, 'y': 640, 'w': P(0.18, 30), 'face': -1, 'body': '#0e1418', 'belly': '#1e2a30', 'area': [-200, 380, 2000, 680],
     'move': {'path': [[0, 0, 0], [-160, 10, 0]], 'dur': 30000}},
    dust(box=(-1400, -200, -6000, 3000, 1200, 0), count=400, size=3, color='#6a8a9a', opacity=0.25, wind=(2, 4, 0), swirl=30),
    light([800, 790], P(0.42), depth=0.42, color='#fffaf0', pose='bow', w=1, glow=0.3, bright=1.0,
          at={'1': {'glow': 0.6, 'bright': 1.35}, '2': {'glow': 0.9, 'bright': 1.6}}),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['sea'], 'cam': cam([800, 520, 800], [800, 700, -3000]),
     'say': "In the darkness, Yunus knew he had done wrong in leaving."},
    {'dur': 11000, 'ambient': ['sea', 'air'], 'cam': cam([800, 530, 500], [800, 800, -3000]),
     'say': "He called out: there is no god but You. Glory be to You! I have been one of the wrongdoers."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([800, 525, 650], [800, 750, -3000]), 'pendingVerse': pv('21:87', 'from "And he called out within the darknesses"')},
  ])

# ── 157 · Cast on the shore ───────────────────────────────────────────────
scene('gourd', 157, 'yunus', 'Cast on the Shore', 'على الشاطئ',
  art=[ART, "The gourd vine that shaded him is from 37:146; it is drawn as a broad-leafed plant."],
  prompt="A bare, empty shore at sunrise, a weak dimmed light lying on the sand at the water's edge, a broad-leafed gourd vine growing up to shade him; the whale's dark back sinking away offshore; the light slowly brightening; ink-wash and parchment texture.",
  world=SEA, ambient=['sea', 'birds'], base='#a8b4c0',
  layers=[
    heav([[5.2, 6.2, 10000], [6.2, 7.4, 10000], [7.4, 8.4, 12000]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 640, 'amp': 20, 'seed': 1240, 'sharp': 0.3, 'color': '#8a8a94', 'haze': 0.4, 'fog': 0.5},
    sea(0.12, 700, 120),
    {'type': 'whale', 'show': [0, 1], 'depth': 0.13, 'x': 1200, 'y': 712, 'w': P(0.13, 18), 'face': 1, 'area': [900, 600, 1500, 720], 'move': {'path': [[0, 0, 0], [80, 60, 0]], 'dur': 9000, 'delay': 2000}},
    {'type': 'ground', 'depth': 0.24, 'y': 752, 'amp': 4, 'seed': 1241, 'color': '#d8c8a8', 'color2': '#a89878'},
    {'type': 'tree', 'show': [1, None], 'depth': 0.41, 'x': 860, 'y': FEET + 4, 'h': P(0.41, 1.8), 'kind': 'living', 'seed': 1242, 'reveal': {'dir': 'up', 'dur': 4000}},
    light([800, FEET + 10], P(0.42), depth=0.42, color='#d8d8d8', glow=0.15, bright=0.8, solid=0.5, pose='kneel',
          at={'1': {'glow': 0.25, 'bright': 0.95}, '2': {'color': '#fffaf0', 'glow': 0.35, 'bright': 1.1, 'pose': 'stand'}}),
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['sea', 'wind'], 'cam': cam([860, 520, 800], [880, 690, -3000]),
     'say': "Had he not been one who glorified God, he would have stayed in the whale until the Day of Resurrection. Instead, it cast him onto a bare shore, weak and ill."},
    {'dur': 10000, 'ambient': ['sea', 'birds'], 'cam': cam([840, 530, 550], [860, 790, -3000]),
     'say': "God made a gourd vine grow over him for shade, and he recovered."},
    {'dur': 12000, 'ambient': ['sea', 'air'], 'cam': cam([860, 520, 800], [880, 690, -3000]), 'pendingVerse': pv('37:145-146')},
  ])

# ── 158 · A hundred thousand ──────────────────────────────────────────────
scene('believed', 158, 'yunus', 'A Whole City Believes', 'مدينة تؤمن',
  art=[ART, "That his people believed when they saw the signs of punishment coming, and were spared, is from 10:98 and 37:147–148."],
  prompt="The great walled city at morning, its streets and squares filled with a hundred thousand warm lights turned toward a steady light returning along the road; all the lights brightening together; ink-wash and parchment texture.",
  world=HILLS, ambient=['crowd', 'birds'], base='#c8c0b0',
  layers=[
    heav([[7, 8.4, 10000], [8.4, 9.6, 10000], [9.6, 10.6, 12000]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 30, 'seed': 1220, 'sharp': 0.3, 'color': '#9a8a7a', 'haze': 0.4, 'fog': 0.4},
    {'type': 'town', 'depth': 0.12, 'y': 690, 'x0': 0, 'x1': 1600, 's': P(0.12, 1) / 30, 'grade': 'assyrian', 'lit': 0.4, 'haze': '#b8a898', 'seed': 1221},
    {'type': 'facade', 'depth': 0.18, 'x': 800, 'y': 720, 'w': P(0.18, 60), 'h': P(0.18, 7), 'gate': {'w': P(0.18, 4), 'h': P(0.18, 4.2)}, 'towers': True, 'stone': '#a87c5c', 'style': 'brick', 'ppu': 0.8},  # Nineveh: walls of red-brown mudbrick
    {'type': 'ground', 'depth': 0.22, 'y': 742, 'amp': 4, 'seed': 1222, 'color': '#a89878', 'color2': '#7a6a52'},
    {'type': 'crowd', 'area': [-400, 2000, -3600, -1700], 'y': [FEET, 744], 'count': 700, 'size': P(0.3), 'color': '#ffe0b0', 'dim': 0.5, 'glow': 0.08, 'mill': 4, 'speed': 0, 'flicker': 0.05,
     'at': {'1': {'dim': 0.25, 'glow': 0.15}, '2': {'dim': 0.2, 'glow': 0.18}}},
    light([800, FEET + 14], P(0.44), depth=0.44, **prophet_d, pose='walk', path=[[600, FEET + 18], [800, FEET + 14]], dur=8000),
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['crowd', 'birds'], 'cam': cam([800, 515, 900], [800, 660, -3000]),
     'say': "Meanwhile his people had seen the signs of punishment coming, and had turned to God, every one of them; and God spared them."},
    {'dur': 10000, 'ambient': ['crowd', 'air'], 'cam': cam([800, 520, 700], [800, 720, -3000]),
     'say': "Yunus was sent back to them, a hundred thousand or more, and they all believed. They were the only people who believed before the punishment fell, and were saved."},
    {'dur': 12000, 'ambient': ['crowd', 'air'], 'cam': cam([800, 515, 900], [800, 660, -3000]), 'pendingVerse': pv('37:147-148')},
  ])

write_chapter(C15 + 'chapter.json', {
    'number': 15, 'title': "Ilyas, Al-Yasa' and Yunus", 'arabic': 'إلياس واليسع ويونس', 'nodes': ['ilyas', 'alyasa', 'yunus'],
    'parts': [{'title': "Ilyas and Al-Yasa'", 'from': O(152), 'to': O(153)}, {'title': 'Yunus', 'from': O(154), 'to': O(158)}]})
print('c15 ok')
