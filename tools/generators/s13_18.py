from base import *


def orig(name, kind, i=0, **over):
    """The i-th layer of a kind from the original 2D scene, with changes."""
    ls = [l for l in load(name)['layers'] if l['type'] == kind]
    l = {k: v for k, v in ls[i].items()}
    for k, v in over.items():
        if v is None:
            l.pop(k, None)
        else:
            l[k] = v
    return l


STORM = {'fog': '#2e2c34', 'fogNear': 5000, 'fogFar': 34000, 'light': 0.9, 'rays': 0, 'bloom': 0.8, 'haze': 0, 'hazeY': 0.6, 'shake': 0.4, 'dof': 0}
habil = dict(depth=0.25, h=104, color='#fdfaf2', glow=0.45, bright=1.1, solid=0.4)
qabil = dict(depth=0.25, h=108, color='#e88a42', glow=0.45, bright=1.1, solid=0.55)


def hill(seed=90):
    return [
        {'type': 'ridge', 'depth': 0.05, 'y': 620, 'amp': 70, 'seed': seed, 'sharp': 0.5, 'color': '#4a4650', 'haze': 0.35, 'fog': 0.4},
        {'type': 'ground', 'depth': 0.16, 'y': 700, 'amp': 26, 'seed': seed + 1, 'color': '#6a6050', 'color2': '#3a342c'},
    ]


# ── 13 · The two offerings ─────────────────────────────────────────────────
build('s13-offerings.json',
  world={**STORM, 'fog': '#3a3640', 'light': 0.92},
  art=["Habil and Qabil appear only as figures of light, with no faces. That fire came down to take the accepted offering is told by the commentators."],
  layers=[
    {'type': 'heavens', 'horizon': 620, 'sun': {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 300, 'size': 32},
     'tod': [15, 15.6, 7500], 'at': {'1': {'tod': [15.6, 16.1, 7000]}, '2': {'tod': [16.1, 16.6, 6500]}, '3': {'tod': [16.6, 17.2, 9500]}, '4': {'tod': [17.2, 17.8, 7500]}}},
    orig('s13-offerings.json', 'clouds', depth=0.08, fog=0.3),
    *hill(),
    orig('s13-offerings.json', 'altar', 0, depth=0.24, x=720),
    orig('s13-offerings.json', 'altar', 1, depth=0.24, x=1000),
    light([640, 712], **habil),
    light([1090, 712], **qabil, at={'4': {'color': '#c2501f', 'glow': 0.6}}),
    {'type': 'fire', 'show': [3, None], 'depth': 0.245, 'pos': [720, 700], 'w': 150, 'h': 260, 'cool': 1, 'heat': 0.9},
    orig('s13-offerings.json', 'beam', 1, depth=0.25, x=720, show=[3, None]),
    dust(box=(-1400, 200, -6000, 3000, 950, 600), count=500, size=3, color='#c8c0b8', opacity=0.35, wind=(30, -2, 0), swirl=30,
         at={'4': {'wind': [160, -6, 0], 'opacity': 0.5}}),
  ],
  cams=[cam([860, 520, 1100], [860, 580, -3000]), cam([800, 522, 1040], [780, 590, -3000]), cam([940, 522, 1040], [980, 590, -3000]),
        cam([820, 515, 1000], [790, 565, -3000]), cam([880, 520, 1100], [900, 570, -3000])])

# ── 14 · The threat and the answer ─────────────────────────────────────────
wisp = orig('s14-threat.json', 'wisp', depth=0.255, points=[[1170, 780], [1140, 720], [1100, 660]], wrap={'x': 1090, 'y': 612, 'r': 36, 'turns': 1.6})
build('s14-threat.json',
  world=STORM,
  layers=[
    {'type': 'heavens', 'horizon': 620, 'sun': {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 300, 'size': 32},
     'tod': [17.6, 18.1, 6500], 'at': {'1': {'tod': [18.1, 18.6, 8000]}, '2': {'tod': [18.6, 19.1, 9000]}, '3': {'tod': [19.1, 19.4, 5000]}, '4': {'tod': [19.4, 20, 11000]}}},
    orig('s14-threat.json', 'clouds', depth=0.08, fog=0.3),
    *hill(92),
    orig('s14-threat.json', 'altar', 0, depth=0.24, x=760),
    orig('s14-threat.json', 'altar', 1, depth=0.24, x=940),
    light([640, 712], **{**habil, 'glow': 0.55}),
    light([1090, 712], **{**qabil, 'color': '#b8321a', 'glow': 0.6, 'solid': 0.6}),
    wisp,
    dust(box=(-1400, 200, -6000, 3000, 950, 600), count=600, size=3, color='#b8b0a8', opacity=0.35, wind=(30, -2, 0), swirl=30,
         at={'1': {'wind': [60, -4, 0]}, '2': {'wind': [90, -4, 0]}, '3': {'wind': [170, -8, 0], 'opacity': 0.5}, '4': {'wind': [200, -8, 0], 'opacity': 0.55}}),
  ],
  cams=[cam([860, 520, 1100], [860, 580, -3000]), cam([980, 525, 980], [1040, 600, -3000]), cam([720, 525, 980], [680, 600, -3000]),
        cam([860, 520, 1050], [860, 580, -3000]), cam([780, 522, 1040], [740, 592, -3000])])

# ── 15 · The first murder ──────────────────────────────────────────────────
build('s15-first-murder.json',
  world={**STORM, 'fog': '#24222a', 'light': 0.85},
  art=["No violence is shown: the moment happens off screen, marked only by a single drop of ink, and Habil's light is simply gone."],
  layers=[
    {'type': 'heavens', 'horizon': 620, 'moon': {'rise': 18, 'set': 6, 'x0': 1250, 'x1': 350, 'peak': 320, 'size': 22},
     'tod': [20, 20.4, 4800], 'at': {'1': {'tod': [20.4, 20.6, 2800]}, '2': {'tod': [20.6, 21, 8200]}, '3': {'tod': [21, 21.8, 10500]}, '4': {'tod': [21.8, 22.4, 7000]}}},
    orig('s15-first-murder.json', 'clouds', depth=0.08, fog=0.3),
    *hill(94),
    orig('s15-first-murder.json', 'altar', 0, depth=0.24, x=760),
    orig('s15-first-murder.json', 'altar', 1, depth=0.24, x=940),
    light([640, 712], **{**habil, 'glow': 0.55}, show=[0, 3]),
    light([1090, 712], **{**qabil, 'color': '#b8321a', 'glow': 0.6, 'solid': 0.6}, pose='walk', path=[[1090, 712], [880, 712]], dur=2600,
          at={'2': {'pose': 'stand', 'path': None, 'pos': [880, 712]}, '3': {'color': '#7d7873', 'glow': 0.25, 'bright': 0.85}, '4': {'color': '#6a6662', 'glow': 0.15, 'bright': 0.75}}),
    dust(show=[3, None], box=(-1400, -400, -6000, 3000, 1000, 600), count=1400, size=3, color='#9aa8c0', opacity=0.5, wind=(-30, 900, 0), swirl=4),
    {'type': 'lightning', 'show': [1, 2], 'at': {'1': {'flash': 1}}},
    orig('s15-first-murder.json', 'inkdrop', depth=None),
  ],
  cams=[cam([860, 520, 1100], [860, 580, -3000]), cam([860, 520, 1100], [860, 580, -3000]), cam([860, 520, 1100], [860, 580, -3000]),
        cam([900, 520, 1050], [920, 585, -3000]), cam([920, 525, 980], [950, 600, -3000])],
  beat_world={2: {'light': 0.45}, 3: {'light': 0.75}})

# ── 16 · The crow ──────────────────────────────────────────────────────────
crow = orig('s16-crow.json', 'crow', depth=0.25, x=1010, y=712)
build('s16-crow.json',
  world={'fog': '#3a2c40', 'fogNear': 5000, 'fogFar': 34000, 'light': 0.9, 'rays': 0, 'bloom': 0.75, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  art=["Habil's body is never shown: it lies under a covering of earth. Qabil appears only as a dimmed figure of light."],
  layers=[
    {'type': 'heavens', 'horizon': 620, 'sun': {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 300, 'size': 32},
     'tod': [18.2, 18.6, 7500], 'at': {'1': {'tod': [18.6, 18.9, 7500]}, '2': {'tod': [18.9, 19.2, 7500]}, '3': {'tod': [19.2, 19.6, 10500]}, '4': {'tod': [19.6, 20, 9000]}}},
    {'type': 'ridge', 'depth': 0.05, 'y': 620, 'amp': 70, 'seed': 96, 'sharp': 0.5, 'color': '#3e3448', 'haze': 0.35, 'fog': 0.4},
    {'type': 'ground', 'depth': 0.16, 'y': 700, 'amp': 18, 'seed': 97, 'color': '#4a3e44', 'color2': '#2a2228'},
    {'type': 'tree', 'depth': 0.2, 'x': 1260, 'y': 704, 'h': 260, 'kind': 'bare', 'seed': 98},
    {'type': 'mound', 'depth': 0.24, 'x': 860, 'y': 714, 'w': 130, 'grow': False, 'color': '#3a2c2c', 'at': {'4': {'color': '#4a3a2e', 'w': 140}}},
    light([760, 716], 92, depth=0.25, color='#8a8580', glow=0.3, bright=0.9, solid=0.5, pose='kneel', at={'3': {'h': 80, 'glow': 0.22}}),
    crow,
    dust(show=[2, 4], box=(1700, 1250, -3200, 1900, 1450, -2900), count=50, size=7, color='#6a5444', opacity=0.5, wind=(0, -30, 0), swirl=40, blend='normal'),
    dust(box=(-1400, 200, -6000, 3000, 950, 600), count=300, size=2.4, color='#e0d0e8', opacity=0.25, wind=(3, -2, 0)),
  ],
  cams=[cam([840, 520, 1050], [860, 590, -3000]), cam([900, 525, 980], [940, 610, -3000]), cam([940, 530, 900], [990, 630, -3000]),
        cam([860, 525, 960], [880, 610, -3000]), cam([860, 520, 1050], [880, 590, -3000])])

# ── 17 · A lesson for all humanity ─────────────────────────────────────────
o17 = load('s17-lesson.json')
callig17 = [{k: v for k, v in l.items() if k != 'depth'} for l in o17['layers'] if l['type'] == 'calligraphy']
globe = {'type': 'globe', 'show': [2, None], 'pos': [800, 1260], 'r': 790, 'r0': 2400, 'zoomDur': 8000, 'at': {'3': {'phase': 'dark'}, '4': {'phase': 'gold'}}}
build('s17-lesson.json',
  world={'fog': '#0a0c18', 'fogNear': 6000, 'fogFar': 60000, 'light': 0.9, 'rays': 0, 'bloom': 0.9, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  layers=[
    {'type': 'heavens', 'horizon': 640, 'moon': {'rise': 18, 'set': 6, 'x0': 1250, 'x1': 350, 'peak': 300, 'size': 26},
     'tod': [21.2, 21.8, 6500], 'at': {'1': {'tod': [21.8, 22.4, 7000]}, '2': {'tod': [22.4, 23, 9500]}, '3': {'tod': [23, 23.6, 11000]}, '4': {'tod': [23.6, 0.4, 12500]}}},
    {'type': 'set', 'show': [0, 1], 'layers': [
      {'type': 'ridge', 'depth': 0.05, 'y': 630, 'amp': 70, 'seed': 96, 'sharp': 0.5, 'color': '#3a3a52', 'haze': 0.3, 'fog': 0.4},
      {'type': 'ground', 'depth': 0.16, 'y': 700, 'amp': 18, 'seed': 97, 'color': '#4a4a62', 'color2': '#2a2a3a'},
      {'type': 'tree', 'depth': 0.2, 'x': 1220, 'y': 704, 'h': 260, 'kind': 'bare', 'seed': 98},
      {'type': 'mound', 'depth': 0.24, 'x': 820, 'y': 714, 'w': 140, 'grow': False, 'color': '#6a5a52'},
    ]},
    {'type': 'set', 'show': [1, 2], 'dx': 6000, 'layers': [
      {'type': 'clouds', 'depth': 0.1, 'y': 700, 'count': 8, 'color': '#6a6a8a', 'rim': '#a8a8d0', 'spanY': 60},
      {'type': 'clouds', 'depth': 0.22, 'y': 820, 'count': 7, 'color': '#5a5a7a', 'rim': '#9898c0', 'spanY': 50},
    ]},
    {'type': 'set', 'show': [2, None], 'dx': 12000, 'layers': [
      globe,
    ]},
    dust(box=(-1600, -200, -9000, 3200, 1000, 600), count=400, size=2.2, color='#d8e0ff', opacity=0.3, wind=(2, -1, 0)),
    *callig17,
  ],
  cams=[cam([800, 540, 1000], [800, 640, -3000]), cam([800, 470, 1100], [800, 470, -3000], dx=6000), cam([800, 450, 1100], [800, 450, -3000], dx=12000),
        cam([800, 450, 1080], [800, 450, -3000], dx=12000), cam([800, 450, 1060], [800, 450, -3000], dx=12000)])

# ── 18 · Adam's final days and Shith ───────────────────────────────────────
o18 = load('s18-shith.json')
scroll = orig('s18-shith.json', 'scroll', depth=0.35)
scroll['at'] = {k: {kk: vv for kk, vv in v.items() if kk != 'flood'} for k, v in scroll.get('at', {}).items()}
scroll['at'] = {k: v for k, v in scroll['at'].items() if v}
# (the name in calligraphy is left out: Arabic appears only when a verse is quoted)
ground18 = round((450 - 704) * (1000 / 0.35) / 1000)
fam = {'type': 'crowd', 'ground': ground18, 'area': [-2000, 2000, -3000, -1000], 'count': 34, 'size': 110, 'color': '#ffd8a0', 'dim': 0.3, 'glow': 0.6, 'mill': 0, 'speed': 0, 'flicker': 0.15,
       'at': {'3': {'dim': 0.62}}}
ring = {'center': [0, -1857], 'radius': [1150, 420], 'band': [0.5, 1], 'speed': 0}
build('s18-shith.json',
  world={'fog': '#2a1e16', 'fogNear': 3000, 'fogFar': 26000, 'light': 0.95, 'rays': 0, 'bloom': 0.85, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  art=["Adam, Shith and their family appear only as figures of light. That guidance passed to Shith is told in the traditions."],
  layers=[
    {'type': 'dwelling', 'depth': 0.3, 'at': {'4': {'dim': 0.25}}},
    {**fam, 'orbit': {**ring, 'half': 'back'}},
    light([800, 704], 90, depth=0.35, color='#fff4dc', glow=0.8, bright=1.4, pose='kneel',
          at={'4': {'glow': 0.45, 'bright': 1.1}, '5': {'pose': 'gone', 'path': [[800, 704], [820, 140]], 'dur': 5000}}),
    light([690, 708], 80, depth=0.35, color='#fff1c8', glow=1.0, bright=1.5, pose='kneel'),
    scroll,
    {**fam, 'orbit': {**ring, 'half': 'front'}},
    dust(box=(-1000, 300, -2600, 2600, 950, -1000), count=260, size=3, color='#ffd8a0', opacity=0.3, wind=(2, -6, 0)),
  ],
  cams=[cam([800, 520, 1100], [800, 580, -3000]), cam([740, 525, 950], [720, 600, -3000]), cam([780, 525, 920], [760, 600, -3000]),
        cam([800, 520, 1000], [800, 590, -3000]), cam([800, 515, 1050], [800, 570, -3000]), cam([800, 500, 1100], [800, 500, -3000])])
print('13-18 ok')
