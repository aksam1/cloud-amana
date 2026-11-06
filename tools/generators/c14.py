from base import *
from rooms import room, front

# Chapter 14 · Dhul-Kifl, Dawud and Sulayman. True scale: a person of 1.7 m is 255 × depth design units.
C14 = ROOT + 'src/story/chapters/c14/'
os.makedirs(C14, exist_ok=True)


def scene(sid, order, node, title, arabic, art, prompt, world, layers, beats, ambient, base='#1a1820', dissolve=2400):
    order = ORDER.get(sid, order)
    s = {'id': sid, 'chapter': 14, 'order': order, 'node': node, 'title': title, 'arabic': arabic, 'source': 'quran', 'ayahs': [], 'art': art,
         'ambient': ambient, 'base': base, 'captions': 'parchment', 'renderer': 'gl', 'pen': True, 'dissolve': dissolve, 'world': world,
         'cam': beats[0]['cam'], 'imagePrompt': prompt, 'layers': layers, 'beats': beats}
    open(C14 + f's{order}-{sid}.json', 'w').write(dump(s))


def pv(ref, part=None):
    v = {'ref': ref, 'place': 'sky'}
    if part:
        v['part'] = part
    return v


P = lambda d, m=1.7: round(m * 150 * d)
D = 0.42
FEET = 792
HILLS = {'fog': '#c8c0b0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.0, 'rays': 0, 'bloom': 0.65, 'haze': 0.05, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
NIGHT = {'fog': '#141824', 'fogNear': 6000, 'fogFar': 40000, 'light': 0.9, 'rays': 0, 'bloom': 0.8, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
HALL = {'fog': '#2a2430', 'fogNear': 4000, 'fogFar': 30000, 'light': 0.95, 'rays': 0, 'bloom': 0.75, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0}
SAND = {'fog': '#dcc0a0', 'fogNear': 6000, 'fogFar': 40000, 'light': 1.05, 'rays': 0, 'bloom': 0.6, 'haze': 0.2, 'hazeY': 0.62, 'shake': 0.3, 'dof': 0}

prophet_d = dict(color='#fffaf0', glow=0.35, bright=1.1, solid=0.5)
prophet_n = dict(color='#fffaf0', glow=0.6, bright=1.35)
dim = dict(color='#ecc49a', glow=0.25, bright=0.95, solid=0.6)
cold = dict(color='#b8b0c8', glow=0.2, bright=0.85, solid=0.7)
queen = dict(color='#f4dcc0', glow=0.35, bright=1.0, solid=0.55)
SUN = {'rise': 6, 'set': 18, 'x0': 300, 'x1': 1300, 'peak': 300, 'size': 34}
MOON = {'rise': 19, 'set': 6.5, 'x0': 1300, 'x1': 300, 'peak': 340, 'size': 24}
motes = lambda opacity=0.28, **kw: dust(box=(-1400, 200, -8000, 3000, 950, 600), count=400, size=2.6, color='#fff0d8', opacity=opacity, wind=(4, -2, 0), **kw)


def heav(tods, sun=SUN, moon=MOON, horizon=630):
    t0, *rest = tods
    h = {'type': 'heavens', 'horizon': horizon, 'tod': t0, 'sun': sun, 'moon': moon}
    if rest:
        h['at'] = {str(i + 1): {'tod': t} for i, t in enumerate(rest) if t}
    return h


def judea(seed=1100, green=True):
    return [
        {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 50, 'seed': seed, 'sharp': 0.3, 'color': '#8a8a78', 'haze': 0.35, 'fog': 0.4},
        {'type': 'ridge', 'depth': 0.08, 'y': 660, 'amp': 40, 'seed': seed + 1, 'sharp': 0.3, 'color': '#7a8064', 'haze': 0.25, 'fog': 0.3},
        {'type': 'ground', 'depth': 0.14, 'y': 690, 'amp': 10, 'seed': seed + 2, 'color': '#7a8a52' if green else '#b0a078', 'color2': '#4a5a32' if green else '#8a7a58', 'grass': green, 'grassColor': '#9aaa62'},
    ]


def palace(stone='#e0d0b4'):
    return [
        {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, '#1a2030'], [1, '#121620']]},
        {'type': 'facade', 'depth': 0.18, 'x': 800, 'y': 712, 'w': 2400, 'h': 820, 'stone': stone, 'light': 0.85, 'doors': [{'x': 800, 'w': 70, 'h': 120, 'lit': True}]},
        {'type': 'column', 'depth': 0.26, 'x': 420, 'y': 740, 'h': 600, 'w': 44, 'stone': '#d8c8a8', 'lit': '#f8ecd0', 'dark': '#6a5a48'},
        {'type': 'column', 'depth': 0.26, 'x': 1180, 'y': 740, 'h': 600, 'w': 44, 'stone': '#d8c8a8', 'lit': '#f8ecd0', 'dark': '#6a5a48'},
        {'type': 'brazier', 'depth': 0.3, 'x': 640, 'y': 790, 's': 0.6},
        {'type': 'light', 'kind': 'flame', 'depth': 0.3, 'pos': [640, 742], 'h': 20, 'color': '#ffb050', 'glow': 1.1},
        {'type': 'brazier', 'depth': 0.3, 'x': 960, 'y': 790, 's': 0.6},
        {'type': 'light', 'kind': 'flame', 'depth': 0.3, 'pos': [960, 742], 'h': 20, 'color': '#ffb050', 'glow': 1.1},
    ]


def floor(gloss=0.4, color='#5a5048', color2='#1e1a18'):
    return {'type': 'floor', 'depth': 0.19, 'y': 714, 'vp': [800, 500], 'color': color, 'color2': color2, 'lines': 14, 'gloss': gloss, 'area': [-800, 708, 2400, 1350]}


def army(count=300, **kw):
    return {'type': 'crowd', 'kind': 'army', 'area': [-200, 1800, -4200, -2600], 'y': [780, 730], 'rows': 8, 'cols': 30, 'size': P(0.26), 'color': '#c8b8a8',
            'dim': 0.3, 'glow': 0.3, **kw}


ART = "The prophets appear only as steady lights; kings, armies, the queen and the people as dim figures of light; the jinn as smouldering shadows. The look of the land is imagined."

# ── 141 · Dhul-Kifl ───────────────────────────────────────────────────────
scene('kifl', 141, 'dhulkifl', 'Dhul-Kifl', 'ذو الكفل',
  art=[ART, "Who Dhul-Kifl was is debated among scholars; that he pledged to fast by day, pray by night and judge without anger is from the commentaries."],
  prompt="A town gate of pale stone at dusk, a steady light seated beneath its arch with dim lights of people waiting to be heard; then days and nights racing past in the sky while the light stays at his place, kneeling in prayer by night; ink-wash and parchment texture.",
  world=HILLS, ambient=['voices', 'wind'], base='#c8c0b0',
  layers=[
    heav([[16, 17.6, 10000], [6, 18, 12000, 6], [18.4, 19.6, 12000]]),
    *judea(1100),
    {'type': 'town', 'depth': 0.14, 'y': 700, 'x0': 100, 'x1': 1500, 's': P(0.14, 1) / 30, 'grade': 'town', 'lit': 0.3, 'haze': '#b8a898', 'seed': 1103},
    {'type': 'facade', 'depth': 0.34, 'x': 800, 'y': 790, 'w': P(0.34, 16), 'h': P(0.34, 7), 'gate': {'w': P(0.34, 3.6), 'h': P(0.34, 5)}, 'towers': True, 'stone': '#d8c8a8', 'ppu': 0.8},
    light([800, 788], P(0.36, 1.75), depth=0.36, **prophet_d, pose='kneel', at={'2': {'color': '#fffaf0', 'glow': 0.6, 'bright': 1.35}}),
    *[light([960 + i * 44, 790 + (i % 2) * 4], P(0.37), depth=0.37, **dim) for i in range(6)],
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['voices', 'wind'], 'cam': cam([860, 525, 800], [880, 700, -3000]),
     'say': "Among the prophets the Quran names is Dhul-Kifl, a man known for his patience."},
    {'dur': 12000, 'ambient': ['wind', 'voices'], 'cam': cam([840, 520, 900], [860, 680, -3000]),
     'say': "It is said he promised to fast every day, to pray every night, and to judge between people without ever losing his temper; and he kept his word."},
    {'dur': 12000, 'ambient': ['crickets', 'air'], 'cam': cam([820, 520, 900], [840, 680, -3000]),
     'verse': {'ref': '21:85', 'ar': [0, 7], 'place': 'sky', 'en': 'And [mention] Ishmael and Idrees and Dhul-Kifl; all were of the patient.'}},
  ])

# ── 142 · Talut's army at the river ───────────────────────────────────────
scene('river', 142, 'dawud', "Talut's Army", 'جيش طالوت',
  art=[ART, "Talut appears as a dim figure of light at the head of the army."],
  prompt="A wide shallow river crossing green hills at noon, ranks of an army of dim lights coming down to it; most kneel and drink deep and stay behind on the bank, while a small band of lights crosses on, a few cupping a single handful; ink-wash and parchment texture.",
  world=HILLS, ambient=['water', 'army'], base='#c8c0b0',
  layers=[
    heav([[11, 12, 10000], [12, 13, 10000], [13, 14, 12000]]),
    *judea(1110),
    {'type': 'water', 'depth': 0.22, 'points': [[-2000, 742], [800, 750], [3600, 758]], 'w0': 70, 'w1': 70, 'reflect': [['0', '#b8d0d8'], ['1', '#4a6a7a']]},
    {'type': 'crowd', 'kind': 'army', 'area': [200, 1400, -2400, -1900], 'y': [800, 770], 'rows': 6, 'cols': 24, 'size': P(0.32), 'color': '#d8c8b0', 'dim': 0.25, 'glow': 0.3,
     'at': {'1': {'out': 0.8, 'outDur': 5000}, '2': {'out': 0.8, 'outDur': 1}}},
    light([1100, 812], P(0.42), depth=0.42, **dim),
    {'type': 'ground', 'depth': 0.55, 'y': 880, 'amp': 6, 'seed': 1112, 'color': '#5a6a3a', 'color2': '#3a4a2a', 'grass': True, 'grassColor': '#7a8a4a', 'wind': 1},
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['army', 'wind'], 'cam': cam([800, 515, 1000], [800, 640, -3000]),
     'say': "Long after Musa, the Children of Israel asked for a king to lead them, and God chose Talut."},
    {'dur': 11000, 'ambient': ['water', 'voices'], 'cam': cam([800, 520, 800], [800, 700, -3000]),
     'say': "At a river he tested his army: whoever drinks his fill is not with me, except a single handful. Most drank; only a few held back."},
    {'dur': 12000, 'ambient': ['water', 'air'], 'cam': cam([800, 515, 950], [800, 650, -3000]), 'pendingVerse': pv('2:249', 'its closing: "How many a small company has overcome a large company by permission of Allah…"')},
  ])

# ── 143 · Dawud and Jalut ─────────────────────────────────────────────────
scene('jalut', 143, 'dawud', 'Dawud and Jalut', 'داود وجالوت',
  art=[ART, "Jalut appears as a tall cold light; his fall is a light going out, nothing more. The sling is from the commentaries."],
  prompt="Two armies of dim lights facing each other across a valley floor at morning; from the larger army a giant cold grey light strides out; from the small band a young steady light steps forward; a small arc of light, and the giant light goes out; ink-wash and parchment texture.",
  world=HILLS, ambient=['army', 'wind'], base='#c8c0b0',
  layers=[
    heav([[8, 9, 10000], [9, 9.6, 10000], [9.6, 10.4, 12000]]),
    *judea(1120, green=False),
    army(area=[1000, 2200, -4200, -3000], color='#b8b0c8', at={'2': {'out': 0.6, 'outDur': 3000}}),
    {'type': 'crowd', 'kind': 'army', 'area': [-400, 500, -3600, -3000], 'y': [770, 740], 'rows': 4, 'cols': 10, 'size': P(0.26), 'color': '#e8d8b8', 'dim': 0.2, 'glow': 0.3},
    light([1080, FEET], P(D, 2.6), depth=D, **cold, at={'1': {'pose': 'gone'}, '2': {'pose': 'gone'}}),
    light([640, FEET + 4], P(D, 1.6), depth=D, **prophet_d, at={'1': {'pose': 'raise'}}),
    {'type': 'light', 'kind': 'flame', 'show': [1, 2], 'depth': D, 'h': 8, 'color': '#fffaf0', 'glow': 1.4, 'pos': [660, 700], 'path': [[660, 700], [860, 640], [1080, 690]], 'dur': 900, 'delay': 1500},
    {'type': 'flash', 'show': [1, 2], 'color': '#fffaf0', 'peak': 0.3, 'delay': 2400, 'rise': 100, 'dur': 1600},
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['army', 'wind'], 'cam': cam([860, 525, 700], [860, 740, -3000]),
     'say': "When they faced the army of Jalut, the giant warrior strode out and challenged them. The small band prayed: our Lord, pour patience upon us."},
    {'dur': 9000, 'ambient': ['wind'], 'sfx': [{'name': 'whoosh', 'at': 1500}, {'name': 'drop', 'at': 2500}], 'cam': cam([860, 525, 700], [860, 740, -3000]),
     'say': "A young man named Dawud stepped forward, and by God's permission he brought Jalut down."},
    {'dur': 12000, 'ambient': ['army', 'air'], 'cam': cam([820, 515, 950], [820, 650, -3000]), 'pendingVerse': pv('2:251', 'from its opening to "and gave him the kingship and prophethood"')},
  ])

# ── 144 · The mountains sing ──────────────────────────────────────────────
birds = [{'type': 'light', 'kind': 'bird', 'depth': 0.2, 'h': 12, 'color': '#fffaf0', 'glow': 0.6, 'bright': 1.3, 'delay': i * 300,
          'path': [[600 + i * 60, 300, -4000], [900 + (i % 3) * 80, 260 + i * 10, -4000], [1100 - i * 40, 340, -4000], [800 + i * 30, 300, -4000]], 'dur': 9000} for i in range(9)]
scene('psalms', 144, 'dawud', 'The Mountains Sing', 'تسبيح الجبال',
  art=[ART, "Dawud's recitation of the Zabur is heard as a wordless voice; no music. The mountains' and birds' praise is shown as light on the peaks and birds circling, as the Quran tells (34:10, 21:79)."],
  prompt="Dawn over high green mountains, a steady light standing on a rocky shoulder, birds of light circling above him; the peaks catching the first gold one after another as if answering; ink-wash and parchment texture.",
  world=HILLS, ambient=['chant', 'birds'], base='#c8c0b0',
  layers=[
    heav([[4.8, 5.8, 10000], [5.8, 6.6, 10000], [6.6, 7.4, 12000]], horizon=600),
    {'type': 'peak', 'depth': 0.05, 'x': 400, 'y': 280, 'w': 800, 'h': 380, 'color': '#5a6070', 'lit': '#d8b890', 'seed': 1130},
    {'type': 'peak', 'depth': 0.05, 'x': 1250, 'y': 250, 'w': 900, 'h': 420, 'color': '#5a6070', 'lit': '#e8c8a0', 'seed': 1131},
    {'type': 'ridge', 'depth': 0.1, 'y': 660, 'amp': 70, 'seed': 1132, 'sharp': 0.5, 'color': '#6a7464', 'haze': 0.2, 'fog': 0.3},
    *birds,
    {'type': 'ground', 'depth': 0.36, 'y': 800, 'amp': 18, 'seed': 1133, 'color': '#6a7454', 'color2': '#3a4434', 'grass': True, 'grassColor': '#8a9a5a'},
    light([800, 800], P(0.4), depth=0.4, **prophet_d, at={'1': {'pose': 'raise'}}),
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['chant', 'wind'], 'cam': cam([800, 500, 1000], [800, 540, -3000]),
     'say': "God made Dawud king and prophet, and gave him the Zabur, the Psalms."},
    {'dur': 11000, 'ambient': ['chant', 'birds'], 'cam': cam([800, 490, 1100], [800, 480, -3000]),
     'say': "When he glorified God, the mountains and the birds joined in his praise."},
    {'dur': 12000, 'ambient': ['birds', 'air'], 'cam': cam([800, 495, 1050], [800, 500, -3000]), 'pendingVerse': pv('34:10')},
  ])

# ── 145 · Iron made soft ──────────────────────────────────────────────────
scene('iron', 145, 'dawud', 'Iron Made Soft', 'الحديد اللين',
  art=[ART, "The softened iron is shown as glowing rings of mail being linked, as the Quran tells (34:10–11)."],
  prompt="A dark smithy at night, a forge glowing orange, a steady light at the anvil with rings of glowing iron drawn out like thread and linked into a coat of mail that hangs shining on a frame; ink-wash and parchment texture.",
  world=HALL, ambient=['fire', 'work'], base='#10141e',
  layers=[
    *room('smithy'),
    {'type': 'brazier', 'depth': 0.3, 'x': 1020, 'y': 790, 's': 0.9},
    {'type': 'fire', 'depth': 0.301, 'pos': [1020, 724], 'w': P(0.3, 1.2), 'h': P(0.3, 1.2), 'heat': 1},
    {'type': 'garment', 'depth': 0.36, 'x': 1000, 'y': 760, 's': 0.5, 'area': [880, 560, 1120, 800]} if False else
    {'type': 'light', 'kind': 'flame', 'depth': 0.36, 'pos': [1000, 720], 'h': 50, 'color': '#ffb060', 'glow': 0.8},
    dust(box=(400, 300, -2600, 1500, 900, -1400), count=200, size=4, color='#ffb060', opacity=0.6, wind=(4, 30, 0), swirl=40),
    light([820, FEET], P(D), depth=D, **prophet_n, pose='reach'),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['fire', 'work'], 'sfx': [{'name': 'hoe', 'at': 1500}, {'name': 'hoe', 'at': 3000}, {'name': 'hoe', 'at': 4500}], 'cam': cam([800, 540, 500], [800, 820, -3000]),
     'say': "God made iron soft in Dawud's hands, and taught him to make coats of mail, linking the rings in good measure."},
    {'dur': 10000, 'ambient': ['fire', 'air'], 'cam': cam([800, 540, 400], [820, 850, -3000]),
     'say': "Though he was a king, he lived from the work of his own hands."},
    {'dur': 12000, 'ambient': ['fire', 'air'], 'cam': cam([800, 535, 600], [800, 780, -3000]), 'pendingVerse': pv('34:11', 'to "and work righteousness"')},
  ])

# ── 146 · The judgment of the field ───────────────────────────────────────
sheep = {'type': 'animals', 'depth': 0.36, 'fade': 'none', 'area': [600, 680, 1300, 820],
         'pairs': [{'kind': 'sheep', 'solo': True, 's': round(0.9 * 150 * 0.36 / 60, 2), 'path': [[x, 790 + (i % 2) * 8]], 'face': 1 if i % 2 else -1} for i, x in enumerate(range(660, 1260, 70))]}
scene('field', 146, 'sulayman', 'The Judgment of the Field', 'قضية الكرم',
  art=[ART, "The details of the case (the flock grazing a vineyard by night, and Sulayman's judgment) are from the commentaries on 21:78–79."],
  prompt="A vineyard by moonlight trampled by a flock of sheep; then a lamplit court where a king's steady light sits and a younger steady light beside him speaks, two dim lights of the owners before them; ink-wash and parchment texture.",
  world=NIGHT, ambient=['sheep', 'crickets'], base='#141824', dissolve=2600,
  layers=[
    {'type': 'set', 'show': [0, 1], 'layers': [
      heav([[22, 23, 10000]], horizon=640),
      *judea(1140),
      {'type': 'ground', 'depth': 0.3, 'y': 800, 'amp': 4, 'seed': 1141, 'color': '#4a5a34', 'color2': '#2a3420', 'crop': 'shoots', 'field': {'x0': -200, 'x1': 1800, 'y0': 770, 'y1': 860}},
      sheep,
    ]},
    {'type': 'set', 'show': [1, None], 'dx': 6000, 'layers': [
      *room('dawudcourt'),
      light([760, 760], P(0.3), depth=0.3, **prophet_n, pose='kneel'),
      light([860, 760], P(0.3, 1.6), depth=0.3, **prophet_n, at={'1': {'pose': 'raise'}}),
      light([720, FEET + 4], P(D), depth=D, **dim),
      light([900, FEET + 4], P(D), depth=D, **dim),
    ]},
  ],
  beats=[
    {'dur': 10000, 'ambient': ['sheep', 'crickets'], 'cam': cam([900, 520, 800], [920, 700, -3000]),
     'say': "One night a flock of sheep strayed into a vineyard and ate it bare. The owners brought the case to Dawud."},
    {'dur': 11000, 'ambient': ['echo', 'voices'], 'cam': cam([800, 535, 500], [800, 860, -3000], dx=6000),
     'say': "His young son Sulayman suggested a better judgment: let the vineyard's owner keep the flock's milk and wool while the shepherd restores the vines; then each takes back his own."},
    {'dur': 12000, 'ambient': ['echo', 'air'], 'cam': cam([800, 530, 700], [800, 780, -3000], dx=6000), 'pendingVerse': pv('21:79', 'to "and to each [of them] We gave judgement and knowledge"')},
  ])

# ── 147 · The kingdom of Sulayman ─────────────────────────────────────────
jinn = [light([300 + i * 110, 760 + (i % 2) * 10], P(0.36, 2.2), depth=0.36, kind='ember', color='#ff6a2a', glow=0.6) for i in range(5)]
scene('kingdom', 147, 'sulayman', 'The Kingdom of Sulayman', 'مملكة سليمان',
  art=[ART, "The jinn who worked for Sulayman appear as smouldering shadows; the wind at his command as streaming dust (34:12)."],
  prompt="A great city of white stone rising on hills, a vast hall being raised course by course by smouldering shadow figures, a wind streaming across the sky, birds wheeling overhead; ranks of men of dim light and shadows of jinn assembled before a steady light; ink-wash and parchment texture.",
  world=HILLS, ambient=['work', 'wind'], base='#c8c0b0',
  layers=[
    heav([[9, 11, 10000], [11, 14, 10000, 2], [14, 15.4, 12000]]),
    *judea(1150),
    {'type': 'masonry', 'depth': 0.13, 'pos': [1080, 690], 'w': P(0.13, 34), 'h': P(0.13, 16), 'side': 40, 'courses': 18, 'blocks': 26, 'built': 0.3,
     'stone': '#e8dcc4', 'stone2': '#f4ecd8', 'ink': '#6a5a48', 'door': {'x': 0.5, 'w': 0.1, 'h': 0.3}, 'at': {'0': {'build': [0.3, 0.7, 10000]}, '1': {'build': [0.7, 1, 9000]}, '2': {'built': 1}}},
    *birds,
    dust(box=(-2000, -200, -9000, 3600, 500, -2000), count=500, size=6, color='#e8e0d0', opacity=0.35, wind=(140, 0, 0), blend='normal'),
    *jinn,
    {'type': 'crowd', 'kind': 'army', 'area': [800, 1600, -1800, -1400], 'y': [FEET + 6, 780], 'rows': 4, 'cols': 10, 'size': P(0.38), 'color': '#e8d8b8', 'dim': 0.2, 'glow': 0.3},
    light([760, FEET + 10], P(0.44), depth=0.44, **prophet_d),
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['work', 'wind'], 'sfx': [{'name': 'hoe', 'at': 2000}], 'cam': cam([860, 515, 1000], [880, 620, -3000]),
     'say': "Sulayman inherited his father's kingdom and prophethood. God gave him a kingdom like no other: the wind blew at his command, and jinn built for him."},
    {'dur': 11000, 'ambient': ['army', 'birds'], 'cam': cam([820, 525, 700], [840, 730, -3000]),
     'say': "He was taught the language of the birds, and his armies were gathered of men, jinn and birds, marching in ordered ranks."},
    {'dur': 12000, 'ambient': ['wind', 'air'], 'cam': cam([840, 515, 950], [860, 640, -3000]), 'pendingVerse': pv('27:17')},
  ])

# ── 148 · The valley of the ants ──────────────────────────────────────────
scene('ants', 148, 'sulayman', 'The Valley of the Ants', 'النملة والجيش',
  art=[ART, "The ant's warning is told as the Quran tells it (27:18); the ants are drawn in ink."],
  prompt="A close view of dry sandy ground, a file of tiny ink-drawn ants hurrying into the dark mouth of their nest; far behind, ranks of an army of lights halting on the valley floor, and a steady light at their head smiling down; ink-wash and parchment texture.",
  world=SAND, ambient=['army', 'wind'], base='#d8c0a0',
  layers=[
    heav([[15, 16, 10000], [16, 16.8, 10000], [16.8, 17.6, 12000]]),
    {'type': 'ridge', 'depth': 0.04, 'y': 620, 'amp': 50, 'seed': 1160, 'sharp': 0.4, 'color': '#a08070', 'haze': 0.4, 'fog': 0.4},
    {'type': 'ground', 'depth': 0.12, 'y': 680, 'amp': 6, 'seed': 1161, 'color': '#c8a880', 'color2': '#9a7a58'},
    army(area=[-200, 1800, -6000, -4200], at={'1': {'speed': 0}}),
    light([800, 700], P(0.17), depth=0.17, **prophet_d),
    {'type': 'ground', 'depth': 0.8, 'y': 860, 'amp': 4, 'seed': 1162, 'color': '#d0b088', 'color2': '#a08060'},
    {'type': 'ants', 'depth': 0.85, 'x0': 200, 'x1': 1100, 'y': 900, 'count': 46, 's': 9, 'home': [1140, 904], 'area': [100, 850, 1220, 940],
     'move': {'path': [[180, 0, 0]], 'dur': 20000}},
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['army', 'wind'], 'cam': cam([800, 560, 900], [800, 900, -3000]),
     'say': "Once, as Sulayman's army came to a valley, an ant called out: ants, go into your homes, or Sulayman and his soldiers may crush you without knowing."},
    {'dur': 11000, 'ambient': ['wind', 'air'], 'cam': cam([800, 520, 1000], [800, 640, -3000]),
     'say': "Sulayman heard her and smiled, and he thanked God for His favour."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([800, 520, 1000], [800, 640, -3000]), 'pendingVerse': pv('27:19', 'his prayer, from "My Lord, enable me to be grateful"')},
  ])

# ── 149 · The hoopoe ──────────────────────────────────────────────────────
scene('hoopoe', 149, 'sulayman', "The Hoopoe's News", 'خبر الهدهد',
  art=[ART, "The hoopoe appears as a single bird of light."],
  prompt="Sulayman's court in the open air at evening, ranks of birds of light settled on the walls; one small bird swooping in from far over the desert to land before a steady light, while far away in the south a land of gardens worships the rising sun; ink-wash and parchment texture.",
  world=HILLS, ambient=['birds', 'voices'], base='#c8c0b0',
  layers=[
    heav([[16.6, 17.4, 10000], [17.4, 18, 10000], [18, 18.6, 12000]]),
    *judea(1170, green=False),
    {'type': 'masonry', 'depth': 0.13, 'pos': [1080, 690], 'w': P(0.13, 34), 'h': P(0.13, 16), 'side': 40, 'courses': 18, 'blocks': 26, 'built': 1,
     'stone': '#e8dcc4', 'stone2': '#f4ecd8', 'ink': '#6a5a48', 'door': {'x': 0.5, 'w': 0.1, 'h': 0.3}},
    {'type': 'light', 'kind': 'bird', 'depth': 0.4, 'h': 14, 'color': '#ffe8c0', 'glow': 0.8, 'bright': 1.4,
     'path': [[1600, 300, -1500], [1200, 500, -1500], [900, 720, -1500], [870, 780, -1500]], 'dur': 6000, 'delay': 600},
    light([760, FEET + 10], P(0.44), depth=0.44, **prophet_d),
    {'type': 'crowd', 'kind': 'army', 'area': [-200, 600, -2000, -1600], 'y': [FEET + 6, 780], 'rows': 3, 'cols': 8, 'size': P(0.36), 'color': '#e8d8b8', 'dim': 0.25, 'glow': 0.3},
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['birds', 'voices'], 'cam': cam([840, 520, 800], [860, 700, -3000]),
     'say': "One day Sulayman missed the hoopoe among the birds. It came back at last with news."},
    {'dur': 11000, 'ambient': ['birds', 'air'], 'cam': cam([800, 530, 550], [820, 790, -3000]),
     'say': "I found a land called Saba, ruled by a queen who has been given everything and has a great throne. She and her people bow down to the sun instead of God."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([820, 520, 800], [840, 700, -3000]), 'pendingVerse': pv('27:23')},
  ])

# ── 150 · The queen of Saba ───────────────────────────────────────────────
scene('saba', 150, 'sulayman', 'The Queen of Saba', 'ملكة سبأ',
  art=[ART, "The queen (named Bilqis in the commentaries) appears as a soft dim light. The floor of glass is drawn as a gleaming floor like water (27:44)."],
  prompt="A great palace hall with a floor of glass so clear it gleams like still water, a soft light of a queen stepping onto it, a steady light standing at its far end beside a tall throne; then the queen's light bowing; ink-wash and parchment texture.",
  world=HALL, ambient=['echo', 'water'], base='#10141e',
  layers=[
    *room('sulayman'),
    floor(0.9, '#5a7a8a', '#1a2a34'),
    {'type': 'platform', 'depth': 0.24, 'x': 800, 'y': 728, 'w': P(0.24, 6), 'steps': 4, 'rise': P(0.24, 0.2), 'dais': P(0.24, 0.3), 'stone': '#c8a868', 'lit': '#f0d898', 'dark': '#5a4a28', 'ppu': 1},
    light([700, 728 - 4 * P(0.24, 0.2) - P(0.24, 0.3)], P(0.24), depth=0.241, **prophet_n),
    light([900, FEET + 10], P(0.44, 1.65), depth=0.44, **queen, at={'2': {'pose': 'kneel'}}),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['echo', 'voices'], 'cam': cam([820, 535, 500], [820, 860, -3000]),
     'say': "Sulayman sent the queen a letter calling her to God. She came to see him, and found her own throne already brought to his palace before her."},
    {'dur': 10000, 'ambient': ['echo', 'water'], 'cam': cam([860, 540, 400], [880, 900, -3000]),
     'say': "Enter the palace, she was told. Its floor was of glass so clear she thought it was water."},
    {'dur': 10000, 'ambient': ['echo', 'air'], 'cam': cam([840, 535, 500], [860, 860, -3000]),
     'say': "Then she understood. My Lord, she said, I have wronged myself; I submit with Sulayman to God, Lord of the worlds."},
    {'dur': 12000, 'ambient': ['echo', 'air'], 'cam': cam([820, 530, 700], [840, 790, -3000]), 'pendingVerse': pv('27:44', 'her words, from "My Lord, indeed I have wronged myself"')},
  ])

# ── 151 · The staff and the termite ───────────────────────────────────────
scene('termite', 151, 'sulayman', 'The Staff and the Termite', 'منسأة سليمان',
  art=[ART, "Sulayman's death is shown only as his light standing still, then gently fading; the jinn as smouldering shadows still at work. That he died leaning on his staff is told in 34:14."],
  prompt="A half-built temple of white stone, smouldering shadow figures labouring on its walls by day and night; a steady light standing still, leaning on a staff, through many days; a tiny insect at the foot of the staff; the staff gives way and the light fades; the shadows stop their work; ink-wash and parchment texture.",
  world=HILLS, ambient=['work', 'wind'], base='#c8c0b0',
  layers=[
    heav([[9, 18, 10000, 6], [8, 18, 12000, 10], [16.6, 17.8, 12000]]),
    *judea(1180),
    {'type': 'masonry', 'depth': 0.13, 'pos': [1080, 690], 'w': P(0.13, 30), 'h': P(0.13, 14), 'side': 40, 'courses': 18, 'blocks': 26, 'built': 0.5,
     'stone': '#e8dcc4', 'stone2': '#f4ecd8', 'ink': '#6a5a48', 'at': {'0': {'build': [0.5, 0.75, 10000]}, '1': {'build': [0.75, 0.95, 12000]}, '2': {'built': 0.95}}},
    *[{**j, 'at': {'2': {'pose': 'kneel'}}} for j in jinn],
    {'type': 'staff', 'depth': 0.441, 'x': 800, 'y': FEET + 10, 'len': P(0.44, 1.7), 'area': [680, 700, 920, 820]} if False else
    {'type': 'light', 'kind': 'flame', 'show': [0, 2], 'depth': 0.441, 'pos': [830, FEET], 'h': 4, 'color': '#8a6a3a', 'glow': 0.1},
    light([800, FEET + 10], P(0.44), depth=0.44, **prophet_d, pose='kneel', at={'1': {'pose': 'kneel'}, '2': {'pose': 'gone'}}),
    motes(),
  ],
  beats=[
    {'dur': 10000, 'ambient': ['work', 'wind'], 'sfx': [{'name': 'hoe', 'at': 2000}, {'name': 'hoe', 'at': 6000}], 'cam': cam([820, 520, 800], [840, 700, -3000]),
     'say': "When his time came, Sulayman died standing, leaning on his staff, while the jinn laboured on, thinking he was watching them."},
    {'dur': 11000, 'ambient': ['work', 'wind'], 'cam': cam([800, 535, 450], [800, 820, -3000]),
     'say': "Only when a small creature of the earth had gnawed through his staff, and he fell, did they understand."},
    {'dur': 10000, 'ambient': ['wind', 'air'], 'cam': cam([840, 520, 850], [860, 690, -3000]),
     'say': "Had the jinn known the unseen, they would not have stayed so long in their humiliating toil. Only God knows the unseen."},
    {'dur': 12000, 'ambient': ['air'], 'cam': cam([840, 520, 850], [860, 690, -3000]), 'pendingVerse': pv('34:14')},
  ])

write_chapter(C14 + 'chapter.json', {
    'number': 14, 'title': 'Dawud and Sulayman', 'arabic': 'داود وسليمان', 'nodes': ['dhulkifl', 'dawud', 'sulayman'],
    'parts': [{'title': 'Dhul-Kifl', 'from': O(141), 'to': O(141)}, {'title': 'Dawud', 'from': ORDER.get('tabut', O(142)), 'to': O(145)}, {'title': 'Sulayman', 'from': O(146), 'to': O(151)}]})
print('c14 ok')
