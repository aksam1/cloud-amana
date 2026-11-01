// Beings, always symbolic: people as soft figures of light seen from afar (no faces, no detail),
// angels as columns of white-gold light, jinn as smokeless fire, Iblis as a dark smouldering form.
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Svg, useStage, useUid } from '../components/stageKit.jsx';
import { BODY_PATH, FLAME_PATH, figurePoints, lerp, rng } from '../lib/geo.js';

const POSES = {
  stand: { sy: 1, sx: 1, rot: 0 },
  walk: { sy: 1, sx: 1, rot: 0 },
  kneel: { sy: 0.6, sx: 1.18, rot: 0 },
  kneelLow: { sy: 0.5, sx: 1.22, rot: 0 },
  sit: { sy: 0.56, sx: 1.32, rot: 0 },
  bow: { sy: 0.78, sx: 1.05, rot: 0 },
  lean: { sy: 0.96, sx: 1, rot: 9 },
  hunch: { sy: 0.58, sx: 1.12, rot: 12 },
  gone: { sy: 1, sx: 1, rot: 0 },
};

// Work is painted, not lit: the wooden tool keeps its own colour beside the light of the person.
const WOOD = '#5a3b22';
const HOE_T = [0, 0.46, 0.58, 0.7, 1]; // raise slowly, strike fast, rest, lift again
// An invisible box centred on the pivot: motion turns SVG groups about their bounding-box centre.
const pivotBox = (r) => <rect x={-r} y={-r} width={r * 2} height={r * 2} fill="none" />;
// One arm from the shoulder, so a raised or outstretched arm can move between positions.
const ARMS = { down: 'M6,-60 Q10,-42 12,-24', raise: 'M6,-60 Q18,-84 28,-108', reach: 'M6,-60 Q30,-68 56,-72' };

/** Keyframes for walking a path of [x, y, scale?] points at an even pace: times follow the distance walked. */
function walkFrames(path) {
  const dist = [0];
  for (let i = 1; i < path.length; i++) dist.push(dist[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const total = dist.at(-1) || 1;
  return { x: path.map((p) => p[0]), y: path.map((p) => p[1]), s: path.map((p) => p[2] ?? 1), times: dist.map((d) => d / total) };
}

/**
 * A wooden tool swung from the shoulder: a hoe into the soil (`heavy` lifts it higher and drives it
 * harder), or with a short `len` and a level `up`/`down` arc, a chisel against stone.
 */
function Hoe({ tempo = 1.8, heavy, light, still, at, len = 98, up: u, down: dn, dust = true }) {
  const up = u ?? (heavy ? -126 : -104);
  const down = dn ?? (heavy ? 42 : 36);
  const loop = { duration: tempo, repeat: Infinity, times: HOE_T, ease: ['easeInOut', 'easeIn', 'linear', 'easeInOut'] };
  const rad = (down * Math.PI) / 180;
  const tip = [at[0] + Math.cos(rad) * len, Math.max(0, at[1] + Math.sin(rad) * len)];
  return (
    <>
      <g transform={`translate(${at[0]} ${at[1]})`}>
        <motion.g animate={{ rotate: still ? -30 : [up, up - 6, down, down, up] }} transition={still ? { duration: 0 } : loop}>
          {pivotBox(len + 16)}
          <line x1="16" y1="0" x2={len} y2="0" stroke={WOOD} strokeWidth="3.4" strokeLinecap="round" />
          <path d={`M${len - 4},-2 L${len + 6},-12 L${len + 11},-6 L${len + 2},4 Z`} fill="#3f3226" />
          <path d="M0,0 L30,0" stroke={light} strokeWidth="5" strokeLinecap="round" fill="none" />
        </motion.g>
      </g>
      {!still && dust && (
        <g transform={`translate(${tip[0].toFixed(1)} ${tip[1].toFixed(1)})`}>
          {[-10, 0, 12].map((dx, i) => (
            <motion.circle key={i} cx={dx} cy={-4 - i * 3} r={heavy ? 7 : 5} fill="#c4a27a" initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: [0, 0, 0.7, 0], scale: [0.3, 0.3, 1, 1.9] }} transition={{ duration: tempo, repeat: Infinity, times: [0, 0.57, 0.62, 1] }} />
          ))}
        </g>
      )}
    </>
  );
}

/**
 * A figure of light. `color` shifts smoothly (Qabil: amber → red → ash), `dim` fades the glow,
 * `dark` turns it into the smouldering silhouette used for Iblis. `act: "hoe"` sets it to work the
 * soil (`tempo` seconds a stroke, `heavy` for a harder swing), the body bending with each stroke;
 * `act: "chisel"` taps a short tool at stone in front of it. `arm` ("raise", "reach", "down") moves one
 * arm between calling, reaching out and resting (`raise: true` is the same as `arm: "raise"`). `path`
 * [[x, y, scale?]…] walks the figure along a route over `moveDur` ms after `moveDelay` ms, shrinking
 * or growing with the scale so it can walk away from the camera. `unsteady` lets the light waver (grief);
 * `fadeDelay` holds a fade (`pose: "gone"`) back by that many ms.
 */
export function Figure({ cfg }) {
  const uid = useUid('fig');
  const { reduced } = useStage();
  const { x = 800, y = 640, h = 120, color = '#fff1cf', core = '#ffffff', glow = 1, pose = 'stand', dim = 0, face = 1, dark = false, rim = '#ff7a2a', flicker, embers, smoke, hands, leaves, eyes, moveDur = 3000, act } = cfg;
  const P = POSES[pose] || POSES.stand;
  const t = { duration: 1.8, ease: 'easeInOut' };
  const hoeing = (act === 'hoe' || act === 'chisel') && !reduced;
  const k = act === 'chisel' ? 0.4 : cfg.heavy ? 1.4 : 1;
  const light = core === '#ffffff' ? '#fffaf0' : core;
  const arm = cfg.arm ?? (cfg.raise ? 'raise' : null);
  const walk = useMemo(() => (cfg.path ? walkFrames(cfg.path) : null), [cfg.path]);
  const mv = { duration: moveDur / 1000, delay: (cfg.moveDelay ?? 0) / 1000, ease: walk ? 'linear' : 'easeInOut', times: walk?.times };

  if (pose === 'lie') {
    return (
      <Svg>
        <g transform={`translate(${x} ${y}) scale(${h / 100})`}>
          <ellipse cx="0" cy="2" rx="78" ry="13" fill="#000" opacity="0.4" />
          <path d="M-52,0 C-48,-14 -20,-16 0,-14 C24,-16 50,-12 54,0 Z" fill="#0c0908" opacity="0.92" />
        </g>
      </Svg>
    );
  }

  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}a`}>
          <motion.stop offset="0" initial={false} animate={{ stopColor: color }} transition={t} stopOpacity="0.9" />
          <motion.stop offset="0.45" initial={false} animate={{ stopColor: color }} transition={t} stopOpacity="0.32" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1">
          <motion.stop offset="0" initial={false} animate={{ stopColor: core }} transition={t} />
          <motion.stop offset="0.42" initial={false} animate={{ stopColor: color }} transition={t} />
          <motion.stop offset="1" initial={false} animate={{ stopColor: color }} transition={t} stopOpacity="0.12" />
        </linearGradient>
        <filter id={`${uid}f`} x="-60%" y="-30%" width="220%" height="160%">
          <feGaussianBlur stdDeviation="1.7" />
        </filter>
      </defs>
      <motion.g initial={{ x: walk?.x[0] ?? cfg.from?.x ?? x, y: walk?.y[0] ?? cfg.from?.y ?? y, opacity: 0 }} animate={{ x: walk?.x ?? x, y: walk?.y ?? y, opacity: pose === 'gone' ? 0 : 1 }} transition={{ x: mv, y: mv, opacity: { duration: 2.2, delay: (cfg.fadeDelay ?? 0) / 1000 } }}>
       <motion.g initial={{ scale: walk?.s[0] ?? 1 }} animate={{ scale: walk?.s ?? 1 }} transition={mv}>
        <g transform={`scale(${h / 100})`}>
          {/* centres the walking scale on the feet */}
          {pivotBox(220)}
          {/* dim lives on this group; flicker on the inner one — a CSS opacity animation would override motion's opacity on the same element */}
          <motion.g initial={false} animate={{ opacity: 1 - dim * 0.78 }} transition={{ duration: 2.2 }}>
           <g className={flicker ? 'flicker' : cfg.unsteady ? 'breathe' : undefined} style={cfg.unsteady && !flicker ? { '--t': '1.3s' } : undefined}>
            {!dark && <ellipse cx="0" cy="-48" rx="66" ry="84" fill={`url(#${uid}a)`} opacity={0.6 * glow} />}
            {dark && <ellipse cx="0" cy="-46" rx="58" ry="78" fill={rim} fillOpacity="0.14" className="breathe" style={{ '--t': '2s' }} />}
            {/* a working body bends about the feet in step with the tool */}
            <motion.g initial={false} animate={hoeing ? { rotate: [-3 * k, -6 * k, 10 * k, 10 * k, -3 * k] } : { rotate: 0 }} transition={hoeing ? { duration: cfg.tempo ?? 1.8, repeat: Infinity, times: HOE_T, ease: 'easeInOut' } : t}>
             {act && pivotBox(220)}
             <motion.g style={{ originX: 0.5, originY: 1 }} initial={false} animate={{ scaleY: P.sy, scaleX: P.sx, rotate: P.rot * face }} transition={t}>
              <g className={pose === 'walk' ? 'bob' : undefined}>
                <g filter={`url(#${uid}f)`}>
                  <path d={BODY_PATH} fill={dark ? '#130c0a' : `url(#${uid}b)`} />
                  <circle cx="0" cy="-77" r="9.5" fill={dark ? '#130c0a' : light} />
                </g>
                {dark && (
                  <g className="flicker">
                    <path d={BODY_PATH} fill="none" stroke={rim} strokeWidth="1.6" opacity="0.85" />
                    <circle cx="0" cy="-77" r="9.5" fill="none" stroke={rim} strokeWidth="1.4" opacity="0.85" />
                    {/* transform on the wrapper: .flame's CSS transform would replace an SVG transform attribute on the same element */}
                    {[[-12, -58], [12, -58], [0, -86], [-6, -84], [7, -82]].map(([fx, fy], i) => (
                      <g key={i} transform={`translate(${fx} ${fy}) scale(${0.1 + (i % 2) * 0.04})`}>
                        <path d={FLAME_PATH} fill={rim} className="flame" style={{ animationDelay: `${-i * 0.23}s` }} />
                      </g>
                    ))}
                    <path d="M-12,-46 L12,-40 M-12,-40 L12,-46" stroke="#2a1410" strokeWidth="3" strokeLinecap="round" />
                  </g>
                )}
                {eyes && (
                  <g>
                    <circle cx="-3.6" cy="-78" r="3.6" fill="#ff8a3a" opacity="0.35" />
                    <circle cx="3.6" cy="-78" r="3.6" fill="#ff8a3a" opacity="0.35" />
                    <circle cx="-3.6" cy="-78" r="1.3" fill="#ffe2b0" />
                    <circle cx="3.6" cy="-78" r="1.3" fill="#ffe2b0" />
                  </g>
                )}
                {leaves && (
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.95 }} transition={{ duration: 1.6, delay: 0.8 }}>
                    <path d="M-15,-30 C-22,-44 -4,-52 2,-40 C6,-30 -6,-22 -15,-30 Z" fill="#2f5a34" />
                    <path d="M14,-34 C22,-48 2,-54 -2,-42 C-5,-32 6,-26 14,-34 Z" fill="#3b6b3e" />
                    <path d="M-6,-14 C-14,-26 6,-32 10,-20 C12,-10 0,-6 -6,-14 Z" fill="#284d2d" />
                  </motion.g>
                )}
              </g>
             </motion.g>
             {act === 'hoe' && <Hoe tempo={cfg.tempo} heavy={cfg.heavy} light={light} still={reduced} at={[6 * P.sx, -60 * P.sy]} />}
             {act === 'chisel' && <Hoe tempo={cfg.tempo ?? 0.8} light={light} still={reduced} at={[6 * P.sx, -60 * P.sy]} len={44} up={-48} down={6} dust={false} />}
             {arm && <motion.path initial={false} animate={{ d: ARMS[arm] || ARMS.raise, opacity: arm === 'down' ? 0 : 1 }} transition={{ duration: cfg.armDur ?? 2.4, ease: 'easeInOut' }} stroke={light} strokeWidth="5" strokeLinecap="round" fill="none" filter={`url(#${uid}f)`} />}
            </motion.g>
            {hands && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.8 }} filter={`url(#${uid}f)`}>
                <path d="M-9,-58 Q-20,-46 -26,-30" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M9,-58 Q20,-46 26,-30" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
              </motion.g>
            )}
           </g>
          </motion.g>
          {embers && (
            <g>
              {Array.from({ length: 10 }, (_, i) => (
                <circle key={i} cx={(i - 4.5) * 5} cy={-16 - (i % 4) * 16} r={1.5} fill={i % 3 ? '#ff5a24' : '#ffb04a'} className="rise-fade" style={{ '--t': `${1.4 + (i % 4) * 0.45}s`, animationDelay: `${i * 0.21}s` }} />
              ))}
            </g>
          )}
          {smoke && (
            <g>
              {Array.from({ length: 7 }, (_, i) => (
                <circle key={i} cx={i % 2 ? 11 : -11} cy={-60} r={5.5} fill="#1d1716" className="smoke" style={{ '--t': `${3.6 + (i % 3)}s`, '--dx': `${i % 2 ? 16 : -12}px`, animationDelay: `${i * 0.55}s` }} />
              ))}
            </g>
          )}
        </g>
       </motion.g>
      </motion.g>
    </Svg>
  );
}

/** Many small figures of light in widening rings (a family, a people). */
export function Crowd({ cfg }) {
  const uid = useUid('crowd');
  // `glow` scales the light around each person (a crowd whose lights grow steadier as they listen)
  const { cx = 800, cy = 660, rings = 3, per = [8, 13, 18], rx = 170, ry = 44, gapX = 130, gapY = 36, size = 34, colors = ['#fff1d2', '#ffe6bd', '#f8ecd6', '#ffdcae', '#fbe3c6'], bow = false, seed = 8, spill, gap, glow = 1 } = cfg;
  const people = useMemo(() => {
    const r = rng(seed);
    const out = [];
    for (let k = 0; k < rings; k++) {
      const n = per[k] ?? per.at(-1);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + k * 0.45 + (r() - 0.5) * 0.15;
        const px = cx + Math.cos(a) * (rx + k * gapX);
        const py = cy + Math.sin(a) * (ry + k * gapY);
        if (gap && px > gap[0] && px < gap[1] && py < cy) continue;
        const front = Math.sin(a);
        out.push({ x: px, y: py, s: size * (0.86 + front * 0.14) * (1 + k * 0.06), c: colors[Math.floor(r() * colors.length)], o: 0.62 + (front + 1) * 0.18, d: k * 0.3 + r() * 0.35 });
      }
    }
    if (spill) {
      for (let i = 0; i < spill.count; i++) {
        out.push({ x: lerp(spill.x0, spill.x1, r()), y: lerp(spill.y0, spill.y1, r()), s: spill.size * (0.7 + r() * 0.5), c: colors[Math.floor(r() * colors.length)], o: 0.45 + r() * 0.4, d: 1 + r() });
      }
    }
    return out.sort((a, b) => a.y - b.y);
  }, [cx, cy, rings, per, rx, ry, gapX, gapY, size, colors, seed, spill, gap]);
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}a`}>
          <stop offset="0" stopColor="#fff3d6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff3d6" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}f`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.3" />
        </filter>
      </defs>
      {people.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y}) scale(${p.s / 100})`} opacity={p.o}>
          <motion.ellipse cx="0" cy="-46" rx="52" ry="70" fill={`url(#${uid}a)`} initial={false} animate={{ opacity: glow }} transition={{ duration: 2 }} />
          <motion.g style={{ originX: 0.5, originY: 1 }} initial={false} animate={{ scaleY: bow ? 0.84 : 1 }} transition={{ delay: bow ? p.d : 0, duration: 1.4, ease: 'easeInOut' }} filter={`url(#${uid}f)`}>
            <path d={BODY_PATH} fill={p.c} />
            <circle cx="0" cy="-77" r="9.5" fill="#fffaf0" />
          </motion.g>
        </g>
      ))}
    </Svg>
  );
}

function angelLayout(cfg) {
  const { mode = 'ranks', rows = 4, per = 14, y = 560, rowGap = 70, x0 = -150, x1 = 1750, gap, edges = 380, cx = 800, cy = 560, rx = 420, ry = 120, rings = 2, count = 22, seed = 5 } = cfg;
  const r = rng(seed);
  const out = [];
  if (mode === 'ring') {
    for (let k = 0; k < rings; k++) {
      const n = count + k * 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + k * 0.2;
        const front = Math.sin(a);
        const x = cx + Math.cos(a) * (rx + k * 150);
        out.push({ x, y: cy + Math.sin(a) * (ry + k * 46), s: (0.55 + (front + 1) * 0.22) * (1 + k * 0.12), o: 0.45 + (front + 1) * 0.27, dir: x < cx ? 1 : -1, wave: k * 0.18 + (1 - Math.abs(Math.cos(a))) * 0.25 });
      }
    }
  } else {
    for (let k = 0; k < rows; k++) {
      const s = 0.38 + k * (0.65 / Math.max(1, rows - 1));
      for (let i = 0; i < per; i++) {
        const x = lerp(x0, x1, (i + 0.5 + (r() - 0.5) * 0.3) / per);
        if (mode === 'edges' && x > edges && x < 1600 - edges) continue;
        if (gap && x > gap[0] && x < gap[1]) continue;
        out.push({ x, y: y + k * rowGap, s, o: 0.4 + k * 0.17, dir: x < 800 ? 1 : -1, wave: Math.abs(x - 800) / 1600 + k * 0.08 });
      }
    }
  }
  return out.sort((a, b) => a.y - b.y);
}

/** Angels as tall columns of white-gold light with the faintest suggestion of wings. */
export function Angels({ cfg }) {
  const uid = useUid('ang');
  const { bow = false, ripple = 0, dim = 0 } = cfg;
  const items = useMemo(() => angelLayout(cfg), [cfg.mode, cfg.rows, cfg.per, cfg.y, cfg.rowGap, cfg.x0, cfg.x1, cfg.gap, cfg.edges, cfg.cx, cfg.cy, cfg.rx, cfg.ry, cfg.rings, cfg.count, cfg.seed]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#ffe9b6" />
          <stop offset="1" stopColor="#e2bb68" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor="#fff2cc" stopOpacity="0.6" />
          <stop offset="1" stopColor="#fff2cc" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6dc" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fff6dc" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.g initial={false} animate={{ opacity: 1 - dim }} transition={{ duration: 2 }}>
        {items.map((a, i) => (
          <g key={i} transform={`translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) scale(${a.s.toFixed(3)})`} opacity={a.o}>
            <motion.g style={{ originX: 0.5, originY: 1 }} initial={false} animate={{ scaleY: bow ? 0.3 : 1, skewX: bow ? -18 * a.dir : 0 }} transition={{ delay: bow ? a.wave * 1.1 : 0, duration: 1.3, ease: [0.45, 0, 0.2, 1] }}>
              <ellipse cx="0" cy="-95" rx="40" ry="120" fill={`url(#${uid}g)`} />
              <path d="M-5,-150 C-34,-176 -44,-128 -30,-96 M5,-150 C34,-176 44,-128 30,-96" stroke={`url(#${uid}w)`} strokeWidth="2.2" fill="none" />
              <rect x="-7" y="-196" width="14" height="196" rx="7" fill={`url(#${uid}c)`} />
            </motion.g>
            {ripple > 0 && <motion.ellipse key={ripple} cx="0" cy="-100" rx="30" ry="110" fill="#ffffff" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.85, 0] }} transition={{ duration: 1.4, delay: a.wave * 1.6 }} />}
          </g>
        ))}
      </motion.g>
    </Svg>
  );
}

/** Smokeless fire (55:15): a flame that can split into many flickering forms spreading over the land. */
export function Flame({ cfg }) {
  const uid = useUid('flm');
  const { x = 800, y = 640, h = 180, core = '#4d7dff', edge = '#ff8a2a', mid = '#ffc15a', spread, seed = 6 } = cfg;
  const kids = useMemo(() => {
    if (!spread) return [];
    const r = rng(seed);
    const [ax0, ay0, ax1, ay1] = spread.area || [-100, 520, 1700, 720];
    return Array.from({ length: spread.count || 24 }, (_, i) => ({ tx: lerp(ax0, ax1, r()), ty: lerp(ay0, ay1, r()), s: 0.18 + r() * 0.3, d: (i / (spread.count || 24)) * 2.6 + r() * 0.6, f: r() }));
  }, [spread, seed]);
  const flame = (k = 0) => (
    <g className="flame" style={{ animationDelay: `${-k * 0.37}s`, animationDuration: `${0.7 + (k % 5) * 0.12}s` }}>
      <path d={FLAME_PATH} fill={edge} opacity="0.55" filter={`url(#${uid}b)`} transform="scale(1.25)" />
      <path d={FLAME_PATH} fill={edge} />
      <path d={FLAME_PATH} fill={mid} transform="translate(0 -2) scale(0.66)" />
      <ellipse cx="0" cy="-15" rx="8" ry="15" fill={core} opacity="0.95" />
    </g>
  );
  return (
    <Svg>
      <defs>
        <filter id={`${uid}b`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <g transform={`translate(${x} ${y}) scale(${h / 100})`}>{flame(0)}</g>
      {kids.map((k, i) => (
        <motion.g key={i} initial={{ x, y, scale: 0, opacity: 0 }} animate={{ x: k.tx, y: k.ty, scale: k.s * (h / 100), opacity: 1 }} transition={{ duration: 2.8, delay: k.d, ease: [0.2, 0.7, 0.3, 1] }}>
          {flame(i + 1)}
        </motion.g>
      ))}
    </Svg>
  );
}

/** Shadows of jinn cities rising and crumbling in fast time-lapse. */
export function Cities({ cfg }) {
  const { y = 640, count = 12, seed = 31, cycle = true, color = '#1a0c08', glow = '#ff6a2a' } = cfg;
  const towers = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => {
      const x = -150 + r() * 1900;
      const w = 22 + r() * 46;
      const h = 60 + r() * 170;
      const top = r() < 0.5 ? `C${x + w * 0.1},${y - h - w * 0.7} ${x + w * 0.9},${y - h - w * 0.7} ${x + w},${y - h}` : `L${x + w / 2},${y - h - w} L${x + w},${y - h}`;
      return { d: `M${x},${y} L${x},${y - h} ${top} L${x + w},${y} Z`, d0: r() * 3, t: 2.6 + r() * 1.8 };
    });
  }, [y, count, seed]);
  return (
    <Svg>
      {towers.map((t, i) => (
        <motion.g key={i} style={{ originX: 0.5, originY: 1 }} initial={{ scaleY: 0, opacity: 0 }} animate={cycle ? { scaleY: [0, 1, 1, 0.15], opacity: [0, 1, 1, 0] } : { scaleY: 0, opacity: 0 }} transition={{ duration: t.t, delay: t.d0, repeat: cycle ? Infinity : 0, repeatDelay: 0.6, times: [0, 0.35, 0.7, 1] }}>
          <path d={t.d} fill={color} />
          <path d={t.d} fill="none" stroke={glow} strokeOpacity="0.5" strokeWidth="1.5" />
        </motion.g>
      ))}
    </Svg>
  );
}

/** Soil from every land (red, white, black, gold) gathering into a form; then a breath of light. */
export function Clay({ cfg }) {
  const uid = useUid('clay');
  const { x = 800, y = 650, h = 230, form = false, breath = false, count = 260, seed = 12 } = cfg;
  const grains = useMemo(() => {
    const r = rng(seed);
    const targets = figurePoints(count, seed);
    const soils = ['#8c3b26', '#e8dcc4', '#2b2420', '#c8963e'];
    return targets.map(([tx, ty], i) => {
      const a = r() * Math.PI * 2;
      const d = 500 + r() * 700;
      return { sx: x + Math.cos(a) * d, sy: y - 100 + Math.sin(a) * d * 0.55, tx: x + (tx * h) / 100, ty: y + (ty * h) / 100, c: soils[i % 4], r: 2 + r() * 3.4, dl: r() * 1.6 };
    });
  }, [x, y, h, count, seed]);
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor="#fff8e2" stopOpacity="0.95" />
          <stop offset="0.4" stopColor="#ffe3a0" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffe3a0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff9ea" />
          <stop offset="1" stopColor="#ffd88a" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {grains.map((g, i) => (
        <motion.circle key={i} r={g.r} fill={g.c} initial={{ cx: g.sx, cy: g.sy, opacity: 0 }} animate={form ? { cx: g.tx, cy: g.ty, opacity: breath ? 0.45 : 1 } : { cx: g.sx, cy: g.sy, opacity: 0.8 }} transition={{ duration: form ? 3.6 : 1, delay: form ? g.dl : 0, ease: [0.3, 0, 0.2, 1] }} />
      ))}
      <motion.rect x={x - 3} y={-600} width={6} height={y - h * 0.8 + 600} fill={`url(#${uid}b)`} style={{ originX: 0.5, originY: 0 }} initial={{ scaleY: 0, opacity: 0 }} animate={breath ? { scaleY: [0, 1, 1], opacity: [0, 1, 0] } : { scaleY: 0, opacity: 0 }} transition={{ duration: 3, times: [0, 0.45, 1] }} />
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: breath ? 1 : 0 }} transition={{ duration: 3, delay: breath ? 1.3 : 0 }}>
        <ellipse cx={x} cy={y - h * 0.47} rx={h * 0.6} ry={h * 0.78} fill={`url(#${uid}g)`} />
        <g transform={`translate(${x} ${y}) scale(${h / 100})`} opacity="0.9">
          <path d={BODY_PATH} fill="#fff6dc" style={{ filter: 'blur(1.5px)' }} />
          <circle cx="0" cy="-77" r="9.5" fill="#fffaf0" style={{ filter: 'blur(1.5px)' }} />
        </g>
      </motion.g>
    </Svg>
  );
}

const CROW = {
  body: 'M-20,-18 C-12,-31 10,-33 21,-23 C29,-17 31,-9 25,-5 C13,1 -9,0 -21,-6 Z',
  tail: 'M19,-17 L42,-11 L40,-4 L22,-8 Z',
  beak: 'M-29,-29 L-43,-25 L-29,-22 Z',
  wing: 'M-10,-24 C2,-31 18,-27 27,-15 C14,-17 0,-17 -10,-20 Z',
  spread: 'M-4,-22 C-12,-62 18,-86 52,-80 C34,-64 26,-44 14,-22 Z',
};

/** A crow drawn in crisp ink so it stands apart from the soft painting (5:31). */
export function Crow({ cfg }) {
  const { x = 900, y = 668, act = 'glide', s = 1.4 } = cfg;
  const flying = act === 'glide' || act === 'fly';
  const pos =
    act === 'glide'
      ? { x: [x + 620, x + 200, x], y: [y - 420, y - 120, y], scale: [s * 0.8, s, s] }
      : act === 'fly'
        ? { x: [x, x - 380, x - 900], y: [y, y - 200, y - 480], scale: [s, s * 0.8, s * 0.4] }
        : { x, y, scale: s };
  const dirt = act === 'dig' || act === 'bury';
  return (
    <Svg>
      <motion.ellipse cx={x - 44} cy={y + 2} rx={24} ry={6} fill="#120d09" initial={{ opacity: 0 }} animate={{ opacity: act === 'dig' ? 0.9 : 0 }} transition={{ duration: 1.5 }} />
      <motion.path d={`M${x - 70},${y + 2} C${x - 60},${y - 14} ${x - 28},${y - 14} ${x - 18},${y + 2} Z`} fill="#4a3a2a" style={{ originX: 0.5, originY: 1 }} initial={{ scaleY: 0 }} animate={{ scaleY: act === 'bury' || act === 'fly' ? 1 : 0 }} transition={{ duration: 2.2 }} />
      <motion.g initial={act === 'glide' ? { x: x + 620, y: y - 420, scale: s * 0.8 } : { x, y, scale: s }} animate={pos} transition={{ duration: flying ? 4.2 : 0.6, ease: act === 'glide' ? [0.2, 0.5, 0.3, 1] : 'easeIn' }}>
        <motion.g
          style={{ originX: 0.6, originY: 1 }}
          animate={dirt ? { rotate: [0, 24, 0, 22, 0] } : { rotate: 0 }}
          transition={dirt ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
        >
          <path d={CROW.tail} fill="#0b0a0c" />
          <path d={CROW.body} fill="#0b0a0c" />
          <circle cx="-23" cy="-26" r="8.5" fill="#0b0a0c" />
          <path d={CROW.beak} fill="#0b0a0c" />
          <circle cx="-25" cy="-28" r="1.3" fill="#c9c4b8" />
          <path d="M-8,-14 C2,-10 14,-10 22,-14 M-2,-20 C6,-17 14,-17 20,-20" stroke="#3a4152" strokeWidth="0.9" fill="none" />
          {!flying && <path d={CROW.wing} fill="#16161c" stroke="#3a4152" strokeWidth="0.8" />}
          {flying && (
            <motion.path d={CROW.spread} fill="#0b0a0c" stroke="#3a4152" strokeWidth="0.8" style={{ originX: 0.15, originY: 1 }} animate={{ rotate: act === 'fly' ? [0, 70, 0] : [0, 18, 0] }} transition={{ duration: act === 'fly' ? 0.42 : 1.6, repeat: Infinity, ease: 'easeInOut' }} />
          )}
          {!flying && <path d="M-4,-2 L-6,7 M4,-2 L5,7" stroke="#0b0a0c" strokeWidth="1.6" />}
        </motion.g>
      </motion.g>
      {dirt &&
        Array.from({ length: 10 }, (_, i) => (
          <motion.circle
            key={i}
            r={1.6 + (i % 3)}
            fill="#5a4632"
            initial={{ cx: x - 44, cy: y, opacity: 0 }}
            animate={{ cx: [x - 44, x - 44 + (i % 2 ? 1 : -1) * (14 + i * 4)], cy: [y, y - 26 - (i % 4) * 8, y + 2], opacity: [0, 1, 0] }}
            transition={{ duration: 0.9, delay: (i % 5) * 0.18, repeat: Infinity, repeatDelay: 0.3 }}
          />
        ))}
    </Svg>
  );
}

/** Two burning points in the dark — Iblis turning back to speak his vow. */
export function Eyes({ cfg }) {
  const uid = useUid('eye');
  const { x = 800, y = 420, gap = 54, size = 9 } = cfg;
  return (
    <Svg>
      <defs>
        <radialGradient id={uid}>
          <stop offset="0" stopColor="#ffe6b8" />
          <stop offset="0.25" stopColor="#ff7a2a" stopOpacity="0.8" />
          <stop offset="1" stopColor="#8c1d0e" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[-1, 1].map((d) => (
        <g key={d} className="flicker" style={{ animationDelay: `${d * 0.3}s` }}>
          <circle cx={x + (d * gap) / 2} cy={y} r={size * 6} fill={`url(#${uid})`} />
          <circle cx={x + (d * gap) / 2} cy={y} r={size * 0.7} fill="#fff4dc" />
        </g>
      ))}
    </Svg>
  );
}
