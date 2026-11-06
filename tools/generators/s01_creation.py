from base import *

# ── 1 · The heavens and the earth (rebuilt as eight beats) ────────────────
o = load('s01-heavens.json')
V = {b['verse']['ref']: b['verse'] for b in o['beats'] if 'verse' in b}

cos = {'type': 'cosmos', 'point': 1, 'thread': 0.18, 'ease': 3200, 'colors': ['#3a5aa8', '#d8a050', '#1a2550'],
       'at': {'1': {'point': 0.35, 'thread': 0.45, 'mass': 1, 'smoke': 0.2},
              '2': {'point': 0, 'thread': 0.15, 'mass': 1, 'smoke': 0.85, 'split': 1, 'lava': 0.65, 'ease': 2600},
              '3': {'thread': 0, 'mass': 0, 'smoke': 1, 'split': 1, 'lava': 0.75},
              '4': {'smoke': 0.55, 'split': 1, 'skies': 7, 'stars': 1, 'lava': 0.75, 'ease': 6500},
              '5': {'smoke': 0.35, 'split': 1, 'skies': 7, 'stars': 1, 'lava': 0.4, 'ease': 6000}}}

rise = lambda dy, dur, delay=0: {'path': [[0, -dy, 0]], 'dur': dur, 'delay': delay}
risen = lambda dy: {'path': [[0, -dy, 0]], 'dur': 1}

layers = [
    {'type': 'set', 'show': [0, 6], 'layers': [
        cos,
        dust(box=(-1600, -300, -14000, 3200, 1200, 0), count=700, size=3, color='#ffe8c0', opacity=0.4, wind=(2, -1, 0), swirl=70),
    ]},
    {'type': 'set', 'show': [6, None], 'dx': 6000, 'layers': [
        {'type': 'heavens', 'horizon': 640, 'sun': {'rise': 6, 'set': 18, 'x0': 1080, 'x1': 300, 'peak': 420, 'size': 38},
         'tod': [4.9, 5.6, 9000], 'at': {'7': {'tod': [5.6, 6.8, 10000]}}},
        {'type': 'ridge', 'depth': 0.05, 'y': 640, 'amp': 40, 'seed': 11, 'sharp': 0.3, 'color': '#2e2a3a', 'haze': 0.3, 'fog': 0.4,
         'at': {'7': {'color': '#6a6478'}}},
        {'type': 'ridge', 'depth': 0.08, 'y': 900, 'amp': 170, 'seed': 3, 'sharp': 0.75, 'color': '#4e4a62', 'haze': 0.35, 'fog': 0.5,
         'at': {'6': {'move': rise(270, 5200, 300)}, '7': {'move': risen(270)}}},
        {'type': 'earth', 'depth': 0.12, 'y': 660, 'state': 'molten', 'at': {'6': {'state': 'raw'}, '7': {'state': 'green'}}},
        {'type': 'light', 'kind': 'flame', 'show': [6, 7], 'depth': 0.13, 'pos': [800, 1000], 'h': 560, 'color': '#ff4a1a', 'glow': 0.4},
        {'type': 'ridge', 'depth': 0.16, 'y': 960, 'amp': 120, 'seed': 5, 'sharp': 0.6, 'color': '#3a3648', 'haze': 0.15,
         'at': {'6': {'move': rise(250, 4800, 900)}, '7': {'move': risen(250), 'color': '#4a5a48'}}},
        {'type': 'water', 'mode': 'sea', 'depth': 0.2, 'level': 930, 'reflect': [['0', '#3d5a78'], ['1', '#0e1a2a']],
         'at': {'6': {'move': rise(200, 4200, 2200)}, '7': {'move': risen(200), 'reflect': [['0', '#d9a070'], ['1', '#2a3a52']]}}},
        {'type': 'clouds', 'show': [7, None], 'depth': 0.07, 'y': 380, 'count': 6, 'color': '#e9e1d0', 'rim': '#d9935e', 'fog': 0.4,
         'reveal': {'dir': 'right', 'dur': 5200, 'delay': 600}},
        dust(box=(-1400, 400, -9000, 3000, 1400, -2000), count=500, size=14, color='#9a8a8a', opacity=0.32, wind=(4, -60, 0), swirl=60, blend='normal', show=[6, 7]),
        {'type': 'ridge', 'depth': 0.42, 'y': 880, 'amp': 30, 'seed': 12, 'sharp': 0.5, 'color': '#1e1a22', 'haze': 0, 'at': {'7': {'color': '#2e3a2a'}}},
        dust(box=(-1400, 150, -9000, 3000, 950, 600), count=400, size=2.6, color='#fff0d8', opacity=0.28, wind=(4, -2, 0), show=[7, None]),
    ]},
]

beats = [
    {'dur': 6000, 'cam': cam([800, 450, 1500], [800, 450, -3000])},
    {'dur': 8000, 'sfx': 'whoosh', 'cam': cam([800, 450, 1250], [800, 450, -3000]),
     'say': 'In the beginning, the heavens and the earth were one, joined together.'},
    {'dur': 8500, 'sfx': [{'name': 'thunder', 'at': 200}], 'cam': cam([800, 450, 1320], [800, 452, -3000]),
     'say': 'Then they were split apart: the sky above, the earth below.', 'verse': V['21:30']},
    {'dur': 8500, 'ambient': ['wind'], 'cam': cam([800, 420, 1220], [800, 385, -3000]), 'verse': V['41:11']},
    {'dur': 9500, 'ambient': ['air'], 'cam': cam([800, 430, 1260], [800, 400, -3000]),
     'verse': {'ref': '67:3', 'ar': [0, 4], 'en': '[And] who created seven heavens in layers…'}},
    {'dur': 8000, 'ambient': ['wind'], 'sfx': 'rumble', 'cam': cam([800, 470, 1180], [800, 900, -3000]),
     'say': 'Below, the young earth cooled and was spread out.'},
    {'dur': 9000, 'ambient': ['wind'], 'sfx': [{'name': 'rumble', 'at': 300}, {'name': 'rumble', 'at': 2600}], 'world': {'shake': 1.2},
     'cam': cam([800, 490, 1150], [800, 540, -3000], dx=6000, **{'from': {'pos': [800, 460, 1300], 'look': [800, 500, -3000]}}),
     'say': 'Mountains rose like pegs driven into the ground, and seas filled the valleys.', 'verse': V['78:7']},
    {'dur': 10000, 'ambient': ['wind', 'water'], 'world': {'shake': 0.3}, 'cam': cam([800, 480, 1250], [800, 520, -3000], dx=6000),
     'verse': {'ref': '78:6', 'ar': [0, 3], 'en': 'Have We not made the earth a resting place?'}},
]

scene = {k: o[k] for k in ['id', 'chapter', 'order', 'node', 'title', 'arabic', 'source', 'ayahs']}
scene.update({
    'art': ["Creation is shown as light, smoke and colour only; nothing in it stands for God.",
            "The six days are compressed into moments, in the order the verses shown describe (21:30, 41:11, 67:3, 78:6–7)."],
    'ambient': ['air'], 'base': '#020206', 'renderer': 'gl', 'dissolve': 2600,
    'world': {'fog': '#06060d', 'fogNear': 8000, 'fogFar': 60000, 'light': 1.0, 'rays': 0, 'bloom': 1.0, 'haze': 0, 'hazeY': 0.6, 'shake': 0.3, 'dof': 0},
    'cam': beats[0]['cam'],
    'imagePrompt': 'Total darkness and a single point of gold light drawing out into a thread; a sphere of churning lapis and bronze light, the heavens and the earth joined as one; its splitting in a ring of gold, smoke rising into a vast sky and a molten earth glowing below; seven translucent shells of light arching one above another, the nearest scattered with kindling stars; then a dark world cooling, mountains rising like pegs, seas filling the valleys, and the first dawn breaking over green land; ink-wash and parchment texture.',
    'layers': layers, 'beats': beats,
})
open(C1 + 's01-heavens.json', 'w').write(dump(scene))
print('s01 ok')
