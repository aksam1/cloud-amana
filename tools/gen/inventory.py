"""Every built form in every scene, with the layer's index, so the period table can address it.

Walks into nested `set` layers (a set holds its own layers[]). Prints a compact listing:
    c<N> <scene id>  [<i>] type  key options
and writes the same as JSON to tools/gen/inventory.json for the period script to read.
"""
import glob
import json
import os
import re

BUILT = {'town', 'facade', 'column', 'colonnade', 'masonry', 'ziggurat', 'wall', 'pillars'}

rows = []
for f in sorted(glob.glob('src/story/chapters/c*/s*.json')):
    d = json.load(open(f, encoding='utf-8'))
    ch = int(re.search(r'c(\d+)[\\/]', f).group(1))
    sid = d['id']

    def walk(layers, prefix):
        for i, L in enumerate(layers or []):
            t = L.get('type')
            p = f'{prefix}{i}'
            if t == 'set':
                walk(L.get('layers'), p + '.')
                continue
            if t in BUILT:
                keys = {k: v for k, v in L.items()
                        if k not in ('type', 'show', 'at', 'key', 'reveal', 'move', 'fog', 'light',
                                     'sat', 'tint', 'area', 'ppu', 'fade', 'shatter', 'flat', 'dx', 'dz')}
                rows.append({'ch': ch, 'file': f, 'id': sid, 'path': p, 'type': t,
                             'depth': L.get('depth', 0.2), 'opts': keys})

    walk(d.get('layers'), '')

json.dump(rows, open('tools/gen/inventory.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

for r in rows:
    o = r['opts']
    extra = ''
    if r['type'] == 'town':
        extra = f"grade={o.get('grade')} s={o.get('s')}"
    elif r['type'] == 'facade':
        extra = f"h={o.get('h')} w={o.get('w')} style={o.get('style')}"
    elif r['type'] in ('column', 'colonnade'):
        extra = f"h={o.get('h')} style={o.get('style')}"
    elif r['type'] == 'masonry':
        extra = f"h={o.get('h')} w={o.get('w')}"
    else:
        extra = json.dumps(o, ensure_ascii=False)[:90]
    print(f"c{r['ch']:<2} {r['id']:<22} [{r['path']:<5}] {r['type']:<9} d={r['depth']:<5} {extra}")
print(f"\n{len(rows)} built forms")
