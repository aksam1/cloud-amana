from base import *
from rooms import room, front
import math

# Episodes the first pass missed, slotted into their chapters (fractional orders until renum.py runs).
CH = ROOT + 'src/story/chapters/'


def scene(sid, order, chapter, node, title, arabic, art, prompt, world, layers, beats, ambient, base='#1a1820', dissolve=2400):
    order = ORDER.get(sid, order)
    s = {'id': sid, 'chapter': chapter, 'order': order, 'node': node, 'title': title, 'arabic': arabic, 'source': 'quran', 'ayahs': [], 'art': art,
         'ambient': ambient, 'base': base, 'captions': 'parchment', 'renderer': 'gl', 'pen': True, 'dissolve': dissolve, 'world': world,
         'cam': beats[0]['cam'], 'imagePrompt': prompt, 'layers': layers, 'beats': beats}
    num = f'{order:02d}' if isinstance(order, int) else str(order)
    for old in glob_(CH + f'c{chapter}/s*-{sid}.json'):
        os.remove(old)
    open(CH + f'c{chapter}/s{num}-{sid}.json', 'w').write(dump(s))


def glob_(p):
    import glob
    return glob.glob(p)


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
HALL = {'fog': '#2a2430', 'fogNear': 4000, 'fogFar': 30000, 'light': 0.95, 'rays': 0, 'bloom': 0.75, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
NILE = {'fog': '#d8c8a8', 'fogNear': 6000, 'fogFar': 42000, 'light': 1.05, 'rays': 0, 'bloom': 0.6, 'haze': 0.15, 'hazeY': 0.62, 'shake': 0.3, 'dof': 0}
SAND = {'fog': '#dcc0a0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.05, 'rays': 0, 'bloom': 0.6, 'haze': 0.2, 'hazeY': 0.62, 'shake': 0.3, 'dof': 0}

prophet_d = dict(color='#fffaf0', glow=0.35, bright=1.1, solid=0.5)
prophet_n = dict(color='#fffaf0', glow=0.6, bright=1.35)
soft = dict(color='#fff4ea', glow=0.45, bright=1.15, solid=0.45)
dim = dict(color='#ecc49a', glow=0.2, bright=0.95, solid=0.6)
cold = dict(color='#b8b0c8', glow=0.2, bright=0.85, solid=0.7)
SUN = {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 300, 'size': 34}
MOON = {'rise': 19, 'set': 6.5, 'x0': 1300, 'x1': 300, 'peak': 340, 'size': 24}
motes = lambda opacity=0.28, **kw: dust(box=(-1400, 200, -8000, 3000, 950, 600), count=400, size=2.6, color='#fff0d8', opacity=opacity, wind=(4, -2, 0), **kw)


def heav(tods, sun=SUN, moon=MOON, horizon=630):
    t0, *rest = tods
    h = {'type': 'heavens', 'horizon': horizon, 'tod': t0, 'sun': sun, 'moon': moon}
    if rest:
        h['at'] = {str(i + 1): {'tod': t} for i, t in enumerate(rest) if t}
    return h


def hall(stone='#7a6a5a', door_x=1070):
    return [
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#141a2a'], [1, '#0e121c']]},
        {'type': 'facade', 'depth': 0.18, 'x': 800, 'y': 712, 'w': 2400, 'h': 820, 'stone': stone, 'light': 0.85, 'doors': [{'x': door_x, 'w': 60, 'h': 110, 'lit': True}]},
        {'type': 'floor', 'depth': 0.19, 'y': 714, 'vp': [800, 500], 'color': '#5a5048', 'color2': '#1e1a18', 'lines': 14, 'gloss': 0.35, 'area': [-800, 708, 2400, 1350]},
        {'type': 'column', 'depth': 0.26, 'x': 420, 'y': 740, 'h': 600, 'w': 44, 'stone': '#c8a070', 'lit': '#f0d0a0', 'dark': '#5a3e28'},
        {'type': 'column', 'depth': 0.26, 'x': 1180, 'y': 740, 'h': 600, 'w': 44, 'stone': '#c8a070', 'lit': '#f0d0a0', 'dark': '#5a3e28'},
        {'type': 'brazier', 'depth': 0.3, 'x': 680, 'y': 790, 's': 0.6},
        {'type': 'light', 'kind': 'flame', 'depth': 0.3, 'pos': [680, 742], 'h': 20, 'color': '#ffb050', 'glow': 1.1},
        {'type': 'brazier', 'depth': 0.3, 'x': 1100, 'y': 790, 's': 0.6},
        {'type': 'light', 'kind': 'flame', 'depth': 0.3, 'pos': [1100, 742], 'h': 20, 'color': '#ffb050', 'glow': 1.1},
    ]


def egypt(lit=0.2, seed=800):
    return [
        {'type': 'ridge', 'depth': 0.04, 'y': 612, 'amp': 30, 'seed': seed, 'sharp': 0.3, 'color': '#b0987a', 'haze': 0.4, 'fog': 0.4},
        {'type': 'town', 'depth': 0.1, 'y': 650, 'x0': -200, 'x1': 1800, 's': P(0.1, 1) / 30, 'grade': 'city', 'lit': lit, 'haze': '#d8c8a8', 'seed': seed + 1},
        {'type': 'monument', 'depth': 0.12, 'x': 380, 'y': 660, 'kind': 'obelisk', 'h': P(0.12, 20), 'hill': [80, 16]},
        {'type': 'ground', 'depth': 0.14, 'y': 670, 'amp': 6, 'seed': seed + 2, 'color': '#8a9a5a', 'color2': '#5a6a3a', 'grass': True, 'grassColor': '#a8b468'},
    ]


# ── Chapter 1 · The covenant (after The Descent) ──────────────────────────
souls = []
for i in range(56):
    a = (i * 137.5) % 360
    r = 0.25 + ((i * 53) % 100) / 100 * 0.75
    sx = 800 + math.cos(math.radians(a)) * 700 * r
    sy = 330 - math.sin(math.radians(a)) * 230 * r
    souls.append({'type': 'light', 'kind': 'flame', 'depth': 0.2, 'h': 7 + (i % 3) * 2, 'color': '#fff4dc', 'glow': 1.2, 'delay': 300 + i * 90,
                  'pos': [round(sx), round(sy), -4000], 'path': [[800, 760, Z(D)], [800 + (sx - 800) * 0.3, 600, -2500], [round(sx), round(sy), -4000]], 'dur': 5000,
                  'at': {'1': {'path': None, 'pos': [round(sx), round(sy), -4000], 'glow': 1.8}, '2': {'path': None, 'pos': [round(sx), round(sy), -4000], 'glow': 1.4}}})
scene('covenant', 10.5, 1, 'humanity', 'The Covenant', 'العهد الأول',
  art=["God is not depicted in any form or light. That every soul of Adam's descendants was drawn out and testified is from the hadith (Ahmad, al-Tirmidhi) explaining 7:172; the souls are shown only as small lights rising like stars.",
       "Adam appears only as a steady light."],
  prompt="A wide plain under an immense night sky, a steady light kneeling alone; from him a stream of countless tiny lights rises and spreads across the heavens like a new field of stars, every one brightening together at once; ink-wash and parchment texture.",
  world={**NIGHT, 'bloom': 1.0}, ambient=['air', 'wind'], base='#0c0e16',
  layers=[
    heav([[23, 23.6, 10000], [23.6, 24, 10000], [0, 0.6, 12000]], horizon=660),
    {'type': 'ridge', 'depth': 0.04, 'y': 660, 'amp': 40, 'seed': 1500, 'sharp': 0.3, 'color': '#2a2a38', 'haze': 0.3, 'fog': 0.4},
    {'type': 'ground', 'depth': 0.14, 'y': 700, 'amp': 10, 'seed': 1501, 'color': '#3a3428', 'color2': '#1a1610'},
    *souls,
    light([800, FEET], P(D), depth=D, **prophet_n, pose='kneel'),
    {'type': 'ground', 'depth': 0.6, 'y': 880, 'amp': 6, 'seed': 1502, 'color': '#2a2620', 'color2': '#141210'},
  ],
  beats=[
    {'dur': 11000, 'ambient': ['air', 'wind'], 'cam': cam([800, 500, 1000], [800, 520, -3000]),
     'say': "Before any of his children were born, God brought out from Adam all the souls that would ever descend from him."},
    {'dur': 11000, 'ambient': ['air'], 'world': {'bloom': 1.1}, 'cam': cam([800, 470, 1150], [800, 420, -3000]),
     'say': "He asked them: am I not your Lord? And every soul answered: yes, we bear witness. That promise, the Quran says, is written in every human heart."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([800, 480, 1100], [800, 450, -3000]), 'pendingVerse': pv('7:172')},
  ])

# ── Chapter 9 · The women of the city (after The Torn Shirt) ─────────────
women = [light([620 + i * 72, FEET + (i % 2) * 6], P(D, 1.55), depth=D, **{**dim, 'color': '#f0c8b8'}, pose='kneel',
               at={'1': {'glow': 0.5, 'bright': 1.2}}) for i in range(8)]
bowls = [{'type': 'fruit', 'depth': D + 0.003, 'x': 650 + i * 72, 'y': FEET + 16 + (i % 2) * 6, 'w': P(D, 0.4), 'glow': 0.2, 'area': [600 + i * 72, 760, 700 + i * 72, 820]} for i in range(8)]
scene('banquet', 96.5, 9, 'yusuf', 'The Women of the City', 'مجلس نساء المدينة',
  art=["Yusuf appears only as a steady light; the women as dim figures of light. Their cut hands are told in words, never shown.",
       "The banquet's look is imagined."],
  prompt="A lamplit hall in a great Egyptian house, women's dim rose-gold lights seated on cushions in a long row, a bowl of fruit and a small knife before each; jagged strokes of gossip rising; then a steady white light entering through a doorway and every seated light flaring in astonishment; ink-wash and parchment texture.",
  world=HALL, ambient=['echo', 'voices'], base='#10141e',
  layers=[
    *room('aziz'),
    *women, *bowls,
    light([1200, 728], P(0.2), depth=0.201, **prophet_n, show=[1, None], pose='walk', path=[[1070, 712], [1200, 728]], dur=3000),
    {'type': 'jeers', 'show': [0, 1], 'center': [880, 560], 'from': [1100, 380], 'clear': [120, 110], 'count': 22, 'size': 30, 'period': 5},
    {'type': 'flash', 'show': [1, 2], 'color': '#fff8e8', 'peak': 0.2, 'delay': 1800, 'rise': 300, 'dur': 2000},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['echo', 'voices'], 'cam': cam([880, 540, 450], [900, 880, -3000]),
     'say': "Soon the women of the city were gossiping: the Aziz's wife has fallen for her young servant! So she invited them to a banquet, and gave each a knife to cut her fruit."},
    {'dur': 11000, 'ambient': ['echo'], 'cam': cam([920, 535, 550], [940, 840, -3000]),
     'say': "Then she called Yusuf in. When they saw him, they were so astonished that they cut their own hands without noticing, and said: this is no mortal man, this is a noble angel!"},
    {'dur': 10000, 'ambient': ['echo', 'air'], 'cam': cam([900, 540, 450], [920, 880, -3000]),
     'say': "Still she threatened him with prison if he would not obey her. Yusuf prayed: my Lord, prison is dearer to me than what they call me to."},
    {'dur': 12000, 'ambient': ['echo', 'air'], 'cam': cam([900, 535, 600], [920, 820, -3000]), 'pendingVerse': pv('12:33')},
  ])

# ── Chapter 9 · Innocence declared (after The King's Dream) ─────────────
scene('innocence', 98.5, 9, 'yusuf', 'Innocence Declared', 'ظهور البراءة',
  art=["The king, the women and the Aziz's wife appear only as dim figures of light. Yusuf's light is far off in the prison; his answer is told."],
  prompt="The king's lapis throne hall, a dim seated figure on a low dais, a row of dim rose-gold lights of women before him; one of them stepping forward alone and bowing her head as she speaks; far away through a high window, a steady light in a dark prison; ink-wash and parchment texture.",
  world=HALL, ambient=['echo', 'voices'], base='#10141e',
  layers=[
    *room('kinghall'),
    {'type': 'platform', 'depth': 0.3, 'x': 800, 'y': 760, 'w': P(0.3, 7), 'steps': 4, 'rise': P(0.3, 0.2), 'dais': P(0.3, 0.25), 'stone': '#b8845a', 'lit': '#e8b884', 'dark': '#4a2e22', 'ppu': 1},
    light([800, 760 - 4 * P(0.3, 0.2) - P(0.3, 0.25)], P(0.301, 1.7), depth=0.301, color='#c89878', glow=0.3, bright=0.9, solid=0.7, pose='kneel'),
    *[light([560 + i * 70 + (60 if i >= 4 else 0), FEET + 6], P(D, 1.55), depth=D, **{**dim, 'color': '#f0c8b8'}) for i in range(7)],
    light([900, FEET + 8], P(0.425, 1.6), depth=0.425, **{**dim, 'color': '#f8d8c8'}, at={'1': {'pos': [820, FEET - 6], 'pose': 'kneel'}, '2': {'pos': [820, FEET - 6], 'pose': 'kneel'}}),
    light([400, 600], 14, depth=0.181, **prophet_n),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['echo', 'voices'], 'cam': cam([800, 535, 500], [800, 860, -3000]),
     'say': "The king sent for the man who had explained his dream. But Yusuf would not leave prison until his name was cleared: ask what happened with the women who cut their hands."},
    {'dur': 11000, 'ambient': ['echo'], 'cam': cam([820, 540, 400], [820, 900, -3000]),
     'say': "The women said: God forbid! We know no evil of him. And the Aziz's wife confessed: now the truth is out. It was I who tried to seduce him, and he is truthful."},
    {'dur': 12000, 'ambient': ['echo', 'air'], 'cam': cam([800, 535, 600], [800, 820, -3000]), 'pendingVerse': pv('12:51', 'from "Now the truth has become evident"')},
  ])

# ── Chapter 12 · Haman's tower and the believer of Pharaoh's family ───────
scene('tower', 125.3, 12, 'musa', "Haman's Tower", 'برج هامان',
  art=["Pharaoh, Haman and the believing man of Pharaoh's family appear only as dim figures of light, Pharaoh's cold. The tower's look is imagined."],
  prompt="An Egyptian city at morning, brick kilns glowing and a tower of baked brick rising course after course toward the clouds while crowds of dim lights labour around it; then Pharaoh's hall, a single warm dim light stepping forward from among grey courtiers to speak; ink-wash and parchment texture.",
  world=NILE, ambient=['work', 'city'], base='#d8c8a8', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 2], 'layers': [
      heav([[8, 10, 10000], [10, 12, 10000]]),
      *egypt(),
      {'type': 'masonry', 'depth': 0.1, 'pos': [1000, 662], 'w': P(0.1, 12), 'h': P(0.1, 70), 'side': 24, 'courses': 46, 'blocks': 6, 'built': 0.15,
       'stone': '#b0623a', 'stone2': '#c8784a', 'ink': '#5a2a18', 'at': {'0': {'build': [0.15, 0.55, 10000]}, '1': {'build': [0.55, 0.95, 10000]}}},
      *[{'type': 'fire', 'depth': 0.24, 'pos': [x, 752], 'w': P(0.24, 1.6), 'h': P(0.24, 1.8), 'heat': 0.9} for x in (560, 1360)],
      {'type': 'crowd', 'area': [200, 1400, -3200, -2400], 'y': [FEET - 10, 760], 'count': 120, 'size': P(0.28), 'color': '#ffd8a0', 'dim': 0.45, 'glow': 0.1, 'flow': [1, 0], 'speed': 16, 'mill': 3},
      light([720, 752], P(0.24), depth=0.241, **cold),
      dust(box=(-1400, 200, -9000, 3000, 950, -2000), count=500, size=10, color='#a88068', opacity=0.25, wind=(10, 30, 0), blend='normal'),
    ]},
    {'type': 'set', 'show': [2, None], 'dx': 6000, 'layers': [
      *room('pharaoh'),
      {'type': 'platform', 'depth': 0.3, 'x': 800, 'y': 760, 'w': P(0.3, 7), 'steps': 5, 'rise': P(0.3, 0.2), 'dais': P(0.3, 0.25), 'stone': '#b8845a', 'lit': '#e8b884', 'dark': '#4a2e22', 'ppu': 1},
      light([800, 760 - 5 * P(0.3, 0.2) - P(0.3, 0.25)], P(0.301), depth=0.301, **cold),
      *[light([520 + i * 60 + (300 if i >= 4 else 0), FEET + 4], P(D), depth=D, **cold) for i in range(8)],
      light([780, FEET + 14], P(0.44), depth=0.44, **dim, pose='walk', path=[[640, FEET + 14], [780, FEET + 14]], dur=3000),
    ]},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['work', 'city'], 'sfx': [{'name': 'hoe', 'at': 2000}], 'cam': cam([900, 510, 1100], [920, 560, -3000]),
     'say': "Pharaoh mocked Musa's God. Haman, he ordered, bake bricks and build me a tower, that I may climb up and look at the God of Musa; I think he is a liar."},
    {'dur': 10000, 'ambient': ['work', 'wind'], 'cam': cam([920, 470, 1100], [940, 380, -3000]),
     'say': "So the tower rose, brick upon brick; but no tower could reach the One who made the heavens."},
    {'dur': 11000, 'ambient': ['echo', 'voices'], 'cam': cam([800, 535, 500], [800, 860, -3000], dx=6000),
     'say': "Then a man of Pharaoh's own family, who had hidden his faith, spoke up: will you kill a man simply for saying, my Lord is God, when he has brought you clear proofs?"},
    {'dur': 12000, 'ambient': ['echo', 'air'], 'cam': cam([800, 530, 650], [800, 800, -3000], dx=6000), 'pendingVerse': pv('40:28', 'from "Do you kill a man [merely] because he says, My Lord is Allah"')},
  ])

# ── Chapter 12 · Asiya's prayer ───────────────────────────────────────────
scene('asiyaprayer', 125.6, 12, 'musa', "Asiya's Prayer", 'دعاء آسية',
  art=["Asiya appears only as a soft light. That Pharaoh punished her for her faith is from the commentaries; nothing of it is shown. Paradise is not depicted: only the stars brighten."],
  prompt="The flat roof of Pharaoh's palace at night, the city dark below and the Nile shining under the moon; a single soft light kneeling alone in prayer with her face to the sky, the stars above her slowly brightening; ink-wash and parchment texture.",
  world=NIGHT, ambient=['air', 'crickets'], base='#141824',
  layers=[
    heav([[22, 23, 10000], [23, 24, 11000], [0, 0.8, 12000]], horizon=680),
    *egypt(lit=0.1, seed=830),
    {'type': 'water', 'depth': 0.18, 'points': [[-1600, 724], [800, 728], [3200, 732]], 'w0': 50, 'w1': 50, 'reflect': [['0', '#8a9ab8'], ['1', '#2a3448']]},
    {'type': 'floor', 'depth': 0.3, 'y': 780, 'vp': [800, 620], 'color': '#6a5a4a', 'color2': '#2a2420', 'lines': 6, 'gloss': 0.1, 'area': [-400, 774, 2000, 1200]},
    light([820, FEET + 4], P(D, 1.6), depth=D, **soft, pose='kneel', at={'1': {'pose': 'raise'}, '2': {'pose': 'raise', 'glow': 0.7, 'bright': 1.4}}),
    *[{'type': 'light', 'kind': 'flame', 'depth': 0.05, 'h': 6, 'color': '#fff8e8', 'glow': 1.4, 'pos': [300 + i * 110, 120 + (i * 37) % 160], 'show': [1, None]} for i in range(10)],
    motes(0.1),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['air', 'crickets'], 'cam': cam([820, 520, 800], [820, 700, -3000]),
     'say': "In Pharaoh's own palace, his wife Asiya believed in the God of Musa."},
    {'dur': 11000, 'ambient': ['air'], 'cam': cam([820, 500, 950], [820, 520, -3000]),
     'say': "Though Pharaoh punished her for it, she prayed: my Lord, build for me a house near You in Paradise, and save me from Pharaoh and his deeds."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([820, 510, 900], [820, 600, -3000]), 'pendingVerse': pv('66:11')},
  ])

# ── Chapter 13 · Qarun (after The Cow) ───────────────────────────────────
gold = [{'type': 'light', 'kind': 'flame', 'depth': 0.3, 'h': 8 + (i % 3) * 3, 'color': '#ffd060', 'glow': 1.3, 'pos': [880 + (i % 7) * 34, 772 - (i // 7) * 12], 'show': [0, 2]} for i in range(21)]
scene('qarun', 136.5, 13, 'musa', "Qarun's Treasure", 'كنوز قارون',
  art=["Qarun and the people appear only as dim figures of light. The earth swallowing his house is shown as the house sinking into the ground; no one is shown harmed.",
       "The look of his house and treasure is imagined."],
  prompt="A grand house of pale stone in a desert town, its open treasury heaped with gold glinting; a richly dressed dim light parading before crowds who gaze in envy; then the ground opening silently and the whole house sinking into the earth, dust rising, the crowd's lights shrinking back; ink-wash and parchment texture.",
  world=SAND, ambient=['crowd', 'city'], base='#d8c0a0',
  layers=[
    heav([[10, 11, 10000], [11, 12, 10000], [12, 12.6, 10000], [12.6, 13.4, 12000]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 610, 'amp': 70, 'seed': 1520, 'sharp': 0.6, 'color': '#8a5a4a', 'haze': 0.4, 'fog': 0.4},
    {'type': 'town', 'depth': 0.12, 'y': 690, 'x0': 100, 'x1': 1500, 's': P(0.12, 1) / 30, 'grade': 'town', 'lit': 0.2, 'haze': '#c8a888', 'seed': 1521},
    {'type': 'facade', 'depth': 0.28, 'x': 980, 'y': 776, 'w': P(0.28, 18), 'h': P(0.28, 9), 'gate': {'w': P(0.28, 3.2), 'h': P(0.28, 4.4)}, 'towers': True, 'stone': '#f0e0c0', 'ppu': 0.8,
     'at': {'2': {'move': {'path': [[0, 0, 0], [0, 30, 0], [0, 700, 0]], 'dur': 6000, 'delay': 800}}, '3': {'move': {'path': [[0, 700, 0]], 'dur': 1}}}},
    *gold,
    {'type': 'ground', 'depth': 0.29, 'y': 780, 'amp': 4, 'seed': 1522, 'x0': -900, 'x1': 2500, 'color': '#c8a078', 'color2': '#9a7050'},
    dust(box=(-200, 0, -2600, 1400, 900, -1800), count=500, size=12, color='#b89878', opacity=0.4, wind=(0, 40, 0), swirl=60, blend='normal', show=[2, 3]),
    {'type': 'crowd', 'area': [-200, 1800, -2000, -1500], 'y': [FEET + 6, 780], 'count': 140, 'size': P(0.38), 'color': '#ffd8a0', 'dim': 0.4, 'glow': 0.12, 'mill': 6, 'speed': 0,
     'at': {'2': {'flow': [0, 1], 'speed': 12}}},
    light([860, 782], P(0.3, 1.75), depth=0.3, color='#e8c070', glow=0.4, bright=1.05, solid=0.6, show=[0, 2], pose='walk', path=[[760, 784], [900, 780]], dur=8000),
    {'type': 'flash', 'show': [2, 3], 'color': '#f8e8d0', 'peak': 0.25, 'delay': 600, 'rise': 200, 'dur': 2000},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['crowd', 'city'], 'cam': cam([920, 520, 800], [940, 690, -3000]),
     'say': "Qarun was one of Musa's own people, given such treasures that the keys alone were a burden for a band of strong men. Do not exult, his people warned him; God does not love the boastful."},
    {'dur': 10000, 'ambient': ['crowd', 'voices'], 'cam': cam([900, 525, 700], [920, 720, -3000]),
     'say': "I was given it because of my own knowledge, he said. When he paraded in his finery, some longed for what he had; those with knowledge said: God's reward is better."},
    {'dur': 10000, 'ambient': ['wind'], 'sfx': [{'name': 'rumble', 'at': 600}, {'name': 'boom', 'at': 1400}] if False else [{'name': 'rumble', 'at': 600}], 'world': {'shake': 1.6},
     'cam': cam([920, 515, 950], [940, 660, -3000]),
     'say': "So God caused the earth to swallow him and his house, and no one could help him."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'world': {'shake': 0.3}, 'cam': cam([920, 515, 950], [940, 660, -3000]), 'pendingVerse': pv('28:81')},
  ])

# ── Chapter 14 · The two disputants (after Iron Made Soft) ───────────────
ewes = {'type': 'animals', 'depth': 0.36, 'fade': 'none', 'area': [300, 680, 1500, 820],
        'pairs': [{'kind': 'sheep', 'solo': True, 's': 0.5, 'path': [[340 + (i % 18) * 52 + (i // 18) * 26, 786 + (i // 18) * 9]], 'face': 1 if i % 2 else -1} for i in range(54)]}
one = {'type': 'animals', 'depth': 0.4, 'fade': 'none', 'area': [1300, 700, 1480, 830], 'pairs': [{'kind': 'sheep', 'solo': True, 's': 0.58, 'path': [[1390, 806]], 'face': -1}]}
scene('disputants', 145.5, 14, 'dawud', 'The Two Disputants', 'المتخاصمان',
  art=["Dawud and the two men appear only as lights. Who the two were is not told in the Quran; many commentators say they were angels sent to test him. The flock is drawn as the case they described."],
  prompt="Dawud's prayer chamber at night, a steady light at prayer; two dim figures of light appearing on top of the high wall and dropping inside; then a vision of their case: a great flock of ninety-nine ewes on one side and a single ewe alone on the other; then the steady light bowed low in repentance; ink-wash and parchment texture.",
  world=HALL, ambient=['air', 'echo'], base='#10141e', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [[0, 1], [2, None]], 'layers': [
      *room('dawudchamber'),
      light([800, FEET + 10], P(0.44), depth=0.44, **prophet_n, at={'2': {'pose': 'bow', 'w': 1}, '3': {'pose': 'bow', 'w': 1}}),
      *[light([x, 214], P(0.2, 1.7), depth=0.2, **dim, pose='walk', path=[[x, 206], [x, 214], [x + (40 if x > 800 else -40), 712]], dur=3000, delay=1000 + k * 400, show=[0, 1]) for k, x in enumerate((700, 900))],
      *[light([x, 712], P(0.2, 1.7), depth=0.2, **dim, show=[2, None]) for x in (660, 940)],
    ]},
    {'type': 'set', 'show': [1, 2], 'dx': 6000, 'layers': [
      heav([[None, None], [15, 16, 10000]]) if False else heav([[15, 16, 10000]]),
      {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 40, 'seed': 1530, 'sharp': 0.3, 'color': '#8a8a7a', 'haze': 0.35, 'fog': 0.4},
      {'type': 'ground', 'depth': 0.14, 'y': 690, 'amp': 10, 'seed': 1531, 'color': '#8a9a5a', 'color2': '#5a6a3a', 'grass': True, 'grassColor': '#a8b468'},
      ewes, one,
    ]},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['air', 'echo'], 'cam': cam([800, 535, 500], [800, 860, -3000]),
     'say': "One night, while Dawud was praying alone, two men climbed over the wall of his chamber. Do not be afraid, they said; we are two in a dispute. Judge between us with truth."},
    {'dur': 11000, 'ambient': ['sheep', 'wind'], 'cam': cam([900, 520, 850], [900, 680, -3000], dx=6000),
     'say': "This brother of mine has ninety-nine ewes, and I have one; yet he says, give it to me, and overpowers me with words. Dawud said: he has wronged you by asking for your ewe."},
    {'dur': 10000, 'ambient': ['air'], 'cam': cam([800, 540, 450], [800, 880, -3000]),
     'say': "Then Dawud understood that he was the one being tested. He asked his Lord's forgiveness, fell down bowing, and turned to Him in repentance."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([800, 535, 600], [800, 820, -3000]), 'pendingVerse': pv('38:24', 'from "And David became certain that We had tried him"')},
  ])
print('extras ok')
