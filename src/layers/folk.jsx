// The people of the towns, seen from afar as figures of light: crowds in their squares (listening,
// mocking, mourning, kneeling), the five righteous doing good and then rising away, and families
// walking off along new paths to settle other valleys.
import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Svg, useStage, useUid } from '../components/stageKit.jsx';
import { BODY_PATH, FLAME_PATH, lerp, rng, sampleCurve, smoothPath } from '../lib/geo.js';
import { Walker } from './life.jsx';

const TOWN_LIGHTS = ['#ffe8c4', '#ffe2b8', '#fbe0c0', '#f6dcc0', '#ffe6cc'];

function Defs({ uid }) {
  return (
    <defs>
      <radialGradient id={`${uid}h`}>
        <stop offset="0" stopColor="#fff3d6" stopOpacity="0.5" />
        <stop offset="1" stopColor="#fff3d6" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${uid}g`}>
        <stop offset="0" stopColor="#ffbe6a" stopOpacity="0.85" />
        <stop offset="1" stopColor="#ff8a3a" stopOpacity="0" />
      </radialGradient>
      <filter id={`${uid}f`} x="-30%" y="-15%" width="160%" height="130%">
        <feGaussianBlur stdDeviation="1.6" />
      </filter>
    </defs>
  );
}

const POSE = { kneel: 'scale(1.18 0.6)', sit: 'scale(1.25 0.58)', bow: 'scale(1 0.9)' };

/** One distant figure of light at `p` {x, y, s}. */
function Lit({ uid, p, c = '#ffe8c4', glow = 1, pose }) {
  return (
    <g transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${p.s.toFixed(3)})`}>
      <ellipse cx="0" cy="-46" rx="46" ry="66" fill={`url(#${uid}h)`} opacity={glow} />
      <g transform={POSE[pose]} filter={`url(#${uid}f)`}>
        <path d={BODY_PATH} fill={c} />
        <circle cx="0" cy="-77" r="9.5" fill="#fffaf0" />
      </g>
    </g>
  );
}

// ── Townspeople ──────────────────────────────────────────

function townsfolk({ x0, x1, y0, y1, walkers, listeners, mockers, focus, faithful, fires, size, seed, pace = 1 }) {
  const r = rng(seed);
  const at = (y) => (size * lerp(0.75, 1.1, (y - y0) / Math.max(1, y1 - y0))) / 100;
  const out = { walkers: [], listeners: [], mockers: [], faithful: [], fires: [] };
  for (let i = 0; i < walkers; i++) {
    const y = lerp(y0, y1, r());
    const xa = lerp(x0, x1, r());
    const xb = Math.min(x1, Math.max(x0, xa + (r() < 0.5 ? -1 : 1) * (200 + r() * 300)));
    out.walkers.push({ i, a: [xa, y], b: [xb, y + (r() - 0.5) * 12], t: (10 + r() * 8) * pace, d: r() * 3, s: at(y), c: TOWN_LIGHTS[Math.floor(r() * 5)] });
  }
  for (let i = 0; i < listeners; i++) {
    const a = Math.PI * (0.15 + 0.7 * ((i * 0.618) % 1));
    const rad = 46 + (i % 3) * 22 + r() * 10;
    const y = focus[1] + 18 + Math.sin(a) * rad * 0.35;
    out.listeners.push({ i, x: focus[0] + Math.cos(a) * rad * 1.4, y, s: at(y), sit: i % 3 === 1 });
  }
  for (let i = 0; i < mockers; i++) {
    const y = focus[1] + 26 + (r() - 0.5) * 16;
    out.mockers.push({ i, x: focus[0] + 150 + i * 22 + (r() - 0.5) * 10, y, s: at(y), d: r() });
  }
  for (let i = 0; i < faithful; i++) {
    const y = lerp(y0, y1, 0.3 + r() * 0.5);
    out.faithful.push({ i, x: i % 2 ? x1 - 30 - r() * 60 : x0 + 30 + r() * 60, y, s: at(y) });
  }
  fires.forEach(([fx, fy], k) => {
    const group = Array.from({ length: 6 }, (_, j) => {
      const a = (j / 6) * Math.PI * 2 + r() * 0.5;
      const y = fy + Math.sin(a) * 9;
      return { x: fx + Math.cos(a) * 26, y, s: at(y), d: r() };
    }).sort((p, q) => p.y - q.y);
    out.fires.push({ k, x: fx, y: fy, group });
  });
  return out;
}

/**
 * Townspeople as figures of light seen from a distance. Walkers cross the ground band (`x0`–`x1`,
 * `y0`–`y1`); `listeners` gather in front of `focus` [x, y], a little brighter; `mockers` stand beside
 * them, flickering. `mode: "mourn"` draws everyone close around `focus`, still and bowed; `mode: "kneel"`
 * kneels them in rows facing it. `dim` (0–1) lowers every light but the `faithful`, steady white figures
 * kneeling at the edges; `fires` [[x, y]…] gathers restless, flickering groups around fires. `pace` below 1
 * hurries the walkers (generations streaming through a square in a time-lapse).
 */
export function Throng({ cfg }) {
  const uid = useUid('th');
  const { reduced } = useStage();
  const { x0 = 300, x1 = 1300, y0 = 690, y1 = 760, walkers = 16, listeners = 0, mockers = 0, focus = [800, 700], mode = 'market', dim = 0, faithful = 0, fires = [], size = 34, seed = 61, pace = 1 } = cfg;
  const folk = useMemo(() => townsfolk({ x0, x1, y0, y1, walkers, listeners, mockers, focus, faithful, fires, size, seed, pace }), [x0, x1, y0, y1, walkers, listeners, mockers, focus, faithful, fires, size, seed, pace]);
  // the whole town drawn together around `focus`, to mourn or to kneel
  const gathered = useMemo(
    () =>
      [...folk.walkers, ...folk.listeners].map((p, j) => {
        const row = Math.floor(j / 9);
        const col = (j % 9) - 4 + (row % 2) * 0.5;
        const y = focus[1] + 34 + row * 22;
        return { i: j, x: focus[0] + col * (mode === 'kneel' ? 46 : 34), y, s: (size * lerp(0.75, 1.1, (y - y0) / Math.max(1, y1 - y0))) / 100 };
      }),
    [folk, focus, mode, size, y0, y1],
  );
  const light = 1 - dim * 0.75;
  return (
    <Svg>
      <Defs uid={uid} />
      <AnimatePresence initial={false}>
        <motion.g key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.8 }}>
          {mode === 'market' ? (
            <>
              {folk.walkers.map((p) => (
                <motion.g key={`w${p.i}`} initial={{ opacity: 0 }} animate={{ opacity: light * 0.8 }} transition={{ duration: 1.6 }}>
                  <Walker p={p} still={reduced}>
                    <g className="bob" style={{ animationDuration: '0.9s' }}>
                      <Lit uid={uid} p={{ x: 0, y: 0, s: p.s }} c={p.c} glow={0.6} />
                    </g>
                  </Walker>
                </motion.g>
              ))}
              {folk.listeners.map((p) => (
                <motion.g key={`l${p.i}`} initial={{ opacity: 0 }} animate={{ opacity: Math.min(1, light + 0.25) }} transition={{ duration: 1.6 }}>
                  <Lit uid={uid} p={p} c="#fff1d6" glow={1} pose={p.sit ? 'sit' : undefined} />
                </motion.g>
              ))}
              {folk.mockers.map((p) => (
                <motion.g key={`m${p.i}`} initial={{ opacity: 0 }} animate={{ opacity: light, x: reduced ? 0 : [0, -5, 4, 0] }} transition={{ opacity: { duration: 1.6 }, x: { duration: 1.4 + p.d, repeat: Infinity } }}>
                  <g className="flicker" style={{ animationDelay: `${-p.d * 2}s` }}>
                    <Lit uid={uid} p={p} c="#ffc890" glow={0.45} />
                  </g>
                </motion.g>
              ))}
            </>
          ) : (
            gathered.map((p) => <Lit key={p.i} uid={uid} p={p} c="#f2dcc0" glow={light * 0.6} pose={mode === 'kneel' ? 'kneel' : 'bow'} />)
          )}
        </motion.g>
      </AnimatePresence>
      {folk.fires.map((f) => (
        <g key={`f${f.k}`} opacity={light}>
          {f.group
            .filter((p) => p.y < f.y)
            .map((p, j) => (
              <g key={j} className="flicker" style={{ animationDelay: `${-p.d * 2}s` }}>
                <Lit uid={uid} p={p} c="#ffc890" glow={0.5} />
              </g>
            ))}
          <g transform={`translate(${f.x} ${f.y})`}>
            <ellipse cx="0" cy="-6" rx="40" ry="18" fill={`url(#${uid}g)`} className="breathe" style={{ '--t': '1.4s' }} />
            <g transform="translate(0 -2) scale(0.15)">
              <path d={FLAME_PATH} fill="#ffad45" className="flame" />
            </g>
          </g>
          {f.group
            .filter((p) => p.y >= f.y)
            .map((p, j) => (
              <g key={`n${j}`} className="flicker" style={{ animationDelay: `${-p.d * 2}s` }}>
                <Lit uid={uid} p={p} c="#ffc890" glow={0.5} />
              </g>
            ))}
        </g>
      ))}
      {folk.faithful.map((p) => (
        <Lit key={`k${p.i}`} uid={uid} p={p} c="#fffaf0" glow={1} pose="kneel" />
      ))}
    </Svg>
  );
}

// ── The five righteous ───────────────────────────────────

/**
 * Righteous people of light, each doing good in a different part of the town: `items` [{x, y, deed}]
 * with deed "teach" (children seated before them), "carry" (sharing a load), "pray" (alone, kneeling),
 * "share" (handing bread to another), "tend" (kneeling by someone lying ill). `gone` (count) lets the
 * first ones rise gently and fade, the way Adam's light rose; those they were with grow dimmer.
 */
export function Deeds({ cfg }) {
  const uid = useUid('dd');
  const { items = [], gone = 0, size = 40 } = cfg;
  const at = { x: 0, y: 0, s: 1 };
  return (
    <Svg>
      <Defs uid={uid} />
      {items.map((it, i) => {
        const left = i < gone;
        const others = { opacity: left ? 0.5 : 1, transition: 'opacity 2s' };
        return (
          <g key={i} transform={`translate(${it.x} ${it.y}) scale(${size / 100})`}>
            {it.deed === 'teach' && (
              <g style={others}>
                {[-56, -26, 26, 56].map((dx, k) => (
                  <g key={k} transform={`translate(${dx} ${22 + (k % 2) * 6}) scale(0.55)`}>
                    <Lit uid={uid} p={at} c="#ffe8c4" glow={0.8} pose="sit" />
                  </g>
                ))}
              </g>
            )}
            {it.deed === 'carry' && (
              <g style={others}>
                <g transform="translate(64 0)">
                  <Lit uid={uid} p={at} c="#ffe2b8" glow={0.8} />
                </g>
                <rect x="-6" y="-66" width="76" height="14" rx="7" fill="#7a5a3a" />
              </g>
            )}
            {it.deed === 'share' && (
              <g style={others}>
                <g transform="translate(58 0)">
                  <Lit uid={uid} p={at} c="#ffe2b8" glow={0.8} />
                </g>
                <motion.ellipse cx="16" cy="-46" rx="9" ry="6" fill="#c9a26a" animate={{ cx: [16, 40, 40, 16] }} transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.4, 0.8, 1] }} />
              </g>
            )}
            {it.deed === 'tend' && (
              <g style={others} transform="translate(46 4)">
                <ellipse cx="0" cy="-8" rx="52" ry="12" fill={`url(#${uid}h)`} opacity="0.5" />
                <g transform="rotate(-90) scale(0.8)" filter={`url(#${uid}f)`}>
                  <path d={BODY_PATH} fill="#e8d2b4" opacity="0.8" />
                  <circle cx="0" cy="-77" r="9.5" fill="#f6ead4" />
                </g>
              </g>
            )}
            <motion.g initial={false} animate={left ? { y: -80, opacity: 0 } : { y: 0, opacity: 1 }} transition={{ duration: 3.4, ease: 'easeInOut' }}>
              <Lit uid={uid} p={at} c="#fffaf0" glow={1.2} pose={it.deed === 'pray' || it.deed === 'tend' ? 'kneel' : undefined} />
            </motion.g>
            {left &&
              Array.from({ length: 10 }, (_, k) => (
                <motion.circle key={k} cx={(k - 4.5) * 4} cy={-40} r="2" fill="#fff6dc" initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 0.9, 0], y: -160 - k * 8 }} transition={{ duration: 3.6, delay: k * 0.22 }} />
              ))}
          </g>
        );
      })}
    </Svg>
  );
}

// ── Journeys into new valleys ────────────────────────────

/**
 * Families leaving for new valleys: paths brushed into the hills (`paths`: each a list of [x, y] from
 * near to far) and small lights walking each one away like a string of lanterns, smaller as they go.
 */
export function Journeys({ cfg }) {
  const uid = useUid('jy');
  const { reduced } = useStage();
  const { paths = [], lights = 5, dur = 10, color = '#ffe9c4', track = '#d9c49a' } = cfg;
  const routes = useMemo(() => paths.map((pts) => ({ d: smoothPath(pts), pts: sampleCurve(pts, 24) })), [paths]);
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor={color} stopOpacity="0.9" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {routes.map((rt, i) => (
        <motion.path key={`p${i}`} d={rt.d} stroke={track} strokeOpacity="0.55" strokeWidth="5" strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.6, delay: i * 0.6, ease: 'easeInOut' }} />
      ))}
      {!reduced &&
        routes.flatMap((rt, i) =>
          Array.from({ length: lights }, (_, k) => {
            const delay = 1.2 + i * 0.6 + (k * dur) / lights;
            return (
              <motion.g
                key={`${i}-${k}`}
                initial={{ x: rt.pts[0][0], y: rt.pts[0][1], opacity: 0, scale: 1 }}
                animate={{ x: rt.pts.map((q) => q[0]), y: rt.pts.map((q) => q[1]), opacity: [0, 1, 1, 0], scale: [1, 0.35] }}
                transition={{ duration: dur, delay, repeat: Infinity, ease: 'linear', opacity: { duration: dur, delay, repeat: Infinity, times: [0, 0.08, 0.85, 1] } }}
              >
                <circle r="11" fill={`url(#${uid}g)`} />
                <circle r="3" fill="#fffaf0" />
              </motion.g>
            );
          }),
        )}
    </Svg>
  );
}

// ── Those who believed ───────────────────────────────────

/**
 * The few who believed: steady white lights gathered beside a prophet at (`x`, `y`) on `side` 1 (right)
 * or -1 (left). Raising `count` brings one more in at a time. `tools` puts plain wooden tools in a few
 * hands; `pose: "kneel"` kneels them; `walk` [dx, dy] moves the whole group over `walkDur` ms (up a
 * ramp, down onto new earth), `fade: "out"` letting them vanish as they arrive (in at the ark's door).
 */
export function Followers({ cfg }) {
  const uid = useUid('fw');
  const { x = 800, y = 700, count = 3, size = 34, side = 1, gap = 30, tools = false, pose, walk, walkDur = 6000, walkDelay = 0, fade } = cfg;
  const spots = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const col = Math.floor(i / 2);
        const row = i % 2;
        return { i, x: x + side * (44 + col * gap + row * gap * 0.45), y: y + row * 12 - (col % 2) * 4, s: (size * (1 + row * 0.06)) / 100, tool: tools && i % 3 === 1 };
      }),
    [x, y, side, gap, size, tools],
  );
  return (
    <Svg>
      <Defs uid={uid} />
      <motion.g initial={{ x: 0, y: 0, opacity: 1 }} animate={walk ? { x: walk[0], y: walk[1], opacity: fade === 'out' ? [1, 1, 0] : 1 } : { x: 0, y: 0, opacity: 1 }} transition={{ duration: walkDur / 1000, delay: walkDelay / 1000, ease: 'easeInOut' }}>
        <AnimatePresence>
          {spots.slice(0, count).map((p) => (
            <motion.g key={p.i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.4 }}>
              {p.tool && <path d={`M${p.x + 8 * p.s},${p.y} L${p.x + 14 * p.s},${p.y - 92 * p.s}`} stroke="#6a4a2c" strokeWidth={10 * p.s} strokeLinecap="round" />}
              <Lit uid={uid} p={p} c="#fffaf0" glow={0.9} pose={pose} />
            </motion.g>
          ))}
        </AnimatePresence>
      </motion.g>
    </Svg>
  );
}

// ── The refusal ──────────────────────────────────────────

const LETTERS = 'بتثجحخسشصضطظعغفقكمنهي';

/** A person of dim light who will not hear: cloak drawn over the head, hands raised to the ears. */
function Covered({ x, y, k, color, uid, lean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${k}) rotate(${lean * 3})`}>
      <ellipse cx="0" cy="-48" rx="58" ry="80" fill={`url(#${uid}h)`} opacity="0.45" />
      <g filter={`url(#${uid}f)`}>
        <path d={BODY_PATH} fill={color} opacity="0.7" />
        <circle cx="0" cy="-77" r="9.5" fill={color} opacity="0.75" />
      </g>
      <path d="M-16,-48 C-22,-70 -17,-93 0,-95 C17,-93 22,-70 16,-48 C10,-57 -10,-57 -16,-48 Z" fill="#4e4036" opacity="0.88" />
      <path d="M-12,-56 Q-25,-68 -12,-80" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M12,-56 Q25,-68 12,-80" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.85" />
    </g>
  );
}

/**
 * Close up: `xs` people of dim light on the line `y`, `h` tall, covering their heads and stopping their
 * ears. Letters of the call stream at them from `from` (an x off to one side) and break apart against
 * them like water against stone, the pieces scattering back. The letters are single shapes, never words.
 */
export function Refusal({ cfg }) {
  const uid = useUid('rf');
  const { reduced } = useStage();
  const { xs = [760, 980, 1200], y = 700, h = 240, color = '#cdbca4', count = 16, from = 200, ink = '#ffe6a6', seed = 7 } = cfg;
  const k = h / 100;
  const cycle = 2.4;
  const glyphs = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => {
      const j = i % xs.length;
      // the side the call comes from: the pieces scatter back that way
      const side = from > xs[j] ? 1 : -1;
      const ty = y - h * (0.6 + r() * 0.28);
      return {
        ch: LETTERS[Math.floor(r() * LETTERS.length)],
        x0: from + (r() - 0.5) * 140,
        y0: ty + (r() - 0.5) * 160,
        tx: xs[j] + side * 30 * k,
        ty,
        d: (i / count) * 4 + r() * 0.6,
        t: 1.8 + r() * 0.6,
        bits: Array.from({ length: 5 }, () => ({ dx: side * (24 + r() * 80), dy: (r() - 0.5) * 130, rot: (r() - 0.5) * 240 })),
      };
    });
  }, [xs, y, h, k, count, from, seed]);
  return (
    <Svg>
      <Defs uid={uid} />
      {xs.map((x, i) => (
        <Covered key={i} x={x} y={y} k={k} color={color} uid={uid} lean={i % 2 ? 1 : -1} />
      ))}
      {!reduced &&
        glyphs.map((g, i) => (
          <g key={i}>
            <motion.text fontFamily="Amiri, serif" fontSize={34} fill={ink} textAnchor="middle" initial={{ x: g.x0, y: g.y0, opacity: 0 }} animate={{ x: [g.x0, g.tx], y: [g.y0, g.ty], opacity: [0, 1, 1, 0] }} transition={{ duration: g.t, delay: g.d, repeat: Infinity, repeatDelay: cycle, ease: 'easeIn' }}>
              {g.ch}
            </motion.text>
            {g.bits.map((b, m) => (
              <motion.path key={m} d="M-5,0 L5,-2" stroke={ink} strokeWidth="3" strokeLinecap="round" initial={{ x: g.tx, y: g.ty - 10, opacity: 0, rotate: 0 }} animate={{ x: [g.tx, g.tx + b.dx], y: [g.ty - 10, g.ty - 10 + b.dy], opacity: [0, 0.9, 0], rotate: b.rot }} transition={{ duration: 0.9, delay: g.d + g.t, repeat: Infinity, repeatDelay: g.t + cycle - 0.9, ease: 'easeOut' }} />
            ))}
          </g>
        ))}
    </Svg>
  );
}

// ── Mockery ──────────────────────────────────────────────

/** Loose, careless strokes rising from the mockers at `from` [[x, y]…] and blowing away on the `wind` [dx, dy]. */
export function Scribbles({ cfg }) {
  const { reduced } = useStage();
  const { from = [], per = 3, wind = [200, -130], color = '#4a3a2c', size = 28, seed = 13 } = cfg;
  const marks = useMemo(() => {
    const r = rng(seed);
    const n = () => ((r() - 0.5) * size).toFixed(1);
    return from.flatMap(([x, y], j) =>
      Array.from({ length: per }, (_, i) => ({
        x: x + (r() - 0.5) * 30,
        y: y - 20 - r() * 20,
        d: `M0,0 c${n()},${n()} ${n()},${n()} ${(size * 0.8).toFixed(1)},${n()} s${n()},${n()} ${(size * 0.7).toFixed(1)},${n()}`,
        t: 3 + r() * 1.5,
        dl: j * 0.4 + i * 1.1 + r() * 0.5,
      })),
    );
  }, [from, per, size, seed]);
  if (reduced) return null;
  return (
    <Svg>
      {marks.map((m, i) => (
        <motion.g key={i} initial={{ x: m.x, y: m.y, opacity: 0 }} animate={{ x: [m.x, m.x + wind[0] * 0.3, m.x + wind[0]], y: [m.y, m.y - 30, m.y + wind[1]], opacity: [0, 0.8, 0] }} transition={{ duration: m.t, delay: m.dl, repeat: Infinity, repeatDelay: 1.6, ease: 'easeOut' }}>
          <motion.path d={m.d} stroke={color} strokeWidth="2.6" fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1] }} transition={{ duration: m.t, delay: m.dl, repeat: Infinity, repeatDelay: 1.6, times: [0, 0.3, 1] }} />
        </motion.g>
      ))}
    </Svg>
  );
}

// ── New growth ───────────────────────────────────────────

/** Small flowers and grasses painted in along `paths` behind people walking, over `dur` ms after `delay`. */
export function Blooms({ cfg }) {
  const { paths = [], dur = 6000, delay = 0, per = 12, colors = ['#f4d4e2', '#fff2b4', '#ffffff', '#e8b4ca'], seed = 29 } = cfg;
  const blooms = useMemo(() => {
    const r = rng(seed);
    return paths.flatMap((path) =>
      sampleCurve(path, per).map(([px, py], i, all) => ({ x: px + (r() - 0.5) * 46, y: py + (r() - 0.5) * 16, t: i / Math.max(1, all.length - 1), flower: r() < 0.55, c: colors[Math.floor(r() * colors.length)], s: 0.7 + r() * 0.6 })),
    );
  }, [paths, per, colors, seed]);
  return (
    <Svg>
      {blooms.map((b, i) => (
        <g key={i} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`}>
          <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.15, 1], opacity: 1 }} transition={{ duration: 0.9, delay: (delay + b.t * dur) / 1000 }} style={{ originX: 0.5, originY: 1 }}>
            <g transform={`scale(${b.s.toFixed(2)})`}>
              {[-6, 0, 6].map((dx) => (
                <path key={dx} d={`M${dx * 0.4},0 Q${dx},-8 ${dx * 1.4},-16`} stroke="#5e8a3a" strokeWidth="2" fill="none" strokeLinecap="round" />
              ))}
              {b.flower && (
                <g transform="translate(0 -17)">
                  {[0, 72, 144, 216, 288].map((a) => (
                    <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 3.6} cy={Math.sin((a * Math.PI) / 180) * 3.6} r="3" fill={b.c} />
                  ))}
                  <circle r="2" fill="#e8b440" />
                </g>
              )}
            </g>
          </motion.g>
        </g>
      ))}
    </Svg>
  );
}

// ── Scorn ────────────────────────────────────────────────

/**
 * A crowd's scorn as sharp, jagged strokes of red-amber ink: they rise from the ring `from` [rx, ry] all
 * round `center` [x, y] and swirl inward like a storm, but the ring `clear` [rx, ry] keeps them from ever
 * touching whoever stands at the centre. Strokes, never words.
 */
export function Jeers({ cfg }) {
  const { reduced } = useStage();
  const { center = [800, 480], from = [720, 300], clear = [140, 120], count = 28, colors = ['#c8402a', '#e0782e', '#a8301e', '#d65a2a'], size = 46, period = 7, seed = 23 } = cfg;
  const marks = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => {
      let d = 'M0,0';
      for (let k = 0, n = 4 + Math.floor(r() * 3); k < n; k++) d += ` l${(size * (0.3 + r() * 0.3)).toFixed(1)},${((k % 2 ? 1 : -1) * size * (0.25 + r() * 0.4)).toFixed(1)}`;
      return { d, a0: r() * Math.PI * 2, turn: (0.9 + r() * 0.9) * (r() < 0.75 ? 1 : -1), inner: 1.12 + r() * 0.5, dl: r() * period, w: 2 + r() * 2.5, c: colors[i % colors.length], t: period * (0.7 + r() * 0.5) };
    });
  }, [count, size, seed, period, colors]);
  const ring = (m, u) => {
    const a = m.a0 + m.turn * u;
    const k = 1 - u * 0.8;
    const rx = clear[0] * m.inner + (from[0] - clear[0] * m.inner) * k;
    const ry = clear[1] * m.inner + (from[1] - clear[1] * m.inner) * k;
    return [center[0] + Math.cos(a) * rx, center[1] + Math.sin(a) * ry, (a * 180) / Math.PI + 90];
  };
  const steps = [0, 0.2, 0.4, 0.6, 0.8, 1];
  return (
    <Svg>
      {marks.map((m, i) => {
        const path = steps.map((u) => ring(m, u));
        if (reduced) {
          const [x, y, rot] = ring(m, 1);
          return <path key={i} d={m.d} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`} stroke={m.c} strokeWidth={m.w} fill="none" strokeLinejoin="miter" opacity="0.55" />;
        }
        return (
          <motion.g key={i} initial={{ x: path[0][0], y: path[0][1], rotate: path[0][2], opacity: 0 }} animate={{ x: path.map((p) => p[0]), y: path.map((p) => p[1]), rotate: path.map((p) => p[2]), opacity: [0, 0.9, 0.95, 0.9, 0.7, 0] }} transition={{ duration: m.t, delay: m.dl, repeat: Infinity, repeatDelay: 0.4, ease: 'linear' }}>
            <path d={m.d} stroke={m.c} strokeWidth={m.w} fill="none" strokeLinejoin="miter" strokeLinecap="square" />
          </motion.g>
        );
      })}
    </Svg>
  );
}
