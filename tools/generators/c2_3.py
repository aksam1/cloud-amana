# Chapters 2 and 3 (scenes 20–39, from Shith to the ark coming to rest) rebuilt for the WebGL stage. Each scene
# keeps its words, verses, timing and sound from its 2D original (kept in legacy2d/, so this can be run again);
# the pictures are composed anew in depth: living skies, figures of light, crowds that move, cameras that travel.
# Run from anywhere: python3 tools/generators/c2_3.py
import math
from base import *

LEG = os.path.join(HERE, 'legacy2d') + '/'
CH = {2: ROOT + 'src/story/chapters/c2/', 3: ROOT + 'src/story/chapters/c3/'}


def W(x, y, d):
    """The world point of design point (x, y) on a card at depth d (design orientation: y down)."""
    return [round(800 + (x - 800) / d, 1), round(450 + (y - 450) / d, 1), round(1000 - 1000 / d, 1)]


def proj(p, c):
    """Where world point p appears on screen (design frame) from camera c {pos, look} (both in the frame of the
    set the camera looks at, so a set's `dx`/`dz` cancel out)."""
    C, T = c['pos'], c['look']
    f = [T[i] - C[i] for i in range(3)]
    n = math.sqrt(sum(v * v for v in f))
    f = [v / n for v in f]
    down = [0, 1, 0]
    k = sum(down[i] * f[i] for i in range(3))
    dn = [down[i] - k * f[i] for i in range(3)]
    n = math.sqrt(sum(v * v for v in dn))
    dn = [v / n for v in dn]
    r = [f[1] * dn[2] - f[2] * dn[1], f[2] * dn[0] - f[0] * dn[2], f[0] * dn[1] - f[1] * dn[0]]
    v = [p[i] - C[i] for i in range(3)]
    z = sum(v[i] * f[i] for i in range(3))
    return [round(800 + 1000 * sum(v[i] * r[i] for i in range(3)) / z), round(450 + 1000 * sum(v[i] * dn[i] for i in range(3)) / z)]


def at(x, y, d, c):
    """Screen position of design point (x, y) at depth d seen from camera c."""
    return proj(W(x, y, d), c)


def frame(pos, p, sx=800, sy=450, **kw):
    """A camera at `pos` turned so that world point p appears at screen (sx, sy)."""
    ox = oy = 0.0
    for _ in range(60):
        c = {'pos': pos, 'look': [p[0] + ox, p[1] + oy, p[2]]}
        x, y = proj(p, c)
        dist = abs(p[2] - pos[2]) + 1
        ox += (x - sx) * dist / 1000 * 0.8
        oy += (y - sy) * dist / 1000 * 0.8
    return cam(pos, [round(p[0] + ox), round(p[1] + oy), p[2]], **kw)


def aim(x, y, d, below=0):
    """A look target: design point (x, y) at depth d, or a point `below` design units under it (raising it on screen)."""
    return W(x, y + below, d)


def gnd(y, d):
    """A crowd's world ground for design ground line y at depth d."""
    return round((450 - y) / d)


def zof(d):
    return round(1000 - 1000 / d)


def h17(d):
    """A person of 1.7 m at depth d, in design units."""
    return round(255 * d)


def sky(horizon, tods, sun=None, moon=None, **kw):
    """A living sky: `tods` {beat: tod}; beat 0's is the opening."""
    first = min(tods)
    l = {'type': 'heavens', 'horizon': horizon, 'tod': tods[first]}
    l['sun'] = sun or {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 260, 'size': 34}
    if moon:
        l['moon'] = moon
    rest = {str(b): {'tod': t} for b, t in tods.items() if b != first}
    if rest:
        l['at'] = rest
    l.update(kw)
    return l


def birds(z=-9000, n=3):
    out = []
    loops = [[[400, 300], [800, 240], [1100, 320], [700, 380], [400, 300], [800, 240]],
             [[1150, 260], [760, 330], [520, 250], [900, 210], [1150, 260], [760, 330]],
             [[600, 360], [980, 300], [1250, 360], [880, 400], [600, 360], [980, 300]]]
    for i in range(n):
        out.append({'type': 'light', 'kind': 'bird', 'depth': 0.1, 'h': 10 + i, 'color': '#fffaf0', 'glow': 0.55, 'bright': 1.3,
                    'path': [[x, y, z] for x, y in loops[i]], 'dur': 14000 + i * 1500, 'delay': i * 600})
    return out


MOON = {'rise': 19, 'set': 6.5, 'x0': 1300, 'x1': 300, 'peak': 320, 'size': 24}

person = dict(color='#ffd8a0', glow=0.12, dim=0.35, flicker=0.15)
day = dict(glow=0.3, bright=1.0, solid=0.5)
dayP = dict(color='#fffaf0', glow=0.35, bright=1.1, solid=0.5)   # a prophet by day
nightP = dict(color='#fff4dc', glow=0.8, bright=1.4)              # a prophet by night


def smoke(x, y, d, n=60, rise=40, show=None):
    """A plume of smoke from a roof or fire at design (x, y) on depth d."""
    X, Y, Z = (x - 800) / d, (450 - y) / d, zof(d)
    w = 30 / d
    l = dust(box=(X - w, Y, Z - 60, X + w, Y + 260 / d, Z + 60), count=n, size=round(12 / d), color='#c8c0b8', opacity=0.1, wind=(4, -rise, 0), swirl=20, blend='normal')
    l['box'] = [round(v) for v in l['box']]
    if show:
        l['show'] = show
    return l


def scene(name, ch, *, layers, cams, world, scene_cam=None, art=None, dissolve=2400, beat_world=None, say=None, prompt=None, extra=None, place=None):
    s = json.load(open(LEG + name))
    s['renderer'] = 'gl'
    s['dissolve'] = dissolve
    s['world'] = world
    s['cam'] = scene_cam or cams[0]
    if art is not None:
        s['art'] = art
    if prompt:
        s['imagePrompt'] = prompt
    if extra:
        s.update(extra)
    # ground cards reach well below the frame, so a camera looking down never finds their lower edge
    def deepen(ls):
        for l in ls:
            if l.get('type') == 'set':
                deepen(l['layers'])
            elif l.get('type') == 'ground' and 'area' not in l:
                l['area'] = [-800, l['y'] - 60, 2400, 2600]
    deepen(layers)
    s['layers'] = layers
    beats = []
    for i, b in enumerate(s['beats']):
        b = dict(b)
        b.pop('cam', None)
        if 'say' in b:
            b['say'] = god(b['say'])
        if say and i in say:
            b['say'] = say[i]
        if i < len(cams) and cams[i]:
            b['cam'] = cams[i]
        if beat_world and i in beat_world:
            b['world'] = beat_world[i]
        if place and i in place:
            b['verse'] = {**b['verse'], 'place': place[i]}
        order = ['dur', 'ambient', 'sfx', 'world', 'cam', 'say', 'verse', 'pendingVerse']
        beats.append({k: b[k] for k in order if k in b} | {k: v for k, v in b.items() if k not in order})
    s['beats'] = beats
    text = dump(s)
    if not os.environ.get('DRY'):
        open(CH[ch] + f"s{s['order']:02d}-{s['id']}.json", 'w').write(text)
    return s


# ═══ Chapter 2 ════════════════════════════════════════════════════════════════════════════════════════

# The valley of Adam's children (chapter 1's first home, generations on): the same hills, peak, river and huts.
VALLEY_W = {'fog': '#c8c0c0', 'fogNear': 6000, 'fogFar': 42000, 'light': 1.0, 'rays': 0, 'bloom': 0.65, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
HUTS = [(760, 668, 0.48), (545, 670, 0.5), (880, 672, 0.55), (650, 678, 0.66), (410, 678, 0.62), (820, 684, 0.8), (480, 692, 0.9), (735, 696, 0.95), (600, 700, 1.1)]


def valley():
    out = [
        {'type': 'ridge', 'depth': 0.05, 'y': 600, 'amp': 70, 'seed': 80, 'sharp': 0.4, 'color': '#7a7a90', 'haze': 0.35, 'fog': 0.4},
        {'type': 'peak', 'depth': 0.12, 'x': 360, 'y': 470, 'w': 420, 'h': 240, 'color': '#6a7a4a', 'lit': '#a8b468', 'seed': 85},
        {'type': 'ground', 'depth': 0.14, 'y': 660, 'amp': 10, 'seed': 82, 'color': '#8a9a5a', 'color2': '#5a6a3a', 'grass': True, 'grassColor': '#a8b468'},
        {'type': 'water', 'depth': 0.16, 'points': [[1320, 664], [1200, 700], [1110, 780], [1130, 900]], 'w0': 14, 'w1': 200},
        {'type': 'tree', 'depth': 0.17, 'x': 1340, 'y': 690, 'h': 240, 'kind': 'living', 'seed': 86},
    ]
    for i, (x, y, s) in enumerate(HUTS):
        out.append({'type': 'shelter', 'depth': round(0.21 + 0.004 * i, 3), 'x': x, 'y': y, 's': s, 'fire': i == 8})
    return out


def ring(cx, cy, d, radius, count, size, show=None, seed=7, **kw):
    """Listeners sitting in a ring round design point (cx, cy) on depth d: the halves behind and in front."""
    c = [round((cx - 800) / d), zof(d)]
    base = {'type': 'crowd', 'ground': gnd(cy, d), 'area': [-4000, 4000, -9000, 0], 'count': count, 'size': size, 'mill': 0, 'speed': 0, 'seed': seed, **person, **kw}
    o = {'center': c, 'radius': radius, 'band': [0.55, 1], 'speed': 0}
    out = [{**base, 'orbit': {**o, 'half': 'back'}}, {**base, 'orbit': {**o, 'half': 'front'}}]
    if show:
        for l in out:
            l['show'] = show
    return out


# ── 20 · Shith carries the guidance ───────────────────────────────────────────
SH = (1000, 720, 0.3)          # Shith by the river, among the huts' meadow
c20 = [
    cam([820, 515, 1100], [800, 560, -3000]),
    cam([1150, 700, -300], aim(1000, 690, 0.3)),
    cam([1120, 690, -150], aim(1000, 690, 0.3)),
    cam([1080, 670, 150], aim(1000, 690, 0.3)),
    cam([800, 505, 1150], [800, 555, -3000]),
]
hand = at(1012, 680, 0.3, c20[1])
guid = lambda c, r: {'from': at(1012, 680, 0.3, c), 'area': [*at(1000 - r, 690, 0.3, c), *at(1000 + r, 735, 0.3, c)]}
fam = lambda x1, y1, d1, dx0=0: [[1000 + dx0, 720, zof(0.3)], [(1000 + dx0 + x1) / 2, (720 + y1) / 2, zof((0.3 + d1) / 2)], [x1, y1, zof(d1)]]
scene('s20-shith-guidance.json', 2,
  world=VALLEY_W,
  scene_cam=cam([800, 505, 1250], [800, 555, -3000]),
  layers=[
    sky(620, {0: [5.6, 6.6, 6500], 1: [6.6, 8.2, 7500], 2: [8, 16, 4500, 1], 3: [9, 15, 4500, 1], 4: [6.6, 8.6, 8500]},
        sun={'rise': 6, 'set': 18, 'x0': 320, 'x1': 1300, 'peak': 260, 'size': 34}),
    *valley(),
    {'type': 'mist', 'show': [0, 2], 'depth': 0.155, 'y': 672, 'color': '#f0ece0', 'bands': 3, 'spread': 40, 'h': 50, 'opacity': 0.5},
    smoke(600, 640, 0.242, rise=36), smoke(735, 650, 0.238, n=40, rise=30),
    *ring(*SH, [300, 130], 16, 170, seed=21),
    *ring(*SH, [500, 210], 22, 170, show=[2, 4], seed=23),
    *ring(*SH, [700, 290], 30, 170, show=[3, 4], seed=29),
    {'type': 'light', 'depth': 0.3, 'pos': [1000, 720], 'h': h17(0.3), **dayP, 'at': {'1': {'pose': 'raise'}, '4': {'pose': 'stand'}}},
    # families setting out along new paths: to the hills on the left and across the river to the right
    *[{'type': 'light', 'show': [4, None], 'h': h17(0.3) - k * 6, 'color': '#ffe8c4', **day, 'pose': 'walk', 'path': fam(*dst, dx0=k * 24), 'dur': 8500, 'delay': 300 + k * 500}
      for k, dst in enumerate([(300, 662, 0.12), (330, 664, 0.12), (1460, 668, 0.13), (1490, 668, 0.13), (1520, 670, 0.13)])],
    {'type': 'guidance', 'show': [1, 2], **guid(c20[1], 110), 'count': 18},
    {'type': 'guidance', 'show': [2, 3], **guid(c20[2], 150), 'count': 22},
    {'type': 'guidance', 'show': [3, 4], **guid(c20[3], 200), 'count': 26},
    *[{**b, 'show': [4, None]} for b in birds(n=2)],
    {'type': 'ground', 'depth': 0.4, 'y': 852, 'amp': 10, 'seed': 84, 'color': '#6a7a42', 'color2': '#4a5a32', 'grass': True, 'grassColor': '#8a9a52', 'wind': 1},
    dust(box=(-1400, 200, -8000, 3000, 950, 600), count=400, size=2.4, color='#fff4e0', opacity=0.28, wind=(4, -2, 0)),
  ],
  cams=c20)
print('20 ok', hand)


# ── 21 · Humanity spreads across the earth ───────────────────────────────────
# A montage of lands, one per beat: green hills of huts; a river village behind its palisade; walled towns
# among red rocks, busy and greying, with a few still kneeling at the edge.
def land_y(d, hz=600, e=460):
    return round(hz + e * d)


def folk(x0, x1, d0, d1, count, size=None, show=None, **kw):
    """People of a place, milling, on ground land_y between depths d0 (far) and d1 (near)."""
    size = size or h17((d0 + d1) / 2)
    l = {'type': 'crowd', 'area': [x0, x1, zof(d0), zof(d1)], 'y': [land_y(d1), land_y(d0)], 'count': count, 'size': size, 'mill': 18, 'speed': 0, **person, **kw}
    if show:
        l['show'] = show
    return l


A21 = [
    sky(600, {0: [9, 10, 6000]}),
    {'type': 'range', 'count': 3, 'y': [520, 590], 'amp': [60, 90], 'depth': [0.04, 0.07], 'colors': ['#a8a6b4', '#7a7a74'], 'haze': [0.2, 0.5], 'sharp': 0.3, 'edge': False, 'seed': 81},
    {'type': 'range', 'count': 2, 'y': [606, 630], 'amp': [50, 70], 'depth': [0.09, 0.11], 'colors': ['#6f8a5e', '#4a6440'], 'haze': [0.3, 0.6], 'sharp': 0.15, 'edge': False, 'seed': 83},
    {'type': 'garden', 'depth': 0.115, 'plane': 'back', 'count': 10, 'fruit': False, 'y': 646, 'x0': -300, 'x1': 1900, 'avoid': [9000, 9000], 'seed': 5},
    {'type': 'ground', 'depth': 0.12, 'y': 655, 'amp': 14, 'seed': 3, 'color': '#6e7f48', 'color2': '#2e3a1e', 'grass': 50, 'grassColor': '#8aa05a'},
    {'type': 'town', 'depth': 0.15, 'grade': 'hut', 'y': land_y(0.15), 'x0': 470, 'x1': 1130, 's': 1.25, 'seed': 11},
    {'type': 'garden', 'depth': 0.17, 'plane': 'back', 'count': 5, 'fruit': False, 'y': land_y(0.17) + 6, 'x0': -200, 'x1': 1800, 'avoid': [380, 1220], 'seed': 9},
    folk(520, 1080, 0.155, 0.2, 14),
    smoke(640, land_y(0.15) - 50, 0.15, n=40), smoke(930, land_y(0.15) - 46, 0.15, n=40),
    {'type': 'ground', 'depth': 0.3, 'y': 800, 'amp': 12, 'seed': 13, 'x0': -600, 'x1': 2200, 'color': '#5e7040', 'color2': '#2e3a1e', 'grass': True, 'grassColor': '#8aa05a', 'wind': 1},
    *birds(n=2),
    dust(box=(-1400, 200, -8000, 3000, 950, 600), count=300, size=2.4, color='#fff4e0', opacity=0.25, wind=(5, -2, 0)),
]
RIVER = [[1000, 640], [920, 700], [760, 800], [560, 940]], [[1000, 640], [1010, 720], [1030, 820], [1040, 940]], [[1000, 640], [1090, 700], [1260, 800], [1440, 940]]
B21 = [
    sky(600, {1: [11, 12, 6000]}),
    {'type': 'range', 'count': 2, 'y': [560, 600], 'amp': [50, 70], 'depth': [0.04, 0.07], 'colors': ['#9aa6b4', '#76848a'], 'haze': [0.3, 0.5], 'sharp': 0.25, 'edge': False, 'seed': 85},
    {'type': 'ground', 'depth': 0.11, 'y': 640, 'amp': 8, 'seed': 13, 'color': '#8a8a58', 'color2': '#3e3e26', 'grass': 60, 'grassColor': '#a0a060'},
    *[{'type': 'water', 'depth': 0.13, 'points': p, 'w0': 4, 'w1': 150, 'reflect': [[0, '#e6dcc2'], [0.4, '#a9bcc4'], [1, '#5a7488']]} for p in RIVER],
    {'type': 'town', 'depth': 0.15, 'grade': 'village', 'y': land_y(0.15), 'x0': 360, 'x1': 860, 's': 1.2, 'wall': {'x0': 340, 'x1': 880, 'gate': 620, 'h': 34}, 'seed': 21},
    {'type': 'town', 'depth': 0.16, 'grade': 'village', 'y': land_y(0.16), 'x0': 1150, 'x1': 1460, 's': 1.25, 'seed': 22},
    folk(420, 1420, 0.16, 0.21, 22),
    smoke(520, land_y(0.15) - 70, 0.15, n=40), smoke(1300, land_y(0.16) - 74, 0.16, n=40),
    {'type': 'ground', 'depth': 0.3, 'y': 805, 'amp': 10, 'seed': 17, 'x0': -600, 'x1': 2200, 'color': '#7a7a4a', 'color2': '#3e3e26', 'grass': True, 'grassColor': '#a0a060', 'wind': 1},
    *birds(n=3),
    dust(box=(-1400, 200, -8000, 3000, 950, 600), count=300, size=2.4, color='#fff4e0', opacity=0.25, wind=(5, -2, 0)),
]
C21 = [
    sky(600, {2: [14, 15, 6000], 3: [16.2, 17.2, 8000]}),
    {'type': 'range', 'count': 2, 'y': [580, 616], 'amp': [90, 110], 'depth': [0.05, 0.08], 'colors': ['#b0603e', '#7a3e26'], 'haze': [0.4, 0.8], 'sharp': 0.75, 'edge': False, 'seed': 91},
    {'type': 'ground', 'depth': 0.11, 'y': 642, 'amp': 10, 'seed': 17, 'color': '#a86a44', 'color2': '#4a2c1c', 'grass': 20, 'grassColor': '#8a7a4a', 'rocks': 12},
    {'type': 'town', 'depth': 0.15, 'grade': 'town', 'y': land_y(0.15), 'x0': 380, 'x1': 900, 's': 1.15, 'wall': {'x0': 360, 'x1': 920, 'gate': 640, 'h': 40}, 'seed': 31, 'grey': 0.15, 'at': {'3': {'grey': 0.3}}},
    {'type': 'town', 'depth': 0.16, 'grade': 'town', 'y': land_y(0.16), 'x0': 980, 'x1': 1560, 's': 1.25, 'rows': 2, 'seed': 37, 'grey': 0.35, 'at': {'3': {'grey': 0.45}}},
    folk(400, 1560, 0.165, 0.22, 60, mill=28, at={'3': {'dim': 0.5}}),
    smoke(700, land_y(0.15) - 120, 0.15, n=50), smoke(1180, land_y(0.16) - 130, 0.16, n=50), smoke(1420, land_y(0.16) - 110, 0.16, n=40),
    # the few who still remember, kneeling outside the walls
    *[{'type': 'light', 'depth': 0.2, 'pos': [x, land_y(0.2)], 'h': h17(0.2), 'pose': 'kneel', 'color': '#fff4e0', **day} for x in (232, 270, 306)],
    {'type': 'ground', 'depth': 0.3, 'y': 800, 'amp': 10, 'seed': 19, 'x0': -600, 'x1': 2200, 'color': '#9a5e3c', 'color2': '#4a2c1c', 'rocks': 8},
    dust(box=(-1400, 200, -8000, 3000, 950, 600), count=400, size=2.6, color='#f0d8b8', opacity=0.3, wind=(8, -2, 0)),
]
K21 = (270, land_y(0.2), 0.2)
c21 = [
    cam([900, 500, 1100], [900, 540, -3000]),
    {**cam([900, 505, 1100], [900, 545, -3000]), 'dx': 9000},
    {**cam([900, 505, 1100], [900, 545, -3000]), 'dx': 18000},
    {**frame([-300, 760, -400], W(*K21), 470, 330, ease='inOut'), 'dx': 18000},
]
scene('s21-spreading.json', 2,
  world={'fog': '#c8c4b8', 'fogNear': 6000, 'fogFar': 42000, 'light': 1.0, 'rays': 0, 'bloom': 0.6, 'haze': 0.06, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  beat_world={2: {'fog': '#b8aea4', 'light': 0.95}, 3: {'fog': '#a8a0a0', 'light': 0.9}},
  scene_cam=cam([700, 500, 1100], [700, 540, -3000]),
  layers=[
    {'type': 'set', 'show': [0, 1], 'layers': A21},
    {'type': 'set', 'show': [1, 2], 'dx': 9000, 'layers': B21},
    {'type': 'set', 'show': [2, None], 'dx': 18000, 'layers': C21},
    {'type': 'tint', 'color': '#808080', 'amount': 1, 'blend': 'saturation', 'opacity': 0, 'at': {'1': {'opacity': 0.1}, '2': {'opacity': 0.25}, '3': {'opacity': 0.35}}},
  ],
  cams=c21)
print('21 ok', at(*K21, c21[3]))


# ── 22 · Idris, a man of truth ─────────────────────────────────────────────────
# One quiet street of his town at night, in true perspective (2.2 m wide each side, houses 6 m, the eye at
# 1.7 m): the camera walks down it and stops short of the lit doorway where he prays.
STREET = [(0.6, None, 7, 0.4), (0.45, 'right', 6, 0.7), (0.35, 'left', 5, 0.2), (0.28, 'right', 4, 0.5), (0.23, 'left', 3, 0.8), (0.19, 'right', 2, 0.3), (0.16, None, 8, 0.6)]


def lane(d, lamp, seed, door):
    l = {'type': 'lane', 'depth': d, 'gap': round(330 * d), 'y': round(450 + 255 * d), 'h': round(900 * d), 'seed': seed, 'door': door}
    if lamp:
        l['lamp'] = lamp
    return l


def lamp_flame(d, side):
    gap, y, h = 330 * d, 450 + 255 * d, 900 * d
    s = h / 420
    x = 800 - gap - 6 + 10 * s
    if side == 'right':
        x = 1600 - x
    return {'type': 'light', 'kind': 'flame', 'depth': round(d + 0.002, 3), 'pos': [round(x), round(y - h * 0.48 - 1 * s)], 'h': round(16 * s), 'color': '#ffb050', 'glow': 1.1}


END = 0.14
c22 = [
    cam([800, 452, 200], [800, 470, -6000], ease='inOut'),
    cam([800, 452, -900], [800, 472, -6000], ease='inOut'),
    cam([800, 454, -1500], [800, 500, -6000], ease='inOut'),
    cam([800, 454, -1600], [800, 498, -6000], ease='out'),
]
scene('s22-idris.json', 2,
  world={'fog': '#141a2e', 'fogNear': 4000, 'fogFar': 30000, 'light': 0.9, 'rays': 0, 'bloom': 0.9, 'haze': 0, 'hazeY': 0.6, 'shake': 0.2, 'dof': 0},
  scene_cam=cam([800, 450, 1000], [800, 466, -6000]),
  art=['Idris appears only as a figure of light seen from far behind; the camera stops short of his door out of respect. The town at night is imagined.'],
  layers=[
    sky(470, {0: [22.2, 22.5, 7000], 1: [22.5, 22.8, 7000], 2: [22.8, 23.2, 8500], 3: [23.2, 23.4, 6000]},
        moon={'rise': 17, 'set': 4, 'x0': 1060, 'x1': 560, 'peak': 110, 'size': 22}),
    {'type': 'lane', 'depth': END, 'end': True, 'y': round(450 + 255 * END), 'h': round(900 * END) + 30, 'seed': 2},
    {'type': 'floor', 'depth': END + 0.001, 'y': round(450 + 255 * END), 'vp': [800, 450], 'x0': -800, 'x1': 2400, 'color': '#2c2a3a', 'color2': '#100e18', 'lines': 10, 'gloss': 0.2, 'area': [-800, 480, 2400, 1350]},
    {'type': 'light', 'depth': END + 0.004, 'pos': [800, round(450 + 255 * END) - 1], 'h': h17(END), 'pose': 'kneel', **nightP, 'glow': 1.0, 'bright': 1.5},
    *[l for d, lamp, seed, door in reversed(STREET) for l in [lane(d, lamp, seed, door)] + ([lamp_flame(d, lamp)] if lamp else [])],
    dust(box=(-600, -300, -6000, 600, 400, 0), count=160, size=2.2, color='#ffe0b0', opacity=0.25, wind=(1, -1, 0), swirl=20),
  ],
  cams=c22, place={2: 'sky'})
print('22 ok', at(800, 450 + 255 * END - 20, END, c22[2]))


# ── 23 · The pen and the stars ─────────────────────────────────────────────────
# His workroom by morning (the beam through the window, dust turning in it); close on the pen writing and the
# needle stitching (drawn flat and live, as close-ups); then a rooftop at night under the real sky.
c23 = [
    cam([800, 450, 760], [800, 470, -3000], ease='inOut'),
    None, None, None,
    {**cam([800, 450, 1000], [800, 430, -3000]), 'dx': 9000},
]
scene('s23-pen.json', 2,
  world={'fog': '#2a2018', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.0, 'rays': 0, 'bloom': 0.8, 'haze': 0, 'hazeY': 0.6, 'shake': 0.2, 'dof': 0},
  beat_world={4: {'fog': '#0c1020', 'bloom': 0.9}},
  scene_cam=cam([800, 450, 1000], [800, 460, -3000]),
  layers=[
    {'type': 'set', 'show': [0, 4], 'layers': [
        {'type': 'room', 'depth': 0.5, 'ppu': 0.9},
        # dust turning in the beam from the window to the table
        dust(box=(-500, -460, -1100, 700, 440, -900), count=140, size=3, color='#ffe6a8', opacity=0.5, wind=(1, -1, 0), swirl=16),
    ]},
    {'type': 'pen', 'flat': True, 'depth': 1, 'show': [1, 3], 'phase': 'write', 'at': {'2': {'phase': 'spill'}}},
    {'type': 'garment', 'flat': True, 'depth': 1, 'show': [3, 4], 'dur': 5},
    {'type': 'set', 'show': [4, None], 'dx': 9000, 'layers': [
        sky(700, {4: [21, 21.6, 8500]}),
        {'type': 'ridge', 'depth': 0.05, 'y': 690, 'amp': 40, 'seed': 230, 'sharp': 0.3, 'color': '#141a30', 'haze': 0.2, 'fog': 0.3},
    ]},
    {'type': 'constellations', 'flat': True, 'depth': 1, 'show': [4, None], 'figure': {'x': 760, 'y': 690}},
  ],
  cams=c23)
print('23 ok')


# ── 24 · The call and the patience ─────────────────────────────────────────────
# The market square of Idris's town by day: stalls, people streaming past, Idris calling from the middle of
# the square (seen from behind), a few stopping to listen, some mocking; the seasons turn and the circle grows.
def mk_y(d):
    return round(540 + 400 * d)


IDR = (800, mk_y(0.4), 0.4)
LISTEN = [(690, 0.34), (912, 0.34), (600, 0.33), (1000, 0.33), (760, 0.32), (850, 0.32), (520, 0.315), (1080, 0.315), (640, 0.31), (960, 0.31)]
MOCK = [(1210, 0.3), (1262, 0.31), (1300, 0.3)]
c24 = [
    cam([800, 520, 900], [800, 600, -3000], ease='inOut'),
    frame([860, 560, 300], W(900, mk_y(0.33) - 40, 0.33), 820, 470),
    frame([840, 560, 360], W(880, mk_y(0.33) - 40, 0.33), 820, 470),
    frame([820, 560, 420], W(860, mk_y(0.33) - 40, 0.33), 820, 470),
    frame([800, 330, 500], W(800, mk_y(0.36), 0.36), 800, 380),
]
idris_at = lambda c: at(IDR[0], IDR[1] - 60, IDR[2], c)
scene('s24-call.json', 2,
  world={'fog': '#d8ccb0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.05, 'rays': 0, 'bloom': 0.6, 'haze': 0.06, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  beat_world={2: {'fog': '#d8b890'}, 3: {'fog': '#c8ccd0', 'light': 0.95}, 4: {'fog': '#d8ccb0', 'light': 1.05}},
  scene_cam=cam([800, 515, 1100], [800, 590, -3000]),
  layers=[
    sky(545, {0: [9.4, 10, 6500], 1: [10, 10.8, 7500], 2: [15.6, 16.2, 4500], 3: [11.6, 12.2, 4500], 4: [8.6, 10.6, 9000]}),
    {'type': 'range', 'count': 2, 'y': [500, 530], 'amp': [40, 60], 'depth': [0.04, 0.07], 'colors': ['#c8bca8', '#a8987c'], 'haze': [0.3, 0.6], 'sharp': 0.3, 'edge': False, 'seed': 33},
    {'type': 'town', 'depth': 0.11, 'grade': 'village', 'y': mk_y(0.11), 'x0': -260, 'x1': 1860, 's': 0.9, 'rows': 2, 'seed': 41,
     'at': {'3': {'grey': 0.25}, '4': {'grey': 0}}},
    {'type': 'ground', 'depth': 0.12, 'y': mk_y(0.12), 'amp': 3, 'seed': 7, 'color': '#d0b486', 'color2': '#9a7e52', 'at': {'3': {'color': '#dcdcd8', 'color2': '#a8aaa8'}, '4': {'color': '#d0b486', 'color2': '#9a7e52'}}},
    {'type': 'stalls', 'depth': 0.24, 's': 0.83, 'items': [{'x': 200, 'y': mk_y(0.24), 'w': 150, 'color': '#b8644a'}, {'x': 430, 'y': mk_y(0.24), 'w': 120, 'color': '#5e7a8a'},
                                                          {'x': 1170, 'y': mk_y(0.24), 'w': 130, 'color': '#8a6a3e'}, {'x': 1400, 'y': mk_y(0.24), 'w': 160, 'color': '#a8584a'}]},
    {'type': 'crowd', 'area': [-200, 1800, zof(0.22), zof(0.27)], 'y': [mk_y(0.27), mk_y(0.22)], 'count': 30, 'size': h17(0.245), 'flow': [1, 0], 'speed': 34, 'mill': 4, **person},
    {'type': 'crowd', 'area': [-200, 1800, zof(0.27), zof(0.3)], 'y': [mk_y(0.3), mk_y(0.27)], 'count': 24, 'size': h17(0.285), 'flow': [-1, 0], 'speed': 30, 'mill': 4, 'seed': 9, **person,
     'at': {'4': {'count': 12}}},
    # those who stop to listen, more each season
    *[{'type': 'light', 'depth': d, 'pos': [x, mk_y(d)], 'h': h17(d), 'color': '#ffe8c4', **day, 'show': [1 + min(3, i // 3), None]} for i, (x, d) in enumerate(LISTEN)],
    *ring(800, mk_y(0.33), 0.33, [1100, 300], 40, 220, show=[4, None], seed=31),
    # the mockers, dim and restless
    *[{'type': 'light', 'depth': d, 'pos': [x, mk_y(d)], 'h': h17(d), 'color': '#d8b48a', 'glow': 0.15, 'bright': 0.8, 'solid': 0.6, 'pose': 'reach', 'show': [1, 4]} for x, d in MOCK],
    {'type': 'light', 'depth': IDR[2], 'pos': [IDR[0], IDR[1]], 'h': h17(IDR[2]), **dayP, 'pose': 'raise', 'at': {'4': {'pose': 'stand'}}},
    dust(box=(-1400, 200, -8000, 3000, 950, 600), count=400, size=2.6, color='#fff0d8', opacity=0.28, wind=(4, -2, 0)),
    {'type': 'jeers', 'show': [1, 2], 'center': idris_at(c24[1]), 'from': at(1262, mk_y(0.31) - 60, 0.31, c24[1]), 'clear': [90, 120], 'count': 18, 'size': 30, 'period': 6},
    {'type': 'guidance', 'show': [1, 4], 'from': idris_at(c24[1]), 'area': [*at(520, mk_y(0.33) - 80, 0.33, c24[1]), *at(1100, mk_y(0.33), 0.33, c24[1])], 'count': 16, 'wave': True},
    {'type': 'particles', 'show': [2, 3], 'kind': 'leaves', 'count': 40},
    {'type': 'particles', 'show': [3, 4], 'kind': 'snow', 'count': 110},
    {'type': 'tint', 'show': [2, 3], 'color': '#ff9f50', 'amount': 0.14, 'blend': 'soft-light'},
    {'type': 'tint', 'show': [3, 4], 'color': '#9db3c6', 'amount': 0.2, 'blend': 'soft-light'},
  ],
  cams=c24)
print('24 ok', idris_at(c24[1]), idris_at(c24[4]))


# ── 25 · Raised to a high station ──────────────────────────────────────────────
# A summit above a sea of cloud at dawn; a gentle light comes down round Idris; he rises into it, and the
# summit stands empty in the morning.
TOP = (800, 522, 0.16)
c25 = [
    cam([800, 470, 900], [800, 470, -3000], ease='inOut'),
    frame([800, 460, 300], W(*TOP), 800, 470),
    frame([800, 455, 0], W(*TOP), 800, 480),
    {**frame([800, 440, 0], W(800, -300, 0.16), 800, 300), 'ease': 'inOut'},
    frame([800, 470, 900], W(*TOP), 800, 330),
]
scene('s25-raised.json', 2,
  world={'fog': '#c8b8c8', 'fogNear': 6000, 'fogFar': 46000, 'light': 1.0, 'rays': 0, 'bloom': 0.85, 'haze': 0, 'hazeY': 0.6, 'shake': 0.2, 'dof': 0},
  beat_world={4: {'rays': 0.22, 'bloom': 0.7}},
  scene_cam=cam([800, 470, 1000], [800, 470, -3000]),
  layers=[
    sky(640, {0: [5.1, 5.6, 7000], 1: [5.6, 6.0, 6500], 2: [6.0, 6.3, 6000], 3: [6.3, 6.8, 8000], 4: [7.2, 8.6, 9000]},
        sun={'rise': 6, 'set': 18, 'x0': 1250, 'x1': 300, 'peak': 220, 'size': 34}),
    {'type': 'clouds', 'depth': 0.08, 'y': 120, 'count': 8, 'color': '#f2e6dc', 'scale': 1.5, 'spanY': 160, 'seed': 3, 'at': {'3': {'part': True, 'partDelay': 2500}, '4': {'part': False}}},
    {'type': 'range', 'count': 3, 'y': [570, 640], 'amp': [70, 110], 'depth': [0.04, 0.08], 'colors': ['#9a94bc', '#4c4870'], 'haze': [0.2, 0.6], 'sharp': 0.6, 'edge': False, 'seed': 51},
    {'type': 'clouds', 'depth': 0.1, 'y': 650, 'count': 9, 'color': '#ece2ea', 'scale': 1.7, 'spanY': 50, 'seed': 8},
    {'type': 'peak', 'depth': TOP[2], 'x': 800, 'y': 520, 'w': 560, 'h': 420, 'color': '#3c3a56', 'lit': '#e0bca8', 'ppu': 1},
    {'type': 'beam', 'depth': TOP[2] + 0.002, 'x': 800, 'y': 524, 'w': 46, 'color': '#fff6dc', 'on': True, 'top': -1500, 'show': [1, 4], 'fade': 2400},
    {'type': 'light', 'depth': TOP[2] + 0.004, 'pos': [800, 522], 'h': h17(TOP[2]), 'color': '#fff4dc', 'glow': 0.7, 'bright': 1.4, 'show': [0, 4],
     'at': {'2': {'glow': 1.6, 'bright': 1.7, 'color': '#fffaf0'}, '3': {'path': [[800, 522], [800, -700]], 'dur': 6500, 'delay': 600}}},
    dust(box=(-420, -500, zof(0.16) - 300, 420, 1600, zof(0.16) + 300), count=90, size=4, color='#fff6dc', opacity=0.55, wind=(0, 40, 0), swirl=10, show=[1, 4]),
    {'type': 'clouds', 'depth': 0.3, 'y': 790, 'count': 7, 'color': '#f2ecf0', 'scale': 1.9, 'spanY': 40, 'seed': 12},
    dust(box=(-1400, -200, -9000, 3000, 950, 600), count=300, size=2.4, color='#fff4e8', opacity=0.25, wind=(3, -1, 0)),
  ],
  cams=c25)
print('25 ok', at(*TOP, c25[4]))


# ── The town of the five, later the town of the statues (scenes 26–30 and the flood) ───────────────────────
def sq_y(d):
    return round(560 + 420 * d)


FIVE = [430, 615, 800, 985, 1170]
SQUARE_W = {'fog': '#c8b8b0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.0, 'rays': 0, 'bloom': 0.65, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}


def square(grey=0.0, night=False, at_=None):
    town = {'type': 'town', 'depth': 0.11, 'grade': 'town', 'y': sq_y(0.11), 'x0': -320, 'x1': 1920, 's': 0.9, 'rows': 2, 'lit': 0.9 if night else 0.5, 'seed': 71, 'grey': grey}
    if night:
        town['night'] = True
    if at_:
        town['at'] = at_
    return [
        {'type': 'range', 'count': 3, 'y': [530, 590], 'amp': [60, 90], 'depth': [0.04, 0.07], 'colors': ['#9a8e96', '#5e5662'], 'haze': [0.2, 0.6], 'sharp': 0.35, 'edge': False, 'seed': 61},
        town,
        {'type': 'floor', 'depth': 0.12, 'y': sq_y(0.12), 'vp': [800, 560], 'color': '#b4a084', 'color2': '#6e5c48', 'lines': 24, 'gloss': 0.12, 'area': [-800, sq_y(0.12) - 10, 2400, 2600]},
    ]


def townsfolk(count=40, show=None, d0=0.16, d1=0.24, **kw):
    l = {'type': 'crowd', 'area': [-100, 1700, zof(d0), zof(d1)], 'y': [sq_y(d1), sq_y(d0)], 'count': count, 'size': h17((d0 + d1) / 2), 'mill': 22, 'speed': 0, **person, **kw}
    if show:
        l['show'] = show
    return l


# ── 26 · The five righteous men ────────────────────────────────────────────────
D5 = 0.3
good = dict(color='#fff4dc', glow=0.35, bright=1.1, solid=0.5)
Y5 = sq_y(D5)
c26 = [
    frame([620, 540, 800], W(615, Y5 - 40, D5), 760, 470, ease='inOut'),
    frame([1000, 545, 450], W(985, Y5 - 40, D5), 820, 470, ease='inOut'),
    frame([800, 540, 700], W(800, Y5 - 40, D5), 800, 470),
    frame([800, 540, 650], W(800, Y5 - 40, D5), 800, 470),
    frame([800, 520, 900], W(800, Y5 - 40, D5), 800, 450),
]
gone_at = lambda b: {str(b): {'pose': 'gone', 'path': None}}
scene('s26-righteous.json', 2,
  world=SQUARE_W,
  beat_world={2: {'fog': '#b8aaa8', 'light': 0.95}, 3: {'fog': '#a89c9c', 'light': 0.9}, 4: {'fog': '#9a9098', 'light': 0.85}},
  scene_cam=frame([520, 535, 950], W(615, Y5 - 40, D5), 760, 470),
  layers=[
    sky(560, {0: [15.6, 16.2, 7000], 1: [16.2, 16.8, 7000], 2: [16.8, 17.3, 6000], 3: [17.3, 17.8, 6000], 4: [17.8, 18.6, 8500]}),
    *square(at_={'2': {'grey': 0.2}, '3': {'grey': 0.4}}),
    townsfolk(40, show=[0, 4], at={'2': {'dim': 0.3}, '3': {'dim': 0.45}}),
    townsfolk(46, show=[4, None], d0=0.2, d1=0.27, mill=3, dim=0.3, glow=0.2, seed=11) | {'area': [380, 1220, zof(0.2), zof(0.27)]},
    # the five, each at a good deed: teaching, carrying a load for another, praying, sharing, tending a field
    {'type': 'light', 'depth': D5, 'pos': [FIVE[0], Y5], 'h': h17(D5), **good, 'pose': 'raise', 'at': gone_at(2)},
    *[{'type': 'light', 'depth': D5 + 0.012, 'pos': [x, sq_y(D5 + 0.012)], 'h': h17(D5 + 0.012), 'color': '#ffe2b8', **day, 'pose': 'kneel', 'show': [0, 4]} for x in (380, 482)],
    {'type': 'light', 'depth': D5, 'pos': [FIVE[1], Y5], 'h': h17(D5), **good, 'pose': 'walk', 'path': [[575, Y5], [655, Y5], [575, Y5], [655, Y5]], 'dur': 14000, 'at': gone_at(3)},
    {'type': 'light', 'depth': D5, 'pos': [FIVE[2], Y5], 'h': h17(D5), **good, 'pose': 'bow', 'at': gone_at(3)},
    {'type': 'light', 'depth': D5, 'pos': [FIVE[3], Y5], 'h': h17(D5), **good, 'pose': 'reach', 'at': gone_at(3)},
    {'type': 'light', 'depth': D5 + 0.006, 'pos': [FIVE[3] + 52, sq_y(D5 + 0.006)], 'h': h17(D5 + 0.006), 'color': '#e8c49a', 'glow': 0.15, 'bright': 0.85, 'solid': 0.6, 'pose': 'kneel', 'show': [0, 4]},
    {'type': 'ears', 'depth': D5 + 0.002, 'n': 16, 'x0': 1140, 'x1': 1280, 'y': Y5 + 2, 'h': 14, 'state': 'green'},
    {'type': 'light', 'depth': D5 + 0.004, 'pos': [FIVE[4], sq_y(D5 + 0.004)], 'h': h17(D5), **good, 'pose': 'kneel', 'at': gone_at(2)},
    smoke(300, sq_y(0.11) - 150, 0.11, n=40), smoke(1350, sq_y(0.11) - 160, 0.11, n=40),
    dust(box=(-1400, 200, -8000, 3000, 950, 600), count=320, size=2.4, color='#ffe8d0', opacity=0.25, wind=(3, -2, 0)),
    {'type': 'tint', 'color': '#808080', 'amount': 1, 'blend': 'saturation', 'opacity': 0, 'at': {'2': {'opacity': 0.18}, '3': {'opacity': 0.35}}},
  ],
  cams=c26)
print('26 ok', at(FIVE[0], Y5, D5, c26[0]), at(FIVE[4], Y5, D5, c26[1]))


# The hill outside the town where Nuh watches it, and from which he comes down: the town small and far below.
def hillside(night=False):
    town = {'type': 'town', 'depth': 0.07, 'grade': 'town', 'y': 604, 'x0': 470, 'x1': 1010, 's': 0.32, 'rows': 2, 'seed': 71, 'grey': 0.35 if not night else 0.2}
    if night:
        town.update(night=True, lit=0.9)
    return [
        {'type': 'range', 'count': 3, 'y': [470, 525], 'amp': [50, 80], 'depth': [0.03, 0.05], 'colors': ['#8a90a4', '#5e6478'], 'haze': [0.3, 0.6], 'sharp': 0.35, 'edge': False, 'seed': 77},
        {'type': 'ground', 'depth': 0.06, 'y': 596, 'amp': 6, 'seed': 21, 'color': '#8a8470', 'color2': '#4e4a3e'},
        town,
        {'type': 'statues', 'depth': 0.071, 'xs': [690, 706, 722, 738, 754], 'y': 610, 'h': 26, 'color': '#7d6448', 'grey': 0.3, 'lamps': 1, 'night': night},
        {'type': 'mist', 'depth': 0.075, 'y': 596, 'color': '#3a4258' if night else '#9aa2b0', 'bands': 5, 'opacity': 0.7},
        {'type': 'ground', 'depth': 0.2, 'y': 700, 'amp': 16, 'seed': 33, 'x0': -900, 'x1': 2500, 'color': '#8a8a5e', 'color2': '#3e3a26', 'grass': 44, 'grassColor': '#b0a070', 'wind': 1},
    ]


# ── 27 · Statues to remember them ──────────────────────────────────────────────
DS = 0.3
YS = sq_y(DS) + 4
c27 = [
    frame([800, 540, 800], W(800, YS - 90, DS), 800, 430, ease='inOut'),
    frame([800, 540, 760], W(800, YS - 90, DS), 800, 430),
    frame([800, 540, 720], W(800, YS - 90, DS), 800, 430),
    frame([800, 540, 650], W(800, YS - 90, DS), 800, 430),
    frame([800, 470, 900], W(800, YS - 90, DS), 800, 300),
    {**frame([900, 560, 900], W(1250, 690, 0.2), 960, 420), 'dx': 12000},
]
scene('s27-statues.json', 2,
  world=SQUARE_W,
  beat_world={2: {'fog': '#b0a8a8'}, 3: {'fog': '#a09898', 'light': 0.92}, 4: {'fog': '#1a1c2c', 'light': 0.8, 'bloom': 0.9}, 5: {'fog': '#141828', 'bloom': 0.9}},
  scene_cam=frame([800, 535, 1000], W(800, YS - 90, DS), 800, 430),
  art=['The statues are shown faceless; the carvers and the crowds appear only as figures of light, and Nuh only as one distant light seen from behind.'],
  layers=[
    {'type': 'set', 'show': [0, 5], 'layers': [
        sky(560, {0: [9, 10, 6500], 1: [10, 16, 5000, 2], 2: [9, 15, 4500, 3], 3: [14, 17.6, 5500, 2], 4: [20.6, 21.4, 9000]}, moon=MOON),
        *square(grey=0.4, at_={'3': {'grey': 0.5}, '4': {'night': True, 'lit': 0.9, 'grey': 0.2}}),
        townsfolk(30, show=[0, 2], seed=13),
        townsfolk(50, show=[2, None], d0=0.17, d1=0.26, mill=10, seed=17, at={'3': {'mill': 2, 'dim': 0.45}, '4': {'dim': 0.6, 'glow': 0.4}}),
        {'type': 'statues', 'depth': DS, 'xs': FIVE, 'y': YS, 'h': 190, 'carved': False, 'ppu': 1,
         'at': {'1': {'carved': True}, '2': {'lamps': 1, 'shadow': 0.3}, '3': {'offerings': True, 'lamps': 2, 'shadow': 0.55}, '4': {'night': True, 'lamps': 3, 'shadow': 0.7}}},
        *[{'type': 'light', 'depth': DS + 0.004, 'pos': [x - 58, sq_y(DS + 0.004)], 'h': h17(DS), 'color': '#ffe8c4', **day, 'pose': 'reach', 'show': [0, 2]} for x in FIVE],
        # in time they come to bow before the statues themselves
        *[{'type': 'light', 'depth': 0.36, 'pos': [x, sq_y(0.36)], 'h': h17(0.36), 'color': '#e8c49a', 'glow': 0.15, 'bright': 0.85, 'solid': 0.6, 'pose': 'bow', 'show': [3, None],
           'at': {'4': {'glow': 0.4, 'bright': 1.0}}} for x in (520, 610, 700, 800, 900, 990, 1080)],
        dust(box=(-1400, 200, -8000, 3000, 950, 600), count=320, size=2.4, color='#ffe8d0', opacity=0.25, wind=(3, -2, 0)),
    ]},
    {'type': 'set', 'show': [5, None], 'dx': 12000, 'layers': [
        sky(560, {5: [21.4, 22, 7500]}, moon=MOON),
        *hillside(night=True),
        {'type': 'light', 'depth': 0.2, 'pos': [1250, 690], 'h': h17(0.2), **nightP},
        dust(box=(-1400, 0, -9000, 3000, 950, 0), count=200, size=2.2, color='#d8e0ff', opacity=0.2, wind=(4, -1, 0)),
    ]},
    {'type': 'tint', 'color': '#808080', 'amount': 1, 'blend': 'saturation', 'opacity': 0.2, 'at': {'2': {'opacity': 0.3}, '3': {'opacity': 0.45}, '4': {'opacity': 0.2}}},
  ],
  cams=c27)
print('27 ok', at(800, YS - 90, DS, c27[4]), at(1250, 690, 0.2, c27[5]))
print('chapter 2 written')

# ═══ Chapter 3 ════════════════════════════════════════════════════════════════════════════════════════

# ── 28 · Nuh begins the call ───────────────────────────────────────────────────
WALK28 = [(935, 850, 0.3), (898, 790, 0.26), (855, 742, 0.23), (812, 708, 0.205), (795, 704, 0.19)]
NUH_SQ = (800, sq_y(0.4), 0.4)
c28 = [
    cam([800, 470, 1000], [800, 520, -3000], ease='inOut'),
    cam([810, 475, 900], [800, 530, -3000], ease='inOut'),
    {**frame([800, 520, 750], W(800, NUH_SQ[1] - 60, 0.4), 800, 520), 'cut': True, 'dx': 12000},
    {**frame([800, 250, 560], W(800, NUH_SQ[1] - 60, 0.4), 800, 420), 'dx': 12000},
]


def worshippers(show=None, glow=0.15):
    out = [{'type': 'light', 'depth': 0.34, 'pos': [x, sq_y(0.34)], 'h': h17(0.34), 'color': '#e8c49a', 'glow': glow, 'bright': 0.85, 'solid': 0.6, 'pose': 'bow'}
           for x in (470, 560, 650, 950, 1040, 1130)]
    if show:
        for l in out:
            l['show'] = show
    return out


def statues_sq(**kw):
    return {'type': 'statues', 'depth': DS, 'xs': FIVE, 'y': YS, 'h': 190, 'color': '#7d6448', 'grey': 0.2, 'lamps': 1, 'offerings': True, 'shadow': 0.4, 'ppu': 1, **kw}


scene('s28-nuh-call.json', 3,
  world={'fog': '#a8aab4', 'fogNear': 9000, 'fogFar': 60000, 'light': 0.95, 'rays': 0, 'bloom': 0.7, 'haze': 0.04, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  scene_cam=cam([800, 465, 1100], [800, 515, -3000]),
  layers=[
    {'type': 'set', 'show': [0, 2], 'layers': [
        sky(560, {0: [5.6, 6.3, 6000], 1: [6.3, 7.4, 9000]}, sun={'rise': 6, 'set': 18, 'x0': 1240, 'x1': 300, 'peak': 260, 'size': 30}),
        *hillside(),
        {'type': 'hillpath', 'depth': 0.201, 'points': [[945, 900], [900, 790], [855, 742], [810, 706]], 'w0': 46, 'w1': 8},
        smoke(560, 560, 0.07, n=50, rise=30), smoke(820, 556, 0.07, n=50, rise=30), smoke(980, 562, 0.07, n=40, rise=30),
        {'type': 'light', 'depth': 0.3, 'pos': list(WALK28[0][:2]), 'h': h17(0.3), **dayP, 'glow': 0.6, 'bright': 1.3,
         'at': {'1': {'pose': 'walk', 'path': [[x, y, zof(d)] for x, y, d in WALK28], 'dur': 8500, 'delay': 600}}},
        dust(box=(-1400, 0, -9000, 3000, 950, 600), count=260, size=2.4, color='#f0e8e0', opacity=0.22, wind=(4, -1, 0)),
    ]},
    {'type': 'set', 'show': [2, None], 'dx': 12000, 'layers': [
        sky(560, {2: [8.4, 8.8, 6000], 3: [8.8, 9.4, 9500]}, sun={'rise': 6, 'set': 18, 'x0': 1240, 'x1': 300, 'peak': 260, 'size': 30}),
        *square(grey=0.55),
        townsfolk(34, mill=8, dim=0.45),
        statues_sq(),
        *worshippers(),
        smoke(FIVE[1] + 30, YS - 20, DS, n=40, rise=26), smoke(FIVE[3] - 30, YS - 20, DS, n=40, rise=26),
        {'type': 'light', 'depth': NUH_SQ[2], 'pos': list(NUH_SQ[:2]), 'h': h17(NUH_SQ[2]), **dayP, 'glow': 0.55, 'bright': 1.3},
        dust(box=(-1400, 200, -8000, 3000, 950, 600), count=300, size=2.4, color='#e8e0d8', opacity=0.25, wind=(3, -2, 0)),
    ]},
    {'type': 'tint', 'color': '#808080', 'amount': 1, 'blend': 'saturation', 'opacity': 0.15},
  ],
  cams=c28)
print('28 ok', at(*NUH_SQ, c28[3]), at(FIVE[2], YS - 190, DS, c28[3]))


# ── 29 · Night and day, openly and in secret ───────────────────────────────────
# Cuts between the square by day, where he calls openly, and doorways by night, where he speaks to each
# household and the door is closed on him, faster each time; then those who stopped their ears and covered
# themselves (71:7); then the empty square at dusk.
DAYS = [[0, 1], [3, 4], [5, 6], [7, None]]
NIGHTS = [[1, 2], [4, 5], [6, 7]]
NUH29 = (800, sq_y(0.42), 0.42)
DOOR = (900, 740, 0.3)            # the doorway, and its arch (124 × 214 at s = 1)
ds = 1.1
dw, dh = 124 * ds, 214 * ds
dc = lambda c: {**c, 'dx': 9000, 'cut': True}
day_cam = {**frame([800, 520, 600], W(800, NUH29[1] - 60, 0.42), 800, 500), 'cut': True}
night_cam = dc(frame([780, 640, 300], W(820, 640, 0.3), 800, 450))
c29 = [day_cam, night_cam, {**frame([760, 470, 900], W(590, 640, 0.3), 560, 380), 'dx': 18000, 'cut': True},
       day_cam, night_cam, day_cam, night_cam, {**frame([800, 500, 800], W(800, NUH29[1] - 60, 0.42), 800, 470), 'cut': True}]
scene('s29-openly-secretly.json', 3,
  world={'fog': '#c8b8a0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.0, 'rays': 0, 'bloom': 0.7, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  beat_world={1: {'fog': '#0e1222', 'bloom': 0.9}, 2: {'fog': '#1e1a1c'}, 3: {'fog': '#c8b8a0', 'bloom': 0.7}, 4: {'fog': '#0e1222', 'bloom': 0.9},
              5: {'fog': '#c8b8a0', 'bloom': 0.7}, 6: {'fog': '#0e1222', 'bloom': 0.9}, 7: {'fog': '#6a5a6a', 'bloom': 0.75}},
  scene_cam=day_cam,
  layers=[
    {'type': 'set', 'show': DAYS, 'layers': [
        sky(560, {0: [10, 10.4, 4500], 3: [12, 12.2, 2800], 5: [14, 14.2, 2000], 7: [17.4, 18.4, 8500]}),
        *square(grey=0.15, at_={'7': {'grey': 0.35}}),
        statues_sq(grey=0.1, shadow=0.2),
        {'type': 'stalls', 'depth': 0.26, 's': 0.9, 'items': [{'x': 250, 'y': sq_y(0.26), 'w': 150, 'color': '#b8644a'}, {'x': 460, 'y': sq_y(0.26), 'w': 120, 'color': '#5e7a8a'},
                                                              {'x': 1150, 'y': sq_y(0.26), 'w': 130, 'color': '#8a6a3e'}, {'x': 1370, 'y': sq_y(0.26), 'w': 150, 'color': '#a8584a'}]},
        {**townsfolk(30, d0=0.28, d1=0.34, mill=4, seed=19), 'flow': [1, 0], 'speed': 36, 'show': [[0, 1], [3, 4], [5, 6]]},
        {**townsfolk(24, d0=0.34, d1=0.38, mill=4, seed=23), 'flow': [-1, 0], 'speed': 30, 'show': [[0, 1], [3, 4], [5, 6]]},
        *[{'type': 'light', 'depth': d, 'pos': [x, sq_y(d)], 'h': h17(d), 'color': '#d8b48a', 'glow': 0.15, 'bright': 0.8, 'solid': 0.6, 'pose': 'reach', 'show': [[0, 1], [3, 4], [5, 6]]}
          for x, d in ((1120, 0.36), (1170, 0.37), (1215, 0.36))],
        {'type': 'light', 'depth': NUH29[2], 'pos': list(NUH29[:2]), 'h': h17(NUH29[2]), **dayP, 'glow': 0.5, 'bright': 1.25, 'pose': 'raise', 'at': {'7': {'pose': 'stand'}}},
        dust(box=(-1400, 200, -8000, 3000, 950, 600), count=300, size=2.4, color='#fff0d8', opacity=0.25, wind=(4, -2, 0)),
    ]},
    {'type': 'set', 'show': NIGHTS, 'dx': 9000, 'layers': [
        sky(560, {1: [22, 22.3, 5000], 4: [23, 23.2, 2400], 6: [0.5, 0.6, 1700]}, moon=MOON),
        {'type': 'doorway', 'depth': DOOR[2], 'x': DOOR[0], 'y': DOOR[1], 's': ds, 'household': 4, 'at': {'4': {'household': 3, 'stone': '#2a2a3a'}, '6': {'household': 5, 'stone': '#2e2838'}}},
        # the door swinging shut on him: the closed door painted over the open one, from its hinge across
        {'type': 'doorway', 'depth': DOOR[2] + 0.001, 'x': DOOR[0], 'y': DOOR[1], 's': ds, 'shut': True, 'household': 0,
         'area': [DOOR[0] - dw / 2 - 8, DOOR[1] - dh - 30, DOOR[0] + dw / 2 + 8, DOOR[1] + 4], 'reveal': {'dir': 'left', 'dur': 2400, 'delay': 2600},
         'at': {'4': {'reveal': {'dir': 'left', 'dur': 1400, 'delay': 800}}, '6': {'reveal': {'dir': 'left', 'dur': 900, 'delay': 400}}}},
        {'type': 'light', 'kind': 'flame', 'depth': DOOR[2] + 0.002, 'pos': [round(DOOR[0] - dw * 0.95 + 10 * ds), round(DOOR[1] - dh * 0.72)], 'h': 16, 'color': '#ffb050', 'glow': 1.1},
        {'type': 'light', 'depth': 0.32, 'pos': [700, round(DOOR[1] + 255 * 0.02)], 'h': h17(0.32), **nightP},
    ]},
    {'type': 'set', 'show': [2, 3], 'dx': 18000, 'layers': [
        sky(560, {2: [21, 21.4, 9500]}, moon=MOON),
        {'type': 'wall', 'depth': 0.28, 'y': 720, 'h': 820, 'material': 'mudbrick', 'light': 0.55, 'niches': [{'x': 430, 'w': 50, 'h': 70, 'lift': 300}], 'openings': [{'x': 1240, 'w': 150, 'h': 280, 'kind': 'door', 'view': {'sky': 'night', 'land': 'city'}}]},
        {'type': 'floor', 'depth': 0.281, 'y': 720, 'vp': [800, 420], 'color': '#3a2c24', 'color2': '#120c0a', 'lines': 8, 'gloss': 0.1, 'area': [-800, 710, 2400, 2600]},
        {'type': 'light', 'kind': 'flame', 'depth': 0.282, 'pos': [430, 450], 'h': 16, 'color': '#ffb050', 'glow': 1.0},
        {'type': 'refusal', 'depth': 0.3, 'xs': [420, 590, 760], 'y': 740, 'h': 220, 'from': 1240},
        {'type': 'light', 'depth': 0.29, 'pos': [1240, 724], 'h': h17(0.29), **nightP},
    ]},
    {'type': 'guidance', 'show': DAYS[:3], 'from': at(NUH29[0], NUH29[1] - 80, NUH29[2], day_cam), 'area': [*at(300, sq_y(0.3) - 70, 0.3, day_cam), *at(1300, sq_y(0.36), 0.36, day_cam)], 'count': 14, 'wave': True},
    {'type': 'jeers', 'show': DAYS[:3], 'center': at(NUH29[0], NUH29[1] - 60, NUH29[2], day_cam), 'from': at(1170, sq_y(0.37) - 60, 0.37, day_cam), 'clear': [90, 120], 'count': 16, 'size': 30, 'period': 6},
    {'type': 'tint', 'show': DAYS[:3], 'color': '#ffb050', 'amount': 0.14, 'blend': 'soft-light'},
    {'type': 'tint', 'show': [7, None], 'color': '#5a4a7a', 'amount': 0.16, 'blend': 'soft-light'},
  ],
  cams=c29)
print('29 ok', at(*NUH29, day_cam), at(700, 740, 0.32, night_cam), at(590, 600, 0.3, c29[2]))


# ── 30 · Nine hundred and fifty years ─────────────────────────────────────────
# The square through the centuries: spring, a long summer, the town fallen to ruin, a new town and new statues,
# winter; the crowds of each generation come and go; Nuh stays, and one by one a few come to stand by him.
NUH30 = (1330, sq_y(0.38), 0.38)
c30 = [frame([900, 520, 700], W(960, sq_y(0.34) - 60, 0.34), 800, 470)] + [None] * 5 + [frame([880, 470, 650], W(960, sq_y(0.34) - 60, 0.34), 800, 360)]
FOLLOW = [(1270, 0.37), (1395, 0.372), (1214, 0.368), (1452, 0.366), (1158, 0.37), (1508, 0.362), (1100, 0.36)]
STEPS = [1, 2, 3, 4, 4, 5]          # beat each follower comes
scene('s30-centuries.json', 3,
  world=SQUARE_W,
  beat_world={1: {'fog': '#d8dcd0'}, 2: {'fog': '#e0d0b0'}, 3: {'fog': '#d8b890'}, 4: {'fog': '#d0d4d8'}, 5: {'fog': '#c0b8b0'}, 6: {'fog': '#b8b0a8'}},
  scene_cam=frame([900, 525, 800], W(960, sq_y(0.34) - 60, 0.34), 800, 470),
  layers=[
    sky(560, {0: [9, 15, 4000, 2], 1: [8, 16, 3000, 3], 2: [9, 17, 3000, 3], 3: [8, 16, 3000, 3], 4: [9, 15, 3200, 3], 5: [9, 15, 3200, 2], 6: [9.5, 11, 9000]}),
    *square(grey=0.4, at_={'1': {'grey': 0.1}, '2': {'ruin': 0.75, 'grey': 0.2}, '3': {'ruin': 0, 'seed': 72, 's': 0.95, 'grey': 0.15}, '5': {'grey': 0.3}, '6': {'grey': 0.4}}),
    {'type': 'garden', 'show': [[1, 3], [4, None]], 'depth': 0.2, 'plane': 'back', 'count': 8, 'fruit': False, 'y': sq_y(0.2), 'x0': 0, 'x1': 1600, 'avoid': [380, 1220], 'seed': 15,
     'at': {'4': {'seed': 16}}},
    {'type': 'statues', 'depth': DS, 'xs': FIVE, 'y': YS, 'h': 190, 'color': '#8a7a64', 'grey': 0.2, 'lamps': 1, 'ppu': 1,
     'at': {'2': {'weather': 1}, '3': {'weather': 0, 'carved': False, 'h': 220, 'color': '#7d6448'}, '4': {'carved': True}, '5': {'lamps': 2}}},
    *[townsfolk(44, d0=0.2, d1=0.33, mill=26, seed=40 + b, show=[b, b + 1]) for b in range(6)],
    townsfolk(24, d0=0.2, d1=0.33, mill=30, seed=47, show=[6, None]),
    {'type': 'light', 'depth': NUH30[2], 'pos': list(NUH30[:2]), 'h': h17(NUH30[2]), **dayP, 'glow': 0.3, 'bright': 1.15},
    *[{'type': 'light', 'depth': d, 'pos': [x, sq_y(d)], 'h': h17(d), 'color': '#ffeed4', 'glow': 0.12, 'bright': 0.95, 'solid': 0.55, 'show': [b, None]} for (x, d), b in zip(FOLLOW, STEPS + [6])],
    dust(box=(-1400, 200, -8000, 3000, 950, 600), count=300, size=2.4, color='#fff0d8', opacity=0.25, wind=(4, -2, 0)),
    {'type': 'particles', 'show': [1, 2], 'kind': 'petals', 'count': 50},
    {'type': 'particles', 'show': [2, 3], 'kind': 'dust', 'count': 60},
    {'type': 'particles', 'show': [3, 4], 'kind': 'leaves', 'count': 50},
    {'type': 'particles', 'show': [4, 5], 'kind': 'snow', 'count': 120},
    {'type': 'tint', 'color': '#808080', 'amount': 1, 'blend': 'saturation', 'opacity': 0.3, 'at': {'1': {'opacity': 0}, '5': {'opacity': 0.3}}},
    {'type': 'tint', 'show': [3, 4], 'color': '#ff9f50', 'amount': 0.14, 'blend': 'soft-light'},
    {'type': 'tint', 'show': [4, 5], 'color': '#9db3c6', 'amount': 0.2, 'blend': 'soft-light'},
  ],
  cams=c30)
print('30 ok', at(*NUH30, c30[6]))


# ── 31 · The chiefs mock ───────────────────────────────────────────────────────
# From behind the chiefs on their terrace, the street far below where Nuh walks with the few who follow; then
# from the street, looking up at the terrace, as Nuh answers.
c31 = [
    cam([800, 450, 1000], [800, 450, -3000]),
    cam([800, 445, 900], [800, 440, -3000]),
    {**frame([760, 520, 700], W(600, 708, 0.5), 640, 610), 'dx': 9000, 'cut': True},
    {**frame([760, 520, 660], W(600, 708, 0.5), 640, 600), 'dx': 9000},
]
FOL31 = [(520, 0.5), (470, 0.49), (425, 0.495), (380, 0.485), (340, 0.49), (300, 0.48)]
scene('s31-chiefs.json', 3,
  world={'fog': '#d8c8a8', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.0, 'rays': 0, 'bloom': 0.65, 'haze': 0.04, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
  scene_cam=cam([800, 450, 1050], [800, 450, -3000]),
  layers=[
    {'type': 'set', 'show': [0, 2], 'layers': [
        sky(120, {0: [10, 10.5, 6500], 1: [10.5, 11.2, 9000]}),
        {'type': 'ground', 'depth': 0.16, 'y': 176, 'amp': 2, 'seed': 74, 'x0': -900, 'x1': 2500, 'color': '#b89a6c', 'color2': '#8a6e4a'},
        {'type': 'town', 'depth': 0.161, 'grade': 'town', 'y': 176, 'x0': -300, 'x1': 1900, 's': 0.45, 'seed': 74, 'grey': 0.15},
        townsfolk(30, d0=0.17, d1=0.19, mill=14, seed=31) | {'y': [380, 300]},
        {'type': 'light', 'depth': 0.18, 'pos': [800, 330], 'h': 30, **dayP, 'glow': 0.6, 'bright': 1.3},
        *[{'type': 'light', 'depth': 0.18, 'pos': [800 + dx, 334], 'h': 24, 'color': '#ffeed4', **day} for dx in (-22, -42, -62, 22, 42, 62)],
        {'type': 'terrace', 'depth': 0.5, 'view': 'behind', 'y': 430, 'chiefs': [[380, 568, 1.1], [600, 592, 0.95], [1000, 592, 0.95], [1220, 568, 1.1]], 'ppu': 0.9},
        dust(box=(-1400, -400, -6000, 3000, 950, 600), count=200, size=2.4, color='#fff0d8', opacity=0.22, wind=(3, -1, 0)),
    ]},
    {'type': 'set', 'show': [2, None], 'dx': 9000, 'layers': [
        sky(650, {2: [11.2, 11.6, 5500], 3: [11.6, 12.4, 9500]}),
        {'type': 'terrace', 'depth': 0.2, 'view': 'below', 'y': 340, 'marble': '#9a948a', 'chiefs': [[600, 312, 0.55], [820, 302, 0.5], [1040, 308, 0.52], [1250, 314, 0.55]], 'ppu': 0.9},
        {'type': 'ground', 'depth': 0.48, 'y': 700, 'amp': 2, 'seed': 4, 'x0': -900, 'x1': 2500, 'color': '#b89a6c', 'color2': '#7a5e3c'},
        *[{'type': 'light', 'depth': d, 'pos': [x, round(700 + (d - 0.48) * 400)], 'h': h17(d), 'color': '#ffeed4', 'glow': 0.12, 'bright': 0.9, 'solid': 0.55} for x, d in FOL31],
        {'type': 'light', 'depth': 0.5, 'pos': [600, 708], 'h': h17(0.5), **dayP, 'glow': 0.2, 'bright': 1.0},
        dust(box=(-1400, -400, -6000, 3000, 950, 600), count=200, size=2.4, color='#fff0d8', opacity=0.22, wind=(3, -1, 0)),
    ]},
    {'type': 'calligraphy', 'show': [1, 2], 'ref': '11:27', 'ar': [6, 10], 'x': 800, 'y': 250, 'size': 60, 'color': '#d89040', 'w': 760, 'dur': 3200, 'drip': True},
    {'type': 'calligraphy', 'show': [3, None], 'ref': '11:28', 'ar': [1, 8], 'x': 900, 'y': 160, 'size': 50, 'color': '#fffaf0', 'w': 700, 'dur': 3600},
  ],
  cams=c31)
print('31 ok', at(600, 708, 0.5, c31[3]))


# ── 32 · The command to build ──────────────────────────────────────────────────
# Night on the hill above the sleeping town; Nuh kneels; a soft light comes down over him and the words fill the sky.
KN = (600, 702, 0.2)
c32 = [
    frame([780, 460, 1000], W(*KN), 600, 600),
    frame([760, 470, 700], W(*KN), 620, 560),
    frame([760, 470, 650], W(*KN), 600, 520),
    frame([760, 470, 620], W(*KN), 600, 520),
    frame([780, 460, 800], W(*KN), 600, 560),
]
scene('s32-command.json', 3,
  world={'fog': '#0c1020', 'fogNear': 6000, 'fogFar': 46000, 'light': 0.85, 'rays': 0, 'bloom': 0.95, 'haze': 0, 'hazeY': 0.6, 'shake': 0.2, 'dof': 0},
  scene_cam=frame([800, 455, 1100], W(*KN), 600, 600),
  art=["No figure appears in the revelation: only light and the words. Nuh is a small figure of light seen from behind; the outline of the ship is a symbol of the command, not a drawing of the ark's true shape."],
  layers=[
    sky(560, {0: [23, 23.4, 6500], 1: [23.4, 23.8, 6500], 2: [23.8, 0.4, 9500], 3: [0.4, 1, 9500], 4: [1, 1.3, 5000]}, moon={**MOON, 'size': 20}),
    *hillside(night=True),
    {'type': 'beam', 'depth': KN[2] + 0.002, 'x': KN[0], 'y': KN[1], 'w': 120, 'color': '#fff2d0', 'on': True, 'top': -1400, 'show': [1, None], 'fade': 2600},
    dust(box=(-1300, -1200, zof(0.2) - 300, -700, 1800, zof(0.2) + 300), count=80, size=4, color='#fff2d0', opacity=0.5, wind=(0, 30, 0), swirl=8, show=[1, None]),
    {'type': 'light', 'depth': KN[2] + 0.004, 'pos': [KN[0], KN[1]], 'h': h17(KN[2]), 'pose': 'kneel', **nightP, 'at': {'1': {'glow': 1.2, 'bright': 1.6}}},
    {'type': 'ark', 'show': [3, 4], 'depth': 0.09, 'x': 930, 'y': 625, 's': 0.5, 'sketch': True, 'reveal': {'dir': 'right', 'dur': 5200}, 'fade': 2600},
    {'type': 'calligraphy', 'show': [2, 3], 'ref': '11:36', 'ar': [4, 11], 'x': 960, 'y': 230, 'size': 62, 'color': '#ffe9b8', 'w': 980, 'dur': 4200, 'fade': 1600},
    {'type': 'calligraphy', 'show': [3, None], 'ref': '11:37', 'ar': [0, 3], 'x': 960, 'y': 210, 'size': 80, 'color': '#ffe9b8', 'w': 900, 'dur': 3600},
    dust(box=(-1400, 0, -9000, 3000, 950, 0), count=200, size=2.2, color='#d8e0ff', opacity=0.2, wind=(4, -1, 0)),
  ],
  cams=c32)
print('32 ok', at(*KN, c32[2]))


# ── The plain where the ark is built, far from any sea (scenes 33–35) ─────────────────────────────────────────
ARK = (820, 694, 0.2)


def pl_y(d):
    return round(610 + 420 * d)


def plain(dark=0.0):
    sat = 1 - dark * 0.5
    return [
        {'type': 'range', 'count': 2, 'y': [586, 620], 'amp': [40, 60], 'depth': [0.04, 0.07], 'colors': ['#c8a880', '#a88860'], 'haze': [0.3, 0.6], 'sharp': 0.3, 'edge': False, 'seed': 91, 'sat': sat},
        {'type': 'town', 'depth': 0.075, 'grade': 'town', 'y': 640, 'x0': -260, 'x1': 300, 's': 0.6, 'rows': 2, 'seed': 71, 'grey': 0.4, 'sat': sat},
        {'type': 'ground', 'depth': 0.12, 'y': pl_y(0.12) - 10, 'amp': 6, 'seed': 17, 'x0': -900, 'x1': 2500, 'color': '#c8a46e', 'color2': '#8a6a40', 'rocks': 10, 'grass': 14, 'grassColor': '#a89060', 'sat': sat},
        {'type': 'hillpath', 'depth': 0.26, 'points': [[-500, 742], [300, 732], [1100, 744], [2100, 730]], 'w0': 30, 'w1': 28, 'color': '#d8bc8a', 'edge': '#a88a5a', 'sat': sat},
    ]


# ── 33 · Building the ark ──────────────────────────────────────────────────────
# Close on the work (flat and live: the adze, the plane, the pegs), then the plain through the seasons as the
# great ship rises, the believers at work round it, mockers passing on the road.
WORK = [(560, 0.205, 'reach'), (1010, 0.205, 'reach'), (1140, 0.21, 'walk')]
NUH33 = (690, pl_y(0.21), 0.21)
c33 = [
    frame([800, 520, 900], W(ARK[0], ARK[1] - 120, ARK[2]), 800, 430),
    frame([800, 520, 600], W(ARK[0], ARK[1] - 120, ARK[2]), 800, 430, ease='inOut'),
    frame([780, 520, 700], W(ARK[0], ARK[1] - 120, ARK[2]), 800, 430),
    frame([760, 520, 800], W(ARK[0], ARK[1] - 120, ARK[2]), 790, 430),
    frame([800, 600, 900], W(ARK[0], ARK[1], ARK[2]), 800, 450),
]
scene('s33-building.json', 3,
  world={'fog': '#e0d0b0', 'fogNear': 6000, 'fogFar': 42000, 'light': 1.05, 'rays': 0, 'bloom': 0.6, 'haze': 0.2, 'hazeY': 0.62, 'shake': 0.3, 'dof': 0},
  beat_world={2: {'fog': '#e0c0a0'}, 3: {'fog': '#d0d4d8', 'haze': 0.05}, 4: {'fog': '#e0d0b0', 'haze': 0.15}},
  scene_cam=frame([800, 515, 1000], W(ARK[0], ARK[1] - 120, ARK[2]), 800, 430),
  layers=[
    sky(600, {0: [9, 10, 6000], 1: [8, 16, 7000, 2], 2: [9, 16.4, 4500, 2], 3: [10, 15, 4500, 2], 4: [15.6, 16.8, 9500]}),
    *plain(),
    {'type': 'ark', 'show': [1, None], 'depth': ARK[2], 'x': ARK[0], 'y': ARK[1], 's': 0.9, 'built': 1, 'ppu': 1, 'at': {'2': {'built': 2}, '3': {'built': 3}}},
    *[{'type': 'light', 'depth': d, 'pos': [x, pl_y(d)], 'h': h17(d), 'color': '#ffe8c4', **day, 'pose': pose, 'show': [1, 4],
       **({'path': [[x, pl_y(d)], [x + 120, pl_y(d)], [x, pl_y(d)], [x + 120, pl_y(d)]], 'dur': 16000} if pose == 'walk' else {})} for x, d, pose in WORK],
    # haulers bringing timber from the left
    *[{'type': 'light', 'depth': 0.22, 'h': h17(0.22), 'color': '#ffe8c4', **day, 'pose': 'walk', 'show': [1, 4], 'delay': k * 900,
       'path': [[-120 + k * 40, pl_y(0.22)], [380, pl_y(0.22)], [-120 + k * 40, pl_y(0.22)], [380, pl_y(0.22)]], 'dur': 18000} for k in range(2)],
    {'type': 'light', 'depth': NUH33[2], 'pos': list(NUH33[:2]), 'h': h17(NUH33[2]), **dayP, 'glow': 0.5, 'bright': 1.25, 'pose': 'reach', 'show': [1, 4]},
    {'type': 'light', 'depth': 0.21, 'pos': [1300, pl_y(0.21)], 'h': h17(0.21), **dayP, 'glow': 0.5, 'bright': 1.25, 'show': [4, None]},
    *[{'type': 'light', 'depth': 0.212, 'pos': [1300 + dx, pl_y(0.212)], 'h': h17(0.212), 'color': '#ffeed4', **day, 'show': [4, None]} for dx in (-46, -88, -130, 46, 88, 130)],
    # mockers on the road
    *[{'type': 'light', 'depth': d, 'pos': [x, pl_y(d)], 'h': h17(d), 'color': '#d8b48a', 'glow': 0.15, 'bright': 0.8, 'solid': 0.6, 'pose': p, 'show': [3, None]}
      for x, d, p in ((300, 0.27, 'reach'), (350, 0.272, 'stand'), (398, 0.27, 'reach'))],
    dust(box=(-1400, 200, -8000, 3000, 950, 600), count=500, size=2.6, color='#ffe8c8', opacity=0.32, wind=(6, -2, 0)),
    {'type': 'woodwork', 'flat': True, 'depth': 0, 'show': [0, 1], 'fade': 2400},
    {'type': 'jeers', 'show': [3, None], 'center': at(ARK[0], ARK[1] - 160, ARK[2], c33[3]), 'from': at(350, pl_y(0.27) - 60, 0.27, c33[3]), 'clear': [220, 150], 'count': 20, 'size': 30, 'period': 6},
    {'type': 'particles', 'show': [2, 3], 'kind': 'leaves', 'count': 40},
    {'type': 'particles', 'show': [3, 4], 'kind': 'snow', 'count': 110},
    {'type': 'tint', 'show': [2, 3], 'color': '#ff9f50', 'amount': 0.14, 'blend': 'soft-light'},
    {'type': 'tint', 'show': [3, 4], 'color': '#9db3c6', 'amount': 0.2, 'blend': 'soft-light'},
  ],
  cams=c33)
print('33 ok', at(ARK[0], ARK[1], ARK[2], c33[4]), at(1300, pl_y(0.21), 0.21, c33[4]))


# ── 34 · The sign and the boarding ─────────────────────────────────────────────
# The oven welling up (flat and live, close); storm clouds rolling over the plain; the animals coming in pairs
# from both sides; the believers going up the ramp as the lightning breaks.
RAMP = (700, pl_y(0.205), 0.205)     # the foot of the ramp
ANIMALS_L = [{'kind': 'lion', 'path': [[-40, 0]]}, {'kind': 'camel', 'path': [[-190, -2]]}, {'kind': 'deer', 'path': [[-330, 0]]}, {'kind': 'horse', 'path': [[-470, -1]]}]
ANIMALS_R = [{'kind': 'cow', 'path': [[40, 0]], 'face': -1}, {'kind': 'deer', 'path': [[170, -1]], 'face': -1}, {'kind': 'camel', 'path': [[320, 0]], 'face': -1}]
c34 = [
    frame([820, 520, 900], W(ARK[0], ARK[1] - 120, ARK[2]), 800, 430),
    frame([820, 520, 900], W(ARK[0], ARK[1] - 120, ARK[2]), 800, 420),
    frame([780, 540, 600], W(RAMP[0], RAMP[1] - 60, RAMP[2]), 760, 470, ease='inOut'),
    frame([760, 600, 700], W(RAMP[0] + 60, RAMP[1] - 140, RAMP[2]), 760, 330),
]


def herd(items, x, d, dx, delay, dur=8500, size=0.75):
    pairs = [{**p, 'path': [[x + p['path'][0][0], pl_y(d) + p['path'][0][1]]]} for p in items]
    return {'type': 'animals', 'show': [2, None], 'depth': d, 'size': size, 'fade': 'none', 'pairs': pairs,
            'area': [x - 700, pl_y(d) - 160, x + 700, pl_y(d) + 30], 'move': {'path': [[dx, -6, 0]], 'dur': dur, 'delay': delay},
            'at': {'3': {'move': {'path': [[dx, -6, 0]], 'dur': 1}}}}


scene('s34-boarding.json', 3,
  world={'fog': '#c8c8c0', 'fogNear': 6000, 'fogFar': 42000, 'light': 1.0, 'rays': 0, 'bloom': 0.6, 'haze': 0.05, 'hazeY': 0.62, 'shake': 0.3, 'dof': 0},
  beat_world={1: {'fog': '#5a6068', 'light': 0.75, 'shake': 0.6}, 2: {'fog': '#3a4048', 'light': 0.62, 'shake': 0.8}, 3: {'fog': '#2a3038', 'light': 0.55, 'shake': 1}},
  scene_cam=frame([820, 515, 1000], W(ARK[0], ARK[1] - 120, ARK[2]), 800, 430),
  layers=[
    sky(600, {0: [10, 10.6, 6500], 1: [10.6, 11.2, 6000], 2: [11.2, 12, 9500], 3: [12, 12.8, 10000]}, sun={'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 260, 'size': 26}),
    # heavy cloud rolling in from both sides over the plain
    {'type': 'clouds', 'show': [1, None], 'depth': 0.06, 'y': 150, 'count': 12, 'color': '#2a2e36', 'scale': 2.4, 'spanY': 260, 'seed': 31, 'reveal': {'dir': 'left', 'dur': 6000}, 'fog': 0.3},
    {'type': 'clouds', 'show': [1, None], 'depth': 0.08, 'y': 290, 'count': 10, 'color': '#3a3e46', 'scale': 2, 'spanY': 200, 'seed': 37, 'reveal': {'dir': 'right', 'dur': 7000}, 'fog': 0.3},
    {'type': 'storm', 'show': [1, None], 'zs': [-6000, -2500, -800], 'speed': 0.3, 'tone': 'dark', 'opacity': 0.25, 'at': {'2': {'opacity': 0.45}}},
    *plain(dark=0.6),
    {'type': 'ark', 'depth': ARK[2], 'x': ARK[0], 'y': ARK[1], 's': 0.9, 'built': 3, 'ramp': True, 'lit': 0.9, 'ppu': 1},
    herd(ANIMALS_L, -300, 0.215, 940, 0), herd(ANIMALS_R, 1900, 0.225, -1100, 600, size=0.72),
    # the believers going up into the ship, Nuh last at its door
    *[{'type': 'light', 'show': [3, None], 'h': h17(0.22), 'color': '#ffeed4', 'glow': 0.4, 'bright': 1.1, 'solid': 0.5, 'pose': 'walk', 'delay': 400 + k * 700, 'dur': 6000,
       'path': [[RAMP[0] - 260 + k * 30, pl_y(0.23), zof(0.23)], [RAMP[0], RAMP[1], zof(RAMP[2])], [RAMP[0] + 70, RAMP[1] - 70, zof(0.2)], [RAMP[0] + 100, RAMP[1] - 96, zof(0.198)]]} for k in range(6)],
    {'type': 'light', 'show': [3, None], 'depth': 0.205, 'pos': [RAMP[0] - 40, RAMP[1] + 4], 'h': h17(0.205), **dayP, 'glow': 0.7, 'bright': 1.3},
    dust(box=(-1400, 200, -8000, 3000, 950, 600), count=500, size=2.6, color='#d8d8d0', opacity=0.3, wind=(14, -2, 0), show=[1, None]),
    {'type': 'oven', 'flat': True, 'depth': 0, 'show': [0, 1], 'well': 1.4, 'fade': 2200},
    {'type': 'lightning', 'x': 1320, 'flash': 0, 'at': {'2': {'flash': 1}, '3': {'flash': 2}}},
    {'type': 'tint', 'color': '#3a4a40', 'amount': 0, 'blend': 'multiply', 'opacity': 0, 'at': {'1': {'amount': 0.12, 'opacity': 1}, '2': {'amount': 0.22, 'opacity': 1}, '3': {'amount': 0.3, 'opacity': 1}}},
  ],
  cams=c34)
print('34 ok', at(*RAMP, c34[3]))


# ── 35 · The gates of the sky open ─────────────────────────────────────────────
# Night and rain over the plain and the town; springs burst from the ground; the water rises over the plain and
# the town (its lights go out beneath it, no one shown); the ship lifts and rides.
ARK35 = (1180, pl_y(0.2) + 4, 0.2)
LEVEL, LEVEL2 = 330, 300
ark_up = lambda lv: lv + round(60 * 0.6) - ARK35[1]
c35 = [
    frame([800, 520, 900], W(800, pl_y(0.15) - 60, 0.15), 800, 470),
    frame([800, 520, 760], W(800, pl_y(0.2) - 40, 0.2), 800, 460),
    frame([820, 470, 900], W(800, 500, 0.2), 800, 430),
    frame([900, 380, 800], W(ARK35[0], LEVEL2, ARK35[2]), 860, 470),
]
scene('s35-deluge.json', 3,
  world={'fog': '#141a1e', 'fogNear': 4000, 'fogFar': 30000, 'light': 0.65, 'rays': 0, 'bloom': 0.8, 'haze': 0, 'hazeY': 0.6, 'shake': 1.2, 'dof': 0},
  scene_cam=frame([800, 515, 1000], W(800, pl_y(0.15) - 60, 0.15), 800, 470),
  art=["No one is shown struggling: the town's lights simply go out beneath the water. The town and its statues are imagined."],
  layers=[
    sky(600, {0: [0.5, 0.8, 8500], 1: [0.8, 1.1, 8500], 2: [1.1, 1.4, 9000], 3: [1.4, 1.7, 8500]}),
    {'type': 'clouds', 'depth': 0.05, 'y': 80, 'count': 9, 'color': '#1c2026', 'scale': 2.1, 'spanY': 220, 'seed': 41},
    {'type': 'clouds', 'depth': 0.07, 'y': 260, 'count': 7, 'color': '#2a2e34', 'scale': 1.7, 'spanY': 160, 'seed': 43},
    {'type': 'range', 'count': 2, 'y': [560, 600], 'amp': [50, 70], 'depth': [0.04, 0.06], 'colors': ['#3a4440', '#262e2a'], 'haze': [0.3, 0.6], 'sharp': 0.35, 'edge': False, 'seed': 47},
    {'type': 'ground', 'depth': 0.08, 'y': 620, 'amp': 6, 'seed': 25, 'x0': -900, 'x1': 2500, 'color': '#4a5040', 'color2': '#1e2218'},
    {'type': 'town', 'depth': 0.1, 'grade': 'town', 'y': 652, 'x0': -260, 'x1': 640, 's': 0.8, 'rows': 2, 'seed': 71, 'night': True, 'lit': 0.35, 'grey': 0.4},
    {'type': 'statues', 'depth': 0.102, 'xs': [190, 250, 310, 370, 430], 'y': 660, 'h': 60, 'color': '#6a5640', 'grey': 0.3, 'lamps': 1, 'night': True},
    {'type': 'crowd', 'area': [-100, 640, zof(0.105), zof(0.12)], 'y': [pl_y(0.12) - 8, 656], 'count': 40, 'size': h17(0.11), 'color': '#ffc890', 'dim': 0.5, 'glow': 0.45, 'mill': 10, 'speed': 0, 'flicker': 0.3,
     'at': {'2': {'out': 1, 'outDur': 7000}}},
    {'type': 'ground', 'depth': 0.14, 'y': pl_y(0.14), 'amp': 6, 'seed': 26, 'x0': -900, 'x1': 2500, 'color': '#3e4636', 'color2': '#1a1e16'},
    {'type': 'springs', 'show': [1, None], 'depth': 0.18, 'points': [[740, pl_y(0.18)], [920, pl_y(0.18) + 8], [560, pl_y(0.18) + 14], [1080, pl_y(0.18) + 4], [380, pl_y(0.18) + 10], [1300, pl_y(0.18) + 12]], 'h': 150, 'stagger': 450},
    {'type': 'ark', 'depth': ARK35[2], 'x': ARK35[0], 'y': ARK35[1], 's': 0.6, 'built': 3, 'ppu': 1, 'tone': ['#1a2430', 0.25],
     'at': {'2': {'move': {'path': [[0, ark_up(LEVEL), 0]], 'dur': 3800, 'delay': 4700}}, '3': {'move': {'path': [[0, ark_up(LEVEL2), 0]], 'dur': 1}}}},
    # the water: painted at its full height, standing below the frame until it rises
    {'type': 'flood', 'show': [2, None], 'depth': 0.22, 'level': LEVEL + 900, 'from': LEVEL + 900, 'color': '#2c4a44', 'deep': '#0b1414', 'x0': -900, 'x1': 2500,
     'move': {'path': [[0, -900, 0]], 'dur': 8500}, 'area': [-800, LEVEL + 900 - 40, 2400, 1800], 'at': {'3': {'move': {'path': [[0, LEVEL2 - LEVEL - 900, 0]], 'dur': 1}}}},
    {'type': 'storm', 'zs': [-6000, -2500, -800], 'speed': 0.35, 'tone': 'dark', 'opacity': 0.55},
    {'type': 'particles', 'kind': 'downpour', 'count': 260},
    {'type': 'lightning', 'x': 1250, 'flash': 1, 'at': {'2': {'flash': 2, 'x': 520}}},
    {'type': 'tint', 'color': '#1a2a2a', 'amount': 0.2, 'blend': 'multiply'},
  ],
  cams=c35)
print('35 ok', at(ARK35[0], LEVEL2, ARK35[2], c35[3]))


# ── 36 · Nuh and his son ───────────────────────────────────────────────────────
# The ship rides towering seas; far off on a mountain's slope, a single dim light: his son. Nuh calls to him
# from the deck; the son climbs higher; a wave passes over the slope, and it is empty.
SON = (1246, 336, 0.1)
NUH36 = (610, 604, 0.4)
c36 = [
    cam([800, 440, 1150], [820, 440, -3000]),
    cam([820, 445, 1050], [860, 440, -3000]),
    cam([830, 445, 1000], [880, 436, -3000]),
    cam([820, 445, 1050], [860, 440, -3000]),
    cam([820, 445, 1000], [860, 440, -3000]),
]
scene('s36-son.json', 3,
  world={'fog': '#0e141c', 'fogNear': 4000, 'fogFar': 30000, 'light': 0.6, 'rays': 0, 'bloom': 0.85, 'haze': 0, 'hazeY': 0.6, 'shake': 1.4, 'dof': 0},
  beat_world={4: {'shake': 0.5, 'light': 0.65}},
  scene_cam=cam([800, 440, 1200], [820, 440, -3000]),
  layers=[
    sky(560, {0: [3, 3.3, 6500], 1: [3.3, 3.6, 9500], 2: [3.6, 3.9, 9500], 3: [3.9, 4.1, 7000], 4: [4.1, 4.6, 8000]}),
    {'type': 'clouds', 'depth': 0.05, 'y': 120, 'count': 8, 'color': '#1a2028', 'scale': 2, 'spanY': 200, 'seed': 51},
    {'type': 'waves', 'depth': 0.07, 'y': 540, 'rows': 2, 'amp': 0.8, 'color': '#1a2834', 'light': '#3e5a70', 'haze': '#3a4a58', 'speed': 9},
    {'type': 'peak', 'depth': SON[2], 'x': 1260, 'y': 300, 'w': 340, 'h': 470, 'color': '#3a3e46', 'lit': '#6a7078', 'seed': 21},
    {'type': 'light', 'depth': SON[2] + 0.001, 'pos': [SON[0], SON[1]], 'h': 25, 'color': '#d8b890', 'glow': 0.3, 'bright': 0.8, 'solid': 0.6, 'show': [1, 3],
     'at': {'2': {'pose': 'walk', 'path': [[1246, 336], [1254, 320], [1262, 306]], 'dur': 5000, 'delay': 1600}}},
    {'type': 'waves', 'show': [3, 4], 'depth': 0.105, 'rows': 0, 'surge': True, 'surgeX': 1180, 'surgeY': 560, 'color': '#121c26', 'light': '#4a6a84', 'move': {'path': [[-260, 0, 0]], 'dur': 4000}},
    {'type': 'waves', 'depth': 0.14, 'y': 650, 'rows': 2, 'amp': 1.15, 'color': '#16222e', 'light': '#4a6a84', 'haze': '#2e3e4c', 'speed': 7},
    {'type': 'storm', 'zs': [-6000, -2500, -800], 'speed': 0.35, 'tone': 'dark', 'opacity': 0.5, 'at': {'4': {'opacity': 0.2}}},
    {'type': 'ark', 'depth': NUH36[2] - 0.002, 'x': 220, 'y': 830, 's': 1.1, 'built': 3, 'tone': ['#1a2430', 0.35], 'ppu': 0.8},
    {'type': 'light', 'depth': NUH36[2], 'pos': [NUH36[0], NUH36[1]], 'h': 92, 'color': '#fffaf0', 'glow': 0.9, 'bright': 1.4, 'at': {'1': {'pose': 'reach'}, '4': {'pose': 'stand'}}},
    {'type': 'particles', 'kind': 'downpour', 'count': 150, 'at': {'4': {'count': 40}}},
    {'type': 'particles', 'kind': 'spray', 'count': 50, 'area': [-200, 520, 1800, 720]},
    {'type': 'calligraphy', 'show': [1, 2], 'ref': '11:42', 'ar': [12, 14], 'x': 1000, 'y': 400, 'size': 54, 'color': '#fffaf0', 'w': 460, 'dur': 3000},
    {'type': 'calligraphy', 'show': [2, 3], 'ref': '11:43', 'ar': [1, 6], 'x': 1030, 'y': 230, 'size': 44, 'color': '#d8c8b0', 'w': 560, 'dur': 3600, 'waver': True, 'glow': False},
  ],
  cams=c36)
print('36 ok', at(*SON, c36[2]), at(*NUH36, c36[1]))


# ── 37 · The waters recede ─────────────────────────────────────────────────────
# Morning, the sea still as a mirror; the water sinks away, the mountains come up out of it and the ship
# settles on the summit of al-Judi; a bird flies out across the clearing sky.
JUDI = (820, 470, 0.1)
ARK37 = 384
c37 = [
    frame([800, 450, 1050], W(820, 430, 0.1), 800, 400),
    frame([800, 450, 1000], W(820, 470, 0.1), 800, 360),
    frame([800, 450, 1100], W(900, 420, 0.1), 820, 380),
]
scene('s37-recede.json', 3,
  world={'fog': '#d8e0e4', 'fogNear': 6000, 'fogFar': 46000, 'light': 1.0, 'rays': 0, 'bloom': 0.7, 'haze': 0, 'hazeY': 0.6, 'shake': 0.2, 'dof': 0},
  beat_world={2: {'rays': 0.35}},
  scene_cam=frame([800, 450, 1150], W(820, 430, 0.1), 800, 400),
  art=['The shape of the mountains is imagined; the Quran names the resting place al-Judi.'],
  layers=[
    sky(640, {0: [6.6, 7.2, 6500], 1: [7.2, 8.4, 10500], 2: [8.4, 9.4, 8500]}),
    {'type': 'clouds', 'depth': 0.05, 'y': 150, 'count': 8, 'color': '#eef2f4', 'scale': 1.6, 'spanY': 160, 'seed': 61, 'at': {'2': {'part': True, 'partDelay': 600}}},
    {'type': 'range', 'count': 3, 'y': [560, 650], 'amp': [80, 120], 'depth': [0.04, 0.08], 'colors': ['#7a9488', '#4a6a54'], 'haze': [0.2, 0.5], 'sharp': 0.5, 'edge': False, 'seed': 67},
    {'type': 'ground', 'depth': 0.09, 'y': 700, 'amp': 14, 'seed': 31, 'x0': -900, 'x1': 2500, 'color': '#5a7a4a', 'color2': '#2e4a2a', 'grass': 30, 'grassColor': '#7a9a5a'},
    {'type': 'peak', 'depth': JUDI[2], 'x': JUDI[0], 'y': JUDI[1], 'w': 520, 'h': 420, 'color': '#3e5048', 'lit': '#9ab0a0', 'seed': 7},
    {'type': 'flood', 'depth': JUDI[2] + 0.004, 'level': 360, 'from': 360, 'calm': True, 'color': '#c8d6de', 'deep': '#8aa0ae', 'x0': -900, 'x1': 2500, 'area': [-800, 320, 2400, 1800],
     'at': {'1': {'move': {'path': [[0, 1000, 0]], 'dur': 9500}}, '2': {'move': {'path': [[0, 1000, 0]], 'dur': 1}}}},
    {'type': 'ark', 'depth': JUDI[2] + 0.006, 'x': JUDI[0], 'y': ARK37, 's': 0.4, 'built': 3, 'tone': ['#cfdce4', 0.12], 'ppu': 1.2,
     'at': {'1': {'move': {'path': [[0, JUDI[1] - ARK37, 0]], 'dur': 1900}}, '2': {'move': {'path': [[0, JUDI[1] - ARK37, 0]], 'dur': 1}}}},
    {'type': 'light', 'kind': 'bird', 'show': [2, None], 'h': 12, 'color': '#fffaf0', 'glow': 0.6, 'bright': 1.4, 'dur': 7000, 'delay': 1400,
     'path': [[820, 440, zof(0.106)], [1000, 320, zof(0.1)], [1300, 200, zof(0.09)], [1800, 130, zof(0.08)]]},
    dust(box=(-1400, -200, -9000, 3000, 950, 600), count=260, size=2.4, color='#ffffff', opacity=0.22, wind=(3, -1, 0)),
    {'type': 'tint', 'show': [2, None], 'color': '#a8d090', 'amount': 0.1, 'blend': 'soft-light'},
  ],
  cams=c37)
print('37 ok', at(JUDI[0], JUDI[1], JUDI[2], c37[1]))


# ── 38 · Nuh's plea for his son ────────────────────────────────────────────────
# Dusk on the ship's deck, high on the mountain, the washed land far below; Nuh kneels at the rail. The answer
# comes as light and words in the sky, never a figure; he bows his head, and his light grows calm.
NUH38 = (640, 700, 0.4)
c38 = [
    frame([800, 470, 900], W(NUH38[0], NUH38[1] - 50, NUH38[2]), 640, 560),
    frame([800, 480, 760], W(NUH38[0], NUH38[1] - 50, NUH38[2]), 560, 430),
    frame([800, 480, 740], W(NUH38[0], NUH38[1] - 50, NUH38[2]), 560, 430),
    frame([800, 470, 820], W(NUH38[0], NUH38[1] - 50, NUH38[2]), 640, 520),
]
scene('s38-plea.json', 3,
  world={'fog': '#4a3e5a', 'fogNear': 6000, 'fogFar': 40000, 'light': 0.9, 'rays': 0, 'bloom': 0.85, 'haze': 0, 'hazeY': 0.6, 'shake': 0.2, 'dof': 0},
  scene_cam=frame([800, 465, 1000], W(NUH38[0], NUH38[1] - 50, NUH38[2]), 640, 560),
  layers=[
    sky(420, {0: [17.4, 17.9, 6500], 1: [17.9, 18.3, 9500], 2: [18.3, 18.8, 10000], 3: [18.8, 19.2, 7000]},
        sun={'rise': 6, 'set': 18.6, 'x0': 300, 'x1': 1300, 'peak': 200, 'size': 34}),
    {'type': 'range', 'count': 3, 'y': [410, 490], 'amp': [50, 80], 'depth': [0.04, 0.07], 'colors': ['#6a7a74', '#3e5a48'], 'haze': [0.2, 0.5], 'sharp': 0.4, 'edge': False, 'seed': 71},
    {'type': 'ground', 'depth': 0.08, 'y': 510, 'amp': 10, 'seed': 37, 'x0': -900, 'x1': 2500, 'color': '#4e7048', 'color2': '#2a4228'},
    {'type': 'water', 'depth': 0.085, 'points': [[380, 514], [600, 538], [880, 576], [1180, 640]], 'w0': 5, 'w1': 54, 'reflect': [[0, '#f0d0a0'], [0.5, '#b8a8b8'], [1, '#6a6a8a']]},
    {'type': 'ark', 'depth': NUH38[2] - 0.004, 'view': 'deck', 'y': 640, 'tone': ['#4a3a5a', 0.3], 'ppu': 0.9},
    {'type': 'beam', 'depth': NUH38[2] - 0.002, 'x': NUH38[0], 'y': NUH38[1], 'w': 150, 'color': '#fff0d8', 'on': True, 'top': -1400, 'show': [2, None], 'fade': 2400},
    {'type': 'light', 'depth': NUH38[2], 'pos': [NUH38[0], NUH38[1]], 'h': h17(NUH38[2]), 'pose': 'kneel', 'color': '#fff4d6', 'glow': 0.7, 'bright': 1.2, 'at': {'2': {'glow': 1.0, 'bright': 1.4}, '3': {'pose': 'bow', 'glow': 1.1, 'bright': 1.4}}},
    dust(box=(-1400, -200, -9000, 3000, 950, 600), count=200, size=2.4, color='#ffe8d0', opacity=0.2, wind=(3, -1, 0)),
    {'type': 'calligraphy', 'show': [2, None], 'ref': '11:46', 'ar': [1, 5], 'x': 980, 'y': 200, 'size': 66, 'color': '#ffe9b8', 'w': 860, 'dur': 4000},
  ],
  cams=c38)
print('38 ok', at(*NUH38, c38[1]))


# ── 39 · Descend in peace ──────────────────────────────────────────────────────
# Morning on the mountain's green slope: the ramp comes down, the animals go out in pairs, Nuh and the believers
# walk down onto the washed earth with flowers springing where they step (51:48). Then far below, the first
# fire on the new earth and its smoke rising into the evening; then, generations later, the sands of ʿAd and
# a man walking toward their great city: Hud.
ARK39 = (620, 690, 0.2)
FOOT39 = (548, 728, 0.205)          # the ramp's foot, on the slope
OUT = [{'kind': 'lion', 'path': [[0, 0]]}, {'kind': 'deer', 'path': [[150, 2]]}, {'kind': 'horse', 'path': [[300, 0]]}, {'kind': 'camel', 'path': [[470, 3]]}, {'kind': 'cow', 'path': [[640, 1]]}]
DUNES = {'lit': '#f4b464', 'body': '#cf8648', 'shade': '#4a2a5c'}
HUD = [(1120, 676, 0.3), (1010, 660, 0.26), (920, 646, 0.22)]
c39 = [
    frame([800, 520, 900], W(ARK39[0], ARK39[1] - 120, ARK39[2]), 760, 430),
    frame([840, 525, 820], W(ARK39[0] + 200, ARK39[1] - 60, ARK39[2]), 800, 450, ease='inOut'),
    frame([860, 560, 700], W(700, 752, 0.22), 800, 600),
    {**frame([800, 500, 900], W(820, 650, 0.2), 800, 470), 'dx': 9000, 'cut': True},
    {**frame([800, 480, 900], W(820, 200, 0.2), 800, 300), 'dx': 9000, 'ease': 'inOut'},
    {**frame([800, 480, 1000], W(980, 600, 0.2), 800, 420), 'dx': 18000, 'cut': True},
]
scene('s39-descend.json', 3,
  world={'fog': '#d8e4e0', 'fogNear': 6000, 'fogFar': 46000, 'light': 1.05, 'rays': 0, 'bloom': 0.65, 'haze': 0.03, 'hazeY': 0.6, 'shake': 0.2, 'dof': 0},
  beat_world={3: {'fog': '#e0d4c0'}, 4: {'fog': '#2a3048', 'bloom': 0.85}, 5: {'fog': '#f2d6b2', 'fogNear': 7000, 'fogFar': 48000, 'rays': 0.6, 'bloom': 0.7, 'haze': 0.35, 'hazeY': 0.56}},
  scene_cam=frame([800, 515, 1000], W(ARK39[0], ARK39[1] - 120, ARK39[2]), 760, 430),
  art=['Nuh, the believers and Hud appear only as figures of light; the animals are ink figures.'],
  layers=[
    {'type': 'set', 'show': [0, 3], 'layers': [
        sky(600, {0: [7, 7.8, 7000], 1: [7.8, 8.8, 9500], 2: [8.8, 9.8, 9500]}),
        {'type': 'clouds', 'depth': 0.05, 'y': 150, 'count': 7, 'color': '#f4f6f8', 'scale': 1.4, 'spanY': 140, 'seed': 71},
        {'type': 'range', 'count': 3, 'y': [560, 640], 'amp': [70, 110], 'depth': [0.04, 0.08], 'colors': ['#8aa898', '#5a7a5e'], 'haze': [0.2, 0.5], 'sharp': 0.45, 'edge': False, 'seed': 73},
        {'type': 'ground', 'depth': 0.12, 'y': 660, 'amp': 10, 'tilt': 0.08, 'seed': 41, 'x0': -900, 'x1': 2500, 'color': '#6a9a54', 'color2': '#365a2e', 'grass': 60, 'grassColor': '#8aba6a'},
        {'type': 'ark', 'depth': ARK39[2], 'x': ARK39[0], 'y': ARK39[1], 's': 0.9, 'built': 3, 'ramp': 'lower', 'lit': 0.6, 'ppu': 1},
        {'type': 'animals', 'show': [1, None], 'depth': 0.215, 'size': 0.72, 'fade': 'none', 'pairs': [{**p, 'path': [[FOOT39[0] + 60 + p['path'][0][0], 740 + p['path'][0][1]]]} for p in OUT],
         'area': [400, 560, 1500, 770], 'move': {'path': [[380, 30, 0]], 'dur': 9000}, 'at': {'2': {'move': {'path': [[380, 30, 0]], 'dur': 1}}}},
        {'type': 'blooms', 'show': [2, None], 'depth': 0.214, 'paths': [[[FOOT39[0], 734], [700, 752], [860, 766]], [[FOOT39[0] + 10, 740], [640, 768], [740, 790]]], 'per': 12, 'reveal': {'dir': 'right', 'dur': 6500, 'delay': 1400}},
        {'type': 'light', 'show': [2, None], 'h': h17(0.205), **dayP, 'glow': 0.5, 'bright': 1.3, 'pose': 'walk', 'dur': 6500, 'delay': 600,
         'path': [[FOOT39[0] + 30, FOOT39[1] - 60, zof(0.2)], [FOOT39[0], FOOT39[1], zof(FOOT39[2])], [720, 752, zof(0.22)], [840, 764, zof(0.235)]]},
        *[{'type': 'light', 'show': [2, None], 'h': h17(0.205), 'color': '#ffeed4', **day, 'pose': 'walk', 'dur': 6500, 'delay': 1800 + k * 600,
           'path': [[FOOT39[0] + 30, FOOT39[1] - 60, zof(0.2)], [FOOT39[0], FOOT39[1], zof(FOOT39[2])], [680 - k * 30, 756 + k * 4, zof(0.222)], [780 - k * 40, 772 + k * 6, zof(0.238)]]} for k in range(4)],
        *birds(n=2),
        dust(box=(-1400, 200, -8000, 3000, 950, 600), count=300, size=2.4, color='#ffffff', opacity=0.22, wind=(3, -1, 0)),
    ]},
    {'type': 'set', 'show': [3, 5], 'dx': 9000, 'layers': [
        sky(560, {3: [16.6, 17.6, 7500], 4: [18.2, 19.6, 6000]}, moon=MOON),
        {'type': 'range', 'count': 3, 'y': [380, 470], 'amp': [60, 90], 'depth': [0.03, 0.05], 'colors': ['#8ab0a8', '#5e8a6a'], 'haze': [0.3, 0.6], 'sharp': 0.4, 'edge': False, 'seed': 79},
        {'type': 'peak', 'depth': 0.055, 'x': 1210, 'y': 430, 'w': 260, 'h': 200, 'color': '#5a7a64', 'lit': '#9ab8a0', 'seed': 5},
        {'type': 'ark', 'depth': 0.056, 'x': 1210, 'y': 434, 's': 0.1, 'built': 3},
        {'type': 'ground', 'depth': 0.1, 'y': 520, 'amp': 20, 'seed': 43, 'x0': -900, 'x1': 2500, 'color': '#78a85e', 'color2': '#3e6a34', 'grass': 40, 'grassColor': '#9aca7a'},
        {'type': 'water', 'depth': 0.12, 'points': [[200, 540], [420, 600], [560, 720], [700, 900]], 'w0': 5, 'w1': 90, 'reflect': [[0, '#f4f0dc'], [0.4, '#b4d4e4'], [1, '#6a9ab8']]},
        {'type': 'water', 'depth': 0.12, 'points': [[1500, 560], [1260, 640], [1100, 760], [980, 900]], 'w0': 5, 'w1': 80, 'reflect': [[0, '#f4f0dc'], [0.4, '#b4d4e4'], [1, '#6a9ab8']]},
        {'type': 'shelter', 'depth': 0.2, 'x': 840, 'y': 650, 's': 0.9},
        {'type': 'light', 'kind': 'flame', 'depth': 0.205, 'pos': [770, 662], 'h': 26, 'color': '#ffb050', 'glow': 1.2},
        smoke(770, 640, 0.205, n=90, rise=46),
        {**dust(box=(-260, -880, zof(0.205) - 80, -40, 2600, zof(0.205) + 80), count=140, size=60, color='#8a847c', opacity=0.14, wind=(6, -50, 0), swirl=26, blend='normal'), 'show': [3, 5]},
        *[{'type': 'light', 'depth': 0.21, 'pos': [x, 664], 'h': h17(0.21), 'color': '#ffeed4', **day, 'pose': 'kneel' if k % 2 else 'stand'} for k, x in enumerate((640, 680, 700, 720, 860, 900, 930, 960))],
        {'type': 'light', 'depth': 0.21, 'pos': [800, 666], 'h': h17(0.21), **dayP, 'glow': 0.5, 'bright': 1.3},
        dust(box=(-1400, 200, -8000, 3000, 950, 600), count=200, size=2.4, color='#fff4e0', opacity=0.2, wind=(3, -1, 0)),
    ]},
    {'type': 'set', 'show': [5, None], 'dx': 18000, 'layers': [
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#8fb0c8'], [0.4, '#efe0cc'], [0.68, '#f6cc98'], [1, '#efa860']]},
        {'type': 'sun', 'pos': [420, 545, -26000], 'size': 34, 'color': '#ffe0a8'},
        *[{'type': 'dunes', 'depth': d, **DUNES, 'y': y, 'amp': a, 'count': n, 'seed': sd, 'haze': hz} for d, y, a, n, sd, hz in ((0.05, 560, 9, 12, 1, 0.6), (0.08, 568, 15, 10, 2, 0.45), (0.11, 582, 22, 9, 3, 0.32))],
        # Iram far off on the horizon, its columns small with distance
        {'type': 'iram', 'depth': 0.13, 'x0': 420, 'x1': 1240, 'rows': [{'y': 596, 'h': 70, 'n': 26, 'w': 4}, {'y': 602, 'h': 96, 'n': 18, 'w': 5}, {'y': 608, 'h': 124, 'n': 12, 'w': 7}],
         'palaces': 0, 'shadows': False, 'seed': 9, 'haze': '#f2d6b2'},
        {'type': 'dunes', 'depth': 0.17, **DUNES, 'y': 626, 'amp': 26, 'count': 8, 'seed': 4, 'haze': 0.2},
        {'type': 'light', 'h': h17(HUD[0][2]), **dayP, 'glow': 0.4, 'pose': 'walk', 'path': [[x, y, zof(d)] for x, y, d in HUD], 'dur': 8000, 'delay': 800},
        {'type': 'dunes', 'depth': 0.34, **DUNES, 'y': 770, 'amp': 50, 'count': 5, 'seed': 6},
        dust(box=(-1400, -200, -4000, 3000, 1100, 1400), count=1600, size=3, color='#ffd9a0', opacity=0.45, wind=(30, -4, -10)),
    ]},
  ],
  cams=c39, place={2: 'sky'})
print('39 ok', at(HUD[0][0], HUD[0][1], HUD[0][2], c39[5]))
