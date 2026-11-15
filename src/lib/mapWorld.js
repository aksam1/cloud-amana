// The map of time.
//
// The campaign map is not a road through a country. It is a cliff of time seen in
// section: five strata of rock stacked one above another, and a single thread of light
// descending through them from the Creation to the Hour. The *gap* between two seals
// is the time between them: the Creation to Adam is a long fall, the prophets are a
// tight run of seals, and the signs of the Hour close the thread.
//
// The scale. Every node gets a number of years before 2026, read from timeline.json's
// human-readable `date` field. The gap between neighbours is the difference of those
// numbers, compressed by a power so that the enormous early ages do not swallow the map
// but keep their shape:
//
//   gap = max(MIN_GAP, (log10(bp_a + 1) - log10(bp_b + 1)) ** 0.55)
//
// The compression is what makes the map honest: a century between two prophets is a
// hand's breadth of the thread, while the age between the Creation and Adam is a fall.

import { clamp, lerp, rng, smoothPath } from './geo.js';

export const W = 1700; // the width of the world; the thread wanders about its centre
const TOP = 190; // the light of the Creation, and the first seal
const BOTTOM = 170; // the Hour
const SPAN = 5200; // the length of the thread, from the first seal to the last
const MIN_GAP = 100; // the least room two seals may have, in world units
const MARGIN = 300; // the room at each side for the names of the seals
const DRIFT = 380; // how far the thread may wander from the centre line
const RAW_MIN = 0.30; // the least a compressed age may be, before the scale
const EXP = 0.7; // the compression of the ages
const RAMP = 6; // how many seals it takes for the thread to reach its full drift
const NOW = 2026;

// ── The dates ──────────────────────────────────────────────────────────────
// timeline.json writes its dates the way a person would say them ("≈ 2000–3000 BCE,
// after Hud"), so they are read here rather than stored as numbers.

const ERA_RE = /(\d[\d,.]*)\s*(?:[-–/]\s*(\d[\d,.]*))?\s*(bce|ce)\b/g;
const NUM_RE = /\d[\d,]*(?:\.\d+)?/g;

const num = (t) => parseFloat(String(t).replace(/,/g, ''));

/** A date string -> years before 2026, or null when it says no year at all. */
export function parseDate(str) {
  if (!str) return null;
  const s = String(str).toLowerCase();
  const spans = [];
  ERA_RE.lastIndex = 0;
  let m;
  while ((m = ERA_RE.exec(s))) {
    const a = num(m[1]);
    const b = m[2] == null ? a : num(m[2]);
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    if (m[3] === 'bce') spans.push([NOW + lo, NOW + hi]);
    else spans.push([NOW - hi, NOW - lo]);
  }
  if (spans.length) {
    const lo = Math.min(...spans.map((x) => x[0]));
    const hi = Math.max(...spans.map((x) => x[1]));
    // "after X" means the nearer end of the range
    if (spans.length === 1 && /\bbce\b/.test(s) && /\bafter\b/.test(s)) return lo;
    return (lo + hi) / 2;
  }
  // no era: a plain span of years, counted back from now
  const nums = (s.match(NUM_RE) || []).map(num);
  if (!nums.length) return null;
  let v = nums[0];
  if (/billion/.test(s)) v *= 1e9;
  else if (/million/.test(s)) v *= 1e6;
  else if (/thousand/.test(s)) v *= 1e3;
  return v;
}

// The nodes whose date says no year, and the one place their years are set by hand.
// The jinn, humanity, Idris, Dhul-Kifl and the Stories of Wisdom are filled in by
// interpolation below; the three signs of the Hour sit just after the Messenger's
// passing, because the Hour has not come and their times are unknown.
const AFTER_THE_HOUR = { minor: NOW - 632.4, major: NOW - 632.8, judgment: NOW - 633.2 };

/** Every node's years before 2026, with the undated ones interpolated in log space. */
export function fillDates(nodes) {
  const bp = nodes.map((n) => {
    if (n.id in AFTER_THE_HOUR) return AFTER_THE_HOUR[n.id];
    return parseDate(n.date);
  });
  // A run of undated nodes is filled as one group, between the dated nodes on either
  // side of it, so the result does not depend on the order the gaps are walked.
  let i = 0;
  while (i < bp.length) {
    if (bp[i] != null) {
      i++;
      continue;
    }
    let j = i;
    while (j < bp.length && bp[j] == null) j++;
    const before = i > 0 ? bp[i - 1] : null;
    const after = j < bp.length ? bp[j] : null;
    const count = j - i;
    if (before == null || after == null) {
      // nothing on one side: take the side we have
      const only = before ?? after ?? 1;
      for (let t = 0; t < count; t++) bp[i + t] = only;
    } else {
      const a = Math.log10(before + 1);
      const b = Math.log10(after + 1);
      for (let t = 0; t < count; t++) {
        bp[i + t] = 10 ** (a + ((b - a) * (t + 1)) / (count + 1)) - 1;
      }
    }
    i = j;
  }
  return bp;
}

// ── The thread ─────────────────────────────────────────────────────────────

/** The compressed age between two nodes, before the map's scale. */
function rawGap(a, b) {
  const d = Math.log10(a + 1) - Math.log10(b + 1);
  return Math.max(RAW_MIN, Math.max(d, 0) ** EXP);
}

/**
 * The scale that makes the thread exactly SPAN long while keeping every gap at least
 * MIN_GAP. The sum of the gaps grows with the scale, so a bisection finds it.
 */
function solveScale(raw) {
  const sum = (k) => raw.reduce((t, r) => t + Math.max(MIN_GAP, k * r), 0);
  let lo = 0;
  let hi = 1e7;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (sum(mid) < SPAN) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// ── The ground of the ages ────────────────────────────────────────────────
//
// Each stratum of the cliff is drawn from its own material: the sky of the first
// night, the loam of the first gardens, the mud-brick courses of the cities of the
// prophets, the dunes of Arabia, and the scorched rock of the last day.
//
// Nothing here is random at draw time: every scatter is seeded, so the cliff is the
// same on every visit.

/** A point in a band, kept clear of the seals and of the name margin. */
function inBand(r, band, opts = {}) {
  const { x0 = 165, x1 = W - 165, avoid = 96 } = opts;
  const y = lerp(band.y0, band.y1, r());
  let x = lerp(x0, x1, r());
  // push the point away from any seal it would sit on
  for (let tries = 0; tries < 6; tries++) {
    const near = opts.seals.find((s) => (s.x - x) ** 2 + (s.y - y) ** 2 < avoid ** 2);
    if (!near) break;
    x = near.x + (x > near.x ? 1 : -1) * (avoid + 40 + r() * 90);
    x = clamp(x, x0, x1);
  }
  return { x, y };
}

/** The seven heavens: rings of light opening out of the one point at the top. */
function buildHeavens(cx, cy) {
  return Array.from({ length: 7 }, (_, i) => ({
    rx: 130 + i * 78,
    ry: 74 + i * 44,
    o: 0.5 - i * 0.055,
  }));
}

/** The rays thrown out of that point. */
function buildRays(cx, cy, n = 26) {
  const r = rng(23);
  return Array.from({ length: n }, () => ({
    a: r() * 360,
    len: 260 + r() * 460,
    w: 0.6 + r() * 1.1,
  }));
}

/** The stars of the first night: mostly small, a few bright. */
function buildStars(band, seals) {
  const r = rng(21);
  const out = [];
  for (let i = 0; i < 130; i++) {
    const p = inBand(r, band, { avoid: 70, seals });
    const s = r();
    out.push({ x: p.x, y: p.y, s: s > 0.9 ? 7 + r() * 5 : 2 + r() * 3.4, o: 0.3 + r() * 0.55 });
  }
  return out;
}

/** The slow swirl of the waters before the earth was made. */
function buildSwirls(band, seals) {
  const r = rng(34);
  return Array.from({ length: 7 }, () => {
    const p = inBand(r, band, { avoid: 120, seals });
    const turns = 1.4 + r() * 1.4;
    const rad = 90 + r() * 150;
    const pts = [];
    for (let a = 0; a <= 1; a += 0.08) {
      const th = a * turns * Math.PI * 2;
      const rr2 = rad * a;
      pts.push([p.x + Math.cos(th + r() * 0.01) * rr2, p.y + Math.sin(th) * rr2 * 0.5]);
    }
    return { d: smoothPath(pts), o: 0.1 + r() * 0.12 };
  });
}

/** The loam of the first gardens: fine horizontal bedding, with roots running through. */
function buildLoam(band, seals) {
  const r = rng(24);
  const lines = [];
  for (let y = band.y0 + 18; y < band.y1 - 10; y += 15 + r() * 9) {
    const pts = [];
    for (let x = 130; x <= W - 130; x += 90) {
      pts.push([x, y + (r() - 0.5) * 7]);
    }
    lines.push({ d: smoothPath(pts), o: 0.1 + r() * 0.12 });
  }
  const roots = [];
  for (let i = 0; i < 16; i++) {
    const p = inBand(r, band, { avoid: 110, seals });
    const pts = [[p.x, p.y]];
    let x = p.x;
    let y = p.y;
    for (let k = 0; k < 4; k++) {
      x += (r() - 0.5) * 90;
      y += 12 + r() * 26;
      pts.push([x, y]);
    }
    roots.push({ d: smoothPath(pts), o: 0.14 + r() * 0.14 });
  }
  return { lines, roots };
}

/** The trees of the garden and the olive groves of the south. */
function buildTrees(band, seals, count, seed) {
  const r = rng(seed);
  return Array.from({ length: count }, () => {
    const p = inBand(r, band, { avoid: 110, seals });
    return { x: p.x, y: p.y, s: 0.55 + r() * 0.75, kind: r() > 0.55 ? 'round' : 'tall' };
  });
}

/** The dunes of Arabia: a curve of sand, drawn as one long stroke. */
function buildDunes(band, seals) {
  const r = rng(27);
  const out = [];
  for (let i = 0; i < 9; i++) {
    const p = inBand(r, band, { avoid: 130, seals });
    const w = 150 + r() * 260;
    const h = 16 + r() * 22;
    out.push({ d: `M${(p.x - w).toFixed(0)},${p.y.toFixed(0)} q${(w / 2).toFixed(0)},${(-h).toFixed(0)} ${w.toFixed(0)},0`, o: 0.16 + r() * 0.18 });
  }
  return out;
}

/** The palms of the valleys of Mecca. */
function buildPalms(band, seals) {
  const r = rng(28);
  return Array.from({ length: 9 }, () => {
    const p = inBand(r, band, { avoid: 110, seals });
    return { x: p.x, y: p.y, s: 0.5 + r() * 0.55 };
  });
}

/** The courses of mud-brick: the walls of the cities, seen in section. */
function buildCourses(band, seals) {
  const r = rng(29);
  const courses = [];
  for (let y = band.y0 + 26; y < band.y1 - 12; y += 34 + r() * 10) {
    const pts = [];
    for (let x = 120; x <= W - 120; x += 120) pts.push([x, y + (r() - 0.5) * 4]);
    courses.push({ d: smoothPath(pts), o: 0.13 + r() * 0.1 });
  }
  // the towers of the cities, standing along the horizon of the age
  const towers = [];
  for (let i = 0; i < 7; i++) {
    const p = inBand(r, band, { avoid: 130, seals });
    towers.push({ x: p.x, y: p.y, w: 60 + r() * 130, h: 40 + r() * 110, ziggurat: r() > 0.55 });
  }
  return { courses, towers };
}

/** The rivers of the cities: two threads of water running down the cliff. */
function buildRivers(band, seals) {
  const r = rng(30);
  return Array.from({ length: 2 }, () => {
    const p = inBand(r, band, { avoid: 150, seals });
    const pts = [[p.x, p.y]];
    let x = p.x;
    for (let k = 0; k < 7; k++) {
      x += (r() - 0.5) * 210;
      pts.push([x, p.y + ((band.y1 - band.y0) * (k + 1)) / 7]);
    }
    return { d: smoothPath(pts), o: 0.22 + r() * 0.14 };
  });
}

/** The sea of Yunus, with the whale's road through it. */
function buildSea(band, seals) {
  const r = rng(33);
  const p = inBand(r, band, { avoid: 150, seals });
  return { x: p.x, y: p.y, rx: 150 + r() * 90, ry: 46 + r() * 26 };
}

/** The cracks of the last day: the ground opening. */
function buildCracks(band, seals) {
  const r = rng(32);
  const out = [];
  for (let i = 0; i < 16; i++) {
    const p = inBand(r, band, { avoid: 100, seals });
    const pts = [[p.x, p.y]];
    let x = p.x;
    let y = p.y;
    for (let k = 0; k < 3; k++) {
      x += (r() - 0.5) * 70;
      y += 16 + r() * 34;
      pts.push([x, y]);
    }
    out.push({ d: smoothPath(pts), o: 0.22 + r() * 0.22, w: 1 + r() * 1.6 });
  }
  return out;
}

/** The embers under the last day: the fire beneath the crust. */
function buildEmbers(band, seals) {
  const r = rng(35);
  return Array.from({ length: 40 }, () => {
    const p = inBand(r, band, { avoid: 70, seals });
    return { x: p.x, y: p.y, s: 1 + r() * 2.4, o: 0.2 + r() * 0.5 };
  });
}

/** The glyph inside a seal, for the nodes that carry a picture of their own. */
const GLYPHS = {
  earth: 'globe', // the round earth, with its horizon
  jinn: 'flame', // the jinn are of fire
  mawlid: 'light', // a light born
  revelation: 'light', // a light revealed
  wafat: 'light', // a light gone
  judgment: 'sun', // the sun that is folded
  minor: 'sun',
  major: 'sun',
};

export function buildWorld({ eras, nodes }) {
  const bp = fillDates(nodes);
  const raw = bp.slice(1).map((_, i) => rawGap(bp[i], bp[i + 1]));
  const k = solveScale(raw);

  // y accumulates the gaps: the thread descends, and the distance is the time.
  const cx = W / 2;
  let y = TOP;
  const placed = nodes.map((n, i) => {
    // The thread wanders, but it wanders inside a corridor: every seal keeps MARGIN of
    // room at each side, so the name that falls away from it is never cut off.
    // The first seals stay near the centre, so that the light of the Creation opens
    // in the middle of the page and the cliff is seen head-on.
    const ramp = Math.min(1, i / RAMP);
    const drift = (Math.sin(i * 0.83 + 0.6) * DRIFT + Math.sin(i * 0.31 + 1.2) * DRIFT * 0.45) * ramp;
    const p = {
      ...n,
      i,
      bp: bp[i],
      x: clamp(cx + drift, MARGIN, W - MARGIN),
      y,
      gap: i < raw.length ? Math.max(MIN_GAP, k * raw[i]) : 0,
      glyph: GLYPHS[n.id] || null,
    };
    if (i < raw.length) y += Math.max(MIN_GAP, k * raw[i]);
    return p;
  });
  const H = TOP + SPAN + BOTTOM;
  const byId = Object.fromEntries(placed.map((n) => [n.id, n]));

  // Which side of the thread a seal's name sits on. The thread wanders, so a seal on
  // the left of the centre takes its name to the left, and one on the right to the
  // right: the names then fall away from the thread instead of across it.
  placed.forEach((n) => {
    n.side = n.x < cx ? 'left' : 'right';
  });

  // one segment for every consecutive pair: the arrival ceremony animates along it
  const segs = placed.slice(1).map((b, j) => {
    const a = placed[j];
    const c1x = a.x + (b.x - a.x) * 0.14;
    const c2x = b.x - (b.x - a.x) * 0.14;
    const c1y = a.y + (b.y - a.y) * 0.44;
    const c2y = b.y - (b.y - a.y) * 0.44;
    return {
      from: a.id,
      to: b.id,
      d: `M${a.x.toFixed(1)},${a.y.toFixed(1)} C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`,
    };
  });

  // the eras are strata: bands of the cliff, not strips of the map
  const regions = eras
    .map((e) => {
      const ns = placed.filter((n) => n.era === e.id);
      if (!ns.length) return null;
      const first = ns[0];
      const last = ns.at(-1);
      const idx = eras.indexOf(e);
      const prev = idx > 0 ? placed.filter((n) => n.era === eras[idx - 1].id).at(-1) : null;
      const next = idx < eras.length - 1 ? placed.find((n) => n.era === eras[idx + 1].id) : null;
      const y0 = prev ? (prev.y + first.y) / 2 : TOP - 90;
      const y1 = next ? (last.y + next.y) / 2 : H - BOTTOM + 90;
      return { ...e, y0, y1, cy: (y0 + y1) / 2, first: first.id, last: last.id, count: ns.length };
    })
    .filter(Boolean);

  // ── The ground of each age ───────────────────────────────────────────────
  const first = placed[0];
  const origin = { x: first.x, y: first.y - 96 };
  const band = (id) => regions.find((g) => g.id === id);
  const seals = placed;
  const creation = band('creation');
  const adam = band('adam');
  const prophets = band('prophets');
  const messenger = band('messenger');
  const lastday = band('lastday');

  const scenery = {
    origin,
    heavens: buildHeavens(origin.x, origin.y),
    rays: buildRays(origin.x, origin.y),
    stars: creation ? buildStars(creation, seals) : [],
    swirls: creation ? buildSwirls(creation, seals) : [],
    loam: adam ? buildLoam(adam, seals) : { lines: [], roots: [] },
    trees: adam ? buildTrees(adam, seals, 7, 26) : [],
    groves: prophets ? buildTrees(prophets, seals, 9, 36) : [],
    dunes: messenger ? buildDunes(messenger, seals) : [],
    palms: messenger ? buildPalms(messenger, seals) : [],
    courses: prophets ? buildCourses(prophets, seals) : { courses: [], towers: [] },
    rivers: prophets ? buildRivers(prophets, seals) : [],
    sea: prophets ? buildSea(prophets, seals) : null,
    cracks: lastday ? buildCracks(lastday, seals) : [],
    embers: lastday ? buildEmbers(lastday, seals) : [],
  };

  // the rock face between two ages: the ground line of each stratum
  const ground = regions.map((g, i) => {
    const r = rng(40 + i);
    const pts = [];
    for (let x = 60; x <= W - 60; x += 70) {
      pts.push([x, g.y0 + (r() - 0.5) * 9]);
    }
    return { id: g.id, d: smoothPath(pts), y: g.y0 };
  });

  return { W, H, nodes: placed, byId, segs, regions, scenery, ground, stars: scenery.stars };
}
