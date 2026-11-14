"""Every town's real height in metres, from the app's own scale law.

A person of 1.7 m is 255 x depth design units, so 1 m = 150 x depth. A building drawn at
card height H on a card at depth d therefore stands H / (150 * d) metres.
A town's card height is its grade's h range times the layer's `s`, and `s` is usually P(d,1)/30
(= 5 * depth, the size of a 1 m building at that depth) but sometimes a literal number.
"""
import glob
import json
import re

GRADES = {
    'hut': (44, 62), 'village': (62, 92), 'town': (84, 150), 'city': (110, 180),
    'assyrian': (96, 170), 'israelite': (80, 140), 'galilaean': (60, 100), 'desert': (55, 90),
}


def walk(ls, pre=''):
    for i, L in enumerate(ls or []):
        p = f'{pre}{i}'
        if L.get('type') == 'set':
            yield from walk(L.get('layers'), p + '.')
        else:
            yield p, L


rows = []
for f in sorted(glob.glob('src/story/chapters/c*/s*.json')):
    d = json.load(open(f, encoding='utf-8'))
    ch = int(re.search(r'c(\d+)', f).group(1))
    for p, L in walk(d['layers']):
        if L.get('type') != 'town':
            continue
        dep = L.get('depth', 0.2)
        s = L.get('s')
        std = 5 * dep
        if s is None:
            s = std
            std_flag = 'std'
        else:
            std_flag = 'lit' if abs(s - std) > std * 0.05 else 'std'
        g = L.get('grade', 'town')
        lo, hi = GRADES.get(g, GRADES['town'])
        mlo = lo * s / (150 * dep)
        mhi = hi * s / (150 * dep)
        tall = {'hut': 1, 'village': 1.25, 'town': 1.45, 'city': 1.4, 'assyrian': 1.5,
                'israelite': 1.3, 'galilaean': 1, 'desert': 1.2}[g]
        rows.append((ch, d['id'], p, g, dep, round(s, 3), std_flag, round(mlo, 1), round(mhi, 1),
                     round(mhi * tall, 1)))

print(f"{'ch':<3}{'scene':<14}{'path':<7}{'grade':<11}{'dep':<6}{'s':<7}{'m low':<7}{'m high':<7}{'m tower'}")
for r in rows:
    print(f"{r[0]:<3}{r[1]:<14}{r[2]:<7}{r[3]:<11}{r[4]:<6}{r[5]:<7}{r[7]:<7}{r[8]:<7}{r[9]}")
