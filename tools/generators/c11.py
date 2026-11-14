from base import *
from rooms import room, front

# Chapter 11 · Musa: from the Nile to the mountain. True scale: a person of 1.7 m is 255 × depth design
# units tall; people and props stand on a subject plane at depth 0.42 (a grown man about 107).
C11 = ROOT + 'src/story/chapters/c11/'
os.makedirs(C11, exist_ok=True)


def scene(sid, order, node, title, arabic, art, prompt, world, layers, beats, ambient, base='#1a1820', dissolve=2400):
    order = ORDER.get(sid, order)
    s = {'id': sid, 'chapter': 11, 'order': order, 'node': node, 'title': title, 'arabic': arabic, 'source': 'quran', 'ayahs': [], 'art': art,
         'ambient': ambient, 'base': base, 'captions': 'parchment', 'renderer': 'gl', 'pen': True, 'dissolve': dissolve, 'world': world,
         'cam': beats[0]['cam'], 'imagePrompt': prompt, 'layers': layers, 'beats': beats}
    open(C11 + f's{order}-{sid}.json', 'w').write(dump(s))


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
SAND = {'fog': '#dcc0a0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.05, 'rays': 0, 'bloom': 0.6, 'haze': 0.2, 'hazeY': 0.62, 'shake': 0.3, 'dof': 0}
HALL = {'fog': '#2a2430', 'fogNear': 4000, 'fogFar': 30000, 'light': 0.95, 'rays': 0, 'bloom': 0.75, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}

musa_c = dict(color='#fffaf0', glow=0.35, bright=1.1, solid=0.5)          # a prophet by day
musa_n = dict(color='#fffaf0', glow=0.6, bright=1.35)                      # by night
dim = dict(color='#ecc49a', glow=0.25, bright=0.95, solid=0.6)
cold = dict(color='#b8b0c8', glow=0.2, bright=0.85, solid=0.7)             # Pharaoh and his men
kind_ = dict(color='#fff0dc', glow=0.3, bright=1.0, solid=0.5)            # his mother, sister, Asiya
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
    """Far Egypt: desert cliffs, a white city with obelisks, the green strip of the Nile."""
    return [
        {'type': 'ridge', 'depth': 0.04, 'y': 612, 'amp': 30, 'seed': seed, 'sharp': 0.3, 'color': '#b0987a', 'haze': 0.4, 'fog': 0.4},
        {'type': 'town', 'depth': 0.1, 'y': 650, 'x0': -200, 'x1': 1800, 's': P(0.1, 1) / 30, 'grade': 'city', 'lit': lit, 'haze': '#d8c8a8', 'seed': seed + 1},
        {'type': 'monument', 'depth': 0.12, 'x': 380, 'y': 660, 'kind': 'obelisk', 'h': P(0.12, 20), 'hill': [80, 16]},
        {'type': 'monument', 'depth': 0.12, 'x': 1260, 'y': 662, 'kind': 'obelisk', 'h': P(0.12, 18), 'hill': [80, 16]},
        {'type': 'ground', 'depth': 0.14, 'y': 670, 'amp': 6, 'seed': seed + 2, 'color': '#8a9a5a', 'color2': '#5a6a3a', 'grass': True, 'grassColor': '#a8b468'},
    ]


def river(d=0.3, y=780, w=120, **kw):
    """The Nile as a broad band crossing the frame at depth d."""
    return {'type': 'water', 'depth': d, 'points': [[-1400, y - 6], [800, y], [3000, y + 6]], 'w0': w, 'w1': w, 'reflect': [['0', '#b8d0d8'], ['1', '#4a6a7a']], **kw}


def palms(d=0.26, xs=(150, 260, 1360, 1470), y=772):
    return {'type': 'palms', 'depth': d, 'items': [{'x': x, 'y': y, 'h': P(d, 9 + (i % 2)), 'lean': 0.05 * (1 if i % 2 else -1)} for i, x in enumerate(xs)], 'seed': 810}


def hall(stone='#7a6a5a'):
    return [
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#141a2a'], [1, '#0e121c']]},
        {'type': 'facade', 'depth': 0.18, 'x': 800, 'y': 712, 'w': 2400, 'h': 820, 'stone': stone, 'light': 0.85, 'style': 'ashlar', 'doors': [{'x': 1070, 'w': 60, 'h': 110, 'lit': True}]},
        {'type': 'floor', 'depth': 0.19, 'y': 714, 'vp': [800, 500], 'color': '#5a5048', 'color2': '#1e1a18', 'lines': 14, 'gloss': 0.35, 'area': [-800, 708, 2400, 1350]},
        {'type': 'column', 'depth': 0.26, 'x': 420, 'y': 740, 'h': 600, 'w': 44, 'stone': '#c8a070', 'lit': '#f0d0a0', 'dark': '#5a3e28'},
        {'type': 'column', 'depth': 0.26, 'x': 1180, 'y': 740, 'h': 600, 'w': 44, 'stone': '#c8a070', 'lit': '#f0d0a0', 'dark': '#5a3e28'},
        {'type': 'brazier', 'depth': 0.3, 'x': 680, 'y': 790, 's': 0.6},
        {'type': 'light', 'kind': 'flame', 'depth': 0.3, 'pos': [680, 742], 'h': 20, 'color': '#ffb050', 'glow': 1.1},
        {'type': 'brazier', 'depth': 0.3, 'x': 1100, 'y': 790, 's': 0.6},
        {'type': 'light', 'kind': 'flame', 'depth': 0.3, 'pos': [1100, 742], 'h': 20, 'color': '#ffb050', 'glow': 1.1},
    ]


ART_MUSA = "Musa appears only as a steady light; Pharaoh, his household and the people as dim figures of light, Pharaoh's cold and grey. Egypt's look is imagined."

# ── 112 · Pharaoh's Egypt ─────────────────────────────────────────────────
scene('pharaoh', 112, 'musa', "Pharaoh's Egypt", 'مصر فرعون',
  art=[ART_MUSA, "That the Children of Israel were forced to build for Pharaoh is from the commentaries; the Quran tells of their oppression and of his order against their sons (28:4), which is told, never shown."],
  prompt="A great Egyptian city on the Nile under a hard sun, pylon gates and obelisks; long lines of dim amber lights hauling stone as a great wall rises course by course; on a high terrace a single cold grey light watching; then dusk, the lights of the workers bowed; ink-wash and parchment texture.",
  world=NILE, ambient=['work', 'city'], base='#d8c8a8',
  layers=[
    heav([[9, 12, 10000], [16, 17.6, 10000], [17.6, 18.4, 12000]]),
    *egypt(),
    {'type': 'masonry', 'depth': 0.2, 'pos': [1040, 712], 'w': P(0.2, 30), 'h': P(0.2, 16), 'side': 60, 'courses': 12, 'blocks': 14, 'built': 0.25,
     'stone': '#d8c4a0', 'stone2': '#e8d8b8', 'ink': '#6a5a48', 'at': {'0': {'build': [0.25, 0.6, 10000]}, '1': {'built': 0.6}, '2': {'built': 0.6}}},
    {'type': 'facade', 'depth': 0.16, 'x': 420, 'y': 704, 'w': P(0.16, 26), 'h': P(0.16, 14), 'gate': {'w': P(0.16, 4), 'h': P(0.16, 7)}, 'towers': True, 'stone': '#e0d0b0', 'style': 'pylon', 'ppu': 0.8},
    light([420, 572], P(0.16), depth=0.161, **cold),
    {'type': 'crowd', 'area': [700, 1500, -2400, -1700], 'y': [FEET - 4, FEET - 30], 'count': 70, 'size': P(0.36), 'color': '#ffd8a0', 'dim': 0.35, 'glow': 0.35,
     'flow': [-1, 0], 'speed': 22, 'mill': 3, 'flicker': 0.1, 'at': {'1': {'speed': 8, 'dim': 0.55}}},
    {'type': 'ground', 'depth': 0.5, 'y': 880, 'amp': 6, 'seed': 805, 'color': '#c8aa80', 'color2': '#9a7a58'},
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['work', 'city'], 'sfx': [{'name': 'hoe', 'at': 1500}, {'name': 'hoe', 'at': 5200}], 'cam': cam([860, 515, 1100], [880, 600, -3000]),
     'say': "In Egypt, Pharaoh ruled as though he were a god, and made the Children of Israel his slaves."},
    {'dur': 10000, 'ambient': ['wind', 'work'], 'cam': cam([720, 520, 900], [700, 600, -3000]),
     'say': "Fearing that a boy born among them would one day end his rule, he ordered that their newborn sons be killed."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([860, 515, 1050], [880, 610, -3000]), 'pendingVerse': pv('28:4')},
  ])

# ── 113 · The basket on the river ─────────────────────────────────────────
BX = 980                                           # where the basket is set on the water
basket = {'type': 'basket', 'depth': 0.37, 'x': BX, 'y': 812, 'w': P(0.37, 0.9), 'area': [BX - 40, 780, BX + 40, 818],
          'at': {'1': {'move': {'path': [[0, 0, 0], [0, 0, 0], [560, 6, 0]], 'dur': 16000, 'delay': 2000}}, '2': {'move': {'path': [[560, 6, 0]], 'dur': 1}}}}
scene('basket', 113, 'musa', 'The Basket on the River', 'السلة على النهر',
  art=[ART_MUSA, "His mother and the infant appear only as soft lights. That the basket was of reeds sealed with pitch is from the commentaries; the Quran tells of the chest cast into the river (20:39, 28:7)."],
  prompt="A small mud-brick house by the Nile at night, one lamp in its door, a soft light of a mother holding a tiny light; then at the first grey of dawn she kneels among papyrus at the water's edge and a small reed basket drifts away on the broad river; ink-wash and parchment texture.",
  world=NIGHT, ambient=['water', 'crickets'], base='#141824',
  layers=[
    heav([[22, 23, 10000], [4.8, 5.8, 12000], [5.8, 6.4, 12000]], horizon=640),
    *egypt(lit=0.05),
    palms(0.24, (220, 1380)),
    {'type': 'facade', 'depth': 0.34, 'x': 760, 'y': 784, 'w': P(0.34, 6), 'h': P(0.34, 3.4), 'stone': '#a08868', 'light': 0.7, 'doors': [{'x': 820, 'w': P(0.34, 0.9), 'h': P(0.34, 1.9), 'lit': True}], 'ppu': 0.9},
    {'type': 'ground', 'depth': 0.34, 'y': 788, 'amp': 4, 'seed': 820, 'x0': -900, 'x1': 2400, 'color': '#5a6040', 'color2': '#3a4028'},
    river(0.36, 812, 90),
    basket,
    light([BX, 806], P(0.372, 0.45), depth=0.372, pose='babe', w=1, color='#fffaf0', glow=0.7, bright=1.2, show=[1, None],
          at={'1': {'path': [[BX, 806], [BX, 806], [BX + 560, 812]], 'dur': 16000, 'delay': 2000}, '2': {'pos': [BX + 560, 812], 'path': None}}),
    light([900, 792], P(D, 1.6), depth=D, **kind_, at={'1': {'pos': [940, 798], 'pose': 'kneel'}, '2': {'pos': [940, 798], 'pose': 'kneel'}}),
    light([920, 760], P(D, 0.45), depth=D + 0.001, pose='babe', w=1, color='#fffaf0', glow=0.6, bright=1.2, show=[0, 1]),
    {'type': 'reeds', 'depth': 0.44, 'x0': -200, 'x1': 1800, 'y': 870, 'h': P(0.44, 2.2), 'count': 14, 'seed': 821},
    motes(0.16),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['crickets', 'water'], 'cam': cam([880, 535, 500], [900, 800, -3000]),
     'say': "In those days a son was born to a woman of Israel. God inspired her: nurse him, and when you fear for him, cast him into the river."},
    {'dur': 13000, 'ambient': ['water', 'birds'], 'cam': cam([1100, 530, 700], [1140, 760, -3000]),
     'say': "So she laid him in a basket and set it on the Nile, trusting God's promise to return him to her."},
    {'dur': 12000, 'ambient': ['water', 'air'], 'cam': cam([1200, 525, 800], [1240, 720, -3000]), 'pendingVerse': pv('28:7')},
  ])

# ── 114 · Found by the palace ─────────────────────────────────────────────
scene('asiya', 114, 'musa', 'Found by the Palace', 'في بيت فرعون',
  art=[ART_MUSA, "Pharaoh's wife is named Asiya in the hadith; she appears only as a soft light, her women as dim lights."],
  prompt="The water steps of a white palace on the Nile in morning light, papyrus and palms, a small reed basket drawn in to the lowest step; a soft white light of a noblewoman bending over it among dim amber lights of her women, a cold grey light standing above on the terrace; ink-wash and parchment texture.",
  world=NILE, ambient=['water', 'birds'], base='#d8c8a8',
  layers=[
    heav([[7.4, 8.6, 10000], [8.6, 9.6, 10000], [9.6, 10.4, 12000]]),
    *egypt(),
    {'type': 'facade', 'depth': 0.24, 'x': 1000, 'y': 752, 'w': P(0.24, 20), 'h': P(0.24, 8), 'gate': {'w': P(0.24, 3), 'h': P(0.24, 4.6)}, 'towers': True, 'stone': '#e8dcc0', 'light': 1, 'style': 'pylon', 'ppu': 0.8},
    {'type': 'colonnade', 'depth': 0.25, 'xs': [760, 1300], 'y': 756, 'h': P(0.25, 8), 'w': P(0.25, 1), 'style': 'papyrus', 'colors': ['#e0c8a0', '#a87048', '#8a6a48']},
    {'type': 'platform', 'depth': 0.3, 'x': 1000, 'y': 800, 'w': P(0.3, 16), 'steps': 5, 'rise': P(0.3, 0.25), 'dais': P(0.3, 0.3), 'stone': '#d8c4a0', 'lit': '#f0e0c0', 'dark': '#7a6448', 'ppu': 0.9},
    light([1160, 752], P(0.24), depth=0.241, **cold, show=[1, None]),
    river(0.36, 822, 80),
    {'type': 'basket', 'depth': 0.37, 'x': 1000, 'y': 818, 'w': P(0.37, 0.9), 'area': [960, 790, 1040, 824]},
    light([1000, 812], P(0.372, 0.45), depth=0.372, pose='babe', w=1, color='#fffaf0', glow=0.7, bright=1.2),
    light([960, 800], P(0.36, 1.6), depth=0.36, **kind_, at={'1': {'pose': 'kneel'}}),
    *[light([880 + i * 150 - (i // 2) * 60, 800], P(0.355, 1.6), depth=0.355, **dim) for i in range(3)],
    palms(0.3, (420, 1600), 800),
    {'type': 'reeds', 'depth': 0.44, 'x0': -300, 'x1': 700, 'y': 870, 'h': P(0.44, 2.2), 'count': 8, 'seed': 830},
    {'type': 'reeds', 'depth': 0.44, 'x0': 1350, 'x1': 2000, 'y': 872, 'h': P(0.44, 2.2), 'count': 6, 'seed': 831},
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['water', 'birds'], 'cam': cam([1000, 530, 500], [1000, 820, -3000]),
     'say': "The river carried the basket to Pharaoh's palace, and his household drew it from the water."},
    {'dur': 11000, 'ambient': ['water', 'voices'], 'cam': cam([980, 540, 300], [980, 900, -3000]),
     'say': "Pharaoh's wife looked at the child and said: a comfort for my eyes and yours. Do not kill him; perhaps he will be of use to us, or we will take him as a son."},
    {'dur': 12000, 'ambient': ['water', 'air'], 'cam': cam([1000, 530, 600], [1000, 800, -3000]), 'pendingVerse': pv('28:9')},
  ])

# ── 115 · Returned to his mother ──────────────────────────────────────────
scene('nursed', 115, 'musa', 'Returned to His Mother', 'العودة إلى الأم',
  art=[ART_MUSA, "His sister and mother appear only as soft lights; the nurses as dim lights."],
  prompt="A girl's soft light walking along the papyrus of the river bank, keeping her distance from the palace; then a lamplit hall of the palace where dim amber lights of nurses stand back and a mother's soft light holds a tiny light close; ink-wash and parchment texture.",
  world=HALL, ambient=['echo', 'voices'], base='#10141e', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 1], 'layers': [
      heav([[8.6, 9.8, 10000]]),
      *egypt(),
      {'type': 'facade', 'depth': 0.22, 'x': 1400, 'y': 750, 'w': P(0.22, 18), 'h': P(0.22, 10), 'stone': '#e8dcc0', 'light': 1, 'style': 'ashlar', 'ppu': 0.8},
      river(0.3, 800, 100),
      light([700, 818], P(D, 1.3), depth=D, **kind_, pose='walk', path=[[700, 818], [1040, 814]], dur=10000),
      {'type': 'reeds', 'depth': 0.44, 'x0': -300, 'x1': 1900, 'y': 872, 'h': P(0.44, 2.2), 'count': 14, 'seed': 840},
      motes(),
    ]},
    {'type': 'set', 'show': [1, None], 'dx': 6000, 'layers': [
      *room('pharaoh'),
      *[light([700 + i * 70, 788], P(0.32, 1.6), depth=0.32, **dim, at={'2': {'pose': 'walk', 'path': [[700 + i * 70, 788], [560 + i * 50, 778]], 'dur': 4000}}) for i in range(4)],
      light([1000, 792], P(0.32, 1.3), depth=0.32, **kind_),
      light([880, 792], P(0.33, 1.6), depth=0.33, **kind_, show=[2, None], pose='kneel'),
      light([900, 768], P(0.331, 0.45), depth=0.331, pose='babe', w=1, color='#fffaf0', glow=0.6, bright=1.2),
    ]},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['water', 'birds'], 'world': {'fog': '#d8c8a8', 'haze': 0.15}, 'cam': cam([900, 530, 600], [920, 860, -3000]),
     'say': "His sister had followed the basket along the bank, watching from a distance."},
    {'dur': 10000, 'ambient': ['echo', 'voices'], 'cam': cam([880, 530, 300], [900, 1150, -3000], dx=6000),
     'say': "In the palace, the baby would not take any nurse. His sister came forward: shall I show you a household who will care for him?"},
    {'dur': 10000, 'ambient': ['echo', 'air'], 'cam': cam([880, 530, 200], [900, 1200, -3000], dx=6000),
     'say': "So God returned him to his mother, to comfort her and to show her that His promise is true."},
    {'dur': 12000, 'ambient': ['echo', 'air'], 'cam': cam([880, 530, 300], [900, 1100, -3000], dx=6000), 'pendingVerse': pv('28:13')},
  ])

# ── 116 · The man who died ────────────────────────────────────────────────
scene('blow', 116, 'musa', 'One Blow', 'الضربة',
  art=[ART_MUSA, "Nothing of the fight is shown: two dim lights struggle, and one goes out."],
  prompt="Years passing over a white palace on the Nile, a steady light growing tall; then a narrow street of the city at night, two dim figures of light struggling, one amber and one grey; a steady light stepping between them, a small flash, and the grey light gone out; then the steady light kneeling alone; ink-wash and parchment texture.",
  world=NIGHT, ambient=['wind', 'crickets'], base='#141824', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 1], 'layers': [
      heav([[6, 18, 10000, 6]]),
      *egypt(),
      {'type': 'facade', 'depth': 0.24, 'x': 1060, 'y': 752, 'w': P(0.24, 20), 'h': P(0.24, 8), 'gate': {'w': P(0.24, 3), 'h': P(0.24, 4.6)}, 'towers': True, 'stone': '#e8dcc0', 'light': 1, 'style': 'pylon', 'ppu': 0.8},
      light([900, 794], P(D, 1.2), depth=D, **musa_c, at={'0': {'h': P(D, 1.75)}}),
      motes(),
    ]},
    {'type': 'set', 'show': [1, None], 'dx': 6000, 'layers': [
      heav([[22, 23, 10000], [23, 23.6, 12000]], horizon=640),
      {'type': 'town', 'depth': 0.18, 'y': 760, 'x0': -200, 'x1': 1800, 's': P(0.18, 1) / 30, 'grade': 'city', 'night': True, 'lit': 0.15, 'haze': '#24202e', 'seed': 850},
      {'type': 'ground', 'depth': 0.2, 'y': 762, 'amp': 3, 'seed': 851, 'color': '#3a3440', 'color2': '#1e1a24'},
      light([960, FEET], P(D), depth=D, **{**dim, 'color': '#e8c098'}, at={'1': {'pose': 'reach'}}),
      light([1030, FEET], P(D, 1.8), depth=D, **cold, at={'1': {'pose': 'gone'}}),
      light([700, FEET], P(D, 1.8), depth=D, **musa_n, at={'0': {}, '1': {'pos': [990, FEET + 2], 'pose': 'reach'}, '2': {'pos': [900, FEET + 2], 'pose': 'kneel'}}),
      {'type': 'flash', 'show': [1, 2], 'color': '#fffaf0', 'peak': 0.35, 'delay': 1800, 'rise': 120, 'dur': 1600},
      motes(0.12),
    ]},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['city', 'water'], 'world': {'fog': '#d8c8a8', 'light': 1.05}, 'cam': cam([920, 530, 600], [940, 780, -3000]),
     'say': "Musa grew up in Pharaoh's palace, strong and wise."},
    {'dur': 10000, 'ambient': ['wind', 'voices'], 'sfx': [{'name': 'drop', 'at': 1900}], 'cam': cam([960, 535, 500], [980, 770, -3000], dx=6000),
     'say': "One day he came upon two men fighting, one of his own people and one of Pharaoh's. Musa struck the Egyptian once, and the man died."},
    {'dur': 10000, 'ambient': ['wind'], 'cam': cam([920, 535, 450], [920, 790, -3000], dx=6000),
     'say': "Musa was horrified at what he had done. My Lord, he prayed, I have wronged myself, so forgive me. And God forgave him."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([920, 530, 600], [930, 740, -3000], dx=6000), 'pendingVerse': pv('28:16')},
  ])

# ── 117 · Flight into the desert ──────────────────────────────────────────
scene('flight', 117, 'musa', 'Flight into the Desert', 'الخروج إلى مدين',
  art=[ART_MUSA, "The man who warned him appears only as a dim light. The road to Madyan is imagined."],
  prompt="A city gate at night, a dim light running to a steady light with a warning; then the steady light walking alone over vast moonlit dunes under the stars, a long trail of footprints behind, until dawn breaks over far mountains; ink-wash and parchment texture.",
  world=NIGHT, ambient=['wind', 'desert'], base='#141824', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 1], 'layers': [
      heav([[23.4, 24, 10000]], horizon=640),
      {'type': 'town', 'depth': 0.18, 'y': 760, 'x0': -200, 'x1': 1800, 's': P(0.18, 1) / 30, 'grade': 'city', 'night': True, 'lit': 0.15, 'haze': '#24202e', 'seed': 850},
      {'type': 'ground', 'depth': 0.2, 'y': 762, 'amp': 3, 'seed': 851, 'color': '#3a3440', 'color2': '#1e1a24'},
      light([1400, FEET], P(D), depth=D, **dim, pose='walk', path=[[1500, FEET + 4], [1000, FEET]], dur=3500),
      light([900, FEET], P(D, 1.8), depth=D, **musa_n),
    ]},
    {'type': 'set', 'show': [1, None], 'dx': 6000, 'layers': [
      heav([[1, 2.5, 10000], [4.6, 6, 12000]], horizon=600),
      {'type': 'ridge', 'depth': 0.04, 'y': 600, 'amp': 50, 'seed': 860, 'sharp': 0.5, 'color': '#3a3448', 'haze': 0.3, 'fog': 0.4},
      {'type': 'dunes', 'depth': 0.1, 'y': 660, 'amp': 30, 'count': 9, 'seed': 861, 'lit': '#8a8098', 'body': '#5a5068', 'shade': '#2a2438'},
      light([1100, 708], P(0.16, 1.8), depth=0.16, **musa_n, pose='walk', path=[[1300, 712], [700, 704]], dur=20000),
      {'type': 'dunes', 'depth': 0.24, 'y': 780, 'amp': 40, 'count': 6, 'seed': 862, 'lit': '#7a7088', 'body': '#4a4058', 'shade': '#221c30'},
      dust(box=(-1400, 300, -6000, 3000, 950, 0), count=400, size=3, color='#c8c0d8', opacity=0.25, wind=(-30, -2, 0), blend='normal'),
    ]},
  ],
  beats=[
    {'dur': 9000, 'ambient': ['wind', 'voices'], 'sfx': 'gust', 'cam': cam([960, 535, 500], [980, 770, -3000]),
     'say': "A man came running from the far side of the city: the chiefs are plotting to kill you. Leave!"},
    {'dur': 11000, 'ambient': ['wind', 'desert'], 'cam': cam([900, 500, 1100], [900, 560, -3000], dx=6000),
     'say': "So Musa fled alone across the desert, toward the land of Madyan."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([860, 500, 1100], [860, 560, -3000], dx=6000), 'pendingVerse': pv('28:22')},
  ])

# ── 118 · The well of Madyan ──────────────────────────────────────────────
sheep = lambda xs, y, face=1, d=0.4: {'type': 'animals', 'depth': d, 'fade': 'none', 'area': [min(xs) - 80, y - 80, max(xs) + 80, y + 10],
                                      'pairs': [{'kind': 'sheep', 'solo': True, 's': round(0.9 * 150 * d / 60, 2), 'path': [[x, y + (i % 2) * 6]], 'face': face if i % 3 else -face} for i, x in enumerate(xs)]}
scene('shepherds', 118, 'musa', 'The Well of Madyan', 'بئر مدين',
  art=[ART_MUSA, "The shepherds and the two sisters appear only as dim figures of light."],
  prompt="A stone well with a wooden frame among palms below red sandstone mountains, crowds of dim amber lights of shepherds watering their sheep; apart from them two dim lights holding back a small flock; a steady light drawing water for them, then resting in the shade of a tree; ink-wash and parchment texture.",
  world=SAND, ambient=['herd', 'voices'], base='#d8c0a0',
  layers=[
    heav([[15, 16, 10000], [16, 17, 10000], [17, 17.8, 12000]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 610, 'amp': 70, 'seed': 720, 'sharp': 0.6, 'color': '#8a5a4a', 'haze': 0.4, 'fog': 0.4},
    {'type': 'ground', 'depth': 0.14, 'y': 700, 'amp': 6, 'seed': 870, 'color': '#c8a078', 'color2': '#9a7050'},
    {'type': 'palms', 'depth': 0.24, 'items': [{'x': 260, 'y': 760, 'h': P(0.24, 9), 'lean': 0.05}, {'x': 1400, 'y': 760, 'h': P(0.24, 8.5), 'lean': -0.04}], 'seed': 871},
    {'type': 'tree', 'depth': 0.34, 'x': 640, 'y': 800, 'h': P(0.34, 5), 'kind': 'living', 'seed': 872},
    {'type': 'well', 'depth': 0.38, 'x': 960, 'y': 806, 'w': P(0.38, 1.8), 'h': P(0.38, 0.9), 'frame': True, 'trough': {'side': -1, 'len': P(0.38, 2)}},
    sheep([1100, 1150, 1200, 1250, 1300, 1350], 812, -1, 0.39),
    *[light([1080 + i * 46, 806], P(0.385, 1.7), depth=0.385, **dim) for i in range(6)],
    sheep([800, 840, 880], 826, 1, 0.42),
    light([760, FEET + 30], P(0.43, 1.6), depth=0.43, **{**dim, 'color': '#f4d8b8'}),
    light([720, FEET + 30], P(0.43, 1.6), depth=0.43, **{**dim, 'color': '#f4d8b8'}),
    light([1000, FEET + 30], P(0.44, 1.8), depth=0.44, **musa_c, at={'1': {'pos': [660, FEET + 34], 'pose': 'kneel'}, '2': {'pos': [660, FEET + 34], 'pose': 'kneel'}}),
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['herd', 'voices'], 'cam': cam([880, 525, 800], [900, 690, -3000]),
     'say': "At the well of Madyan, a crowd of shepherds was watering their flocks, while two young women held their sheep back and waited."},
    {'dur': 11000, 'ambient': ['herd', 'water'], 'cam': cam([820, 530, 600], [820, 760, -3000]),
     'say': "Musa watered their flock for them. Then he went to sit in the shade, and prayed: my Lord, I am in need of whatever good You send me."},
    {'dur': 12000, 'ambient': ['air', 'herd'], 'cam': cam([880, 525, 800], [880, 700, -3000]), 'pendingVerse': pv('28:24')},
  ])

# ── 119 · The years in Madyan ─────────────────────────────────────────────
scene('hired', 119, 'musa', 'Ten Years in Madyan', 'عشر سنين في مدين',
  art=[ART_MUSA, "The old man of Madyan and his daughters appear only as dim figures of light. Whether he was the prophet Shu'ayb is debated among scholars, so he is not named."],
  prompt="A tent among palms at dusk, an old man's dim light seated with a steady light before him and a young woman's light at the side; then years racing past in the sky while the steady light leads a flock across red hills, through seasons of green and gold; ink-wash and parchment texture.",
  world=SAND, ambient=['herd', 'wind'], base='#d8c0a0',
  layers=[
    heav([[17.2, 18, 10000], [6, 18, 12000, 10], [16.8, 18, 12000]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 610, 'amp': 70, 'seed': 720, 'sharp': 0.6, 'color': '#8a5a4a', 'haze': 0.4, 'fog': 0.4},
    {'type': 'ridge', 'depth': 0.08, 'y': 660, 'amp': 40, 'seed': 880, 'sharp': 0.4, 'color': '#a8705a', 'haze': 0.3, 'fog': 0.3},
    {'type': 'ground', 'depth': 0.14, 'y': 700, 'amp': 6, 'seed': 881, 'color': '#c8a078', 'color2': '#9a7050'},
    {'type': 'palms', 'depth': 0.24, 'items': [{'x': 300, 'y': 760, 'h': P(0.24, 9), 'lean': 0.05}, {'x': 1380, 'y': 760, 'h': P(0.24, 8.5), 'lean': -0.04}], 'seed': 882},
    {'type': 'tent', 'depth': 0.34, 'x': 700, 'y': 790, 'w': P(0.34, 9), 'h': P(0.34, 2.5), 'lit': True, 'ppu': 0.9},
    light([820, FEET], P(D, 1.65), depth=D, **dim, pose='kneel', show=[0, 1]),
    light([980, FEET], P(D, 1.6), depth=D, **{**dim, 'color': '#f4d8b8'}, show=[0, 1]),
    light([900, FEET + 4], P(D + 0.01, 1.8), depth=D + 0.01, **musa_c, at={'1': {'pos': [1080, FEET + 6], 'pose': 'walk', 'path': [[1180, FEET + 6], [700, FEET + 2], [1180, FEET + 6]], 'dur': 12000}}),
    {**sheep([1180, 1230, 1280, 1330, 1380, 1430, 1480], 806, -1, D), 'show': [1, None]},
    {'type': 'ground', 'depth': 0.55, 'y': 890, 'amp': 6, 'seed': 883, 'color': '#b89068', 'color2': '#8a6848'},
    motes(),
  ],
  beats=[
    {'dur': 11000, 'ambient': ['wind', 'voices'], 'cam': cam([880, 530, 700], [900, 720, -3000]),
     'say': "One of the sisters came back, walking shyly: my father invites you, to reward you. The old man offered Musa one of his daughters in marriage, for eight years of work, or ten if he chose."},
    {'dur': 12000, 'ambient': ['herd', 'wind'], 'cam': cam([960, 525, 900], [980, 680, -3000]),
     'say': "Musa served the full ten years, tending the flocks across the hills of Madyan."},
    {'dur': 12000, 'ambient': ['herd', 'air'], 'cam': cam([920, 525, 860], [940, 690, -3000]), 'pendingVerse': pv('28:26')},
  ])

# ── 120 · The fire on the mountain ────────────────────────────────────────
scene('tuwa', 120, 'musa', 'The Fire on the Mountain', 'النار في الطور',
  art=[ART_MUSA, "The fire is shown only as Musa saw it, a fire on the mountainside; God is not depicted in it or in any form. The call is told in words, never shown."],
  prompt="A cold dark night in rocky mountains, a small family camp with a dim tent; far up the slope, among the rocks, a tree in a gentle golden fire; a steady light climbing toward it and stopping before it, kneeling, small and far away, seen from behind; ink-wash and parchment texture.",
  world={**NIGHT, 'fog': '#0e1018'}, ambient=['wind', 'air'], base='#0c0e16', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 2], 'layers': [
      heav([[1, 1.6, 10000], [1.6, 2.2, 10000]], horizon=560),
      {'type': 'peak', 'depth': 0.06, 'x': 1040, 'y': 240, 'w': 900, 'h': 560, 'color': '#2a2a38', 'lit': '#4a4a5e', 'seed': 890},
      {'type': 'ridge', 'depth': 0.1, 'y': 640, 'amp': 80, 'seed': 891, 'sharp': 0.7, 'color': '#22222e', 'haze': 0.2, 'fog': 0.3},
      {'type': 'fire', 'depth': 0.12, 'pos': [1120, 600], 'w': P(0.12, 4), 'h': P(0.12, 5), 'heat': 0.8},
      {'type': 'light', 'kind': 'flame', 'depth': 0.121, 'pos': [1120, 600], 'h': 30, 'color': '#ffc870', 'glow': 1.6},
      {'type': 'ground', 'depth': 0.3, 'y': 800, 'amp': 14, 'seed': 893, 'color': '#3a3a48', 'color2': '#1a1a24'},
      {'type': 'tent', 'depth': 0.38, 'x': 640, 'y': 820, 'w': P(0.38, 5), 'h': P(0.38, 2), 'lit': True, 'ppu': 0.9},
      light([820, 822], P(0.4, 1.6), depth=0.4, **{**dim, 'color': '#f4d8b8'}),
      light([920, 824], P(0.42, 1.8), depth=0.42, **musa_n, at={'1': {'pose': 'walk', 'path': [[920, 824], [1180, 812]], 'dur': 9000}}),
      dust(box=(-1400, 0, -9000, 3000, 950, 0), count=300, size=3, color='#c8d0e8', opacity=0.2, wind=(-6, 2, 0)),
    ]},
    {'type': 'set', 'show': [2, None], 'dx': 6000, 'layers': [
      heav([[2.2, 2.8, 10000], None, [2.2, 2.8, 10000], [2.8, 3.4, 12000]], horizon=560),
      {'type': 'peak', 'depth': 0.06, 'x': 700, 'y': 200, 'w': 1200, 'h': 600, 'color': '#2a2a38', 'lit': '#4a4a5e', 'seed': 894},
      {'type': 'ridge', 'depth': 0.14, 'y': 700, 'amp': 60, 'seed': 895, 'sharp': 0.6, 'color': '#2a2a36', 'haze': 0.2, 'fog': 0.3},
      {'type': 'ground', 'depth': 0.26, 'y': 760, 'amp': 10, 'seed': 896, 'color': '#4a4652', 'color2': '#22202a'},
      {'type': 'tree', 'depth': 0.3, 'x': 1000, 'y': 780, 'h': P(0.3, 3.5), 'kind': 'bare', 'seed': 892},
      {'type': 'fire', 'depth': 0.301, 'pos': [1000, 760], 'w': P(0.301, 2.6), 'h': P(0.301, 3.6), 'heat': 0.75},
      {'type': 'ground', 'depth': 0.4, 'y': 806, 'amp': 6, 'seed': 897, 'color': '#5a5664', 'color2': '#2a2834'},
      light([820, 812], P(0.43, 1.8), depth=0.43, **musa_n, at={'3': {'pose': 'kneel'}}),
      dust(box=(-1400, 0, -6000, 3000, 950, 0), count=200, size=3, color='#ffd8a0', opacity=0.3, wind=(2, 12, 0), swirl=30),
    ]},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['wind'], 'cam': cam([900, 520, 800], [940, 680, -3000]),
     'say': "Years later, travelling with his family on a cold, dark night, Musa saw a fire on the side of the mountain."},
    {'dur': 10000, 'ambient': ['wind'], 'cam': cam([980, 510, 900], [1020, 640, -3000]),
     'say': "Stay here, he told them. Perhaps I can bring you a burning brand, or find someone at the fire to guide us."},
    {'dur': 11000, 'ambient': ['air', 'fire'], 'world': {'bloom': 0.95}, 'cam': cam([860, 520, 700], [900, 720, -3000], dx=6000),
     'say': "When he came to it, a voice called to him from the tree in the blessed valley: Musa, I am God, the Lord of the worlds."},
    {'dur': 12000, 'ambient': ['air', 'fire'], 'world': {'bloom': 0.95}, 'cam': cam([860, 520, 800], [900, 690, -3000], dx=6000), 'pendingVerse': pv('28:30')},
  ])

# ── 121 · The staff and the hand ──────────────────────────────────────────
scene('signs', 121, 'musa', 'The Staff and the Hand', 'العصا واليد',
  art=[ART_MUSA, "The serpent is drawn in ink as the Quran describes the sign (28:31); Musa's shining hand is shown as his light flaring white."],
  prompt="A rocky valley at night lit by a far golden glow, a steady light standing over a shepherd's staff on the ground; the staff becomes a great ink-drawn serpent rearing its head and the light steps back; then the light flares pure white; ink-wash and parchment texture.",
  world={**NIGHT, 'fog': '#0e1018'}, ambient=['air', 'wind'], base='#0c0e16',
  layers=[
    heav([[2.8, 3.2, 10000], [3.2, 3.6, 10000], [3.6, 4.2, 12000]], horizon=560),
    {'type': 'peak', 'depth': 0.06, 'x': 1040, 'y': 240, 'w': 900, 'h': 560, 'color': '#2a2a38', 'lit': '#4a4a5e', 'seed': 890},
    {'type': 'ridge', 'depth': 0.12, 'y': 680, 'amp': 70, 'seed': 900, 'sharp': 0.6, 'color': '#22222e', 'haze': 0.2, 'fog': 0.3},
    {'type': 'ground', 'depth': 0.3, 'y': 760, 'amp': 10, 'seed': 901, 'color': '#5a5868', 'color2': '#2a2834'},
    {'type': 'ground', 'depth': 0.4, 'y': 800, 'amp': 6, 'seed': 902, 'color': '#6a6878', 'color2': '#3a3844'},
    {'type': 'radiance', 'depth': 0.1, 'x': 1300, 'y': 520, 'r': 300, 'color': '#ffd890', 'opacity': 0.25} if False else
    {'type': 'light', 'kind': 'flame', 'depth': 0.12, 'pos': [1360, 640], 'h': 40, 'color': '#ffc870', 'glow': 1.4},
    {'type': 'staff', 'depth': D + 0.005, 'x': 900, 'y': FEET + 8, 'len': P(D, 1.6), 'area': [740, 680, 1060, 812],
     'at': {'1': {'state': 'serpent'}, '2': {'state': 'staff'}}},
    light([800, FEET], P(D, 1.8), depth=D, **musa_n, at={'1': {'pos': [720, FEET - 4], 'pose': 'walk', 'path': [[800, FEET], [700, FEET - 6]], 'dur': 1600}, '2': {'pos': [820, FEET], 'pose': 'raise', 'color': '#ffffff', 'glow': 1.3, 'bright': 1.9}}),
    {'type': 'flash', 'show': [2, 3], 'color': '#ffffff', 'peak': 0.25, 'delay': 1400, 'rise': 300, 'dur': 2400},
    dust(box=(-1400, 0, -9000, 3000, 950, 0), count=300, size=3, color='#c8d0e8', opacity=0.2, wind=(-6, 2, 0)),
  ],
  beats=[
    {'dur': 9000, 'ambient': ['air'], 'cam': cam([850, 545, 250], [860, 1000, -3000]),
     'say': "Throw down your staff, he was told."},
    {'dur': 10000, 'ambient': ['air', 'wind'], 'sfx': [{'name': 'scratch', 'at': 300}], 'cam': cam([830, 545, 200], [840, 1020, -3000]),
     'say': "It moved like a living serpent, and Musa turned to run. Come back, and do not fear, he was told; you are safe."},
    {'dur': 11000, 'ambient': ['air'], 'sfx': [{'name': 'swell', 'at': 1200}], 'cam': cam([850, 545, 250], [860, 1000, -3000]),
     'say': "Then his hand came out shining white. Go to Pharaoh, he was told. Musa prayed: my Lord, open my heart, make my task easy, untie the knot from my tongue, and let my brother Harun help me."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([850, 535, 500], [860, 880, -3000]), 'pendingVerse': pv('20:29-32')},
  ])

write_chapter(C11 + 'chapter.json', {
    'number': 11, 'title': 'Musa: The Nile to the Mountain', 'arabic': 'موسى من النيل إلى الطور', 'nodes': ['musa'],
    'parts': [{'title': 'Born in Egypt', 'from': O(112), 'to': O(115)}, {'title': 'Exile', 'from': O(116), 'to': O(119)}, {'title': 'The Call', 'from': O(120), 'to': O(121)}]})
print('c11 ok')
