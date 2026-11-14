"""Every built form in every scene: which layer types stand in for architecture, where, and with what
options. This is the map of what has to change so that each scene's buildings match its century."""
import collections
import glob
import json
import os
import re

files = sorted(glob.glob('src/story/chapters/c*/s*.json'))

BUILT = {
    'town', 'lane', 'stalls', 'statues', 'terrace', 'doorway', 'pillars', 'masonry',
    'facade', 'column', 'monument', 'platform', 'ziggurat', 'idol', 'colonnade',
    'shelter', 'dwelling', 'room', 'wall', 'mound', 'altar', 'plaza', 'gate',
}

opts = collections.defaultdict(collections.Counter)
where = collections.defaultdict(list)
per_scene = {}

for f in files:
    d = json.load(open(f, encoding='utf-8'))
    ch = int(re.search(r'c(\d+)[\\/]', f).group(1))
    hits = []
    for L in d.get('layers') or []:
        t = L.get('type')
        if t in BUILT:
            keys = {k: v for k, v in L.items()
                    if k not in ('type', 'show', 'at', 'depth', 'key', 'reveal', 'move', 'fog', 'light',
                                 'sat', 'tint', 'area', 'ppu', 'fade', 'shatter', 'flat', 'dx', 'dz')}
            hits.append((t, json.dumps(keys, sort_keys=True)))
            opts[t][json.dumps(keys, sort_keys=True)] += 1
            where[t].append(f'c{ch} {os.path.basename(f)}')
    if hits:
        per_scene[(ch, os.path.basename(f))] = hits

print('=== built-form types by chapter ===')
by_ch = collections.defaultdict(collections.Counter)
for (ch, name), hits in per_scene.items():
    for t, o in hits:
        by_ch[ch][t] += 1
for ch in sorted(by_ch):
    print(f'  c{ch:<2} ' + ', '.join(f'{t}x{n}' for t, n in sorted(by_ch[ch].items())))

print('\n=== option shapes ===')
for t in sorted(opts):
    print(f'\n--- {t} ({sum(opts[t].values())} uses) ---')
    for o, n in opts[t].most_common(12):
        print(f'   x{n}  {o[:160]}')
