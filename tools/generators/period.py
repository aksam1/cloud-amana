"""
The period table: one place that says which century each scene's built world belongs to.

It is read by two things, so they can never drift apart:
  * the scene writers in this folder (base.dump appends the art note that goes with the period)
  * tools/gen/period.py, which patches the scene JSON in place and the generator sources

HOW THE SCALE WORKS
-------------------
The app's own law: a person of 1.7 m stands 255 x depth design units tall.
So   metres = h * (1.7 / 255) / depth      (h is the layer's height in design units)
and   h for a wall of M metres at depth d  =  M * 150 * d

A `facade` with a `gate` is a city wall and is measured in metres: a mud-brick city
wall of the third millennium BCE is 4-9 m.
A `facade` with `doors` and no gate is a building seen from inside (a hall or a house):
its height frames the room and is not a claim about the world, so it only gets a style.

THE GRADES (src/layers/town.jsx)
  hut       Adam's valley - domed huts of branch and reed
  village   the first settlements - low mud-brick
  town      Sumer, Madyan, Sodom - mud-brick, flat roofs
  city      Egypt - ochre limestone, river terraces
  assyrian  Nineveh - crenellated mud-brick
  israelite Dawud and Sulayman - dressed limestone
  galilaean Bethlehem and Galilee - lime-plastered stone, low and plain
  desert    Madyan's trading town - sun-dried brick, very low, tan

THE STYLES
  facade     mudbrick (default), ashlar, pylon, brick
  column     classical (default), protoaic, pillared
  colonnade  papyrus, lotus, pier, cedar, crystal, colossus, protoaic
"""

# ── The town grade for each scene ──────────────────────────────────────────

TOWN = {
    # c1 · the jinn among the first dwellings
    'jinn': 'hut',
    # c2 · the first generations
    'call': 'village',
    'righteous': 'town',
    'statues': 'town',
    # c3 · Nuh's people, a mud-brick town on the plain
    'nuh-call': 'town',
    'openly-secretly': 'town',
    'centuries': 'town',
    'chiefs': 'town',
    'command': 'town',
    'building': 'town',
    'boarding': 'town',
    'deluge': 'town',
    # c6-c7 · Ur and the cities of the plain
    'ur': 'town',
    'broken': 'town',
    'fire': 'town',
    'plain': 'town',
    'visitors': 'town',
    'night': 'town',
    'morning': 'town',
    # c8 · the line of Ismail (a village, unchanged)
    'lineage': 'village',
    # c9 · Egypt
    'aziz': 'city',
    # c10 · Madyan, a low town of sun-dried brick
    'madyan': 'desert',
    'measure': 'desert',
    'reform': 'desert',
    'canopy': 'desert',
    'lament': 'desert',
    # c11-c12 · Egypt
    'pharaoh': 'city',
    'basket': 'city',
    'asiya': 'city',
    'nursed': 'city',
    'blow': 'city',
    'flight': 'city',
    'festival': 'city',
    'believe': 'city',
    'tower': 'city',
    'asiyaprayer': 'city',
    'plagues': 'city',
    'exodus': 'city',
    # c13 · Qarun's town
    'qarun': 'town',
    'boatwall': 'town',
    'reasons': 'town',
    # c14 · Dawud and Sulayman
    'kifl': 'israelite',
    'tabut': 'israelite',
    # c15 · Ba'l and Nineveh
    'baal': 'israelite',
    'leaving': 'assyrian',
    'believed': 'assyrian',
    # c16-c17 · Bethlehem and Galilee
    'vow': 'galilaean',
    'cradle': 'galilaean',
    'claybirds': 'galilaean',
    'ascension': 'galilaean',
    # c18 · the town of the messengers
    'awakening': 'town',
    'yasin': 'town',
    # c20 · the signs of the Hour
    'lamps': 'town',
    'towers': 'town',
}

# ── The wall style for each scene ──────────────────────────────────────────
#   mudbrick  courses of sun-dried brick, stepped merlons (the default)
#   ashlar    dressed stone blocks, a chevron frieze, a stepped voussoir arch
#   pylon     a battered Egyptian pylon, tapering inward
#   brick     fine baked brick, the Neo-Babylonian and Assyrian look

FACADE = {
    'aziz': 'ashlar',     # c9 - Egypt
    'nursed': 'ashlar',   # c11 - the palace seen from the river
    'pharaoh': 'pylon',   # c11 - the fortress of the king
    'asiya': 'pylon',     # c11 - the palace
    'blow': 'pylon',      # c11 - the city gate
    'exodus': 'pylon',    # c12 - by night
    'ur': 'brick',        # c6 - Ur, its walls of baked brick
    'father': 'brick',
    'broken': 'brick',
    'ask': 'brick',
    'kifl': 'ashlar',     # c14
    'leaving': 'brick',   # c15 - Nineveh
    'believed': 'brick',
    'vow': 'ashlar',      # c16 - Bethlehem
    'mihrab': 'ashlar',   # c16 - the temple's prayer chamber
    'nightprayer': 'ashlar',
    'tidings': 'ashlar',
    'cradle': 'ashlar',   # c16 - the town gate
}

# ── The column style for each scene ────────────────────────────────────────
#   classical  a fluted shaft with a cushion capital (the classical world)
#   protoaic   a slender plain shaft on a stepped base under a carved block capital
#   pillared   a square brick pier with a glazed band (the Levant and Mesopotamia)

COLUMN = {
    'might': 'pillared',   # c4 - Iram: brick piers, not marble
    'brother': 'pillared',
    'warning': 'pillared',
    'cloud': 'pillared',
    'wind': 'pillared',
    'broken': 'pillared',  # c6 - the idol house at Ur
    'ask': 'pillared',
}

# COLONNADE[scene id] = (style, xs, colors): the scene's `column` layers become a colonnade.
COLONNADE = {
    'mihrab': ('protoaic', [520, 1080], ['#c8a880', '#e0c8a0', '#5a4430']),
    'nightprayer': ('protoaic', [520, 1080], ['#c8a880', '#e0c8a0', '#5a4430']),
    'tidings': ('protoaic', [520, 1080], ['#c8a880', '#e0c8a0', '#5a4430']),
    'asiya': ('papyrus', [760, 1300], ['#e0c8a0', '#a87048', '#8a6a48']),
}

# ── The city walls that are cut to true scale ──────────────────────────────
# scene id -> (depth, metres). A mud-brick city wall of the third millennium BCE
# stands 4-9 m; these five were 10-16 m, which is a fortress, not a town wall.

CUT = {
    'expel': (0.2, 8.0),
    'night': (0.2, 8.0),
    'visitors': (0.14, 7.0),
    'leaving': (0.18, 8.0),
    'believed': (0.18, 8.0),
}

# ── The towns that are ruins ───────────────────────────────────────────────

RUIN = {
    'awakening': 1,
}

# ── The art note that goes with each grade ─────────────────────────────────

NOTE = {
    'hut': "The huts of the first dwellings are imagined; huts of branch and reed of the kind Adam's people are said to have lived in.",
    'village': "The look of the early village is imagined; its low mud-brick houses are of the kind built in the first generations.",
    'town': "The look of the town is imagined; its mud-brick walls and flat roofs are of the kind built in this people's time.",
    'city': "Egypt's look is imagined; its ochre limestone houses and flat roofs are of the kind built on the Nile.",
    'assyrian': "Nineveh's look is imagined; its crenellated mud-brick walls are of the kind built in the Assyrian valley.",
    'israelite': "The look of the town is imagined; its dressed limestone houses and terraced roofs are of the kind built in the Levant.",
    'galilaean': "The look of the town is imagined; its lime-plastered stone houses, low and plain, are of the kind built in Galilee.",
    'desert': "The look of the town is imagined; its sun-dried brick houses, low and tan, are of the kind built in the northern desert.",
}

# The building of each period, as a phrase that can be added to a sentence that already
# says the look of the town is imagined.
TAIL = {
    'hut': "huts of branch and reed of the kind Adam's people are said to have lived in",
    'village': 'low mud-brick houses of the kind built in the first generations',
    'town': "mud-brick walls and flat roofs of the kind built in this people's time",
    'city': 'ochre limestone houses and flat roofs of the kind built on the Nile',
    'assyrian': 'crenellated mud-brick walls of the kind built in the Assyrian valley',
    'israelite': 'dressed limestone houses and terraced roofs of the kind built in the Levant',
    'galilaean': 'lime-plastered stone houses, low and plain, of the kind built in Galilee',
    'desert': 'sun-dried brick houses, low and tan, of the kind built in the northern desert',
}


def metres(h, depth):
    """A layer height in design units -> metres."""
    return h * (1.7 / 255.0) / depth


def height_for(m, depth):
    """A wall of m metres -> a layer height in design units."""
    return round(m * 150 * depth)


def grades_in(layers):
    """Every town grade used in a layer tree, in order."""
    out = []
    for l in layers or []:
        if l.get('type') == 'town' and l.get('grade') not in out:
            out.append(l['grade'])
        if 'layers' in l:
            for g in grades_in(l['layers']):
                if g not in out:
                    out.append(g)
    return out


def note_for(scene_id, layers):
    """The art note for a scene, or None when the scene's look is unchanged."""
    if scene_id not in TOWN and scene_id not in FACADE and scene_id not in COLUMN and scene_id not in COLONNADE:
        return None
    grades = grades_in(layers)
    grade = TOWN.get(scene_id) or (grades[0] if grades else None)
    if not grade:
        return None
    return NOTE.get(grade)


def note_for_grades(grades):
    """The art note for a set of grades (used when a scene's grade changed)."""
    if not grades:
        return None
    if len(grades) == 1:
        return NOTE.get(grades[0])
    names = {'hut': 'branch-and-reed huts', 'village': 'low mud-brick houses', 'town': 'mud-brick houses with flat roofs',
             'city': 'ochre limestone houses', 'assyrian': 'crenellated mud-brick', 'israelite': 'dressed limestone houses',
             'galilaean': 'lime-plastered stone houses', 'desert': 'sun-dried brick houses'}
    parts = [names.get(g, g) for g in grades]
    return "The look of the town is imagined; its " + ' and '.join(parts) + " are of the kinds built in this people's time."
