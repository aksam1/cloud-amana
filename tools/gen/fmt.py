"""Which lines of a scene file are exactly json.dumps of their own value?

A patcher may only rewrite a line if re-dumping its parsed value reproduces the
line byte for byte. Anything else (hand spacing) must be edited as text.
"""
import glob
import json
import re

bad = []
good = 0
for f in sorted(glob.glob('src/story/chapters/c*/s*.json')):
    text = open(f, encoding='utf-8').read()
    lines = text.split('\n')
    for i, ln in enumerate(lines):
        s = ln.strip()
        if not s.startswith('{'):
            continue
        # only lines that are a whole top-level object (layer lines / set lines)
        try:
            v = json.loads(s)
        except Exception:
            continue
        if not isinstance(v, dict) or 'type' not in v:
            continue
        again = json.dumps(v, ensure_ascii=False)
        if again == s:
            good += 1
        else:
            bad.append((f, i + 1, s[:100], again[:100]))

print('layer-ish lines byte-identical to json.dumps:', good)
print('not identical:', len(bad))
for r in bad[:12]:
    print('  FILE', r[0], 'line', r[1])
    print('    got  ', r[2])
    print('    want ', r[3])

# the art line
print()
for f in sorted(glob.glob('src/story/chapters/c*/s*.json')):
    for ln in open(f, encoding='utf-8'):
        if ln.strip().startswith('"art":'):
            s = ln.strip().rstrip(',')
            v = json.loads(s[len('"art":'):])
            again = 'art:' + json.dumps(v, ensure_ascii=False)
            if again[4:] != s[len('"art":'):]:
                print('ART DIFF', f)
                print('   got ', s[:160])
                print('   want', again[:160])
                break
