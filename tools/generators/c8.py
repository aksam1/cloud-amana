from base import *

C8 = ROOT + 'src/story/chapters/c8/'
os.makedirs(C8, exist_ok=True)


def scene(sid, order, node, title, arabic, art, prompt, world, layers, beats, ambient, base='#1a1820', dissolve=2400, scam=None):
    order = ORDER.get(sid, order)
    s = {'id': sid, 'chapter': 8, 'order': order, 'node': node, 'title': title, 'arabic': arabic, 'source': 'quran', 'ayahs': [], 'art': art,
         'ambient': ambient, 'base': base, 'captions': 'parchment', 'renderer': 'gl', 'pen': True, 'dissolve': dissolve, 'world': world,
         'cam': scam or beats[0]['cam'], 'imagePrompt': prompt, 'layers': layers, 'beats': beats}
    open(C8 + f's{order}-{sid}.json', 'w').write(dump(s))


VALLEY_WORLD = {'fog': '#dcc4a4', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.05, 'rays': 0, 'bloom': 0.6, 'haze': 0.2, 'hazeY': 0.62, 'shake': 0.3, 'dof': 0}
HILLS_WORLD = {'fog': '#c8c0b0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.0, 'rays': 0, 'bloom': 0.65, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
day = dict(glow=0.3, bright=1.0, solid=0.6)


def valley(tents=True, extra_tents=False):
    """The valley of the House: dark mountains, sand, the tribe's tents, the House's plain walls, the spring."""
    out = [
        {'type': 'peak', 'depth': 0.06, 'x': 240, 'y': 310, 'w': 480, 'h': 360, 'color': '#4a3c38', 'lit': '#9a7a68', 'seed': 140},
        {'type': 'peak', 'depth': 0.06, 'x': 1360, 'y': 290, 'w': 520, 'h': 380, 'color': '#463834', 'lit': '#947464', 'seed': 141},
        {'type': 'ridge', 'depth': 0.1, 'y': 612, 'amp': 100, 'seed': 143, 'sharp': 0.7, 'color': '#5a4a40', 'haze': 0.25},
        {'type': 'ground', 'depth': 0.14, 'y': 650, 'amp': 6, 'seed': 190, 'color': '#c4a476', 'color2': '#967656'},
    ]
    if tents:
        out += [{'type': 'tent', 'depth': 0.15, 'x': 260, 'y': 662, 'w': 260, 'h': 100, 'lit': True, 'ppu': 1},
                {'type': 'tent', 'depth': 0.15, 'x': 1460, 'y': 664, 'w': 280, 'h': 110, 'lit': True, 'ppu': 1}]
    if extra_tents:
        out += [{'type': 'tent', 'depth': 0.13, 'x': 520, 'y': 652, 'w': 200, 'h': 80, 'lit': True, 'ppu': 1},
                {'type': 'tent', 'depth': 0.13, 'x': 1180, 'y': 654, 'w': 220, 'h': 84, 'lit': True, 'ppu': 1}]
    out += [{'type': 'masonry', 'depth': 0.2, 'pos': [920, 712], 'w': 300, 'h': 210, 'side': 96, 'courses': 11, 'blocks': 9, 'built': 1, 'door': {'x': 0.8, 'w': 0.14, 'h': 0.34}},
            {'type': 'spring', 'depth': 0.2, 'pos': [1310, 716], 'r': 40, 'squash': 0.26, 'well': 1, 'rim': 1}]
    return out


def canaan(sarah_tent=True):
    """The hills of Canaan: olive trees, goat-hair tents, grazing land."""
    return [
        {'type': 'ridge', 'depth': 0.05, 'y': 630, 'amp': 50, 'seed': 300, 'sharp': 0.3, 'color': '#7a8070', 'haze': 0.35, 'fog': 0.4},
        {'type': 'ground', 'depth': 0.12, 'y': 668, 'amp': 18, 'seed': 301, 'color': '#6a7a4a', 'color2': '#4a5a32', 'grass': True, 'grassColor': '#8a9a58'},
        {'type': 'tree', 'depth': 0.16, 'x': 250, 'y': 692, 'h': 250, 'kind': 'living', 'seed': 302},
        {'type': 'tree', 'depth': 0.17, 'x': 1390, 'y': 696, 'h': 270, 'kind': 'living', 'seed': 303},
        {'type': 'tent', 'depth': 0.22, 'x': 760, 'y': 720, 'w': 520, 'h': 200, 'lit': True, 'ppu': 1},
    ]


# ── 85 · True to his promise (Ismail) ─────────────────────────────────────
scene('promise', 85, 'ismail', 'Ismail the Messenger', 'إسماعيل النبي',
  art=["Ismail appears only as a steady light, far away; the people of the valley as dim lights.",
       "That Ismail grew up among the tribe of Jurhum, learned their tongue and married among them is told in the hadith (al-Bukhari)."],
  prompt="A valley among dark mountains at dawn, goat-hair tents of a tribe around a stone-rimmed spring, the plain stone walls of the House; a steady white light walking among dim amber lights of the people; then the people gathered before the House listening to him; ochre, slate, rose; ink-wash and parchment texture.",
  world=VALLEY_WORLD, ambient=['desert', 'voices'], base='#d8c0a0',
  layers=[
    {'type': 'heavens', 'horizon': 600, 'sun': {'rise': 6, 'set': 18, 'x0': 1300, 'x1': 300, 'peak': 280, 'size': 34}, 'tod': [5.4, 6.4, 10000],
     'at': {'1': {'tod': [6.4, 7.6, 10000]}, '2': {'tod': [7.6, 8.6, 12000]}}},
    *valley(extra_tents=True),
    {'type': 'crowd', 'area': [880, 1480, -4400, -3300], 'y': [728, 700], 'count': 34, 'size': 28, 'color': '#ffd8a0', 'dim': 0.3, 'glow': 0.5, 'mill': 14, 'speed': 0, 'flicker': 0.15,
     'at': {'1': {'mill': 3}}},
    light([1220, 724], 58, depth=0.21, **day, pose='walk', path=[[1440, 730], [1220, 724]], dur=8000, at={'1': {'pose': 'raise', 'path': None}}),
    {'type': 'ground', 'depth': 0.38, 'y': 832, 'amp': 10, 'seed': 191, 'color': '#b89868', 'color2': '#8a6a48'},
    dust(box=(-1400, 200, -9000, 3000, 900, 0), count=400, size=3, color='#fff0dc', opacity=0.26, wind=(3, -3, 0)),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['desert', 'voices'], 'cam': cam([1000, 515, 1150], [1000, 560, -3000]),
     'say': "Ismail grew up among the tribe that had settled by the spring, learned their tongue, and married among them."},
    {'dur': 10000, 'ambient': ['voices', 'wind'], 'cam': cam([1100, 520, 1000], [1140, 585, -3000]),
     'say': "God made him a messenger and a prophet, and he was known for keeping his word."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([1060, 520, 1080], [1090, 580, -3000]),
     'pendingVerse': {'ref': '19:54', 'place': 'sky'}},
  ])

# ── 86 · The threshold (Ismail) ───────────────────────────────────────────
scene('threshold', 86, 'ismail', 'The Threshold', 'عتبة الباب',
  art=["The two visits are told in the hadith (al-Bukhari): Ibrahim's word about the threshold of the door, and his blessing on the second household's meat and water.",
       "Ismail's wives appear only as dim figures of light; Ibrahim and Ismail as steady lights, far away."],
  prompt="A goat-hair tent in a mountain valley at noon, a dim amber figure of light at its door and a steady white light, a traveller, standing before it; then the traveller walking away at dusk while another steady light returns from the hills; then a second household's tent with a warmer amber light offering a bowl, the traveller's arm raised in blessing; ink-wash and parchment texture.",
  world=VALLEY_WORLD, ambient=['desert', 'wind'], base='#d8c0a0', dissolve=2600,
  layers=[
    {'type': 'heavens', 'horizon': 600, 'sun': {'rise': 6, 'set': 18, 'x0': 1300, 'x1': 300, 'peak': 280, 'size': 34},
     'tod': [11.5, 12.6, 10000], 'at': {'1': {'tod': [16.6, 18.0, 10000]}, '2': {'tod': [10.5, 11.8, 12000]}, '3': {'tod': [11.8, 12.8, 12000]}}},
    *valley(tents=False),
    {'type': 'tent', 'depth': 0.26, 'x': 660, 'y': 744, 'w': 380, 'h': 150, 'lit': False, 'ppu': 1, 'at': {'2': {'lit': True}}},
    light([800, 756], 46, depth=0.27, color='#e8c0a0', glow=0.25, bright=0.9, solid=0.6, at={'2': {'color': '#f4d4a8', 'glow': 0.4, 'bright': 1.05}}),
    light([960, 760], 60, depth=0.27, **day, pose='walk', path=[[1460, 772], [960, 760]], dur=8000,
          at={'1': {'pose': 'walk', 'path': [[960, 760, -2704], [1180, 700, -6000]], 'dur': 7000}, '2': {'pose': 'walk', 'path': [[1460, 772], [940, 760]], 'dur': 7000},
              '3': {'pose': 'raise', 'path': None, 'pos': [940, 760]}}),
    light([1560, 756], 56, depth=0.27, **day, show=[1, 2], pose='walk', path=[[1640, 752], [900, 758]], dur=8500, delay=1200),
    {'type': 'ground', 'depth': 0.38, 'y': 832, 'amp': 10, 'seed': 191, 'color': '#b89868', 'color2': '#8a6a48'},
    dust(box=(-1400, 200, -9000, 3000, 900, 0), count=400, size=3, color='#fff0dc', opacity=0.26, wind=(3, -3, 0)),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['desert', 'wind'], 'cam': cam([820, 515, 1050], [820, 575, -3000]),
     'say': "Years later Ibrahim came to visit while Ismail was out hunting. Ismail's wife, not knowing him, complained of hunger and hardship."},
    {'dur': 10000, 'ambient': ['wind', 'crickets'], 'cam': cam([900, 520, 1100], [920, 568, -3000]),
     'say': "Tell him to change the threshold of his door, Ibrahim said as he left; and Ismail understood, and parted from her."},
    {'dur': 12000, 'ambient': ['desert', 'voices'], 'cam': cam([820, 518, 1000], [820, 588, -3000]),
     'say': "On his next visit, Ismail's new wife thanked God for all they had and offered him meat and water. He prayed for blessing on them, and said: tell him to keep his threshold."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([830, 515, 1060], [830, 582, -3000]),
     'pendingVerse': {'ref': '19:55', 'place': 'sky'}},
  ])

# ── 87 · The line of Ismail ───────────────────────────────────────────────
sons = [light([1000 + i * 38, 722 + (i % 2) * 4], 38 + (i % 3) * 3, depth=0.21, color='#fff4e0', glow=0.35, bright=1.0, solid=0.5) for i in range(5)]
scene('lineage', 87, 'ismail', 'The Line of Ismail', 'ذرية إسماعيل',
  art=["Ismail and his sons appear only as lights. That the final messenger came from Ismail's line is the teaching of the Quran's prayer (2:129) and the hadith; he is not shown.",
       "The growing town and the caravans are imagined."],
  prompt="The valley of the House at dusk, an old steady white light among several younger lights by the plain stone walls; then days and nights racing past as tents become houses and long caravans of small lights wind in through the mountain passes; then dawn over a quiet town around the House; ink-wash and parchment texture.",
  world=VALLEY_WORLD, ambient=['desert', 'voices'], base='#d8c0a0', dissolve=2600,
  layers=[
    {'type': 'heavens', 'horizon': 600, 'sun': {'rise': 6, 'set': 18, 'x0': 1300, 'x1': 300, 'peak': 280, 'size': 34},
     'tod': [16.6, 18.0, 10000], 'at': {'1': {'tod': [18, 18.5, 10000, 6]}, '2': {'tod': [4.6, 6.2, 10000]}, '3': {'tod': [6.2, 7.4, 13000]}}},
    *valley(extra_tents=True),
    {'type': 'town', 'show': [1, None], 'depth': 0.13, 'y': 650, 'x0': 300, 'x1': 760, 's': 0.45, 'grade': 'village', 'lit': 0.4, 'haze': '#dcc4a4', 'seed': 310, 'reveal': {'dir': 'up', 'dur': 6000}},
    {'type': 'town', 'show': [1, None], 'depth': 0.13, 'y': 652, 'x0': 1120, 'x1': 1500, 's': 0.42, 'grade': 'village', 'lit': 0.4, 'haze': '#dcc4a4', 'seed': 311, 'reveal': {'dir': 'up', 'dur': 6000, 'delay': 1500}},
    light([940, 718], 60, depth=0.21, color='#fffaf0', glow=0.35, bright=1.05, solid=0.5, show=[0, 1]),
    *[{**s, 'show': [0, 1]} for s in sons],
    {'type': 'crowd', 'show': [1, None], 'area': [-900, 400, -7600, -5600], 'y': [680, 650], 'count': 120, 'size': 12, 'color': '#ffe2b0', 'dim': 0.25, 'glow': 0.7, 'flow': [1, 0.2], 'speed': 40, 'mill': 2, 'flicker': 0.2},
    {'type': 'crowd', 'show': [1, None], 'area': [1250, 2400, -7600, -5600], 'y': [680, 650], 'count': 120, 'size': 12, 'color': '#ffe2b0', 'dim': 0.25, 'glow': 0.7, 'flow': [-1, 0.2], 'speed': 40, 'mill': 2, 'flicker': 0.2},
    {'type': 'ground', 'depth': 0.38, 'y': 832, 'amp': 10, 'seed': 191, 'color': '#b89868', 'color2': '#8a6a48'},
    dust(box=(-1400, 200, -9000, 3000, 900, 0), count=400, size=3, color='#fff0dc', opacity=0.26, wind=(3, -3, 0)),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['desert', 'voices'], 'cam': cam([980, 518, 1000], [1000, 580, -3000]),
     'say': "Ismail's sons grew into tribes that spread across Arabia."},
    {'dur': 10000, 'ambient': ['crowd', 'wind'], 'cam': cam([880, 505, 1250], [880, 545, -3000]),
     'say': "Generation after generation, they kept the House their fathers had raised."},
    {'dur': 10000, 'ambient': ['wind', 'birds'], 'cam': cam([880, 510, 1200], [880, 550, -3000]),
     'say': "Ages later, from Ismail's line, God raised the messenger Ibrahim had prayed for."},
    {'dur': 13000, 'ambient': ['air', 'birds'], 'cam': cam([900, 512, 1150], [900, 560, -3000]),
     'pendingVerse': {'ref': '2:129', 'place': 'sky', 'part': "Ibrahim's prayer for a messenger from among them"}},
  ])

# ── 88 · Ishaq is born ────────────────────────────────────────────────────
scene('isaac', 88, 'ishaq', 'The Birth of Ishaq', 'مولد إسحاق',
  art=["Sarah appears only as a dim figure of light; Ibrahim and the infant Ishaq as steady lights. The camp in Canaan is imagined."],
  prompt="A dark goat-hair tent among olive trees and green hills at dawn, a dim amber figure of light at its door holding a tiny new light wrapped in white, an old steady white light beside them with an arm raised; soft gold light, birds of light overhead; ink-wash and parchment texture.",
  world=HILLS_WORLD, ambient=['birds', 'air'], base='#c8c0b0',
  layers=[
    {'type': 'heavens', 'horizon': 640, 'sun': {'rise': 6, 'set': 18, 'x0': 1300, 'x1': 300, 'peak': 300, 'size': 32}, 'tod': [5.2, 6.4, 10000],
     'at': {'1': {'tod': [6.4, 7.6, 10000]}, '2': {'tod': [7.6, 8.6, 12000]}}},
    *canaan(),
    light([840, 736], 50, depth=0.235, color='#f0c890', glow=0.35, bright=1.0, solid=0.6),
    light([870, 712], 18, depth=0.235, color='#fffaf0', w=1.0, pose='babe', glow=0.9, bright=1.6, show=[1, None]),
    light([960, 742], 62, depth=0.24, color='#fffaf0', glow=0.45, bright=1.2, solid=0.5, at={'1': {'pose': 'raise'}}),
    {'type': 'brazier', 'depth': 0.26, 'x': 640, 'y': 772, 's': 0.6},
    {'type': 'light', 'kind': 'flame', 'depth': 0.26, 'pos': [640, 734], 'h': 30, 'color': '#ffb050', 'glow': 1.0},
    {'type': 'light', 'kind': 'bird', 'depth': 0.1, 'h': 10, 'color': '#fffaf0', 'glow': 0.55, 'bright': 1.3, 'path': [[500, 300, -9000], [900, 240, -9000], [1150, 320, -9000], [760, 380, -9000], [500, 300, -9000]], 'dur': 14000},
    {'type': 'ground', 'depth': 0.4, 'y': 832, 'amp': 10, 'seed': 304, 'color': '#5a6a3a', 'color2': '#3a4a2a', 'grass': True, 'grassColor': '#7a8a4a', 'wind': 1},
    dust(box=(-1200, 200, -4000, 2800, 950, 900), count=400, size=2.5, color='#fff0d0', opacity=0.3, wind=(5, -2, 0)),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['birds', 'air'], 'cam': cam([860, 520, 1100], [880, 570, -3000]),
     'say': "As the angels had promised, Sarah, old as she was, bore a son: Ishaq."},
    {'dur': 10000, 'ambient': ['birds', 'sheep'], 'cam': cam([880, 525, 960], [900, 600, -3000]),
     'say': "Ibrahim thanked God, who had given him in his old age both Ismail and Ishaq."},
    {'dur': 12000, 'ambient': ['air', 'birds'], 'cam': cam([860, 522, 1020], [880, 585, -3000]),
     'pendingVerse': {'ref': '37:112', 'place': 'sky'}},
  ])

# ── 89 · Ishaq and Yaqub ──────────────────────────────────────────────────
scene('grandson', 89, 'ishaq', 'Three Generations', 'الجد والحفيد',
  art=["Ibrahim, Ishaq and Yaqub appear only as steady lights, far away. The hills, the flocks and the evening are imagined."],
  prompt="Green hills of Canaan with grazing sheep, a steady white light walking with a small light beside it; then at evening under olive trees three steady lights together, the oldest seated, the youngest small; amber, olive, rose; ink-wash and parchment texture.",
  world=HILLS_WORLD, ambient=['sheep', 'wind'], base='#c8c0b0', dissolve=2600,
  layers=[
    {'type': 'heavens', 'horizon': 640, 'sun': {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 300, 'size': 32}, 'tod': [9, 11, 10000],
     'at': {'1': {'tod': [16.6, 17.8, 10000]}, '2': {'tod': [17.8, 18.8, 12000]}}},
    {'type': 'set', 'show': [0, 1], 'layers': [
      {'type': 'ridge', 'depth': 0.05, 'y': 620, 'amp': 60, 'seed': 320, 'sharp': 0.3, 'color': '#7a8a7a', 'haze': 0.35, 'fog': 0.4},
      {'type': 'peak', 'depth': 0.12, 'x': 1100, 'y': 470, 'w': 520, 'h': 260, 'color': '#6a7a4a', 'lit': '#a8b468', 'seed': 321},
      {'type': 'ground', 'depth': 0.16, 'y': 700, 'amp': 14, 'seed': 322, 'color': '#6a7a4a', 'color2': '#4a5a32', 'grass': True, 'grassColor': '#8a9a58'},
      {'type': 'flock', 'depth': 0.14, 'cx': 1060, 'cy': 560, 'w': 220, 'h': 30, 'count': 18, 'size': 13},
      light([860, 712], 60, depth=0.2, **day, pose='walk', path=[[700, 720], [880, 712]], dur=9000),
      light([830, 716], 34, depth=0.2, color='#fff4e0', glow=0.3, bright=1.0, solid=0.6, pose='walk', path=[[670, 724], [850, 716]], dur=9000),
      {'type': 'ground', 'depth': 0.4, 'y': 852, 'amp': 10, 'seed': 323, 'color': '#5a6a3a', 'color2': '#3a4a2a', 'grass': True, 'grassColor': '#7a8a4a', 'wind': 1},
    ]},
    {'type': 'set', 'show': [1, None], 'dx': 6000, 'layers': [
      *canaan(),
      light([770, 740], 56, depth=0.24, color='#fffaf0', glow=0.45, bright=1.2, solid=0.4, pose='kneel'),
      light([860, 742], 62, depth=0.24, color='#fffaf0', glow=0.45, bright=1.2, solid=0.4),
      light([940, 744], 38, depth=0.24, color='#fff4e0', glow=0.45, bright=1.2, solid=0.4),
      {'type': 'brazier', 'depth': 0.26, 'x': 1020, 'y': 772, 's': 0.6},
      {'type': 'light', 'kind': 'flame', 'depth': 0.26, 'pos': [1020, 734], 'h': 30, 'color': '#ffb050', 'glow': 1.0},
      {'type': 'ground', 'depth': 0.4, 'y': 832, 'amp': 10, 'seed': 304, 'color': '#5a6a3a', 'color2': '#3a4a2a', 'grass': True, 'grassColor': '#7a8a4a', 'wind': 1},
    ]},
    dust(box=(-1200, 200, -4000, 2800, 950, 900), count=400, size=2.5, color='#fff0d0', opacity=0.3, wind=(5, -2, 0)),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['sheep', 'wind'], 'cam': cam([860, 520, 1100], [880, 570, -3000]),
     'say': "Ishaq grew up a prophet in the land of Canaan, and in time had a son of his own, Yaqub."},
    {'dur': 10000, 'ambient': ['crickets', 'fire'], 'cam': cam([800, 525, 980], [800, 600, -3000], dx=6000),
     'say': "Ibrahim lived to see his grandson, as the angels had foretold: after Ishaq, Yaqub."},
    {'dur': 12000, 'ambient': ['crickets', 'air'], 'cam': cam([800, 522, 1040], [800, 590, -3000], dx=6000),
     'pendingVerse': {'ref': '21:72', 'place': 'sky'}},
  ])

# ── 90 · Our servants ─────────────────────────────────────────────────────
scene('servants', 90, 'ishaq', 'The House of Ibrahim', 'بيت إبراهيم',
  art=["The prophets appear only as steady lights, far away; the two lands, one under the other's stars, are imagined."],
  prompt="Night over the valley of the House, its plain stone walls and the tents of a tribe under the stars; then night over the green hills of Canaan, a tent glowing among olive trees; then dawn breaking over a vast land between them; indigo, gold, olive; ink-wash and parchment texture.",
  world={**VALLEY_WORLD, 'fog': '#8a8090', 'light': 0.95}, ambient=['crickets', 'air'], base='#1a1820', dissolve=2600,
  layers=[
    {'type': 'heavens', 'horizon': 620, 'sun': {'rise': 6, 'set': 18, 'x0': 1300, 'x1': 300, 'peak': 300, 'size': 34},
     'moon': {'rise': 20, 'set': 7, 'x0': 300, 'x1': 1300, 'peak': 320, 'size': 24},
     'tod': [22, 23, 10000], 'at': {'1': {'tod': [23, 0.5, 10000]}, '2': {'tod': [4.6, 6, 10000]}, '3': {'tod': [6, 7, 13000]}}},
    {'type': 'set', 'show': [0, 1], 'layers': [*valley(), light([1100, 724], 48, depth=0.21, color='#fffaf0', glow=0.6, bright=1.3)]},
    {'type': 'set', 'show': [1, 2], 'dx': 6000, 'layers': [*canaan(), light([900, 744], 54, depth=0.24, color='#fffaf0', glow=0.6, bright=1.3)]},
    {'type': 'set', 'show': [2, None], 'dx': 12000, 'layers': [
      {'type': 'ridge', 'depth': 0.04, 'y': 610, 'amp': 50, 'seed': 330, 'sharp': 0.4, 'color': '#6a6070', 'haze': 0.35, 'fog': 0.4},
      {'type': 'dunes', 'depth': 0.12, 'y': 680, 'amp': 12, 'count': 12, 'seed': 331, 'lit': '#c8a07a', 'body': '#9a7a5e', 'shade': '#4a3a48'},
      {'type': 'dunes', 'depth': 0.24, 'y': 760, 'amp': 18, 'count': 8, 'seed': 332, 'lit': '#b8906c', 'body': '#8a6a52', 'shade': '#3e3040'},
    ]},
    dust(box=(-1400, 200, -8000, 3000, 950, 600), count=400, size=2.5, color='#e8e0f0', opacity=0.25, wind=(4, -2, 0)),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['crickets', 'air'], 'cam': cam([920, 515, 1120], [920, 560, -3000]),
     'say': "From one father came two lines: Ismail's in the valley of the House, and Ishaq's in the land of Canaan."},
    {'dur': 10000, 'ambient': ['crickets', 'sheep'], 'cam': cam([820, 520, 1100], [840, 570, -3000], dx=6000),
     'say': "Both carried the same message: that God alone is to be worshipped."},
    {'dur': 10000, 'ambient': ['wind', 'birds'], 'cam': cam([800, 510, 1200], [800, 545, -3000], dx=12000),
     'say': "God called Ibrahim, Ishaq and Yaqub men of strength and of vision."},
    {'dur': 13000, 'ambient': ['wind', 'air'], 'cam': cam([800, 510, 1180], [800, 548, -3000], dx=12000),
     'pendingVerse': {'ref': '38:45', 'place': 'sky'}},
  ])

write_chapter(C8 + 'chapter.json', {
    'number': 8, 'title': 'Ismail and Ishaq', 'arabic': 'إسماعيل وإسحاق', 'nodes': ['ismail', 'ishaq'],
    'parts': [{'title': 'Prophet Ismail', 'from': O(85), 'to': O(87)}, {'title': 'Prophet Ishaq', 'from': O(88), 'to': O(90)}]})
print('c8 ok')
