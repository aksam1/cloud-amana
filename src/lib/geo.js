// Small deterministic geometry kit: every procedural shape is seeded, so a scene looks the same on every visit.

export function rng(seed = 1) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Smooth 1D value noise in [0, 1]. */
export function vnoise(x) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function mixColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p, sh) => (p >> sh) & 255;
  const c = [16, 8, 0].map((sh) => Math.round(lerp(ch(pa, sh), ch(pb, sh), t)));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * A mountain ridge as a closed SVG path. `sharp` blends in ridged noise so peaks read as
 * brush-pointed (ink-wash) rather than rolling hills.
 */
export function ridgeFn({ seed = 1, y = 600, amp = 120, sharp = 0.4, freq = 1 / 300 }) {
  const off = seed * 37.13;
  return (x) => {
    let h = 0;
    let a = 1;
    let f = freq;
    let norm = 0;
    for (let o = 0; o < 5; o++) {
      const n = vnoise(x * f + off + o * 19.7);
      const ridged = 1 - Math.abs(2 * n - 1);
      h += a * lerp(n, ridged, sharp);
      norm += a;
      a *= 0.48;
      f *= 2.15;
    }
    const jitter = (vnoise(x * 0.21 + off) - 0.5) * 3;
    return y - (h / norm) * amp * 1.6 + amp * 0.35 + jitter;
  };
}

/** `tilt` slopes the whole ridge (positive: higher on the left), for a hillside that falls away. */
export function ridgePath({ x0 = -700, x1 = 2300, bottom = 2600, tilt = 0, ...opts }) {
  const fy = ridgeFn(opts);
  const pts = [];
  for (let x = x0; x <= x1; x += 8) pts.push(`${x},${(fy(x) + (x - 800) * tilt).toFixed(1)}`);
  return `M${x0},${bottom} L${pts.join(' L')} L${x1},${bottom} Z`;
}

/** Catmull-Rom spline through points → smooth cubic SVG path. */
export function smoothPath(points, closed = false) {
  if (points.length < 2) return '';
  const p = closed ? [points.at(-1), ...points, points[0], points[1]] : [points[0], ...points, points.at(-1)];
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [x0, y0] = p[i - 1];
    const [x1, y1] = p[i];
    const [x2, y2] = p[i + 1];
    const [x3, y3] = p[i + 2];
    const c1 = [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6];
    const c2 = [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return closed ? `${d} Z` : d;
}

/** Sample a Catmull-Rom curve into evenly spread points (for ribbons, glyph placement). */
export function sampleCurve(points, steps = 60) {
  const p = [points[0], ...points, points.at(-1)];
  const out = [];
  const segs = p.length - 3;
  for (let s = 0; s <= steps; s++) {
    const g = (s / steps) * segs;
    const i = Math.min(segs - 1, Math.floor(g));
    const t = g - i;
    const [a, b, c, d] = [p[i], p[i + 1], p[i + 2], p[i + 3]];
    const t2 = t * t;
    const t3 = t2 * t;
    const f = (k) => 0.5 * (2 * b[k] + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3);
    out.push([f(0), f(1)]);
  }
  return out;
}

/** Recursive branching (bare trees, ink-drop veins). Returns [{d, w}] strokes. */
export function branches({ x, y, angle = -90, len = 120, depth = 5, seed = 3, spread = 30, shrink = 0.72, width = 9 }) {
  const r = rng(seed);
  const out = [];
  const grow = (x0, y0, a, l, dep, w) => {
    const rad = (a * Math.PI) / 180;
    const bend = (r() - 0.5) * 18;
    const mx = x0 + Math.cos(((a + bend) * Math.PI) / 180) * l * 0.5;
    const my = y0 + Math.sin(((a + bend) * Math.PI) / 180) * l * 0.5;
    const x1 = x0 + Math.cos(rad) * l;
    const y1 = y0 + Math.sin(rad) * l;
    out.push({ d: `M${x0.toFixed(1)},${y0.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`, w, depth: dep, x1, y1, order: out.length });
    if (dep <= 0) return;
    const kids = r() < 0.3 ? 3 : 2;
    for (let k = 0; k < kids; k++) {
      const da = (k - (kids - 1) / 2) * spread + (r() - 0.5) * spread * 0.6;
      grow(x1, y1, a + da, l * (shrink + (r() - 0.5) * 0.15), dep - 1, w * 0.62);
    }
  };
  grow(x, y, angle, len, depth, width);
  return out;
}

/** Points inside a standing figure silhouette (feet at 0,0, height 100) for the clay gathering. */
export function figurePoints(n, seed = 5) {
  const r = rng(seed);
  const pts = [];
  while (pts.length < n) {
    const x = (r() - 0.5) * 40;
    const y = -r() * 88;
    const inHead = (x * x) / 100 + ((y + 78) * (y + 78)) / 110 < 1;
    const half = y > -64 ? 17 - (Math.abs(y) / 64) * 8 : 0;
    const inBody = y > -66 && Math.abs(x) < half;
    if (inHead || inBody) pts.push([x, y]);
  }
  return pts;
}

/** Robe-like light silhouette, feet at (0,0), ~100 tall with the head. */
export const BODY_PATH = 'M-17,0 C-16,-28 -13,-50 -9,-61 C-6,-67 6,-67 9,-61 C13,-50 16,-28 17,0 Z';

export const FLAME_PATH =
  'M0,0 C-22,-6 -27,-38 -12,-60 C-7,-69 -3,-82 0,-100 C4,-86 8,-77 13,-66 C27,-45 23,-7 0,0 Z';

export function roman(n) {
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let s = '';
  let v = n;
  for (const [k, sym] of map) while (v >= k) { s += sym; v -= k; }
  return s;
}
