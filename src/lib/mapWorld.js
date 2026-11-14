// The map of time.
//
// The campaign map is not a road through a country. It is one thread of light descending
// from the Creation to the Hour, and the *gap* between two seals is the time between them:
// the Creation to Adam is a long fall, the prophets are a tight run of seals, and the signs
// of the Hour close the thread.
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

import { clamp, rng } from './geo.js';

export const W = 1700; // the width of the world; the thread wanders about its centre
const TOP = 190; // the light of the Creation, and the first seal
const BOTTOM = 170; // the Hour
const SPAN = 5200; // the length of the thread, from the first seal to the last
const MIN_GAP = 100; // the least room two seals may have, in world units
const MARGIN = 300; // the room at each side for the names of the seals
const DRIFT = 380; // how far the thread may wander from the centre line
const RAW_MIN = 0.30; // the least a compressed age may be, before the scale
const EXP = 0.7; // the compression of the ages
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
    const drift = Math.sin(i * 0.83 + 0.6) * DRIFT + Math.sin(i * 0.31 + 1.2) * DRIFT * 0.45;
    const p = {
      ...n,
      i,
      bp: bp[i],
      x: clamp(cx + drift, MARGIN, W - MARGIN),
      y,
      gap: i < raw.length ? Math.max(MIN_GAP, k * raw[i]) : 0,
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

  // the eras are strata: bands of the thread, not strips of the map
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

  // a few stars in the first stratum only: the Creation is the one night of the map
  const r = rng(2024);
  const creation = regions[0];
  const stars = [];
  if (creation) {
    for (let i = 0; i < 46; i++) {
      stars.push({
        x: 120 + r() * (W - 240),
        y: creation.y0 + 40 + r() * (creation.y1 - creation.y0 - 80),
        s: 2 + r() * 4,
      });
    }
  }

  return { W, H, nodes: placed, byId, segs, regions, stars };
}
