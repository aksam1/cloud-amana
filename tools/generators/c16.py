from base import *
from rooms import room, front

# Chapter 16 · Zakariya, Yahya and Maryam. True scale: a person of 1.7 m is 255 × depth design units.
C16 = ROOT + 'src/story/chapters/c16/'
os.makedirs(C16, exist_ok=True)


def scene(sid, order, node, title, arabic, art, prompt, world, layers, beats, ambient, base='#1a1820', dissolve=2400):
    order = ORDER.get(sid, order)
    s = {'id': sid, 'chapter': 16, 'order': order, 'node': node, 'title': title, 'arabic': arabic, 'source': 'quran', 'ayahs': [], 'art': art,
         'ambient': ambient, 'base': base, 'captions': 'parchment', 'renderer': 'gl', 'pen': True, 'dissolve': dissolve, 'world': world,
         'cam': beats[0]['cam'], 'imagePrompt': prompt, 'layers': layers, 'beats': beats}
    open(C16 + f's{order}-{sid}.json', 'w').write(dump(s))


def pv(ref, part=None):
    v = {'ref': ref, 'place': 'sky'}
    if part:
        v['part'] = part
    return v


P = lambda d, m=1.7: round(m * 150 * d)
D = 0.42
FEET = 792
HILLS = {'fog': '#c8c0b0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.0, 'rays': 0, 'bloom': 0.65, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
NIGHT = {'fog': '#141824', 'fogNear': 6000, 'fogFar': 40000, 'light': 0.9, 'rays': 0, 'bloom': 0.85, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
TEMPLE = {'fog': '#2a2420', 'fogNear': 4000, 'fogFar': 30000, 'light': 0.95, 'rays': 0, 'bloom': 0.85, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
SAND = {'fog': '#dcc0a0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.05, 'rays': 0, 'bloom': 0.65, 'haze': 0.2, 'hazeY': 0.62, 'shake': 0.3, 'dof': 0}

prophet_d = dict(color='#fffaf0', glow=0.35, bright=1.1, solid=0.5)
prophet_n = dict(color='#fffaf0', glow=0.6, bright=1.35)
old = dict(color='#f0ece4', glow=0.45, bright=1.15, solid=0.4)             # Zakariya, white-haired
soft = dict(color='#fff4ea', glow=0.45, bright=1.15, solid=0.45)           # Maryam and her mother
dim = dict(color='#ecc49a', glow=0.2, bright=0.95, solid=0.6)
SUN = {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 300, 'size': 34}
MOON = {'rise': 19, 'set': 6.5, 'x0': 1300, 'x1': 300, 'peak': 340, 'size': 24}
motes = lambda opacity=0.28, **kw: dust(box=(-1400, 200, -8000, 3000, 950, 600), count=400, size=2.6, color='#fff0d8', opacity=opacity, wind=(4, -2, 0), **kw)


def heav(tods, sun=SUN, moon=MOON, horizon=630):
    t0, *rest = tods
    h = {'type': 'heavens', 'horizon': horizon, 'tod': t0, 'sun': sun, 'moon': moon}
    if rest:
        h['at'] = {str(i + 1): {'tod': t} for i, t in enumerate(rest) if t}
    return h


def babe(x, y, d, **kw):
    return light([x, y], P(d, 0.5), depth=d, pose='babe', w=1, color='#fffaf0', glow=0.7, bright=1.25, **kw)


def angel(x, z, y, size=170, count=1, **kw):
    """An angel as a column of light (never a figure): a crowd of one in the angels' kind."""
    return {'type': 'crowd', 'kind': 'angels', 'area': [x - 8, x + 8, z - 20, z + 20], 'y': [y, y], 'count': count, 'size': size,
            'color': '#fff4d8', 'dim': 0.05, 'glow': 0.9, 'mill': 0, 'speed': 0, 'flicker': 0.06, **kw}


def chamber(stone='#8a7258', lamp=True):
    """The prayer chamber (mihrab) of the temple: warm stone, an arched niche, an oil lamp."""
    out = [
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#1a1410'], [1, '#100c0a']]},
        {'type': 'facade', 'depth': 0.2, 'x': 800, 'y': 728, 'w': 2600, 'h': 900, 'stone': stone, 'light': 0.7,
         'doors': [{'x': 800, 'w': P(0.2, 2.6), 'h': P(0.2, 4.2), 'lit': True}, {'x': 1260, 'w': P(0.2, 1.4), 'h': P(0.2, 2.6)}]},
        {'type': 'floor', 'depth': 0.21, 'y': 730, 'vp': [800, 520], 'color': '#5a4a3a', 'color2': '#1e1812', 'lines': 10, 'gloss': 0.25, 'area': [-800, 724, 2400, 1350]},
        {'type': 'column', 'depth': 0.3, 'x': 520, 'y': 790, 'h': P(0.3, 7), 'w': P(0.3, 0.7), 'stone': '#c8a880', 'lit': '#f0dcb8', 'dark': '#5a4430'},
        {'type': 'column', 'depth': 0.3, 'x': 1080, 'y': 790, 'h': P(0.3, 7), 'w': P(0.3, 0.7), 'stone': '#c8a880', 'lit': '#f0dcb8', 'dark': '#5a4430'},
    ]
    if lamp:
        out += [{'type': 'light', 'kind': 'flame', 'depth': 0.36, 'pos': [960, 742], 'h': 10, 'color': '#ffc060', 'glow': 1.4}]
    return out


ART = "Prophets appear only as steady lights; Maryam and her mother as soft lights; the people as dim figures of light. Angels are columns of light, never figures. The look of the temple and the land is imagined."

# ── 159 · The vow ─────────────────────────────────────────────────────────
scene('vow', 159, 'zakariya', 'The Vow', 'نذر أم مريم',
  art=[ART, "Imran's wife is named Hannah in the commentaries."],
  prompt="A stone house among the hills of Jerusalem under a starry sky, one window lit; a soft light kneeling in prayer on the roof; then the grey of dawn, the soft light holding a tiny new light close, the temple's walls pale on the far hill; ink-wash and parchment texture.",
  world=NIGHT, ambient=['crickets', 'air'], base='#141824',
  layers=[
    heav([[23, 24, 10000], [4.8, 6, 12000], [6, 6.8, 12000]], horizon=640),
    {'type': 'ridge', 'depth': 0.04, 'y': 640, 'amp': 40, 'seed': 1300, 'sharp': 0.3, 'color': '#3a3a48', 'haze': 0.3, 'fog': 0.4, 'at': {'1': {'color': '#6a6870'}}},
    {'type': 'masonry', 'depth': 0.1, 'pos': [1180, 660], 'w': P(0.1, 40), 'h': P(0.1, 14), 'side': 30, 'courses': 14, 'blocks': 24, 'built': 1,
     'stone': '#c8bca8', 'stone2': '#d8ccb8', 'ink': '#5a5048'},
    {'type': 'town', 'depth': 0.14, 'y': 700, 'x0': 100, 'x1': 1500, 's': P(0.14, 1) / 30, 'grade': 'town', 'night': True, 'lit': 0.25, 'haze': '#24202e', 'seed': 1301},
    {'type': 'facade', 'depth': 0.32, 'x': 760, 'y': 790, 'w': P(0.32, 8), 'h': P(0.32, 4), 'stone': '#a89478', 'light': 0.7, 'doors': [{'x': 860, 'w': P(0.32, 1), 'h': P(0.32, 1.3), 'lit': True}], 'ppu': 0.9},
    light([700, 790 - P(0.32, 4)], P(0.322, 1.6), depth=0.322, **soft, pose='kneel'),
    babe(714, 790 - P(0.32, 4) - 10, 0.323, show=[1, None]),
    motes(0.12),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['crickets', 'air'], 'cam': cam([760, 500, 700], [740, 560, -3000]),
     'say': "In Jerusalem, the wife of Imran prayed: my Lord, I vow the child in my womb to Your service, freed for You alone. Accept it from me."},
    {'dur': 11000, 'ambient': ['birds', 'air'], 'cam': cam([740, 495, 520], [730, 520, -3000]),
     'say': "Her child was a girl. I have named her Maryam, she said, and I seek protection for her and her children from Satan, the outcast."},
    {'dur': 12000, 'ambient': ['birds', 'air'], 'cam': cam([760, 500, 700], [740, 560, -3000]), 'pendingVerse': pv('3:35')},
  ])

# ── 160 · The prayer chamber ──────────────────────────────────────────────
scene('mihrab', 160, 'zakariya', 'Fruit out of Season', 'رزق مريم',
  art=[ART, "That the fruit was of summer in winter and of winter in summer is from the commentaries on 3:37."],
  prompt="A warm stone prayer chamber in the temple, an arched doorway onto falling snow; a young soft light kneeling in prayer beside a shallow bowl of summer fruit glowing gold; an old white-haired steady light entering through the door and stopping in wonder; ink-wash and parchment texture.",
  world=TEMPLE, ambient=['echo', 'wind'], base='#14100c',
  layers=[
    *chamber(),
    {'type': 'fruit', 'depth': 0.43, 'x': 900, 'y': FEET + 12, 'w': P(0.43, 0.8), 'glow': 0.9, 'area': [800, 720, 1000, 820]},
    light([800, FEET + 4], P(0.42, 1.55), depth=0.42, **soft, pose='kneel'),
    light([800, 728], P(0.2), depth=0.201, **old, at={'0': {'pose': 'walk', 'path': [[800, 728], [800, 728]], 'dur': 1}, '1': {'pos': [660, 790], 'path': None}}),
    dust(box=(0, 100, -4100, 1600, 900, -3900), count=600, size=4, color='#f4f4ff', opacity=0.7, wind=(6, -40, 0), swirl=10),
    motes(0.18),
  ],
  beats=[
    {'dur': 11000, 'ambient': ['echo', 'wind'], 'cam': cam([840, 545, 300], [850, 940, -3000]),
     'say': "The temple's scholars drew lots with their pens to decide who would care for Maryam, and the lot fell to the prophet Zakariya. Whenever he came into her prayer chamber, he found food beside her: summer fruit in the depth of winter."},
    {'dur': 11000, 'ambient': ['echo', 'air'], 'cam': cam([800, 545, 300], [800, 920, -3000]),
     'say': "Maryam, where did this come from? he asked. It is from God, she said. God provides for whom He wills, without measure."},
    {'dur': 12000, 'ambient': ['echo', 'air'], 'cam': cam([800, 535, 560], [800, 840, -3000]), 'pendingVerse': pv('3:37', 'from "Every time Zakariya entered upon her in the prayer chamber"')},
  ])

# ── 161 · Zakariya's prayer ───────────────────────────────────────────────
scene('nightprayer', 161, 'zakariya', "Zakariya's Prayer", 'دعاء زكريا',
  art=[ART],
  prompt="The temple's prayer chamber deep at night, a single beam of moonlight through a high window, a small oil lamp; an old steady light kneeling, praying in a whisper, his glow white like his hair; ink-wash and parchment texture.",
  world={**TEMPLE, 'light': 0.85}, ambient=['air', 'crickets'], base='#0c0a08',
  layers=[
    *chamber('#6a5a48'),
    {'type': 'beam', 'depth': 0.34, 'x': 820, 'y': FEET + 4, 'w': P(0.34, 1.2), 'color': '#d8e0ff'},
    light([820, FEET + 6], P(0.42, 1.7), depth=0.42, **old, pose='kneel', at={'1': {'pose': 'raise'}}),
    dust(box=(500, 0, -2000, 1100, 950, -1000), count=150, size=3, color='#d8e0ff', opacity=0.45, wind=(1, 5, 0), swirl=10),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['air'], 'cam': cam([820, 540, 500], [820, 860, -3000]),
     'say': "Zakariya was old now; his bones were weak and his hair was white, and his wife had never had a child."},
    {'dur': 11000, 'ambient': ['air', 'crickets'], 'cam': cam([820, 545, 350], [820, 920, -3000]),
     'say': "In the quiet of the night he called to his Lord in secret: give me from Yourself an heir, who will carry on the faith of the family of Yaqub."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([820, 540, 520], [820, 850, -3000]), 'pendingVerse': pv('19:4')},
  ])

# ── 162 · The good news ───────────────────────────────────────────────────
scene('tidings', 162, 'zakariya', 'The Good News', 'البشارة بيحيى',
  art=[ART, "The angels who called him (3:39) are shown as columns of light. His silence for three nights is the sign of 19:10."],
  prompt="The prayer chamber lit from within by tall columns of soft golden light standing around an old steady light at prayer; then the temple courtyard at dawn, crowds of dim lights waiting, and the old light at the top of the steps raising his arms, silent; ink-wash and parchment texture.",
  world=TEMPLE, ambient=['air', 'echo'], base='#14100c', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 2], 'layers': [
      *chamber(),
      angel(640, -1700, FEET - 8, 190), angel(1000, -1700, FEET - 8, 190), angel(820, -2600, FEET - 30, 180),
      light([820, FEET + 6], P(0.42, 1.7), depth=0.42, **old),
    ]},
    {'type': 'set', 'show': [2, None], 'dx': 6000, 'layers': [
      heav([[5.4, 6.4, 10000], [6.4, 7.2, 12000]], horizon=640),
      {'type': 'masonry', 'depth': 0.18, 'pos': [800, 712], 'w': P(0.18, 40), 'h': P(0.18, 14), 'side': 30, 'courses': 14, 'blocks': 24, 'built': 1, 'door': {'x': 0.5, 'w': 0.1, 'h': 0.34},
       'stone': '#d8ccb4', 'stone2': '#e8dcc8', 'ink': '#5a5048'},
      {'type': 'platform', 'depth': 0.26, 'x': 800, 'y': 760, 'w': P(0.26, 12), 'steps': 6, 'rise': P(0.26, 0.2), 'dais': P(0.26, 0.2), 'stone': '#c8b898', 'lit': '#e8dcc0', 'dark': '#6a5a48', 'ppu': 1},
      light([800, 760 - 6 * P(0.26, 0.2) - P(0.26, 0.2)], P(0.261, 1.7), depth=0.261, **old, pose='raise'),
      {'type': 'crowd', 'area': [-200, 1800, -2400, -1500], 'y': [FEET + 6, 770], 'count': 220, 'size': P(0.36), 'color': '#ffe0b0', 'dim': 0.4, 'glow': 0.12, 'mill': 3, 'speed': 0},
    ]},
  ],
  beats=[
    {'dur': 11000, 'ambient': ['air', 'echo'], 'world': {'bloom': 1.0}, 'cam': cam([820, 535, 600], [820, 820, -3000]),
     'say': "While he stood praying in the chamber, the angels called to him: God gives you good news of a son named Yahya, a name given to no one before him."},
    {'dur': 10000, 'ambient': ['air'], 'world': {'bloom': 1.0}, 'cam': cam([820, 540, 420], [820, 880, -3000]),
     'say': "How can I have a son, when I am so old and my wife is barren? It is easy for Me, his Lord said. Your sign: you will not speak to anyone for three nights."},
    {'dur': 11000, 'ambient': ['crowd', 'birds'], 'cam': cam([800, 520, 800], [800, 700, -3000], dx=6000),
     'say': "So he came out to his people and, without a word, signed to them: glorify God morning and evening."},
    {'dur': 12000, 'ambient': ['birds', 'air'], 'cam': cam([800, 520, 850], [800, 680, -3000], dx=6000), 'pendingVerse': pv('19:7')},
  ])

# ── 163 · Yahya ───────────────────────────────────────────────────────────
deer = {'type': 'animals', 'depth': 0.4, 'fade': 'none', 'area': [960, 680, 1300, 820],
        'pairs': [{'kind': 'deer', 'solo': True, 's': round(1.1 * 150 * 0.4 / 70, 2), 'path': [[x, 800]], 'face': -1} for x in (1060, 1180)]}
scene('yahya', 163, 'yahya', 'Yahya', 'يحيى',
  art=[ART, "That Yahya lived simply in the wild and was gentle with animals is from the commentaries."],
  prompt="The green valley of a river among reeds at morning, deer drinking at the water; a young steady light kneeling on the bank, absorbed in study; then the same light grown, standing among dim lights of people at the river, teaching; ink-wash and parchment texture.",
  world=HILLS, ambient=['water', 'birds'], base='#c8c0b0',
  layers=[
    heav([[7, 8, 10000], [8, 14, 12000, 4], [14, 15, 12000]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 50, 'seed': 1330, 'sharp': 0.4, 'color': '#8a8a7a', 'haze': 0.35, 'fog': 0.4},
    {'type': 'ground', 'depth': 0.14, 'y': 690, 'amp': 10, 'seed': 1331, 'color': '#8a9a5a', 'color2': '#5a6a3a', 'grass': True, 'grassColor': '#a8b468'},
    {'type': 'water', 'depth': 0.24, 'points': [[-1600, 770], [800, 774], [3200, 778]], 'w0': 60, 'w1': 60, 'reflect': [['0', '#b8d0d8'], ['1', '#4a6a7a']]},
    {'type': 'reeds', 'depth': 0.3, 'x0': -200, 'x1': 500, 'y': 800, 'h': P(0.3, 2.2), 'count': 6, 'seed': 1332},
    deer,
    light([820, FEET + 4], P(D, 1.4), depth=D, **prophet_d, pose='kneel', at={'1': {'h': P(D, 1.75), 'pose': 'stand'}, '2': {'h': P(D, 1.75), 'pose': 'raise'}}),
    {'type': 'crowd', 'show': [1, None], 'area': [300, 760, -1500, -1300], 'y': [FEET + 6, 786], 'count': 30, 'size': P(0.41), 'color': '#ffe0b0', 'dim': 0.4, 'glow': 0.12, 'mill': 2, 'speed': 0},
    {'type': 'reeds', 'depth': 0.5, 'x0': 1300, 'x1': 2000, 'y': 880, 'h': P(0.5, 2.2), 'count': 5, 'seed': 1333},
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['water', 'birds'], 'cam': cam([900, 525, 700], [920, 730, -3000]),
     'say': "Yahya was born as promised. While still a child he was told: take hold of the Scripture with strength. And he was given wisdom young."},
    {'dur': 11000, 'ambient': ['water', 'voices'], 'cam': cam([720, 525, 700], [720, 730, -3000]),
     'say': "He grew up gentle and pure, devoted to God and kind to his parents, never proud or rebellious; and he called his people back to God."},
    {'dur': 12000, 'ambient': ['water', 'air'], 'cam': cam([800, 520, 850], [820, 690, -3000]), 'pendingVerse': pv('19:15')},
  ])

# ── 164 · Maryam and the angel ────────────────────────────────────────────
scene('jibril', 164, 'isa', 'Maryam and the Angel', 'مريم والملك',
  art=[ART, "Jibril came to Maryam in the form of a man (19:17); he is shown only as a column of light."],
  prompt="An eastern room of the temple at dawn, a hanging cloth screen stirring in the breeze, a young soft light at prayer behind it; a tall column of golden light standing before her, and the soft light drawing back; ink-wash and parchment texture.",
  world=TEMPLE, ambient=['air', 'birds'], base='#14100c',
  layers=[
    heav([[5.2, 5.8, 10000], [5.8, 6.4, 11000], [6.4, 7, 11000], [7, 7.6, 12000]], horizon=640),
    {'type': 'ridge', 'depth': 0.04, 'y': 640, 'amp': 40, 'seed': 1340, 'sharp': 0.3, 'color': '#7a7068', 'haze': 0.35, 'fog': 0.4},
    {'type': 'ground', 'depth': 0.14, 'y': 700, 'amp': 6, 'seed': 1341, 'color': '#8a9a5a', 'color2': '#5a6a3a', 'grass': True, 'grassColor': '#a8b468'},
    {'type': 'tree', 'depth': 0.2, 'x': 300, 'y': 724, 'h': P(0.2, 9), 'kind': 'living', 'seed': 1342},
    {'type': 'tree', 'depth': 0.2, 'x': 1320, 'y': 724, 'h': P(0.2, 8), 'kind': 'living', 'seed': 1343},
    {'type': 'wall', 'ppu': 1.2, 'depth': 0.3, 'y': 772, 'h': P(0.3, 2.6), 'x0': -900, 'x1': 2500, 'material': 'stone', 'base': '#d8c8a8', 'seed': 1344,
     'openings': [{'x': 820, 'w': P(0.3, 2), 'h': P(0.3, 2.4), 'kind': 'arch', 'view': {'sky': 'dawn', 'land': 'hills', 'horizon': 0.35}}]},
    {'type': 'ground', 'depth': 0.36, 'y': 790, 'amp': 3, 'seed': 1345, 'x0': -900, 'x1': 2500, 'color': '#b8a888', 'color2': '#8a7a62'},
    light([820, FEET + 4], P(0.42, 1.6), depth=0.42, **soft, pose='kneel', at={'1': {'pos': [780, FEET + 2], 'pose': 'stand'}, '2': {'pos': [780, FEET + 2], 'pose': 'stand'}}),
    angel(1000, -1450, FEET + 2, 200, show=[1, None]),
    {'type': 'flash', 'show': [1, 2], 'color': '#fff4d8', 'peak': 0.3, 'delay': 400, 'rise': 400, 'dur': 2400},
    motes(0.2),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['air', 'birds'], 'world': {'light': 1.0}, 'cam': cam([820, 540, 500], [820, 860, -3000]),
     'say': "Maryam withdrew from her family to a place facing east, and set a screen between herself and them."},
    {'dur': 11000, 'ambient': ['air'], 'world': {'bloom': 1.05}, 'cam': cam([800, 540, 420], [800, 880, -3000]),
     'say': "There God sent her His angel Jibril, in the form of a man. I seek refuge in the Most Merciful from you, if you fear Him, she said."},
    {'dur': 11000, 'ambient': ['air'], 'world': {'bloom': 1.05}, 'cam': cam([800, 540, 500], [800, 860, -3000]),
     'say': "I am only a messenger of your Lord, he said, to give you a pure son. How, when no man has touched me? It is easy for God, he said."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([800, 535, 600], [800, 820, -3000]), 'pendingVerse': pv('19:19')},
  ])

# ── 165 · Beneath the palm ────────────────────────────────────────────────
scene('palm', 165, 'isa', 'Beneath the Palm', 'تحت النخلة',
  art=[ART, "Her pain is never shown: her light only leans at the trunk. The stream and the ripe dates are as 19:24–25 tell."],
  prompt="A lonely place at dusk, a single tall date palm, a soft light leaning against its trunk; a clear stream welling up at its foot and running away over the sand; ripe dates falling glinting gold; then a tiny new light beside her under the first stars; ink-wash and parchment texture.",
  world=SAND, ambient=['wind', 'air'], base='#d8c0a0',
  layers=[
    heav([[17, 17.8, 10000], [17.8, 18.4, 11000], [18.4, 19.2, 12000]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 40, 'seed': 1350, 'sharp': 0.4, 'color': '#9a7a6a', 'haze': 0.4, 'fog': 0.4},
    {'type': 'dunes', 'depth': 0.12, 'y': 690, 'amp': 14, 'count': 9, 'seed': 1351, 'lit': '#e8c090', 'body': '#c0905e', 'shade': '#6a4a48'},
    {'type': 'palms', 'depth': 0.4, 'items': [{'x': 860, 'y': FEET - 4, 'h': P(0.4, 9), 'lean': -0.06}], 'seed': 1352, 'ppu': 0.9},
    {'type': 'spring', 'depth': 0.415, 'pos': [960, FEET + 10], 'r': P(0.415, 1.1), 'squash': 0.26, 'well': 0, 'at': {'1': {'rise': [0, 1, 5000, 400], 'rim': 1}, '2': {'well': 1, 'rim': 1}}},
    {'type': 'water', 'show': [1, None], 'depth': 0.41, 'points': [[980, FEET + 10], [1200, FEET + 20], [1700, FEET + 40]], 'w0': 10, 'w1': 40, 'reveal': {'dir': 'left', 'dur': 5000, 'delay': 2000},
     'reflect': [['0', '#c8e0e8'], ['1', '#6a8a98']]},
    light([830, FEET], P(D, 1.6), depth=D, **soft, pose='kneel'),
    babe(900, FEET + 4, D + 0.004, show=[2, None]),
    dust(box=(-60, -60, -1450, 260, 200, -1350), count=50, size=7, color='#e8a838', opacity=0.9, wind=(0, -80, 0), show=[1, 2]),
    motes(0.2),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['wind', 'air'], 'cam': cam([860, 520, 700], [860, 700, -3000]),
     'say': "When her time came, Maryam went far away, and the pains drove her to the trunk of a palm tree. If only I had died before this and been forgotten, she said."},
    {'dur': 11000, 'ambient': ['spring', 'air'], 'sfx': [{'name': 'swell', 'at': 600}], 'cam': cam([880, 530, 550], [880, 760, -3000]),
     'say': "A voice called to her from below: do not grieve. Your Lord has made a stream beneath you. Shake the trunk of the palm, and ripe dates will fall to you."},
    {'dur': 11000, 'ambient': ['spring', 'crickets'], 'cam': cam([870, 530, 500], [870, 780, -3000]),
     'say': "So she ate and drank and was comforted; and the child was born, her son Isa."},
    {'dur': 12000, 'ambient': ['spring', 'air'], 'cam': cam([860, 520, 700], [860, 700, -3000]), 'pendingVerse': pv('19:25')},
  ])

# ── 166 · The child in the cradle ─────────────────────────────────────────
scene('cradle', 166, 'isa', 'The Child Speaks', 'الطفل يتكلم',
  art=[ART, "The people's reproach is drawn as jagged strokes; the infant's words are given as the Quran gives them (19:30–33)."],
  prompt="A town gate at morning, crowds of dim lights gathering around a soft light who carries a tiny light in her arms; jagged dark strokes of reproach rising, then falling silent as the tiny light flares bright and clear; ink-wash and parchment texture.",
  world=HILLS, ambient=['crowd', 'jeer'], base='#c8c0b0',
  layers=[
    heav([[8, 9, 10000], [9, 9.6, 10000], [9.6, 10.6, 12000]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 40, 'seed': 1360, 'sharp': 0.3, 'color': '#8a8a7a', 'haze': 0.35, 'fog': 0.4},
    {'type': 'town', 'depth': 0.12, 'y': 690, 'x0': 0, 'x1': 1600, 's': P(0.12, 1) / 30, 'grade': 'town', 'lit': 0.2, 'haze': '#b8a898', 'seed': 1361},
    {'type': 'facade', 'depth': 0.2, 'x': 800, 'y': 730, 'w': P(0.2, 40), 'h': P(0.2, 8), 'gate': {'w': P(0.2, 4), 'h': P(0.2, 5.5)}, 'stone': '#dcc48c', 'ppu': 0.8},  # her town's gate of golden limestone, no towers
    {'type': 'ground', 'depth': 0.24, 'y': 752, 'amp': 4, 'seed': 1362, 'color': '#b0a080', 'color2': '#8a7a5a'},
    {'type': 'crowd', 'area': [-200, 1800, -2400, -1500], 'y': [FEET + 6, 770], 'count': 160, 'size': P(0.36), 'color': '#ffd8a0', 'dim': 0.4, 'glow': 0.12, 'mill': 6, 'speed': 0, 'flicker': 0.3,
     'at': {'1': {'flicker': 0.05}, '2': {'flicker': 0.05}}},
    light([800, FEET + 10], P(0.44, 1.6), depth=0.44, **soft),
    babe(800, FEET - 70, 0.445, at={'1': {'glow': 1.6, 'bright': 1.9}, '2': {'glow': 1.2, 'bright': 1.6}}),
    {'type': 'jeers', 'show': [0, 1], 'center': [800, 520], 'from': [1120, 360], 'clear': [90, 120], 'count': 26, 'size': 36, 'period': 6},
    {'type': 'flash', 'show': [1, 2], 'color': '#fffaf0', 'peak': 0.25, 'delay': 600, 'rise': 300, 'dur': 2400},
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['crowd', 'jeer'], 'cam': cam([800, 525, 700], [800, 730, -3000]),
     'say': "Maryam brought the child to her people. Maryam, they cried, you have done a terrible thing! Your father was no evil man, and your mother was chaste."},
    {'dur': 11000, 'ambient': ['air'], 'world': {'bloom': 1.0}, 'cam': cam([800, 535, 520], [800, 790, -3000]),
     'say': "She pointed to the baby. How can we speak to an infant in the cradle? they said. And the child spoke: I am the servant of God. He has given me the Scripture and made me a prophet."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([800, 525, 700], [800, 730, -3000]), 'pendingVerse': pv('19:30')},
  ])

write_chapter(C16 + 'chapter.json', {
    'number': 16, 'title': 'Zakariya, Yahya and Maryam', 'arabic': 'زكريا ويحيى ومريم', 'nodes': ['zakariya', 'yahya'],
    'parts': [{'title': 'The Family of Imran', 'from': O(159), 'to': O(160)}, {'title': 'Zakariya and Yahya', 'from': O(161), 'to': O(163)}, {'title': 'Maryam', 'from': O(164), 'to': O(166)}]})
print('c16 ok')
