// The animals that came to the ark two by two, drawn in fine ink strokes: lions, camels, horses, deer,
// sheep, and birds in flight. Each pair walks a path (across the plain, up the ramp, in at the door), or
// out again onto the new earth.
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Svg, useStage } from '../components/stageKit.jsx';

const INK = '#2a2420';

// Side views facing right, about 100 long, feet on y = 0. `legs` are [hip x, hip y] pairs.
const KINDS = {
  horse: {
    body: 'M-42,-46 C-44,-60 -30,-66 -10,-64 L22,-62 C30,-62 36,-70 40,-80 L46,-94 C49,-99 56,-99 60,-94 L67,-82 C69,-78 65,-75 61,-77 L53,-80 C49,-70 46,-58 38,-48 C32,-40 20,-36 0,-36 L-30,-36 C-40,-36 -44,-40 -42,-46 Z',
    detail: ['M-42,-50 C-52,-48 -57,-36 -55,-24', 'M41,-82 C44,-74 46,-66 44,-60', 'M46,-90 C48,-84 50,-78 50,-72'],
    legs: [[30, -40], [24, -40], [-28, -40], [-34, -40]],
    leg: 40,
  },
  camel: {
    body: 'M-44,-58 C-44,-70 -30,-74 -20,-72 C-12,-92 8,-94 14,-74 C20,-70 26,-70 30,-74 C36,-78 40,-92 46,-104 C48,-110 58,-110 62,-104 L67,-98 C67,-94 63,-94 59,-96 L53,-94 C49,-80 45,-66 37,-56 C31,-50 19,-48 0,-48 L-32,-48 C-42,-48 -44,-52 -44,-58 Z',
    detail: ['M-44,-60 C-50,-58 -52,-50 -50,-44', 'M-14,-84 C-6,-90 4,-90 10,-80'],
    legs: [[30, -52], [24, -52], [-30, -52], [-36, -52]],
    leg: 52,
  },
  lion: {
    body: 'M-46,-40 C-46,-54 -30,-58 -12,-56 L16,-56 C22,-58 26,-66 30,-72 C40,-82 58,-80 62,-68 C64,-62 62,-58 58,-56 L50,-52 C46,-44 40,-36 30,-34 L-30,-34 C-42,-34 -46,-36 -46,-40 Z',
    detail: ['M-46,-44 C-60,-48 -66,-32 -60,-22', 'M24,-74 C20,-62 22,-50 28,-42', 'M30,-80 C26,-70 28,-58 34,-50', 'M38,-82 C36,-72 38,-62 42,-56', 'M18,-66 C16,-56 18,-48 22,-42'],
    tuft: [-60, -22],
    legs: [[26, -38], [20, -38], [-28, -38], [-34, -38]],
    leg: 34,
  },
  deer: {
    body: 'M-38,-50 C-40,-60 -28,-64 -12,-62 L20,-60 C26,-62 30,-70 34,-80 L40,-92 C43,-96 50,-96 53,-91 L57,-84 C58,-80 55,-79 52,-80 L47,-82 C44,-72 42,-60 34,-52 C28,-46 16,-44 0,-44 L-26,-44 C-36,-44 -38,-46 -38,-50 Z',
    detail: ['M-38,-54 L-46,-58'],
    antlers: ['M44,-93 C40,-104 38,-112 32,-118', 'M40,-104 L32,-106', 'M48,-94 C50,-106 54,-114 60,-118', 'M52,-106 L60,-104'],
    legs: [[26, -48], [20, -48], [-24, -48], [-30, -48]],
    leg: 48,
  },
  // the king's dream (12:43): seven well-fed cows, and seven lean ones with their ribs showing
  cow: {
    body: 'M-52,-58 C-54,-70 -44,-74 -30,-72 C-10,-76 14,-76 30,-72 C38,-70 42,-66 44,-62 L44,-44 C40,-34 28,-30 14,-30 C0,-28 -20,-28 -36,-32 C-48,-36 -52,-46 -52,-58 Z',
    head: 'M40,-68 C48,-72 56,-70 62,-64 L72,-50 C74,-44 70,-40 64,-42 L56,-48 C50,-52 44,-56 40,-60 Z',
    detail: ['M56,-67 C58,-76 64,-79 69,-76', 'M-51,-60 C-59,-52 -60,-40 -57,-26', 'M-10,-56 C-2,-50 8,-50 16,-56'],
    legs: [[32, -36], [24, -36], [-34, -38], [-42, -40]],
    leg: 38,
    fleece: '#e2d4bc',
  },
  leancow: {
    body: 'M-50,-72 C-50,-80 -42,-82 -30,-80 C-10,-82 14,-82 30,-80 C38,-78 42,-74 42,-70 L40,-62 C34,-58 24,-60 10,-60 C-6,-58 -24,-58 -38,-62 C-46,-64 -50,-66 -50,-72 Z',
    head: 'M38,-76 C46,-80 54,-78 60,-72 L70,-58 C72,-52 68,-48 62,-50 L54,-56 C48,-60 42,-64 38,-68 Z',
    detail: ['M54,-75 C56,-84 62,-87 67,-84', 'M-49,-74 C-56,-66 -57,-54 -55,-40', 'M-18,-80 C-20,-72 -18,-64 -16,-59', 'M-8,-81 C-10,-72 -8,-64 -6,-59', 'M2,-81 C0,-72 2,-64 4,-60', 'M12,-81 C10,-72 12,-64 14,-60', 'M-40,-80 C-36,-74 -36,-68 -40,-64'],
    legs: [[30, -62], [23, -62], [-32, -63], [-40, -65]],
    leg: 64,
    fleece: '#9a8a74',
  },
  sheep: {
    body: 'M-34,-30 C-40,-38 -34,-50 -24,-50 C-20,-58 -8,-60 -2,-54 C4,-60 16,-60 20,-52 C30,-52 34,-42 30,-34 C28,-26 18,-22 8,-24 C0,-20 -14,-20 -20,-24 C-28,-22 -34,-24 -34,-30 Z',
    head: 'M24,-50 C30,-56 40,-54 42,-46 C44,-40 38,-36 32,-38 L26,-40 Z',
    legs: [[18, -26], [12, -26], [-20, -26], [-26, -26]],
    leg: 24,
    fleece: '#e8e0d0',
  },
};

function Beast({ kind, step, male }) {
  const K = KINDS[kind] || KINDS.horse;
  return (
    <g>
      <ellipse cx="0" cy="2" rx="44" ry="5" fill="#000" opacity="0.18" />
      {K.legs.map(([hx, hy], i) => (
        <g key={i} transform={`translate(${hx} ${hy})`}>
          <line x1="0" y1="0" x2="0" y2={K.leg} stroke={INK} strokeWidth="4.5" strokeLinecap="round" className={step ? 'gait' : undefined} style={{ '--t': `${step}s`, animationDelay: `${i % 2 ? 0 : -step}s` }} />
        </g>
      ))}
      <path d={K.body} fill={K.fleece || INK} stroke={INK} strokeWidth="2" />
      {K.head && <path d={K.head} fill={INK} />}
      {(K.detail || []).map((d, i) => (
        <path key={i} d={d} stroke={K.fleece ? INK : '#8a7a68'} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      ))}
      {K.tuft && <circle cx={K.tuft[0]} cy={K.tuft[1]} r="4" fill={INK} />}
      {male && (K.antlers || []).map((d, i) => <path key={`a${i}`} d={d} stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />)}
    </g>
  );
}

/** A believer walking: a small figure of steady light. */
function Walker({ step }) {
  return (
    <g className={step ? 'bob' : undefined} style={{ animationDuration: '0.55s' }}>
      <ellipse cx="0" cy="-44" rx="30" ry="46" fill="#fff3d6" opacity="0.2" />
      <path d="M-17,0 C-16,-28 -13,-50 -9,-61 C-6,-67 6,-67 9,-61 C13,-50 16,-28 17,0 Z" fill="#fff4dc" />
      <circle cx="0" cy="-77" r="9.5" fill="#fffaf0" />
    </g>
  );
}

function Bird({ flap }) {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="14" ry="5" fill={INK} />
      <circle cx="13" cy="-2" r="4" fill={INK} />
      <g className={flap ? 'flap' : undefined}>
        <path d="M-4,-2 C-10,-20 -20,-26 -30,-24 C-20,-14 -12,-6 -4,0 Z" fill={INK} />
        <path d="M2,-2 C2,-22 8,-30 18,-34 C12,-20 10,-10 6,0 Z" fill={INK} />
      </g>
    </g>
  );
}

/** Keyframes along [x, y, scale?] points at an even pace, fading in at the start and/or out at the end. */
function frames(path, fade) {
  const d = [0];
  for (let i = 1; i < path.length; i++) d.push(d[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const total = d.at(-1) || 1;
  const times = d.map((v) => v / total);
  const n = path.length;
  const opacity = path.map((_, i) => ((fade === 'in' || fade === 'both') && i === 0 ? 0 : (fade === 'out' || fade === 'both') && i === n - 1 ? 0 : 1));
  return { x: path.map((p) => p[0]), y: path.map((p) => p[1]), scale: path.map((p) => p[2] ?? 1), opacity, times };
}

/**
 * Pairs of animals walking paths. `pairs`: [{ kind, path: [[x, y, scale?]…], delay, dur, face, gap }]:
 * the second animal walks a step behind at `gap` [dx, dy]; `face: -1` turns them to the left. `fade`
 * ("out" into the ark's door, "in" from it, "both") fades them at the ends of their paths. Birds fly;
 * `kind: "light"` is a believer, a small figure of light; `solo` sends one alone instead of a pair.
 */
export function Animals({ cfg }) {
  const { reduced } = useStage();
  const { pairs = [], size = 1, fade = 'out' } = cfg;
  const walks = useMemo(() => pairs.map((p) => ({ ...p, f: frames(p.path, p.fade ?? fade) })), [pairs, fade]);
  return (
    <Svg>
      {walks.map((p, i) =>
        (p.solo ? [0] : [0, 1]).map((k) => {
          const gap = k ? p.gap || [-30, 10] : [0, 0];
          const T = { duration: reduced ? 0 : (p.dur ?? 9000) / 1000, delay: (p.delay ?? 0) / 1000 + k * 0.35, ease: 'linear', times: p.f.times };
          const flying = p.kind === 'bird';
          return (
            <motion.g key={`${i}-${k}`} initial={{ x: p.f.x[0] + gap[0], y: p.f.y[0] + gap[1], scale: p.f.scale[0], opacity: p.f.opacity[0] }} animate={{ x: p.f.x.map((v) => v + gap[0]), y: p.f.y.map((v) => v + gap[1]), scale: p.f.scale, opacity: p.f.opacity }} transition={{ x: T, y: T, scale: T, opacity: T }}>
              {/* centres the scale on the feet */}
              <rect x="-160" y="-160" width="320" height="320" fill="none" />
              <g transform={`scale(${(p.face ?? 1) * size * (p.s ?? 1)} ${size * (p.s ?? 1)})`}>{flying ? <Bird flap={!reduced} /> : p.kind === 'light' ? <Walker step={!reduced} /> : <Beast kind={p.kind} step={reduced ? 0 : p.step ?? 0.42} male={k === 0} />}</g>
            </motion.g>
          );
        }),
      )}
    </Svg>
  );
}

/**
 * Ears of grain standing in a row, drawn in ink (the king's dream): `n` stalks from `x0` to `x1` with their
 * feet on `y`, `h` tall; `state` "green" (full, upright ears) or "dry" (thin, bent and withered).
 */
export function Ears({ cfg }) {
  const { n = 7, x0 = 400, x1 = 800, y = 760, h = 220, state = 'green', seed = 3 } = cfg;
  const dry = state === 'dry';
  const stem = dry ? '#8a6a3a' : '#5a7a2a';
  const kernel = dry ? '#a88a58' : '#c8b04a';
  const rnd = (i, k) => {
    const v = Math.sin((i + 1) * 12.9898 + (k + seed) * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  return (
    <Svg>
      {Array.from({ length: n }, (_, i) => {
        const x = x0 + ((x1 - x0) * (i + 0.5)) / n;
        const hh = h * (0.9 + rnd(i, 1) * 0.15) * (dry ? 0.85 : 1);
        const bend = dry ? 40 + rnd(i, 2) * 30 : (rnd(i, 2) - 0.5) * 16;
        // the stem curves over to its tip; a dry stalk droops at the top
        const tip = [x + bend, y - hh + (dry ? 40 : 0)];
        const ctrl = [x + bend * 0.1, y - hh * 0.6];
        const along = (t) => [(1 - t) * (1 - t) * x + 2 * (1 - t) * t * ctrl[0] + t * t * tip[0], (1 - t) * (1 - t) * y + 2 * (1 - t) * t * ctrl[1] + t * t * tip[1]];
        const kernels = [];
        const rows = dry ? 6 : 9;
        for (let k = 0; k < rows; k++) {
          const t = 0.7 + (0.3 * k) / rows;
          const [kx, ky] = along(t);
          const [nx, ny] = along(Math.min(1, t + 0.02));
          const a = (Math.atan2(ny - ky, nx - kx) * 180) / Math.PI;
          for (const side of [-1, 1])
            kernels.push(<ellipse key={`${k}${side}`} cx={kx} cy={ky} rx={dry ? 5 : 8} ry={dry ? 2.2 : 4.2} fill={kernel} stroke={INK} strokeWidth={0.8} transform={`rotate(${a + side * 28} ${kx} ${ky}) translate(${dry ? 4 : 6} ${side * 3})`} />);
        }
        const leaf = along(0.35);
        return (
          <g key={i}>
            <path d={`M${x},${y} Q${ctrl[0]},${ctrl[1]} ${tip[0]},${tip[1]}`} fill="none" stroke={stem} strokeWidth={dry ? 2.2 : 3.2} strokeLinecap="round" />
            <path d={`M${leaf[0]},${leaf[1]} q${dry ? 30 : 34},${dry ? 30 : -20} ${dry ? 50 : 64},${dry ? 70 : -10}`} fill="none" stroke={stem} strokeWidth={dry ? 1.6 : 2.4} strokeLinecap="round" />
            {kernels}
          </g>
        );
      })}
    </Svg>
  );
}
