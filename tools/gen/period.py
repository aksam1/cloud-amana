"""
The period sweep: patch the scene JSON and the generators so each scene's built world
belongs to its century.

Run from the repo root:   python tools/gen/period.py

It reads one table (tools/generators/period.py) and applies it twice:
  * to the scene JSON under src/story/chapters/, in place, keeping each file's own format
  * to the generator sources under tools/generators/, so a generator run does not undo it

HOW THE SCALE WORKS
-------------------
The app's own law: a person of 1.7 m stands 255 x depth design units tall.
So   metres = h * (1.7 / 255) / depth      and   h for M metres at depth d = M * 150 * d

A `facade` with a `gate` is a city wall and is measured in metres. A `facade` with
`doors` and no gate is a building seen from inside: its height frames the room, so it
only gets a style.

THE TWO ON-DISK FORMATS
-----------------------
Generator-written chapters (1-3, 8-18, 20-21): one layer per line, exactly
`json.dumps(layer, ensure_ascii=False)`, four-space indent.
Hand-written chapters 4-7: the same, but with a leading space after `{`, and some
objects span several lines. A patcher that re-serialised a whole file would churn
every line, so it edits the layer lines in place instead: a changed layer is re-emitted
in its own file's style, and an unchanged one is left byte-for-byte alone.
"""

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '../..')) + '/'
sys.path.insert(0, ROOT + 'tools/generators')

from period import (  # noqa: E402  the table lives with the generators
    COLUMN,
    COLONNADE,
    CUT,
    FACADE,
    NOTE,
    RUIN,
    TAIL,
    TOWN,
    height_for,
    metres,
)

CH = ROOT + 'src/story/chapters/'
GEN = ROOT + 'tools/generators/'


# ── The scene patch ─────────────────────────────────────────────────────────

def cut_wall(layer, want_m):
    """Cut a city wall to `want_m` metres, keeping its gate in proportion."""
    d = layer.get('depth', 0.2)
    old_h = layer.get('h')
    if old_h == height_for(want_m, d):
        return None
    g = layer.get('gate')
    if g and old_h:
        g['h'] = height_for(want_m * (g['h'] / old_h), d)
    layer['h'] = height_for(want_m, d)
    return f"wall {old_h}->{layer['h']} ({metres(old_h, d):.1f}m->{want_m}m)"


def patch_layers(sid, layers, changes):
    """Patch a list of layers in place. Returns True if anything changed."""
    before = json.dumps(layers, ensure_ascii=False)

    for l in layers:
        t = l.get('type')
        if t == 'town':
            want = TOWN.get(sid)
            if want and l.get('grade') != want:
                changes.append(f"town {l.get('grade')}->{want}")
                l['grade'] = want
            if sid in RUIN and l.get('ruin') != RUIN[sid]:
                l['ruin'] = RUIN[sid]
                changes.append('ruin')
        elif t == 'facade':
            want = FACADE.get(sid)
            if want and l.get('style') != want:
                changes.append(f'facade style->{want}')
                l['style'] = want
            if sid in CUT and l.get('gate'):
                what = cut_wall(l, CUT[sid][1])
                if what:
                    changes.append(what)
        elif t == 'column':
            want = COLUMN.get(sid)
            if want and l.get('style') != want:
                changes.append(f'column style->{want}')
                l['style'] = want

    return json.dumps(layers, ensure_ascii=False) != before


def merge_columns(sid, layers, changes):
    """A pair of `column` layers becomes one `colonnade`. Works on the array, because
    the two columns are two separate lines in the file."""
    if sid not in COLONNADE:
        return False
    style, xs, colors = COLONNADE[sid]
    cols = [i for i, l in enumerate(layers) if l.get('type') == 'column']
    if len(cols) < 2:
        return False
    first = layers[cols[0]]
    layers[cols[0]] = {
        'type': 'colonnade',
        'depth': first.get('depth', 0.3),
        'xs': xs,
        'y': first.get('y', 790),
        'h': first.get('h', 315),
        'w': first.get('w', 32),
        'style': style,
        'colors': colors,
    }
    for i in reversed(cols[1:]):
        layers.pop(i)
    changes.append(f'column->colonnade({style})')
    return True


def notes_for(sid):
    """The art lines this scene's new look needs.

    Each note is (text, tail, extends): `text` is a whole line that can stand alone,
    `tail` is the phrase that can be added to a sentence that already says the look of
    the town is imagined, and `extends` says whether that sentence is the right home for it.
    """
    out = []
    if sid in TOWN:
        # the town's own sentence: it extends the sentence that already names the look
        out.append((NOTE[TOWN[sid]], TAIL[TOWN[sid]], True))
    style = FACADE.get(sid)
    if style:
        out.append(
            (
                {
                    'ashlar': "The dressed stone is imagined; its long blocks and chevron course are of the kind cut in the Levant and in Egypt's quarries.",
                    'pylon': "The pylon gate is imagined; its battered sides and ochre limestone are of the kind built at the gates of Egypt's temples.",
                    'brick': "The wall of baked brick is imagined; its fine courses are of the kind built in Mesopotamia and in Assyria.",
                    'mudbrick': "The wall of sun-dried brick is imagined; its courses and stepped merlons are of the kind built in this people's time.",
                }[style],
                {
                    'ashlar': 'wall of dressed stone, its long blocks and chevron course of the kind cut in the Levant and in Egypt',
                    'pylon': 'pylon gate, its battered sides of the ochre limestone built at the gates of Egypt',
                    'brick': 'wall of baked brick, its fine courses of the kind built in Mesopotamia and in Assyria',
                    'mudbrick': "wall of sun-dried brick, its courses and stepped merlons of the kind built in this people's time",
                }[style],
                False,
            )
        )
    if sid in COLUMN:
        out.append(
            (
                {
                    'protoaic': "The columns are imagined; a plain slender shaft on a stepped base under a carved block capital, of the kind built in Jerusalem's temple.",
                    'pillared': "The piers are imagined; plain square brick piers of the kind built in the Levant and in Mesopotamia.",
                    'classical': "The columns are imagined; a fluted shaft and a cushion capital, of the kind built in the classical world.",
                }[COLUMN[sid]],
                {
                    'protoaic': 'columns of a plain slender shaft on a stepped base under a carved block capital, of the kind built in Jerusalem',
                    'pillared': 'piers of plain square brick, of the kind built in the Levant and in Mesopotamia',
                    'classical': 'columns of a fluted shaft and a cushion capital, of the kind built in the classical world',
                }[COLUMN[sid]],
                False,
            )
        )
    if sid in COLONNADE:
        style = COLONNADE[sid][0]
        out.append(
            (
                {
                    'protoaic': "The columns are imagined; a plain slender shaft on a stepped base under a carved block capital, of the kind built in Jerusalem's temple.",
                    'papyrus': "The columns are imagined; bundled papyrus shafts with open capitals, of the kind built in Egypt.",
                }[style],
                {
                    'protoaic': 'columns of a plain slender shaft on a stepped base under a carved block capital, of the kind built in Jerusalem',
                    'papyrus': 'columns of bundled papyrus shafts with open capitals, of the kind built in Egypt',
                }[style],
                False,
            )
        )
    return out


# ── Text surgery ───────────────────────────────────────────────────────────

def count_braces(s):
    """Braces in a JSON line, ignoring those inside quotes."""
    n = 0
    inq = False
    esc = False
    for ch in s:
        if esc:
            esc = False
            continue
        if ch == '\\':
            esc = True
            continue
        if ch == '"':
            inq = not inq
            continue
        if inq:
            continue
        if ch == '{':
            n += 1
        elif ch == '}':
            n -= 1
    return n


def find_array_region(text, key='"layers":'):
    """(start, end) of the array that follows `key`, in `text`. Returns None if not found."""
    i = text.find(key)
    if i < 0:
        return None
    j = text.index('[', i + len(key))
    depth = 0
    inq = False
    esc = False
    for k in range(j, len(text)):
        ch = text[k]
        if esc:
            esc = False
            continue
        if ch == '\\':
            esc = True
            continue
        if ch == '"':
            inq = not inq
            continue
        if inq:
            continue
        if ch == '[':
            depth += 1
        elif ch == ']':
            depth -= 1
            if depth == 0:
                return j + 1, k
    return None


def split_items(region):
    """Split an array's contents into its items.

    Each item is (start line, end line, raw text). The blank lines and the indentation
    around the items are left alone: only the items themselves are rewritten.
    """
    lines = region.split('\n')
    items = []
    i = 0
    while i < len(lines):
        ln = lines[i]
        if not ln.strip():
            i += 1
            continue
        chunk = [ln]
        depth = count_braces(ln)
        j = i
        while depth > 0 and j + 1 < len(lines):
            j += 1
            chunk.append(lines[j])
            depth += count_braces(lines[j])
        items.append((i, j, '\n'.join(chunk)))
        i = j + 1
    return lines, items


def emit_one(obj, raw):
    """One layer as one line, in the style of the line it replaces."""
    lead = ' ' if raw.lstrip().startswith('{ ') else ''
    indent = len(raw) - len(raw.lstrip())
    comma = ',' if raw.rstrip().endswith(',') else ''
    return ' ' * indent + lead + json.dumps(obj, ensure_ascii=False) + comma


def emit_multi(obj, raw):
    """A layer that spans several lines, re-emitted in the hand-written style:
    a leading space after `{`, and its keys one per line."""
    indent = len(raw) - len(raw.lstrip())
    lead = ' ' if raw.lstrip().startswith('{ ') else ''
    comma = ',' if raw.rstrip().endswith(',') else ''
    out = [' ' * indent + lead + '{']
    for k, v in obj.items():
        out.append(' ' * (indent + 2) + f'"{k}": {json.dumps(v, ensure_ascii=False)},')
    out[-1] = out[-1][:-1]
    out.append(' ' * indent + '}' + comma)
    return '\n'.join(out)


def patch_region(region, sid, changes):
    """Patch an array's contents. `region` is the text between the array's brackets."""
    lines, items = split_items(region)

    # a pair of `column` layers becomes one `colonnade`: the two columns are two lines,
    # so the merge has to happen on the array, not on one layer
    objs = []
    for a, b, raw in items:
        try:
            objs.append(json.loads(raw.rstrip().rstrip(',')))
        except Exception:
            objs.append(None)
    col_at = [k for k, o in enumerate(objs) if o and o.get('type') == 'column']
    if sid in COLONNADE and len(col_at) >= 2:
        style, xs, colors = COLONNADE[sid]
        new_lines = []
        first = col_at[0]
        for k, (a, b, raw) in enumerate(items):
            o = objs[k]
            if o is None:
                new_lines.extend(raw.split('\n'))
                continue
            if k in col_at:
                if k == first:
                    merged = {
                        'type': 'colonnade',
                        'depth': o.get('depth', 0.3),
                        'xs': xs,
                        'y': o.get('y', 790),
                        'h': o.get('h', 315),
                        'w': o.get('w', 32),
                        'style': style,
                        'colors': colors,
                    }
                    new_lines.extend(emit_one(merged, raw).split('\n'))
                continue  # the other column goes away
            if o.get('type') == 'set' and 'layers' in o:
                span = find_array_region(raw, '"layers":')
                if span:
                    inner = raw[span[0]:span[1]]
                    patched = patch_region(inner, sid, changes)
                    if patched != inner:
                        raw = raw[:span[0]] + patched + raw[span[1]:]
                new_lines.extend(raw.split('\n'))
                continue
            before = json.dumps(o, ensure_ascii=False)
            patch_layers(sid, [o], changes)
            if json.dumps(o, ensure_ascii=False) == before:
                new_lines.extend(raw.split('\n'))
            elif '\n' in raw:
                new_lines.extend(emit_multi(o, raw).split('\n'))
            else:
                new_lines.extend(emit_one(o, raw).split('\n'))
        changes.append(f'column->colonnade({style})')
        return '\n'.join(new_lines)

    for a, b, raw in items:
        try:
            obj = json.loads(raw.rstrip().rstrip(','))
        except Exception:
            continue
        # a `set` holds its inner layers inline or across lines: patch them where they are
        if obj.get('type') == 'set' and 'layers' in obj:
            span = find_array_region(raw, '"layers":')
            if span:
                inner = raw[span[0]:span[1]]
                patched = patch_region(inner, sid, changes)
                if patched != inner:
                    raw = raw[:span[0]] + patched + raw[span[1]:]
                    lines[a:b + 1] = raw.split('\n')
            continue
        before = json.dumps(obj, ensure_ascii=False)
        patch_layers(sid, [obj], changes)
        if json.dumps(obj, ensure_ascii=False) == before:
            continue
        if '\n' in raw:
            lines[a:b + 1] = emit_multi(obj, raw).split('\n')
        else:
            lines[a:b + 1] = emit_one(obj, raw).split('\n')
    return '\n'.join(lines)


def patch_text(text, sid):
    """Patch the layer lines of a scene file's text. Returns (text, changes)."""
    span = find_array_region(text, '"layers":')
    if not span:
        return text, []
    changes = []
    region = text[span[0]:span[1]]
    patched = patch_region(region, sid, changes)
    if patched == region:
        return text, changes
    return text[:span[0]] + patched + text[span[1]:], changes


def patch_art_text(text, sid):
    """Bring the scene's `art` list in line with its new look.

    A note that can extend an existing sentence ("the look of the town is imagined")
    is folded into it; anything else stands as its own line. A note that is already
    present, in any form, is left alone.
    """
    notes = notes_for(sid)
    if not notes:
        return text, False
    m = re.search(r'^(  "art": )(\[.*?\])(,?)$', text, re.M | re.S)
    if not m:
        return text, False
    arr = json.loads(m.group(2))
    before = list(arr)

    def have(s):
        return any(s.lower() in a.lower() for a in arr)

    # the sentence that already names the town's look, if there is one
    target = next((i for i, item in enumerate(arr) if 'look of the town' in item and 'imagined' in item), None)
    for text_, tail, extends in notes:
        if have(text_) or have(tail):
            continue
        if extends and target is not None:
            phrase = tail[0].lower() + tail[1:]
            arr[target] = arr[target].rstrip() + ' Its ' + phrase + '.'
        else:
            arr.append(text_)
    # a note may have joined the sentence; the target index may have moved
    target = next((i for i, item in enumerate(arr) if 'look of the town' in item and 'imagined' in item), None)

    if arr == before:
        return text, False
    if '\n' in m.group(2):
        # the hand-written files keep the list across lines
        lines = ['  "art": [']
        for a in arr:
            lines.append('    ' + json.dumps(a, ensure_ascii=False) + ',')
        lines[-1] = lines[-1][:-1]
        lines.append('  ]' + (m.group(3) or ''))
        new = '\n'.join(lines)
    else:
        new = '  "art": ' + json.dumps(arr, ensure_ascii=False) + (m.group(3) or '')
    return text[:m.start()] + new + text[m.end():], True


# ── The generators ─────────────────────────────────────────────────────────
#
# HANDOFF.md §5.1: a hand-edited scene JSON is overwritten by the next generator run,
# so the same change is made in the generator too. Each entry is (file, old, new):
# the old text must appear exactly once (or `want` times).

EDITS = [
    # c1 · the jinn's dwellings
    ('s01_06.py', "'s': 0.6, 'grade': 'town',", "'s': 0.6, 'grade': 'hut',"),
    ('s01_06.py', "'s': 0.55, 'grade': 'town',", "'s': 0.55, 'grade': 'hut',"),
    # c2 · the market of Idris's town is a village of low mud-brick houses
    ('c2_3.py', "'depth': 0.11, 'grade': 'town', 'y': mk_y(0.11)", "'depth': 0.11, 'grade': 'village', 'y': mk_y(0.11)"),
    # c2-c3 · Nuh's people, and the towns of the square and the hill: mud-brick, not classical
    ('c2_3.py', "'depth': 0.11, 'grade': 'city', 'y': sq_y(0.11)", "'depth': 0.11, 'grade': 'town', 'y': sq_y(0.11)"),
    ('c2_3.py', "'depth': 0.07, 'grade': 'city', 'y': 604", "'depth': 0.07, 'grade': 'town', 'y': 604"),
    ('c2_3.py', "'depth': 0.161, 'grade': 'city', 'y': 176", "'depth': 0.161, 'grade': 'town', 'y': 176"),
    ('c2_3.py', "'depth': 0.075, 'grade': 'city', 'y': 640", "'depth': 0.075, 'grade': 'town', 'y': 640"),
    ('c2_3.py', "'depth': 0.1, 'grade': 'city', 'y': 652", "'depth': 0.1, 'grade': 'town', 'y': 652"),
    # c9 · Egypt: the town of al-Aziz
    ('c9.py', "'s': 0.75, 'grade': 'town', 'lit': 0.2, 'haze': '#d8c0a0'", "'s': 0.75, 'grade': 'city', 'lit': 0.2, 'haze': '#d8c0a0'"),
    ('c9.py', "'stone': '#c8a074', 'ppu': 0.8}", "'stone': '#c8a074', 'style': 'ashlar', 'ppu': 0.8}"),
    # c10 · Madyan: a low town of sun-dried brick, and a house of dressed stone
    ('c10.py', "'grade': 'town', 'lit': lit, 'haze': '#c8a888'", "'grade': 'desert', 'lit': lit, 'haze': '#c8a888'"),
    ('c10.py', "'stone': '#4a4a54', 'light': 0.8, 'doors': door(lit), 'ppu': 0.9, **kw}", "'stone': '#4a4a54', 'light': 0.8, 'doors': door(lit), 'style': 'ashlar', 'ppu': 0.9, **kw}"),
    # c11 · Egypt
    ('c11.py', "'grade': 'town', 'night': True, 'lit': 0.15, 'haze': '#24202e', 'seed': 850}", "'grade': 'city', 'night': True, 'lit': 0.15, 'haze': '#24202e', 'seed': 850}", 2),
    ('c11.py', "'stone': stone, 'light': 0.85, 'doors': [{'x': 1070, 'w': 60, 'h': 110, 'lit': True}]}", "'stone': stone, 'light': 0.85, 'style': 'ashlar', 'doors': [{'x': 1070, 'w': 60, 'h': 110, 'lit': True}]}"),
    ('c11.py', "'gate': {'w': P(0.16, 4), 'h': P(0.16, 7)}, 'towers': True, 'stone': '#e0d0b0', 'ppu': 0.8}", "'gate': {'w': P(0.16, 4), 'h': P(0.16, 7)}, 'towers': True, 'stone': '#e0d0b0', 'style': 'pylon', 'ppu': 0.8}"),
    ('c11.py', "'x': 1000, 'y': 752, 'w': P(0.24, 20), 'h': P(0.24, 8), 'gate': {'w': P(0.24, 3), 'h': P(0.24, 4.6)}, 'towers': True, 'stone': '#e8dcc0', 'light': 1, 'ppu': 0.8}",
     "'x': 1000, 'y': 752, 'w': P(0.24, 20), 'h': P(0.24, 8), 'gate': {'w': P(0.24, 3), 'h': P(0.24, 4.6)}, 'towers': True, 'stone': '#e8dcc0', 'light': 1, 'style': 'pylon', 'ppu': 0.8}"),
    ('c11.py', "'x': 1060, 'y': 752, 'w': P(0.24, 20), 'h': P(0.24, 8), 'gate': {'w': P(0.24, 3), 'h': P(0.24, 4.6)}, 'towers': True, 'stone': '#e8dcc0', 'light': 1, 'ppu': 0.8}",
     "'x': 1060, 'y': 752, 'w': P(0.24, 20), 'h': P(0.24, 8), 'gate': {'w': P(0.24, 3), 'h': P(0.24, 4.6)}, 'towers': True, 'stone': '#e8dcc0', 'light': 1, 'style': 'pylon', 'ppu': 0.8}"),
    ('c11.py', "'x': 1400, 'y': 750, 'w': P(0.22, 18), 'h': P(0.22, 10), 'stone': '#e8dcc0', 'light': 1, 'ppu': 0.8}", "'x': 1400, 'y': 750, 'w': P(0.22, 18), 'h': P(0.22, 10), 'stone': '#e8dcc0', 'light': 1, 'style': 'ashlar', 'ppu': 0.8}"),
    ('c11.py', "'type': 'column', 'depth': 0.25, 'x': 760, 'y': 756, 'h': P(0.25, 8), 'w': P(0.25, 1), 'stone': '#e0c8a0', 'lit': '#f8e8c8', 'dark': '#8a6a48'},\n    {'type': 'column', 'depth': 0.25, 'x': 1300, 'y': 756, 'h': P(0.25, 8), 'w': P(0.25, 1), 'stone': '#e0c8a0', 'lit': '#f8e8c8', 'dark': '#8a6a48'},",
     "'type': 'colonnade', 'depth': 0.25, 'xs': [760, 1300], 'y': 756, 'h': P(0.25, 8), 'w': P(0.25, 1), 'style': 'papyrus', 'colors': ['#e0c8a0', '#a87048', '#8a6a48']},"),
    # c12 · by night, out of Egypt
    ('c12.py', "'gate': {'w': P(0.16, 5), 'h': P(0.16, 7)}, 'towers': True, 'stone': '#8a8070', 'ppu': 0.8}", "'gate': {'w': P(0.16, 5), 'h': P(0.16, 7)}, 'towers': True, 'stone': '#8a8070', 'style': 'pylon', 'ppu': 0.8}"),
    # c14 · the Israelite town
    ('c14.py', "'grade': 'town', 'lit': 0.3, 'haze': '#b8a898', 'seed': 1103}", "'grade': 'israelite', 'lit': 0.3, 'haze': '#b8a898', 'seed': 1103}"),
    ('c14.py', "'gate': {'w': P(0.34, 3.6), 'h': P(0.34, 4.4)}, 'stone': '#b4aa98', 'ppu': 0.8}", "'gate': {'w': P(0.34, 3.6), 'h': P(0.34, 4.4)}, 'stone': '#b4aa98', 'style': 'ashlar', 'ppu': 0.8}"),
    ('c14.py', "'stone': stone, 'light': 0.85, 'doors': [{'x': 800, 'w': 70, 'h': 120, 'lit': True}]}", "'stone': stone, 'light': 0.85, 'style': 'ashlar', 'doors': [{'x': 800, 'w': 70, 'h': 120, 'lit': True}]}"),
    # c15 · Ba'l is an Israelite hill town; Nineveh is Assyrian, and its wall comes down to 7 m
    ('c15.py', "'grade': 'town', 'lit': 0.35, 'haze': '#a89888', 'seed': 1201}", "'grade': 'israelite', 'lit': 0.35, 'haze': '#a89888', 'seed': 1201}"),
    ('c15.py', "'grade': 'city', 'lit': 0.3, 'haze': '#b8a898', 'seed': 1221}", "'grade': 'assyrian', 'lit': 0.3, 'haze': '#b8a898', 'seed': 1221}"),
    ('c15.py', "'grade': 'city', 'lit': 0.4, 'haze': '#b8a898', 'seed': 1221}", "'grade': 'assyrian', 'lit': 0.4, 'haze': '#b8a898', 'seed': 1221}"),
    ('c15.py', "'w': P(0.18, 60), 'h': P(0.18, 10), 'gate': {'w': P(0.18, 4), 'h': P(0.18, 6)}, 'towers': True, 'stone': '#a87c5c', 'ppu': 0.8}",
     "'w': P(0.18, 60), 'h': P(0.18, 7), 'gate': {'w': P(0.18, 4), 'h': P(0.18, 4.2)}, 'towers': True, 'stone': '#a87c5c', 'style': 'brick', 'ppu': 0.8}", 2),
    # c16 · Jerusalem: dressed stone, and the temple's proto-Aeolic columns
    ('c16.py', "'grade': 'town', 'night': True, 'lit': 0.25, 'haze': '#24202e', 'seed': 1301}", "'grade': 'galilaean', 'night': True, 'lit': 0.25, 'haze': '#24202e', 'seed': 1301}"),
    ('c16.py', "'stone': '#a89478', 'light': 0.7, 'doors': [{'x': 860, 'w': P(0.32, 1), 'h': P(0.32, 1.3), 'lit': True}], 'ppu': 0.9}",
     "'stone': '#a89478', 'light': 0.7, 'style': 'ashlar', 'doors': [{'x': 860, 'w': P(0.32, 1), 'h': P(0.32, 1.3), 'lit': True}], 'ppu': 0.9}"),
    ('c16.py', "'grade': 'town', 'lit': 0.2, 'haze': '#b8a898', 'seed': 1361}", "'grade': 'galilaean', 'lit': 0.2, 'haze': '#b8a898', 'seed': 1361}"),
    ('c16.py', "'gate': {'w': P(0.2, 4), 'h': P(0.2, 5.5)}, 'stone': '#dcc48c', 'ppu': 0.8}",
     "'gate': {'w': P(0.2, 4), 'h': P(0.2, 5.5)}, 'stone': '#dcc48c', 'style': 'ashlar', 'ppu': 0.8}"),
    ('c16.py', "'stone': stone, 'light': 0.7,\n         'doors': [{'x': 800, 'w': P(0.2, 2.6), 'h': P(0.2, 4.2), 'lit': True}, {'x': 1260, 'w': P(0.2, 1.4), 'h': P(0.2, 2.6)}]},",
     "'stone': stone, 'light': 0.7, 'style': 'ashlar',\n         'doors': [{'x': 800, 'w': P(0.2, 2.6), 'h': P(0.2, 4.2), 'lit': True}, {'x': 1260, 'w': P(0.2, 1.4), 'h': P(0.2, 2.6)}]},"),
    ('c16.py', "'type': 'column', 'depth': 0.3, 'x': 520, 'y': 790, 'h': P(0.3, 7), 'w': P(0.3, 0.7), 'stone': '#c8a880', 'lit': '#f0dcb8', 'dark': '#5a4430'},\n        {'type': 'column', 'depth': 0.3, 'x': 1080, 'y': 790, 'h': P(0.3, 7), 'w': P(0.3, 0.7), 'stone': '#c8a880', 'lit': '#f0dcb8', 'dark': '#5a4430'},",
     "'type': 'colonnade', 'depth': 0.3, 'xs': [520, 1080], 'y': 790, 'h': P(0.3, 7), 'w': P(0.3, 0.7), 'style': 'protoaic', 'colors': ['#c8a880', '#e0c8a0', '#5a4430']},"),
    # c17 · Galilee
    ('c17.py', "'grade': 'town', 'lit': 0.1, 'haze': '#b8a898', 'seed': 1402}", "'grade': 'galilaean', 'lit': 0.1, 'haze': '#b8a898', 'seed': 1402}"),
    ('c17.py', "'grade': 'city', 'night': True, 'lit': 0.3, 'haze': '#24202e', 'seed': 1441}", "'grade': 'galilaean', 'night': True, 'lit': 0.3, 'haze': '#24202e', 'seed': 1441}"),
    # c18 · the town of the messengers: a town, and a ruin
    ('wisdom.py', "'grade': 'city', 'lit': 0.2, 'haze': '#b8a898', 'seed': 1611}", "'grade': 'town', 'lit': 0.2, 'haze': '#b8a898', 'seed': 1611, 'ruin': 1}"),
    # c20 · the signs of the Hour: the town is low; the towers are the sign
    ('c20_21.py', "'grade': 'city', 'lit': 0.5, 'haze': '#4a4258', 'seed': 1701", "'grade': 'town', 'lit': 0.5, 'haze': '#4a4258', 'seed': 1701"),
    ('c20_21.py', "'grade': 'city', 'lit': 0.3, 'haze': '#585066', 'seed': 1711, 'rows': 2}", "'grade': 'town', 'lit': 0.3, 'haze': '#585066', 'seed': 1711, 'rows': 2}"),
]


def patch_generators():
    """Apply the EDITS to the generator sources. Returns a list of misses."""
    misses = []
    by_file = {}
    for e in EDITS:
        want = e[3] if len(e) > 3 else 1
        by_file.setdefault(e[0], []).append((e[1], e[2], want))
    for f, pairs in by_file.items():
        path = GEN + f
        if not os.path.exists(path):
            misses.append(f'{f}: missing')
            continue
        text = open(path, encoding='utf-8').read()
        for old, new, want in pairs:
            n = text.count(old)
            if n == 0 and text.count(new) >= want:
                continue  # already applied by an earlier run
            if n != want:
                misses.append(f'{f}: {n} matches (wanted {want}) for {old[:70]!r}')
                continue
            text = text.replace(old, new)
        open(path, 'w', encoding='utf-8').write(text)
    return misses


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    changed = 0
    for d in sorted(os.listdir(CH)):
        if not d.startswith('c') or not os.path.isdir(os.path.join(CH, d)):
            continue
        for fn in sorted(os.listdir(os.path.join(CH, d))):
            if not (fn.startswith('s') and fn.endswith('.json')):
                continue
            path = os.path.join(CH, d, fn)
            text = open(path, encoding='utf-8').read()
            try:
                sid = json.loads(text).get('id')
            except Exception:
                continue
            newtext, changes = patch_text(text, sid)
            newtext, art = patch_art_text(newtext, sid)
            if newtext != text:
                try:
                    json.loads(newtext)  # it must still be valid JSON
                except Exception as e:
                    print(f'INVALID {sid}: {e}')
                    continue
                open(path, 'w', encoding='utf-8').write(newtext)
                changed += 1
                what = ', '.join(changes) if changes else 'art only'
                print(f'{sid:16} {what}')
    print(f'-- {changed} scene files changed')
    misses = patch_generators()
    if misses:
        print('-- generator misses:')
        for m in misses:
            print('   ', m)
    else:
        print('-- all generator edits applied')


if __name__ == '__main__':
    main()
