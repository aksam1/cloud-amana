import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FIRE, PARADISE } from '../lib/abodes.js';

/*
 * The two abodes as one diamond on the night sky (docs/ABODES-BLUEPRINT.md §4–5).
 *
 * At the top, a wide canopy of light labelled "The Throne, which God created": never a point, a sun or a
 * figure, because God is not pictured. Under it, Paradise: seven courses of gold, the highest (al-Firdaus)
 * nearest the Throne. At the widest point, the ground between the two: a thin bright line with three seals
 * (the bridge, the wall with a door, the heights). Below, the Fire: seven courses of cold, near-black stone
 * with faint seams, narrowing to al-Hawiyah. No glow and no red there, no people anywhere: what each level is
 * like is told only by its verses, as text, in the pop-up.
 *
 * Props: focus (a stop id, or null for the whole diamond), onFocus(id), side (the pop-up opens beside the
 * diamond instead of below it, so the level being read is kept in the middle of the frame, not the top).
 */

const W = 400;
const VH = 530;
const C = W / 2;
const CH = 30; // one course's height: about 25 px on a phone, a tap target of its own
const PT = 70; // Paradise's top
const PB = PT + 7 * CH; // Paradise's foot
const FT = PB + CH; // the Fire's top: the ground between the two lies in the course-high gap
const FB = FT + 7 * CH; // the Fire's foot
const WY = (PB + FT) / 2; // the waist line
const NARROW = 40; // half the width at the two ends
const WIDE = 186; // half the width at the waist

const r1 = (n) => Math.round(n * 10) / 10;
const lerp = (a, b, t) => a + (b - a) * t;
const halfAt = (y) => (y <= PB ? lerp(NARROW, WIDE, (y - PT) / (PB - PT)) : y < FT ? WIDE : lerp(WIDE, NARROW, (y - FT) / (FB - FT)));
const band = (y0, y1, grow = 0) => {
  const a = halfAt(y0) + grow;
  const b = halfAt(y1) + grow;
  return `${r1(C - a)},${y0} ${r1(C + a)},${y0} ${r1(C + b)},${y1} ${r1(C - b)},${y1}`;
};

// The canopy: a wide, shallow dome of light over the gardens.
const CANOPY = { x0: 62, x1: 338, base: 60, ctrl: 6 };
const canopyPath = `M${CANOPY.x0} ${CANOPY.base} C${CANOPY.x0 + 34} ${CANOPY.ctrl}, ${CANOPY.x1 - 34} ${CANOPY.ctrl}, ${CANOPY.x1} ${CANOPY.base} Z`;

// Where each stop sits: [x0, y0, x1, y1].
const COURSES = [
  ...PARADISE.map((l, i) => ({ id: l.id, name: l.name, side: 'paradise', y0: PT + i * CH, y1: PT + (i + 1) * CH })),
  ...FIRE.map((l, i) => ({ id: l.id, name: l.name, side: 'fire', y0: FT + i * CH, y1: FT + (i + 1) * CH })),
];
const BOX = {
  throne: [CANOPY.x0, 18, CANOPY.x1, CANOPY.base],
  between: [C - WIDE, PB, C + WIDE, FT],
  ...Object.fromEntries(COURSES.map((c) => [c.id, [C - Math.max(halfAt(c.y0), halfAt(c.y1)), c.y0, C + Math.max(halfAt(c.y0), halfAt(c.y1)), c.y1]])),
};
const SEALS = [
  { id: 'bridge', x: C - 112 },
  { id: 'wall', x: C },
  { id: 'heights', x: C + 112 },
];

/** The part of the picture to show for a stop, at the frame's own shape (never closer than about 2×). */
export function viewOf(id, side = true) {
  if (!id || !BOX[id]) return [0, 0, W, VH];
  const [x0, y0, x1, y1] = BOX[id];
  const a = W / VH;
  const vw = Math.min(W, Math.max(x1 - x0 + 28, (y1 - y0 + 44) * a, 210));
  const vh = vw / a;
  // Beside the pop-up the stop sits in the middle; above it (phones), in the upper quarter it leaves free.
  const p = side ? 0.5 : 0.24;
  return [C - vw / 2, (y0 + y1) / 2 - p * vh, vw, vh].map(r1);
}

// Fine joints in the masonry, offset course by course like laid stone.
function joints(y0s) {
  let d = '';
  y0s.forEach((y0, row) => {
    for (let x = C - WIDE + (row % 2 ? 15 : 0); x < C + WIDE; x += 30) d += `M${x} ${y0 + 2}V${y0 + CH - 2}`;
  });
  return d;
}
const PARADISE_JOINTS = joints(COURSES.filter((c) => c.side === 'paradise').map((c) => c.y0));
const FIRE_JOINTS = joints(COURSES.filter((c) => c.side === 'fire').map((c) => c.y0));

export default function AbodesMonument({ focus = null, onFocus, side = true, throneLabel = 'The Throne, which God created', className = '' }) {
  const still = useReducedMotion();
  const target = viewOf(focus, side).join(' ');
  // The first move (out from the Throne) is slow; every later one is the pyramid's quick zoom.
  // A level chosen while that first move still runs ends it: the zoom to the level is the quick one.
  const [intro, setIntro] = useState(!still);
  useEffect(() => {
    if (focus) setIntro(false);
  }, [focus]);
  const slow = intro && !focus;
  const hit = (id, label) =>
    onFocus
      ? {
          'data-level': id,
          role: 'button',
          tabIndex: 0,
          'aria-label': focus === id ? `${label}: shown up close` : `Read about ${label}`,
          'aria-pressed': focus === id,
          className: 'cursor-pointer outline-none focus-visible:stroke-white',
          stroke: 'transparent',
          strokeWidth: 1.6,
          onClick: () => onFocus(id),
          onKeyDown: (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onFocus(id)),
        }
      : {};
  const shade = (id) => ({
    fill: '#04050b',
    pointerEvents: 'none',
    initial: false,
    animate: { opacity: focus && focus !== id ? 0.62 : 0 },
    transition: { duration: still ? 0 : 0.6 },
  });

  return (
    <motion.svg
      // The view opens on the Throne, then draws back to the whole diamond: the light above is seen first.
      initial={{ viewBox: still ? target : viewOf('throne', true).join(' ') }}
      animate={{ viewBox: target }}
      transition={still ? { duration: 0 } : slow ? { delay: 0.35, duration: 1.8, ease: [0.65, 0, 0.35, 1] } : { duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
      onAnimationComplete={() => setIntro(false)}
      className={className}
      role="group"
      aria-label="The two abodes: the Throne above, the seven gardens of Paradise, the ground between, and the seven levels of the Fire"
    >
      <defs>
        <linearGradient id="ab-canopy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="1" stopColor="#f3d488" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="ab-garden" gradientUnits="userSpaceOnUse" x1="0" y1={PT} x2="0" y2={PB}>
          <stop offset="0" stopColor="#fff3cf" />
          <stop offset="0.45" stopColor="#f0c768" />
          <stop offset="1" stopColor="#c48a36" />
        </linearGradient>
        <linearGradient id="ab-stone" gradientUnits="userSpaceOnUse" x1="0" y1={FT} x2="0" y2={FB}>
          <stop offset="0" stopColor="#25262f" />
          <stop offset="1" stopColor="#09090d" />
        </linearGradient>
        <linearGradient id="ab-descent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6da" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff6da" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="ab-seal" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fff4cf" />
          <stop offset="0.55" stopColor="#e9b95a" />
          <stop offset="1" stopColor="#a8711f" />
        </radialGradient>
        <filter id="ab-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <clipPath id="ab-paradise">
          <polygon points={band(PT, PB)} />
        </clipPath>
        <clipPath id="ab-fire">
          <polygon points={band(FT, FB)} />
        </clipPath>
      </defs>

      {/* where each half begins: plain words beside the diamond, where it is narrow */}
      <g fontFamily="'Cormorant Garamond', serif" fontStyle="italic" fontSize="15" fill="#f3e7cc" opacity="0.7" pointerEvents="none" aria-hidden="true">
        <text x="18" y={PT + 22}>Paradise</text>
        <text x="18" y={FB - 10}>The Fire</text>
      </g>

      {/* ── the Throne: a canopy of light, labelled; never a point, a sun or a figure ── */}
      <g pointerEvents="none">
        <path d={canopyPath} fill="#fff1c4" opacity="0.45" filter="url(#ab-blur)" />
        <rect x={C - 70} y={CANOPY.base - 2} width="140" height={PT - CANOPY.base + 4} fill="url(#ab-descent)" />
        <path d={canopyPath} fill="url(#ab-canopy)" />
        <path d={`M${CANOPY.x0} ${CANOPY.base} C${CANOPY.x0 + 34} ${CANOPY.ctrl}, ${CANOPY.x1 - 34} ${CANOPY.ctrl}, ${CANOPY.x1} ${CANOPY.base}`} fill="none" stroke="#fffbe8" strokeWidth="1" />
        <text x={C} y={CANOPY.base - 9} textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontStyle="italic" fontWeight="600" fontSize="14" fill="#4a3110">
          {throneLabel}
        </text>
      </g>

      {/* ── Paradise: seven courses of gold light ── */}
      <polygon points={band(PT, PB, 4)} fill="#f6c66a" opacity="0.32" filter="url(#ab-blur)" pointerEvents="none" />
      <polygon points={band(PT, PB)} fill="url(#ab-garden)" pointerEvents="none" />
      <g clipPath="url(#ab-paradise)" pointerEvents="none">
        <path d={PARADISE_JOINTS} stroke="#fff8e0" strokeOpacity="0.3" strokeWidth="0.6" />
        {/* the shaded face to the right of the ridge, as on the pyramid */}
        <polygon points={`${C + NARROW * 0.18},${PT} ${C + NARROW},${PT} ${C + WIDE},${PB} ${C + WIDE * 0.18},${PB}`} fill="#5a3410" opacity="0.22" />
      </g>

      {/* ── the ground between: a thin bright line and three seals ── */}
      <g pointerEvents="none">
        <line x1={C - WIDE} x2={C + WIDE} y1={WY} y2={WY} stroke="#fff1c4" strokeWidth="1.2" opacity="0.85" />
        {SEALS.map((s) => (
          <g key={s.id}>
            <circle cx={s.x} cy={WY} r="11" fill="#fff1c4" opacity="0.35" filter="url(#ab-blur)" />
            <circle cx={s.x} cy={WY} r="7.5" fill="#0b0d18" />
            <circle cx={s.x} cy={WY} r="6.4" fill="url(#ab-seal)" />
            <circle cx={s.x - 2} cy={WY - 2.2} r="1.8" fill="#fffbe8" opacity="0.7" />
          </g>
        ))}
      </g>

      {/* ── the Fire: cold, near-black stone, faint seams; no glow, no red, no one drawn ── */}
      <polygon points={band(FT, FB)} fill="url(#ab-stone)" pointerEvents="none" />
      <g clipPath="url(#ab-fire)" pointerEvents="none">
        <path d={FIRE_JOINTS} stroke="#3c3f4d" strokeOpacity="0.55" strokeWidth="0.6" />
        <polygon points={`${C + WIDE * 0.18},${FT} ${C + WIDE},${FT} ${C + NARROW},${FB} ${C + NARROW * 0.18},${FB}`} fill="#000000" opacity="0.3" />
      </g>
      <polygon points={band(FT, FB)} fill="none" stroke="#3a3c48" strokeWidth="0.8" pointerEvents="none" />

      {/* the seams between courses, and each level's name carved in it */}
      {COURSES.map((c, i) => {
        const gold = c.side === 'paradise';
        const first = i === 0 || i === PARADISE.length;
        return (
          <g key={c.id} pointerEvents="none">
            {!first && <line x1={r1(C - halfAt(c.y0))} x2={r1(C + halfAt(c.y0))} y1={c.y0} y2={c.y0} stroke={gold ? '#fff8e0' : '#4a4d5c'} strokeOpacity={gold ? 0.75 : 0.5} strokeWidth={gold ? 1 : 0.7} />}
            <text x={C} y={c.y0 + CH / 2 + 4.3} textAnchor="middle" fontFamily="Cinzel, serif" fontWeight="700" fontSize="12" fill={gold ? '#3d260c' : '#aeb2c4'} aria-hidden="true">
              {c.name}
            </text>
          </g>
        );
      })}

      {/* ── each stop is one button: tap it to read about it; the rest falls into shade ── */}
      <motion.path d={canopyPath} {...shade('throne')} />
      <path d={canopyPath} fill="transparent" {...hit('throne', 'the Throne')} />
      {COURSES.map((c) => (
        <g key={c.id}>
          <motion.polygon points={band(c.y0, c.y1)} {...shade(c.id)} />
          <polygon points={band(c.y0, c.y1)} fill="transparent" {...hit(c.id, `${c.name}, ${c.side === 'paradise' ? 'in Paradise' : 'in the Fire'}`)} />
        </g>
      ))}
      <motion.rect x={C - WIDE} y={PB} width={WIDE * 2} height={FT - PB} {...shade('between')} />
      <rect x={C - WIDE} y={PB} width={WIDE * 2} height={FT - PB} fill="transparent" {...hit('between', 'the ground between the two: the bridge, the wall and the heights')} />
    </motion.svg>
  );
}
