from base import *
from rooms import room, front

# Chapter 12 · Musa and Pharaoh. True scale: a person of 1.7 m is 255 × depth design units tall.
C12 = ROOT + 'src/story/chapters/c12/'
os.makedirs(C12, exist_ok=True)


def scene(sid, order, title, arabic, art, prompt, world, layers, beats, ambient, base='#1a1820', dissolve=2400, node='musa'):
    order = ORDER.get(sid, order)
    s = {'id': sid, 'chapter': 12, 'order': order, 'node': node, 'title': title, 'arabic': arabic, 'source': 'quran', 'ayahs': [], 'art': art,
         'ambient': ambient, 'base': base, 'captions': 'parchment', 'renderer': 'gl', 'pen': True, 'dissolve': dissolve, 'world': world,
         'cam': beats[0]['cam'], 'imagePrompt': prompt, 'layers': layers, 'beats': beats}
    open(C12 + f's{order}-{sid}.json', 'w').write(dump(s))


def pv(ref, part=None):
    v = {'ref': ref, 'place': 'sky'}
    if part:
        v['part'] = part
    return v


P = lambda d, m=1.7: round(m * 150 * d)
D = 0.42
FEET = 792
NILE = {'fog': '#d8c8a8', 'fogNear': 6000, 'fogFar': 42000, 'light': 1.05, 'rays': 0, 'bloom': 0.6, 'haze': 0.15, 'hazeY': 0.62, 'shake': 0.3, 'dof': 0}
NIGHT = {'fog': '#141824', 'fogNear': 6000, 'fogFar': 40000, 'light': 0.9, 'rays': 0, 'bloom': 0.8, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
HALL = {'fog': '#2a2430', 'fogNear': 4000, 'fogFar': 30000, 'light': 0.95, 'rays': 0, 'bloom': 0.75, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
SEA = {'fog': '#9aa8b4', 'fogNear': 6000, 'fogFar': 50000, 'light': 1.0, 'rays': 0, 'bloom': 0.7, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}

prophet_n = dict(color='#fffaf0', glow=0.6, bright=1.35)
prophet_d = dict(color='#fffaf0', glow=0.35, bright=1.1, solid=0.5)
harun_n = dict(color='#f8f2e6', glow=0.5, bright=1.25)
dim = dict(color='#ecc49a', glow=0.25, bright=0.95, solid=0.6)
cold = dict(color='#b8b0c8', glow=0.2, bright=0.85, solid=0.7)
mage = dict(color='#c8a8d8', glow=0.3, bright=0.9, solid=0.6)
SUN = {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 300, 'size': 34}
MOON = {'rise': 19, 'set': 6.5, 'x0': 1300, 'x1': 300, 'peak': 340, 'size': 24}
motes = lambda opacity=0.28, **kw: dust(box=(-1400, 200, -8000, 3000, 950, 600), count=400, size=2.6, color='#fff0d8', opacity=opacity, wind=(4, -2, 0), **kw)


def heav(tods, sun=SUN, moon=MOON, horizon=630):
    t0, *rest = tods
    h = {'type': 'heavens', 'horizon': horizon, 'tod': t0, 'sun': sun, 'moon': moon}
    if rest:
        h['at'] = {str(i + 1): {'tod': t} for i, t in enumerate(rest) if t}
    return h


def egypt(lit=0.2, seed=800):
    return [
        {'type': 'ridge', 'depth': 0.04, 'y': 612, 'amp': 30, 'seed': seed, 'sharp': 0.3, 'color': '#b0987a', 'haze': 0.4, 'fog': 0.4},
        {'type': 'town', 'depth': 0.1, 'y': 650, 'x0': -200, 'x1': 1800, 's': P(0.1, 1) / 30, 'grade': 'city', 'lit': lit, 'haze': '#d8c8a8', 'seed': seed + 1},
        {'type': 'monument', 'depth': 0.12, 'x': 380, 'y': 660, 'kind': 'obelisk', 'h': P(0.12, 20), 'hill': [80, 16]},
        {'type': 'monument', 'depth': 0.12, 'x': 1260, 'y': 662, 'kind': 'obelisk', 'h': P(0.12, 18), 'hill': [80, 16]},
        {'type': 'ground', 'depth': 0.14, 'y': 670, 'amp': 6, 'seed': seed + 2, 'color': '#8a9a5a', 'color2': '#5a6a3a', 'grass': True, 'grassColor': '#a8b468'},
    ]


def court():
    """Pharaoh's hall: a long dais, Pharaoh's cold light, his chiefs to the side."""
    return [
        *room('pharaoh'),
        {'type': 'platform', 'depth': 0.3, 'x': 800, 'y': 760, 'w': 220, 'steps': 5, 'rise': 9, 'dais': 18, 'stone': '#b8845a', 'lit': '#e8b884', 'dark': '#4a2e22', 'ppu': 1},
        light([800, 718], P(0.3), depth=0.301, **cold),
        *[light([1000 + i * 34, 762], P(0.3, 1.7), depth=0.3, **cold) for i in range(5)],
        {'type': 'brazier', 'depth': 0.3, 'x': 640, 'y': 772, 's': 0.6},
        {'type': 'light', 'kind': 'flame', 'depth': 0.3, 'pos': [640, 724], 'h': 20, 'color': '#ffb050', 'glow': 1.1},
        {'type': 'brazier', 'depth': 0.3, 'x': 960, 'y': 772, 's': 0.6},
        {'type': 'light', 'kind': 'flame', 'depth': 0.3, 'pos': [960, 724], 'h': 20, 'color': '#ffb050', 'glow': 1.1},
    ]


def brothers(x=700, y=FEET, d=D, day=True, **kw):
    a, b = (prophet_d, {**prophet_d, 'color': '#f8f2e6'}) if day else (prophet_n, harun_n)
    return [light([x, y], P(d, 1.8), depth=d, **{**a, **kw}), light([x - 60, y + 2], P(d, 1.8), depth=d, **b)]


ART = "Musa and Harun appear only as steady lights; Pharaoh, his chiefs, the magicians and the people as dim figures of light, Pharaoh's cold and grey. Egypt's look is imagined."

# ── 122 · Before Pharaoh ──────────────────────────────────────────────────
scene('court', 122, 'Before Pharaoh', 'أمام فرعون',
  art=[ART],
  prompt="A vast lamplit hall of an Egyptian palace, a cold grey light seated on a dais between braziers with grey lights of chiefs beside it; two steady white lights standing before them, small and far, seen from behind; ink-wash and parchment texture.",
  world=HALL, ambient=['echo', 'fire'], base='#10141e',
  layers=[*court(), *brothers(820, FEET + 10, 0.44)],
  beats=[
    {'dur': 10000, 'ambient': ['echo', 'fire'], 'cam': cam([760, 530, 900], [780, 760, -3000]),
     'say': "Musa and Harun stood before Pharaoh: we are messengers of the Lord of the worlds. Let the Children of Israel go with us."},
    {'dur': 10000, 'ambient': ['echo', 'voices'], 'cam': cam([800, 540, 500], [800, 860, -3000]),
     'say': "Pharaoh scoffed: did we not raise you among us as a child? And who is this Lord of yours?"},
    {'dur': 12000, 'ambient': ['echo', 'air'], 'cam': cam([760, 530, 800], [780, 780, -3000]), 'pendingVerse': pv('20:50')},
  ])

# ── 123 · The staff before Pharaoh ────────────────────────────────────────
scene('sorcery', 123, 'The Staff before Pharaoh', 'العصا أمام فرعون',
  art=[ART, "The serpent is drawn in ink as the Quran describes it (7:107); the chiefs' scorn is jagged strokes, never words."],
  prompt="The lamplit hall of Pharaoh, a great ink-drawn serpent rearing on the polished floor before the dais, a steady white light beside it flaring bright; grey lights of the chiefs recoiling and jagged dark strokes of scorn rising; ink-wash and parchment texture.",
  world=HALL, ambient=['echo', 'fire'], base='#10141e',
  layers=[
    *court(),
    {'type': 'staff', 'depth': 0.44, 'x': 960, 'y': FEET + 22, 'len': P(0.44, 2.2), 'state': 'serpent', 'area': [720, 600, 1200, 830]},
    *brothers(820, FEET + 10, 0.44, at={'0': {'color': '#ffffff', 'glow': 1.0, 'bright': 1.7}}),
    {'type': 'jeers', 'show': [1, 2], 'center': [960, 560], 'from': [1200, 380], 'clear': [80, 100], 'count': 24, 'size': 34, 'period': 6},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['echo', 'fire'], 'sfx': [{'name': 'scratch', 'at': 400}], 'cam': cam([800, 540, 600], [820, 860, -3000]),
     'say': "Musa threw down his staff, and before them all it became a serpent. He drew out his hand, and it shone white."},
    {'dur': 10000, 'ambient': ['echo', 'jeer'], 'cam': cam([820, 530, 800], [840, 780, -3000]),
     'say': "This is a skilled magician, said the chiefs. Summon every magician in the land!"},
    {'dur': 12000, 'ambient': ['echo', 'air'], 'cam': cam([800, 530, 800], [820, 780, -3000]), 'pendingVerse': pv('7:107-108')},
  ])

# ── 124 · The day of the festival ─────────────────────────────────────────
ropes = [{'type': 'staff', 'show': [0, 1], 'depth': 0.42, 'x': x, 'y': FEET + 14 + (i % 3) * 6, 'len': P(0.42, 0.9), 'state': 'serpent', 'face': -1 if i % 2 else 1,
          'area': [x - 70, FEET - 70, x + 70, FEET + 34]} for i, x in enumerate((900, 980, 1060, 1140, 1220, 1020, 1160))]
scene('festival', 124, 'The Day of the Festival', 'يوم العيد',
  art=[ART, "The magicians' ropes are drawn as small ink serpents because the Quran says they seemed to move (20:66); that they were only ropes and staffs is shown when they vanish."],
  prompt="A great open square in Egypt at forenoon, crowds of dim amber lights in a wide arc, Pharaoh's grey light on a high stand; a line of violet-grey lights of magicians, and before them many small ink-drawn serpents writhing on the sand; facing them two steady white lights, and a great serpent that leaves nothing of the small ones; ink-wash and parchment texture.",
  world=NILE, ambient=['crowd', 'city'], base='#d8c8a8',
  layers=[
    heav([[9.5, 10.5, 10000], [10.5, 11.2, 10000], [11.2, 12, 12000]]),
    *egypt(),
    {'type': 'platform', 'depth': 0.2, 'x': 800, 'y': 712, 'w': P(0.2, 10), 'steps': 6, 'rise': P(0.2, 0.3), 'dais': P(0.2, 0.4), 'stone': '#c8a478', 'lit': '#ecd0a0', 'dark': '#6a4a30', 'ppu': 1},
    light([800, 712 - 6 * P(0.2, 0.3) - P(0.2, 0.4)], P(0.2), depth=0.201, **cold),
    {'type': 'crowd', 'area': [-200, 1800, -3400, -2200], 'y': [770, 730], 'count': 260, 'size': P(0.28), 'color': '#ffd8a0', 'dim': 0.3, 'glow': 0.35, 'mill': 6, 'speed': 0, 'flicker': 0.2},
    {'type': 'ground', 'depth': 0.36, 'y': 776, 'amp': 3, 'seed': 911, 'x0': -900, 'x1': 2500, 'color': '#d8bc94', 'color2': '#b09470'},
    *[light([920 + i * 70, FEET], P(D, 1.75), depth=D - 0.005, **mage) for i in range(5)],
    *ropes,
    {'type': 'staff', 'depth': D + 0.008, 'x': 760, 'y': FEET + 24, 'len': P(D, 1.6), 'area': [600, FEET - 140, 1000, FEET + 40],
     'at': {'1': {'state': 'serpent', 'len': P(D, 3)}}},
    *brothers(640, FEET + 8, D + 0.01, **{}),
    motes(),
  ],
  beats=[
    {'dur': 11000, 'ambient': ['crowd', 'jeer'], 'cam': cam([900, 530, 700], [920, 720, -3000]),
     'say': "On the day of the festival, all Egypt gathered to watch. The magicians threw down their ropes and staffs, and by their magic these seemed to crawl like snakes."},
    {'dur': 10000, 'ambient': ['crowd', 'roar'], 'sfx': [{'name': 'scratch', 'at': 600}, {'name': 'whoosh', 'at': 1400}], 'cam': cam([860, 530, 700], [880, 720, -3000]),
     'say': "Musa felt afraid, but was told: do not fear, throw what is in your hand. His staff swallowed up all that they had faked."},
    {'dur': 12000, 'ambient': ['crowd', 'air'], 'cam': cam([860, 525, 900], [880, 680, -3000]), 'pendingVerse': pv('7:117')},
  ])

# ── 125 · The magicians believe ───────────────────────────────────────────
scene('believe', 125, 'The Magicians Believe', 'إيمان السحرة',
  art=[ART, "Pharaoh's threat is told, not shown, and nothing of its carrying out is shown."],
  prompt="The great square in Egypt, the line of violet-grey lights of the magicians fallen in prostration on the sand and turning a clear soft white; Pharaoh's cold grey light standing high above them; the crowds silent; ink-wash and parchment texture.",
  world=NILE, ambient=['crowd', 'air'], base='#d8c8a8',
  layers=[
    heav([[12, 13, 10000], [13, 14, 10000], [14, 15, 12000]]),
    *egypt(),
    {'type': 'platform', 'depth': 0.2, 'x': 800, 'y': 712, 'w': P(0.2, 10), 'steps': 6, 'rise': P(0.2, 0.3), 'dais': P(0.2, 0.4), 'stone': '#c8a478', 'lit': '#ecd0a0', 'dark': '#6a4a30', 'ppu': 1},
    light([800, 712 - 6 * P(0.2, 0.3) - P(0.2, 0.4)], P(0.2), depth=0.201, **cold, at={'1': {'pose': 'raise'}}),
    {'type': 'crowd', 'area': [-200, 1800, -3400, -2200], 'y': [770, 730], 'count': 260, 'size': P(0.28), 'color': '#ffd8a0', 'dim': 0.4, 'glow': 0.3, 'mill': 2, 'speed': 0, 'flicker': 0.05},
    {'type': 'ground', 'depth': 0.36, 'y': 776, 'amp': 3, 'seed': 911, 'x0': -900, 'x1': 2500, 'color': '#d8bc94', 'color2': '#b09470'},
    *[light([880 + i * 80, FEET], P(D, 1.75), depth=D - 0.005, **mage, pose='bow', w=1, at={'0': {'color': '#f4ecf8', 'glow': 0.45, 'bright': 1.1}}) for i in range(5)],
    *brothers(620, FEET + 8, D + 0.01),
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['crowd', 'air'], 'cam': cam([920, 530, 700], [940, 720, -3000]),
     'say': "The magicians knew this was no magic. They fell down in prostration: we believe in the Lord of the worlds, the Lord of Musa and Harun."},
    {'dur': 10000, 'ambient': ['crowd', 'wind'], 'cam': cam([860, 520, 900], [860, 640, -3000]),
     'say': "Pharaoh threatened them with terrible punishment for believing without his permission. They did not waver: we will return to our Lord."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([920, 525, 800], [940, 690, -3000]), 'pendingVerse': pv('7:121-122')},
  ])

# ── 126 · The signs over Egypt ────────────────────────────────────────────
scene('plagues', 126, 'The Signs over Egypt', 'آيات على مصر',
  art=[ART, "The signs are those the Quran names (7:133): flood, locusts, lice, frogs and blood. They are shown on the land and the river, never on people."],
  prompt="Egypt under a sequence of signs: a storm and a flood spreading over green fields; a dark cloud of locusts streaming over yellowing wheat; the broad river running dark red under a heavy sky while the city stands silent; ink-wash and parchment texture.",
  world=NILE, ambient=['storm', 'rain'], base='#8a8a90',
  layers=[
    heav([[13, 14, 10000], [10, 11, 10000], [17, 18, 10000], [18, 18.6, 12000]]),
    *egypt(lit=0.05),
    {'type': 'storm', 'show': [0, 1], 'tone': 'dark', 'opacity': 0.8},
    {'type': 'ground', 'depth': 0.22, 'y': 740, 'amp': 4, 'seed': 920, 'x0': -900, 'x1': 2500, 'color': '#7a8a4a', 'color2': '#4a5a32', 'crop': 'wheat',
     'field': {'x0': -400, 'x1': 2000, 'y0': 742, 'y1': 830}, 'at': {'1': {'crop': 'dry', 'color': '#9a8a5a'}}},
    {'type': 'water', 'depth': 0.3, 'points': [[-1400, 800], [800, 806], [3000, 812]], 'w0': 90, 'w1': 90, 'reflect': [['0', '#8aa0a8'], ['1', '#3a4a5a']],
     'at': {'0': {'w0': 200, 'w1': 220}, '1': {'w0': 100, 'w1': 100}, '2': {'reflect': [['0', '#9a4a3a'], ['1', '#4a1a14']]}, '3': {'reflect': [['0', '#9a4a3a'], ['1', '#4a1a14']]}}},
    dust(box=(-1400, 200, -6000, 3000, 800, -800), count=2400, size=5, color='#3a2a1a', opacity=0.55, wind=(60, -6, 0), swirl=120, blend='normal', show=[1, 2]),
    dust(box=(-1400, 200, -8000, 3000, 950, 600), count=500, size=3, color='#c8c8d0', opacity=0.4, wind=(-10, -90, 0), show=[0, 1]),
  ],
  beats=[
    {'dur': 9000, 'ambient': ['storm', 'rain'], 'sfx': [{'name': 'thunder', 'at': 2000}], 'world': {'light': 0.75}, 'cam': cam([800, 515, 1100], [800, 600, -3000]),
     'say': "Pharaoh still refused. So God sent signs upon Egypt, one after another: a flood,"},
    {'dur': 9000, 'ambient': ['wind', 'rustle'], 'world': {'light': 0.9}, 'cam': cam([820, 515, 1050], [820, 610, -3000]),
     'say': "locusts that stripped the fields, lice and frogs,"},
    {'dur': 10000, 'ambient': ['wind', 'water'], 'world': {'light': 0.8}, 'cam': cam([800, 515, 1100], [800, 610, -3000]),
     'say': "and the river turned to blood. Each time, Pharaoh begged Musa to pray for it to end, and each time he broke his word."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'world': {'light': 0.8}, 'cam': cam([800, 515, 1100], [800, 600, -3000]), 'pendingVerse': pv('7:133')},
  ])

# ── 127 · By night ────────────────────────────────────────────────────────
scene('exodus', 127, 'By Night', 'الرحيل ليلا',
  art=[ART, "The Children of Israel appear as a long river of small warm lights."],
  prompt="An Egyptian city gate under a bright moon, a long river of small warm lights flowing out through it and away across the moonlit desert toward the east, two steady white lights at their head; ink-wash and parchment texture.",
  world=NIGHT, ambient=['wind', 'voices'], base='#141824',
  layers=[
    heav([[22, 23, 10000], [23, 24, 10000], [0, 0.8, 12000]], horizon=640),
    {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 40, 'seed': 930, 'sharp': 0.4, 'color': '#2e2a3a', 'haze': 0.3, 'fog': 0.4},
    {'type': 'town', 'depth': 0.12, 'y': 690, 'x0': 900, 'x1': 2000, 's': P(0.12, 1) / 30, 'grade': 'city', 'night': True, 'lit': 0.25, 'haze': '#24202e', 'seed': 931},
    {'type': 'facade', 'depth': 0.16, 'x': 1240, 'y': 712, 'w': P(0.16, 26), 'h': P(0.16, 12), 'gate': {'w': P(0.16, 5), 'h': P(0.16, 7)}, 'towers': True, 'stone': '#8a8070', 'style': 'pylon', 'ppu': 0.8},
    {'type': 'dunes', 'depth': 0.2, 'y': 740, 'amp': 10, 'count': 8, 'seed': 932, 'lit': '#7a7088', 'body': '#4a4058', 'shade': '#221c30'},
    {'type': 'crowd', 'area': [-400, 1240, -4200, -2800], 'y': [790, 712], 'count': 600, 'size': P(0.24), 'color': '#ffe0b0', 'dim': 0.2, 'glow': 0.5,
     'flow': [-1, 0], 'speed': 30, 'mill': 2, 'flicker': 0.1},
    *brothers(700, 770, 0.36, day=False, pose='walk', path=[[820, 772], [560, 766]], dur=30000),
    {'type': 'dunes', 'depth': 0.4, 'y': 860, 'amp': 30, 'count': 5, 'seed': 933, 'lit': '#6a6078', 'body': '#3a3048', 'shade': '#1a1428'},
    motes(0.14),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['wind', 'voices'], 'cam': cam([900, 510, 1000], [900, 600, -3000]),
     'say': "Then God told Musa: travel by night with My servants, for you will be pursued."},
    {'dur': 11000, 'ambient': ['wind', 'voices'], 'cam': cam([600, 515, 800], [560, 640, -3000]),
     'say': "So the Children of Israel slipped out of Egypt in the dark, a great river of people following Musa and Harun toward the sea."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([760, 510, 1000], [760, 600, -3000]), 'pendingVerse': pv('26:52')},
  ])

# ── 128 · The sea parts ───────────────────────────────────────────────────
WALL_H = P(0.24, 22)
walls = [
    {'type': 'seawall', 'show': [2, None], 'depth': 0.24, 'x0': -900, 'x1': 760, 'y': 760, 'h': WALL_H, 'face': 1, 'seed': 4, 'ppu': 0.6,
     'at': {'2': {'move': {'path': [[300, 360, 0], [300, 120, 0], [0, 0, 0]], 'dur': 6500, 'delay': 600}}, '3': {'move': {'path': [[0, 0, 0]], 'dur': 1}}}},
    {'type': 'seawall', 'show': [2, None], 'depth': 0.241, 'x0': 840, 'x1': 2500, 'y': 760, 'h': WALL_H, 'face': -1, 'seed': 7, 'ppu': 0.6,
     'at': {'2': {'move': {'path': [[-300, 360, 0], [-300, 120, 0], [0, 0, 0]], 'dur': 6500, 'delay': 600}}, '3': {'move': {'path': [[0, 0, 0]], 'dur': 1}}}},
]
calm_sea = {'type': 'water', 'show': [0, 3], 'depth': 0.24, 'points': [[-1600, 742], [800, 746], [3200, 750]], 'w0': 70, 'w1': 70, 'reflect': [['0', '#b8ccd8'], ['1', '#3a5a72']]}
far_sea = {'type': 'water', 'depth': 0.08, 'points': [[-6000, 668], [800, 670], [8000, 672]], 'w0': 40, 'w1': 40, 'reflect': [['0', '#a8bccb'], ['1', '#4a6a82']]}
scene('sea', 128, 'The Sea Parts', 'انفلاق البحر',
  art=[ART, "The walls of water are drawn as the Quran describes them, each part like a great mountain (26:63)."],
  prompt="Dawn on a desert shore, a great multitude of small warm lights pressed against the sea, a dust cloud of an army on the horizon behind; a steady white light raising a staff; then the sea split from shore to far shore, two towering walls of green-blue water with streaming foam, and a dry path of wet sand running between them toward distant mountains, the river of lights flowing in; ink-wash and parchment texture.",
  world=SEA, ambient=['sea', 'wind'], base='#8a98a8',
  layers=[
    heav([[4.8, 5.6, 10000], [5.6, 6.2, 10000], [6.2, 7, 12000], [7, 7.6, 12000]], horizon=660),
    {'type': 'ridge', 'depth': 0.03, 'y': 660, 'amp': 40, 'seed': 940, 'sharp': 0.5, 'color': '#6a6478', 'haze': 0.4, 'fog': 0.5},
    far_sea,
    {'type': 'ground', 'show': [2, None], 'depth': 0.235, 'y': 742, 'amp': 2, 'seed': 941, 'x0': 700, 'x1': 900, 'color': '#8a7a62', 'color2': '#4a4234'},
    calm_sea,
    *walls,
    {'type': 'crowd', 'kind': 'army', 'show': [0, 2], 'area': [1500, 2600, -9000, -7000], 'y': [700, 690], 'rows': 6, 'cols': 30, 'size': P(0.11), 'color': '#c8b8a8',
     'dim': 0.3, 'glow': 0.3, 'flow': [-1, 0], 'speed': 30},
    dust(box=(1600, 0, -11000, 4200, 700, -6000), count=400, size=40, color='#c8a888', opacity=0.25, wind=(-60, -10, 0), blend='normal', show=[0, 2]),
    {'type': 'ground', 'depth': 0.3, 'y': 760, 'amp': 6, 'seed': 942, 'x0': -900, 'x1': 2500, 'color': '#c8b090', 'color2': '#8a7458'},
    {'type': 'crowd', 'area': [-200, 1800, -2200, -1400], 'y': [FEET + 10, 770], 'count': 320, 'size': P(0.36), 'color': '#ffe0b0', 'dim': 0.45, 'glow': 0.1, 'mill': 4, 'speed': 0, 'flicker': 0.15,
     'at': {'3': {'area': [740, 860, -9000, -1400], 'flow': [0, -1], 'speed': 60, 'mill': 1}}},
    *brothers(800, FEET + 20, 0.44, at={'2': {'pose': 'raise'}}),
    motes(0.2),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['sea', 'wind'], 'cam': cam([800, 515, 1000], [800, 620, -3000]),
     'say': "At sunrise they reached the sea, and saw Pharaoh's army coming after them. We are overtaken! the people cried."},
    {'dur': 9000, 'ambient': ['sea', 'crowd'], 'cam': cam([800, 520, 800], [800, 680, -3000]),
     'say': "No! said Musa. My Lord is with me; He will guide me."},
    {'dur': 11000, 'ambient': ['sea', 'roar'], 'sfx': [{'name': 'swell', 'at': 400}, {'name': 'wave', 'at': 2400}, {'name': 'rumble', 'at': 3000}], 'world': {'shake': 1.0},
     'cam': cam([800, 470, 1250], [800, 470, -3000]),
     'say': "God told him: strike the sea with your staff. And the sea split apart, each side like a great mountain."},
    {'dur': 12000, 'ambient': ['sea', 'voices'], 'world': {'shake': 0.3}, 'cam': cam([800, 470, 1250], [800, 470, -3000]), 'pendingVerse': pv('26:63')},
  ])

# ── 129 · The sea closes ──────────────────────────────────────────────────
closing = [
    {**walls[0], 'show': None, 'at': {'1': {'move': {'path': [[0, 0, 0], [300, 120, 0], [300, 400, 0]], 'dur': 5000, 'delay': 1200}}, '2': {'move': {'path': [[300, 400, 0]], 'dur': 1}}, '3': {'move': {'path': [[300, 400, 0]], 'dur': 1}}}},
    {**walls[1], 'show': None, 'at': {'1': {'move': {'path': [[0, 0, 0], [-300, 120, 0], [-300, 400, 0]], 'dur': 5000, 'delay': 1200}}, '2': {'move': {'path': [[-300, 400, 0]], 'dur': 1}}, '3': {'move': {'path': [[-300, 400, 0]], 'dur': 1}}}},
]
for w in closing:
    w['show'] = [0, 2]
scene('closes', 129, 'The Sea Closes', 'غرق فرعون',
  art=[ART, "Nothing of the drowning is shown: the waters close and the lights of the army go out. Pharaoh's last words are told as the Quran tells them (10:90–92)."],
  prompt="The parted sea seen from the shore, two towering walls of water and a path of wet sand between them, the far end of a river of warm lights already on the far shore; ranks of grey lights of an army marching into the path; then the walls fall together in a great white crash and the grey lights are gone; then a calm sea under a pale sky; ink-wash and parchment texture.",
  world=SEA, ambient=['sea', 'army'], base='#8a98a8',
  layers=[
    heav([[7.6, 8.2, 10000], [8.2, 8.8, 10000], [8.8, 9.4, 10000], [9.4, 10, 12000]], horizon=660),
    {'type': 'ridge', 'depth': 0.03, 'y': 660, 'amp': 40, 'seed': 940, 'sharp': 0.5, 'color': '#6a6478', 'haze': 0.4, 'fog': 0.5},
    far_sea,
    {'type': 'ground', 'show': [0, 1], 'depth': 0.235, 'y': 742, 'amp': 2, 'seed': 941, 'x0': 700, 'x1': 900, 'color': '#8a7a62', 'color2': '#4a4234'},
    {**calm_sea, 'show': [2, None]},
    *closing,
    {'type': 'crowd', 'kind': 'army', 'area': [740, 860, -9000, -2600], 'y': [770, 700], 'rows': 30, 'cols': 3, 'size': P(0.3), 'color': '#c8b8a8', 'dim': 0.3, 'glow': 0.3,
     'flow': [0, -1], 'speed': 40, 'at': {'1': {'out': 1, 'outDur': 4500, 'speed': 0}, '2': {'out': 1, 'outDur': 1}, '3': {'out': 1, 'outDur': 1}}},
    {'type': 'flash', 'show': [1, 2], 'color': '#eef6f8', 'peak': 0.6, 'delay': 3600, 'rise': 300, 'dur': 2600},
    {'type': 'ground', 'depth': 0.3, 'y': 760, 'amp': 6, 'seed': 942, 'x0': -900, 'x1': 2500, 'color': '#c8b090', 'color2': '#8a7458'},
    dust(box=(-1400, 100, -6000, 3000, 900, -1500), count=600, size=6, color='#eef6f8', opacity=0.4, wind=(0, 30, 0), swirl=80, show=[1, 2]),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['sea', 'army'], 'cam': cam([800, 470, 1250], [800, 470, -3000]),
     'say': "When the last of the Children of Israel had crossed, Pharaoh and his army followed them into the sea."},
    {'dur': 10000, 'ambient': ['sea', 'roar'], 'sfx': [{'name': 'wave', 'at': 1400}, {'name': 'thunder', 'at': 3800}, {'name': 'rumble', 'at': 4000}], 'world': {'shake': 1.4},
     'cam': cam([800, 470, 1250], [800, 470, -3000]),
     'say': "Then the waters closed over them, and the lights of the army went out."},
    {'dur': 10000, 'ambient': ['sea', 'wind'], 'world': {'shake': 0.3}, 'cam': cam([800, 500, 1100], [800, 560, -3000]),
     'say': "As the sea took him, Pharaoh cried out: I believe in the God of the Children of Israel! But it was too late for belief."},
    {'dur': 12000, 'ambient': ['sea', 'air'], 'cam': cam([800, 500, 1100], [800, 560, -3000]), 'pendingVerse': pv('10:92')},
  ])

# ── 130 · The far shore ───────────────────────────────────────────────────
scene('shore', 130, 'Safe on the Far Shore', 'النجاة',
  art=[ART],
  prompt="Morning on the far shore of a calm blue sea, the river of small warm lights resting on the sand below red mountains, two steady white lights among them, one bowed in thanks; the water quiet and shining; ink-wash and parchment texture.",
  world=SEA, ambient=['sea', 'voices'], base='#a8b4c0',
  layers=[
    heav([[8, 9, 10000], [9, 10, 10000], [10, 11, 12000]], horizon=640),
    {'type': 'ridge', 'depth': 0.04, 'y': 640, 'amp': 30, 'seed': 950, 'sharp': 0.3, 'color': '#7a8494', 'haze': 0.4, 'fog': 0.5},
    {'type': 'water', 'depth': 0.12, 'points': [[-4000, 690], [800, 694], [6000, 698]], 'w0': 70, 'w1': 70, 'reflect': [['0', '#c8dae4'], ['1', '#4a7a92']]},
    {'type': 'ground', 'depth': 0.2, 'y': 730, 'amp': 4, 'seed': 951, 'color': '#d8c0a0', 'color2': '#a88a6a'},
    {'type': 'peak', 'depth': 0.22, 'x': 1500, 'y': 420, 'w': 700, 'h': 360, 'color': '#8a5a4a', 'lit': '#c08a6a', 'seed': 952},
    {'type': 'crowd', 'area': [-300, 1900, -3200, -1500], 'y': [FEET + 4, 744], 'count': 300, 'size': P(0.33), 'color': '#ffe0b0', 'dim': 0.45, 'glow': 0.1, 'mill': 8, 'speed': 0, 'flicker': 0.1},
    light([800, FEET + 14], P(0.44, 1.8), depth=0.44, **prophet_d, at={'1': {'pose': 'bow', 'w': 1}}),
    light([740, FEET + 16], P(0.44, 1.8), depth=0.44, **{**prophet_d, 'color': '#f8f2e6'}),
    motes(0.2),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['sea', 'voices'], 'cam': cam([800, 515, 900], [800, 660, -3000]),
     'say': "On the far shore, the Children of Israel watched the calm sea where Pharaoh's army had been."},
    {'dur': 10000, 'ambient': ['sea', 'air'], 'cam': cam([780, 530, 600], [780, 760, -3000]),
     'say': "They were free. Musa bowed down in thanks to the One who had saved them."},
    {'dur': 12000, 'ambient': ['sea', 'air'], 'cam': cam([800, 515, 900], [800, 660, -3000]), 'pendingVerse': pv('2:50')},
  ])

write_chapter(C12 + 'chapter.json', {
    'number': 12, 'title': 'Musa and Pharaoh', 'arabic': 'موسى وفرعون', 'nodes': ['harun'],
    'parts': [{'title': 'The Signs', 'from': O(122), 'to': O(126)}, {'title': 'The Sea', 'from': O(127), 'to': O(130)}]})
print('c12 ok')
