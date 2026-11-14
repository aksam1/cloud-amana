from base import *

# ── 1 · The heavens and the earth ─────────────────────────────────────────
angels_l = {'type': 'crowd', 'kind': 'angels', 'show': [3, None], 'area': [-760, 230, -5400, -2400], 'y': [810, 700], 'count': 46, 'size': 92,
            'color': '#fff2cc', 'dim': 0.25, 'glow': 0.6, 'mill': 0, 'speed': 0, 'flicker': 0.12, 'at': {'5': {'dim': 0.5}}}
build('s01-heavens.json',
  world={'fog': '#06060d', 'fogNear': 8000, 'fogFar': 60000, 'light': 1.0, 'rays': 0, 'bloom': 0.95, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  art=["The angels are shown as witnesses for the sake of the picture; the Quran does not describe them watching this moment.",
       "The thread of light, the smoke and the seven heavens are drawn as light and colour only; nothing in them stands for God."],
  layers=[
    {'type': 'cosmos', 'show': [0, 4], 'thread': 0.32, 'smoke': 0, 'fade': 3000,
     'at': {'1': {'thread': 1, 'smoke': 1}, '2': {'thread': 0.5, 'smoke': 0.75, 'split': 1, 'skies': 7}, '3': {'thread': 0.22, 'smoke': 0.6, 'split': 1, 'skies': 7}}},
    {'type': 'heavens', 'show': [4, None], 'horizon': 640, 'sun': {'rise': 6, 'set': 18, 'x0': 1060, 'x1': 300, 'peak': 420, 'size': 36},
     'tod': [4.3, 5.3, 8500], 'at': {'5': {'tod': [5.3, 6.4, 9500]}}},
    {'type': 'clouds', 'show': [4, None], 'depth': 0.07, 'y': 360, 'count': 6, 'color': '#e9e1d0', 'rim': '#d9935e', 'fog': 0.4, 'reveal': {'dir': 'right', 'dur': 5200, 'delay': 1500}},
    {'type': 'ridge', 'show': [4, None], 'depth': 0.1, 'y': 640, 'amp': 150, 'seed': 3, 'sharp': 0.7, 'color': '#5e5a78', 'haze': 0.35, 'fog': 0.5, 'reveal': {'dir': 'up', 'dur': 3200}},
    {'type': 'earth', 'show': [2, None], 'depth': 0.16, 'y': 680, 'state': 'molten', 'at': {'3': {'state': 'raw'}, '5': {'state': 'green'}}},
    {'type': 'light', 'kind': 'flame', 'show': [2, 4], 'depth': 0.17, 'pos': [800, 980], 'h': 520, 'color': '#ff6a2a', 'glow': 0.55},
    {'type': 'ridge', 'show': [4, None], 'depth': 0.2, 'y': 700, 'amp': 110, 'seed': 5, 'sharp': 0.6, 'color': '#3e3a50', 'haze': 0.1, 'reveal': {'dir': 'up', 'dur': 3000, 'delay': 700}},
    {'type': 'water', 'show': [4, None], 'mode': 'sea', 'depth': 0.26, 'level': 724, 'reflect': [['0', '#3d5a78'], ['1', '#0e1a2a']], 'reveal': {'dir': 'up', 'dur': 2600, 'delay': 1700},
     'at': {'5': {'reflect': [['0', '#d9a070'], ['1', '#2a3a52']]}}},
    angels_l,
    {**angels_l, 'area': [1370, 2360, -5400, -2400]},
    dust(box=(-1600, -200, -12000, 3200, 1100, 0), count=700, size=3, color='#ffe8c0', opacity=0.45, wind=(3, -2, 0), swirl=60),
  ],
  cams=[cam([800, 450, 1500], [800, 450, -3000]), cam([800, 450, 1200], [800, 452, -3000]), cam([800, 470, 1150], [800, 485, -3000]),
        cam([800, 480, 1100], [800, 505, -3000]), cam([800, 500, 1150], [800, 535, -3000]), cam([800, 490, 1200], [800, 520, -3000])])

# ── 2 · The jinn ──────────────────────────────────────────────────────────
targets = [(260, 700, -4000), (420, 722, -3000), (560, 690, -5000), (690, 742, -2600), (910, 738, -2700), (1040, 700, -4200),
           (1180, 728, -3100), (1340, 706, -4600), (340, 764, -2000), (1250, 772, -2100), (620, 668, -7000), (1000, 664, -7400)]
flames = []
for i, (x, y, z) in enumerate(targets):
    dx = 60 if i % 3 else -50
    flames.append({'type': 'light', 'kind': 'flame', 'show': [1, None], 'h': 50 + (i * 7) % 28, 'color': ['#ff4a1a', '#ff7a2a', '#ffa040', '#e8341a'][i % 4], 'glow': 1.2,
                   'path': [[800, 770, -2333], [x, y, z]], 'dur': 4200 + i * 220, 'delay': 1400 + (i * 170) % 900,
                   'at': {'2': {'path': [[x, y, z], [x + dx, y + 4, z - 300]], 'dur': 7000}}})
towns = [{'type': 'town', 'show': [3, None], 'depth': 0.14, 'y': 652, 'x0': 180, 'x1': 700, 's': 0.6, 'grade': 'hut', 'night': True, 'lit': 0.6, 'grey': 0.5,
          'haze': '#1a0806', 'seed': 31, 'reveal': {'dir': 'up', 'dur': 2400}, 'at': {'3': {'shatter': {'delay': 4300, 'dur': 2400, 'seed': 31}}}},
         {'type': 'town', 'show': [3, None], 'depth': 0.13, 'y': 648, 'x0': 930, 'x1': 1440, 's': 0.55, 'grade': 'hut', 'night': True, 'lit': 0.6, 'grey': 0.5,
          'haze': '#1a0806', 'seed': 32, 'reveal': {'dir': 'up', 'dur': 2600, 'delay': 400}, 'at': {'3': {'shatter': {'delay': 4800, 'dur': 2400, 'seed': 32}}}}]
build('s02-jinn.json',
  world={'fog': '#1a0806', 'fogNear': 5000, 'fogFar': 36000, 'light': 0.85, 'rays': 0, 'bloom': 1.0, 'haze': 0.14, 'hazeY': 0.62, 'shake': 0.3, 'dof': 0},
  art=["The jinn are shown only as flames of fire, never as figures. Their cities, and the strife the early commentators describe, are imagined."],
  layers=[
    {'type': 'cosmos', 'smoke': 0.45, 'stars': 0.35, 'colors': ['#6a1e10', '#ff6a2a', '#1e0604'], 'gold': '#ff8a3a', 'base': '#0c0302',
     'at': {'1': {'smoke': 0.6}, '3': {'smoke': 0.7, 'stars': 0.2}}},
    {'type': 'ridge', 'depth': 0.05, 'y': 600, 'amp': 90, 'seed': 41, 'sharp': 0.6, 'color': '#3a1410', 'haze': 0.3, 'fog': 0.4},
    {'type': 'ridge', 'depth': 0.1, 'y': 640, 'amp': 120, 'seed': 42, 'sharp': 0.7, 'color': '#2a0e0a', 'haze': 0.15},
    *towns,
    {'type': 'dunes', 'depth': 0.18, 'y': 694, 'amp': 14, 'count': 10, 'seed': 43, 'lit': '#8a321c', 'body': '#3e140c', 'shade': '#160604'},
    {'type': 'fire', 'show': [0, 2], 'depth': 0.3, 'pos': [800, 792], 'w': 240, 'h': 460, 'heat': 1.15, 'at': {'1': {'w': 300, 'h': 560}}},
    {'type': 'light', 'kind': 'flame', 'show': [0, 2], 'depth': 0.31, 'pos': [800, 780], 'h': 300, 'color': '#ff5a1a', 'glow': 0.7},
    *flames,
    {'type': 'dunes', 'depth': 0.36, 'y': 830, 'amp': 18, 'count': 7, 'seed': 44, 'lit': '#5a1e12', 'body': '#2a0c08', 'shade': '#100403'},
    dust(box=(-1400, 200, -6000, 3000, 950, 0), count=800, size=4, color='#ff7a3a', opacity=0.5, wind=(10, -34, 0), swirl=40),
  ],
  cams=[cam([800, 560, 1100], [800, 640, -3000]), cam([800, 545, 1150], [800, 615, -3000]), cam([800, 520, 1250], [800, 570, -3000]),
        cam([800, 520, 1200], [800, 560, -3000]), cam([800, 525, 1260], [800, 560, -3000])])

# ── 3 · The angels told of a khalifah ─────────────────────────────────────
ranks = {'type': 'crowd', 'kind': 'angels', 'area': [-1500, 640, -16000, -2400], 'y': [840, 600], 'count': 360, 'size': 100,
         'color': '#fff2cc', 'dim': 0.3, 'glow': 0.5, 'mill': 0, 'speed': 0, 'flicker': 0.1, 'at': {'2': {'flicker': 0.38, 'dim': 0.05}, '3': {'flicker': 0.12}}}
build('s03-khalifah.json',
  world={'fog': '#2a2214', 'fogNear': 6000, 'fogFar': 60000, 'light': 1.0, 'rays': 0, 'bloom': 1.0, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  art=["No one stands at the centre of the court, and no light stands for God: His words appear only as the verse and as words written in the air."],
  layers=[
    court(),
    {'type': 'mist', 'depth': 0.06, 'y': 620, 'color': '#f8ecd0', 'bands': 4, 'spread': 60, 'h': 90, 'fog': 0.3},
    ranks,
    {**ranks, 'area': [960, 3100, -16000, -2400]},
    {'type': 'mist', 'depth': 0.3, 'y': 840, 'color': '#f4e4c4', 'bands': 3, 'spread': 40, 'h': 70},
    dust(box=(-1600, 0, -14000, 3200, 1000, 0), count=900, size=3, color='#fff0c8', opacity=0.4, wind=(2, -4, 0), swirl=50),
    {'type': 'calligraphy', 'ref': '2:30', 'ar': [4, 8], 'x': 800, 'y': 330, 'size': 86, 'color': '#ffe8b0', 'w': 900, 'dur': 4200, 'show': [1, None],
     'at': {'2': {'opacity': 0.35}, '3': {'opacity': 0.8}}},
  ],
  cams=[cam([800, 470, 1300], [800, 470, -3000]), cam([800, 462, 1120], [800, 458, -3000]), cam([800, 470, 1040], [800, 470, -3000]), cam([800, 462, 1080], [800, 458, -3000])])

# ── 4 · The creation of Adam ──────────────────────────────────────────────
soils = []
for i, c in enumerate(['#b0503a', '#ece0cc', '#2e2824', '#c89050']):
    ox = (-1, 1, -1, 1)[i] * 900
    soils.append(dust(box=(-260 + i * 40, 780, -3000, 1860 - i * 40, 1500, -1700), count=320, size=10, color=c, opacity=0.85, wind=(0, -6, 0), swirl=140,
                      blend='normal' if c == '#2e2824' else 'add', show=[0, 2]))
build('s04-adam.json',
  world={'fog': '#1a120a', 'fogNear': 4000, 'fogFar': 40000, 'light': 0.95, 'rays': 0, 'bloom': 0.9, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  art=["Adam is shown only as a figure of light within the clay, never in detail; Iblis only as a shadow in a smouldering glow.",
       "No light stands for God."],
  layers=[
    court(smoke=0.4, colors=['#5a4020', '#c8a058', '#140c06'], base='#0a0806'),
    {'type': 'crowd', 'kind': 'angels', 'show': [1, None], 'area': [-900, 2500, -11000, -4000], 'y': [700, 620], 'count': 240, 'size': 90,
     'color': '#fff2cc', 'dim': 0.45, 'glow': 0.5, 'mill': 0, 'speed': 0, 'flicker': 0.1, 'at': {'2': {'dim': 0.3}}},
    {'type': 'ground', 'depth': 0.2, 'y': 706, 'amp': 6, 'seed': 51, 'color': '#3a2a1e', 'color2': '#1a120c'},
    *soils,
    {'type': 'light', 'kind': 'flame', 'depth': 0.29, 'pos': [800, 760], 'h': 260, 'color': '#e8a060', 'glow': 0.45},
    {'type': 'clay', 'depth': 0.3, 'x': 800, 'y': 710, 'h': 230, 'at': {'1': {'form': True}, '2': {'breath': True}}},
    light([800, 712], 150, depth=0.31, color='#fff4dc', glow=1.0, bright=1.5, show=[2, None]),
    {'type': 'orbit', 'show': [3, None], 'depth': 0.31, 'x': 800, 'y': 560, 'rx': 310, 'ry': 80, 'size': 30},
    {'type': 'light', 'kind': 'ember', 'show': [1, None], 'depth': 0.3, 'h': 120, 'color': '#ff6a2a', 'glow': 0.6, 'pose': 'walk',
     'path': [[1230, 716], [1010, 694], [600, 694], [380, 716], [600, 738], [1010, 738], [1250, 718]], 'dur': 8600,
     'at': {'2': {'pose': 'stand', 'path': None, 'pos': [1250, 718]}}},
    dust(box=(-300, 680, -2700, 1900, 1000, -2000), count=220, size=4, color='#ffe08a', opacity=0.6, wind=(0, 0, 0), swirl=160, show=[3, None]),
    dust(box=(-1400, 100, -9000, 3000, 950, 0), count=500, size=3, color='#ffe8c0', opacity=0.3),
  ],
  cams=[cam([800, 520, 1200], [800, 585, -3000]), cam([800, 535, 1060], [800, 615, -3000]), cam([800, 530, 960], [800, 600, -3000]), cam([800, 520, 1020], [800, 580, -3000])],
  say={0: "God gathered clay from every land of the earth: red and white, black and every shade between."})

# ── 5 · Iblis refuses to bow ──────────────────────────────────────────────
# Adam stands at design (800, 732) on depth 0.3: world (0, -940, -2333); the rings stand round him
ground5 = (450 - 732) * (1000 - (1000 - 1000 / 0.3)) / 1000
build('s05-refusal.json',
  world={'fog': '#1a140a', 'fogNear': 5000, 'fogFar': 50000, 'light': 0.95, 'rays': 0, 'bloom': 0.95, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  art=["Adam appears only as a figure of light; Iblis only as a shadow in a smouldering glow; the angels as columns of light. No light stands for God."],
  layers=[
    court(),
    {'type': 'mist', 'depth': 0.1, 'y': 720, 'color': '#f0e0c0', 'bands': 4, 'spread': 50, 'h': 80, 'fog': 0.3},
    *[{**r, 'at': {'1': {'bow': 1}}} for r in rings([0, -2333], [1500, 760], round(ground5), 270, count=260)][:1],
    light([800, 732], 140, depth=0.3, color='#fff4dc', glow=1.0, bright=1.5),
    {'type': 'light', 'kind': 'ember', 'depth': 0.3, 'pos': [1180, 738], 'h': 130, 'color': '#ff7a2a', 'glow': 0.7,
     'at': {'2': {'glow': 0.4, 'color': '#a8401c'}, '3': {'glow': 0.3, 'color': '#8a3018'}}},
    *[{**r, 'at': {'1': {'bow': 1}}} for r in rings([0, -2333], [1500, 760], round(ground5), 270, count=260)][1:],
    dust(box=(-1400, 100, -9000, 3000, 950, 0), count=600, size=3, color='#fff0c8', opacity=0.35, wind=(2, -3, 0)),
  ],
  cams=[cam([800, 520, 1250], [800, 600, -3000]), cam([800, 520, 1220], [800, 600, -3000]), cam([900, 530, 1020], [960, 620, -3000]), cam([950, 530, 960], [1010, 622, -3000])],
  say={0: "God commanded the angels to bow before Adam."})

# ── 6 · Iblis is banished ─────────────────────────────────────────────────
build('s06-banished.json',
  world={'fog': '#140e0a', 'fogNear': 5000, 'fogFar': 50000, 'light': 0.95, 'rays': 0, 'bloom': 0.95, 'haze': 0, 'hazeY': 0.6, 'shake': 0.4, 'dof': 0},
  art=["Iblis is shown only as a shadow in a smouldering glow: no horns, no face. The court's light is the angels' own; no light stands for God."],
  layers=[
    {'type': 'set', 'show': [0, 2], 'layers': [
      court(),
      {'type': 'mist', 'depth': 0.1, 'y': 720, 'color': '#f0e0c0', 'bands': 4, 'spread': 50, 'h': 80, 'fog': 0.3},
      rings([0, -2333], [1500, 760], round(ground5), 270, count=260, glow=0.9, dim=0.1)[0],
      {'type': 'light', 'kind': 'ember', 'depth': 0.3, 'pos': [800, 738], 'h': 130, 'color': '#c04a1e', 'glow': 0.45,
       'at': {'1': {'pose': 'walk', 'path': [[800, 738], [840, 560], [960, 1100]], 'dur': 3600, 'delay': 1800}}},
      rings([0, -2333], [1500, 760], round(ground5), 270, count=260, glow=0.9, dim=0.1)[1],
      dust(box=(-1400, 100, -9000, 3000, 950, 0), count=600, size=3, color='#fff0c8', opacity=0.4, wind=(2, -3, 0)),
    ]},
    {'type': 'set', 'show': [2, 3], 'dx': 6000, 'layers': [
      {'type': 'heavens', 'horizon': 900, 'tod': [21, 21.5, 5200]},
      {'type': 'clouds', 'depth': 0.06, 'y': 260, 'count': 8, 'color': '#5a5068', 'rim': '#a07890', 'fog': 0.3},
      {'type': 'clouds', 'depth': 0.12, 'y': 520, 'count': 7, 'color': '#4a4258', 'rim': '#8a6a84'},
      {'type': 'light', 'kind': 'ember', 'h': 110, 'color': '#ff6a2a', 'glow': 0.9, 'pose': 'walk', 'path': [[820, -160, -2600], [800, 420, -2700], [770, 1100, -2800]], 'dur': 4800},
      dust(box=(500, -600, -2900, 1100, 1600, -2500), count=300, size=9, color='#2a2028', opacity=0.5, wind=(0, -260, 0), swirl=30, blend='normal'),
      {'type': 'clouds', 'depth': 0.3, 'y': 760, 'count': 6, 'color': '#3a3448', 'rim': '#7a5a78'},
    ]},
    {'type': 'set', 'show': [3, None], 'dx': 12000, 'layers': [
      {'type': 'heavens', 'horizon': 640, 'moon': {'rise': 20, 'set': 6, 'x0': 1250, 'x1': 350, 'peak': 320, 'size': 22}, 'tod': [22, 23, 9500], 'at': {'4': {'tod': [23, 0.2, 9500]}}},
      {'type': 'ridge', 'depth': 0.05, 'y': 620, 'amp': 70, 'seed': 61, 'sharp': 0.5, 'color': '#1e1a24', 'haze': 0.3, 'fog': 0.4},
      {'type': 'ground', 'depth': 0.2, 'y': 720, 'amp': 14, 'seed': 62, 'color': '#24202a', 'color2': '#100e14'},
      {'type': 'light', 'kind': 'ember', 'depth': 0.3, 'pos': [800, 760], 'h': 120, 'color': '#ff5a24', 'glow': 0.8, 'at': {'4': {'pose': 'raise'}}},
      dust(box=(600, 500, -2500, 1000, 1400, -2100), count=180, size=10, color='#2a2028', opacity=0.45, wind=(4, -60, 0), swirl=40, blend='normal'),
      dust(box=(-1400, 200, -6000, 3000, 950, 0), count=300, size=3, color='#ff8a4a', opacity=0.3, wind=(6, -10, 0)),
    ]},
    {'type': 'lightning', 'show': [1, 2], 'at': {'1': {'flash': 1}}},
  ],
  cams=[cam([800, 520, 1200], [800, 600, -3000]), cam([800, 520, 1200], [800, 600, -3000]), cam([800, 450, 1100], [800, 450, -3000], dx=6000),
        cam([800, 540, 1000], [800, 625, -3000], dx=12000), cam([800, 540, 950], [800, 628, -3000], dx=12000)])
print('1-6 ok')
