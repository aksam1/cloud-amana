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
      {'type': 'town', 'depth': 0.12, 'y': 690, 'x0': 0, 'x1': 1600, 's': P(0.12, 1) / 30, 'grade': 'city', 'lit': 0.2, 'haze': '#b8a898', 'seed': 1611},
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
      {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 40, 'seed': 1660, 'sharp': 0.3, 'color': '#8a8a7a', 'haze': 0.35, 'fog': 0.4},
      {'type': 'ground', 'depth': 0.14, 'y': 690, 'amp': 10, 'seed': 1661, 'color': '#8a9a5a', 'color2': '#5a6a3a', 'grass': True, 'grassColor': '#a8b468'},
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

write_chapter(ROOT + 'src/story/chapters/c18/chapter.json', {
    'number': 18, 'title': 'Stories of Wisdom', 'arabic': 'قصص وعبر', 'nodes': ['wisdom'],
    'parts': [{'title': 'The Cave', 'from': ORDER.get('cave', 173), 'to': ORDER.get('awakening', 174)},
              {'title': 'Dhul-Qarnayn', 'from': ORDER.get('qarnayn', 175), 'to': ORDER.get('ironwall', 176)},
              {'title': 'Parables and Lessons', 'from': ORDER.get('gardens', 177), 'to': ORDER.get('luqman', 179)}]})
print('wisdom ok')
