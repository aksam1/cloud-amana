from base import *
from rooms import room, front
from zoom import zoom

C9 = ROOT + 'src/story/chapters/c9/'
os.makedirs(C9, exist_ok=True)


def scene(sid, order, node, title, arabic, art, prompt, world, layers, beats, ambient, base='#1a1820', dissolve=2400):
    order = ORDER.get(sid, order)
    s = {'id': sid, 'chapter': 9, 'order': order, 'node': node, 'title': title, 'arabic': arabic, 'source': 'quran', 'ayahs': [], 'art': art,
         'ambient': ambient, 'base': base, 'captions': 'parchment', 'renderer': 'gl', 'pen': True, 'dissolve': dissolve, 'world': world,
         'cam': beats[0]['cam'], 'imagePrompt': prompt, 'layers': layers, 'beats': beats}
    open(C9 + f's{order}-{sid}.json', 'w').write(dump(s))


def pv(ref, part=None):
    v = {'ref': ref, 'place': 'sky'}
    if part:
        v['part'] = part
    return v


HILLS = {'fog': '#c8c0b0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.0, 'rays': 0, 'bloom': 0.65, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
DESERT = {'fog': '#dcc4a4', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.05, 'rays': 0, 'bloom': 0.6, 'haze': 0.25, 'hazeY': 0.62, 'shake': 0.3, 'dof': 0}
NILE = {'fog': '#d8c8a8', 'fogNear': 6000, 'fogFar': 42000, 'light': 1.05, 'rays': 0, 'bloom': 0.6, 'haze': 0.15, 'hazeY': 0.62, 'shake': 0.3, 'dof': 0}
HALL = {'fog': '#2a2430', 'fogNear': 4000, 'fogFar': 30000, 'light': 0.95, 'rays': 0, 'bloom': 0.75, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
DREAM = {'fog': '#120a24', 'fogNear': 6000, 'fogFar': 50000, 'light': 0.95, 'rays': 0, 'bloom': 0.95, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}

prophet = dict(color='#fffaf0', glow=0.6, bright=1.35)
prophet_day = dict(color='#fffaf0', glow=0.35, bright=1.1, solid=0.5)
dim = dict(color='#ecc49a', glow=0.3, bright=0.95, solid=0.6)


def canaan(lit=True):
    # Yaqub's camp: upland pasture under a long saw-edged ridge, rolling nearer hills, a few trees
    # (its own place: not Ibrahim's camp of chapter 8, which keeps the 300-seed hills)
    return [
        {'type': 'ridge', 'depth': 0.045, 'y': 612, 'amp': 84, 'seed': 320, 'sharp': 0.55, 'color': '#76786c', 'haze': 0.35, 'fog': 0.4},
        {'type': 'ridge', 'depth': 0.08, 'y': 648, 'amp': 36, 'seed': 321, 'sharp': 0.2, 'color': '#8a8a60', 'haze': 0.2, 'fog': 0.25},
        {'type': 'ground', 'depth': 0.12, 'y': 668, 'amp': 18, 'seed': 322, 'color': '#7a8048', 'color2': '#4e5630', 'grass': True, 'grassColor': '#9aa262'},
        {'type': 'tree', 'depth': 0.16, 'x': 470, 'y': 692, 'h': 150, 'kind': 'living', 'seed': 323},
        {'type': 'tree', 'depth': 0.165, 'x': 1560, 'y': 694, 'h': 190, 'kind': 'living', 'seed': 324},
    ]


def tent(x=760, lit=True):
    return {'type': 'tent', 'depth': 0.22, 'x': x, 'y': 724, 'w': 330, 'h': 90, 'lit': lit, 'ppu': 1}


def near_grass(seed=304):
    return {'type': 'ground', 'depth': 0.62, 'y': 880, 'amp': 10, 'seed': seed, 'color': '#5a6a3a', 'color2': '#3a4a2a', 'grass': True, 'grassColor': '#7a8a4a', 'wind': 1}


def desert(seed=400):
    return [
        {'type': 'ridge', 'depth': 0.05, 'y': 620, 'amp': 60, 'seed': seed, 'sharp': 0.5, 'color': '#9a7a6a', 'haze': 0.4, 'fog': 0.4},
        {'type': 'dunes', 'depth': 0.12, 'y': 680, 'amp': 14, 'count': 12, 'seed': seed + 1, 'lit': '#e0b888', 'body': '#b88a62', 'shade': '#6a4a48'},
    ]


def hall(stone='#34446e', light_=0.85):
    return [
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#141a2a'], [1, '#0e121c']]},
        {'type': 'facade', 'depth': 0.18, 'x': 800, 'y': 712, 'w': 2400, 'h': 820, 'stone': stone, 'light': light_, 'doors': [{'x': 1260, 'w': 60, 'h': 110, 'lit': True}]},
        {'type': 'floor', 'depth': 0.19, 'y': 714, 'vp': [800, 500], 'color': '#4a4458', 'color2': '#1a1a26', 'lines': 14, 'gloss': 0.35, 'area': [-800, 708, 2400, 1350]},
        {'type': 'column', 'depth': 0.26, 'x': 420, 'y': 740, 'h': 600, 'w': 44, 'stone': '#c8a070', 'lit': '#f0d0a0', 'dark': '#5a3e28'},
        {'type': 'column', 'depth': 0.26, 'x': 1180, 'y': 740, 'h': 600, 'w': 44, 'stone': '#c8a070', 'lit': '#f0d0a0', 'dark': '#5a3e28'},
        {'type': 'brazier', 'depth': 0.3, 'x': 560, 'y': 790, 's': 0.6},
        {'type': 'light', 'kind': 'flame', 'depth': 0.3, 'pos': [560, 742], 'h': 20, 'color': '#ffb050', 'glow': 1.1},
        {'type': 'brazier', 'depth': 0.3, 'x': 1040, 'y': 790, 's': 0.6},
        {'type': 'light', 'kind': 'flame', 'depth': 0.3, 'pos': [1040, 742], 'h': 20, 'color': '#ffb050', 'glow': 1.1},
    ]


def hall_front():
    return [{'type': 'column', 'depth': 0.42, 'x': 200, 'y': 830, 'h': 900, 'w': 70, 'stone': '#c8a070', 'lit': '#f0d0a0', 'dark': '#5a3e28', 'ppu': 0.9},
            {'type': 'column', 'depth': 0.42, 'x': 1400, 'y': 830, 'h': 900, 'w': 70, 'stone': '#c8a070', 'lit': '#f0d0a0', 'dark': '#5a3e28', 'ppu': 0.9}]


def nile(seed=500):
    return [
        {'type': 'ridge', 'depth': 0.04, 'y': 610, 'amp': 30, 'seed': seed, 'sharp': 0.3, 'color': '#b0987a', 'haze': 0.4, 'fog': 0.4},
        {'type': 'town', 'depth': 0.1, 'y': 640, 'x0': -200, 'x1': 1800, 's': 0.7, 'grade': 'city', 'lit': 0.2, 'haze': '#d8c8a8', 'seed': seed + 1},
        {'type': 'monument', 'depth': 0.12, 'x': 380, 'y': 650, 'kind': 'obelisk', 'h': 200, 'hill': [120, 30]},
        {'type': 'monument', 'depth': 0.12, 'x': 1260, 'y': 652, 'kind': 'obelisk', 'h': 180, 'hill': [120, 30]},
        {'type': 'ground', 'depth': 0.14, 'y': 664, 'amp': 6, 'seed': seed + 2, 'color': '#8a9a5a', 'color2': '#5a6a3a', 'grass': True, 'grassColor': '#a8b468'},
        {'type': 'water', 'depth': 0.16, 'points': [[-200, 690], [400, 700], [900, 712], [1800, 724]], 'w0': 60, 'w1': 90, 'reflect': [['0', '#b8d0d8'], ['1', '#5a7a8a']]},
        {'type': 'palms', 'depth': 0.2, 'items': [{'x': 140, 'y': 730, 'h': 230, 'lean': 0.05}, {'x': 250, 'y': 728, 'h': 260, 'lean': -0.04}, {'x': 1380, 'y': 730, 'h': 240, 'lean': 0.06}, {'x': 1490, 'y': 728, 'h': 270, 'lean': -0.03}], 'seed': seed + 3},
    ]


def heav(tods, sun=None, moon=None, horizon=630):
    t0, *rest = tods
    h = {'type': 'heavens', 'horizon': horizon, 'tod': t0}
    if sun:
        h['sun'] = sun
    if moon:
        h['moon'] = moon
    if rest:
        h['at'] = {str(i + 1): {'tod': t} for i, t in enumerate(rest) if t}
    return h


SUN_W = {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 300, 'size': 34}
MOON = {'rise': 19, 'set': 6.5, 'x0': 1300, 'x1': 300, 'peak': 340, 'size': 24}
motes = lambda opacity=0.28, **kw: dust(box=(-1400, 200, -8000, 3000, 950, 600), count=400, size=2.6, color='#fff0d8', opacity=opacity, wind=(4, -2, 0), **kw)


# ── 91 · The house of Yaqub ───────────────────────────────────────────────
brothers = [light([990 + i * 30, 744 + (i % 2) * 3], 56 + (i % 3) * 3, depth=0.235, **dim) for i in range(10)]
scene('household', 91, 'yaqub', 'The House of Yaqub', 'بيت يعقوب',
  art=["Yaqub and the young Yusuf appear only as steady lights, the brothers as dim figures of light. That Yusuf and Binyamin were the sons of Rahil is told in the commentaries."],
  prompt="Goat-hair tents among olive trees and green hills of Canaan at evening, a steady white light seated before the largest tent, a small bright light and a smaller one close beside him, and ten dim amber figures of light standing a little apart; ink-wash and parchment texture.",
  world=HILLS, ambient=['sheep', 'air'], base='#c8c0b0',
  layers=[
    heav([[16.8, 17.8, 10000], [17.8, 18.6, 10000], [18.6, 19.4, 12000]], sun={**SUN_W, 'x0': 1300, 'x1': 300}, moon=MOON),
    *canaan(),
    *zoom(1.7, 900, 744, tent(),
      light([860, 742], 62, depth=0.24, pose='kneel', **prophet),
      light([905, 744], 46, depth=0.24, **prophet),
      light([935, 746], 38, depth=0.24, color='#f4dcb8', glow=0.35, bright=1.0, solid=0.5),
      *brothers,
      {'type': 'brazier', 'depth': 0.26, 'x': 812, 'y': 760, 's': 0.5},
      {'type': 'light', 'kind': 'flame', 'depth': 0.26, 'pos': [812, 722], 'h': 14, 'color': '#ffb050', 'glow': 1.0}),
    near_grass(), motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['sheep', 'air'], 'cam': cam([980, 520, 1100], [1000, 570, -3000]),
     'say': "Ibrahim's grandson Yaqub, also called Israel, lived in the land of Canaan with his twelve sons."},
    {'dur': 10000, 'ambient': ['crickets', 'fire'], 'cam': cam([920, 525, 960], [930, 600, -3000]),
     'say': "He loved the two youngest most, Yusuf and Binyamin, and the older brothers saw it."},
    {'dur': 12000, 'ambient': ['crickets', 'air'], 'cam': cam([960, 522, 1040], [980, 588, -3000]), 'pendingVerse': pv('2:132')},
  ])

# ── 92 · Eleven stars ─────────────────────────────────────────────────────
import math
stars11 = []
for i in range(11):
    th = math.radians(18 + i * 14.4)
    x, y = 800 + 560 * math.cos(th), 360 - 170 * math.sin(th)
    stars11.append({'type': 'light', 'kind': 'flame', 'h': 34, 'color': '#e8eeff', 'glow': 1.0, 'pos': [round(x), round(y), -6000],
                    'at': {'2': {'path': [[round(x), round(y), -6000], [round(800 + (x - 800) * 0.6), round(y + 150), -6000]], 'dur': 6000, 'delay': 600}}})
scene('stars', 92, 'yusuf', 'Eleven Stars', 'حلم يوسف',
  art=["Yusuf and Yaqub appear only as steady lights. The dream's stars, sun and moon are shown as lights that bow by dipping toward him, nothing more."],
  prompt="A goat-hair tent under a night sky, a small light asleep beside it; then a dream sky of deep violet smoke where eleven stars, a golden sun and a silver moon hang in an arc and slowly dip toward a small steady light below; then morning, an older steady light beside the boy; ink-wash and parchment texture.",
  world=HILLS, ambient=['crickets', 'air'], base='#1a1820', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [[0, 1], [3, None]], 'layers': [
      heav([[22, 23, 9000], None, None, [5.6, 7, 12000]], sun={**SUN_W, 'x0': 1300, 'x1': 300}, moon=MOON),
      *canaan(),
      *zoom(1.7, 880, 744, tent(),
        light([900, 744], 46, depth=0.24, pose='kneel', **prophet),
        light([850, 742], 62, depth=0.24, show=[3, None], **prophet)),
      near_grass(),
    ]},
    {'type': 'set', 'show': [1, 3], 'dx': 6000, 'layers': [
      {'type': 'cosmos', 'smoke': 0.55, 'stars': 0, 'colors': ['#3a2a6a', '#8a6ab8', '#120a24'], 'gold': '#e8d8ff', 'base': '#06040e'},
      *stars11,
      {'type': 'light', 'kind': 'flame', 'h': 90, 'color': '#ffd070', 'glow': 1.0, 'pos': [520, 200, -6000], 'at': {'2': {'path': [[520, 200, -6000], [640, 380, -6000]], 'dur': 6000, 'delay': 600}}},
      {'type': 'light', 'kind': 'flame', 'h': 70, 'color': '#dfe6ff', 'glow': 0.9, 'pos': [1080, 200, -6000], 'at': {'2': {'path': [[1080, 200, -6000], [960, 380, -6000]], 'dur': 6000, 'delay': 600}}},
      light([800, 780], 58, depth=0.3, **prophet),
    ]},
    motes(),
  ],
  beats=[
    {'dur': 9000, 'ambient': ['crickets', 'air'], 'cam': cam([880, 525, 1000], [890, 595, -3000]),
     'say': "One night the boy Yusuf had a dream."},
    {'dur': 9000, 'ambient': ['air'], 'cam': cam([800, 470, 1150], [800, 470, -3000], dx=6000),
     'say': "He saw eleven stars, and the sun and the moon,"},
    {'dur': 9000, 'ambient': ['air'], 'sfx': 'whoosh', 'cam': cam([800, 480, 1100], [800, 490, -3000], dx=6000),
     'say': "and they were bowing down to him. His father told him to keep the dream from his brothers."},
    {'dur': 12000, 'ambient': ['birds', 'air'], 'cam': cam([870, 522, 1040], [880, 585, -3000]), 'pendingVerse': pv('12:4')},
  ])

# ── 93 · The well ─────────────────────────────────────────────────────────
walkers = [light([1150 + i * 30, 740], 62, depth=0.25, **dim, pose='walk', path=[[1300 + i * 30, 748], [985 + i * 30, 738]], dur=8000, delay=i * 120) for i in range(5)]
scene('well', 93, 'yusuf', 'The Well', 'البئر',
  art=["Yusuf appears only as a steady light; his brothers as dim figures of light. Nothing is shown of how he was put into the well; the shirt is told, not shown."],
  prompt="Dry hills at noon, a stone-rimmed well under a lone thorn tree, dim amber figures leading a small steady light toward it; then the dark inside of a well, a disc of sky far above and the small light kneeling below; then night at a tent, the dim figures returning to an old steady light; ink-wash and parchment texture.",
  world=DESERT, ambient=['desert', 'wind'], base='#d8c0a0', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 1], 'layers': [
      heav([[11.5, 12.6, 10000]], sun=SUN_W),
      *desert(),
      *zoom(1.8, 1000, 742,
        {'type': 'tree', 'depth': 0.2, 'x': 1150, 'y': 712, 'h': 150, 'kind': 'bare', 'seed': 145},
        {'type': 'well', 'depth': 0.24, 'x': 880, 'y': 742, 'w': 66, 'h': 32, 'frame': False},
        *walkers,
        light([960, 742], 49, depth=0.25, **prophet_day, pose='walk', path=[[1120, 750], [930, 742]], dur=8000, delay=300)),
      motes(),
    ]},
    {'type': 'set', 'show': [1, 2], 'dx': 6000, 'layers': [
      {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#1a1410'], [1, '#0a0806']]},
      {'type': 'facade', 'depth': 0.15, 'x': 800, 'y': 1000, 'w': 2400, 'h': 1400, 'stone': '#4a3a30', 'light': 0.5},
      {'type': 'beam', 'depth': 0.26, 'x': 800, 'y': 850, 'w': 220, 'color': '#fff2d0'},
      {'type': 'light', 'kind': 'flame', 'depth': 0.2, 'pos': [800, 150], 'h': 110, 'color': '#fff0d0', 'glow': 0.9},
      light([800, 820], 58, depth=0.3, pose='kneel', **prophet),
      dust(box=(500, -200, -3000, 1100, 1200, -1500), count=120, size=4, color='#fff0d0', opacity=0.4, wind=(0, 20, 0), swirl=20),
    ]},
    {'type': 'set', 'show': [2, None], 'dx': 12000, 'layers': [
      heav([[20.5, 21.5, 10000], [21.5, 22.5, 12000]], moon=MOON),
      *canaan(),
      *zoom(1.7, 940, 744, tent(),
        light([860, 742], 62, depth=0.24, pose='kneel', **prophet),
        *[light([1000 + i * 30, 746], 60, depth=0.235, **dim, pose='walk', path=[[1300 + i * 30, 752], [1000 + i * 30, 746]], dur=7000) for i in range(5)]),
      near_grass(),
    ]},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['desert', 'wind'], 'cam': cam([960, 520, 1100], [980, 570, -3000]),
     'say': "Jealous, the brothers took Yusuf out with them to the pastures, and threw him into a well."},
    {'dur': 10000, 'ambient': ['wind'], 'cam': cam([800, 520, 1100], [800, 520, -3000], dx=6000),
     'say': "Alone in the dark, he was inspired that one day he would tell them of what they had done."},
    {'dur': 10000, 'ambient': ['crickets', 'voices'], 'cam': cam([920, 522, 1040], [940, 585, -3000], dx=12000),
     'say': "At nightfall they came home weeping, with his shirt, and said a wolf had eaten him."},
    {'dur': 12000, 'ambient': ['crickets', 'air'], 'cam': cam([900, 520, 1080], [920, 580, -3000], dx=12000),
     'pendingVerse': pv('12:18', "Yaqub's answer: patience is most fitting")},
  ])

# ── 94 · The caravan ──────────────────────────────────────────────────────
camels = {'type': 'animals', 'depth': 0.235, 'size': 0.76, 'fade': 'none', 'area': [1000, 600, 1560, 780], 'pairs': [{'kind': 'camel', 'path': [[x, 750]], 'face': -1} for x in (1080, 1180, 1280)]}
trek = {'type': 'animals', 'depth': 0.16, 'size': 0.52, 'fade': 'none', 'area': [700, 560, 1700, 720], 'pairs': [{'kind': 'camel', 'path': [[x, 700]], 'face': -1} for x in (860, 1010, 1160, 1310, 1460)],
        'move': {'path': [[-500, 0, 0]], 'dur': 22000}}
scene('caravan', 94, 'yusuf', 'The Caravan', 'القافلة',
  art=["Yusuf appears only as a steady light; the travellers as dim figures of light. The caravan and its road are imagined."],
  prompt="A stone-rimmed well in dry hills, a caravan of camels resting beside it, a dim figure drawing up a rope and with it a small steady light; then the caravan crossing great golden dunes toward Egypt under a high sun; ink-wash and parchment texture.",
  world=DESERT, ambient=['desert', 'wind'], base='#d8c0a0', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 2], 'layers': [
      heav([[9.5, 10.5, 10000], [10.5, 11.5, 10000]], sun=SUN_W),
      *desert(),
      *zoom(1.5, 1000, 746,
        {'type': 'tree', 'depth': 0.2, 'x': 700, 'y': 712, 'h': 150, 'kind': 'bare', 'seed': 145},
        {'type': 'well', 'depth': 0.24, 'x': 880, 'y': 742, 'w': 66, 'h': 32, 'frame': True},
        camels,
        light([930, 744], 64, depth=0.25, **dim),
        light([990, 748], 62, depth=0.25, **dim),
        light([892, 746], 48, depth=0.245, show=[1, None], **prophet_day, pose='walk', path=[[882, 712], [910, 748]], dur=4000, delay=800)),
      motes(),
    ]},
    {'type': 'set', 'show': [2, None], 'dx': 6000, 'layers': [
      heav([[13, 14, 10000], [14, 15, 12000]], sun=SUN_W),
      {'type': 'ridge', 'depth': 0.04, 'y': 600, 'amp': 40, 'seed': 410, 'sharp': 0.4, 'color': '#b08a6a', 'haze': 0.4, 'fog': 0.4},
      {'type': 'dunes', 'depth': 0.1, 'y': 660, 'amp': 30, 'count': 9, 'seed': 411, 'lit': '#f0c890', 'body': '#c8925e', 'shade': '#7a4a40'},
      trek,
      light([1240, 696], 41, depth=0.16, **dim, pose='walk', path=[[1240, 696], [740, 696]], dur=22000),
      light([1272, 696], 32, depth=0.16, **prophet_day, pose='walk', path=[[1272, 696], [772, 696]], dur=22000),
      {'type': 'dunes', 'depth': 0.22, 'y': 760, 'amp': 40, 'count': 6, 'seed': 412, 'lit': '#e8b880', 'body': '#b8824e', 'shade': '#6a3e34'},
      dust(box=(-1400, 300, -6000, 3000, 950, 0), count=500, size=4, color='#e8c8a0', opacity=0.35, wind=(-40, -4, 0), blend='normal'),
    ]},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['desert', 'herd'], 'cam': cam([960, 520, 1100], [980, 570, -3000]),
     'say': "A caravan stopped at the well and sent a man to draw water."},
    {'dur': 9000, 'ambient': ['desert', 'voices'], 'cam': cam([900, 525, 980], [910, 595, -3000]),
     'say': "Instead of water he drew up a boy, and they hid him to sell as goods."},
    {'dur': 10000, 'ambient': ['wind', 'herd'], 'cam': cam([800, 510, 1150], [800, 550, -3000], dx=6000),
     'say': "In Egypt they sold him cheaply, for a few coins."},
    {'dur': 12000, 'ambient': ['wind'], 'cam': cam([800, 510, 1120], [800, 552, -3000], dx=6000), 'pendingVerse': pv('12:20')},
  ])

# ── 95 · The house of the Aziz ────────────────────────────────────────────
scene('aziz', 95, 'yusuf', 'The House of the Aziz', 'بيت العزيز',
  art=["Yusuf appears only as a steady light; the Aziz and the people of Egypt as dim figures of light. Egypt's look is imagined."],
  prompt="A great city of white walls and obelisks along a broad river lined with palms, crowds of dim amber lights in a market by the water, a steady light walking beside a tall dim figure toward a palace gate; then years passing, the light grown taller; ink-wash and parchment texture.",
  world=NILE, ambient=['city', 'water'], base='#d8c8a8',
  layers=[
    heav([[9, 11, 10000], [11, 16, 10000, 4], [16, 17.4, 12000]], sun=SUN_W),
    *nile(),
    {'type': 'crowd', 'area': [200, 900, -3500, -2800], 'y': [748, 730], 'count': 40, 'size': 58, 'color': '#ffd8a0', 'dim': 0.25, 'glow': 0.5, 'mill': 16, 'speed': 0, 'flicker': 0.15},
    *zoom(1.5, 1000, 750,
      {'type': 'facade', 'depth': 0.18, 'x': 1260, 'y': 712, 'w': 520, 'h': 190, 'gate': {'w': 110, 'h': 120}, 'towers': True, 'stone': '#e0d0b0', 'ppu': 0.8},
      light([920, 752], 47, depth=0.24, **prophet_day, pose='walk', path=[[760, 760], [1080, 748]], dur=9000, at={'1': {'h': 61, 'pose': 'stand', 'path': None, 'pos': [1020, 750]}}),
      light([960, 752], 62, depth=0.24, **dim, pose='walk', path=[[800, 760], [1120, 748]], dur=9000, at={'1': {'pose': 'stand', 'path': None, 'pos': [1080, 750]}})),
    near_grass(505), motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['city', 'water'], 'cam': cam([960, 535, 900], [1000, 700, -3000]),
     'say': "In Egypt a great minister, the Aziz, bought him, and told his wife: make his stay a good one; he may be of use to us."},
    {'dur': 10000, 'ambient': ['city', 'birds'], 'cam': cam([1020, 540, 840], [1050, 710, -3000]),
     'say': "Yusuf grew up in that house, and God gave him wisdom and knowledge."},
    {'dur': 12000, 'ambient': ['water', 'air'], 'cam': cam([960, 515, 1080], [980, 570, -3000]), 'pendingVerse': pv('12:22')},
  ])

# ── 96 · The torn shirt ───────────────────────────────────────────────────
scene('torn', 96, 'yusuf', 'The Torn Shirt', 'القميص الممزق',
  art=["Yusuf appears only as a steady light; the Aziz, his wife and the witness as dim figures of light. Nothing more than the run to the door is shown; the shirt is told, not shown."],
  prompt="A lamplit hall of a palace with tall columns and closed doors, a dim amber figure of light and a steady white light; the white light hurrying toward a lit doorway, the amber light behind; in the doorway a third dim figure; ink-wash and parchment texture.",
  world=HALL, ambient=['echo', 'fire'], base='#10141e',
  layers=[
    *room('aziz'),
    light([760, 778], 77, depth=0.32, color='#f0b888', glow=0.35, bright=1.0, solid=0.6,
          at={'1': {'pose': 'walk', 'path': [[760, 778], [1080, 770]], 'dur': 3600, 'delay': 600}, '2': {'pose': 'stand', 'path': None, 'pos': [1080, 770]}}),
    light([860, 776], 82, depth=0.32, **prophet, at={'1': {'pose': 'walk', 'path': [[860, 776], [1180, 770]], 'dur': 3000}, '2': {'pose': 'stand', 'path': None, 'pos': [1180, 770]}}),
    light([1262, 712], 47, depth=0.185, show=[2, None], color='#e8c098', glow=0.4, bright=1.0, solid=0.6),
    *front('aziz'),
    dust(box=(-400, 200, -3000, 2000, 950, -1200), count=300, size=3, color='#ffd8a0', opacity=0.3, wind=(4, -6, 0), swirl=20),
  ],
  beats=[
    {'dur': 9000, 'ambient': ['echo', 'fire'], 'cam': cam([860, 590, 40], [880, 1020, -3000]),
     'say': "The wife of the Aziz desired him. She closed the doors, but he refused: I seek refuge in God."},
    {'dur': 8000, 'ambient': ['echo'], 'sfx': [{'name': 'door', 'at': 3000}], 'cam': cam([980, 590, 40], [1020, 1020, -3000]),
     'say': "He ran for the door; she caught his shirt from behind, and it tore."},
    {'dur': 9000, 'ambient': ['echo', 'voices'], 'cam': cam([1060, 585, 40], [1100, 1020, -3000]),
     'say': "Her husband stood in the doorway. A witness said: if the shirt is torn at the back, he is telling the truth. It was."},
    {'dur': 12000, 'ambient': ['echo', 'air'], 'cam': cam([1000, 580, 40], [1040, 1020, -3000]), 'pendingVerse': pv('12:23', 'his answer, from "I seek the refuge of Allah" to the end')},
  ])

# ── 97 · Prison ───────────────────────────────────────────────────────────
scene('prison', 97, 'yusuf', 'Two Companions in Prison', 'السجن',
  art=["Yusuf appears only as a steady light; his fellow prisoners as dim figures of light. The prison is imagined; their dreams are told, not shown."],
  prompt="A bare stone cell, a single shaft of daylight falling from a high window, a steady white light kneeling in it and two dim amber figures of light listening; ink-wash and parchment texture.",
  world={**HALL, 'fog': '#1e1a18'}, ambient=['echo', 'drips'], base='#100c0a',
  layers=[
    {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#1a1410'], [1, '#0e0a08']]},
    {'type': 'facade', 'depth': 0.2, 'x': 800, 'y': 724, 'w': 2400, 'h': 820, 'stone': '#4a4038', 'light': 0.6, 'doors': [{'x': 1240, 'w': 40, 'h': 66}]},
    {'type': 'floor', 'depth': 0.21, 'y': 726, 'vp': [800, 520], 'color': '#3a3430', 'color2': '#141210', 'lines': 8, 'gloss': 0.1, 'area': [-800, 720, 2400, 1350]},
    {'type': 'beam', 'depth': 0.28, 'x': 860, 'y': 790, 'w': 120, 'color': '#fff2d0'},
    light([860, 786], 77, depth=0.3, pose='kneel', **prophet, at={'1': {'pose': 'stand'}, '2': {'pose': 'raise'}}),
    light([1000, 790], 75, depth=0.3, **{**dim, 'color': '#c8a888'}),
    light([1090, 792], 73, depth=0.3, **{**dim, 'color': '#c8a888'}),
    dust(box=(500, 0, -2600, 1300, 950, -2000), count=200, size=3, color='#fff0d0', opacity=0.45, wind=(1, 6, 0), swirl=12),
  ],
  beats=[
    {'dur': 9000, 'ambient': ['echo', 'drips'], 'cam': cam([920, 540, 260], [940, 1050, -3000]),
     'say': "Though he had done no wrong, Yusuf was put in prison, and two young men were imprisoned with him."},
    {'dur': 10000, 'ambient': ['echo', 'voice'], 'cam': cam([960, 540, 260], [980, 1050, -3000]),
     'say': "One dreamed he was pressing wine; the other, that birds ate bread from his head. Before explaining their dreams, Yusuf spoke to them of God."},
    {'dur': 12000, 'ambient': ['echo', 'air'], 'cam': cam([940, 535, 260], [960, 1050, -3000]), 'pendingVerse': pv('12:39')},
  ])

# ── 98 · The king's dream ─────────────────────────────────────────────────
fat = {'type': 'animals', 'depth': 0.24, 'show': [1, 2], 'size': 0.8, 'fade': 'none', 'area': [220, 600, 800, 790],
       'pairs': [{'kind': 'cow', 'solo': True, 'path': [[300 + i * 72, 744 + (i % 2) * 12]]} for i in range(7)]}
lean = {'type': 'animals', 'depth': 0.241, 'show': [1, 2], 'size': 0.8, 'fade': 'none', 'area': [800, 580, 1400, 790], 'reveal': {'dir': 'left', 'dur': 3500, 'delay': 3000},
        'pairs': [{'kind': 'leancow', 'solo': True, 'path': [[880 + i * 72, 744 + (i % 2) * 12]], 'face': -1} for i in range(7)]}
scene('cows', 98, 'yusuf', "The King's Dream", 'رؤيا الملك',
  art=["The king appears only as a dim figure of light. The dream's cows and ears of grain are drawn in ink as he described them."],
  prompt="A lapis throne hall where a dim figure sits troubled; then a dream of violet mist where seven sleek cows are followed by seven lean ones, their ribs showing; then seven green ears of grain beside seven withered ones; ink-wash and parchment texture.",
  world=DREAM, ambient=['echo', 'air'], base='#0e0a18', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 1], 'layers': [
      *room('kinghall'),
      *zoom(1.8, 800, 712, {'type': 'platform', 'depth': 0.2, 'x': 800, 'y': 712, 'w': 420, 'steps': 5, 'rise': 6, 'dais': 12, 'stone': '#b8845a', 'lit': '#e8b884', 'dark': '#4a2e22', 'ppu': 1},
        light([800, 674], 51, depth=0.2, color='#c89878', glow=0.3, bright=0.9, solid=0.7, pose='kneel')),
      *front('kinghall'),
    ]},
    {'type': 'set', 'show': [1, None], 'dx': 6000, 'layers': [
      {'type': 'cosmos', 'smoke': 0.6, 'stars': 0, 'colors': ['#3a2a6a', '#8a6ab8', '#120a24'], 'gold': '#e8d8ff', 'base': '#06040e'},
      {'type': 'ground', 'depth': 0.2, 'y': 720, 'amp': 8, 'seed': 600, 'color': '#3a3050', 'color2': '#1a1428'},
      fat, lean,
      {'type': 'ears', 'show': [2, None], 'depth': 0.24, 'n': 7, 'x0': 340, 'x1': 780, 'y': 760, 'h': 240, 'state': 'green', 'area': [300, 480, 840, 780], 'reveal': {'dir': 'up', 'dur': 3000}},
      {'type': 'ears', 'show': [2, None], 'depth': 0.24, 'n': 7, 'x0': 820, 'x1': 1260, 'y': 760, 'h': 240, 'state': 'dry', 'seed': 9, 'area': [780, 480, 1340, 780], 'reveal': {'dir': 'up', 'dur': 3000, 'delay': 1500}},
      dust(box=(-1400, 100, -8000, 3000, 950, 0), count=400, size=3, color='#d8c8ff', opacity=0.35, wind=(2, -2, 0), swirl=60),
    ]},
  ],
  beats=[
    {'dur': 9000, 'ambient': ['echo', 'voices'], 'cam': cam([800, 560, 480], [800, 800, -3000]),
     'say': "The king of Egypt dreamed a dream that no one in his court could explain."},
    {'dur': 10000, 'ambient': ['air'], 'cam': cam([800, 640, 900], [800, 1150, -3000], dx=6000),
     'say': "Seven fat cows were eaten by seven lean ones;"},
    {'dur': 9000, 'ambient': ['air', 'wind'], 'cam': cam([800, 640, 900], [800, 1150, -3000], dx=6000),
     'say': "and there were seven green ears of grain, and seven dry."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([800, 640, 960], [800, 1180, -3000], dx=6000), 'pendingVerse': pv('12:43')},
  ])

# ── 99 · The storehouses ──────────────────────────────────────────────────
granaries = [{'type': 'masonry', 'depth': 0.18, 'pos': [x, 690], 'w': 110, 'h': 110, 'side': 36, 'courses': 7, 'blocks': 5, 'built': 0.1,
              'stone': '#c8b090', 'stone2': '#dac8a8', 'ink': '#5a4a38', 'at': {'1': {'build': [0.1, 1, 8000, i * 600]}, '2': {'built': 1}}} for i, x in enumerate((1000, 1150, 1300))]
scene('storehouses', 99, 'yusuf', 'The Storehouses', 'مخازن الحبوب',
  art=["Yusuf appears only as a steady light; the people as dim figures of light. The granaries and fields are imagined."],
  prompt="Golden wheat fields along a broad river under a high sun, tall granaries of pale stone rising one by one, a steady white light overseeing dim workers; then the fields dry and cracked, long lines of travellers' lights coming for grain; ink-wash and parchment texture.",
  world=NILE, ambient=['wind', 'work'], base='#d8c8a8', dissolve=2600,
  layers=[
    heav([[8.5, 10, 10000], [10, 16, 10000, 6], [12, 15, 10000, 5], [15, 16.6, 12000]], sun=SUN_W),
    {'type': 'ridge', 'depth': 0.04, 'y': 610, 'amp': 30, 'seed': 520, 'sharp': 0.3, 'color': '#b0987a', 'haze': 0.4, 'fog': 0.4},
    {'type': 'ground', 'depth': 0.12, 'y': 664, 'amp': 6, 'seed': 521, 'color': '#8a9a5a', 'color2': '#5a6a3a', 'grass': True, 'grassColor': '#a8b468',
     'at': {'2': {'color': '#b09a6a', 'color2': '#8a7448', 'grass': False, 'cracks': True}}},
    *granaries,
    {'type': 'crowd', 'show': [0, 2], 'area': [500, 1300, -4200, -3400], 'y': [730, 712], 'count': 40, 'size': 52, 'color': '#ffd8a0', 'dim': 0.25, 'glow': 0.5, 'mill': 18, 'speed': 0, 'flicker': 0.15},
    {'type': 'crowd', 'show': [2, None], 'area': [500, 1500, -4200, -3400], 'y': [730, 712], 'count': 70, 'size': 52, 'color': '#ffd8a0', 'dim': 0.3, 'glow': 0.5, 'flow': [-1, 0], 'speed': 40, 'mill': 3, 'flicker': 0.15},
    light([900, 742], 60, depth=0.24, **prophet_day),
    near_grass(523), motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['wind', 'birds'], 'cam': cam([950, 515, 1150], [970, 560, -3000]),
     'say': "From prison Yusuf explained it: seven good years, then seven years of famine. The king freed him, and Yusuf asked to be put in charge of the land's grain."},
    {'dur': 10000, 'ambient': ['work', 'wind'], 'sfx': [{'name': 'hoe', 'at': 2000}, {'name': 'hoe', 'at': 5000}], 'cam': cam([1000, 515, 1080], [1040, 560, -3000]),
     'say': "Through the good years the granaries rose and filled."},
    {'dur': 10000, 'ambient': ['wind', 'crowd'], 'cam': cam([950, 512, 1180], [970, 555, -3000]),
     'say': "Then the famine came, and people travelled from far lands to buy grain in Egypt."},
    {'dur': 12000, 'ambient': ['wind'], 'cam': cam([960, 515, 1120], [980, 560, -3000]), 'pendingVerse': pv('12:55')},
  ])

# ── 100 · The brothers and the cup ────────────────────────────────────────
bros = [light([640 + i * 48, 788 + (i % 2) * 3], 80, depth=0.32, **dim, pose='walk', path=[[1350 + i * 48, 796], [640 + i * 48, 788]], dur=7000, delay=i * 100) for i in range(10)]
scene('cup', 100, 'yusuf', "The King's Cup", 'الإخوة في مصر',
  art=["Yusuf appears only as a steady light; his brothers as dim figures of light, Binyamin a little brighter. The cup is shown only as a glint of gold."],
  prompt="A lapis throne hall, a steady white light on a dais, ten dim amber figures of light entering and bowing their heads; later an eleventh beside them, a glint of gold found among their packs, the ten leaving while the eleventh stays; ink-wash and parchment texture.",
  world=HALL, ambient=['echo', 'voices'], base='#10141e',
  layers=[
    *room('yusufhall'),
    *zoom(1.5, 800, 712, {'type': 'platform', 'depth': 0.2, 'x': 800, 'y': 712, 'w': 420, 'steps': 5, 'rise': 6, 'dais': 12, 'stone': '#b8845a', 'lit': '#e8b884', 'dark': '#4a2e22', 'ppu': 1},
      light([800, 674], 51, depth=0.2, **prophet)),
    *[{**b, 'at': {'3': {'pose': 'walk', 'path': [[640 + i * 48, 788], [1500 + i * 48, 796]], 'dur': 7000, 'delay': 1500}}} for i, b in enumerate(bros)],
    light([1140, 790], 76, depth=0.32, show=[1, None], color='#f8e0c0', glow=0.45, bright=1.1, solid=0.5, pose='walk', path=[[1450, 798], [1140, 790]], dur=7000),
    {'type': 'light', 'kind': 'flame', 'show': [2, None], 'depth': 0.325, 'pos': [1162, 762], 'h': 9, 'color': '#ffd060', 'glow': 1.4},
    *front('yusufhall'),
    dust(box=(-400, 200, -3000, 2000, 950, -1200), count=300, size=3, color='#ffd8a0', opacity=0.3, wind=(4, -6, 0), swirl=20),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['echo', 'voices'], 'cam': cam([860, 520, 520], [880, 900, -3000]),
     'say': "Among those who came for grain were Yusuf's ten brothers. He knew them; they did not know him."},
    {'dur': 10000, 'ambient': ['echo', 'voices'], 'cam': cam([900, 520, 520], [920, 900, -3000]),
     'say': "He asked them to bring their youngest brother, and on their next journey Binyamin came with them."},
    {'dur': 10000, 'ambient': ['echo'], 'sfx': [{'name': 'gate', 'at': 6000}], 'cam': cam([1000, 525, 520], [1040, 900, -3000]),
     'say': "Yusuf told Binyamin who he was. Then the king's cup was found in Binyamin's pack, and by the law of the land he stayed."},
    {'dur': 12000, 'ambient': ['echo', 'air'], 'cam': cam([900, 520, 520], [920, 900, -3000]),
     'pendingVerse': pv('12:76', 'its closing words, that over every possessor of knowledge is one more knowing')},
  ])

# ── 101 · Yaqub's grief ───────────────────────────────────────────────────
scene('grief', 101, 'yaqub', "Yaqub's Grief", 'حزن يعقوب',
  art=["Yaqub appears only as a steady light, dimmed and greyed by grief, never shown suffering; his sons as dim figures of light."],
  prompt="A goat-hair tent among olive trees at nightfall, an old steady light gone grey and dim sitting alone before it, dim amber figures of light returning at a distance and stopping; a sky of deep blue with a few stars; ink-wash and parchment texture.",
  world=HILLS, ambient=['wind', 'crickets'], base='#1a1820',
  layers=[
    heav([[18.6, 19.6, 10000], [19.6, 20.6, 10000], [20.6, 21.4, 12000]], sun={**SUN_W, 'x0': 1300, 'x1': 300}, moon=MOON),
    *canaan(),
    *zoom(1.7, 940, 744, tent(),
      light([850, 744], 58, depth=0.24, pose='kneel', color='#d8d8d8', glow=0.3, bright=0.9, at={'2': {'glow': 0.45, 'bright': 1.05}}),
      *[light([1000 + i * 30, 748], 60, depth=0.235, **dim, pose='walk', path=[[1300 + i * 30, 754], [1000 + i * 30, 748]], dur=7000, delay=i * 120) for i in range(9)]),
    near_grass(), motes(opacity=0.2),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['wind', 'crickets'], 'cam': cam([960, 520, 1100], [980, 570, -3000]),
     'say': "When the brothers came home without Binyamin, Yaqub turned away from them."},
    {'dur': 10000, 'ambient': ['crickets'], 'cam': cam([860, 525, 950], [870, 600, -3000]),
     'say': "He grieved for Yusuf until his eyes went white with sorrow, yet he never gave up hope in God's mercy."},
    {'dur': 12000, 'ambient': ['crickets', 'air'], 'cam': cam([900, 522, 1020], [910, 585, -3000]), 'pendingVerse': pv('12:86')},
  ])

# ── 102 · The dream fulfilled ─────────────────────────────────────────────
bow11 = [light([540 + i * 52, 800], 80, depth=0.32, **dim, at={'2': {'pose': 'bow', 'w': 1.0}}) for i in range(11)]
scene('reunion', 102, 'yusuf', 'The Dream Fulfilled', 'لقاء يوسف وأبيه',
  art=["Yusuf and Yaqub appear only as steady lights; the family as dim figures of light. Their bowing was the greeting of their time, as the Quran tells it."],
  prompt="An old steady light seated before a tent at dawn, a shirt of white light laid over him, his glow brightening; then a lapis palace hall, a steady white light on the dais with two lights seated beside him, eleven dim amber lights bowed low before them; the dream of the eleven stars, the sun and the moon fulfilled; ink-wash and parchment texture.",
  world=HALL, ambient=['echo', 'voices'], base='#10141e', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [[0, 1], [2, None]], 'layers': [
      *room('yusufhall'),
      *zoom(1.5, 800, 712, {'type': 'platform', 'depth': 0.2, 'x': 800, 'y': 712, 'w': 420, 'steps': 5, 'rise': 6, 'dais': 12, 'stone': '#b8845a', 'lit': '#e8b884', 'dark': '#4a2e22', 'ppu': 1},
        light([800, 674], 51, depth=0.2, **prophet),
        light([750, 674], 51, depth=0.2, show=[2, None], **prophet),
        light([850, 674], 48, depth=0.2, show=[2, None], color='#f0d8c0', glow=0.4, bright=1.1, solid=0.5)),
      *bow11,
      *front('yusufhall'),
    ]},
    {'type': 'set', 'show': [1, 2], 'dx': 6000, 'layers': [
      heav([None, [5.2, 6.6, 10000]], sun={**SUN_W, 'x0': 1300, 'x1': 300}),
      *canaan(),
      *zoom(1.7, 860, 744, tent(),
        light([850, 744], 58, depth=0.24, pose='kneel', color='#d8d8d8', glow=0.3, bright=0.9,
              at={'1': {'color': '#fffaf0', 'glow': 0.8, 'bright': 1.5}}),
        {'type': 'light', 'kind': 'flame', 'depth': 0.241, 'pos': [852, 738], 'h': 22, 'color': '#ffffff', 'glow': 0.9}),
      near_grass(),
    ]},
    dust(box=(-400, 200, -3000, 2000, 950, -1200), count=300, size=3, color='#ffd8a0', opacity=0.3, wind=(4, -6, 0), swirl=20),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['echo', 'voices'], 'cam': cam([800, 520, 520], [800, 880, -3000]),
     'say': "At last he told them: I am Yusuf. And he forgave them: no blame on you today."},
    {'dur': 10000, 'ambient': ['birds', 'air'], 'cam': cam([860, 525, 950], [870, 600, -3000], dx=6000),
     'say': "He sent his shirt to his father. Laid over Yaqub's face, it gave him back his sight."},
    {'dur': 11000, 'ambient': ['echo', 'voices'], 'cam': cam([800, 520, 520], [800, 880, -3000]),
     'say': "The whole family came to Egypt. Yusuf seated his parents beside him, and his brothers bowed: the dream of the eleven stars, the sun and the moon had come true. My Lord, Yusuf prayed, let me die in submission to You, and join me with the righteous."},
    {'dur': 13000, 'ambient': ['echo', 'air'], 'cam': cam([800, 520, 520], [800, 880, -3000]),
     'pendingVerse': pv('12:100', 'from his raising his parents to "this is the explanation of my vision of before"')},
  ])

write_chapter(C9 + 'chapter.json', {
    'number': 9, 'title': 'Yaqub and Yusuf', 'arabic': 'يعقوب ويوسف', 'nodes': ['yaqub', 'yusuf'],
    'parts': [{'title': 'The House of Yaqub', 'from': O(91), 'to': O(92)}, {'title': 'The Well and the Caravan', 'from': O(93), 'to': O(94)},
              {'title': 'In Egypt', 'from': O(95), 'to': O(97)}, {'title': "The King's Dream", 'from': O(98), 'to': O(99)},
              {'title': 'The Brothers', 'from': O(100), 'to': O(102)}]})
print('c9 ok')
