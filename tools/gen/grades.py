"""Which build grades each scene uses, reading layer options inline (they are not nested under `cfg`)."""
import collections
import glob
import json
import re

files = sorted(glob.glob('src/story/chapters/c*/s*.json'))
rows = []
for f in files:
    d = json.load(open(f, encoding='utf-8'))
    for L in d.get('layers') or []:
        if L.get('type') == 'town':
            rows.append((d['chapter'], d['id'], L.get('grade', 'town'), L.get('wall') is not None, L.get('rows', 1)))

print('town grades by chapter')
per = collections.defaultdict(collections.Counter)
for ch, sid, g, wall, rows in rows:
    per[ch][g] += 1
for ch in sorted(per):
    print(f'  c{ch:<2} {dict(per[ch])}')

print('\nper scene')
for ch, sid, g, wall, rows in sorted(rows):
    print(f'  c{ch:<2} {sid:<16} {g:<8} wall={int(wall)} rows={rows}')
