from base import *

# Chapter 17 · Isa. True scale: a person of 1.7 m is 255 × depth design units tall.
C17 = ROOT + 'src/story/chapters/c17/'
os.makedirs(C17, exist_ok=True)


def scene(sid, order, title, arabic, art, prompt, world, layers, beats, ambient, base='#1a1820', dissolve=2400, node='isa'):
    order = ORDER.get(sid, order)
    s = {'id': sid, 'chapter': 17, 'order': order, 'node': node, 'title': title, 'arabic': arabic, 'source': 'quran', 'ayahs': [], 'art': art,
         'ambient': ambient, 'base': base, 'captions': 'parchment', 'renderer': 'gl', 'pen': True, 'dissolve': dissolve, 'world': world,
         'cam': beats[0]['cam'], 'imagePrompt': prompt, 'layers': layers, 'beats': beats}
    open(C17 + f's{order}-{sid}.json', 'w').write(dump(s))


def pv(ref, part=None):
    v = {'ref': ref, 'place': 'sky'}
    if part:
        v['part'] = part
    return v


P = lambda d, m=1.7: round(m * 150 * d)
Z = lambda d: round(1000 - 1000 / d)
D = 0.42
FEET = 792
HILLS = {'fog': '#c8c0b0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.0, 'rays': 0, 'bloom': 0.65, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
NIGHT = {'fog': '#141824', 'fogNear': 6000, 'fogFar': 40000, 'light': 0.9, 'rays': 0, 'bloom': 0.9, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
LAKE = {'fog': '#a8b4bc', 'fogNear': 6000, 'fogFar': 50000, 'light': 1.0, 'rays': 0, 'bloom': 0.7, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}

isa_d = dict(color='#fffaf0', glow=0.35, bright=1.1, solid=0.5)
isa_n = dict(color='#fffaf0', glow=0.6, bright=1.35)
dim = dict(color='#ecc49a', glow=0.2, bright=0.95, solid=0.6)
grey = dict(color='#9a9aa4', glow=0.08, bright=0.7, solid=0.6)
disc = dict(color='#fff0dc', glow=0.25, bright=1.0, solid=0.55)            # the disciples
SUN = {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 300, 'size': 34}
MOON = {'rise': 19, 'set': 6.5, 'x0': 1300, 'x1': 300, 'peak': 340, 'size': 24}
motes = lambda opacity=0.28, **kw: dust(box=(-1400, 200, -8000, 3000, 950, 600), count=400, size=2.6, color='#fff0d8', opacity=opacity, wind=(4, -2, 0), **kw)


def heav(tods, sun=SUN, moon=MOON, horizon=630):
    t0, *rest = tods
    h = {'type': 'heavens', 'horizon': horizon, 'tod': t0, 'sun': sun, 'moon': moon}
    if rest:
        h['at'] = {str(i + 1): {'tod': t} for i, t in enumerate(rest) if t}
    return h


def galilee(seed=1400, d_hills=0.05):
    return [
        {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 40, 'seed': seed, 'sharp': 0.3, 'color': '#8a8a7a', 'haze': 0.35, 'fog': 0.4},
        {'type': 'ground', 'depth': 0.14, 'y': 690, 'amp': 10, 'seed': seed + 1, 'color': '#8a9a5a', 'color2': '#5a6a3a', 'grass': True, 'grassColor': '#a8b468'},
    ]


ART = "Isa appears only as a steady light; his mother, the disciples and the people as soft or dim figures of light. Nothing in these scenes stands for God. The land's look is imagined."

# ── 167 · Birds of clay ───────────────────────────────────────────────────
BX = [880, 940, 1000, 1060, 1120]
rise = [{'type': 'light', 'kind': 'bird', 'show': [1, None], 'depth': D, 'h': 14, 'color': '#fffaf0', 'glow': 0.8, 'bright': 1.4, 'delay': 400 + i * 350,
         'path': [[x, FEET - 6, Z(D)], [x + (i - 2) * 30, 640, Z(D) - 300], [600 + i * 110, 380, Z(D) - 1500], [900 - i * 60, 240, Z(D) - 3000], [700 + i * 90, 300, Z(D) - 3600]],
         'dur': 9000 + i * 500} for i, x in enumerate(BX)]
scene('claybirds', 167, 'Birds of Clay', 'طيور من طين',
  art=[ART, "The clay birds are drawn in ink; their flight is by God's permission, as Isa says in 3:49 and as 5:110 tells."],
  prompt="A village courtyard in morning sun, a board of small birds shaped from wet clay, children's small lights crowding to watch and a steady light bending over the clay; then the clay birds gone and birds of light rising from the board, wheeling up into the sky; ink-wash and parchment texture.",
  world=HILLS, ambient=['voices', 'birds'], base='#c8c0b0',
  layers=[
    heav([[8, 9, 10000], [9, 10, 11000], [10, 11, 12000]]),
    *galilee(1400),
    {'type': 'town', 'depth': 0.18, 'y': 740, 'x0': -100, 'x1': 1700, 's': P(0.18, 1) / 30, 'grade': 'galilaean', 'lit': 0.1, 'haze': '#b8a898', 'seed': 1402},
    {'type': 'ground', 'depth': 0.3, 'y': 770, 'amp': 3, 'seed': 1403, 'color': '#c8b090', 'color2': '#9a8468'},
    {'type': 'claybirds', 'show': [0, 1], 'depth': D, 'x0': 850, 'x1': 1150, 'y': FEET - 4, 'count': 5, 's': P(D, 0.3) / 30, 'wet': 0.6, 'area': [780, 700, 1220, 810]},
    {'type': 'claybirds', 'show': [1, None], 'depth': D, 'x0': 850, 'x1': 1150, 'y': FEET - 4, 'count': 0, 's': P(D, 0.3) / 30, 'area': [780, 700, 1220, 810]},
    *rise,
    light([800, FEET + 6], P(0.43), depth=0.43, **isa_d, pose='reach', at={'1': {'pose': 'raise'}}),
    *[light([1200 + i * 50, FEET + 8 + (i % 2) * 4], P(0.43, 1.2), depth=0.43, **disc) for i in range(5)],
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['voices', 'birds'], 'cam': cam([1000, 540, 350], [1000, 880, -3000]),
     'say': "God sent Isa to the Children of Israel with clear signs. He shaped birds from clay before the people's eyes."},
    {'dur': 13000, 'ambient': ['birds', 'voices'], 'sfx': [{'name': 'wings', 'at': 600}, {'name': 'wings', 'at': 1600}], 'cam': cam([980, 520, 650], [980, 600, -3000]),
     'say': "Then he breathed into them, and they became birds, and flew; by God's permission, not by his own power."},
    {'dur': 12000, 'ambient': ['birds', 'air'], 'cam': cam([980, 520, 800], [980, 640, -3000]), 'pendingVerse': pv('3:49', 'from "I design for you from clay" to "by permission of Allah"')},
  ])

# ── 168 · Healing ─────────────────────────────────────────────────────────
sick = []
for i, x in enumerate((760, 860, 960, 1060, 1160)):
    sick.append(light([x, FEET + 4], P(D, 1.65), depth=D, **grey, pose='kneel' if i % 2 else 'stand',
                      at={'1': {'color': '#fff0d8', 'glow': 0.18, 'bright': 1.0, 'pose': 'stand'}, '2': {'color': '#fff0d8', 'glow': 0.18, 'bright': 1.0, 'pose': 'stand'}}))
scene('healing', 168, 'By God\'s Leave', 'الشفاء',
  art=[ART, "The blind and the sick are shown only as grey lights that grow bright. The one raised from death is a light kindled again; nothing of death is shown."],
  prompt="A dusty road outside a village, a line of grey, dimmed figures of light waiting, some kneeling; a steady light passing along the line, each grey light turning warm and bright as he passes; then, beside a still bier, a new light kindled where there was none; ink-wash and parchment texture.",
  world=HILLS, ambient=['voices', 'wind'], base='#c8c0b0',
  layers=[
    heav([[15, 16, 10000], [16, 17, 11000], [17, 17.8, 12000]]),
    *galilee(1410),
    {'type': 'tree', 'depth': 0.22, 'x': 300, 'y': 728, 'h': P(0.22, 6), 'kind': 'living', 'seed': 1412},
    {'type': 'tree', 'depth': 0.22, 'x': 1380, 'y': 728, 'h': P(0.22, 6.5), 'kind': 'living', 'seed': 1413},
    {'type': 'ground', 'depth': 0.3, 'y': 770, 'amp': 3, 'seed': 1414, 'color': '#c8b090', 'color2': '#9a8468'},
    *sick,
    light([660, FEET + 8], P(0.43), depth=0.43, **isa_d, at={'1': {'pose': 'walk', 'path': [[660, FEET + 8], [1220, FEET + 8]], 'dur': 9000}, '2': {'pos': [1240, FEET + 8], 'pose': 'raise'}}),
    light([1320, FEET + 4], P(D, 1.65), depth=D, color='#fffaf0', glow=0.5, bright=1.3, solid=0.5, show=[2, None]),
    {'type': 'flash', 'show': [2, 3], 'color': '#fffaf0', 'peak': 0.3, 'delay': 1200, 'rise': 300, 'dur': 2200},
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['voices', 'wind'], 'cam': cam([900, 525, 600], [920, 760, -3000]),
     'say': "Crowds followed Isa wherever he went, bringing the blind and the sick."},
    {'dur': 11000, 'ambient': ['voices', 'air'], 'cam': cam([940, 525, 650], [960, 750, -3000]),
     'say': "By God's permission he healed the blind and the leper,"},
    {'dur': 11000, 'ambient': ['air'], 'world': {'bloom': 0.9}, 'cam': cam([1180, 530, 550], [1220, 780, -3000]),
     'say': "and by God's permission he brought the dead back to life. These are signs, he told them, if you are believers."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([960, 520, 800], [980, 700, -3000]), 'pendingVerse': pv('3:49', 'from "And I cure the blind" to "by permission of Allah"')},
  ])

# ── 169 · The disciples ───────────────────────────────────────────────────
twelve = []
for i in range(12):
    x0, x1 = 1400 + (i % 4) * 60, 760 + (i - 6) * 46 + (60 if i >= 6 else -60)
    twelve.append(light([x0, FEET + 6 + (i % 3) * 3], P(D, 1.7), depth=D, **disc, pose='walk', path=[[x0, FEET + 6], [x1, FEET + 6 + (i % 3) * 3]], dur=9000, delay=i * 200,
                        at={'2': {'pos': [x1, FEET + 6 + (i % 3) * 3], 'path': None, 'pose': 'stand'}}))
scene('helpers', 169, 'The Disciples', 'الحواريون',
  art=[ART, "The disciples are shown as twelve soft lights; their number is from the commentaries."],
  prompt="The shore of a wide lake in the hills at morning, small wooden fishing boats drawn up, nets drying; a steady light standing on the shingle as twelve soft lights leave their boats and gather around him; ink-wash and parchment texture.",
  world=LAKE, ambient=['water', 'birds'], base='#a8b4c0',
  layers=[
    heav([[6.6, 7.6, 10000], [7.6, 8.6, 11000], [8.6, 9.6, 12000]], horizon=640),
    {'type': 'ridge', 'depth': 0.03, 'y': 640, 'amp': 40, 'seed': 1420, 'sharp': 0.3, 'color': '#7a8070', 'haze': 0.4, 'fog': 0.5},
    {'type': 'water', 'depth': 0.08, 'points': [[-6000, 680], [800, 690], [8000, 700]], 'w0': 80, 'w1': 80, 'reflect': [['0', '#c8dae4'], ['1', '#5a7a8a']]},
    {'type': 'boat', 'depth': 0.18, 'x': 300, 'y': 720, 'w': P(0.18, 7), 'area': [150, 560, 450, 726]},
    {'type': 'boat', 'depth': 0.2, 'x': 1240, 'y': 726, 'w': P(0.2, 7), 'area': [1060, 560, 1420, 732]},
    {'type': 'ground', 'depth': 0.24, 'y': 744, 'amp': 4, 'seed': 1421, 'color': '#b8a888', 'color2': '#8a7a62'},
    *twelve,
    light([760, FEET + 10], P(0.43), depth=0.43, **isa_d, at={'1': {'pose': 'raise'}}),
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['water', 'birds'], 'cam': cam([900, 520, 900], [920, 680, -3000]),
     'say': "When Isa sensed that many of his people rejected him, he asked: who will be my helpers in the cause of God?"},
    {'dur': 11000, 'ambient': ['water', 'voices'], 'cam': cam([820, 525, 650], [820, 750, -3000]),
     'say': "The disciples answered: we are God's helpers. We believe in God; bear witness that we submit to Him."},
    {'dur': 12000, 'ambient': ['water', 'air'], 'cam': cam([800, 520, 800], [800, 700, -3000]), 'pendingVerse': pv('3:52', 'from "who are my supporters for Allah"')},
  ])

# ── 170 · The table spread ────────────────────────────────────────────────
scene('table', 170, 'The Table from Heaven', 'المائدة',
  art=[ART, "The table is drawn spread with loaves and fish as the commentaries describe; the Quran tells only that it was sent down (5:112–115)."],
  prompt="A hilltop at dusk above a lake, a steady light with arms raised among twelve soft lights; a low table spread with a white cloth, loaves and fish slowly coming down out of the darkening sky in a pool of gold light, motes drifting around it; ink-wash and parchment texture.",
  world={**NIGHT, 'fog': '#2a2430'}, ambient=['wind', 'air'], base='#1a1820',
  layers=[
    heav([[17.4, 18.2, 10000], [18.2, 18.8, 12000], [18.8, 19.4, 12000]], horizon=660),
    {'type': 'ridge', 'depth': 0.03, 'y': 660, 'amp': 40, 'seed': 1430, 'sharp': 0.3, 'color': '#4a4a5a', 'haze': 0.3, 'fog': 0.4},
    {'type': 'water', 'depth': 0.06, 'points': [[-6000, 690], [800, 694], [8000, 698]], 'w0': 40, 'w1': 40, 'reflect': [['0', '#a8a0b8'], ['1', '#3a3a5a']]},
    {'type': 'ground', 'depth': 0.3, 'y': 780, 'amp': 14, 'seed': 1431, 'color': '#5a5a48', 'color2': '#2a2a24'},
    {'type': 'table', 'show': [1, None], 'depth': D, 'x': 960, 'y': FEET + 6, 'w': P(D, 2), 'glow': 0.8, 'area': [800, 640, 1120, 810],
     'at': {'1': {'move': {'path': [[0, -520, 0], [0, -200, 0], [0, 0, 0]], 'dur': 9000, 'delay': 600}}, '2': {'move': {'path': [[0, 0, 0]], 'dur': 1}}}},
    dust(box=(-100, -200, -1600, 500, 600, -1200), count=200, size=4, color='#ffe8b0', opacity=0.6, wind=(0, -10, 0), swirl=30, show=[1, None]),
    *[light([560 + i * 46 + (520 if i >= 6 else 0), FEET + 8 + (i % 2) * 4], P(D, 1.7), depth=D, **disc) for i in range(12)],
    light([860, FEET + 12], P(0.43), depth=0.43, **isa_n, at={'0': {'pose': 'raise'}, '1': {'pose': 'raise'}}),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['wind', 'air'], 'cam': cam([940, 545, 350], [960, 920, -3000]),
     'say': "The disciples asked: can your Lord send down to us a table spread with food from heaven? So Isa prayed: our Lord, send us down a table, to be a festival for us and a sign from You."},
    {'dur': 12000, 'ambient': ['air'], 'sfx': [{'name': 'swell', 'at': 800}], 'world': {'bloom': 1.05}, 'cam': cam([940, 535, 500], [960, 820, -3000]),
     'say': "And God sent it down, warning that whoever disbelieved after this would face a punishment like no other."},
    {'dur': 12000, 'ambient': ['air'], 'world': {'bloom': 1.0}, 'cam': cam([940, 540, 450], [960, 860, -3000]), 'pendingVerse': pv('5:114')},
  ])

# ── 171 · Raised up ───────────────────────────────────────────────────────
torches = [{'type': 'light', 'kind': 'flame', 'depth': 0.34, 'h': 14, 'color': '#ffa040', 'glow': 1.3, 'delay': i * 300,
            'pos': [1500 + i * 60, 720], 'path': [[1500 + i * 60, 720 + (i % 2) * 6], [1000 + i * 40, 724 + (i % 2) * 6]], 'dur': 10000} for i in range(6)]
scene('ascension', 172, 'Raised Up', 'الرفع',
  art=[ART, "As the Quran tells (4:157–158), they did not kill him or crucify him; God raised him up to Himself. Nothing else is shown: his light rises into the night sky and the torches find no one."],
  prompt="An olive grove on a hillside at night, a steady light standing among the dark trees; a line of torches winding up the path toward him; the steady light rising slowly and silently up into the stars, leaving a faint trail of light, until the torches reach an empty grove; ink-wash and parchment texture.",
  world=NIGHT, ambient=['wind', 'crickets'], base='#141824',
  layers=[
    heav([[22, 22.6, 10000], [22.6, 23.2, 12000], [23.2, 23.8, 12000]], horizon=640),
    {'type': 'ridge', 'depth': 0.04, 'y': 640, 'amp': 40, 'seed': 1440, 'sharp': 0.3, 'color': '#2a2a38', 'haze': 0.3, 'fog': 0.4},
    {'type': 'town', 'depth': 0.1, 'y': 680, 'x0': 900, 'x1': 1700, 's': P(0.1, 1) / 30, 'grade': 'galilaean', 'night': True, 'lit': 0.3, 'haze': '#24202e', 'seed': 1441},
    {'type': 'ground', 'depth': 0.2, 'y': 720, 'amp': 20, 'seed': 1442, 'color': '#2a3024', 'color2': '#141810'},
    *[{'type': 'tree', 'depth': d, 'x': x, 'y': y, 'h': P(d, 5), 'kind': 'living', 'seed': 1443 + i} for i, (d, x, y) in enumerate(((0.28, 420, 760), (0.3, 1180, 770), (0.36, 260, 800), (0.38, 1340, 806)))],
    *torches,
    light([800, FEET], P(D), depth=D, **isa_n,
          at={'1': {'path': [[800, FEET, Z(D)], [800, FEET - 40, Z(D)], [790, 300, Z(D) - 2000], [780, -200, Z(D) - 8000]], 'dur': 11000, 'delay': 1500},
              '2': {'pose': 'gone'}}),
    dust(box=(-200, -300, -9000, 200, 600, -1200), count=300, size=4, color='#fffaf0', opacity=0.5, wind=(0, 30, 0), swirl=20, show=[1, 2]),
    motes(0.12),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['wind', 'crickets'], 'cam': cam([860, 530, 650], [880, 740, -3000]),
     'say': "Those who rejected Isa plotted to kill him. They planned, and God planned; and God is the best of planners."},
    {'dur': 13000, 'ambient': ['wind', 'air'], 'world': {'bloom': 1.0}, 'cam': cam([820, 500, 900], [820, 380, -3000]),
     'say': "They did not kill him, nor did they crucify him; it was only made to appear so to them. God raised him up to Himself."},
    {'dur': 12000, 'ambient': ['crickets', 'air'], 'cam': cam([860, 520, 800], [880, 640, -3000]), 'pendingVerse': pv('4:158')},
  ])

# ── 172 · Good news of one to come ────────────────────────────────────────
scene('ahmad', 171, 'One Who Will Come', 'البشارة بأحمد',
  art=[ART, "The final messenger is spoken of, never shown. The light low on the southern horizon is only the dawn."],
  prompt="A hilltop at first light, a steady light standing with twelve soft lights around him, his arm raised toward the far south where the sky over endless desert ranges is beginning to glow gold; ink-wash and parchment texture.",
  world=HILLS, ambient=['wind', 'birds'], base='#c8c0b0',
  layers=[
    heav([[4.8, 5.6, 10000], [5.6, 6.4, 11000], [6.4, 7.2, 12000]], horizon=640),
    {'type': 'ridge', 'depth': 0.03, 'y': 640, 'amp': 30, 'seed': 1450, 'sharp': 0.3, 'color': '#6a6070', 'haze': 0.4, 'fog': 0.5},
    {'type': 'dunes', 'depth': 0.08, 'y': 680, 'amp': 14, 'count': 10, 'seed': 1451, 'lit': '#d8b088', 'body': '#a8805e', 'shade': '#5a4448'},
    {'type': 'ground', 'depth': 0.3, 'y': 780, 'amp': 14, 'seed': 1452, 'color': '#6a7a4a', 'color2': '#3a4a2a', 'grass': True, 'grassColor': '#8a9a5a'},
    *[light([960 + i * 44 + (i // 6) * 40, FEET + 8 + (i % 2) * 4], P(D, 1.7), depth=D, **disc) for i in range(12)],
    light([820, FEET + 12], P(0.43), depth=0.43, **isa_d, at={'1': {'pose': 'raise'}, '2': {'pose': 'raise'}}),
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['wind', 'birds'], 'cam': cam([900, 520, 800], [920, 680, -3000]),
     'say': "Isa told the Children of Israel: I am the messenger of God to you, confirming the Torah that came before me,"},
    {'dur': 11000, 'ambient': ['wind', 'air'], 'cam': cam([820, 505, 1000], [820, 560, -3000]),
     'say': "and bringing good news of a messenger to come after me, whose name will be Ahmad."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([860, 515, 900], [860, 640, -3000]), 'pendingVerse': pv('61:6', 'to "whose name is Ahmad"')},
  ])

write_chapter(C17 + 'chapter.json', {
    'number': 17, 'title': 'Isa', 'arabic': 'عيسى', 'nodes': ['isa'],
    'parts': [{'title': 'The Signs', 'from': O(167), 'to': O(170)}, {'title': 'Good News and Ascension', 'from': O(171), 'to': O(172)}]})
print('c17 ok')
