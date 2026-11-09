from base import *

# Chapter 13 · Musa in the wilderness. True scale: a person of 1.7 m is 255 × depth design units tall.
C13 = ROOT + 'src/story/chapters/c13/'
os.makedirs(C13, exist_ok=True)


def scene(sid, order, title, arabic, art, prompt, world, layers, beats, ambient, base='#1a1820', dissolve=2400, node='musa'):
    order = ORDER.get(sid, order)
    s = {'id': sid, 'chapter': 13, 'order': order, 'node': node, 'title': title, 'arabic': arabic, 'source': 'quran', 'ayahs': [], 'art': art,
         'ambient': ambient, 'base': base, 'captions': 'parchment', 'renderer': 'gl', 'pen': True, 'dissolve': dissolve, 'world': world,
         'cam': beats[0]['cam'], 'imagePrompt': prompt, 'layers': layers, 'beats': beats}
    open(C13 + f's{order}-{sid}.json', 'w').write(dump(s))


def pv(ref, part=None):
    v = {'ref': ref, 'place': 'sky'}
    if part:
        v['part'] = part
    return v


P = lambda d, m=1.7: round(m * 150 * d)
D = 0.42
FEET = 792
SAND = {'fog': '#dcc0a0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.05, 'rays': 0, 'bloom': 0.6, 'haze': 0.2, 'hazeY': 0.62, 'shake': 0.3, 'dof': 0}
NIGHT = {'fog': '#141824', 'fogNear': 6000, 'fogFar': 40000, 'light': 0.9, 'rays': 0, 'bloom': 0.8, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
SEA = {'fog': '#9aa8b4', 'fogNear': 6000, 'fogFar': 50000, 'light': 1.0, 'rays': 0, 'bloom': 0.7, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}

prophet_d = dict(color='#fffaf0', glow=0.35, bright=1.1, solid=0.5)
prophet_n = dict(color='#fffaf0', glow=0.6, bright=1.35)
harun_d = dict(color='#f8f2e6', glow=0.3, bright=1.05, solid=0.5)
harun_n = dict(color='#f8f2e6', glow=0.5, bright=1.25)
khidr = dict(color='#eef4f0', glow=0.4, bright=1.15, solid=0.5)
dim = dict(color='#ecc49a', glow=0.25, bright=0.95, solid=0.6)
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


def sinai(seed=1000):
    # the wilderness of Sinai: bare granite ranges (grey-violet, sharp) over a pale gravel plain, kept apart from
    # Madyan's red-brown hills (chapters 10-11)
    return [
        {'type': 'ridge', 'depth': 0.04, 'y': 600, 'amp': 96, 'seed': seed, 'sharp': 0.8, 'color': '#6e6274', 'haze': 0.4, 'fog': 0.4},
        {'type': 'ridge', 'depth': 0.08, 'y': 660, 'amp': 50, 'seed': seed + 1, 'sharp': 0.65, 'color': '#9a8486', 'haze': 0.3, 'fog': 0.3},
        {'type': 'ground', 'depth': 0.14, 'y': 700, 'amp': 6, 'seed': seed + 2, 'color': '#d8c8a8', 'color2': '#a8987a', 'rocks': 8},
    ]


def camp(seed=1010):
    return [{'type': 'tent', 'depth': d, 'x': x, 'y': y, 'w': P(d, 8), 'h': P(d, 2.4), 'lit': lit, 'ppu': 0.9}
            for d, x, y, lit in ((0.2, 300, 732, False), (0.21, 1300, 736, True), (0.26, 520, 760, True), (0.27, 1120, 764, False))]


def people(count=200, **kw):
    return {'type': 'crowd', 'area': [-200, 1800, -2600, -1500], 'y': [FEET + 6, 760], 'count': count, 'size': P(0.36), 'color': '#ffe0b0',
            'dim': 0.4, 'glow': 0.12, 'mill': 8, 'speed': 0, 'flicker': 0.1, **kw}


musa = lambda x=800, y=FEET + 10, d=0.44, n=False, **kw: light([x, y], P(d, 1.8), depth=d, **{**(prophet_n if n else prophet_d), **kw})
harun = lambda x=740, y=FEET + 12, d=0.44, n=False, **kw: light([x, y], P(d, 1.8), depth=d, **{**(harun_n if n else harun_d), **kw})
ART = "Musa and Harun appear only as steady lights; the Children of Israel as small warm lights. The look of the wilderness is imagined."

# ── 131 · Manna and quails ────────────────────────────────────────────────
quails = [{'type': 'light', 'kind': 'bird', 'depth': 0.2, 'h': 10, 'color': '#f4e8d0', 'glow': 0.4, 'bright': 1.1, 'delay': i * 500,
           'path': [[200 + i * 140, 260 + (i % 3) * 30, -4000], [500 + i * 110, 420, -4000], [700 + i * 80, 700, -4000]], 'dur': 7000} for i in range(7)]
scene('manna', 131, 'Manna and Quails', 'طعام في الصحراء',
  art=[ART, "Manna is shown as pale flakes on the ground and quails as small birds, as the Quran names them (2:57)."],
  prompt="A camp of goat-hair tents in a red-mountained desert under soft white clouds that shade it, pale flakes like frost settling on the sand at dawn and small birds coming down among the tents; crowds of warm lights gathering, a steady light among them; ink-wash and parchment texture.",
  world=SAND, ambient=['desert', 'voices'], base='#d8c0a0',
  layers=[
    heav([[5.6, 7, 10000], [7, 8.4, 10000], [8.4, 9.4, 12000]]),
    *sinai(),
    {'type': 'clouds', 'depth': 0.07, 'y': 300, 'count': 7, 'color': '#f4f0e8', 'rim': '#d8c0a8', 'fog': 0.2},
    *camp(),
    people(240),
    *quails,
    musa(),
    dust(box=(-1400, 200, -5000, 3000, 950, 0), count=900, size=3, color='#fffaf0', opacity=0.6, wind=(2, -16, 0), swirl=10),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['desert', 'voices'], 'cam': cam([800, 515, 1000], [800, 640, -3000]),
     'say': "In the desert, God shaded them with clouds, and sent down manna and quails for them to eat."},
    {'dur': 10000, 'ambient': ['voices', 'birds'], 'cam': cam([820, 525, 700], [840, 740, -3000]),
     'say': "Eat of the good things We have given you, they were told. Yet many of them complained, and longed for the onions and lentils of Egypt."},
    {'dur': 12000, 'ambient': ['desert', 'air'], 'cam': cam([800, 515, 950], [800, 650, -3000]), 'pendingVerse': pv('2:57', 'from its opening to "Eat from the good things with which We have provided you"')},
  ])

# ── 132 · Twelve springs ──────────────────────────────────────────────────
springs = []
for i in range(12):
    a = (i / 11 - 0.5) * 2.2
    x = round(800 + 360 * a)
    y = round(806 - 30 * (1 - a * a))
    springs.append({'type': 'spring', 'depth': 0.36 + (0.02 if i % 2 else 0), 'pos': [x, y], 'r': P(0.36, 0.9), 'squash': 0.26, 'well': 0,
                    'at': {'1': {'rise': [0, 1, 4000, 400 + i * 260], 'rim': 1}, '2': {'well': 1, 'rim': 1}}})
scene('springs', 132, 'Twelve Springs', 'ينابيع الصخرة',
  art=[ART, "The twelve springs and the twelve tribes are as the Quran tells (2:60, 7:160)."],
  prompt="A great sandstone rock in a red desert at noon, a steady white light raising a staff before it; twelve clear springs welling up in an arc around its foot, crowds of small warm lights gathering by tribe at each; ink-wash and parchment texture.",
  world=SAND, ambient=['desert', 'voices'], base='#d8c0a0',
  layers=[
    heav([[11, 12, 10000], [12, 13, 10000], [13, 14, 12000]]),
    *sinai(1020),
    {'type': 'outcrop', 'depth': 0.3, 'x': 800, 'y': 790, 'w': P(0.3, 12), 'h': P(0.3, 7), 'shape': 'dome', 'seed': 1021, 'ppu': 0.9},
    *springs,
    people(260, area=[-300, 1900, -2900, -1700], at={'2': {'mill': 3}}),
    musa(800, FEET + 22, 0.44, at={'1': {'pose': 'raise'}}),
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['desert', 'voices'], 'cam': cam([800, 515, 900], [800, 680, -3000]),
     'say': "When his people were thirsty, Musa prayed for water. Strike the rock with your staff, he was told."},
    {'dur': 11000, 'ambient': ['spring', 'voices'], 'sfx': [{'name': 'swell', 'at': 500}], 'cam': cam([800, 520, 700], [800, 760, -3000]),
     'say': "Twelve springs gushed out from it, one for each of the twelve tribes, and each knew its own place to drink."},
    {'dur': 12000, 'ambient': ['spring', 'air'], 'cam': cam([800, 515, 900], [800, 680, -3000]), 'pendingVerse': pv('2:60', 'to "Every people knew its watering place"')},
  ])

# ── 133 · The mountain ────────────────────────────────────────────────────
scene('mountain', 133, 'The Mountain', 'الجبل',
  art=[ART, "God is not depicted, in any form or light: only the mountain is seen, crumbling to dust (7:143). The tablets are drawn with rows of strokes, never letters."],
  prompt="Night high in rocky mountains, a steady white light standing on a ledge before a great peak; the peak breaking apart into dust and falling stone while the light falls to its knees; then dawn, and two stone tablets standing before the light, faintly glowing; ink-wash and parchment texture.",
  world={**NIGHT, 'fog': '#1a1a26'}, ambient=['wind', 'air'], base='#10121a',
  layers=[
    heav([[2, 2.6, 10000], [2.6, 3.2, 10000], [4.8, 6, 10000], [6, 6.8, 12000]], horizon=600),
    {'type': 'peak', 'depth': 0.05, 'x': 300, 'y': 300, 'w': 900, 'h': 400, 'color': '#2e2e3c', 'lit': '#4e4e62', 'seed': 1030},
    {'type': 'peak', 'depth': 0.05, 'x': 1350, 'y': 320, 'w': 800, 'h': 380, 'color': '#2e2e3c', 'lit': '#4e4e62', 'seed': 1031},
    {'type': 'peak', 'depth': 0.16, 'x': 860, 'y': 330, 'w': 640, 'h': 430, 'color': '#3a3a4a', 'lit': '#6a6a80', 'seed': 1032, 'ppu': 0.9,
     'at': {'1': {'shatter': {'delay': 3200, 'dur': 4200, 'spread': 0.6, 'gravity': 1.2, 'spin': 0.4, 'floor': 780, 'cols': 9, 'rows': 7}}}},
    dust(box=(-600, -200, -6000, 2400, 900, -4000), count=900, size=30, color='#8a8494', opacity=0.35, wind=(4, -30, 0), swirl=120, blend='normal', show=[1, 3]),
    {'type': 'ground', 'depth': 0.38, 'y': 812, 'amp': 14, 'seed': 1033, 'color': '#4a4652', 'color2': '#22202a'},
    {'type': 'tablets', 'show': [2, None], 'depth': 0.43, 'x': 920, 'y': FEET + 16, 'h': P(0.43, 0.7), 'glow': 0.6, 'area': [860, 700, 980, 812]},
    musa(780, FEET + 14, 0.44, n=True, at={'1': {'pose': 'kneel', 'glow': 0.3, 'bright': 0.9}, '2': {'pose': 'kneel'}, '3': {'pose': 'stand'}}),
    {'type': 'flash', 'show': [1, 2], 'color': '#fffaf0', 'peak': 0.35, 'delay': 3000, 'rise': 300, 'dur': 2400},
  ],
  beats=[
    {'dur': 11000, 'ambient': ['wind'], 'cam': cam([820, 500, 1000], [840, 560, -3000]),
     'say': "Musa went up the mountain for forty nights, to receive guidance for his people. There he asked: my Lord, show Yourself to me, that I may look at You."},
    {'dur': 11000, 'ambient': ['wind', 'roar'], 'sfx': [{'name': 'rumble', 'at': 2800}, {'name': 'thunder', 'at': 3200}], 'world': {'shake': 1.6},
     'cam': cam([820, 500, 1000], [840, 560, -3000]),
     'say': "You will not see Me, he was told, but look at the mountain. When his Lord appeared to the mountain, it crumbled to dust, and Musa fell down unconscious."},
    {'dur': 11000, 'ambient': ['air'], 'world': {'shake': 0.3}, 'cam': cam([860, 530, 600], [880, 760, -3000]),
     'say': "When he woke he said: glory be to You! I turn to You in repentance. Then he was given the tablets, written with guidance for his people."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([860, 520, 800], [880, 700, -3000]), 'pendingVerse': pv('7:143', 'from "And when he awoke" to the end')},
  ])

# ── 134 · The golden calf ─────────────────────────────────────────────────
calf_s = round(1.2 * 150 * 0.36 / 64, 2)
calf = {'type': 'animals', 'depth': 0.36, 'fade': 'none', 'area': [740, 680, 880, 800], 'pairs': [{'kind': 'calf', 'solo': True, 's': calf_s, 'path': [[810, 776]]}]}
night_camp = [
    heav([[21, 22, 10000], [22, 23, 10000], [23, 23.6, 10000], [23.6, 24, 12000]], horizon=640),
    *sinai(1040),
    *camp(1041),
    {'type': 'brazier', 'depth': 0.35, 'x': 660, 'y': 790, 's': 0.7},
    {'type': 'light', 'kind': 'flame', 'depth': 0.35, 'pos': [660, 738], 'h': 22, 'color': '#ffb050', 'glow': 1.2},
    {'type': 'brazier', 'depth': 0.35, 'x': 960, 'y': 790, 's': 0.7},
    {'type': 'light', 'kind': 'flame', 'depth': 0.35, 'pos': [960, 738], 'h': 22, 'color': '#ffb050', 'glow': 1.2},
]
scene('calf', 134, 'The Golden Calf', 'العجل',
  art=[ART, "The calf is drawn as a figure of gold, as the Quran describes (20:88); the Samiri appears only as a cold dim light."],
  prompt="A desert camp at night between braziers, a calf cast of gold standing on the sand, crowds of warm lights pressing around it and a cold grey light beside it; at the edge a steady light raising his arm, pleading; ink-wash and parchment texture.",
  world=NIGHT, ambient=['crowd', 'fire'], base='#141824', node='harun',
  layers=[
    *night_camp,
    calf,
    people(220, area=[300, 1400, -2600, -1600], at={'1': {'flicker': 0.4}}),
    light([900, FEET - 6], P(0.4, 1.7), depth=0.4, **cold),
    harun(560, FEET + 14, n=True, at={'2': {'pose': 'raise'}}),
    motes(0.14),
  ],
  beats=[
    {'dur': 11000, 'ambient': ['crowd', 'fire'], 'cam': cam([780, 525, 700], [800, 740, -3000]),
     'say': "While Musa was on the mountain, a man called the Samiri gathered the people's gold ornaments and cast from them a calf that made a lowing sound."},
    {'dur': 10000, 'ambient': ['crowd', 'chant'], 'cam': cam([800, 520, 900], [800, 680, -3000]),
     'say': "This is your god, and the god of Musa, he told them, and many began to worship it."},
    {'dur': 10000, 'ambient': ['crowd', 'fire'], 'cam': cam([680, 530, 650], [680, 760, -3000]),
     'say': "Harun pleaded with them: you are only being tested by this. Your Lord is the Most Merciful, so follow me."},
    {'dur': 12000, 'ambient': ['fire', 'air'], 'cam': cam([760, 520, 850], [780, 700, -3000]), 'pendingVerse': pv('20:90')},
  ])

# ── 135 · Musa returns ────────────────────────────────────────────────────
scene('anger', 135, "Musa's Return", 'رجوع موسى',
  art=[ART, "Nothing of the quarrel is shown beyond two lights drawn close. The calf is burned and its ashes blown away, as the Quran tells (20:97)."],
  prompt="The desert camp at dawn, a steady light come down from the mountain setting two stone tablets on the sand, a second steady light close before him; the golden calf burning in a fire until it is gone and its ash blows away over the sand toward the sea; ink-wash and parchment texture.",
  world=NIGHT, ambient=['wind', 'fire'], base='#141824', node='harun',
  layers=[
    heav([[4.6, 5.4, 10000], [5.4, 6, 10000], [6, 6.8, 10000], [6.8, 7.6, 12000]], horizon=640),
    *sinai(1040), *camp(1041),
    {**calf, 'show': [0, 2]},
    {'type': 'fire', 'show': [2, None], 'depth': 0.361, 'pos': [810, 780], 'w': P(0.36, 2.4), 'h': P(0.36, 3), 'heat': 1, 'at': {'3': {'cool': 1, 'coolDur': 3000}}},
    dust(box=(-200, 300, -2600, 2400, 900, -1800), count=600, size=5, color='#3a3434', opacity=0.5, wind=(120, 6, 0), swirl=40, blend='normal', show=[2, None]),
    people(200, area=[200, 1500, -2600, -1700], dim=0.35),
    {'type': 'tablets', 'depth': 0.44, 'x': 560, 'y': FEET + 24, 'h': P(0.44, 0.7), 'area': [500, 700, 620, 820]},
    musa(640, FEET + 16, n=True, at={'1': {'pos': [700, FEET + 16]}, '2': {'pos': [700, FEET + 16], 'pose': 'kneel'}, '3': {'pos': [700, FEET + 16], 'pose': 'kneel'}}),
    harun(760, FEET + 16, n=True, at={'2': {'pose': 'kneel'}, '3': {'pose': 'kneel'}}),
    motes(0.14),
  ],
  beats=[
    {'dur': 11000, 'ambient': ['wind', 'crowd'], 'cam': cam([720, 530, 650], [740, 760, -3000]),
     'say': "Musa came back to find his people worshipping the calf. Grieved and angry, he put down the tablets and took hold of his brother."},
    {'dur': 9000, 'ambient': ['wind'], 'cam': cam([720, 535, 500], [740, 800, -3000]),
     'say': "Son of my mother, said Harun, the people overpowered me and almost killed me. Do not let our enemies rejoice over me."},
    {'dur': 11000, 'ambient': ['fire', 'wind'], 'sfx': [{'name': 'ignite', 'at': 600}], 'cam': cam([760, 525, 750], [780, 720, -3000]),
     'say': "Musa prayed: my Lord, forgive me and my brother, and take us into Your mercy. Then the calf was burned, and its ashes scattered on the wind."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([760, 520, 850], [780, 690, -3000]), 'pendingVerse': pv('7:151')},
  ])

# ── 136 · The cow ─────────────────────────────────────────────────────────
herd = {'type': 'animals', 'show': [0, 1], 'depth': 0.36, 'fade': 'none', 'area': [380, 680, 1420, 820],
        'pairs': [{'kind': 'cow', 'solo': True, 's': round(1.4 * 150 * 0.36 / 76, 2), 'path': [[x, 780 + (i % 2) * 10]], 'face': -1 if i % 2 else 1}
                  for i, x in enumerate((440, 560, 680, 940, 1060, 1180, 1300))]}
yellow = {'type': 'animals', 'depth': 0.37, 'fade': 'none', 'area': [740, 680, 880, 820],
          'pairs': [{'kind': 'yellowcow', 'solo': True, 's': round(1.4 * 150 * 0.37 / 76, 2), 'path': [[810, 790]]}]}
scene('cow', 136, 'The Cow', 'البقرة',
  art=[ART, "The dead man and the slaughter of the cow are told, never shown (2:67–73)."],
  prompt="A camp in the desert at morning, a herd of cattle grazing among warm lights of the people; one bright yellow cow standing apart in a pool of sunlight while the others fade; a steady light among the crowd; ink-wash and parchment texture.",
  world=SAND, ambient=['herd', 'voices'], base='#d8c0a0',
  layers=[
    heav([[8, 9, 10000], [9, 10, 10000], [10, 11, 10000], [11, 12, 12000]]),
    *sinai(1050), *camp(1051),
    herd, yellow,
    {'type': 'light', 'kind': 'flame', 'show': [1, 3], 'depth': 0.369, 'pos': [810, 760], 'h': 90, 'color': '#fff4c8', 'glow': 0.5},
    people(160, area=[-300, 1900, -2900, -2200]),
    musa(1000, FEET + 16),
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['herd', 'voices'], 'cam': cam([800, 520, 800], [800, 700, -3000]),
     'say': "A man was found dead, and no one knew who had killed him. Through Musa, God told them: slaughter a cow."},
    {'dur': 11000, 'ambient': ['herd', 'voices'], 'cam': cam([810, 530, 550], [810, 780, -3000]),
     'say': "Instead they kept asking: how old? what colour? what kind? until it could only be one cow: bright yellow, never yoked to plough or well."},
    {'dur': 11000, 'ambient': ['voices', 'air'], 'cam': cam([820, 525, 750], [820, 720, -3000]),
     'say': "When part of it touched the dead man, God brought him to life for a moment to name his killer. So God gives life to the dead."},
    {'dur': 12000, 'ambient': ['herd', 'air'], 'cam': cam([810, 520, 800], [810, 700, -3000]), 'pendingVerse': pv('2:69')},
  ])

# ── 137 · Where the two seas meet ─────────────────────────────────────────
scene('twoseas', 137, 'Where the Two Seas Meet', 'ملتقى البحرين',
  art=[ART, "The companion (named Yusha' in the hadith) and the servant of God (named al-Khidr in the hadith) appear only as lights; al-Khidr as a soft green-white light. The fish slipping away is shown as a small silver light."],
  prompt="A rock at the meeting of two bodies of water, one blue and one grey-green, at dusk; a steady light and a smaller light of his young companion resting; a small silver light leaping from a basket into the water; then a soft green-white light waiting by the rock; ink-wash and parchment texture.",
  world=SEA, ambient=['sea', 'wind'], base='#8a98a8',
  layers=[
    heav([[16.4, 17.2, 10000], [17.2, 17.8, 10000], [17.8, 18.4, 12000]], horizon=650),
    {'type': 'ridge', 'depth': 0.03, 'y': 650, 'amp': 30, 'seed': 1060, 'sharp': 0.4, 'color': '#6a6a7a', 'haze': 0.4, 'fog': 0.5},
    {'type': 'water', 'depth': 0.1, 'points': [[-4000, 690], [800, 706], [1400, 760]], 'w0': 120, 'w1': 160, 'reflect': [['0', '#a8c4d8'], ['1', '#2a5a7a']]},
    {'type': 'water', 'depth': 0.1, 'points': [[5600, 690], [800, 706], [200, 760]], 'w0': 120, 'w1': 160, 'reflect': [['0', '#b8c8b8'], ['1', '#3a5a4a']]},
    {'type': 'ground', 'depth': 0.22, 'y': 752, 'amp': 6, 'seed': 1061, 'color': '#a89878', 'color2': '#6a5a48'},
    {'type': 'outcrop', 'depth': 0.34, 'x': 860, 'y': 790, 'w': P(0.34, 6), 'h': P(0.34, 3), 'shape': 'twin', 'seed': 1062, 'ppu': 0.9},
    {'type': 'basket', 'depth': 0.42, 'x': 1060, 'y': FEET + 22, 'w': P(0.42, 0.6), 'area': [1020, 780, 1100, 820]},
    {'type': 'light', 'kind': 'flame', 'depth': 0.421, 'h': 10, 'color': '#e8f0ff', 'glow': 1.2, 'pos': [1060, 800], 'show': [0, 1],
     'path': [[1060, 800], [1160, 720], [1300, 760]], 'dur': 2400, 'delay': 5000},
    musa(980, FEET + 16, n=True, at={'0': {'pose': 'kneel'}}),
    light([1100, FEET + 18], P(0.44, 1.5), depth=0.44, **{**dim, 'color': '#f4e0c0'}, pose='kneel'),
    light([760, FEET + 10], P(0.43, 1.75), depth=0.43, **khidr, show=[1, None]),
    motes(0.2),
  ],
  beats=[
    {'dur': 11000, 'ambient': ['sea', 'wind'], 'cam': cam([1000, 525, 700], [1000, 740, -3000]),
     'say': "Musa set out with a young companion to find a servant of God at the meeting of the two seas. When they rested by a rock, their fish slipped away into the sea."},
    {'dur': 10000, 'ambient': ['sea', 'air'], 'cam': cam([880, 525, 700], [880, 740, -3000]),
     'say': "That was the sign they had been seeking. Returning to the rock, they found one of God's servants, to whom He had given knowledge from Himself."},
    {'dur': 12000, 'ambient': ['sea', 'air'], 'cam': cam([900, 520, 850], [900, 690, -3000]), 'pendingVerse': pv('18:65')},
  ])

# ── 138 · The boat and the wall ───────────────────────────────────────────
scene('boatwall', 138, 'The Boat and the Wall', 'السفينة والجدار',
  art=[ART, "The servant of God appears as a soft green-white light. Of the boy, nothing is shown: his part of the story is told in words alone."],
  prompt="A small wooden boat drawn up on a grey shore, a soft green-white light kneeling by its side where one plank is broken, a steady light watching in dismay; then a poor village of mud walls at dusk, a leaning wall rising straight again course by course under the soft light's hands; ink-wash and parchment texture.",
  world=SEA, ambient=['sea', 'wind'], base='#8a98a8', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 2], 'layers': [
      heav([[9, 10, 10000], [10, 11, 10000]], horizon=650),
      {'type': 'ridge', 'depth': 0.03, 'y': 650, 'amp': 30, 'seed': 1060, 'sharp': 0.4, 'color': '#6a6a7a', 'haze': 0.4, 'fog': 0.5},
      {'type': 'water', 'depth': 0.12, 'points': [[-4000, 700], [800, 704], [6000, 708]], 'w0': 90, 'w1': 90, 'reflect': [['0', '#b8ccd8'], ['1', '#3a5a72']]},
      {'type': 'ground', 'depth': 0.24, 'y': 760, 'amp': 4, 'seed': 1070, 'color': '#a89878', 'color2': '#6a5a48'},
      {'type': 'boat', 'depth': 0.36, 'x': 900, 'y': 806, 'w': P(0.36, 7), 'area': [700, 560, 1100, 820], 'at': {'0': {'hole': True}}},
      light([980, FEET + 8], P(0.4, 1.75), depth=0.4, **khidr, pose='kneel'),
      musa(720, FEET + 16),
    ]},
    {'type': 'set', 'show': [2, None], 'dx': 6000, 'layers': [
      heav([[17, 17.8, 10000], [17.8, 18.4, 12000]], horizon=640),
      {'type': 'town', 'depth': 0.14, 'y': 720, 'x0': 200, 'x1': 1400, 's': P(0.14, 1) / 30, 'grade': 'town', 'lit': 0.15, 'haze': '#a89888', 'seed': 1071},
      {'type': 'ground', 'depth': 0.2, 'y': 740, 'amp': 4, 'seed': 1072, 'color': '#b8a080', 'color2': '#8a7458'},
      {'type': 'masonry', 'depth': 0.34, 'pos': [900, 790], 'w': P(0.34, 8), 'h': P(0.34, 2.6), 'side': 0, 'courses': 8, 'blocks': 12, 'built': 0.45,
       'stone': '#b8a080', 'stone2': '#c8b090', 'ink': '#6a5a48', 'at': {'2': {'build': [0.45, 1, 7000, 800]}, '3': {'built': 1}}},
      light([760, FEET + 4], P(0.4, 1.75), depth=0.4, **khidr, pose='reach'),
      musa(600, FEET + 16),
    ]},
  ],
  beats=[
    {'dur': 11000, 'ambient': ['sea', 'wind'], 'sfx': [{'name': 'scratch', 'at': 2000}], 'cam': cam([840, 525, 700], [860, 740, -3000]),
     'say': "You will not be able to bear with me patiently, the servant of God warned. They boarded a boat, and he broke a plank in its side. Musa could not keep silent."},
    {'dur': 9000, 'ambient': ['sea', 'air'], 'cam': cam([820, 520, 850], [840, 700, -3000]),
     'say': "Further on they met a boy, and the servant of God took his life. Again Musa protested; again he was reminded to be patient."},
    {'dur': 11000, 'ambient': ['wind', 'work'], 'cam': cam([760, 525, 700], [780, 740, -3000], dx=6000),
     'say': "In a town whose people refused them food, he rebuilt a wall that was about to fall, and asked nothing for it."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([780, 520, 850], [800, 700, -3000], dx=6000), 'pendingVerse': pv('18:68')},
  ])

# ── 139 · The hidden reasons ──────────────────────────────────────────────
scene('reasons', 139, 'The Hidden Reasons', 'الأسباب الخفية',
  art=[ART, "The servant of God appears as a soft green-white light. The king's ships, the parents and the orphans' treasure are shown only as he explains them."],
  prompt="Three quiet scenes: a grey sea with a line of a king's dark ships taking every sound boat, while one damaged boat is left on the shore; a mother and father of light with a new small light between them; a straightened village wall with a faint gold glow of buried treasure beneath it; ink-wash and parchment texture.",
  world=SEA, ambient=['sea', 'air'], base='#8a98a8', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 1], 'layers': [
      heav([[16, 17, 10000]], horizon=650),
      {'type': 'water', 'depth': 0.12, 'points': [[-4000, 700], [800, 704], [6000, 708]], 'w0': 90, 'w1': 90, 'reflect': [['0', '#b8ccd8'], ['1', '#3a5a72']]},
      *[{'type': 'boat', 'depth': 0.13, 'x': 300 + i * 260, 'y': 700, 'w': P(0.13, 9), 'wood': '#3a2e28', 'sail': '#6a5a5a', 'area': [200 + i * 260, 600, 420 + i * 260, 706],
         'move': {'path': [[300, 0, 0]], 'dur': 20000}} for i in range(4)],
      {'type': 'ground', 'depth': 0.24, 'y': 760, 'amp': 4, 'seed': 1070, 'color': '#a89878', 'color2': '#6a5a48'},
      {'type': 'boat', 'depth': 0.36, 'x': 900, 'y': 806, 'w': P(0.36, 7), 'hole': True, 'area': [700, 560, 1100, 820]},
    ]},
    {'type': 'set', 'show': [1, 2], 'dx': 6000, 'layers': [
      heav([[None, None], None], horizon=640) if False else heav([[18, 19, 10000]], horizon=640),
      {'type': 'ground', 'depth': 0.2, 'y': 740, 'amp': 4, 'seed': 1072, 'color': '#b8a080', 'color2': '#8a7458'},
      {'type': 'tent', 'depth': 0.36, 'x': 800, 'y': 790, 'w': P(0.36, 6), 'h': P(0.36, 2.2), 'lit': True, 'ppu': 0.9},
      light([720, FEET + 4], P(0.42, 1.7), depth=0.42, **{**dim, 'color': '#fff0dc'}),
      light([880, FEET + 4], P(0.42, 1.6), depth=0.42, **{**dim, 'color': '#fff0dc'}),
      light([800, FEET + 6], P(0.421, 0.5), depth=0.421, pose='babe', w=1, color='#fffaf0', glow=0.6, bright=1.2),
    ]},
    {'type': 'set', 'show': [2, None], 'dx': 12000, 'layers': [
      heav([[18.4, 19, 10000], [19, 19.6, 12000]], horizon=640),
      {'type': 'town', 'depth': 0.14, 'y': 720, 'x0': 200, 'x1': 1400, 's': P(0.14, 1) / 30, 'grade': 'town', 'lit': 0.2, 'haze': '#a89888', 'seed': 1071},
      {'type': 'ground', 'depth': 0.2, 'y': 740, 'amp': 4, 'seed': 1072, 'color': '#b8a080', 'color2': '#8a7458'},
      {'type': 'masonry', 'depth': 0.34, 'pos': [900, 790], 'w': P(0.34, 8), 'h': P(0.34, 2.6), 'side': 0, 'courses': 8, 'blocks': 12, 'built': 1,
       'stone': '#b8a080', 'stone2': '#c8b090', 'ink': '#6a5a48'},
      {'type': 'light', 'kind': 'flame', 'depth': 0.341, 'pos': [900, 800], 'h': 24, 'color': '#ffd060', 'glow': 1.2},
      light([660, FEET + 6], P(0.42, 1.75), depth=0.42, **khidr),
      musa(560, FEET + 14),
    ]},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['sea', 'wind'], 'cam': cam([800, 515, 950], [820, 660, -3000]),
     'say': "Then he explained. The boat belonged to poor fishermen, and a king was seizing every sound boat; a damaged one would be left to them."},
    {'dur': 10000, 'ambient': ['air'], 'cam': cam([800, 530, 600], [800, 780, -3000], dx=6000),
     'say': "The boy would have brought grief and disbelief upon his believing parents; God would give them a better child, purer and more loving."},
    {'dur': 10000, 'ambient': ['wind', 'air'], 'cam': cam([760, 525, 700], [780, 740, -3000], dx=12000),
     'say': "And under the wall lay a treasure belonging to two orphans, whose father had been a righteous man; it would wait for them until they came of age."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([760, 520, 850], [780, 700, -3000], dx=12000), 'pendingVerse': pv('18:82', 'its closing: "…as a mercy from your Lord. And I did it not of my own accord."')},
  ])

# ── 140 · Forty years ─────────────────────────────────────────────────────
scene('forty', 140, 'Forty Years in the Wilderness', 'التيه',
  art=[ART, "Of Musa's and Harun's deaths nothing is shown; the chapter closes on the wandering."],
  prompt="The edge of a green land seen across a desert from a ridge, a great camp of warm lights halted before it; then the desert under a sky racing through day and night again and again as the camp moves in slow circles across the sand; two steady lights at its head; ink-wash and parchment texture.",
  world=SAND, ambient=['wind', 'desert'], base='#d8c0a0',
  layers=[
    heav([[15, 16.5, 10000], [6, 18, 14000, 20], [16, 17.4, 12000]]),
    {'type': 'ridge', 'depth': 0.03, 'y': 640, 'amp': 20, 'seed': 1080, 'sharp': 0.2, 'color': '#7a8a6a', 'haze': 0.4, 'fog': 0.5},
    {'type': 'ground', 'depth': 0.06, 'y': 660, 'amp': 10, 'seed': 1081, 'color': '#7a9a5a', 'color2': '#5a7a42', 'grass': True, 'grassColor': '#9aae68'},
    {'type': 'dunes', 'depth': 0.12, 'y': 700, 'amp': 20, 'count': 9, 'seed': 1082, 'lit': '#f0c890', 'body': '#c8925e', 'shade': '#7a4a40'},
    {'type': 'crowd', 'area': [-200, 1800, -4000, -2400], 'y': [770, 720], 'count': 300, 'size': P(0.28), 'color': '#ffe0b0', 'dim': 0.4, 'glow': 0.12,
     'mill': 6, 'speed': 0, 'flicker': 0.1, 'at': {'1': {'flow': [1, 0.3], 'speed': 50, 'mill': 3}}},
    {'type': 'dunes', 'depth': 0.3, 'y': 800, 'amp': 30, 'count': 6, 'seed': 1083, 'lit': '#e8b880', 'body': '#b8824e', 'shade': '#6a3e34'},
    musa(860, 812, 0.44), harun(800, 814, 0.44),
    dust(box=(-1400, 300, -6000, 3000, 950, 0), count=400, size=4, color='#e8c8a0', opacity=0.3, wind=(-30, -4, 0), blend='normal'),
  ],
  beats=[
    {'dur': 11000, 'ambient': ['wind', 'voices'], 'cam': cam([820, 515, 900], [820, 640, -3000]),
     'say': "Musa brought them to the edge of the holy land, but they were afraid of the people there and refused to enter: go, you and your Lord, and fight. We will sit here."},
    {'dur': 14000, 'ambient': ['wind', 'desert'], 'cam': cam([800, 510, 1100], [800, 600, -3000]),
     'say': "So for forty years they wandered in the desert, until a new generation grew up."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([800, 510, 1000], [800, 610, -3000]), 'pendingVerse': pv('5:26')},
  ])

write_chapter(C13 + 'chapter.json', {
    'number': 13, 'title': 'Musa in the Wilderness', 'arabic': 'موسى في التيه', 'nodes': ['dhulkifl'] if False else [],
    'parts': [{'title': 'Provision', 'from': O(131), 'to': O(132)}, {'title': 'The Mountain and the Calf', 'from': O(133), 'to': O(135)},
              {'title': 'The Cow and Qarun', 'from': O(136), 'to': O(136)}, {'title': 'Musa and the Servant of God', 'from': O(137), 'to': O(139)}, {'title': 'The Wandering', 'from': O(140), 'to': O(140)}]})
print('c13 ok')
