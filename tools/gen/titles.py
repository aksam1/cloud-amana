import glob, json, re
for f in sorted(glob.glob('src/story/chapters/c*/s*.json')):
    d = json.load(open(f, encoding='utf-8'))
    ch = int(re.search(r'c(\d+)', f).group(1))
    print(f"c{ch:<2} {d['id']:<22} {d.get('title','')}")
