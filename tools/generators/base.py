# Rebuilds a Chapter 1 scene for the WebGL stage: keeps its words (say, verses, timing, sound) and swaps in
# new layers, cameras and world. Run from the repo root.
import json, re, os

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..')) + '/'
C1 = ROOT + 'src/story/chapters/c1/'
ORIG = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'c1orig') + '/'  # Chapter 1's 2D originals


HERE = os.path.dirname(os.path.abspath(__file__))
ORDER = json.load(open(os.path.join(HERE, 'order.json'))) if os.path.exists(os.path.join(HERE, 'order.json')) else {}
LEGACY = json.load(open(os.path.join(HERE, 'legacy.json'))) if os.path.exists(os.path.join(HERE, 'legacy.json')) else {}


def O(n):
    """A scene number as the generators were written, mapped to its number now (scenes have been inserted since)."""
    return ORDER.get(LEGACY.get(str(n)), n)


def write_json(path, text):
    """Write UTF-8. Windows' default encoding is cp1252, which cannot hold the Arabic titles."""
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)


def write_chapter(path, data):
    """Write chapter.json, keeping the bridge text already there (written by hand, not by the generators)."""
    from renum import chapter_text
    if os.path.exists(path):
        old = json.load(open(path, encoding='utf-8'))
        if 'bridge' in old and 'bridge' not in data:
            data['bridge'] = old['bridge']
    write_json(path, chapter_text(data))


def load(name):
    # always start from the original 2D scene, so the generator can be run again
    src = ORIG + name if os.path.exists(ORIG + name) else C1 + name
    return json.load(open(src))


def god(text):
    return re.sub(r'\bAllah\b', 'God', text) if text else text


def dump(scene):
    if scene.get('id') in ORDER:
        scene['order'] = ORDER[scene['id']]
    head = ['id', 'chapter', 'order', 'node', 'title', 'arabic', 'source', 'ayahs', 'art', 'ambient', 'base', 'captions',
            'renderer', 'pen', 'dissolve', 'world', 'cam', 'imagePrompt']
    out = ['{']
    for k in head:
        if k in scene:
            out.append(f'  "{k}": {json.dumps(scene[k], ensure_ascii=False)},')
    out.append('  "layers": [')
    out.append(',\n'.join('    ' + json.dumps(l, ensure_ascii=False) for l in scene['layers']))
    out.append('  ],')
    out.append('  "beats": [')
    out.append(',\n'.join('    ' + json.dumps(b, ensure_ascii=False) for b in scene['beats']))
    out.append('  ]')
    out.append('}')
    text = '\n'.join(out) + '\n'
    json.loads(text)
    return text


def build(name, *, layers, cams, world, art=None, dissolve=2400, scene_cam=None, beat_world=None, extra=None, prompt=None, say=None):
    s = load(name)
    s['renderer'] = 'gl'
    s['dissolve'] = dissolve
    s['world'] = world
    s['cam'] = scene_cam or cams[0]
    if art is not None:
        s['art'] = art
    if prompt:
        s['imagePrompt'] = prompt
    if extra:
        s.update(extra)
    s['layers'] = layers
    beats = []
    for i, b in enumerate(s['beats']):
        b = dict(b)
        b.pop('cam', None)
        if 'say' in b:
            b['say'] = god(b['say'])
        if say and i in say:
            b['say'] = say[i]
        if i < len(cams) and cams[i]:
            b['cam'] = cams[i]
        if beat_world and i in beat_world:
            b['world'] = beat_world[i]
        # keys in a steady order: dur first, words last
        order = ['dur', 'ambient', 'sfx', 'world', 'cam', 'say', 'verse', 'pendingVerse']
        beats.append({k: b[k] for k in order if k in b} | {k: v for k, v in b.items() if k not in order})
    s['beats'] = beats
    text = dump(s)
    want = f"s{s['order']:02d}-{s['id']}.json"
    if want != name and os.path.exists(C1 + name):
        os.remove(C1 + name)
    open(C1 + want, 'w', encoding='utf-8').write(text)
    return s


def dust(box=(-1400, 150, -9000, 3000, 950, 600), count=500, size=2.6, color='#fff0d8', opacity=0.3, wind=(4, -2, 0), swirl=40, **kw):
    return {'type': 'dust', 'box': list(box), 'count': count, 'size': size, 'color': color, 'opacity': opacity, 'wind': list(wind), 'swirl': swirl, **kw}


def light(pos, h, depth=0.3, color='#fffaf0', glow=0.7, bright=1.4, **kw):
    return {'type': 'light', 'depth': depth, 'pos': pos, 'h': h, 'color': color, 'glow': glow, 'bright': bright, **kw}


def cam(pos, look, **kw):
    return {'pos': pos, 'look': look, **kw}


# the court of heaven: golden mist that swirls slowly far behind (no light stands for God)
def court(**kw):
    return {'type': 'cosmos', 'smoke': 0.55, 'colors': ['#a8803e', '#fff0c8', '#2a1c0c'], 'gold': '#ffe8b0', 'base': '#120c06', **kw}


# angels in rings round a centre on the ground: back and front halves, standing still (an orbit at speed 0)
def rings(center, radius, ground, size, count=320, band=(0.38, 1.0), **kw):
    ring = {'center': center, 'radius': radius, 'band': list(band), 'speed': 0}
    base = {'type': 'crowd', 'kind': 'angels', 'ground': ground, 'area': [-3000, 3000, -9000, -1000], 'count': count, 'size': size,
            'color': '#fff2cc', 'dim': 0.3, 'glow': 0.55, 'mill': 0, 'speed': 0, 'flicker': 0.1}
    return [{**base, 'orbit': {**ring, 'half': 'back'}, **kw}, {**base, 'orbit': {**ring, 'half': 'front'}, **kw}]
