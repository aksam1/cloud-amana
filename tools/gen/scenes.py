"""List every scene id by chapter, with its title and its built forms."""
import glob
import json
import os
import re

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..')) + '/'


def walk(ls, pre=''):
    for i, L in enumerate(ls or []):
        p = f'{pre}{i}'
        if L.get('type') == 'set':
            yield from walk(L.get('layers'), p + '.')
        else:
            yield p, L


for f in sorted(glob.glob(ROOT + 'src/story/chapters/c*/s*.json')):
    d = json.load(open(f, encoding='utf-8'))
    ch = int(re.search(r'c(\d+)', os.path.basename(os.path.dirname(f))).group(1))
    built = [f"{p}:{L['type']}" for p, L in walk(d.get('layers')) if L.get('type') in ('town', 'facade', 'column', 'colonnade')]
    print(f"{ch:<3}{d['id']:<20}{d.get('title','')[:34]:<36}{' '.join(built)}")
