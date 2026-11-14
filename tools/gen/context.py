"""Each facade / column / masonry with the context that decides what it is:
inside a `set` (a shot of its own) or shared backdrop, and whether the scene has a floor.
"""
import glob
import json
import re

for f in sorted(glob.glob('src/story/chapters/c*/s*.json')):
    d = json.load(open(f, encoding='utf-8'))
    ch = int(re.search(r'c(\d+)[\\/]', f).group(1))
    sid = d['id']
    title = d.get('title', '')
    types = set()

    def walk(ls, inside_set):
        for i, L in enumerate(ls or []):
            t = L.get('type')
            types.add(t)
            if t == 'set':
                walk(L.get('layers'), True)
                continue
            if t in ('facade', 'column', 'masonry', 'wall', 'ziggurat'):
                o = {k: v for k, v in L.items() if k not in ('type', 'show', 'at')}
                print(f"c{ch:<2} {sid:<20} {title[:26]:<26} set={int(inside_set)} {t:<8} {json.dumps(o, ensure_ascii=False)[:170]}")
    walk(d.get('layers'), False)
