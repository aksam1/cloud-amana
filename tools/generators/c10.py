from base import *

# Chapter 10 · Ayyub and Shu'ayb. Built at true scale: a person of 1.7 m is 255 × depth design units tall,
# so at the subject plane (depth 0.42) a grown man is about 107, a 1 m brazier 63, a 2 m camel's hump 84.
C10 = ROOT + 'src/story/chapters/c10/'
os.makedirs(C10, exist_ok=True)


def scene(sid, order, node, title, arabic, art, prompt, world, layers, beats, ambient, base='#1a1820', dissolve=2400):
    order = ORDER.get(sid, order)
    s = {'id': sid, 'chapter': 10, 'order': order, 'node': node, 'title': title, 'arabic': arabic, 'source': 'quran', 'ayahs': [], 'art': art,
         'ambient': ambient, 'base': base, 'captions': 'parchment', 'renderer': 'gl', 'pen': True, 'dissolve': dissolve, 'world': world,
         'cam': beats[0]['cam'], 'imagePrompt': prompt, 'layers': layers, 'beats': beats}
    open(C10 + f's{order}-{sid}.json', 'w').write(dump(s))


def pv(ref, part=None):
    v = {'ref': ref, 'place': 'sky'}
    if part:
        v['part'] = part
    return v


P = lambda d, m=1.7: round(m * 150 * d)          # a height of m metres at depth d, in design units

HILLS = {'fog': '#c8c0b0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.0, 'rays': 0, 'bloom': 0.65, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
SAND = {'fog': '#dcc0a0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.05, 'rays': 0, 'bloom': 0.6, 'haze': 0.2, 'hazeY': 0.62, 'shake': 0.3, 'dof': 0}
prophet = dict(color='#fffaf0', glow=0.35, bright=1.1, solid=0.5)
dim = dict(color='#ecc49a', glow=0.25, bright=0.95, solid=0.6)
SUN = {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 300, 'size': 34}
MOON = {'rise': 19, 'set': 6.5, 'x0': 1300, 'x1': 300, 'peak': 340, 'size': 24}
motes = lambda opacity=0.28, **kw: dust(box=(-1400, 200, -8000, 3000, 950, 600), count=400, size=2.6, color='#fff0d8', opacity=opacity, wind=(4, -2, 0), **kw)
D = 0.42                                          # the subject plane
FEET = 792                                        # where people stand on it


def heav(tods, sun=SUN, moon=None, horizon=630):
    t0, *rest = tods
    h = {'type': 'heavens', 'horizon': horizon, 'tod': t0, 'sun': sun}
    if moon:
        h['moon'] = moon
    if rest:
        h['at'] = {str(i + 1): {'tod': t} for i, t in enumerate(rest) if t}
    return h


def near_grass(seed=704, **kw):
    return {'type': 'ground', 'depth': 0.66, 'y': 884, 'amp': 10, 'seed': seed, 'color': '#5a6a3a', 'color2': '#3a4a2a', 'grass': True, 'grassColor': '#7a8a4a', 'wind': 1, **kw}


# ── Ayyub's land: a wheat plain under basalt hills, his farmhouse, herds ────────────────
GREEN = {'color': '#a89a52', 'color2': '#6a6034', 'grass': True, 'grassColor': '#d0b85a', 'cracks': False}
DRY = {'color': '#a08a62', 'color2': '#7a6444', 'grass': False, 'cracks': True}


def land(state='green'):
    g = GREEN if state == 'green' else DRY
    return [
        {'type': 'ridge', 'depth': 0.05, 'y': 630, 'amp': 34, 'seed': 700, 'sharp': 0.5, 'color': '#545a68', 'haze': 0.35, 'fog': 0.4},
        {'type': 'ground', 'depth': 0.12, 'y': 668, 'amp': 18, 'seed': 701, **g},
        {'type': 'tree', 'depth': 0.2, 'x': 330, 'y': 708, 'h': P(0.2, 6.5), 'kind': 'living' if state == 'green' else 'bare', 'seed': 702},
        {'type': 'tree', 'depth': 0.22, 'x': 1330, 'y': 716, 'h': P(0.22, 7), 'kind': 'living' if state == 'green' else 'bare', 'seed': 703},
        {'type': 'ground', 'depth': 0.3, 'y': 752, 'amp': 8, 'seed': 705, 'x0': -600, 'x1': 2200, **g},
    ]


def tent(lit=True, dark_from=None, **kw):
    """Ayyub's farmhouse of black basalt (the stone of the Hauran), its door lit or dark."""
    door = lambda on: [{'x': 760, 'w': P(0.36, 1.1), 'h': P(0.36, 2), 'lit': on}]
    h = {'type': 'facade', 'depth': 0.36, 'x': 700, 'y': 778, 'w': P(0.36, 9), 'h': P(0.36, 3.6), 'stone': '#4a4a54', 'light': 0.8, 'doors': door(lit), 'ppu': 0.9, **kw}
    if dark_from is not None:
        h['at'] = {str(dark_from): {'doors': door(False)}}
    return h


def herd(n=1, show=None):
    """Sheep (0.9 m) and cows (1.4 m) grazing at depth 0.3; `n` 2 doubles them."""
    pairs = []
    xs = [1180, 1250, 1320, 1390, 1460, 1530, 1600]
    for i, x in enumerate(xs):
        pairs.append({'kind': 'sheep', 'solo': True, 's': 0.62, 'path': [[x, 770 + (i % 2) * 8]], 'face': -1 if i % 3 else 1})
    for x in (1220, 1380, 1540):
        pairs.append({'kind': 'cow', 'solo': True, 's': 0.82, 'path': [[x, 784]], 'face': -1})
    if n > 1:
        for i, x in enumerate([1200, 1270, 1340, 1410, 1480, 1550, 1620]):
            pairs.append({'kind': 'sheep', 'solo': True, 's': 0.62, 'path': [[x + 30, 794 + (i % 2) * 6]], 'face': 1 if i % 2 else -1})
        for x in (1300, 1460, 1620):
            pairs.append({'kind': 'cow', 'solo': True, 's': 0.82, 'path': [[x, 806]], 'face': 1})
    h = {'type': 'animals', 'depth': 0.3, 'fade': 'none', 'area': [1100, 680, 1720, 830], 'pairs': pairs}
    if show:
        h['show'] = show
    return h


def children(count=6, x0=1010, x1=1200, **kw):
    return {'type': 'crowd', 'area': [x0, x1, -1400, -1340], 'y': FEET + 2, 'count': count, 'size': 62, 'color': '#fff0d8', 'dim': 0,
            'glow': 0.3, 'mill': 4, 'speed': 0, 'flicker': 0.05, **kw}


ayyub = lambda **kw: light([900, FEET], P(D), depth=D, **{**prophet, **kw})
wife = lambda x=960, **kw: light([x, FEET + 2], P(D, 1.6), depth=D, **{**dim, **kw})
cam_wide = cam([1020, 520, 900], [1060, 640, -3000])
cam_near = cam([960, 540, 620], [990, 760, -3000])
cam_verse = cam([1000, 525, 820], [1030, 690, -3000])

ART_AYYUB = "Ayyub appears only as a steady light; his wife and children as dim figures of light. His wealth, herds and family before the trial are told in the commentaries; the Quran names his trial, his prayer and his patience. His illness is never shown: his light only dims. His land is drawn as the wheat plains of the Hauran, where tradition places him; his farmhouse is imagined."

# ── 103 · The blessed years ───────────────────────────────────────────────
scene('blessed', 103, 'ayyub', 'The Blessed Years', 'سنوات النعمة',
  art=[ART_AYYUB],
  prompt="A golden wheat plain under blue-grey basalt hills at morning, a farmhouse of black stone, flocks of sheep and a few cattle grazing, a steady white light standing before the farmhouse with a dim amber light beside him and a cluster of small amber lights of children; days passing in a time-lapse sky; ink-wash and parchment texture.",
  world=HILLS, ambient=['sheep', 'birds'], base='#c8c0b0',
  layers=[
    heav([[6.2, 9, 10000, 2], [9, 15, 10000, 3], [15, 16.4, 12000]]),
    *land(), tent(), herd(), children(),
    ayyub(at={'1': {'pose': 'kneel'}}), wife(),
    near_grass(), motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['sheep', 'birds'], 'cam': cam_wide,
     'say': "Ayyub was a prophet to whom God had given much: land, flocks and herds, many children and good health."},
    {'dur': 10000, 'ambient': ['sheep', 'air'], 'cam': cam_near,
     'say': "He was grateful for all of it, and gave freely to the poor and to travellers."},
    {'dur': 12000, 'ambient': ['air', 'birds'], 'cam': cam_verse, 'pendingVerse': pv('4:163', 'its naming of Job among those God inspired')},
  ])

# ── 104 · The trial ───────────────────────────────────────────────────────
scene('trial', 104, 'ayyub', 'The Trial', 'الابتلاء',
  art=[ART_AYYUB, "That his trial lasted years and that only his wife stayed with him are told in the commentaries. His children's lights simply go out."],
  prompt="The same wheat plain; the herds fade away, the trees wither, the wheat dries to cracked earth, and the small lights of children go out one by one; then years racing past in the sky while a dimmed grey light kneels before a dark farmhouse with one faithful amber light beside him; ink-wash and parchment texture.",
  world=HILLS, ambient=['wind', 'air'], base='#b8a890',
  layers=[
    heav([[9, 15, 10000, 2], [8, 18, 12000, 8], [17, 18.6, 12000]]),
    {'type': 'ridge', 'depth': 0.05, 'y': 630, 'amp': 34, 'seed': 700, 'sharp': 0.5, 'color': '#545a68', 'haze': 0.35, 'fog': 0.4, 'at': {'1': {'color': '#6a6060'}}},
    {'type': 'ground', 'depth': 0.12, 'y': 668, 'amp': 18, 'seed': 701, **GREEN, 'at': {'1': DRY}},
    {'type': 'tree', 'depth': 0.2, 'x': 330, 'y': 708, 'h': P(0.2, 6.5), 'kind': 'living', 'seed': 702, 'at': {'1': {'kind': 'bare'}}},
    {'type': 'tree', 'depth': 0.22, 'x': 1330, 'y': 716, 'h': P(0.22, 7), 'kind': 'living', 'seed': 703, 'at': {'1': {'kind': 'bare'}}},
    {'type': 'ground', 'depth': 0.3, 'y': 752, 'amp': 8, 'seed': 705, 'x0': -600, 'x1': 2200, **GREEN, 'at': {'1': DRY}},
    tent(dark_from=1),
    herd(show=[0, 1]),
    children(out=1, outDur=7500),
    ayyub(at={'1': {'pose': 'kneel', 'color': '#c8c8c8', 'glow': 0.15, 'bright': 0.75}}),
    wife(),
    near_grass(at={'1': {'color': '#8a7a52', 'color2': '#5a4a32', 'grassColor': '#a08a5a'}}), motes(opacity=0.2),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['wind', 'sheep'], 'cam': cam_wide,
     'say': "Then came the test. One after another, his herds, his harvests and his children were taken from him."},
    {'dur': 11000, 'ambient': ['wind'], 'world': {'light': 0.85}, 'cam': cam_near,
     'say': "Then illness struck him, and lasted for years. People kept away; only his wife stayed and cared for him. Still he praised God."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'world': {'light': 0.85}, 'cam': cam_verse, 'pendingVerse': pv('21:83')},
  ])

# ── 105 · Strike the ground ───────────────────────────────────────────────
scene('strike', 105, 'ayyub', 'Strike the Ground', 'عين الشفاء',
  art=[ART_AYYUB, "The spring is shown as the Quran describes it (38:42): water to wash in and to drink."],
  prompt="A dry cracked plain at dawn, a grey dimmed light kneeling before a dark farmhouse, a single amber light beside him; he stands, and at his feet a clear spring wells up and spreads, catching the first sun; his light grows bright and white; ink-wash and parchment texture.",
  world=HILLS, ambient=['wind', 'air'], base='#b8a890',
  layers=[
    heav([[4.8, 5.8, 10000], [5.8, 6.8, 11000], [6.8, 7.6, 12000]]),
    *land('dry'), tent(lit=False),
    {'type': 'spring', 'depth': D + 0.005, 'pos': [910, FEET + 6], 'r': 70, 'squash': 0.26, 'well': 0,
     'at': {'1': {'rise': [0, 1, 6000, 600], 'rim': 1}, '2': {'well': 1, 'rim': 1}}},
    ayyub(pose='kneel', color='#c8c8c8', glow=0.15, bright=0.75,
          at={'1': {'pose': 'stand', 'color': '#fffaf0', 'glow': 0.6, 'bright': 1.35}}),
    wife(1000),
    near_grass(color='#8a7a52', color2='#5a4a32', grassColor='#a08a5a'), motes(opacity=0.2),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['wind', 'air'], 'cam': cam_near,
     'say': "At last Ayyub called to his Lord, and God answered him: strike the ground with your foot."},
    {'dur': 11000, 'ambient': ['spring', 'birds'], 'sfx': [{'name': 'swell', 'at': 600}], 'cam': cam([940, 540, 520], [960, 790, -3000]),
     'say': "A cool spring welled up where he stood. He washed in it and drank from it, and his health returned."},
    {'dur': 12000, 'ambient': ['spring', 'air'], 'cam': cam_verse, 'pendingVerse': pv('38:42')},
  ])

# ── 106 · Restored ────────────────────────────────────────────────────────
scene('restored', 106, 'ayyub', 'Restored', 'العطاء بعد الصبر',
  art=[ART_AYYUB, "The Quran tells that his family was given back to him, and as many again with them (38:43); the rest is imagined."],
  prompt="The plain golden with wheat again at morning, trees in leaf, the farmhouse lamp lit, a spring shining beside it, flocks and herds twice as many as before, a bright steady light and a dim amber light beside him among many small lights of children; ink-wash and parchment texture.",
  world=HILLS, ambient=['sheep', 'birds'], base='#c8c0b0',
  layers=[
    heav([[7, 10, 10000, 2], [10, 13, 10000], [13, 16, 10000, 2], [16, 17.4, 12000]]),
    *land(), tent(),
    {'type': 'spring', 'depth': D - 0.04, 'pos': [790, FEET - 16], 'r': 60, 'squash': 0.26, 'well': 1, 'rim': 1},
    herd(2),
    children(12, 1010, 1300),
    ayyub(), wife(),
    near_grass(), motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['sheep', 'birds'], 'cam': cam_wide,
     'say': "God gave him back his family, and as many again with them."},
    {'dur': 12000, 'ambient': ['sheep', 'air'], 'cam': cam_verse, 'pendingVerse': pv('38:43')},
    {'dur': 10000, 'ambient': ['birds', 'air'], 'cam': cam_near,
     'say': "His flocks and fields flourished again. Through everything, he had been patient, and he never stopped turning back to God."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam_verse, 'pendingVerse': pv('38:44', 'its closing words: "Indeed, We found him patient, an excellent servant…"')},
  ])

# ── Madyan: a trading town where the caravan roads meet ────────────────────
def madyan(lit=0.3, empty=False):
    return [
        {'type': 'ridge', 'depth': 0.04, 'y': 610, 'amp': 70, 'seed': 720, 'sharp': 0.6, 'color': '#8a5a4a', 'haze': 0.4, 'fog': 0.4},
        {'type': 'ridge', 'depth': 0.07, 'y': 640, 'amp': 40, 'seed': 721, 'sharp': 0.5, 'color': '#a8705a', 'haze': 0.3, 'fog': 0.3},
        {'type': 'town', 'depth': 0.13, 'y': 690, 'x0': 120, 'x1': 1480, 's': P(0.13, 1) / 30, 'grade': 'town', 'lit': lit, 'haze': '#c8a888', 'seed': 722},
        {'type': 'ground', 'depth': 0.16, 'y': 700, 'amp': 6, 'seed': 723, 'color': '#c8a078', 'color2': '#9a7050'},
        {'type': 'palms', 'depth': 0.22, 'items': [{'x': 180, 'y': 726, 'h': P(0.22, 8), 'lean': 0.05}, {'x': 270, 'y': 724, 'h': P(0.22, 9), 'lean': -0.04},
                                                   {'x': 1340, 'y': 726, 'h': P(0.22, 8.5), 'lean': 0.06}, {'x': 1440, 'y': 724, 'h': P(0.22, 9), 'lean': -0.03}], 'seed': 724},
        {'type': 'ground', 'depth': 0.3, 'y': 754, 'amp': 4, 'seed': 725, 'x0': -600, 'x1': 2200, 'color': '#d0a880', 'color2': '#a07a58'},
    ]


def stalls(grey=0):
    k = round(3.44 * 0.36, 2)
    return {'type': 'stalls', 'depth': 0.36, 's': k, 'grey': grey, 'items': [
        {'x': 330, 'y': 778, 'w': 120, 'color': '#b8644a'}, {'x': 520, 'y': 780, 'w': 110, 'color': '#5a7a8a'},
        {'x': 1130, 'y': 780, 'w': 120, 'color': '#8a6a3a'}, {'x': 1320, 'y': 778, 'w': 110, 'color': '#7a4a5a'}]}


def market(count=50, **kw):
    return {'type': 'crowd', 'area': [220, 1380, -1900, -1450], 'y': [FEET + 6, FEET - 14], 'count': count, 'size': P(0.37), 'color': '#ffd8a0',
            'dim': 0.25, 'glow': 0.45, 'mill': 14, 'speed': 0, 'flicker': 0.15, **kw}


def balance(tilt=12, **kw):
    # a merchant's standing balance, 1.5 m on its post, its beam a metre across
    return {'type': 'balance', 'depth': D, 'x': 1000, 'y': FEET, 'h': P(D, 1.5), 'w': P(D, 1.0), 'tilt': tilt, 'area': [900, 640, 1100, 800], **kw}


camels = {'type': 'animals', 'depth': 0.14, 'size': 0.46, 'fade': 'none', 'area': [200, 600, 900, 720],
          'pairs': [{'kind': 'camel', 'path': [[x, 708]]} for x in (300, 400, 500, 600)], 'move': {'path': [[260, 0, 0]], 'dur': 30000}}
shuayb = lambda x=760, **kw: light([x, FEET + 4], P(D + 0.01), depth=D + 0.01, **{**prophet, **kw})
merchant = lambda **kw: light([1066, FEET], P(D - 0.005, 1.75), depth=D - 0.005, **{**dim, **kw})
ART_SHUAYB = "Shu'ayb appears only as a steady light; the people of Madyan as dim figures of light. The look of the town and its market is imagined."

# ── 107 · Madyan ──────────────────────────────────────────────────────────
scene('madyan', 107, 'shuayb', 'Madyan', 'مدين',
  art=[ART_SHUAYB, "Their cheating with measure and weight is told in the Quran (7:85, 11:84); it is shown only as a tipped balance."],
  prompt="A trading town of flat-roofed houses below red sandstone mountains, palms at its edge, a busy market of striped awnings and dim amber lights, a caravan of camels arriving; a merchant's bronze balance in the foreground tipped unfairly; ink-wash and parchment texture.",
  world=SAND, ambient=['city', 'desert'], base='#d8c0a0',
  layers=[
    heav([[8.5, 10, 10000], [10, 11.5, 10000], [11.5, 13, 12000]]),
    *madyan(), camels, stalls(), market(),
    balance(show=[1, None]), merchant(show=[1, None]),
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['city', 'herd'], 'cam': cam([800, 515, 1100], [820, 600, -3000]),
     'say': "Madyan was a rich trading town where the caravan roads met."},
    {'dur': 10000, 'ambient': ['city', 'voices'], 'cam': cam([960, 540, 560], [1000, 760, -3000]),
     'say': "But its traders cheated. They gave short measure and short weight, and robbed travellers on the roads."},
    {'dur': 12000, 'ambient': ['city', 'air'], 'cam': cam([860, 522, 900], [880, 660, -3000]), 'pendingVerse': pv('11:84', 'its opening: "And to Madyan [We sent] their brother Shu\'ayb…"')},
  ])

# ── 108 · Full measure ────────────────────────────────────────────────────
scene('measure', 108, 'shuayb', 'Give Full Measure', 'الأمانة في السوق',
  art=[ART_SHUAYB, "His words are given as the Quran gives them (26:181–183); the balance coming level stands for the fair measure he asked of them."],
  prompt="A sunlit market among striped awnings, a steady white light standing among dim amber lights of traders and buyers, beside him a bronze merchant's balance tipped to one side that slowly comes level; ink-wash and parchment texture.",
  world=SAND, ambient=['city', 'voices'], base='#d8c0a0',
  layers=[
    heav([[11, 12, 10000], [12, 13, 10000], [13, 14, 12000]]),
    *madyan(), stalls(), market(40, area=[220, 1380, -2100, -1650]),
    balance(at={'1': {'tilt': 0}}), merchant(),
    shuayb(at={'1': {'pose': 'raise'}}),
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['city', 'voices'], 'cam': cam([860, 540, 600], [880, 760, -3000]),
     'say': "God sent them one of their own, the prophet Shu'ayb."},
    {'dur': 11000, 'ambient': ['city', 'voices'], 'cam': cam([900, 545, 480], [930, 790, -3000]),
     'say': "Give full measure and full weight, he told them. Do not cheat people of what is theirs, and do not spread corruption in the land."},
    {'dur': 12000, 'ambient': ['city', 'air'], 'cam': cam([880, 530, 760], [900, 700, -3000]), 'pendingVerse': pv('26:181-182')},
  ])

# ── 109 · His answer ──────────────────────────────────────────────────────
scene('reform', 109, 'shuayb', "Shu'ayb's Answer", 'جواب شعيب',
  art=[ART_SHUAYB, "Their mockery is drawn as jagged strokes, never words."],
  prompt="A market square at late afternoon, a steady white light with a few small white lights of believers behind him, facing a crowd of dim amber lights; jagged dark strokes of mockery rising around him; ink-wash and parchment texture.",
  world=SAND, ambient=['crowd', 'jeer'], base='#d8c0a0',
  layers=[
    heav([[15, 16, 10000], [16, 17, 10000], [17, 17.8, 12000]]),
    *madyan(), stalls(),
    market(70, area=[900, 1500, -2000, -1500], flicker=0.4, mill=8),
    shuayb(x=880),
    *[light([820 - i * 50, FEET], P(D, 1.65), depth=D, color='#fff4e0', glow=0.3, bright=1.0, solid=0.5) for i in range(3)],
    {'type': 'jeers', 'show': [0, 2], 'center': [880, 520], 'from': [1240, 360], 'clear': [90, 120], 'count': 26, 'size': 36, 'period': 6},
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['crowd', 'jeer'], 'cam': cam([920, 530, 760], [950, 720, -3000]),
     'say': "They mocked him: does your prayer tell you how we may run our trade?"},
    {'dur': 10000, 'ambient': ['crowd', 'jeer'], 'cam': cam([900, 530, 700], [930, 730, -3000]),
     'say': "Their chiefs threatened to drive him and those who believed out of Madyan, unless they returned to the old ways."},
    {'dur': 12000, 'ambient': ['air', 'wind'], 'cam': cam([820, 530, 760], [840, 700, -3000]),
     'pendingVerse': pv('11:88', 'from "I only intend reform as much as I am able" to the end')},
  ])

# ── 110 · The day of the canopy ───────────────────────────────────────────
scene('canopy', 110, 'shuayb', 'The Day of the Canopy', 'السحابة السوداء',
  art=[ART_SHUAYB, "The Quran calls it the punishment of the day of the black cloud (26:189); that the people ran to its shade in the heat is from the commentaries. No one is shown harmed: their lights simply go out."],
  prompt="A trading town shimmering in fierce heat, a line of small white lights walking away into the hills; a great dark cloud spreading over the town and crowds of dim amber lights gathering beneath its shade; then a white flash and every amber light gone out, the town still; ink-wash and parchment texture.",
  world={**SAND, 'haze': 0.6}, ambient=['wind', 'desert'], base='#d8b890',
  layers=[
    heav([[11, 12.5, 10000], [12.5, 13.5, 10000], [13.5, 14, 9000], [14, 15, 12000]]),
    *madyan(),
    {'type': 'clouds', 'show': [1, None], 'depth': 0.08, 'y': 330, 'count': 7, 'color': '#3a3038', 'rim': '#8a6a5a', 'fog': 0.2, 'reveal': {'dir': 'right', 'dur': 6000}},
    {'type': 'tint', 'show': [1, None], 'color': '#3a2a2a', 'amount': 0.25},
    market(60, area=[300, 1400, -2400, -1700], at={'1': {'flow': [0.3, 0], 'speed': 18}, '2': {'out': 1, 'outDur': 2600, 'speed': 0}, '3': {'out': 1, 'outDur': 1}}),
    *[light([700 - i * 60, FEET], P(D, 1.65), depth=D, color='#fff4e0', glow=0.3, bright=1.0, solid=0.5, show=[0, 1], pose='walk',
            path=[[700 - i * 60, FEET], [80 - i * 60, FEET - 30]], dur=10000, delay=i * 200) for i in range(4)],
    shuayb(show=[0, 1], pose='walk', path=[[780, FEET + 4], [140, FEET - 26]], dur=10000),
    {'type': 'flash', 'show': [2, 3], 'color': '#fffaf0', 'peak': 0.7, 'delay': 500, 'rise': 200, 'dur': 2400},
    dust(box=(-1400, 300, -9000, 3000, 950, 0), count=500, size=4, color='#e8c8a0', opacity=0.3, wind=(-20, -4, 0), blend='normal'),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['desert', 'wind'], 'cam': cam([780, 520, 900], [760, 640, -3000]),
     'say': "Shu'ayb and those who believed left the town, saved by God's mercy."},
    {'dur': 10000, 'ambient': ['wind', 'crowd'], 'world': {'light': 0.8}, 'cam': cam([800, 505, 1150], [800, 560, -3000]),
     'say': "Then came a day of burning heat. A dark cloud appeared, and the people ran to its shade."},
    {'dur': 9000, 'ambient': ['wind'], 'sfx': [{'name': 'thunder', 'at': 500}, {'name': 'rumble', 'at': 900}], 'world': {'light': 0.7, 'shake': 1.4},
     'cam': cam([800, 505, 1150], [800, 560, -3000]),
     'say': "Then a mighty blast seized them, and their lights went out."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'world': {'light': 0.8, 'shake': 0.3}, 'cam': cam([800, 510, 1100], [800, 570, -3000]), 'pendingVerse': pv('26:189')},
  ])

# ── 111 · Shu'ayb turns away ──────────────────────────────────────────────
scene('lament', 111, 'shuayb', "Shu'ayb Turns Away", 'وداع مدين',
  art=[ART_SHUAYB],
  prompt="Dusk over an empty, unlit trading town below red mountains, its market awnings grey and still; on a rise in the foreground a steady white light and a few small white lights of believers look back at it before walking on; ink-wash and parchment texture.",
  world=SAND, ambient=['wind', 'air'], base='#a88a78',
  layers=[
    heav([[17.6, 18.4, 10000], [18.4, 19.2, 10000], [19.2, 20, 12000]], moon=MOON),
    *madyan(lit=0), stalls(grey=0.6),
    {'type': 'ridge', 'depth': 0.5, 'y': 860, 'amp': 30, 'seed': 730, 'sharp': 0.3, 'color': '#6a4a40', 'haze': 0},
    light([1160, 836], P(0.52), depth=0.52, **prophet),
    *[light([1240 + i * 56, 840], P(0.52, 1.65), depth=0.52, color='#fff4e0', glow=0.3, bright=1.0, solid=0.5) for i in range(3)],
    motes(opacity=0.18),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['wind'], 'cam': cam([800, 515, 1100], [800, 590, -3000]),
     'say': "Their houses stood empty, as if they had never lived in them."},
    {'dur': 10000, 'ambient': ['wind', 'air'], 'cam': cam([1040, 540, 600], [1080, 880, -3000]),
     'say': "Shu'ayb turned away from them. He had warned them as best he could; he did not grieve for a people who refused to believe."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([960, 525, 820], [1000, 760, -3000]), 'pendingVerse': pv('7:93')},
  ])

write_chapter(C10 + 'chapter.json', {
    'number': 10, 'title': "Ayyub and Shu'ayb", 'arabic': 'أيوب وشعيب', 'nodes': ['ayyub', 'shuayb'],
    'parts': [{'title': "Ayyub's Patience", 'from': O(103), 'to': O(106)}, {'title': "Shu'ayb and Madyan", 'from': O(107), 'to': O(111)}]})
print('c10 ok')
