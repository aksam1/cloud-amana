"""Every indoor place in the story, each its own room (no two places share one).
Walls stand at depth 0.18 on the line y 712 like the old generic hall, floors at 0.19, pillars at 0.26, and
the near pillars at 0.42, so figures and cameras placed for the old hall still stand right."""


def floor(color, color2, lines=12, gloss=0.3, d=0.19, y=714, vp=(800, 500)):
    return {'type': 'floor', 'depth': d, 'y': y, 'vp': list(vp), 'color': color, 'color2': color2, 'lines': lines, 'gloss': gloss, 'area': [-800, y - 6, 2400, 1350]}


def brazier(x, d=0.3, y=790, s=0.6, flame='#ffb050'):
    return [{'type': 'brazier', 'depth': d, 'x': x, 'y': y, 's': s},
            {'type': 'light', 'kind': 'flame', 'depth': d, 'pos': [x, y - round(74 * s) - 4], 'h': round(34 * s), 'color': flame, 'glow': 1.1}]


def lamp(x, y, d, h=12):
    return {'type': 'light', 'kind': 'flame', 'depth': d, 'pos': [x, y], 'h': h, 'color': '#ffc060', 'glow': 1.4}


def sky(top='#141a2a', bottom='#0e121c'):
    return {'type': 'sky', 'depth': 0.03, 'fog': 0, 'stops': [[0, top], [1, bottom]]}


def colonnade(xs, style, d=0.26, y=740, h=600, w=48, colors=None, **kw):
    c = {'type': 'colonnade', 'depth': d, 'xs': xs, 'y': y, 'h': h, 'w': w, 'style': style, **kw}
    if colors:
        c['colors'] = colors
    return c


ROOMS = {
    # Namrud's throne room in Ur: mudbrick glazed with blue tile, rosette friezes, brick piers
    'namrud': lambda: [
        sky('#1a1410', '#0e0a08'),
        {'type': 'wall', 'depth': 0.18, 'y': 712, 'h': 820, 'material': 'glazed', 'seed': 61, 'dado': '#2a4a8a',
         'frieze': {'at': 0.62, 'h': 44, 'style': 'rosette', 'colors': ['#2a4a8a', '#e8c860', '#1a1a1a']},
         'openings': [{'x': 800, 'w': 90, 'h': 150, 'kind': 'arch', 'lit': True}]},
        floor('#8a6040', '#3a2414', 12, 0.15),
        colonnade([420, 1180], 'pier', w=64, colors=['#a87048', '#2a4a8a', '#4a2c18']),
        *brazier(640), *brazier(960),
    ],
    # The Aziz's house: painted plaster, a lotus frieze, a doorway and a window onto the garden pool
    'aziz': lambda door_x=1070: [
        sky('#1a1a24', '#121218'),
        {'type': 'wall', 'depth': 0.18, 'y': 712, 'h': 820, 'material': 'plaster', 'base': '#e4d0aa', 'seed': 91, 'dado': '#5a7a4a',
         'frieze': {'at': 0.6, 'h': 40, 'style': 'lotus', 'colors': ['#2a6a7a', '#c84a3a', '#3a2a1a']},
         'openings': [{'x': door_x, 'w': 64, 'h': 116, 'kind': 'door', 'view': {'sky': 'day', 'land': 'garden', 'horizon': 0.4}},
                      {'x': 520, 'w': 80, 'h': 96, 'kind': 'window', 'lift': 250, 'view': {'sky': 'day', 'land': 'garden', 'horizon': 0.15}}]},
        floor('#a88a68', '#4a3a2a', 10, 0.25),
        colonnade([420, 1180], 'lotus', w=46),
        *brazier(680), *brazier(1100),
    ],
    # The king of Egypt's throne hall (Yusuf's time): lapis walls, a gold zigzag, clerestory light, papyrus columns
    'kinghall': lambda: [
        sky('#141a2a', '#0e121c'),
        {'type': 'wall', 'depth': 0.18, 'y': 712, 'h': 820, 'material': 'plaster', 'base': '#33467a', 'dark': '#141c3a', 'seed': 92, 'dado': '#c8a050',
         'frieze': {'at': 0.5, 'h': 30, 'style': 'zigzag', 'colors': ['#1a2650', '#e0b860', '#c8a050']},
         'openings': [{'x': x, 'w': 60, 'h': 90, 'kind': 'window', 'lift': 470, 'view': {'sky': 'day', 'land': 'none'}} for x in (300, 560, 1040, 1300)]},
        *[{'type': 'beam', 'depth': 0.2, 'x': x, 'y': 714, 'w': 70, 'color': '#fff2d0'} for x in (560, 1040)],
        floor('#3a4a6a', '#141c2e', 14, 0.45),
        colonnade([420, 1180], 'papyrus', h=640, w=60, colors=['#d8c098', '#2a5a9a', '#7a5a38']),
        *brazier(680), *brazier(1100),
    ],
    # Yusuf's hall of state: an open portico onto the granaries and the Nile, in morning light
    'yusufhall': lambda: [
        sky('#c8d4dc', '#e8e0cc'),
        {'type': 'wall', 'depth': 0.18, 'y': 712, 'h': 820, 'material': 'plaster', 'base': '#ecdcb8', 'seed': 93, 'dado': '#2a6a5a',
         'frieze': {'at': 0.7, 'h': 36, 'style': 'lotus', 'colors': ['#2a6a5a', '#e0b050', '#3a2a1a']},
         'openings': [{'x': 420, 'w': 260, 'h': 300, 'kind': 'door', 'view': {'sky': 'day', 'land': 'granaries', 'horizon': 0.3}},
                      {'x': 1180, 'w': 260, 'h': 300, 'kind': 'door', 'view': {'sky': 'day', 'land': 'river', 'horizon': 0.3}}]},
        floor('#c8b088', '#7a6448', 10, 0.3),
        colonnade([620, 980], 'lotus', h=600, w=50, colors=['#ece0c4', '#2a6a5a', '#8a6a48']),
    ],
    # Yaqub's house in Egypt: a plain mudbrick room, beams, one small window onto the evening hills
    'yaqubhouse': lambda: [
        sky('#1a1410', '#0e0a08'),
        {'type': 'wall', 'depth': 0.18, 'y': 712, 'h': 820, 'material': 'mudbrick', 'seed': 94, 'beams': True,
         'openings': [{'x': 1240, 'w': 70, 'h': 70, 'kind': 'window', 'lift': 280, 'view': {'sky': 'dusk', 'land': 'hills', 'horizon': 0.3}}],
         'niches': [{'x': 440, 'w': 40, 'h': 60, 'lift': 200}]},
        floor('#8a6a48', '#3a2a1a', 6, 0.05),
        lamp(440, 512 + 26, 0.181, 8),
    ],
    # Pharaoh's palace (Musa's time): black granite, colossal faceless statues, red and gold
    'pharaoh': lambda: [
        sky('#120e10', '#0a0808'),
        {'type': 'wall', 'depth': 0.18, 'y': 712, 'h': 820, 'material': 'granite', 'seed': 95, 'dado': '#8a2a24',
         'frieze': {'at': 0.66, 'h': 34, 'style': 'zigzag', 'colors': ['#1a1418', '#d8a838', '#8a2a24']},
         'openings': [{'x': 400, 'w': 60, 'h': 110, 'kind': 'door', 'lit': True}]},
        floor('#3a3434', '#141012', 12, 0.55),
        colonnade([360, 1240], 'colossus', d=0.24, y=736, h=560, w=60),
    ],
    # Dawud's prayer chamber: cedar panelling, beams, a high lattice window onto the night
    'dawudchamber': lambda: [
        sky('#0e1220', '#141a2c'),
        {'type': 'wall', 'depth': 0.18, 'y': 712, 'h': 500, 'material': 'cedar', 'seed': 96, 'beams': False, 'dado': '#3a2414',
         'frieze': {'at': 0.86, 'h': 26, 'style': 'vine', 'colors': ['#4a2e1a', '#c8a060', '#2e1a0e']},
         'openings': [{'x': 1180, 'w': 80, 'h': 120, 'kind': 'arch', 'lift': 260, 'view': {'sky': 'night', 'land': 'city', 'moon': True, 'horizon': 0.15}}],
         'niches': [{'x': 540, 'w': 36, 'h': 54, 'lift': 230}]},
        floor('#6a5a48', '#2a2018', 8, 0.2),
        lamp(540, 712 - 230 - 18, 0.181, 8),
    ],
    # Dawud's court: cedar and dressed stone, a vine frieze, cedar posts
    'dawudcourt': lambda: [
        sky('#1a1612', '#100c0a'),
        {'type': 'wall', 'depth': 0.18, 'y': 712, 'h': 820, 'material': 'stone', 'base': '#c8b490', 'seed': 97, 'dado': '#5a3a22',
         'frieze': {'at': 0.58, 'h': 38, 'style': 'vine', 'colors': ['#6a4a2a', '#9ab45a', '#3a2414']},
         'openings': [{'x': 1240, 'w': 70, 'h': 120, 'kind': 'arch', 'lit': True}]},
        floor('#8a7a62', '#3a3024', 12, 0.25),
        colonnade([420, 1180], 'cedar', h=600, w=40),
        *brazier(640), *brazier(960),
    ],
    # Sulayman's palace: white marble, crystal columns, arched windows onto the gardens (the floor of glass is the scene's)
    'sulayman': lambda: [
        sky('#c8d8e4', '#e8eef0'),
        {'type': 'wall', 'depth': 0.18, 'y': 712, 'h': 820, 'material': 'marble', 'seed': 98, 'dado': '#b8a070',
         'frieze': {'at': 0.64, 'h': 32, 'style': 'vine', 'colors': ['#e0d8c8', '#c8a050', '#a8986c']},
         'openings': [{'x': x, 'w': 110, 'h': 200, 'kind': 'arch', 'lift': 120, 'view': {'sky': 'day', 'land': 'garden', 'horizon': 0.3}} for x in (360, 1240)]},
        colonnade([520, 1080], 'crystal', h=640, w=44),
    ],
    # The smithy: soot-dark stone, a hood over the forge, beams
    'smithy': lambda: [
        sky('#141018', '#0c0a0e'),
        {'type': 'wall', 'depth': 0.2, 'y': 724, 'h': 820, 'material': 'stone', 'base': '#5a4a3e', 'dark': '#1e1612', 'seed': 99, 'beams': True,
         'openings': [{'x': 360, 'w': 80, 'h': 140, 'kind': 'door', 'view': {'sky': 'night', 'land': 'city', 'horizon': 0.2}}]},
        floor('#3a3028', '#141008', 6, 0.1, d=0.21, y=726, vp=(800, 520)),
    ],
}


def front(style):
    """The near pillars that frame a room, in its own style (none for small rooms)."""
    near = {'namrud': ('pier', ['#a87048', '#2a4a8a', '#4a2c18'], 100), 'aziz': ('lotus', None, 70), 'kinghall': ('papyrus', ['#d8c098', '#2a5a9a', '#7a5a38'], 90),
            'yusufhall': ('lotus', ['#ece0c4', '#2a6a5a', '#8a6a48'], 80), 'pharaoh': ('papyrus', ['#3a3438', '#b0383a', '#1e1a1e'], 90),
            'dawudcourt': ('cedar', None, 60), 'sulayman': ('crystal', None, 70)}
    if style not in near:
        return []
    st, colors, w = near[style]
    return [colonnade([200, 1400], st, d=0.42, y=830, h=900, w=w, colors=colors, ppu=0.9)]


def room(place, **kw):
    # walls are painted finer than the default card (0.7 px/unit): the card's hand wobble is measured in
    # texture pixels, and at 0.7 it swung small windows several degrees off true
    layers = ROOMS[place](**kw)
    for l in layers:
        if l.get('type') == 'wall':
            l.setdefault('ppu', 1.2)
    return layers
