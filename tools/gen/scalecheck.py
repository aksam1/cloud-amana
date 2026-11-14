"""How tall is every building in every scene, in metres?

A card at parallax depth d is scaled by 1/d in world space, and a person of 1.7 m is 255 x d design
units tall at that depth (CLAUDE.md, "Scale"). So a shape h design units tall at depth d is
    metres = 1.7 * h / (255 * d)
tall in the world. This is the test for "does this look like the age it claims?"
"""
import glob
import json
import re

M_PER_UNIT = 1.7 / 255.0  # metres per (design unit / depth)

files = sorted(glob.glob('src/story/chapters/c*/s*.json'))

print(f"{'scene':<26} {'built':<9} {'grade/kind':<9} {'depth':>6} {'m':>7} {'storeys':>8}")
rows = []
for f in files:
    d = json.load(open(f, encoding='utf-8'))
    for L in d.get('layers') or []:
        t = L.get('type')
        depth = L.get('depth', 0.2)
        if t == 'town':
            s = L.get('s', 1)
            g = L.get('grade', 'town')
            # GRADES heights from src/layers/town.jsx
            H = {'hut': (44, 62), 'village': (62, 92), 'town': (84, 150), 'city': (110, 180)}.get(g, (84, 150))
            for label, mul in (('low', 1), ('tall', 1.7)):
                h = H[0] * s * mul
                m = h * M_PER_UNIT / depth
                rows.append((d['chapter'], d['id'], 'town', f'{g}/{label}', depth, m, m / 3.2))
        elif t == 'masonry':
            h = L.get('h', 300)
            m = h * M_PER_UNIT / depth
            rows.append((d['chapter'], d['id'], 'masonry', 'stone', depth, m, m / 3.2))
        elif t == 'facade':
            h = L.get('h', 400)
            m = h * M_PER_UNIT / depth
            rows.append((d['chapter'], d['id'], 'facade', 'wall', depth, m, m / 3.2))
        elif t == 'column':
            h = L.get('h', 400)
            m = h * M_PER_UNIT / depth
            rows.append((d['chapter'], d['id'], 'column', 'column', depth, m, m / 3.2))
        elif t == 'platform':
            m = L.get('w', 400) * M_PER_UNIT / depth
            rows.append((d['chapter'], d['id'], 'platform', 'steps', depth, m, m / 3.2))
        elif t == 'ziggurat':
            m = L.get('h', 400) * M_PER_UNIT / depth
            rows.append((d['chapter'], d['id'], 'ziggurat', 'temple', depth, m, m / 3.2))
        elif t == 'shelter':
            m = L.get('s', 1) * 140 * M_PER_UNIT / depth
            rows.append((d['chapter'], d['id'], 'shelter', 'hut', depth, m, m / 3.2))

rows.sort(key=lambda r: (r[0], r[1]))
for ch, sid, t, kind, depth, m, storeys in rows:
    flag = ' <<<' if m > 16 else ''
    print(f'c{ch:<2} {sid:<22} {t:<9} {kind:<11} {depth:>6.2f} {m:>7.1f} {storeys:>8.1f}{flag}')
