from extras import scene, pv, P, Z, D, FEET, HILLS, NIGHT, HALL, SAND, prophet_d, prophet_n, soft, dim, cold, heav, hall, motes, SUN, MOON
from base import *
from rooms import room, front

# The second review's missing stories (fractional orders until renum.py runs).
old = dict(color='#f0ece4', glow=0.5, bright=1.2, solid=0.45)

# ── Chapter 9 · Yaqub's last words (after The Dream Fulfilled) ────────────
sons = [light([560 + i * 52 + (i // 6) * 140, FEET + 8 + (i % 2) * 6], P(D, 1.7), depth=D, **dim, pose='kneel') for i in range(12)]
sons[5] = light([820, FEET + 10], P(0.425), depth=0.425, **prophet_d, pose='kneel')            # Yusuf, a prophet, among his brothers
scene('lastwords', 105.5, 9, 'yaqub', "Yaqub's Last Words", 'وصية يعقوب',
  art=["Yaqub and Yusuf appear only as steady lights; his other sons as dim figures of light. That Yaqub died in Egypt is from the commentaries; his death is shown only as his light growing still and rising."],
  prompt="A quiet room of an Egyptian house at dusk, an oil lamp burning; an old steady light lying on a low bed, twelve figures of light kneeling close around him, one of them steady and clear; then the old light rising gently and fading through the window into the evening sky; ink-wash and parchment texture.",
  world=HALL, ambient=['air', 'crickets'], base='#10141e',
  layers=[
    *room('yaqubhouse'),
    {'type': 'light', 'kind': 'flame', 'depth': 0.35, 'pos': [1000, 770], 'h': 12, 'color': '#ffc060', 'glow': 1.4},
    light([800, FEET - 30], P(0.4, 1.7), depth=0.4, **old, pose='babe', w=1.0,
          at={'2': {'path': [[800, FEET - 30, Z(0.4)], [800, 500, Z(0.4) - 600], [900, 200, Z(0.4) - 4000]], 'dur': 9000, 'delay': 1500}}),
    *sons,
  ],
  beats=[
    {'dur': 11000, 'ambient': ['air', 'crickets'], 'cam': cam([800, 540, 450], [800, 880, -3000]),
     'say': "Yaqub lived out his last years in Egypt with all his family around him. When death came near, he gathered his sons and asked them: what will you worship after me?"},
    {'dur': 11000, 'ambient': ['air'], 'cam': cam([800, 540, 400], [800, 900, -3000]),
     'say': "They answered: we will worship your God, the God of your fathers Ibrahim, Ismail and Ishaq: one God, and to Him we submit."},
    {'dur': 11000, 'ambient': ['air', 'wind'], 'world': {'bloom': 0.95}, 'cam': cam([820, 520, 650], [840, 700, -3000]),
     'say': "So the Children of Israel came to live in Egypt. Generations later, their descendants would cry out under a Pharaoh who had forgotten Yusuf."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([800, 535, 550], [800, 840, -3000]), 'pendingVerse': pv('2:133')},
  ])

# ── Chapter 13 · The mountain raised above them (after Musa's Return) ─────
scene('liftedmount', 140.5, 13, 'musa', 'The Mountain Above Them', 'رفع الجبل',
  art=["Musa appears only as a steady light; the Children of Israel as small warm lights. God is not depicted: only the mountain is seen, lifted like a cloud above them, as the Quran describes (7:171). That they had hesitated to accept the Torah is from the commentaries."],
  prompt="A great camp of small warm lights at the foot of a rocky mountain; the whole mountain lifting silently from the earth and hanging over them like a dark cloud, its shadow across the crowd; every light bowed low; a steady light before them holding two stone tablets; ink-wash and parchment texture.",
  world=SAND, ambient=['wind', 'crowd'], base='#d8c0a0',
  layers=[
    heav([[15, 16, 10000], [16, 16.6, 11000], [16.6, 17.4, 11000], [17.4, 18, 12000]]),
    {'type': 'ridge', 'depth': 0.03, 'y': 620, 'amp': 40, 'seed': 1700, 'sharp': 0.6, 'color': '#8a5a4a', 'haze': 0.4, 'fog': 0.4},
    {'type': 'ground', 'depth': 0.12, 'y': 690, 'amp': 6, 'seed': 1701, 'color': '#c8a078', 'color2': '#9a7050'},
    {'type': 'peak', 'depth': 0.16, 'x': 800, 'y': 470, 'w': 560, 'h': 240, 'color': '#5a4a48', 'lit': '#9a7a6a', 'seed': 1702, 'ppu': 0.9,
     'at': {'1': {'move': {'path': [[0, 0, 0], [0, -30, 0], [0, -230, 0]], 'dur': 7000, 'delay': 600}}, '2': {'move': {'path': [[0, -230, 0]], 'dur': 1}},
            '3': {'move': {'path': [[0, -230, 0], [0, 0, 0]], 'dur': 6000, 'delay': 400}}}},
    {'type': 'tint', 'show': [1, 3], 'color': '#2a2026', 'amount': 0.3},
    {'type': 'crowd', 'area': [-200, 1800, -3200, -1700], 'y': [FEET + 6, 744], 'count': 360, 'size': P(0.32), 'color': '#ffe0b0', 'dim': 0.4, 'glow': 0.12, 'mill': 3, 'speed': 0,
     'at': {'1': {'bow': 1, 'bowTo': 800}, '2': {'bow': 1, 'bowTo': 800}}},
    {'type': 'tablets', 'depth': 0.44, 'x': 860, 'y': FEET + 14, 'h': P(0.44, 0.7), 'glow': 0.5, 'area': [800, 700, 920, 812]},
    light([780, FEET + 14], P(0.44), depth=0.44, **prophet_d, at={'2': {'pose': 'raise'}}),
    dust(box=(-1400, 0, -9000, 3000, 600, -6000), count=300, size=20, color='#8a7a74', opacity=0.25, wind=(0, -20, 0), blend='normal', show=[1, 3]),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['wind', 'crowd'], 'cam': cam([800, 515, 1000], [800, 600, -3000]),
     'say': "When Musa brought the tablets, his people hesitated to take on what was written in them."},
    {'dur': 11000, 'ambient': ['wind', 'roar'], 'sfx': [{'name': 'rumble', 'at': 600}, {'name': 'rumble', 'at': 3000}], 'world': {'shake': 1.2},
     'cam': cam([800, 505, 1150], [800, 470, -3000]),
     'say': "Then God raised the mountain above them, as if it were a canopy of cloud, and they were sure it would fall on them."},
    {'dur': 11000, 'ambient': ['wind'], 'world': {'shake': 0.3}, 'cam': cam([800, 510, 1100], [800, 500, -3000]),
     'say': "Hold firmly to what We have given you, they were told, and remember what is in it, so that you may be mindful of God. And they made their covenant."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([800, 515, 1000], [800, 600, -3000]), 'pendingVerse': pv('7:171')},
  ])

# ── Chapter 14 · The chest of tranquillity (before Talut's Army) ──────────
bearers = {'type': 'crowd', 'kind': 'angels', 'area': [760, 900, -1500, -1440], 'y': [FEET - 8, FEET - 8], 'count': 4, 'size': 150, 'color': '#fff4d8',
           'dim': 0.05, 'glow': 0.8, 'mill': 0, 'speed': 0, 'flicker': 0.06, 'show': [1, None]}
scene('tabut', 147.5, 14, 'dawud', 'The Chest of Tranquillity', 'التابوت',
  art=["The prophet of the Children of Israel in Talut's time is named Shamwil (Samuel) in the commentaries; he and the people appear only as lights. The angels who carried the chest are columns of light (2:248). The chest's relics are not shown."],
  prompt="A hill town in the land of Israel at morning, crowds of dim lights gathered before a steady light, murmuring against a tall plain figure of light chosen as king; then columns of soft golden light coming over the hill bearing a gilded chest on poles, and setting it down before the people; ink-wash and parchment texture.",
  world=HILLS, ambient=['crowd', 'wind'], base='#c8c0b0',
  layers=[
    heav([[8, 9, 10000], [9, 10, 11000], [10, 11, 12000]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 50, 'seed': 1710, 'sharp': 0.3, 'color': '#8a8a78', 'haze': 0.35, 'fog': 0.4},
    {'type': 'town', 'depth': 0.12, 'y': 690, 'x0': 100, 'x1': 1500, 's': P(0.12, 1) / 30, 'grade': 'town', 'lit': 0.2, 'haze': '#b8a898', 'seed': 1711},
    {'type': 'ground', 'depth': 0.2, 'y': 740, 'amp': 6, 'seed': 1712, 'color': '#8a9a5a', 'color2': '#5a6a3a', 'grass': True, 'grassColor': '#a8b468'},
    {'type': 'crowd', 'area': [-200, 1800, -2600, -1700], 'y': [FEET, 760], 'count': 180, 'size': P(0.36), 'color': '#ffd8a0', 'dim': 0.4, 'glow': 0.12, 'mill': 5, 'speed': 0, 'flicker': 0.3,
     'at': {'1': {'flicker': 0.05}, '2': {'flicker': 0.05}}},
    {'type': 'jeers', 'show': [0, 1], 'center': [860, 520], 'from': [1160, 380], 'clear': [100, 120], 'count': 16, 'size': 30, 'period': 6},
    {'type': 'chest', 'show': [1, None], 'depth': 0.43, 'x': 830, 'y': FEET + 10, 'w': P(0.43, 1.2), 'glow': 0.6, 'area': [700, 680, 960, 820],
     'at': {'1': {'move': {'path': [[260, -160, 0], [100, -60, 0], [0, 0, 0]], 'dur': 8000, 'delay': 400}}, '2': {'move': {'path': [[0, 0, 0]], 'dur': 1}}}},
    bearers,
    light([620, FEET + 12], P(0.44), depth=0.44, **prophet_d, at={'1': {'pose': 'raise'}}),
    light([1040, FEET + 12], P(0.44, 1.95), depth=0.44, **dim),
  ],
  beats=[
    {'dur': 11000, 'ambient': ['crowd', 'jeer'], 'cam': cam([820, 525, 700], [820, 730, -3000]),
     'say': "Long after Musa, the Children of Israel asked their prophet for a king to lead them in God's cause, and God chose Talut. How can he be king over us, they objected, when he has no great wealth?"},
    {'dur': 12000, 'ambient': ['crowd', 'air'], 'world': {'bloom': 0.95}, 'cam': cam([820, 520, 800], [820, 690, -3000]),
     'say': "God chose him and gave him knowledge and strength, their prophet said, and here is the sign: the chest will come to you, carried by angels, bringing tranquillity from your Lord and what was left by the families of Musa and Harun."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([820, 525, 750], [820, 720, -3000]), 'pendingVerse': pv('2:248')},
  ])

# ── Chapter 18 · The owners of the garden ────────────────────────────────
scene('harvest', 184.3, 18, 'wisdom', 'The Owners of the Garden', 'أصحاب البستان',
  art=["The parable of 68:17–33. The brothers and the poor appear only as dim figures of light. What came upon the garden by night is shown as the garden going dark, nothing more; that they lived near Sana'a is from the commentaries."],
  prompt="A rich orchard heavy with fruit at night, a few dim figures of light whispering together under the trees; a storm of darkness passing silently over it; then grey dawn, the same orchard blackened and bare as if reaped, the brothers kneeling among the ruined trees; ink-wash and parchment texture.",
  world=NIGHT, ambient=['crickets', 'wind'], base='#141824',
  layers=[
    heav([[22, 23, 10000], [23, 24, 10000], [5.2, 6.2, 11000], [6.2, 7, 12000]], horizon=650),
    {'type': 'ridge', 'depth': 0.04, 'y': 640, 'amp': 40, 'seed': 1720, 'sharp': 0.3, 'color': '#3a3a48', 'haze': 0.3, 'fog': 0.4, 'at': {'2': {'color': '#6a6870'}, '3': {'color': '#6a6870'}}},
    {'type': 'ground', 'depth': 0.14, 'y': 690, 'amp': 10, 'seed': 1721, 'color': '#3a4a2a', 'color2': '#1a2414', 'grass': True, 'grassColor': '#5a6a3a',
     'at': {'2': {'color': '#2a2420', 'color2': '#141210', 'grass': False}, '3': {'color': '#2a2420', 'color2': '#141210', 'grass': False}}},
    *[{'type': 'tree', 'depth': d, 'x': x, 'y': y, 'h': P(d, 5), 'kind': 'living', 'seed': 1722 + i, 'at': {'2': {'kind': 'bare'}, '3': {'kind': 'bare'}}}
      for i, (d, x, y) in enumerate(((0.22, 320, 730), (0.24, 560, 740), (0.24, 1080, 742), (0.26, 1320, 752), (0.3, 180, 772), (0.32, 1460, 780)))],
    {'type': 'storm', 'show': [1, 2], 'tone': 'dark', 'opacity': 0.8},
    *[light([700 + i * 70, FEET + 4], P(D, 1.7), depth=D, **dim, at={'3': {'pose': 'kneel'}}) for i in range(4)],
    motes(0.12),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['crickets', 'voices'], 'cam': cam([820, 520, 800], [820, 690, -3000]),
     'say': "The Quran tells of brothers who owned a fine garden. They swore that at dawn they would gather all its fruit, quietly, so that no poor person could come in and ask for a share."},
    {'dur': 9000, 'ambient': ['wind', 'storm'], 'cam': cam([800, 505, 1100], [800, 540, -3000]),
     'say': "But while they slept, something from their Lord passed over the garden."},
    {'dur': 11000, 'ambient': ['wind'], 'cam': cam([820, 520, 800], [820, 690, -3000]),
     'say': "At dawn they found it black and bare, as if already reaped. We are lost, they said. The fairest of them said: did I not tell you to remember God? Glory be to our Lord, they answered; we were the wrongdoers."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([820, 520, 850], [820, 680, -3000]), 'pendingVerse': pv('68:29')},
  ])

# ── Chapter 18 · The flood of the dam ────────────────────────────────────
dam = {'type': 'facade', 'depth': 0.08, 'x': 800, 'y': 640, 'w': P(0.08, 60), 'h': P(0.08, 14), 'stone': '#b8a080', 'light': 0.9, 'ppu': 1,
       'at': {'2': {'shatter': {'delay': 1800, 'dur': 5000, 'spread': 0.5, 'gravity': 1.0, 'spin': 0.3, 'floor': 660, 'cols': 9, 'rows': 3}}}}
garden_side = lambda x0, x1, seed: {'type': 'palms', 'depth': 0.18, 'items': [{'x': x, 'y': 740 + (i % 2) * 8, 'h': P(0.18, 8 + (i % 3)), 'lean': 0.04 * (1 if i % 2 else -1)}
                                                                             for i, x in enumerate(range(x0, x1, 70))], 'wither': 0, 'seed': seed,
                                   'at': {'3': {'wither': 1}, '4': {'wither': 1}}}
scene('dam', 184.6, 18, 'wisdom', 'The Flood of the Dam', 'انهيار السد',
  art=["The land of Saba (in Yemen) and the great dam of Ma'rib are as the commentaries describe; the Quran tells of the two gardens and the flood (34:15–17). No people are shown in the flood: only the dam breaking and the land changing."],
  prompt="A green valley in Yemen between two great orchards of palms, a long dam of dressed stone holding back a lake at its head; the dam cracking and bursting, a brown flood pouring down the valley; then the same valley years later, its gardens gone to thorn scrub and tamarisk; ink-wash and parchment texture.",
  world=SAND, ambient=['water', 'birds'], base='#d8c0a0',
  layers=[
    heav([[9, 10, 10000], [10, 11, 10000], [11, 11.6, 11000], [7, 17, 12000, 6]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 600, 'amp': 70, 'seed': 1730, 'sharp': 0.6, 'color': '#8a6a5a', 'haze': 0.4, 'fog': 0.4},
    {'type': 'peak', 'depth': 0.07, 'x': 160, 'y': 380, 'w': 900, 'h': 300, 'color': '#7a5a4a', 'lit': '#b08a70', 'seed': 1734},
    {'type': 'peak', 'depth': 0.07, 'x': 1440, 'y': 380, 'w': 900, 'h': 300, 'color': '#7a5a4a', 'lit': '#b08a70', 'seed': 1735},
    {'type': 'water', 'depth': 0.075, 'points': [[-3000, 600], [800, 602], [4600, 604]], 'w0': 70, 'w1': 70, 'show': [0, 3], 'reflect': [['0', '#b8d0d8'], ['1', '#4a6a7a']]},
    dam,
    {'type': 'ground', 'depth': 0.16, 'y': 700, 'amp': 8, 'seed': 1731, 'color': '#7a9a4a', 'color2': '#4a6a32', 'grass': True, 'grassColor': '#9ab45a',
     'at': {'3': {'color': '#a89070', 'color2': '#7a6448', 'grass': False, 'cracks': True}}},
    {'type': 'water', 'show': [2, 3], 'depth': 0.12, 'points': [[800, 650], [780, 700], [820, 780], [800, 950]], 'w0': 60, 'w1': 900, 'reflect': [['0', '#a88a68'], ['1', '#5a4430']],
     'reveal': {'dir': 'down', 'dur': 4000, 'delay': 2800}},
    garden_side(-200, 560, 1732), garden_side(1040, 1800, 1733),
    dust(box=(-600, 100, -7000, 2200, 700, -5000), count=500, size=16, color='#c8b098', opacity=0.4, wind=(0, 20, 0), swirl=80, blend='normal', show=[2, 3]),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['water', 'birds'], 'cam': cam([800, 505, 1100], [800, 520, -3000]),
     'say': "In Saba, in the land of Yemen, there were two great gardens, to the right and to the left, watered from a mighty dam. Eat of your Lord's provision, they were told, and be grateful to Him: a good land, and a forgiving Lord."},
    {'dur': 9000, 'ambient': ['water', 'voices'], 'cam': cam([800, 505, 1100], [800, 520, -3000]),
     'say': "But they turned away."},
    {'dur': 10000, 'ambient': ['roar', 'water'], 'sfx': [{'name': 'rumble', 'at': 1500}, {'name': 'wave', 'at': 2600}], 'world': {'shake': 1.4},
     'cam': cam([800, 505, 1100], [800, 520, -3000]),
     'say': "So God sent upon them the flood of the dam."},
    {'dur': 12000, 'ambient': ['wind'], 'world': {'shake': 0.3}, 'cam': cam([800, 505, 1100], [800, 530, -3000]),
     'say': "In place of their two gardens grew bitter fruit, tamarisk and a few lote trees: the reward of ingratitude."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([800, 505, 1100], [800, 530, -3000]), 'pendingVerse': pv('34:16')},
  ])

# ── Chapter 18 · The town of the messengers (Ya-Sin) ─────────────────────
scene('yasin', 185.5, 18, 'wisdom', 'The Town of the Messengers', 'المدينة والرسل',
  art=["The messengers, the townspeople and the man who came running appear only as lights. His death is shown only as his light rising; Paradise is not depicted. That he was named Habib is from the commentaries (36:13–29)."],
  prompt="A walled town at evening, three steady lights standing in the square before a jeering crowd of dim lights; one warm light running the length of the long street from the far edge of the town; then that light rising softly into the sky; then a single white flash and every light in the town gone out, the streets silent; ink-wash and parchment texture.",
  world=SAND, ambient=['crowd', 'jeer'], base='#d8c0a0',
  layers=[
    heav([[16, 17, 10000], [17, 17.6, 10000], [17.6, 18.2, 10000], [18.2, 19, 12000]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 40, 'seed': 1740, 'sharp': 0.3, 'color': '#9a8070', 'haze': 0.35, 'fog': 0.4},
    {'type': 'town', 'depth': 0.12, 'y': 690, 'x0': -100, 'x1': 1700, 's': P(0.12, 1) / 30, 'grade': 'town', 'lit': 0.35, 'haze': '#c8a888', 'seed': 1741, 'at': {'3': {'lit': 0}}},
    {'type': 'ground', 'depth': 0.2, 'y': 740, 'amp': 4, 'seed': 1742, 'color': '#c0a07a', 'color2': '#9a7a58'},
    {'type': 'crowd', 'area': [700, 1700, -2400, -1700], 'y': [FEET, 760], 'count': 140, 'size': P(0.36), 'color': '#ffd8a0', 'dim': 0.4, 'glow': 0.12, 'mill': 5, 'speed': 0, 'flicker': 0.35,
     'at': {'2': {'out': 1, 'outDur': 2500}, '3': {'out': 1, 'outDur': 1}}},
    {'type': 'jeers', 'show': [0, 2], 'center': [760, 520], 'from': [1160, 380], 'clear': [90, 110], 'count': 22, 'size': 32, 'period': 6},
    *[light([560 + i * 60, FEET + 10], P(0.44), depth=0.44, **prophet_d) for i in range(3)],
    light([1500, FEET + 4], P(0.43), depth=0.43, color='#fff0d8', glow=0.35, bright=1.1, solid=0.5, pose='walk', path=[[1500, FEET + 4], [880, FEET + 8]], dur=7000, delay=300,
          at={'1': {'pose': 'raise', 'path': [[880, FEET + 8, Z(0.43)], [880, FEET + 8, Z(0.43)], [900, 300, Z(0.43) - 3000]], 'dur': 9000, 'delay': 2500}, '2': {'pose': 'gone'}, '3': {'pose': 'gone'}}),
    {'type': 'flash', 'show': [2, 3], 'color': '#fffaf0', 'peak': 0.55, 'delay': 300, 'rise': 150, 'dur': 2200},
  ],
  beats=[
    {'dur': 11000, 'ambient': ['crowd', 'jeer'], 'cam': cam([860, 520, 800], [880, 690, -3000]),
     'say': "The Quran tells of a town to which God sent two messengers, then a third to strengthen them. You are only men like us, the people said; we see an evil omen in you, and if you do not stop, we will stone you. Then a man came running from the far end of the town: my people, follow the messengers!"},
    {'dur': 11000, 'ambient': ['air'], 'world': {'bloom': 0.95}, 'cam': cam([860, 505, 1000], [880, 520, -3000]),
     'say': "They killed him for his faith. Enter Paradise, he was told; and he said: if only my people knew how my Lord has forgiven me and honoured me."},
    {'dur': 9000, 'ambient': ['wind'], 'sfx': [{'name': 'thunder', 'at': 300}], 'cam': cam([860, 515, 950], [880, 640, -3000]),
     'say': "After him, no army from heaven was needed: there was only one cry, and they were extinguished."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([860, 515, 950], [880, 640, -3000]), 'pendingVerse': pv('36:20')},
  ])
print('extras2 ok')
