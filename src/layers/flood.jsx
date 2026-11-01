// The flood of Nuh: the ark (built rib by rib, planked, pitched, its ramp lowered), water that
// rises and recedes with the ark riding it, springs bursting from the ground, waves like mountains,
// and the clay oven where water welled up instead of fire. No one is shown struggling: lights
// simply go out beneath the water.
import { useEffect, useMemo, useState } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import { Svg, useStage, useUid } from '../components/stageKit.jsx';
import { lerp, mixColor, rng } from '../lib/geo.js';

// ── The ark ──────────────────────────────────────────────

// Side view, bow to the right, keel centre at the origin. The hull's bottom and sheer line as functions
// of x, so ribs and planks can follow them.
const bottomAt = (x) => (x > 330 ? -235 * ((x - 330) / 210) ** 1.6 : x < -330 ? -215 * ((-330 - x) / 190) ** 1.6 : 0);
const sheerAt = (x) => -175 - (x < 0 ? 40 * (x / 520) ** 2 : 60 * (x / 540) ** 2);
const HULL = 'M-520,-215 C-500,-120 -440,-30 -330,0 L330,0 C440,-30 505,-130 540,-235 C380,-190 200,-175 0,-175 C-200,-175 -380,-185 -520,-215 Z';
const HOUSE = 'M-330,-176 L-330,-262 L300,-262 L300,-176 Z';
const ROOF = 'M-352,-260 L-15,-306 L322,-260 Z';
const RIB_X = Array.from({ length: 15 }, (_, i) => -490 + i * 70);
const STRAKES = [1, 2, 3, 4, 5, 6].map((k) => {
  const pts = [];
  for (let x = -515; x <= 535; x += 35) pts.push(`${x},${lerp(bottomAt(x), sheerAt(x), k / 7).toFixed(1)}`);
  return `M${pts.join(' L')}`;
});
const DOOR = { x: -40, w: 84, top: -158, bottom: -62 };
const RAMP = `M${DOOR.x - DOOR.w / 2},${DOOR.bottom} L${DOOR.x + DOOR.w / 2},${DOOR.bottom} L${DOOR.x + 120},70 L${DOOR.x - 150},70 Z`;
const TIMBER = '#7a5634';
const PITCH = '#2b2017';

/**
 * The ship itself. `built`: 1 keel and ribs (a giant's skeleton), 2 planked, 3 pitched with its house on
 * deck. `ramp` lowers the boarding ramp toward the viewer (`"lower"`: shown coming down as the scene opens); `lit` warms the open door from inside;
 * `sketch` draws only ink outlines (the plan shown to Nuh), over `dur` ms; `tone` [colour, amount] tints
 * it for dusk or storm.
 */
function ArkBody({ uid, built = 3, ramp = false, rampDur = 3200, lit = 0, sketch = false, dur = 5000, tone, fresh = true }) {
  const tint = (c) => (tone ? mixColor(c, tone[0], tone[1]) : c);
  const wood = tint(TIMBER);
  const dark = tint('#4a321e');
  const pale = tint('#a27c50');
  const grow = (i, n, d) => (fresh ? { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: d, delay: (i / n) * d * 1.4, ease: 'easeInOut' } } : {});

  if (sketch) {
    const ink = '#f0dca8';
    const lines = [HULL, ...RIB_X.map((x) => `M${x},${bottomAt(x).toFixed(1)} L${x},${sheerAt(x).toFixed(1)}`), ...STRAKES, HOUSE, ROOF];
    return (
      <g fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {lines.map((d, i) => (
          <motion.path key={i} d={d} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.6 }} transition={{ duration: (dur / 1000) * 0.45, delay: (i / lines.length) * (dur / 1000) * 0.55, ease: 'easeInOut' }} />
        ))}
      </g>
    );
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}h`} x1="0" y1="-240" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={pale} />
          <stop offset="0.5" stopColor={wood} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <motion.rect x="-560" width="1140" initial={fresh && built >= 2 ? { y: 0, height: 0 } : false} animate={{ y: built >= 2 ? -320 : 0, height: built >= 2 ? 330 : 0 }} transition={{ duration: 3.2, ease: 'easeInOut' }} />
        </clipPath>
        <radialGradient id={`${uid}d`} cx="0.5" cy="0.85" r="0.9">
          <stop offset="0" stopColor="#ffe6b0" />
          <stop offset="1" stopColor="#c9782e" />
        </radialGradient>
      </defs>
      {/* keel, stem and sternpost first, then the ribs rising out of the ground */}
      {built >= 1 && (
        <g fill="none" stroke={dark} strokeLinecap="round">
          <motion.path d="M-520,-215 C-500,-120 -440,-30 -330,0 L330,0 C440,-30 505,-130 540,-235" strokeWidth="16" {...grow(0, 1, 2.4)} />
          {RIB_X.map((x, i) => (
            <motion.path key={x} d={`M${x},${bottomAt(x).toFixed(1)} Q${x + 14},${((bottomAt(x) + sheerAt(x)) / 2).toFixed(1)} ${x},${sheerAt(x).toFixed(1)}`} strokeWidth="11" {...grow(i, RIB_X.length, 1.6)} />
          ))}
        </g>
      )}
      {built >= 2 && (
        <g clipPath={`url(#${uid}c)`}>
          <path d={HULL} fill={`url(#${uid}h)`} />
          {STRAKES.map((d) => (
            <path key={d} d={d} fill="none" stroke={dark} strokeOpacity="0.55" strokeWidth="2.4" />
          ))}
          {RIB_X.map((x) => (
            <path key={x} d={`M${x},${bottomAt(x).toFixed(1)} L${x},${sheerAt(x).toFixed(1)}`} stroke={dark} strokeOpacity="0.18" strokeWidth="3" />
          ))}
          <motion.path d={HULL} fill={PITCH} initial={{ opacity: 0 }} animate={{ opacity: built >= 3 ? 0.62 : 0 }} transition={{ duration: 3 }} />
          <motion.path d="M-470,-150 C-200,-120 200,-118 500,-170" fill="none" stroke="#e8c896" strokeWidth="5" strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: built >= 3 ? 0.18 : 0 }} transition={{ duration: 3 }} />
          <path d={HULL} fill="none" stroke={dark} strokeWidth="5" />
        </g>
      )}
      {built >= 3 && (
        <motion.g initial={fresh ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 2.4, delay: fresh ? 1.2 : 0 }}>
          <path d={HOUSE} fill={tint('#6a4a2c')} />
          {[-260, -170, -80, 30, 120, 210].map((x) => (
            <rect key={x} x={x} y={-236} width="26" height="20" fill={tint('#24180f')} />
          ))}
          <path d={ROOF} fill={tint('#3e2a1a')} />
          <path d="M-352,-260 L322,-260" stroke={tint('#24180f')} strokeWidth="4" />
          {/* the door: closed planks, or open on a warm interior once the ramp is down */}
          <rect x={DOOR.x - DOOR.w / 2} y={DOOR.top} width={DOOR.w} height={DOOR.bottom - DOOR.top} fill={ramp ? '#1a120c' : tint('#5a3e24')} />
          {ramp && lit > 0 && <rect x={DOOR.x - DOOR.w / 2} y={DOOR.top} width={DOOR.w} height={DOOR.bottom - DOOR.top} fill={`url(#${uid}d)`} opacity={lit} />}
          {!ramp && [0.25, 0.5, 0.75].map((u) => <path key={u} d={`M${DOOR.x - DOOR.w / 2 + DOOR.w * u},${DOOR.top} L${DOOR.x - DOOR.w / 2 + DOOR.w * u},${DOOR.bottom}`} stroke={tint('#3a2816')} strokeWidth="2" />)}
          {/* the ramp swings down from the door toward the viewer */}
          <motion.g style={{ originY: 0 }} initial={ramp === 'lower' ? { scaleY: 0, opacity: 0 } : false} animate={{ scaleY: ramp ? 1 : 0, opacity: ramp ? 1 : 0 }} transition={{ duration: rampDur / 1000, delay: ramp === 'lower' ? 1.2 : 0, ease: [0.45, 0, 0.3, 1] }}>
            <path d={RAMP} fill={tint('#8a6440')} />
            {[0.2, 0.4, 0.6, 0.8].map((t) => (
              <path key={t} d={`M${lerp(DOOR.x - DOOR.w / 2, DOOR.x - 150, t)},${lerp(DOOR.bottom, 70, t)} L${lerp(DOOR.x + DOOR.w / 2, DOOR.x + 120, t)},${lerp(DOOR.bottom, 70, t)}`} stroke={tint('#4a321e')} strokeWidth="3" />
            ))}
          </motion.g>
        </motion.g>
      )}
    </g>
  );
}

/** Standing on the ark: the deck in the foreground and its rail along the edge at `y`, the world beyond. */
function Deck({ y, tone }) {
  const tint = (c) => (tone ? mixColor(c, tone[0], tone[1]) : c);
  const posts = [];
  for (let x = -600; x <= 2200; x += 110) posts.push(x);
  return (
    <g>
      <path d={`M-700,${y} L2300,${y} L2300,1500 L-700,1500 Z`} fill={tint('#6a4a2e')} />
      {Array.from({ length: 16 }, (_, i) => {
        const bx = -700 + i * 200;
        return <path key={i} d={`M${800 + (bx - 800) * 0.45},${y} L${bx},1500`} stroke={tint('#3e2a18')} strokeOpacity="0.5" strokeWidth="3" />;
      })}
      {[0.12, 0.3, 0.55].map((t) => (
        <path key={t} d={`M-700,${y + t * 420} L2300,${y + t * 420}`} stroke={tint('#3e2a18')} strokeOpacity="0.3" strokeWidth="2" />
      ))}
      {posts.map((x) => (
        <rect key={x} x={x - 7} y={y - 70} width="14" height="72" fill={tint('#4a321e')} />
      ))}
      <rect x="-700" y={y - 78} width="3000" height="16" fill={tint('#5a3e24')} />
      <path d={`M-700,${y - 62} L2300,${y - 62}`} stroke={tint('#2e1e12')} strokeWidth="3" opacity="0.6" />
    </g>
  );
}

/**
 * The ark on land at `x`, keel on the ground line `y`, scale `s`. `bob` rocks it gently (afloat).
 * `haul` sends two believers carrying a timber to the hull and back, over and over. `view: "deck"`
 * stands on board instead, the rail along `y`.
 */
export function Ark({ cfg }) {
  const uid = useUid('ark');
  const { reduced } = useStage();
  const { x = 800, y = 700, s = 1, bob = false, haul = false } = cfg;
  const fresh = useState(() => (cfg.built ?? 3) < 3 || cfg.sketch)[0];
  if (cfg.view === 'deck') {
    return (
      <Svg>
        <Deck y={y} tone={cfg.tone} />
      </Svg>
    );
  }
  return (
    <Svg>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <motion.g animate={bob && !reduced ? { rotate: [-1.2, 1.4, -1.2], y: [0, -6, 0] } : { rotate: 0, y: 0 }} transition={bob ? { duration: 5.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 1.5 }}>
          <rect x="-700" y="-700" width="1400" height="1400" fill="none" />
          <ArkBody uid={uid} built={cfg.built} ramp={cfg.ramp} rampDur={cfg.rampDur} lit={cfg.lit} sketch={cfg.sketch} dur={cfg.dur} tone={cfg.tone} fresh={fresh} />
        </motion.g>
        {haul && !reduced && <Haulers />}
      </g>
    </Svg>
  );
}

/** Two small lights carrying a long timber from the left to the hull and walking back for the next. */
function Haulers() {
  const T = { duration: 9, repeat: Infinity, ease: 'easeInOut', times: [0, 0.45, 0.55, 1] };
  return (
    <motion.g initial={{ x: -1100, opacity: 0 }} animate={{ x: [-1100, -620, -620, -1100], opacity: [0, 1, 1, 0] }} transition={{ x: T, opacity: T }}>
      <g transform="translate(0 60)">
        <rect x="-70" y="-58" width="150" height="9" rx="3" fill="#6a4a2c" />
        {[-52, 60].map((px) => (
          <g key={px} transform={`translate(${px} 0)`} className="bob" style={{ animationDuration: '0.6s' }}>
            <ellipse cx="0" cy="-40" rx="26" ry="38" fill="#fff3d6" opacity="0.28" />
            <path d="M-9,0 C-8,-16 -7,-28 -5,-34 C-3,-38 3,-38 5,-34 C7,-28 8,-16 9,0 Z" fill="#fff1d6" />
            <circle cx="0" cy="-42" r="5.5" fill="#fffaf0" />
          </g>
        ))}
      </g>
    </motion.g>
  );
}

// ── Water that rises and falls ───────────────────────────

/**
 * Flood water whose surface moves to `level` (y) over `dur` ms, from `from` when it first appears. It
 * covers everything drawn beneath it: the plain, the town, the statues last of all. `calm` stills it to a
 * mirror for the morning after. `ark` {x, floor, s} rides the surface, and rests on `floor` (the ground,
 * or a mountaintop) once the water is lower than that.
 */
export function Flood({ cfg }) {
  const uid = useUid('fl');
  const { reduced } = useStage();
  const { level = 700, from, dur = 8000, delay = 0, x0 = -900, x1 = 2500, color = '#2e4a46', deep = '#0b1515', calm = false, ark } = cfg;
  const lv = useMotionValue(from ?? level);
  useEffect(() => {
    const c = animate(lv, level, { duration: reduced ? 0 : dur / 1000, delay: delay / 1000, ease: [0.45, 0, 0.35, 1] });
    return () => c.stop();
  }, [level, dur, delay, reduced, lv]);
  const amp = calm ? 1.2 : 7;
  const wave = useMemo(() => {
    const pts = [];
    for (let x = x0 - 160; x <= x1 + 160; x += 20) pts.push(`${x},${(Math.sin((x / 160) * Math.PI * 2) * amp).toFixed(1)}`);
    return `M${pts.join(' L')} L${x1 + 160},1800 L${x0 - 160},1800 Z`;
  }, [x0, x1, amp]);
  const foam = useMemo(() => {
    const r = rng(17);
    return Array.from({ length: calm ? 0 : 46 }, () => ({ x: x0 + r() * (x1 - x0), w: 30 + r() * 70, d: r() * 3, t: 2 + r() * 2 }));
  }, [x0, x1, calm]);
  const glints = useMemo(() => {
    const r = rng(23);
    return Array.from({ length: calm ? 40 : 0 }, () => ({ x: x0 + r() * (x1 - x0), y: 8 + r() * 260, w: 40 + r() * 160 }));
  }, [x0, x1, calm]);
  const surface = (
    <motion.g animate={reduced || calm ? { x: 0 } : { x: [0, -160] }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}>
      <path d={wave} fill={`url(#${uid}b)`} />
    </motion.g>
  );
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="700" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
      </defs>
      <motion.g style={{ y: lv }}>
        {surface}
        {foam.map((f, i) => (
          <motion.path key={i} d={`M${f.x},2 q${f.w / 2},-9 ${f.w},0`} stroke="#eef4f2" strokeWidth="3" fill="none" strokeLinecap="round" animate={reduced ? { opacity: 0.6 } : { opacity: [0, 0.85, 0], x: [0, -40] }} transition={{ duration: f.t, delay: f.d, repeat: Infinity }} />
        ))}
        {glints.map((g, i) => (
          <path key={i} d={`M${g.x},${g.y} l${g.w},0`} stroke="#ffffff" strokeOpacity="0.28" strokeWidth="2" />
        ))}
      </motion.g>
      {ark && <RidingArk uid={uid} lv={lv} ark={ark} reduced={reduced} />}
      {ark && (
        // the water in front of the hull, so the keel sits in it rather than on it
        <motion.g style={{ y: lv }} opacity="0.92">
          <rect x={ark.x - 640 * (ark.s ?? 1)} y="-2" width={1280 * (ark.s ?? 1)} height={90 * (ark.s ?? 1)} fill={color} />
          <path d={`M${ark.x - 640 * (ark.s ?? 1)},-2 L${ark.x + 640 * (ark.s ?? 1)},-2`} stroke="#eef4f2" strokeOpacity={calm ? 0.25 : 0.6} strokeWidth="3" />
        </motion.g>
      )}
    </Svg>
  );
}

function RidingArk({ uid, lv, ark, reduced }) {
  const { x, floor = 700, s = 1, draft = 60 } = ark;
  const ky = useTransform(lv, (v) => Math.min(v + draft * s, floor));
  const [afloat, setAfloat] = useState(() => lv.get() + draft * s < floor - 1);
  useMotionValueEvent(lv, 'change', (v) => {
    const now = v + draft * s < floor - 1;
    if (now !== afloat) setAfloat(now);
  });
  return (
    <motion.g style={{ y: ky }}>
      <g transform={`translate(${x} 0) scale(${s})`}>
        <motion.g animate={afloat && !reduced ? { rotate: [-1.4, 1.6, -1.4] } : { rotate: 0 }} transition={afloat ? { duration: 5, repeat: Infinity, ease: 'easeInOut' } : { duration: 2.5 }}>
          <rect x="-700" y="-700" width="1400" height="1400" fill="none" />
          <ArkBody uid={`${uid}a`} built={3} ramp={false} tone={ark.tone} fresh={false} />
        </motion.g>
      </g>
    </motion.g>
  );
}

// ── Springs bursting from the earth ──────────────────────

/** Water bursting up through cracks in the ground at `points`, `h` high, one after another every `stagger` ms. */
export function Springs({ cfg }) {
  const { reduced } = useStage();
  const { points = [], h = 170, stagger = 500, color = '#e6eef0' } = cfg;
  const springs = useMemo(() => {
    const r = rng(41);
    return points.map(([x, y], i) => ({
      x,
      y,
      d: (i * stagger) / 1000,
      cracks: Array.from({ length: 4 }, (_, k) => {
        const a = ((k / 4) * 2 + r() * 0.5) * Math.PI;
        const l = 30 + r() * 40;
        return `M${x},${y} l${(Math.cos(a) * l * 0.5).toFixed(1)},${(Math.sin(a) * l * 0.12).toFixed(1)} l${(Math.cos(a + 0.4) * l * 0.5).toFixed(1)},${(Math.sin(a + 0.4) * l * 0.12).toFixed(1)}`;
      }),
      jets: Array.from({ length: 5 }, (_, k) => ({ dx: (k - 2) * 12 + (r() - 0.5) * 10, hh: h * (0.6 + r() * 0.5) })),
      drops: Array.from({ length: 10 }, () => ({ dx: (r() - 0.5) * 120, up: h * (0.5 + r() * 0.6), t: 1 + r() * 0.8, dd: r() })),
    }));
  }, [points, h, stagger]);
  return (
    <Svg>
      {springs.map((sp, i) => (
        <g key={i}>
          {sp.cracks.map((d, k) => (
            <motion.path key={k} d={d} stroke="#1a1410" strokeWidth="3" fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: sp.d }} />
          ))}
          <motion.ellipse cx={sp.x} cy={sp.y} rx="46" ry="9" fill={color} initial={{ opacity: 0, scale: 0.2 }} animate={{ opacity: 0.8, scale: 1 }} transition={{ duration: 0.8, delay: sp.d + 0.4 }} />
          {sp.jets.map((j, k) => (
            <motion.path
              key={k}
              d={`M${sp.x + j.dx * 0.3},${sp.y} Q${sp.x + j.dx * 0.6},${sp.y - j.hh * 0.6} ${sp.x + j.dx},${sp.y - j.hh}`}
              stroke={color}
              strokeWidth={k === 2 ? 9 : 5}
              strokeLinecap="round"
              fill="none"
              style={{ originY: 1 }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={reduced ? { scaleY: 1, opacity: 0.8 } : { scaleY: [0, 1.05, 0.88, 1], opacity: 0.85 }}
              transition={{ duration: 1.4, delay: sp.d + 0.5 + k * 0.05, repeat: reduced ? 0 : Infinity, repeatType: 'mirror' }}
            />
          ))}
          {!reduced &&
            sp.drops.map((dr, k) => (
              <motion.circle key={k} r="3" fill={color} initial={{ cx: sp.x, cy: sp.y, opacity: 0 }} animate={{ cx: [sp.x, sp.x + dr.dx * 0.6, sp.x + dr.dx], cy: [sp.y - 10, sp.y - dr.up, sp.y + 10], opacity: [0, 0.9, 0] }} transition={{ duration: dr.t, delay: sp.d + 0.7 + dr.dd, repeat: Infinity, ease: 'easeOut' }} />
            ))}
        </g>
      ))}
    </Svg>
  );
}

// ── Waves like mountains ─────────────────────────────────

// One curling crest, 300 wide, its lip folding over to the right.
const CREST = 'M-150,0 C-110,-10 -60,-70 -10,-128 C24,-166 76,-180 112,-160 C138,-146 146,-118 130,-100 C118,-88 98,-92 94,-106 C90,-120 104,-128 112,-122 C96,-140 64,-136 46,-112 C20,-78 40,-30 150,0 Z';
const FINGERS = [
  [108, -158, 126, -176],
  [124, -146, 146, -158],
  [132, -128, 154, -132],
  [130, -110, 150, -104],
];

function Crest({ s, fill, light, foam }) {
  return (
    <g transform={`scale(${s})`}>
      <path d={CREST} fill={fill} />
      <path d="M-120,-14 C-70,-60 -30,-110 20,-150" stroke={light} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d="M-60,-30 C-20,-70 10,-110 50,-140" stroke={light} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.4" />
      <path d="M46,-112 C64,-136 96,-140 112,-122 C104,-128 90,-120 94,-106" stroke={foam} strokeWidth="5" fill="none" strokeLinecap="round" />
      {FINGERS.map(([a, b, c, d], i) => (
        <path key={i} d={`M${a},${b} Q${(a + c) / 2 + 6},${(b + d) / 2 - 6} ${c},${d}`} stroke={foam} strokeWidth="4" fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
}

/**
 * Rows of ink-wash waves on the line `y`, crests `amp` high, rolling to the left; the back rows paler,
 * the front dark with white foam. `surge` raises one great wave (`surgeScale` times a crest, its base
 * reaching `surgeY`) that fills the frame, rolls across and passes.
 */
export function Waves({ cfg }) {
  const { reduced } = useStage();
  const { y = 700, rows = 3, amp = 1, x0 = -900, x1 = 2500, color = '#16222e', light = '#4f708a', foam = '#f2f4ee', haze = '#5a6a7a', speed = 7, surge = false, surgeX = 1000, surgeY = 640, surgeScale = 3.6 } = cfg;
  const lines = useMemo(
    () =>
      Array.from({ length: rows }, (_, k) => {
        const t = rows === 1 ? 1 : k / (rows - 1);
        const s = amp * lerp(0.7, 1.25, t);
        const span = 300 * s * 1.15;
        const n = Math.ceil((x1 - x0 + span * 2) / span);
        return { k, s, span, n, y: y + lerp(-70, 40, t), fill: mixColor(color, haze, (1 - t) * 0.55), light: mixColor(light, haze, (1 - t) * 0.4), dur: speed * lerp(1.6, 1, t), off: (k * 97) % span };
      }),
    [rows, amp, x0, x1, y, color, light, haze, speed],
  );
  return (
    <Svg>
      {lines.map((l) => (
        <motion.g key={l.k} animate={reduced ? { x: 0 } : { x: [0, -l.span], y: [0, -10, 0] }} transition={{ x: { duration: l.dur, repeat: Infinity, ease: 'linear' }, y: { duration: l.dur / 2, repeat: Infinity, ease: 'easeInOut' } }}>
          {Array.from({ length: l.n }, (_, i) => (
            <g key={i} transform={`translate(${x0 - l.span + l.off + i * l.span} ${l.y})`}>
              <Crest s={l.s} fill={l.fill} light={l.light} foam={l.k === rows - 1 ? foam : mixColor(foam, haze, 0.4)} />
            </g>
          ))}
          <rect x={x0 - l.span} y={l.y - 2} width={x1 - x0 + l.span * 3} height="1400" fill={l.fill} />
        </motion.g>
      ))}
      {surge && (
        <motion.g initial={{ x: surgeX + 300, y: 1300 }} animate={reduced ? { x: surgeX, y: 1300 } : { x: [surgeX + 300, surgeX - 100, surgeX - 1200], y: [1300, surgeY, 1500] }} transition={{ duration: 6.5, times: [0, 0.42, 1], ease: 'easeInOut' }}>
          <Crest s={surgeScale} fill={color} light={light} foam={foam} />
          <rect x={-800} y={-2} width={1600} height="1400" fill={color} />
        </motion.g>
      )}
    </Svg>
  );
}

// ── The oven ─────────────────────────────────────────────

/** Close up in a simple home: a clay oven where, instead of fire, water wells up (after `well` seconds) and spills over the rim. */
export function Oven({ cfg }) {
  const uid = useUid('ov');
  const { vb } = useStage();
  // not `at`: that name is taken by the per-beat overrides every layer can have
  const { well: at = 1.6 } = cfg;
  const streams = ['M690,418 C682,470 676,560 668,660 C664,700 660,720 650,742', 'M760,428 C756,500 752,600 748,742', 'M842,428 C846,520 852,620 858,742', 'M910,418 C918,480 928,580 940,742'];
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}c`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#c9946a" />
          <stop offset="0.6" stopColor="#9a6a46" />
          <stop offset="1" stopColor="#5e3e26" />
        </radialGradient>
        <radialGradient id={`${uid}w`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#d8ecf2" />
          <stop offset="1" stopColor="#6e98aa" />
        </radialGradient>
      </defs>
      <rect x={vb[0] - 300} y={vb[1] - 300} width={vb[2] + 600} height={vb[3] + 600} fill="#5a4030" />
      {Array.from({ length: 9 }, (_, row) => (
        <path key={row} d={`M-400,${120 + row * 70} L2000,${116 + row * 70}`} stroke="#3e2c20" strokeOpacity="0.35" strokeWidth="3" />
      ))}
      <rect x="-400" y="740" width="2400" height="600" fill="#6e5440" />
      <ellipse cx="800" cy="748" rx="330" ry="34" fill="#2a1e16" opacity="0.4" />
      {/* the beehive oven, its mouth at the top and a stoking hole at the front */}
      <path d="M560,746 C548,600 600,452 680,412 L920,412 C1000,452 1052,600 1040,746 Z" fill={`url(#${uid}c)`} />
      {[0.3, 0.55, 0.8].map((t) => (
        <path key={t} d={`M${560 + t * 10},${746 - t * 300} C700,${740 - t * 300} 900,${740 - t * 300} ${1040 - t * 10},${746 - t * 300}`} stroke="#5e3e26" strokeOpacity="0.3" strokeWidth="4" fill="none" />
      ))}
      <path d="M740,746 L740,690 Q800,640 860,690 L860,746 Z" fill="#24160e" />
      <ellipse cx="800" cy="414" rx="126" ry="30" fill="#5e3e26" />
      <ellipse cx="800" cy="418" rx="110" ry="24" fill="#1a100a" />
      {/* cold embers where a fire should be */}
      <motion.ellipse cx="800" cy="420" rx="70" ry="12" fill="#c2401a" initial={{ opacity: 0.55 }} animate={{ opacity: [0.55, 0.3, 0] }} transition={{ duration: at, ease: 'easeIn' }} />
      {/* then water welling up and overflowing */}
      <motion.ellipse cx="800" cy="418" rx="110" ry="24" fill={`url(#${uid}w)`} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, delay: at }} />
      {Array.from({ length: 8 }, (_, i) => (
        <motion.circle key={i} cx={740 + i * 17} r={4 + (i % 3) * 2} fill="none" stroke="#eef6f8" strokeWidth="2" initial={{ cy: 420, opacity: 0 }} animate={{ cy: [420, 400 - (i % 4) * 6], opacity: [0, 1, 0] }} transition={{ duration: 0.9 + (i % 3) * 0.2, delay: at + 0.8 + i * 0.12, repeat: Infinity, repeatDelay: 0.3 }} />
      ))}
      {streams.map((d, i) => (
        <motion.path key={i} d={d} stroke="#cfe4ec" strokeWidth={i % 2 ? 9 : 6} strokeLinecap="round" fill="none" opacity="0.85" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, delay: at + 2 + i * 0.25, ease: 'easeIn' }} />
      ))}
      <motion.ellipse cx="800" cy="752" rx="300" ry="20" fill="#a8c8d4" initial={{ opacity: 0, scale: 0.2 }} animate={{ opacity: 0.75, scale: 1.2 }} transition={{ duration: 2.4, delay: at + 3.4 }} />
    </Svg>
  );
}
