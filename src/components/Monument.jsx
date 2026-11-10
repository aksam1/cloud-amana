import { motion, useReducedMotion } from 'motion/react';
import { LEVELS, unitStatus } from '../lib/pyramid.js';

/*
 * The Pyramid of Righteousness as one true pyramid at dusk: a smooth sandstone triangle lit from the left, its
 * right face in shade, cut by two gilded courses into Islam (the base), Iman (the middle) and Ihsan (the peak),
 * each level's name carved in Arabic, and a gold capstone. Every unit is a round seal set into the stone: a
 * gold seal can be opened today, a dim one is still being written; a ring of gold around the seal is its meter,
 * and a completed seal shines.
 *
 * Props: meters {unitId: 0–100}, done {unitId: bool}, lit {levelId: bool}, peak, start (levelId to glow),
 * recommended (unitId), selected (unitId), onSelect(unitId) — omit onSelect for a still picture —
 * scenery (default true): its own glow behind, for pages without a dusk sky.
 */

const W = 400;
const APEX = [200, 18];
const BASE = 282;
const HALF = 186; // half the base width
const H = BASE - APEX[1];

// Heights as fractions of the pyramid, base up. Seals sit on rows within each band.
const BANDS = [
  { from: 0, to: 0.36, name: 0.075, rows: [0.18] },
  { from: 0.36, to: 0.64, name: 0.425, rows: [0.5] },
  { from: 0.64, to: 0.885, name: 0.68, rows: [0.725, 0.8] },
];
const CAP = 0.885;

const yAt = (f) => BASE - f * H;
const halfAt = (f) => HALF * (1 - f);
const r1 = (n) => Math.round(n * 10) / 10;

function seals(level, band) {
  const n = level.units.length;
  const per = Math.ceil(n / band.rows.length);
  return level.units.map((u, i) => {
    const row = Math.floor(i / per);
    const inRow = Math.min(per, n - row * per);
    const f = band.rows[row];
    const span = halfAt(f) * 2 * (inRow > 3 ? 0.78 : band.rows.length > 1 ? 0.74 : 0.62);
    const step = inRow > 1 ? span / (inRow - 1) : 0;
    const x = 200 - span / 2 + (i - row * per) * step;
    const r = band.rows.length > 1 ? 6.2 : n > 5 ? 9.5 : 11;
    return { unit: u, x: r1(x), y: r1(yAt(f)), r, row };
  });
}

// The part of the picture to show when one level is looked at closely (kept at the frame's 4:3).
function viewOf(focus) {
  const li = LEVELS.findIndex((l) => l.id === focus);
  if (li < 0) return [0, 0, W, 300];
  const b = BANDS[li];
  const w = halfAt(b.from) * 2 + 24;
  const h = yAt(b.from) - yAt(b.to) + 36;
  const vw = Math.max(w, (h * 4) / 3);
  const vh = (vw * 3) / 4;
  const cy = (yAt(b.from) + yAt(b.to)) / 2;
  return [200 - vw / 2, cy - vh / 2, vw, vh].map(r1);
}

// Unit names under (or, every other one, above) their seals when a level is looked at closely.
const LABEL = [12, 9, 5]; // seal names when a level is looked at closely: about 11 px tall on a phone

export default function Monument({ meters = {}, done = {}, lit = {}, peak = false, start, recommended, selected, onSelect, focus, onFocus, scenery = true, className = '' }) {
  const still = useReducedMotion();
  const pulse = still ? {} : { animate: { opacity: [0.25, 1, 0.25] }, transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } };
  const tri = `${APEX[0]},${APEX[1]} ${200 + HALF},${BASE} ${200 - HALF},${BASE}`;
  const right = `${APEX[0]},${APEX[1]} ${200 + HALF},${BASE} ${200 + HALF * 0.18},${BASE}`;
  const capY = yAt(CAP);
  const capH = halfAt(CAP);
  return (
    <motion.svg
      viewBox={`0 0 ${W} 300`}
      animate={{ viewBox: viewOf(focus).join(' ') }}
      transition={{ duration: still ? 0 : 0.9, ease: [0.65, 0, 0.35, 1] }}
      className={className}
      role="group"
      aria-label="The pyramid: Islam at the base, Iman in the middle, Ihsan at the peak"
    >
      <defs>
        <linearGradient id="mn-face" x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0" stopColor="#f3d9a6" />
          <stop offset="0.45" stopColor="#d6ad70" />
          <stop offset="1" stopColor="#a87a45" />
        </linearGradient>
        <linearGradient id="mn-shadeface" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a1608" stopOpacity="0.38" />
          <stop offset="1" stopColor="#1a0c04" stopOpacity="0.62" />
        </linearGradient>
        <linearGradient id="mn-foot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a0c04" stopOpacity="0" />
          <stop offset="1" stopColor="#1a0c04" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="mn-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2c8" />
          <stop offset="0.5" stopColor="#f0c768" />
          <stop offset="1" stopColor="#b9822c" />
        </linearGradient>
        <radialGradient id="mn-seal" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fff4cf" />
          <stop offset="0.55" stopColor="#e9b95a" />
          <stop offset="1" stopColor="#a8711f" />
        </radialGradient>
        <radialGradient id="mn-socket" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#7d5a32" />
          <stop offset="1" stopColor="#5a3d1f" />
        </radialGradient>
        <radialGradient id="mn-halo" cx="0.5" cy="0.8" r="0.6">
          <stop offset="0" stopColor="#f6a259" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#a5582f" stopOpacity="0.12" />
          <stop offset="1" stopColor="#1c2748" stopOpacity="0" />
        </radialGradient>
        <filter id="mn-blur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <clipPath id="mn-clip">
          <polygon points={tri} />
        </clipPath>
      </defs>

      {scenery && <rect x="0" y="0" width={W} height="300" fill="url(#mn-halo)" />}

      {/* the long shadow on the sand and the warm light around the stone */}
      <ellipse cx="214" cy="284" rx="200" ry="7" fill="#0d0603" opacity="0.6" />
      <polygon points={tri} fill="#f6b46a" opacity="0.28" filter="url(#mn-blur)" />

      {/* the stone: lit face, shaded face, fine courses of masonry */}
      <polygon points={tri} fill="url(#mn-face)" />
      <g clipPath="url(#mn-clip)" pointerEvents="none">
        {Array.from({ length: 34 }, (_, i) => {
          const y = BASE - 7.6 * (i + 1);
          return <line key={i} x1="0" x2={W} y1={y} y2={y} stroke="#6b4521" strokeOpacity="0.16" strokeWidth="0.6" />;
        })}
        <polygon points={right} fill="url(#mn-shadeface)" />
        <rect x="0" y={BASE - 40} width={W} height="40" fill="url(#mn-foot)" />
        {/* the lit edge of the ridge */}
        <line x1={APEX[0]} y1={APEX[1]} x2={200 + HALF * 0.18} y2={BASE} stroke="#fff1cf" strokeOpacity="0.35" strokeWidth="0.8" />
      </g>
      <line x1={APEX[0]} y1={APEX[1]} x2={200 - HALF} y2={BASE} stroke="#fff3d6" strokeOpacity="0.6" strokeWidth="1" />

      {/* the gilded courses between the levels, and each level's carved name */}
      {LEVELS.map((level, li) => {
        const b = BANDS[li];
        const top = b.to;
        const gilded = lit[level.id];
        const isStart = start === level.id;
        return (
          <g key={level.id} pointerEvents="none">
            <polygon
              points={`${200 - halfAt(top) - 1},${yAt(top) + 1.5} ${200 + halfAt(top) + 1},${yAt(top) + 1.5} ${200 + halfAt(top) + 2},${yAt(top) - 2} ${200 - halfAt(top) - 2},${yAt(top) - 2}`}
              fill="url(#mn-gold)"
              opacity={gilded ? 1 : 0.85}
            />
            {gilded && <polygon points={`${200 - halfAt(b.to)},${yAt(b.to)} ${200 + halfAt(b.to)},${yAt(b.to)} ${200 + halfAt(b.from)},${yAt(b.from)} ${200 - halfAt(b.from)},${yAt(b.from)}`} fill="#ffe7a8" opacity="0.18" />}
            {isStart && (
              <motion.polygon
                points={`${200 - halfAt(b.to) - 3},${yAt(b.to) - 3} ${200 + halfAt(b.to) + 3},${yAt(b.to) - 3} ${200 + halfAt(b.from) + 5},${yAt(b.from) + 2} ${200 - halfAt(b.from) - 5},${yAt(b.from) + 2}`}
                fill="none"
                stroke="#fff1c4"
                strokeWidth="1.6"
                {...pulse}
              />
            )}
          </g>
        );
      })}

      {/* the capstone, gold, shining once the whole climb is done */}
      <g pointerEvents="none">
        {peak && <polygon points={`${APEX[0]},${APEX[1]} ${200 + capH},${capY} ${200 - capH},${capY}`} fill="#fff0bf" filter="url(#mn-blur)" />}
        <polygon points={`${APEX[0]},${APEX[1]} ${200 + capH},${capY} ${200 - capH},${capY}`} fill="url(#mn-gold)" />
        <polygon points={`${APEX[0]},${APEX[1]} ${200 + capH},${capY} ${200 + capH * 0.18},${capY}`} fill="#7a4a12" opacity="0.4" />
        <circle cx={APEX[0]} cy={APEX[1]} r="2.2" fill="#fffbe8" />
        <circle cx={APEX[0]} cy={APEX[1]} r="9" fill="#fff4cf" opacity="0.45" filter="url(#mn-blur)" />
      </g>

      {/* each level is one wide button: tap it to look closer; the other levels fall into shade */}
      {LEVELS.map((level, li) => {
        const b = BANDS[li];
        const pts = `${200 - halfAt(b.to)},${yAt(b.to)} ${200 + halfAt(b.to)},${yAt(b.to)} ${200 + halfAt(b.from)},${yAt(b.from)} ${200 - halfAt(b.from)},${yAt(b.from)}`;
        return (
          <g key={level.id}>
            <motion.polygon points={pts} fill="#0b0712" pointerEvents="none" initial={false} animate={{ opacity: focus && focus !== level.id ? 0.7 : 0 }} transition={{ duration: 0.6 }} />
            {onFocus && (
              <polygon
                points={pts}
                fill="transparent"
                data-level={level.id}
                role="button"
                tabIndex={0}
                aria-label={focus === level.id ? `${level.title}: shown up close` : `Look closer at ${level.title}`}
                aria-pressed={focus === level.id}
                className="cursor-pointer outline-none focus-visible:fill-white/10"
                onClick={() => onFocus(level.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onFocus(level.id))}
              />
            )}
          </g>
        );
      })}

      {/* the seals: one per unit */}
      {LEVELS.map((level, li) =>
        seals(level, BANDS[li]).map(({ unit, x, y, r, row }, i) => {
          const m = meters[unit.id] || 0;
          const ready = unitStatus(unit.id) !== 'soon';
          const isDone = !!done[unit.id];
          const label = `${unit.title}, ${unit.english}: ${m}%${isDone ? ', completed' : ''}${ready ? '' : ', still being written'}`;
          const interactive = !!onSelect;
          const ring = r + 2.6;
          const circ = 2 * Math.PI * ring;
          return (
            <g
              key={unit.id}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? label : undefined}
              aria-pressed={interactive ? selected === unit.id : undefined}
              onClick={interactive ? () => onSelect(unit.id) : undefined}
              onKeyDown={interactive ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(unit.id)) : undefined}
              className={interactive ? 'group cursor-pointer outline-none' : ''}
            >
              {interactive && <circle cx={x} cy={y} r={Math.max(r + 6, 13)} fill="transparent" />}
              {(isDone || selected === unit.id) && <circle cx={x} cy={y} r={r + 5} fill="#ffe7a0" opacity={isDone ? 0.85 : 0.6} filter="url(#mn-blur)" />}
              {/* the socket cut into the stone */}
              <circle cx={x} cy={y + 0.6} r={r + 1.2} fill="#fff3d6" opacity="0.35" />
              <circle cx={x} cy={y} r={r + 1.2} fill="url(#mn-socket)" />
              <circle cx={x} cy={y} r={r} fill={ready ? 'url(#mn-seal)' : '#8c6a42'} opacity={ready ? 1 : 0.75} className={interactive ? 'transition-opacity group-hover:opacity-90' : ''} />
              {ready && <circle cx={x - r * 0.3} cy={y - r * 0.35} r={r * 0.28} fill="#fffbe8" opacity="0.7" />}
              {!ready && <circle cx={x} cy={y} r={r * 0.28} fill="#5a3d1f" opacity="0.6" />}
              {/* the meter: a ring of gold drawn around the seal */}
              {m > 0 && (
                <motion.circle
                  cx={x}
                  cy={y}
                  r={ring}
                  fill="none"
                  stroke="#ffe08a"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  transform={`rotate(-90 ${x} ${y})`}
                  strokeDasharray={circ}
                  initial={still ? false : { strokeDashoffset: circ }}
                  animate={{ strokeDashoffset: circ * (1 - m / 100) }}
                  transition={{ duration: 1.4, delay: 0.5, ease: 'easeOut' }}
                />
              )}
              {selected === unit.id && <circle cx={x} cy={y} r={ring + 2.4} fill="none" stroke="#ffffff" strokeWidth="1.6" />}
              {recommended === unit.id && selected !== unit.id && <motion.circle cx={x} cy={y} r={ring + 2.4} fill="none" stroke="#fff3d6" strokeWidth="1.3" strokeDasharray="3 2.5" {...pulse} />}
              {interactive && <circle cx={x} cy={y} r={ring + 2.4} fill="none" stroke="#ffffff" strokeWidth="1.6" className="opacity-0 group-focus-visible:opacity-100" />}
              {focus === level.id && (
                <motion.text
                  x={x}
                  y={(BANDS[li].rows.length === 1 ? i % 2 === 1 : row === 1) ? y - r - 5 : y + r + 4 + LABEL[li]}
                  textAnchor="middle"
                  fontFamily="Cinzel, serif"
                  fontWeight="700"
                  fontSize={LABEL[li]}
                  fill="#fff4dc"
                  stroke="#2a1608"
                  strokeWidth={LABEL[li] * 0.22}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  opacity={ready ? 1 : 0.55}
                  pointerEvents="none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: ready ? 1 : 0.55 }}
                  transition={{ delay: still ? 0 : 0.6, duration: 0.5 }}
                  aria-hidden="true"
                >
                  {unit.title}
                </motion.text>
              )}
            </g>
          );
        }),
      )}
    </motion.svg>
  );
}
