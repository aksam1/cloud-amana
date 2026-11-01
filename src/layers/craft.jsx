// The knowledge tradition gives to Idris, shown through hands of light (never more than soft glow):
// a reed pen whose first lines spill off the page into the parchment the whole story is painted on,
// cloth stitched into a garment, and ink lines joining the stars from a rooftop at night.
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Svg, useStage, useUid } from '../components/stageKit.jsx';
import { BODY_PATH, lerp, rng } from '../lib/geo.js';

const INK = '#2a1c14';
const LEAF = '#eadcbe';

/** A hand of light: a soft glowing shape, no fingers or detail. */
function Hand({ uid }) {
  return (
    <g filter={`url(#${uid}f)`}>
      <ellipse cx="0" cy="0" rx="34" ry="24" fill={`url(#${uid}h)`} />
      <ellipse cx="-20" cy="10" rx="10" ry="8" fill={`url(#${uid}h)`} />
    </g>
  );
}

function HandDefs({ uid }) {
  return (
    <>
      <radialGradient id={`${uid}h`}>
        <stop offset="0" stopColor="#fffaf0" />
        <stop offset="0.6" stopColor="#ffe9c2" stopOpacity="0.85" />
        <stop offset="1" stopColor="#ffe2b0" stopOpacity="0" />
      </radialGradient>
      <filter id={`${uid}f`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </>
  );
}

function Desk({ vb }) {
  return (
    <>
      <rect x={vb[0] - 400} y={vb[1] - 400} width={vb[2] + 800} height={vb[3] + 800} fill="#5a3e28" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M-600,${180 + i * 130} C200,${160 + i * 130} 1200,${200 + i * 130} 2200,${170 + i * 130}`} stroke="#3e2a1a" strokeOpacity="0.35" strokeWidth="3" fill="none" />
      ))}
    </>
  );
}

// Lines of writing, right to left as Arabic is written: flowing marks, not words.
const LINES = [
  'M1010,420 C960,404 930,436 880,420 C840,408 820,432 780,424 C740,416 720,436 670,428',
  'M1010,500 C970,488 940,516 900,502 C860,490 830,512 790,506 C760,500 740,516 700,510',
  'M1010,580 C976,568 950,594 914,582 C880,572 850,592 812,586 C792,582 776,592 760,588',
];
const SPILL = [
  'M670,428 C520,440 300,380 -200,420',
  'M700,510 C540,560 260,640 -260,760',
  'M760,588 C700,700 600,900 520,1300',
  'M1010,420 C1200,380 1500,300 1900,240',
  'M1010,500 C1250,540 1550,620 1900,700',
  'M1010,580 C1100,760 1260,980 1400,1300',
];

/**
 * A reed pen in a hand of light over a sheet of parchment. `phase: "write"` dips the pen and draws the
 * first lines; `"spill"` lets those strokes run off the page across the frame until everything is parchment.
 */
export function Pen({ cfg }) {
  const uid = useUid('pn');
  const { vb } = useStage();
  const { phase = 'write' } = cfg;
  const spill = phase === 'spill';
  // the nib follows each line from its start to its end as the line inks in
  const path = useMemo(
    () => ({
      x: [1110, 1180, 1110, 1010, 670, 1010, 700, 1010, 760, 1080],
      y: [380, 520, 380, 420, 428, 500, 510, 580, 588, 640],
      times: [0, 0.1, 0.18, 0.24, 0.44, 0.5, 0.68, 0.74, 0.9, 1],
    }),
    [],
  );
  return (
    <Svg>
      <defs>
        <HandDefs uid={uid} />
        <linearGradient id={`${uid}p`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2e6cc" />
          <stop offset="1" stopColor="#d9c6a0" />
        </linearGradient>
      </defs>
      <Desk vb={vb} />
      <g transform="rotate(-3 830 500)">
        <rect x="560" y="300" width="540" height="420" fill={`url(#${uid}p)`} />
        <rect x="560" y="300" width="540" height="420" fill="none" stroke="#b89a6a" strokeOpacity="0.5" strokeWidth="3" />
      </g>
      <g transform="translate(1180 560)">
        <ellipse cx="0" cy="22" rx="46" ry="14" fill="#1a120c" opacity="0.4" />
        <path d="M-34,-20 C-40,10 -30,24 0,26 C30,24 40,10 34,-20 Z" fill="#3a2a22" />
        <ellipse cx="0" cy="-20" rx="34" ry="9" fill="#120c0a" />
        <ellipse cx="-8" cy="-22" rx="12" ry="2.6" fill="#6a5a6a" opacity="0.6" />
      </g>
      {LINES.map((d, i) => (
        <motion.path key={i} d={d} stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 6 * (path.times[4 + i * 2] - path.times[3 + i * 2]), delay: 6 * path.times[3 + i * 2], ease: 'easeInOut' }} />
      ))}
      {spill &&
        SPILL.map((d, i) => (
          <motion.path key={`s${i}`} d={d} stroke={INK} strokeWidth={10 + (i % 3) * 8} strokeLinecap="round" fill="none" opacity="0.85" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, delay: i * 0.15, ease: [0.3, 0, 0.2, 1] }} />
        ))}
      {spill && <motion.rect x={vb[0] - 400} y={vb[1] - 400} width={vb[2] + 800} height={vb[3] + 800} fill={LEAF} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2.4, delay: 1.6 }} />}
      {!spill && (
        <motion.g initial={{ x: path.x[0], y: path.y[0] }} animate={{ x: path.x, y: path.y }} transition={{ duration: 6, times: path.times, ease: 'easeInOut' }}>
          <path d="M0,0 L74,-58" stroke="#b08a52" strokeWidth="6" strokeLinecap="round" />
          <path d="M0,0 L-6,5" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <g transform="translate(70 -54)">
            <Hand uid={uid} />
          </g>
        </motion.g>
      )}
    </Svg>
  );
}

/** Two halves of a garment on the table; a needle in a hand of light stitches them into one robe. */
export function Garment({ cfg }) {
  const uid = useUid('gm');
  const { vb, reduced } = useStage();
  const { dur = 5 } = cfg;
  const seam = { x: 800, y0: 330, y1: 700 };
  return (
    <Svg>
      <defs>
        <HandDefs uid={uid} />
        <clipPath id={`${uid}c`}>
          <motion.rect x="760" y={seam.y0 - 10} width="80" initial={{ height: reduced ? 400 : 0 }} animate={{ height: seam.y1 - seam.y0 + 20 }} transition={{ duration: dur, ease: 'linear' }} />
        </clipPath>
      </defs>
      <Desk vb={vb} />
      <path d="M800,330 L700,350 L560,420 L600,470 L680,440 L690,700 L800,700 Z" fill="#d9c9a6" />
      <path d="M800,330 L900,350 L1040,420 L1000,470 L920,440 L910,700 L800,700 Z" fill="#cdb995" />
      <path d="M560,420 L600,470 M1040,420 L1000,470" stroke="#a8916a" strokeWidth="3" />
      {[0.3, 0.55, 0.8].map((u) => (
        <path key={u} d={`M${lerp(700, 690, u)},${lerp(350, 700, u)} L${lerp(900, 910, u)},${lerp(350, 700, u)}`} stroke="#8a7452" strokeOpacity="0.18" strokeWidth="2" />
      ))}
      <g clipPath={`url(#${uid}c)`}>
        <path d={`M${seam.x},${seam.y0} L${seam.x},${seam.y1}`} stroke="#6a4a2a" strokeWidth="3" strokeDasharray="10 7" />
        {Array.from({ length: 26 }, (_, i) => (
          <path key={i} d={`M${seam.x - 7},${seam.y0 + 6 + i * 14} L${seam.x + 7},${seam.y0 + 12 + i * 14}`} stroke="#6a4a2a" strokeWidth="2" />
        ))}
      </g>
      <motion.g initial={{ x: seam.x, y: seam.y0 }} animate={reduced ? { y: seam.y1 } : { y: [seam.y0, seam.y1], x: [seam.x, seam.x + 6, seam.x - 4, seam.x] }} transition={{ duration: dur, ease: 'linear', x: { duration: 0.9, repeat: Infinity } }}>
        <path d="M0,0 L26,-30" stroke="#d8dce4" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M26,-30 C60,-60 90,-40 120,-70" stroke="#b08a52" strokeWidth="1.4" fill="none" />
        <g transform="translate(34 -40)">
          <Hand uid={uid} />
        </g>
      </motion.g>
    </Svg>
  );
}

// Three patterns of bright stars, each joined in order by a line of ink.
const PATTERNS = [
  [[300, 160], [380, 120], [470, 150], [540, 110], [620, 140]],
  [[760, 90], [820, 170], [900, 140], [960, 210], [880, 260], [800, 230]],
  [[1080, 120], [1160, 170], [1240, 130], [1300, 200], [1380, 160]],
];

/**
 * A rooftop at night with a figure of light pointing upward (`figure` {x, y}), as lines of ink join
 * the brightest stars into patterns across the sky (`draw`).
 */
export function Constellations({ cfg }) {
  const uid = useUid('cn');
  const { figure = { x: 760, y: 700 }, draw = true } = cfg;
  const roofs = useMemo(() => {
    const r = rng(17);
    const out = [];
    let x = -400;
    while (x < 2000) {
      const w = 120 + r() * 160;
      out.push({ x, w, y: 690 + r() * 70 });
      x += w;
    }
    return out;
  }, []);
  return (
    <Svg>
      <defs>
        <HandDefs uid={uid} />
        <radialGradient id={`${uid}s`}>
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.3" stopColor="#dfe6ff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#dfe6ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {PATTERNS.map((stars, i) => (
        <g key={i}>
          {stars.slice(1).map(([x, y], k) => (
            <motion.path key={k} d={`M${stars[k][0]},${stars[k][1]} L${x},${y}`} stroke="#d8dcf0" strokeOpacity="0.7" strokeWidth="1.8" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: draw ? 1 : 0 }} transition={{ duration: 0.7, delay: 1 + i * 1.6 + k * 0.32 }} />
          ))}
          {stars.map(([x, y], k) => (
            <g key={`s${k}`}>
              <circle cx={x} cy={y} r="12" fill={`url(#${uid}s)`} className="twinkle" style={{ animationDelay: `${(i + k) * 0.4}s` }} />
              <circle cx={x} cy={y} r="2.4" fill="#ffffff" />
            </g>
          ))}
        </g>
      ))}
      {roofs.map((rf, i) => (
        <g key={i}>
          <rect x={rf.x} y={rf.y} width={rf.w + 2} height="600" fill="#141a30" />
          <rect x={rf.x} y={rf.y - 8} width={rf.w + 2} height="9" fill="#1c2340" />
          {i % 3 === 0 && <rect x={rf.x + rf.w * 0.4} y={rf.y + 40} width="12" height="16" rx="5" fill="#ffb860" opacity="0.45" />}
        </g>
      ))}
      <g transform={`translate(${figure.x} ${figure.y}) scale(0.6)`}>
        <ellipse cx="0" cy="-48" rx="60" ry="84" fill={`url(#${uid}h)`} opacity="0.7" />
        <g filter={`url(#${uid}f)`}>
          <path d={BODY_PATH} fill="#fff1d2" />
          <circle cx="0" cy="-77" r="9.5" fill="#fffaf0" />
          <path d="M6,-60 Q20,-84 34,-112" stroke="#fffaf0" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
      </g>
    </Svg>
  );
}

/**
 * Close on the work: a great timber across the frame, one hand of light steadying it and another
 * swinging an adze into the wood every `tempo` seconds, chips flying from each stroke.
 */
export function Woodwork({ cfg }) {
  const uid = useUid('ww');
  const { vb, reduced } = useStage();
  const { tempo = 1.1 } = cfg;
  const chips = useMemo(() => {
    const r = rng(31);
    return Array.from({ length: 9 }, () => ({ dx: -40 - r() * 130, dy: -60 - r() * 120, rot: (r() - 0.5) * 300, d: r() * 0.25 }));
  }, []);
  const strike = [930, 500];
  return (
    <Svg>
      <defs>
        <HandDefs uid={uid} />
        <linearGradient id={`${uid}t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b08456" />
          <stop offset="0.5" stopColor="#8a6038" />
          <stop offset="1" stopColor="#5a3c22" />
        </linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fb4d6" />
          <stop offset="1" stopColor="#ead6aa" />
        </linearGradient>
      </defs>
      <rect x={vb[0] - 300} y={vb[1] - 300} width={vb[2] + 600} height={vb[3] + 600} fill={`url(#${uid}s)`} />
      <rect x="-400" y="660" width="2400" height="600" fill="#c9a46e" />
      <g transform="rotate(-8 800 560)">
        <rect x="-300" y="500" width="2300" height="150" fill={`url(#${uid}t)`} />
        {[530, 560, 600, 625].map((gy, i) => (
          <path key={gy} d={`M-300,${gy} C200,${gy - 10 + i * 4} 700,${gy + 8} 1100,${gy - 4} S1700,${gy + 6} 2000,${gy}`} stroke="#4a3020" strokeOpacity="0.4" strokeWidth="2.5" fill="none" />
        ))}
        <path d="M860,500 Q900,516 960,500" stroke="#ecd09e" strokeWidth="6" fill="none" />
      </g>
      <g transform="translate(560 530)">
        <Hand uid={uid} />
      </g>
      <g transform="translate(1060 340)">
        <motion.g animate={reduced ? { rotate: -20 } : { rotate: [-38, -42, 6, 6, -38] }} transition={{ duration: tempo, repeat: Infinity, times: [0, 0.45, 0.58, 0.7, 1], ease: ['easeInOut', 'easeIn', 'linear', 'easeInOut'] }}>
          <rect x="-220" y="-220" width="440" height="440" fill="none" />
          <path d="M0,0 L-118,150" stroke="#6a4a2c" strokeWidth="12" strokeLinecap="round" />
          <path d="M-116,146 L-160,158 L-150,176 L-106,160 Z" fill="#5a5450" />
          <Hand uid={uid} />
        </motion.g>
      </g>
      {!reduced &&
        chips.map((c, i) => (
          <motion.path key={i} d="M0,0 q6,-4 10,2" stroke="#e0b884" strokeWidth="3" fill="none" strokeLinecap="round" initial={{ x: strike[0], y: strike[1], opacity: 0 }} animate={{ x: [strike[0], strike[0] + c.dx], y: [strike[1], strike[1] + c.dy, strike[1] + c.dy + 90], opacity: [0, 1, 0], rotate: c.rot }} transition={{ duration: 0.8, delay: tempo * 0.58 + c.d, repeat: Infinity, repeatDelay: tempo - 0.8 }} />
        ))}
    </Svg>
  );
}
