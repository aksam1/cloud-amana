"""Bring a group of layers nearer the camera at true scale: depth x k, sizes x k, positions spread about (cx, cy) by k.
Seen from the reference camera the group stays where it was, only larger; its proportions to everything else hold."""
import copy

XY = ('pos',)
SIZE = ('h', 'r', 's', 'size', 'rise', 'dais')


def _pt(p, k, cx, cy):
    q = list(p)
    q[0] = round(cx + (p[0] - cx) * k, 1)
    if len(p) > 1 and p[1] is not None:
        q[1] = round(cy + (p[1] - cy) * k, 1)
    return q


def _fix(L, k, cx, cy, top):
    t = L.get('type')
    if top and 'depth' in L:
        L['depth'] = round(L['depth'] * k, 4)
    for key in ('pos',):
        if L.get(key):
            L[key] = _pt(L[key], k, cx, cy)
    if L.get('path'):
        L['path'] = [_pt(p, k, cx, cy) for p in L['path']]
    if 'x' in L and isinstance(L['x'], (int, float)):
        L['x'] = round(cx + (L['x'] - cx) * k, 1)
    if 'y' in L and isinstance(L['y'], (int, float)) and t not in ('ground', 'ridge', 'dunes', 'floor'):
        L['y'] = round(cy + (L['y'] - cy) * k, 1)
    for key in SIZE:
        if isinstance(L.get(key), (int, float)):
            L[key] = round(L[key] * k, 2)
    if t != 'light' and isinstance(L.get('w'), (int, float)):
        L['w'] = round(L['w'] * k, 1)
    for key in ('x0', 'x1'):
        if isinstance(L.get(key), (int, float)):
            L[key] = round(cx + (L[key] - cx) * k, 1)
    if L.get('area') and t != 'crowd':
        a = L['area']
        L['area'] = _pt(a[:2], k, cx, cy) + _pt(a[2:], k, cx, cy)
    if L.get('move') and L['move'].get('path'):
        L['move']['path'] = [[p[0] * k, p[1] * k] + list(p[2:]) for p in L['move']['path']]
    for p in L.get('pairs', []):
        p['path'] = [_pt(q, k, cx, cy) for q in p['path']]
    for it in L.get('items', []) if isinstance(L.get('items'), list) else []:
        if isinstance(it, dict):
            _fix(it, k, cx, cy, False)
    if isinstance(L.get('gate'), dict):
        for key in ('w', 'h'):
            if key in L['gate']:
                L['gate'][key] = round(L['gate'][key] * k, 1)
    for d in L.get('doors', []):
        _fix(d, k, cx, cy, False)
    for v in (L.get('at') or {}).values():
        if isinstance(v, dict):
            _fix(v, k, cx, cy, False)


def zoom(k, cx, cy, *layers):
    out = []
    for L in layers:
        L = copy.deepcopy(L)
        _fix(L, k, cx, cy, True)
        out.append(L)
    return out
