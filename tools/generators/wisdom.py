from extras import scene, pv, P, Z, D, FEET, HILLS, NIGHT, SAND, prophet_d, prophet_n, soft, dim, cold, heav, motes, SUN, MOON
from base import *

# Chapter 18 · Stories of Wisdom: stories the Quran tells whose time is uncertain, or which stand outside
# the line of prophets. Fractional orders after 172 until renum.py numbers them.
C = 18
youth = dict(color='#fff0dc', glow=0.3, bright=1.05, solid=0.5)
king = dict(color='#f0d8a8', glow=0.35, bright=1.1, solid=0.5)          # Dhul-Qarnayn, a righteous king
CAVE = {'fog': '#16120e', 'fogNear': 3000, 'fogFar': 26000, 'light': 0.9, 'rays': 0, 'bloom': 0.85, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}


def cave_mouth():
    return [
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#120e0a'], [1, '#0a0806']]},
        {'type': 'facade', 'depth': 0.2, 'x': 800, 'y': 760, 'w': 2600, 'h': 1100, 'stone': '#4a4036', 'light': 0.6,
         'doors': [{'x': 800, 'w': P(0.2, 6), 'h': P(0.2, 5), 'lit': True}]},
        {'type': 'ground', 'depth': 0.3, 'y': 800, 'amp': 12, 'seed': 1600, 'color': '#3a3228', 'color2': '#18140e'},
    ]


sleepers = [light([560 + i * 80, FEET + 12 + (i % 2) * 6], P(0.43), depth=0.43, **youth, pose='babe', w=1.0) for i in range(7)]
dog = {'type': 'animals', 'depth': 0.36, 'fade': 'none', 'area': [700, 700, 900, 812], 'pairs': [{'kind': 'dog', 'solo': True, 's': 0.9, 'path': [[800, 806]], 'face': -1}]}

# ── The sleepers of the cave ──────────────────────────────────────────────
scene('cave', 172.1, C, 'wisdom', 'The Sleepers of the Cave', 'فتية الكهف',
  art=["The youths appear only as soft lights; their number (seven, with a dog) is one of the counts the Quran mentions (18:22), and God knows best. That they fled a king who forced idol-worship is from the commentaries.",
       "The years passing are shown as days and nights racing across the cave's mouth."],
  prompt="Night in rocky hills, seven young soft lights and a dog climbing to the dark mouth of a cave; inside, the lights lying asleep along the cave floor, the dog stretched across the threshold; the sky beyond the cave mouth flickering through countless days and nights as the years pass; ink-wash and parchment texture.",
  world=CAVE, ambient=['wind', 'air'], base='#0c0a08', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 1], 'layers': [
      heav([[23, 23.6, 10000]], horizon=640),
      {'type': 'peak', 'depth': 0.08, 'x': 900, 'y': 280, 'w': 1200, 'h': 520, 'color': '#2e2a30', 'lit': '#5a5258', 'seed': 1601},
      {'type': 'facade', 'depth': 0.2, 'x': 980, 'y': 720, 'w': P(0.2, 4), 'h': P(0.2, 3), 'stone': '#2a2420', 'light': 0.4, 'doors': [{'x': 980, 'w': P(0.2, 2.4), 'h': P(0.2, 2.6)}]},
      {'type': 'ground', 'depth': 0.26, 'y': 770, 'amp': 18, 'seed': 1602, 'color': '#3a3430', 'color2': '#1a1612'},
      *[light([620 + i * 50, FEET], P(D), depth=D, **youth, pose='walk', path=[[500 + i * 50, FEET + 8], [860 + i * 20, FEET - 10]], dur=10000, delay=i * 200) for i in range(7)],
    ]},
    {'type': 'set', 'show': [1, None], 'dx': 6000, 'layers': [
      heav([[6, 18, 10000], [6, 18, 12000, 40], [6, 9, 12000]], horizon=760),
      *cave_mouth(),
      dog, *sleepers,
    ]},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['wind'], 'cam': cam([820, 500, 1000], [840, 560, -3000]),
     'say': "Long ago a band of young men refused to worship their people's idols. Fleeing for their faith, they took refuge in a cave, and prayed: our Lord, grant us mercy from Yourself, and guide us rightly."},
    {'dur': 13000, 'ambient': ['wind', 'air'], 'cam': cam([800, 540, 500], [800, 860, -3000], dx=6000),
     'say': "God made them sleep, with their dog stretched across the entrance; and they slept on while the sun passed the cave mouth day after day, for three hundred years and nine."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([800, 535, 600], [800, 820, -3000], dx=6000), 'pendingVerse': pv('18:10')},
  ])

# ── The awakening ─────────────────────────────────────────────────────────
scene('awakening', 172.2, C, 'wisdom', 'The Awakening', 'اليقظة',
  art=["The youths and the townspeople appear only as soft and dim lights. The silver coin is from 18:19."],
  prompt="Morning in the cave, seven soft lights sitting up, puzzled; one of them walking down into a town he no longer knows, new domes and walls, crowds of dim lights gathering in wonder around a small glint of old silver in his hand; ink-wash and parchment texture.",
  world=CAVE, ambient=['air', 'birds'], base='#0c0a08', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 1], 'layers': [
      heav([[7, 8, 10000]], horizon=760),
      *cave_mouth(), dog,
      *[light([560 + i * 80, FEET + 12 + (i % 2) * 6], P(0.43), depth=0.43, **youth, pose='kneel') for i in range(7)],
    ]},
    {'type': 'set', 'show': [1, None], 'dx': 6000, 'layers': [
      heav([[9, 10, 10000], [10, 11, 12000]]),
      {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 40, 'seed': 1610, 'sharp': 0.3, 'color': '#8a8070', 'haze': 0.35, 'fog': 0.4},
      {'type': 'town', 'depth': 0.12, 'y': 690, 'x0': 0, 'x1': 1600, 's': P(0.12, 1) / 30, 'grade': 'town', 'lit': 0.2, 'haze': '#b8a898', 'seed': 1611, 'ruin': 1},
      {'type': 'ground', 'depth': 0.2, 'y': 740, 'amp': 4, 'seed': 1612, 'color': '#b0a080', 'color2': '#8a7a5a'},
      {'type': 'crowd', 'area': [200, 1400, -2400, -1600], 'y': [FEET, 770], 'count': 90, 'size': P(0.36), 'color': '#ffd8a0', 'dim': 0.4, 'glow': 0.12, 'mill': 4, 'speed': 0,
       'at': {'2': {'area': [600, 1000, -1800, -1500]}}},
      light([800, FEET + 10], P(0.44), depth=0.44, **youth),
      {'type': 'light', 'kind': 'flame', 'depth': 0.441, 'h': 7, 'color': '#e8eef8', 'glow': 1.4, 'pos': [826, FEET - 52]},
    ]},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['air', 'birds'], 'cam': cam([800, 540, 500], [800, 860, -3000]),
     'say': "When God woke them, they asked one another: how long have we slept? A day, or part of a day. They sent one of them to the town with a silver coin to buy food, quietly."},
    {'dur': 11000, 'ambient': ['city', 'voices'], 'cam': cam([800, 525, 700], [800, 740, -3000], dx=6000),
     'say': "But the town had changed; centuries had passed, and the coin was ancient. The people now believed, and their story became a sign that God's promise of resurrection is true."},
    {'dur': 12000, 'ambient': ['city', 'air'], 'cam': cam([800, 520, 850], [800, 690, -3000], dx=6000), 'pendingVerse': pv('18:21', 'to "and that of the Hour there is no doubt"')},
  ])

# ── Dhul-Qarnayn: the setting and the rising sun ──────────────────────────
scene('qarnayn', 172.3, C, 'wisdom', 'Dhul-Qarnayn', 'ذو القرنين',
  art=["Dhul-Qarnayn, a righteous king given power on earth (18:83–84), appears only as a warm figure of light with his army of dim lights; who he was is debated. The sun is shown setting into dark water as it appeared to him (18:86)."],
  prompt="A vast western shore at sunset, a great red sun sinking into a dark muddy sea, a warm figure of light with ranks of an army halted on the shore; then the far east at sunrise, a bare plain where people of dim light live with no shelter from the sun; ink-wash and parchment texture.",
  world=SAND, ambient=['wind', 'army'], base='#d8c0a0', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 1], 'layers': [
      heav([[16.6, 18, 11000]], sun={'rise': 6, 'set': 18, 'x0': 1300, 'x1': 820, 'peak': 300, 'size': 44}, horizon=640),
      {'type': 'water', 'depth': 0.08, 'points': [[-6000, 664], [800, 668], [8000, 672]], 'w0': 70, 'w1': 70, 'reflect': [['0', '#8a5a40'], ['1', '#2a1e18']]},
      {'type': 'ground', 'depth': 0.2, 'y': 730, 'amp': 6, 'seed': 1620, 'color': '#6a5a48', 'color2': '#3a3028'},
      {'type': 'crowd', 'kind': 'army', 'area': [200, 900, -3200, -2400], 'y': [FEET - 6, 770], 'rows': 6, 'cols': 16, 'size': P(0.3), 'color': '#e8d8b8', 'dim': 0.3, 'glow': 0.3},
      light([1000, FEET + 10], P(0.44), depth=0.44, **king),
    ]},
    {'type': 'set', 'show': [1, None], 'dx': 6000, 'layers': [
      heav([[5.6, 7, 11000], [7, 8, 12000]], sun={'rise': 6, 'set': 18, 'x0': 780, 'x1': 300, 'peak': 300, 'size': 44}, horizon=650),
      {'type': 'ground', 'depth': 0.08, 'y': 660, 'amp': 4, 'seed': 1621, 'color': '#d8b888', 'color2': '#a8885e'},
      {'type': 'ground', 'depth': 0.24, 'y': 752, 'amp': 4, 'seed': 1622, 'color': '#c8a878', 'color2': '#9a7a52'},
      {'type': 'crowd', 'area': [-200, 1800, -3400, -2400], 'y': [FEET - 6, 760], 'count': 60, 'size': P(0.28), 'color': '#ffd8a0', 'dim': 0.4, 'glow': 0.1, 'mill': 6, 'speed': 0},
      light([1000, FEET + 10], P(0.44), depth=0.44, **king),
    ]},
  ],
  beats=[
    {'dur': 11000, 'ambient': ['wind', 'army'], 'cam': cam([900, 505, 1000], [900, 540, -3000]),
     'say': "The Quran tells of Dhul-Qarnayn, a king to whom God gave power and a way to reach all things. He travelled west until he saw the sun setting, as if into a dark, muddy spring."},
    {'dur': 10000, 'ambient': ['wind'], 'cam': cam([900, 505, 1000], [900, 540, -3000], dx=6000),
     'say': "Then he travelled east, to where the sun rose over a people who had no shelter from it. Everywhere he went, he ruled with justice: the wrongdoer punished, the one who did good rewarded."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([900, 510, 950], [900, 560, -3000], dx=6000), 'pendingVerse': pv('18:84')},
  ])

# ── Dhul-Qarnayn: the wall of iron ───────────────────────────────────────
scene('ironwall', 172.4, C, 'wisdom', 'The Wall of Iron', 'السد',
  art=["Dhul-Qarnayn and the people appear only as lights. Gog and Magog (Ya'juj and Ma'juj) are never shown: only the wall that holds them back (18:94–98)."],
  prompt="A narrow pass between two towering mountains, people of dim light carrying blocks of iron and stacking them course by course between the mountain walls, great fires blown with bellows against the iron until it glows, molten copper poured over it; then a solid, shining wall closing the pass from cliff to cliff; ink-wash and parchment texture.",
  world=SAND, ambient=['work', 'fire'], base='#2a2220',
  layers=[
    heav([[15, 16, 10000], [16, 17.4, 10000], [17.4, 18.4, 10000], [18.4, 19, 12000]], horizon=600),
    {'type': 'peak', 'depth': 0.12, 'x': 260, 'y': 160, 'w': 760, 'h': 620, 'color': '#3a3440', 'lit': '#6a5a60', 'seed': 1630},
    {'type': 'peak', 'depth': 0.12, 'x': 1340, 'y': 150, 'w': 760, 'h': 630, 'color': '#3a3440', 'lit': '#6a5a60', 'seed': 1631},
    {'type': 'masonry', 'depth': 0.16, 'pos': [800, 760], 'w': P(0.16, 44), 'h': P(0.16, 22), 'side': 0, 'courses': 12, 'blocks': 16, 'built': 0.1,
     'stone': '#4a4a52', 'stone2': '#5a5a64', 'ink': '#1a1a20', 'at': {'0': {'build': [0.1, 0.6, 10000]}, '1': {'build': [0.6, 1, 9000]}, '2': {'built': 1, 'stone': '#b0683a', 'stone2': '#c87a44'}, '3': {'built': 1, 'stone': '#8a5a3a', 'stone2': '#a06a44'}}},
    *[{'type': 'fire', 'show': [1, 3], 'depth': 0.2, 'pos': [x, 760], 'w': P(0.2, 4), 'h': P(0.2, 5), 'heat': 1.1} for x in (560, 800, 1040)],
    {'type': 'crowd', 'area': [200, 1400, -2400, -1700], 'y': [FEET, 770], 'count': 110, 'size': P(0.36), 'color': '#ffd8a0', 'dim': 0.4, 'glow': 0.12, 'flow': [1, 0], 'speed': 20, 'mill': 3,
     'at': {'3': {'speed': 0, 'mill': 4}}},
    light([800, FEET + 14], P(0.44), depth=0.44, **king, at={'1': {'pose': 'raise'}}),
    dust(box=(-600, 0, -5000, 2200, 900, -2000), count=400, size=5, color='#ffb060', opacity=0.5, wind=(0, 40, 0), swirl=60, show=[1, 3]),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['work', 'wind'], 'sfx': [{'name': 'hoe', 'at': 1500}, {'name': 'hoe', 'at': 4500}], 'cam': cam([800, 500, 1100], [800, 520, -3000]),
     'say': "Between two mountains he found a people who begged him: Ya'juj and Ma'juj spread corruption in the land. Build a barrier between us and them, and we will pay you."},
    {'dur': 11000, 'ambient': ['fire', 'work'], 'cam': cam([800, 500, 1050], [800, 520, -3000]),
     'say': "What my Lord has given me is better, he said; help me only with your strength. Bring me blocks of iron. When the gap was filled, he said: blow on the fires! until the iron glowed like fire;"},
    {'dur': 10000, 'ambient': ['fire', 'air'], 'cam': cam([800, 500, 1100], [800, 510, -3000]),
     'say': "then he poured molten copper over it. They could not climb it, and they could not dig through it."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([800, 505, 1100], [800, 520, -3000]), 'pendingVerse': pv('18:98')},
  ])

# ── The two gardens ───────────────────────────────────────────────────────
palms = lambda wither: {'type': 'palms', 'depth': 0.26, 'items': [{'x': x, 'y': 770 + (i % 2) * 6, 'h': P(0.26, 8 + (i % 3)), 'lean': 0.04 * (1 if i % 2 else -1)} for i, x in enumerate((220, 340, 1260, 1380, 1500))],
                        'wither': wither, 'seed': 1640, 'at': {'2': {'wither': 1}, '3': {'wither': 1}}}
scene('gardens', 172.5, C, 'wisdom', 'The Two Gardens', 'صاحب الجنتين',
  art=["The parable of 18:32–44. The two men appear only as dim figures of light. The ruin of the gardens is shown as the vines and palms withering overnight."],
  prompt="Two lush walled gardens of grapevines ringed with date palms, a river running between them; a proud dim light strolling among the vines beside a humbler light; then the same gardens at dawn ruined, palms bare and vines withered, the proud light on his knees wringing his hands; ink-wash and parchment texture.",
  world=HILLS, ambient=['water', 'birds'], base='#c8c0b0',
  layers=[
    heav([[9, 10, 10000], [10, 11, 10000], [5.4, 6.4, 10000], [6.4, 7.4, 12000]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 40, 'seed': 1641, 'sharp': 0.3, 'color': '#8a8a7a', 'haze': 0.35, 'fog': 0.4},
    {'type': 'ground', 'depth': 0.14, 'y': 690, 'amp': 10, 'seed': 1642, 'color': '#7a9a4a', 'color2': '#4a6a32', 'grass': True, 'grassColor': '#9ab45a',
     'at': {'2': {'color': '#9a8a5a', 'color2': '#6a5a3a', 'grass': False, 'cracks': True}, '3': {'color': '#9a8a5a', 'color2': '#6a5a3a', 'grass': False, 'cracks': True}}},
    {'type': 'water', 'depth': 0.2, 'points': [[800, 690], [780, 740], [820, 820], [800, 950]], 'w0': 20, 'w1': 120, 'reflect': [['0', '#b8d0d8'], ['1', '#4a6a7a']]},
    {'type': 'ground', 'depth': 0.24, 'y': 760, 'amp': 4, 'seed': 1643, 'x0': -600, 'x1': 2200, 'color': '#5a7a3a', 'color2': '#3a5a2a', 'crop': 'shoots', 'field': {'x0': -400, 'x1': 2000, 'y0': 742, 'y1': 800},
     'at': {'2': {'crop': 'dry'}, '3': {'crop': 'dry'}}},
    palms(0),
    light([620, FEET + 6], P(D), depth=D, color='#e8c070', glow=0.3, bright=1.05, solid=0.6, at={'2': {'pose': 'kneel'}, '3': {'pose': 'kneel'}}),
    light([520, FEET + 8], P(D), depth=D, **dim),
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['water', 'birds'], 'cam': cam([760, 520, 800], [760, 690, -3000]),
     'say': "The Quran tells a parable of two men. To one, God gave two gardens of grapevines, ringed with date palms, with a river running between them."},
    {'dur': 11000, 'ambient': ['water', 'voices'], 'cam': cam([640, 530, 600], [640, 760, -3000]),
     'say': "I have more wealth than you, he boasted to his friend; I do not think this will ever perish, nor that the Hour will come. His friend said: say rather, what God wills; there is no power except with God."},
    {'dur': 11000, 'ambient': ['wind'], 'cam': cam([760, 520, 800], [760, 690, -3000]),
     'say': "By morning his fruit was destroyed, the vines fallen on their trellises. He wrung his hands over all he had spent: if only I had not set anything beside my Lord."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([760, 520, 850], [760, 680, -3000]), 'pendingVerse': pv('18:42')},
  ])

# ── A hundred years ───────────────────────────────────────────────────────
donkey = {'type': 'animals', 'depth': D, 'fade': 'none', 'area': [880, 680, 1080, 820], 'pairs': [{'kind': 'donkey', 'solo': True, 's': round(1.3 * 150 * D / 96, 2), 'path': [[980, FEET + 6]], 'face': -1}],
          'at': {'1': {'reveal': None}, '2': {'reveal': {'dir': 'up', 'dur': 6000, 'delay': 600}}}}
scene('hundred', 172.6, C, 'wisdom', 'A Hundred Years', 'قرن من النوم',
  art=["That the man was 'Uzayr (Ezra) passing ruined Jerusalem is from the commentaries on 2:259; he and the people appear only as lights. His death is shown as his light going out; the donkey is drawn back in by God's leave, nothing more."],
  prompt="A man's steady light with his donkey and a basket of figs stopping by a ruined, empty town of fallen stone; his light going out as the sky races through a century; then dawn, the light kindled again, the figs still fresh, the donkey drawn back stroke by stroke, and the town rebuilt and alive; ink-wash and parchment texture.",
  world=HILLS, ambient=['wind', 'air'], base='#c8c0b0',
  layers=[
    heav([[15, 16.4, 10000], [6, 18, 12000, 60], [5.4, 6.8, 11000], [6.8, 8, 12000]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 40, 'seed': 1650, 'sharp': 0.3, 'color': '#8a8070', 'haze': 0.35, 'fog': 0.4},
    {'type': 'ground', 'depth': 0.14, 'y': 690, 'amp': 10, 'seed': 1651, 'color': '#a89a78', 'color2': '#7a6a52'},
    {'type': 'masonry', 'depth': 0.2, 'pos': [1060, 724], 'w': P(0.2, 34), 'h': P(0.2, 12), 'side': 40, 'courses': 12, 'blocks': 20, 'built': 0.25,
     'stone': '#c8b898', 'stone2': '#d8c8a8', 'ink': '#5a5040', 'at': {'2': {'build': [0.25, 1, 9000, 1500]}, '3': {'built': 1}}},
    {'type': 'basket', 'depth': D + 0.005, 'x': 860, 'y': FEET + 16, 'w': P(D, 0.6), 'area': [820, 770, 900, 820]},
    {'type': 'fruit', 'depth': D + 0.006, 'x': 860, 'y': FEET + 8, 'w': P(D, 0.45), 'glow': 0.3, 'area': [820, 740, 900, 810]},
    {**donkey, 'show': [[0, 1], [2, None]]},
    light([780, FEET + 8], P(D), depth=D, **prophet_d, at={'1': {'pose': 'gone'}, '2': {'pose': 'stand'}, '3': {'pose': 'raise'}}),
    {'type': 'flash', 'show': [2, 3], 'color': '#fffaf0', 'peak': 0.25, 'delay': 400, 'rise': 300, 'dur': 2000},
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['wind'], 'cam': cam([900, 520, 750], [920, 700, -3000]),
     'say': "A man passed by a town lying in ruins, its roofs fallen in. How, he wondered, will God ever bring this back to life after its death?"},
    {'dur': 11000, 'ambient': ['wind', 'air'], 'cam': cam([900, 515, 900], [920, 660, -3000]),
     'say': "So God caused him to die for a hundred years."},
    {'dur': 12000, 'ambient': ['birds', 'air'], 'cam': cam([900, 525, 650], [920, 730, -3000]),
     'say': "Then He raised him. How long have you stayed? A day or part of a day. No, a hundred years. Look at your food, not even spoiled; and look at your donkey, as We bring it back to life."},
    {'dur': 12000, 'ambient': ['birds', 'air'], 'cam': cam([920, 520, 800], [940, 690, -3000]), 'pendingVerse': pv('2:259', 'its closing: "I know that Allah is over all things competent"')},
  ])

# ── Luqman's advice ───────────────────────────────────────────────────────
scene('luqman', 172.7, C, 'wisdom', "Luqman's Advice", 'وصية لقمان',
  art=["Luqman, a wise man given wisdom by God (31:12), and his son appear only as soft lights; that he lived in the time of Dawud is from the commentaries. The mustard seed hidden in a rock is shown as the Quran's image (31:16)."],
  prompt="An old soft light and a young one sitting beneath a spreading tree on a hillside at evening, the father's arm raised as he teaches; then a close view of a great grey rock with, deep in its heart, the faint glow of a single tiny mustard seed; ink-wash and parchment texture.",
  world=HILLS, ambient=['wind', 'birds'], base='#c8c0b0', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [[0, 2], [3, None]], 'layers': [
      heav([[16.6, 17.4, 10000], [17.4, 18, 10000], None, [18, 18.8, 12000]]),
      # Luqman's hillside: dry upland grass under far flat-topped hills (its own place, not the green hills of Galilee)
      {'type': 'ridge', 'depth': 0.04, 'y': 610, 'amp': 60, 'seed': 1660, 'sharp': 0.12, 'color': '#9a8478', 'haze': 0.35, 'fog': 0.4},
      {'type': 'ridge', 'depth': 0.08, 'y': 660, 'amp': 26, 'seed': 1664, 'sharp': 0.2, 'color': '#a8946a', 'haze': 0.25, 'fog': 0.3},
      {'type': 'ground', 'depth': 0.14, 'y': 690, 'amp': 10, 'seed': 1661, 'color': '#aa9a62', 'color2': '#6e5e3a', 'grass': True, 'grassColor': '#c8b878'},
      {'type': 'tree', 'depth': 0.34, 'x': 940, 'y': 796, 'h': P(0.34, 8), 'kind': 'living', 'seed': 1662},
      light([840, FEET + 8], P(D, 1.65), depth=D, color='#fff0dc', glow=0.35, bright=1.1, solid=0.5, pose='kneel', at={'1': {'pose': 'raise'}}),
      light([960, FEET + 10], P(D, 1.3), depth=D, **dim, pose='kneel'),
      motes(),
    ]},
    {'type': 'set', 'show': [2, 3], 'dx': 6000, 'layers': [
      {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#3a3430'], [1, '#1a1612']]},
      {'type': 'outcrop', 'depth': 0.3, 'x': 800, 'y': 820, 'w': P(0.3, 10), 'h': P(0.3, 6), 'shape': 'dome', 'seed': 1663, 'ppu': 0.9},
      {'type': 'light', 'kind': 'flame', 'depth': 0.305, 'pos': [800, 700], 'h': 5, 'color': '#ffe8a0', 'glow': 1.6},
    ]},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['wind', 'birds'], 'cam': cam([880, 525, 650], [900, 740, -3000]),
     'say': "God gave wisdom to a man named Luqman. He counselled his son: do not associate anything with God; that is a great wrong. Be good to your parents, and thank Me and them."},
    {'dur': 11000, 'ambient': ['wind'], 'cam': cam([880, 530, 550], [900, 770, -3000]),
     'say': "Establish prayer, call to what is good, and bear patiently what befalls you. Do not turn your cheek away from people in pride, walk modestly, and lower your voice."},
    {'dur': 11000, 'ambient': ['air'], 'world': {'bloom': 1.0}, 'cam': cam([800, 520, 300], [800, 740, -3000], dx=6000),
     'say': "Even a deed the weight of a mustard seed, hidden inside a rock, or anywhere in the heavens or the earth, God will bring it out. God is subtle and aware of all things."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([880, 525, 750], [900, 710, -3000]), 'pendingVerse': pv('31:16')},
  ])


# ── The town by the sea ───────────────────────────────────────────────────
# 7:163-166: a town on the coast whose people broke the sabbath; those who warned them; and what
# came of it. The town is drawn with the `israelite` grade (dressed limestone, terraced roofs), because
# tradition places it in the time of Dawud. Nothing of what the Quran says happened to them afterwards
# is shown: the town's lights simply go out, and that is all.
SEA = {'fog': '#c4ccd0', 'fogNear': 6000, 'fogFar': 46000, 'light': 1.02, 'rays': 0, 'bloom': 0.62, 'haze': 0.1, 'hazeY': 0.62, 'shake': 0.3, 'dof': 0}


def harbour(seed=1900, lit=0.3, walls=True):
    """The town by the sea: a low shore, a walled town of dressed stone above it, the gulf in front."""
    return [
        {'type': 'ridge', 'depth': 0.03, 'y': 604, 'amp': 34, 'seed': seed, 'sharp': 0.3, 'color': '#8a8a90', 'haze': 0.4, 'fog': 0.5},
        {'type': 'water', 'depth': 0.06, 'mode': 'sea', 'level': 662, 'reflect': [['0', '#a8c0cc'], ['1', '#3a5568']]},
        {'type': 'town', 'depth': 0.1, 'y': 648, 'x0': -40, 'x1': 1640, 's': P(0.1, 1) / 30, 'grade': 'israelite', 'lit': lit, 'haze': '#b8b4ac', 'seed': seed + 1},
        {'type': 'ground', 'depth': 0.18, 'y': 704, 'amp': 4, 'seed': seed + 2, 'color': '#c2b294', 'color2': '#8e8064'},
    ]


scene('sabbath', 186.1, C, 'wisdom', 'The Day of the Fish', 'يوم السمك',
  art=["The people of the town appear only as dim figures of light. The town is drawn with the israelite grade, its dressed limestone and terraced roofs of the kind built in the Levant, because tradition places this town in the time of Dawud.",
       "That the fish came openly on the sabbath day, and that some set their nets and channels the day before and drew them in the day after, is from the commentaries on 7:163.",
       "No number of fish, boats or people is shown. Nothing of what the Quran says came afterwards is shown here; the town's lights simply go out."],
  prompt="A small harbour town of pale dressed stone on a gulf, its quay and boats below, a bright afternoon; the water by the boats suddenly covered with a shimmer of silver fish that comes right up to the shore, while the water further out is empty; then the sun going down and the same town at evening, its quay bare, the sea calm and without a shimmer; ink-wash and parchment texture.",
  world=SEA, ambient=['sea', 'birds'], base='#c4ccd0',
  layers=[
    heav([[13.4, 14.4, 10000], [14.4, 15.4, 10000], [15.4, 16.4, 12000]]),
    *harbour(),
    {'type': 'ground', 'depth': 0.3, 'y': 760, 'amp': 4, 'seed': 1910, 'x0': -600, 'x1': 2200, 'color': '#c8b898', 'color2': '#96866a'},
    # the shimmer of fish: many small silver points along the water's edge, only on the sabbath day
    {'type': 'crowd', 'depth': 0.2, 'area': [-200, 1800, -5400, -4600], 'y': [660, 656], 'count': 150, 'size': 7, 'color': '#e8f0f4', 'dim': 0.1, 'glow': 0.5, 'mill': 0, 'speed': 0, 'flicker': 0.3,
     'at': {'1': {'glow': 0.0, 'dim': 0.0}, '2': {'glow': 0.0, 'dim': 0.0}}},
    {'type': 'crowd', 'area': [-100, 1500, -2600, -1900], 'y': [FEET, 780], 'count': 70, 'size': P(0.34), 'color': '#ffd8a0', 'dim': 0.4, 'glow': 0.12, 'mill': 5, 'speed': 0, 'flicker': 0.3,
     'at': {'2': {'out': 1, 'outDur': 2500}}},
    motes(0.16),
  ],
  beats=[
    {'dur': 11000, 'ambient': ['sea', 'birds'], 'cam': cam([800, 520, 1000], [800, 620, -3000]),
     'say': "The Quran asks about a town by the sea whose people broke their day of rest. On that day their fish came to them openly, all along the shore; on the other days, they did not come."},
    {'dur': 11000, 'ambient': ['sea', 'air'], 'cam': cam([800, 535, 620], [800, 660, -3000]),
     'say': "They had found a way to keep the letter of the rule and break its trust: some of them set their nets and channels the day before and drew them in the day after, and took their catch in between."},
    {'dur': 12000, 'ambient': ['sea', 'air'], 'cam': cam([800, 525, 850], [800, 640, -3000]),
     'verse': {'ref': '7:163', 'ar': [11, 28], 'place': 'sky',
               'en': "…when their fish came to them openly on their sabbath day, and the day they had no sabbath they did not come to them. Thus did We give them trial because they were defiantly disobedient."}},
  ])

scene('warned', 186.2, C, 'wisdom', 'Those Who Warned', 'الواعظون',
  art=["Everyone appears only as a light. The Quran tells of three groups (7:164-165): those who broke the sabbath, those who warned them, and some who asked why they still warned. How they stood on the shore is imagined.",
       "The look of the town is imagined: dressed limestone houses of the Levant in the time of Dawud."],
  prompt="A harbour town at evening, its quay and its low stone houses; on the shore three groups of dim lights standing apart from one another, one group standing together and facing the town; ink-wash and parchment texture.",
  world=SEA, ambient=['sea', 'voices'], base='#c0c4c4',
  layers=[
    heav([[16.4, 17.4, 10000], [17.4, 18.2, 10000], [18.2, 19, 12000]]),
    *harbour(seed=1920, lit=0.35),
    {'type': 'ground', 'depth': 0.3, 'y': 762, 'amp': 4, 'seed': 1923, 'x0': -600, 'x1': 2200, 'color': '#c0aa8a', 'color2': '#8c7c60'},
    # the town: the people who broke the sabbath, gathered by their houses
    {'type': 'crowd', 'area': [900, 1600, -2600, -1900], 'y': [FEET, 780], 'count': 80, 'size': P(0.34), 'color': '#ffd8a0', 'dim': 0.4, 'glow': 0.12, 'mill': 5, 'speed': 0, 'flicker': 0.35},
    # those who warned them: a small group of steady white lights, standing apart and facing the town
    *[light([470 + i * 46, FEET + 8], P(D), depth=D, color='#fff0dc', glow=0.3, bright=1.05, solid=0.5) for i in range(3)],
    # those who said: why warn them at all?
    *[light([1120 + i * 44, FEET + 6], P(D), depth=D, color='#e8c088', glow=0.2, bright=0.95, solid=0.6) for i in range(3)],
    motes(0.16),
  ],
  beats=[
    {'dur': 11000, 'ambient': ['sea', 'voices'], 'cam': cam([800, 525, 900], [800, 640, -3000]),
     'say': "A group among them asked the warners: why do you advise a people God is about to destroy, or to punish with a severe punishment?"},
    {'dur': 11000, 'ambient': ['sea', 'air'], 'cam': cam([560, 535, 620], [600, 740, -3000]),
     'say': "The warners answered that they did it to be free of blame before their Lord, and in the hope that the others would fear Him."},
    {'dur': 12000, 'ambient': ['sea', 'air'], 'cam': cam([800, 520, 850], [800, 620, -3000]),
     'verse': {'ref': '7:164', 'place': 'sky',
               'en': "And when a community among them said, \"Why do you advise [or warn] a people whom Allah is [about] to destroy or to punish with a severe punishment?\" they [the advisors] said, \"To be absolved before your Lord and perhaps they may fear Him.\""}},
  ])

scene('aftermath', 186.3, C, 'wisdom', 'A Deterrent and a Lesson', 'نكال وموعظة',
  art=["The people of the town appear only as dim figures of light, and their lights simply go out: nothing of what the Quran says happened to them is shown. The Quran tells in 7:166 and 2:65 that they were made apes, despised; that is not shown, and it is not said in the narration either.",
       "The look of the town is imagined: dressed limestone houses of the Levant in the time of Dawud."],
  prompt="A harbour town at evening, the warners and the few who stood with them walking out of the town along the shore road, their steady lights moving away; then the same town from the water, every one of its lights gone out, the quay and the roofs dark, the sea calm and empty under the last of the sky; ink-wash and parchment texture.",
  world=SEA, ambient=['sea', 'wind'], base='#3a4048',
  layers=[
    heav([[18.2, 19, 10000], [19, 19.8, 10000], [19.8, 20.6, 12000]], moon=MOON),
    *harbour(seed=1930, lit=0.3),
    {'type': 'ground', 'depth': 0.3, 'y': 762, 'amp': 4, 'seed': 1933, 'x0': -600, 'x1': 2200, 'color': '#a89678', 'color2': '#786a52'},
    {'type': 'crowd', 'area': [900, 1600, -2600, -1900], 'y': [FEET, 780], 'count': 80, 'size': P(0.34), 'color': '#ffd8a0', 'dim': 0.4, 'glow': 0.12, 'mill': 5, 'speed': 0, 'flicker': 0.35,
     'at': {'1': {'out': 1, 'outDur': 2600}, '2': {'out': 1, 'outDur': 1}}},
    # the warners walk out of the town along the shore
    *[light([470 + i * 46, FEET + 8], P(D), depth=D, color='#fff0dc', glow=0.3, bright=1.05, solid=0.5, pose='walk',
            path=[[470 + i * 46, FEET + 8], [190 + i * 40, FEET + 4]], dur=9000, delay=i * 250) for i in range(3)],
    motes(0.16),
  ],
  beats=[
    {'dur': 11000, 'ambient': ['sea', 'wind'], 'cam': cam([640, 535, 700], [560, 740, -3000]),
     'say': "When they forgot what they had been reminded of, those who had forbidden the wrong were saved, and those who did wrong were seized."},
    {'dur': 11000, 'ambient': ['sea', 'wind'], 'cam': cam([800, 515, 1000], [800, 600, -3000]),
     'say': "The warners walked out of the town at evening. Behind them its lights went out, and the sea lay calm and empty."},
    {'dur': 12000, 'ambient': ['sea', 'air'], 'cam': cam([800, 525, 900], [800, 630, -3000]),
     'verse': {'ref': '2:66', 'place': 'sky',
               'en': "And We made it a deterrent punishment for those who were present and those who succeeded [them] and a lesson for those who fear Allah."}},
  ])

# ── The companions of the trench ──────────────────────────────────────────
# Sahih Muslim 3005. The boy, the king, the magician, the monk and the crowds appear only as lights.
# Nothing of the trench is shown near anyone: the fires are far off, seen across the plain, and what
# happens to the believers is told in words and by lights going out.
TRENCH = {'fog': '#141824', 'fogNear': 6000, 'fogFar': 42000, 'light': 0.9, 'rays': 0, 'bloom': 0.9, 'haze': 0.04, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}

scene('boy', 186.4, C, 'wisdom', 'The Boy and the King', 'الغلام والملك',
  art=["The story is from the hadith of Sahih Muslim 3005; the Quran's own words about it are 85:1-3. The boy, the king, the magician and the monk appear only as lights; nothing of the healing is shown but a light rising and a sick person sitting up.",
       "The hadith tells of a people who lived long before the Prophet ﷺ; the commentators place them in Najran, in south Arabia. The look of the town is imagined, with buildings of the kind built there in that age.",
       "Nothing of the tortures the hadith goes on to describe is shown."],
  prompt="Night over an old Arabian town under a great sky of stars; a tall plain tower of a magician at the town's edge, and a small stone cell of a monk on the road outside it; between them a single small light of a boy walking, his light steadying as he goes; then inside a low room, a dim light lying still and a small clear light beside it, and the dim light lifting; ink-wash and parchment texture.",
  world=TRENCH, ambient=['wind', 'crickets'], base='#141824',
  layers=[
    heav([[22, 22.6, 10000], [22.6, 23.4, 11000], [23.4, 24, 12000]], stars=1600),
    {'type': 'ridge', 'depth': 0.03, 'y': 640, 'amp': 44, 'seed': 1940, 'sharp': 0.3, 'color': '#2a2a38', 'haze': 0.3, 'fog': 0.4},
    {'type': 'town', 'depth': 0.1, 'y': 686, 'x0': -60, 'x1': 1660, 's': P(0.1, 1) / 30, 'grade': 'town', 'night': True, 'lit': 0.3, 'haze': '#2a2434', 'seed': 1941},
    {'type': 'ground', 'depth': 0.2, 'y': 720, 'amp': 8, 'seed': 1942, 'color': '#3a3428', 'color2': '#1a1610'},
    # the magician's tower at the town's edge
    {'type': 'masonry', 'depth': 0.16, 'pos': [1400, 700], 'w': P(0.16, 9), 'h': P(0.16, 16), 'side': 26, 'courses': 14, 'blocks': 6, 'built': 1,
     'stone': '#6a6258', 'stone2': '#7e766a', 'ink': '#241f1c'},
    # the monk's cell by the road
    {'type': 'facade', 'depth': 0.24, 'x': 380, 'y': 742, 'w': P(0.24, 5), 'h': P(0.24, 3.2), 'stone': '#5e5648', 'light': 0.5, 'style': 'ashlar',
     'doors': [{'x': 380, 'w': P(0.24, 1.1), 'h': P(0.24, 2.2), 'lit': True}], 'ppu': 0.9},
    {'type': 'ground', 'depth': 0.34, 'y': 762, 'amp': 6, 'seed': 1943, 'x0': -600, 'x1': 2200, 'color': '#4a4032', 'color2': '#241f18'},
    # the boy: a small light that passes between the magician's tower and the monk's cell
    {'type': 'light', 'depth': 0.42, 'pos': [1120, FEET], 'h': 92, 'color': '#fff0dc', 'glow': 0.35, 'bright': 1.1, 'solid': 0.5, 'pose': 'walk',
     'path': [[1180, FEET], [1040, FEET + 2], [900, FEET]], 'dur': 11000, 'delay': 400,
     'at': {'1': {'glow': 0.5, 'bright': 1.2}, '2': {'glow': 0.35, 'bright': 1.1}}},
    motes(0.14),
  ],
  beats=[
    {'dur': 12000, 'ambient': ['wind', 'crickets'], 'cam': cam([900, 520, 950], [900, 620, -3000]),
     'say': "The Quran swears by the sky with its great stars, by the promised Day, and by the witness and what is witnessed. Then it speaks of the men who made a trench of fire."},
    {'dur': 12000, 'ambient': ['wind', 'crickets'], 'cam': cam([760, 530, 750], [760, 700, -3000]),
     'say': "A hadith in Sahih Muslim tells the story behind it. A king's old magician asked for a boy to teach. On the road the boy sat with a monk and came to believe, and he healed the sick by God's leave, saying: I do not cure anyone; it is God who cures."},
    {'dur': 12000, 'ambient': ['crickets', 'air'], 'cam': cam([820, 525, 850], [820, 690, -3000]),
     'verse': {'ref': '85:1-3', 'place': 'sky',
               'en': "By the sky containing great stars And [by] the promised Day And [by] the witness and what is witnessed,"}},
  ])

scene('lord', 186.5, C, 'wisdom', 'The Lord of the Boy', 'رب الغلام',
  art=["The story is from the hadith of Sahih Muslim 3005; the words the boy spoke are given there. The boy, the king and the crowds appear only as lights. Nothing is shown of how the boy's light went out: it goes out, and that is all.",
       "The palm trunk and the plain are imagined; in the hadith the people were gathered in a field with a palm tree in it."],
  prompt="A wide plain at night under a great sky, a crowd of dim lights gathered in a wide ring, a palm trunk standing among them; in the middle a small clear light standing alone, and beside it the tall cold light of a king; then the small light goes out, and every light in the crowd brightens at once; ink-wash and parchment texture.",
  world=TRENCH, ambient=['wind', 'voices'], base='#141824',
  layers=[
    heav([[23.2, 23.8, 10000], [23.8, 24.4, 10000], [24.4, 25, 12000]], stars=1600),
    {'type': 'ridge', 'depth': 0.03, 'y': 636, 'amp': 40, 'seed': 1950, 'sharp': 0.3, 'color': '#2a2a38', 'haze': 0.3, 'fog': 0.4},
    {'type': 'ground', 'depth': 0.14, 'y': 692, 'amp': 8, 'seed': 1951, 'color': '#443c30', 'color2': '#201c16'},
    {'type': 'ground', 'depth': 0.28, 'y': 762, 'amp': 6, 'seed': 1952, 'x0': -600, 'x1': 2200, 'color': '#524838', 'color2': '#2a241c'},
    # the palm trunk the hadith mentions, standing in the middle of the gathered people
    {'type': 'tree', 'depth': 0.22, 'x': 1180, 'y': 720, 'h': P(0.22, 9), 'kind': 'living', 'seed': 1953},
    # the crowd of the kingdom, gathered in a wide ring
    {'type': 'crowd', 'area': [-200, 1800, -3400, -2100], 'y': [FEET, 720], 'count': 260, 'size': P(0.3), 'color': '#ffd8a0', 'dim': 0.4, 'glow': 0.14, 'mill': 6, 'speed': 0, 'flicker': 0.3,
     'at': {'1': {'glow': 0.5, 'dim': 0.15, 'flicker': 0.08}}},
    # the boy: a small clear light in the middle of the ring
    {'type': 'light', 'depth': 0.42, 'pos': [800, FEET + 6], 'h': 96, 'color': '#fffaf0', 'glow': 0.6, 'bright': 1.35, 'solid': 0.5, 'pose': 'raise',
     'at': {'1': {'pose': 'gone'}}},
    # the king: a tall cold light at the edge of the ring
    {'type': 'light', 'depth': 0.42, 'pos': [560, FEET + 4], 'h': 118, 'color': '#b8b0c8', 'glow': 0.2, 'bright': 0.9, 'solid': 0.7},
    motes(0.14),
  ],
  beats=[
    {'dur': 12000, 'ambient': ['crowd', 'voices'], 'cam': cam([800, 520, 950], [800, 620, -3000]),
     'say': "The king could not be rid of the boy. At last the boy told him how: gather all the people on one plain, and say before them, In the name of God, the Lord of the boy."},
    {'dur': 12000, 'ambient': ['crowd', 'air'], 'world': {'bloom': 1.0}, 'cam': cam([820, 525, 700], [820, 700, -3000]),
     'say': "The boy's light went out. Then the whole crowd said it together: we believe in the Lord of the boy, and all their lights burned bright at once."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([800, 515, 900], [800, 600, -3000]),
     'verse': {'ref': '85:8-9', 'place': 'sky',
               'en': "And they resented them not except because they believed in Allah, the Exalted in Might, the Praiseworthy, To whom belongs the dominion of the heavens and the earth. And Allah, over all things, is Witness."}},
  ])

scene('trench', 186.6, C, 'wisdom', 'The Companions of the Trench', 'أصحاب الخندق',
  art=["The story is from the hadith of Sahih Muslim 3005; the Quran's own words about these people are 85:4-8 and 85:11. Everyone appears only as a light. The trench and its fires are seen far off across the plain, and no one is shown near them; what happened to those who would not turn back is told in words, and their lights simply go out.",
       "The child's words are given as the hadith has them. The look of the plain is imagined."],
  prompt="Night over a wide empty plain; far off along the horizon a long line of fire glowing in trenches, seen from a great distance; near the front of the plain a small group of steady lights standing still at the edge of the darkness, and beside them a dim light with a tiny light close to it; then every light going out quietly, one by one; and last, the sky alone, its great stars clear and still; ink-wash and parchment texture.",
  world=TRENCH, ambient=['wind', 'fire'], base='#141824',
  layers=[
    heav([[23.4, 24, 10000], [24, 24.6, 10000], [24.6, 25.2, 12000], [25.2, 26, 12000]], stars=1800),
    {'type': 'ridge', 'depth': 0.03, 'y': 630, 'amp': 38, 'seed': 1960, 'sharp': 0.3, 'color': '#282838', 'haze': 0.3, 'fog': 0.4},
    {'type': 'ground', 'depth': 0.14, 'y': 686, 'amp': 8, 'seed': 1961, 'color': '#3c3428', 'color2': '#1a1610'},
    {'type': 'ground', 'depth': 0.3, 'y': 764, 'amp': 6, 'seed': 1962, 'x0': -600, 'x1': 2200, 'color': '#463c30', 'color2': '#221e18'},
    # the fires in the trenches: far off, seen across the plain, never near anyone
    {'type': 'fire', 'depth': 0.06, 'pos': [800, 664], 'w': P(0.06, 90), 'h': P(0.06, 14), 'heat': 1.0, 'sheets': 2,
     'at': {'3': {'cool': 1, 'coolDur': 5000}}},
    # the believers at the edge of the darkness, standing still, not turning back
    *[light([600 + i * 54, FEET + 6], P(D), depth=D, color='#fff0dc', glow=0.35, bright=1.1, solid=0.5,
            at={'2': {'pose': 'gone'}, '3': {'pose': 'gone'}}) for i in range(4)],
    # the mother, and the child beside her
    {'type': 'light', 'depth': D + 0.01, 'pos': [880, FEET + 4], 'h': 96, 'color': '#e8c088', 'glow': 0.2, 'bright': 0.95, 'solid': 0.6,
     'at': {'2': {'pose': 'gone'}, '3': {'pose': 'gone'}}},
    {'type': 'light', 'depth': D + 0.02, 'pos': [912, FEET + 2], 'h': 34, 'color': '#fff0dc', 'glow': 0.4, 'bright': 1.1, 'solid': 0.5, 'pose': 'babe', 'w': 1.0,
     'at': {'2': {'pose': 'gone'}, '3': {'pose': 'gone'}}},
    motes(0.14),
  ],
  beats=[
    {'dur': 12000, 'ambient': ['wind', 'fire'], 'cam': cam([800, 520, 1000], [800, 620, -3000]),
     'say': "The hadith goes on. The king had trenches dug at the roads and fires lit in them, and whoever would not give up their faith was to be thrown in. The believers' lights stood steady at the edge and did not turn back."},
    {'dur': 12000, 'ambient': ['fire', 'wind'], 'cam': cam([800, 505, 1000], [800, 590, -3000]),
     'verse': {'ref': '85:4-7', 'place': 'sky',
               'en': "Cursed were the companions of the trench [Containing] the fire full of fuel, When they were sitting near it And they, to what they were doing against the believers, were witnesses."}},
    {'dur': 12000, 'ambient': ['fire', 'wind'], 'cam': cam([760, 535, 620], [800, 720, -3000]),
     'say': "A mother held back, with her child in her arms. And the child said to her: O mother, endure, for you are on the truth."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'world': {'bloom': 1.0}, 'cam': cam([800, 505, 1100], [800, 560, -3000]),
     'verse': {'ref': '85:11', 'place': 'sky',
               'en': "Indeed, those who have believed and done righteous deeds will have gardens beneath which rivers flow. That is the great attainment."}},
  ])

write_chapter(ROOT + 'src/story/chapters/c18/chapter.json', {
    'number': 18, 'title': 'Stories of Wisdom', 'arabic': 'قصص وعبر', 'nodes': ['wisdom'],
    'parts': [{'title': 'The Cave', 'from': ORDER.get('cave', 172.1), 'to': ORDER.get('awakening', 172.2)},
              {'title': 'Dhul-Qarnayn', 'from': ORDER.get('qarnayn', 172.3), 'to': ORDER.get('ironwall', 172.4)},
              {'title': 'Parables and Lessons', 'from': ORDER.get('gardens', 172.5), 'to': ORDER.get('luqman', 172.7)},
              {'title': 'The Town by the Sea', 'from': ORDER.get('sabbath', 186.1), 'to': ORDER.get('aftermath', 186.3)},
              {'title': 'The Trench', 'from': ORDER.get('boy', 186.4), 'to': ORDER.get('trench', 186.6)}]})
print('wisdom ok')
