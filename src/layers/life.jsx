// Life in the valley seen from afar, painted the same way as the first home: tilled plots brushed in
// with a sweep, the family going about the day as small figures of light, and summer heat over the fields.
import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Svg, useStage, useUid } from '../components/stageKit.jsx';
import { BODY_PATH, FLAME_PATH, lerp, rng } from '../lib/geo.js';

// ── Tilled plots ─────────────────────────────────────────

const CROP = {
  snow: { fill: '#e7e6e1', row: '#c3c8cc', o: 0.85 },
  shoots: { fill: '#7a5f3e', row: '#9db55a', dash: '3 5' },
  green: { fill: '#7b8945', row: '#a5b862', dash: '7 3' },
  gold: { fill: '#b79449', row: '#e2c274', dash: '2.5 2' },
  harvest: { fill: '#b59c66', row: '#cbb07a', dash: '1.5 4', sheaves: true },
  tilled: { fill: '#6a4e33', row: '#8c6c48' },
};
// A season dresses every plot at once; in summer each keeps its own crop.
const SEASON_CROP = { winter: 'snow', spring: 'shoots', autumn: 'harvest', tilled: 'tilled' };

const quadAt = ([a, b, c, d], u, v) => [lerp(lerp(a[0], b[0], u), lerp(d[0], c[0], u), v), lerp(lerp(a[1], b[1], u), lerp(d[1], c[1], u), v)];

/** Rows across a plot from its far edge to its near one, each a slightly bowed stroke; nearer rows sit wider apart. */
function plotRows(pts, n, seed) {
  const r = rng(seed);
  return Array.from({ length: n }, (_, k) => {
    const v = ((k + 0.5) / n) ** 1.25;
    const [lx, ly] = quadAt(pts, 0, v);
    const [rx, ry] = quadAt(pts, 1, v);
    return { d: `M${lx.toFixed(1)},${ly.toFixed(1)} Q${((lx + rx) / 2).toFixed(1)},${((ly + ry) / 2 + (r() - 0.5) * 3).toFixed(1)} ${rx.toFixed(1)},${ry.toFixed(1)}`, w: lerp(0.8, 2.6, v), v };
  });
}

function Plot({ p, i, state, fresh, uid }) {
  const C = CROP[state] || CROP.green;
  const rows = useMemo(() => plotRows(p.pts, p.rows ?? 8, i * 7 + 3), [p, i]);
  const quad = `M${p.pts.map((q) => q.join(',')).join(' L')} Z`;
  const xs = p.pts.map((q) => q[0]);
  const ys = p.pts.map((q) => q[1]);
  const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
  const clip = `${uid}c${i}`;
  return (
    // a change of season dissolves; the old state lingers until the new one has fully arrived
    <AnimatePresence initial={false}>
      <motion.g key={state} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { delay: 1.6, duration: 0.01 } }} transition={{ duration: 1.6 }}>
        {fresh && (
          // the first time a plot appears it is brushed in with one sweep, left to right
          <clipPath id={clip}>
            <motion.rect x={box[0] - 4} y={box[1] - 4} height={box[3] + 8} initial={{ width: 0 }} animate={{ width: box[2] + 8 }} transition={{ duration: 1.4, delay: (p.delay ?? 0) / 1000, ease: 'easeInOut' }} />
          </clipPath>
        )}
        <g clipPath={fresh ? `url(#${clip})` : undefined}>
          <path d={quad} fill={C.fill} opacity={C.o ?? 0.92} />
          <path d={quad} fill={`url(#${uid}s)`} />
          {rows.map((row, k) => (
            <g key={k}>
              <path d={row.d} transform="translate(0 1.2)" stroke="#2a1d12" strokeOpacity="0.22" strokeWidth={row.w} strokeLinecap="round" fill="none" />
              <path d={row.d} stroke={C.row} strokeOpacity="0.85" strokeWidth={row.w} strokeDasharray={C.dash} strokeLinecap="round" fill="none" />
            </g>
          ))}
        {C.sheaves &&
          [[0.22, 0.45], [0.5, 0.7], [0.78, 0.4]].map(([u, v], k) => {
            const [sx, sy] = quadAt(p.pts, u, v);
            const s = lerp(0.7, 1.4, v);
            return (
              <g key={`s${k}`} transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)}) scale(${s.toFixed(2)})`}>
                <path d="M-5,0 L0,-13 L5,0 Z" fill="#d9b866" />
                <path d="M-3,-5 L3,-5" stroke="#8a6a34" strokeWidth="1.2" />
              </g>
            );
          })}
        </g>
      </motion.g>
    </AnimatePresence>
  );
}

/**
 * Tilled plots on the valley floor. `items`: [{ pts: [far-left, far-right, near-right, near-left], crop: "green" |
 * "gold", rows?, beat?, delay? }]; a plot appears at its `beat` (0 = already there) and is brushed in left to right
 * after `delay` ms. `season` dresses them all: "winter" (snow), "spring" (shoots), "autumn" (stubble and
 * sheaves), "tilled" (fresh soil being worked); otherwise each shows its own crop.
 */
export function Plots({ cfg, beat }) {
  const uid = useUid('pl');
  const { items = [], season } = cfg;
  return (
    <Svg>
      <defs>
        {/* soil lit from above: a little lighter at the far edge, darker at the near one */}
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6dc" stopOpacity="0.14" />
          <stop offset="1" stopColor="#1c120a" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {items.map((p, i) => ((p.beat ?? 0) <= beat ? <Plot key={i} p={p} i={i} uid={uid} state={SEASON_CROP[season] || p.crop || 'green'} fresh={(p.beat ?? 0) > 0 && beat === p.beat} /> : null))}
    </Svg>
  );
}

// ── The family at work ───────────────────────────────────

const LIGHTS = ['#fff3dc', '#ffeccc', '#fdf0de', '#ffe2b8', '#fbe8cc'];
// Every tenth person in turn; a growing `count` adds people at the end, so nobody already there moves.
const ROLES = ['water', 'child', 'walk', 'water', 'grind', 'child', 'herd', 'water', 'walk', 'child'];

function cast({ homes, river, pasture, count, size, seed, near, far }) {
  const r = rng(seed);
  const scaleAt = (y) => size * lerp(0.72, 1.12, (y - far) / (near - far));
  return Array.from({ length: count }, (_, i) => {
    let role = ROLES[i % ROLES.length];
    if (role === 'herd' && !pasture) role = 'walk';
    const h1 = homes[Math.floor(r() * homes.length)];
    const h2 = homes[Math.floor(r() * homes.length)];
    const jit = () => (r() - 0.5) * 30;
    let a;
    let b;
    let t;
    if (role === 'water') {
      a = [h1[0] + jit(), h1[1] + 10 + r() * 14];
      b = [river[0] + jit() * 0.6, river[1] + jit() * 0.8];
      t = 9 + r() * 6;
    } else if (role === 'child') {
      a = [h1[0] + jit(), h1[1] + 14 + r() * 16];
      b = [h2[0] + jit() + (h1 === h2 ? 70 : 0), h2[1] + 14 + r() * 16];
      t = 2.6 + r() * 1.6;
    } else if (role === 'grind') {
      a = [h1[0] + (r() < 0.5 ? -1 : 1) * (36 + r() * 14), h1[1] + 8 + r() * 6];
      b = a;
      t = 1.8 + r() * 0.6;
    } else if (role === 'herd') {
      const y = pasture[2] + jit() * 0.4;
      a = [pasture[0], y];
      b = [pasture[1], y + jit() * 0.3];
      t = 16 + r() * 6;
    } else {
      a = [h1[0] + jit(), h1[1] + 12 + r() * 20];
      b = [h2[0] + jit(), h2[1] + 12 + r() * 20];
      t = 8 + r() * 6;
    }
    const ym = (a[1] + b[1]) / 2;
    return { i, role, a, b, t, s: (scaleAt(ym) * (role === 'child' ? 0.62 : 1)) / 100, d: r() * 2.5, c: LIGHTS[Math.floor(r() * LIGHTS.length)], ym };
  });
}

function huddle({ fires, count, size, seed, near, far }) {
  const r = rng(seed + 5);
  const out = fires.map(([x, y], k) => ({ fire: true, x, y, k }));
  const per = Math.max(4, Math.round(count / Math.max(1, fires.length)));
  fires.forEach(([fx, fy]) => {
    for (let j = 0; j < per; j++) {
      const a = (j / per) * Math.PI * 2 + r() * 0.4;
      const y = fy + Math.sin(a) * (8 + r() * 3);
      out.push({ x: fx + Math.cos(a) * (24 + r() * 8), y, s: (size * lerp(0.72, 1.12, (y - far) / (near - far))) / 100, sit: r() < 0.5, c: LIGHTS[Math.floor(r() * LIGHTS.length)] });
    }
  });
  return out.sort((p, q) => p.y - q.y);
}

const Light = ({ uid, c, sit }) => (
  <>
    <ellipse cx="0" cy="-46" rx="46" ry="66" fill={`url(#${uid}h)`} />
    <g transform={sit ? 'scale(1.25 0.58)' : undefined} filter={`url(#${uid}f)`}>
      <path d={BODY_PATH} fill={c} />
      <circle cx="0" cy="-77" r="9.5" fill="#fffaf0" />
    </g>
  </>
);

const Sheep = () => (
  <g>
    <ellipse cx="0" cy="-5" rx="9" ry="5" fill="#ece5d6" />
    <ellipse cx="8" cy="-7" rx="3" ry="2.4" fill="#5e5246" />
  </g>
);

/** Walks a figure back and forth between `a` and `b` (or keeps it still), starting after its own delay. */
export function Walker({ p, lag = 0, still, children }) {
  const go = p.a !== p.b && !still;
  const T = go ? { duration: p.t, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: p.d + lag } : { duration: 0 };
  return (
    <motion.g initial={{ x: p.a[0], y: p.a[1], opacity: 0 }} animate={{ x: go ? [p.a[0], p.b[0]] : p.a[0], y: go ? [p.a[1], p.b[1]] : p.a[1], opacity: 1 }} transition={{ x: T, y: T, opacity: { duration: 1.6 } }}>
      {children}
    </motion.g>
  );
}

/**
 * The family seen from afar, going about the day as small figures of warm light: carrying jars between the
 * river and the homes, herding a few sheep, grinding grain at a quern, children running between the houses.
 * `homes` [[x, y]…] and `river` [x, y] anchor the paths; `pasture` [x0, x1, y] is where the herders walk;
 * `near`/`far` are the ground's nearest and farthest y (people shrink with distance). `mode: "gather"` brings
 * everyone in around `fires` [[x, y]…] instead; `carry: "sheaf"` swaps the water jars for bundles of grain.
 */
export function Villagers({ cfg }) {
  const uid = useUid('vl');
  const { reduced } = useStage();
  const { homes = [[600, 700]], river = [940, 700], pasture, fires = [], count = 24, size = 34, seed = 31, mode = 'day', carry = 'jar', near = 760, far = 680 } = cfg;
  const people = useMemo(() => cast({ homes, river, pasture, count, size, seed, near, far }), [homes, river, pasture, count, size, seed, near, far]);
  const drawn = useMemo(() => [...people].sort((p, q) => p.ym - q.ym), [people]);
  const ring = useMemo(() => huddle({ fires, count, size, seed, near, far }), [fires, count, size, seed, near, far]);
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}h`}>
          <stop offset="0" stopColor="#fff3d6" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff3d6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor="#ffcf7a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ff9a40" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}f`} x="-30%" y="-15%" width="160%" height="130%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      <AnimatePresence initial={false}>
        <motion.g key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.6 }}>
          {mode === 'gather'
            ? ring.map((q, k) =>
                q.fire ? (
                  <g key={k} transform={`translate(${q.x} ${q.y})`}>
                    <ellipse cx="0" cy="-6" rx="34" ry="16" fill={`url(#${uid}g)`} className="breathe" style={{ '--t': '1.5s' }} />
                    <g transform="translate(0 -2) scale(0.13)">
                      <path d={FLAME_PATH} fill="#ffad45" className="flame" />
                    </g>
                  </g>
                ) : (
                  <g key={k} transform={`translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) scale(${q.s.toFixed(3)})`}>
                    <Light uid={uid} c={q.c} sit={q.sit} />
                  </g>
                ),
              )
            : drawn.map((p) => (
                <g key={p.i}>
                  {p.role === 'herd' &&
                    [0.7, 1.3, 1.9].map((lag, k) => (
                      <Walker key={k} p={{ ...p, a: [p.a[0], p.a[1] + (k - 1) * 4], b: [p.b[0], p.b[1] + (k - 1) * 4] }} lag={lag} still={reduced}>
                        <g transform={`scale(${(p.s * 4).toFixed(3)})`}>
                          <Sheep />
                        </g>
                      </Walker>
                    ))}
                  <Walker p={p} still={reduced}>
                    <g transform={`scale(${p.s.toFixed(3)})`}>
                      {p.role === 'grind' ? (
                        <>
                          <ellipse cx="26" cy="-3" rx="14" ry="5" fill="#7a736a" />
                          <ellipse cx="26" cy="-8" rx="9" ry="3.5" fill="#9a9184" />
                          <motion.g animate={reduced ? undefined : { rotate: [-4, 12, -4] }} transition={{ duration: p.t, repeat: Infinity, ease: 'easeInOut' }}>
                            <rect x="-90" y="-90" width="180" height="180" fill="none" />
                            <Light uid={uid} c={p.c} sit />
                          </motion.g>
                        </>
                      ) : (
                        <g className="bob" style={{ animationDuration: p.role === 'child' ? '0.32s' : '0.9s' }}>
                          <Light uid={uid} c={p.c} />
                          {p.role === 'water' &&
                            (carry === 'sheaf' ? (
                              <g>
                                <path d="M2,-92 L22,-108 L26,-103 L7,-87 Z" fill="#d9b866" />
                                <path d="M11,-100 L15,-96" stroke="#8a6a34" strokeWidth="2.4" />
                              </g>
                            ) : (
                              <g>
                                <path d="M-7,-88 C-10,-96 -7,-105 0,-105 C7,-105 10,-96 7,-88 Z" fill="#9a6a4a" />
                                <ellipse cx="0" cy="-105" rx="4.5" ry="1.6" fill="#5e3e28" />
                              </g>
                            ))}
                        </g>
                      )}
                    </g>
                  </Walker>
                </g>
              ))}
        </motion.g>
      </AnimatePresence>
    </Svg>
  );
}

// ── Summer heat ──────────────────────────────────────────

/** Summer heat over the valley floor: pale wavering bands low over the fields (give the layer a little blur). */
export function Haze({ cfg }) {
  const uid = useUid('hz');
  const { y = 660, h = 70, color = '#fff1cc', bands = 7, seed = 4 } = cfg;
  const items = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: bands }, (_, i) => {
      const by = y - h / 2 + (i / Math.max(1, bands - 1)) * h + (r() - 0.5) * 8;
      const x0 = -500 + r() * 300;
      const ph = r() * 6;
      const pts = [];
      for (let x = x0; x <= 2100; x += 40) pts.push(`${x},${(by + Math.sin(x * 0.02 + ph) * 2.5).toFixed(1)}`);
      return { d: `M${pts.join(' L')}`, t: 2.2 + r() * 1.8, dl: r() * 2, o: 0.12 + r() * 0.14, w: 2 + r() * 3 };
    });
  }, [y, h, bands, seed]);
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1={y - h * 1.6} x2="0" y2={y + h} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="0.6" stopColor={color} stopOpacity="0.3" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="-800" y={y - h * 1.6} width="3200" height={h * 2.6} fill={`url(#${uid}g)`} />
      {items.map((b, i) => (
        <g key={i} className="shimmer" style={{ '--t': `${b.t.toFixed(2)}s`, animationDelay: `${-b.dl.toFixed(2)}s` }}>
          <path d={b.d} stroke={color} strokeOpacity={b.o} strokeWidth={b.w} fill="none" />
        </g>
      ))}
    </Svg>
  );
}
