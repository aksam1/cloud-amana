from base import *

DAY = {'fog': '#cfe0d8', 'fogNear': 6000, 'fogFar': 42000, 'light': 1.05, 'rays': 0, 'bloom': 0.7, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
# the living sky's own sun kept out of sight in the Garden (its light still runs the day)
HIDDEN_SUN = {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 200, 'size': 0.01, 'halo': 0}


def garden_world(sat=1.0, dim=False):
    """The Garden: far hills, banks of flowering trees, a clear river, trees, the one tree that stood apart."""
    g = lambda d: {**d, 'sat': sat} if sat != 1 else d
    return [
        g({'type': 'ridge', 'depth': 0.05, 'y': 600, 'amp': 70, 'seed': 70, 'sharp': 0.3, 'color': '#a4bcac', 'haze': 0.4, 'fog': 0.4}),
        g({'type': 'garden', 'depth': 0.1, 'plane': 'far', 'y': 640, 'count': 9, 'seed': 4}),
        g({'type': 'water', 'depth': 0.16, 'points': [[160, 652], [460, 690], [760, 760], [960, 900]], 'w0': 18, 'w1': 240, 'reflect': [['0', '#e4f0f0'], ['1', '#8ab4c4']]}),
        g({'type': 'tree', 'depth': 0.18, 'x': 1260, 'y': 700, 'h': 300, 'kind': 'living', 'seed': 71}),
        g({'type': 'tree', 'depth': 0.2, 'x': 1060, 'y': 706, 'h': 330, 'kind': 'forbidden', 'seed': 9}),
        g({'type': 'garden', 'depth': 0.24, 'plane': 'mid', 'y': 720, 'count': 8, 'seed': 5, 'avoid': [940, 1180]}),
        g({'type': 'tree', 'depth': 0.3, 'x': 300, 'y': 760, 'h': 330, 'kind': 'living', 'seed': 72}),
    ]


def garden_near(sat=1.0):
    d = {'type': 'garden', 'depth': 0.45, 'plane': 'near', 'y': 860, 'count': 6, 'seed': 6}
    return {**d, 'sat': sat} if sat != 1 else d


def garden_frame(sat=1.0, at=None):
    d = {'type': 'tree', 'depth': 0.5, 'x': 1560, 'y': 900, 'h': 560, 'kind': 'living', 'seed': 73, 'ppu': 0.8}
    if sat != 1:
        d['sat'] = sat
    if at:
        d['at'] = at
    return d


def birds(z=-9000, n=3):
    out = []
    loops = [[[400, 300], [800, 240], [1100, 320], [700, 380], [400, 300], [800, 240]],
             [[1150, 260], [760, 330], [520, 250], [900, 210], [1150, 260], [760, 330]],
             [[600, 360], [980, 300], [1250, 360], [880, 400], [600, 360], [980, 300]]]
    for i in range(n):
        out.append({'type': 'light', 'kind': 'bird', 'depth': 0.1, 'h': 10 + i, 'color': '#fffaf0', 'glow': 0.55, 'bright': 1.3,
                    'path': [[x, y, z] for x, y in loops[i]], 'dur': 14000 + i * 1500, 'delay': i * 600})
    return out


couple_day = dict(depth=0.32, glow=0.35, bright=1.1, solid=0.75)

# ── 7 · The Garden ─────────────────────────────────────────────────────────
build('s07-garden.json',
  world={**DAY, 'rays': 0},
  layers=[
    {'type': 'heavens', 'horizon': 600, 'sun': HIDDEN_SUN, 'tod': [9.6, 10.4, 6500], 'at': {'1': {'tod': [10.4, 11.4, 10000]}, '2': {'tod': [11.4, 12.2, 8500]}}},
    {'type': 'sun', 'pos': [1020, 170, -9000], 'size': 44, 'color': '#fff8e0'},
    *garden_world(),
    light([960, 742], 60, **couple_day, pose='walk', path=[[930, 786], [960, 742]], dur=6000, at={'1': {'pose': 'stand'}}),
    light([1016, 746], 56, **couple_day, color='#fff4ec', pose='walk', path=[[990, 790], [1016, 746]], dur=6000, delay=300, at={'1': {'pose': 'stand'}}),
    *birds(),
    garden_near(),
    garden_frame(),
    dust(box=(-1400, 150, -8000, 3000, 950, 600), count=600, size=2.6, color='#fff8d0', opacity=0.38, wind=(5, -3, 0)),
    dust(box=(-600, 500, -4200, 2400, 1700, -1800), count=160, size=7, color='#ffd890', opacity=0.5, wind=(0, -2, 0), swirl=20),
  ],
  cams=[cam([800, 520, 1150], [800, 565, -3000]), cam([780, 525, 1000], [780, 585, -3000]), cam([980, 520, 1020], [1040, 565, -3000])],
  beat_world={0: {'rays': 0.55}})

# ── 8 · The whisper ────────────────────────────────────────────────────────
drained = {'3': {'sat': 0.35}}
gw = [{**l, 'at': {**l.get('at', {}), **drained}} for l in garden_world()]
build('s08-whisper.json',
  world={**DAY, 'rays': 0.45},
  layers=[
    {'type': 'heavens', 'horizon': 600, 'sun': HIDDEN_SUN, 'tod': [12.2, 12.8, 6000],
     'at': {'1': {'tod': [12.8, 13.8, 10500]}, '2': {'tod': [13.8, 14.6, 8000]}, '3': {'tod': [15.6, 16.8, 10000]}, '4': {'tod': [16.8, 17.5, 9500]}}},
    {'type': 'sun', 'pos': [1100, 200, -9000], 'size': 40, 'color': '#fff4d8'},
    *gw,
    {'type': 'wisp', 'depth': 0.33, 'points': [[1480, 760], [1380, 730], [1300, 756], [1200, 736]], 'width': 7, 'color': '#1a1418', 'script': True,
     'move': {'path': [[-180, -10, 0], [-280, -20, 0]], 'dur': 15500}},
    light([960, 742], 60, **couple_day, at={'2': {'pose': 'walk', 'path': [[960, 742], [1030, 716]], 'dur': 6500}, '3': {'glow': 0.12, 'bright': 0.75, 'path': None, 'pos': [1030, 716]}}),
    light([1016, 746], 56, **couple_day, color='#fff4ec', at={'2': {'pose': 'walk', 'path': [[1016, 746], [1088, 720]], 'dur': 6500, 'delay': 400}, '3': {'glow': 0.12, 'bright': 0.75, 'path': None, 'pos': [1088, 720]}}),
    *birds(n=2),
    {**garden_near(), 'at': drained},
    garden_frame(at=drained),
    dust(box=(-1400, 150, -8000, 3000, 950, 600), count=500, size=2.6, color='#fff8d0', opacity=0.34, wind=(5, -3, 0), at={'3': {'opacity': 0.12}}),
  ],
  cams=[cam([800, 520, 1150], [800, 565, -3000]), cam([820, 525, 1000], [840, 585, -3000]), cam([940, 520, 1000], [1000, 570, -3000]),
        cam([960, 522, 980], [1010, 580, -3000]), cam([900, 520, 1050], [940, 575, -3000])],
  beat_world={3: {'rays': 0, 'light': 0.85, 'bloom': 0.5}})

# ── 9 · Repentance ─────────────────────────────────────────────────────────
dimmed = {'2': {'sat': 1}}
gw9 = [{**l, 'sat': 0.4, 'at': dimmed} for l in garden_world()]
o9 = load('s09-repentance.json')
callig = [{k: v for k, v in l.items() if k != 'depth'} for l in o9['layers'] if l['type'] == 'calligraphy']
build('s09-repentance.json',
  world={'fog': '#2a3540', 'fogNear': 5000, 'fogFar': 38000, 'light': 0.85, 'rays': 0, 'bloom': 0.8, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  art=["Adam and Hawwa appear only as figures of light. No light stands for God: the dawn, and their own glow returning, show that they were forgiven."],
  layers=[
    {'type': 'heavens', 'horizon': 600, 'sun': {'rise': 6, 'set': 18, 'x0': 1250, 'x1': 300, 'peak': 300, 'size': 34},
     'tod': [3.6, 4.2, 6000], 'at': {'1': {'tod': [4.2, 4.9, 10500]}, '2': {'tod': [4.9, 6.0, 10000]}, '3': {'tod': [6.0, 7.0, 9500]}}},
    *gw9,
    light([970, 756], 56, depth=0.32, pose='kneel', glow=0.3, bright=0.9, at={'2': {'glow': 0.65, 'bright': 1.3}}),
    light([1036, 760], 52, depth=0.32, pose='kneel', color='#fff4ec', glow=0.3, bright=0.9, at={'2': {'glow': 0.65, 'bright': 1.3}}),
    {**garden_near(), 'sat': 0.4, 'at': dimmed},
    garden_frame(sat=0.4, at=dimmed),
    dust(box=(-1400, 300, -6000, 3000, 950, 600), count=400, size=2.4, color='#e8f0ff', opacity=0.3, wind=(2, -2, 0)),
    *callig,
  ],
  cams=[cam([800, 540, 1050], [800, 620, -3000]), cam([800, 540, 1000], [800, 625, -3000]), cam([800, 530, 1050], [800, 600, -3000]), cam([800, 520, 1100], [800, 580, -3000])])

# ── 10 · The descent ───────────────────────────────────────────────────────
build('s10-descent.json',
  world={'fog': '#9ab0c8', 'fogNear': 6000, 'fogFar': 50000, 'light': 1.0, 'rays': 0, 'bloom': 0.7, 'haze': 0.04, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  layers=[
    {'type': 'heavens', 'horizon': 560, 'sun': {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 240, 'size': 34},
     'tod': [8.6, 9.4, 6500], 'at': {'1': {'tod': [9.4, 10.4, 10000]}, '2': {'tod': [10.4, 11.6, 11500]}, '3': {'tod': [11.6, 12, 4800]}}},
    {'type': 'earth', 'depth': 0.07, 'y': 560, 'state': 'green', 'fog': 0.5},
    {'type': 'clouds', 'depth': 0.12, 'y': 640, 'count': 8, 'color': '#f4f0e8', 'rim': '#e0b890', 'spanY': 60, 'fog': 0.3},
    {'type': 'light', 'h': 54, 'color': '#fffaf0', 'glow': 0.7, 'bright': 1.4, 'path': [[700, -120, -2200], [690, 420, -3200], [640, 640, -7000]], 'dur': 8200},
    {'type': 'light', 'h': 50, 'color': '#fff4ec', 'glow': 0.7, 'bright': 1.4, 'path': [[900, -140, -2200], [920, 440, -3400], [1060, 650, -8000]], 'dur': 8800, 'delay': 400},
    {'type': 'light', 'kind': 'ember', 'show': [1, None], 'h': 60, 'color': '#ff6a2a', 'glow': 0.7, 'path': [[1460, -100, -6000], [1420, 500, -7000], [1380, 690, -9000]], 'dur': 6000, 'delay': 900},
    {'type': 'clouds', 'depth': 0.2, 'y': 740, 'count': 7, 'color': '#f8f4ec', 'rim': '#e8c8a0', 'spanY': 70},
    {'type': 'clouds', 'depth': 0.38, 'y': 860, 'count': 6, 'color': '#ffffff', 'rim': '#f0d8b8', 'spanY': 60},
    dust(box=(-1600, -200, -9000, 3200, 1000, 600), count=400, size=2.4, color='#ffffff', opacity=0.3, wind=(8, -2, 0)),
  ],
  cams=[cam([800, 420, 1100], [800, 430, -3000]), cam([800, 450, 1150], [800, 480, -3000]), cam([800, 470, 1200], [800, 520, -3000]), cam([800, 470, 1200], [800, 520, -3000])])

# ── 11 · The first home ────────────────────────────────────────────────────
build('s11-first-home.json',
  world={'fog': '#b8b0b8', 'fogNear': 6000, 'fogFar': 42000, 'light': 1.0, 'rays': 0, 'bloom': 0.7, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  layers=[
    {'type': 'heavens', 'horizon': 620, 'sun': {'rise': 6, 'set': 18, 'x0': 320, 'x1': 1300, 'peak': 260, 'size': 34},
     'tod': [5.2, 6.2, 6000], 'at': {'1': {'tod': [6.2, 7.2, 7500]}, '2': {'tod': [7.2, 17, 9500, 2]}, '3': {'tod': [8, 16, 7000, 2]}, '4': {'tod': [16.4, 18.6, 11000]}}},
    {'type': 'ridge', 'depth': 0.05, 'y': 610, 'amp': 70, 'seed': 80, 'sharp': 0.4, 'color': '#7a7a90', 'haze': 0.35, 'fog': 0.4},
    {'type': 'ridge', 'depth': 0.09, 'y': 640, 'amp': 80, 'seed': 81, 'sharp': 0.5, 'color': '#8a8070', 'haze': 0.2},
    {'type': 'ground', 'depth': 0.14, 'y': 662, 'amp': 10, 'seed': 82, 'color': '#8a9a5a', 'color2': '#5a6a3a', 'grass': True, 'grassColor': '#a8b468'},
    {'type': 'water', 'depth': 0.16, 'points': [[1320, 664], [1200, 700], [1110, 780], [1130, 900]], 'w0': 14, 'w1': 200},
    {'type': 'mist', 'show': [0, 2], 'depth': 0.12, 'y': 672, 'color': '#f0ece0', 'bands': 3, 'spread': 40, 'h': 50},
    {'type': 'ground', 'show': [3, None], 'depth': 0.2, 'y': 716, 'amp': 4, 'seed': 83, 'x0': 260, 'x1': 780, 'color': '#7a6a48', 'color2': '#5a4a32', 'crop': 'shoots',
     'reveal': {'dir': 'right', 'dur': 4000}, 'at': {'4': {'crop': 'wheat'}}},
    {'type': 'shelter', 'show': [2, None], 'depth': 0.22, 'x': 900, 'y': 724, 's': 0.9, 'reveal': {'dir': 'up', 'dur': 7000, 'delay': 600}},
    light([760, 744], 58, depth=0.24, glow=0.3, bright=0.95, solid=0.5, pose='walk', path=[[430, 762], [760, 744]], dur=7000,
          at={'1': {'pose': 'stand', 'path': None, 'pos': [760, 744]}, '2': {'pose': 'walk', 'path': [[760, 744], [860, 740], [760, 744], [860, 740]], 'dur': 9000},
              '3': {'pose': 'walk', 'path': [[600, 744], [480, 740], [620, 746]], 'dur': 7000}, '4': {'pose': 'stand', 'path': None, 'pos': [950, 748]}}),
    light([820, 746], 54, depth=0.24, color='#fff4ec', glow=0.3, bright=0.95, solid=0.5, pose='walk', path=[[1220, 766], [820, 746]], dur=7000,
          at={'1': {'pose': 'stand', 'path': None, 'pos': [812, 746]}, '2': {'pose': 'stand', 'path': None, 'pos': [990, 748]},
              '3': {'pose': 'walk', 'path': [[680, 748], [560, 742], [700, 750]], 'dur': 7000, 'delay': 500}, '4': {'pose': 'stand', 'path': None, 'pos': [1030, 750]}}),
    {'type': 'light', 'kind': 'flame', 'show': [4, None], 'depth': 0.235, 'pos': [990, 756], 'h': 34, 'color': '#ffb050', 'glow': 1.2},
    dust(box=(1560, 1300, -3350, 1660, 1750, -3150), count=60, size=8, color='#c8c0b8', opacity=0.35, wind=(4, -40, 0), swirl=20, blend='normal', show=[4, None]),
    *[{**b, 'show': [4, None]} for b in birds(n=2)],
    {'type': 'ground', 'depth': 0.4, 'y': 852, 'amp': 10, 'seed': 84, 'color': '#6a7a42', 'color2': '#4a5a32', 'grass': True, 'grassColor': '#8a9a52', 'wind': 1},
    dust(box=(-1400, 200, -8000, 3000, 950, 600), count=400, size=2.4, color='#fff4e0', opacity=0.28, wind=(4, -2, 0)),
  ],
  cams=[cam([800, 520, 1150], [800, 560, -3000]), cam([790, 525, 1000], [790, 585, -3000]), cam([840, 520, 1050], [860, 575, -3000]),
        cam([700, 525, 1050], [680, 580, -3000]), cam([860, 520, 1100], [880, 570, -3000])])

# ── 12 · Children fill the valley ─────────────────────────────────────────
o12 = load('s12-children.json')
keep = []
depths = {'plots': 0.2, 'shelter': 0.22, 'flock': 0.16, 'tint': None, 'particles': None}
shelter_i = 0
for l in o12['layers']:
    t = l['type']
    if t == 'plots':
        keep.append({**l, 'depth': 0.2})
    elif t == 'shelter':
        l = dict(l)
        delay = l.pop('delay', 0)
        built = l.pop('built', True)
        for k in ('kindle',):
            l.pop(k, None)
        at = dict(l.get('at', {}))
        at.get('1', {}).pop('built', None)
        at = {k: v for k, v in at.items() if v}
        l['at'] = at
        l['depth'] = 0.21 + 0.004 * shelter_i
        if not built:
            l['show'] = [1, None]
            l['reveal'] = {'dir': 'up', 'dur': 2200, 'delay': delay}
        keep.append(l)
        shelter_i += 1
    elif t == 'flock':
        keep.append({**l, 'depth': 0.16})
    elif t in ('tint', 'particles'):
        keep.append({k: v for k, v in l.items() if k != 'depth'})
build('s12-children.json',
  world={'fog': '#c8c0c0', 'fogNear': 6000, 'fogFar': 42000, 'light': 1.0, 'rays': 0, 'bloom': 0.65, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  layers=[
    {'type': 'heavens', 'horizon': 620, 'sun': {'rise': 6, 'set': 18, 'x0': 320, 'x1': 1300, 'peak': 260, 'size': 34},
     'tod': [7, 9, 6000], 'at': {'1': {'tod': [9, 16, 8000, 1]}, '2': {'tod': [10, 14, 3200, 1]}, '3': {'tod': [9, 15, 3200, 1]}, '4': {'tod': [10, 16, 3200, 1]},
                                 '5': {'tod': [11, 15, 3400, 1]}, '6': {'tod': [8, 10, 5500]}, '7': {'tod': [10, 12, 5500]}, '8': {'tod': [16.8, 18.6, 7000]}}},
    {'type': 'ridge', 'depth': 0.05, 'y': 600, 'amp': 70, 'seed': 80, 'sharp': 0.4, 'color': '#7a7a90', 'haze': 0.35, 'fog': 0.4},
    {'type': 'peak', 'depth': 0.12, 'x': 360, 'y': 470, 'w': 420, 'h': 240, 'color': '#6a7a4a', 'lit': '#a8b468', 'seed': 85},
    {'type': 'ground', 'depth': 0.14, 'y': 660, 'amp': 10, 'seed': 82, 'color': '#8a9a5a', 'color2': '#5a6a3a', 'grass': True, 'grassColor': '#a8b468',
     'at': {'2': {'color': '#c8ccd4', 'color2': '#9aa0aa', 'grass': False}, '3': {'color': '#8a9a5a', 'color2': '#5a6a3a', 'grass': True}, '5': {'color': '#a8904a', 'color2': '#7a6436'}, '6': {'color': '#8a9a5a', 'color2': '#5a6a3a'}}},
    {'type': 'water', 'depth': 0.16, 'points': [[1320, 664], [1200, 700], [1110, 780], [1130, 900]], 'w0': 14, 'w1': 200},
    {'type': 'tree', 'depth': 0.17, 'x': 1340, 'y': 690, 'h': 240, 'kind': 'living', 'seed': 86},
    *keep,
    {'type': 'crowd', 'show': [1, None], 'area': [380, 960, -3600, -2700], 'y': [724, 690], 'count': 36, 'size': 24, 'color': '#ffd8a0', 'dim': 0.3, 'glow': 0.55, 'mill': 22, 'speed': 0, 'flicker': 0.2},
    light([380, 528], 30, depth=0.16, glow=0.3, bright=0.95, solid=0.5, show=[6, 9], pose='walk', path=[[330, 532], [380, 528]], dur=5500, at={'8': {'pose': 'stand', 'path': None}}),
    light([1250, 704], 32, depth=0.22, color='#f0a54a', glow=0.3, bright=0.95, solid=0.6, show=[6, 9], pose='reach'),
    dust(box=(-600, 900, -3700, 800, 1600, -3400), count=120, size=9, color='#c8c0b8', opacity=0.3, wind=(4, -40, 0), swirl=20, blend='normal', show=[1, None]),
    {'type': 'ground', 'depth': 0.4, 'y': 852, 'amp': 10, 'seed': 84, 'color': '#6a7a42', 'color2': '#4a5a32', 'grass': True, 'grassColor': '#8a9a52', 'wind': 1,
     'at': {'2': {'color': '#d0d4dc', 'color2': '#a0a6b0', 'grass': False}, '3': {'color': '#6a7a42', 'color2': '#4a5a32', 'grass': True}, '5': {'color': '#9a8442', 'color2': '#6a5a30'}, '6': {'color': '#6a7a42', 'color2': '#4a5a32'}}},
  ],
  cams=[cam([800, 520, 1200], [800, 560, -3000]), cam([800, 520, 1150], [800, 560, -3000]), None, None, None, None,
        cam([560, 510, 1000], [460, 540, -3000]), cam([1080, 520, 1000], [1180, 580, -3000]), cam([800, 515, 1250], [800, 555, -3000])])
print('7-12 ok')
