import json, glob, re, collections

by = collections.defaultdict(collections.Counter)
for f in glob.glob('src/story/chapters/c*/s*.json'):
    ch = int(re.search(r'c(\d+)[\\/]', f).group(1))
    d = json.load(open(f, encoding='utf-8'))

    def walk(ls):
        for L in ls or []:
            by[ch][L.get('type')] += 1
            if L.get('type') == 'set':
                walk(L.get('layers'))
    walk(d.get('layers'))

for ch in sorted(by):
    print(ch, dict(by[ch]))
