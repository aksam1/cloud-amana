"""Renumber every scene through the whole story after scenes are inserted.

New scenes are written with a fractional `order` (e.g. 96.5) to slot them in; this assigns sequential
whole numbers by (chapter, order), renames the files to match, rewrites each chapter's part ranges, and
records id → order in order.json (which the generators read, so re-running them keeps the new numbers).
legacy.json freezes the numbers the generators were written with (legacy order → id), once.
Run it again any time: with nothing new it changes nothing.
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..')) + '/'
HERE = os.path.dirname(os.path.abspath(__file__))
CH = ROOT + 'src/story/chapters/'


def chapter_text(ch):
    """chapter.json in its house style: one line per list of names, per part, per bridge line."""
    one = lambda v: json.dumps(v, ensure_ascii=False).replace('{"', '{ "').replace('"}', '" }').replace('}', ' }').replace('  }', ' }').replace('{ ', '{ ')
    lines = ['{']
    keys = list(ch.keys())
    for k, key in enumerate(keys):
        v = ch[key]
        comma = ',' if k + 1 < len(keys) else ''
        if key == 'parts':
            if not v:
                lines.append(f'  "parts": []{comma}')
                continue
            lines.append('  "parts": [')
            lines += [f'    {json.dumps(p, ensure_ascii=False, separators=(", ", ": ")).replace("{", "{ ").replace("}", " }")}' + (',' if i + 1 < len(v) else '') for i, p in enumerate(v)]
            lines.append(f'  ]{comma}')
        elif key == 'bridge':
            lines.append('  "bridge": {')
            bk = list(v.keys())
            for j, b in enumerate(bk):
                c2 = ',' if j + 1 < len(bk) else ''
                if b == 'text':
                    lines.append('    "text": [')
                    lines += [f'      {json.dumps(t, ensure_ascii=False)}' + (',' if i + 1 < len(v[b]) else '') for i, t in enumerate(v[b])]
                    lines.append(f'    ]{c2}')
                else:
                    lines.append(f'    {json.dumps(b)}: {json.dumps(v[b], ensure_ascii=False, separators=(", ", ": "))}{c2}')
            lines.append(f'  }}{comma}')
        else:
            lines.append(f'  {json.dumps(key)}: {json.dumps(v, ensure_ascii=False, separators=(", ", ": "))}{comma}')
    lines.append('}')
    return '\n'.join(lines) + '\n'


def load_all():
    out = []
    for f in glob.glob(CH + 'c*/s*.json'):
        s = json.load(open(f))
        out.append((s['chapter'], float(s['order']), s['id'], f))
    return sorted(out)


def main():
    rows = load_all()
    leg = os.path.join(HERE, 'legacy.json')
    if not os.path.exists(leg):
        json.dump({str(int(o)): i for c, o, i, f in rows if o == int(o)}, open(leg, 'w'), indent=1)
        print('legacy snapshot written')
    if '--snapshot' in sys.argv:
        return
    new = {}
    renames = []
    for n, (c, o, sid, f) in enumerate(rows, start=1):
        new[sid] = n
        text = open(f).read()
        if o != n:
            text = re.sub(r'"order": [0-9.]+', f'"order": {n}', text, count=1)
            open(f, 'w').write(text)
        want = os.path.join(os.path.dirname(f), f's{n:02d}-{sid}.json')
        if os.path.abspath(f) != os.path.abspath(want):
            renames.append((f, want))
    # two passes so a rename never lands on a file still waiting to move
    tmp = []
    for f, want in renames:
        t = f + '.renum'
        os.rename(f, t)
        tmp.append((t, want))
    for t, want in tmp:
        os.rename(t, want)
    # part ranges: keep each part's first scene, run it to the next part's start (or the chapter's end)
    old_at = {(c, o): sid for c, o, sid, f in rows}
    for d in glob.glob(CH + 'c*/chapter.json'):
        ch = json.load(open(d))
        parts = ch.get('parts', [])
        if not parts or 'from' not in parts[0]:
            continue
        num = ch['number']
        ids = [sid for c, o, sid, f in rows if c == num]
        if not ids:
            continue
        starts = []
        for k, p in enumerate(parts):
            sid = old_at.get((num, float(p['from'])))
            starts.append(new[ids[0]] if k == 0 else (new[sid] if sid else p['from']))
        for k, p in enumerate(parts):
            p['from'] = starts[k]
            p['to'] = starts[k + 1] - 1 if k + 1 < len(parts) else new[ids[-1]]
        open(d, 'w').write(chapter_text(ch))
    json.dump(new, open(os.path.join(HERE, 'order.json'), 'w'), indent=1)
    print(f'{len(rows)} scenes, {len(renames)} renamed')


if __name__ == '__main__':
    main()
