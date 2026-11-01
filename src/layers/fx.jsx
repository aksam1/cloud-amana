// Effects: calligraphy, the names, the whisper, the fall, beams, lightning, the ink drop,
// and the scroll of light.
import { useEffect, useMemo } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTime, useTransform } from 'motion/react';
import { Svg, useStage, useUid } from '../components/stageKit.jsx';
import { arabicWords } from '../lib/story.js';
import { FLAME_PATH, branches, mixColor, rng, sampleCurve, smoothPath } from '../lib/geo.js';

const FONTS = { quran: '"Amiri Quran", Amiri, serif', ruqaa: '"Aref Ruqaa", Amiri, serif' };

/**
 * Arabic written into the scene. The reveal travels right-to-left like a pen; Quran text always
 * comes from the verified ayah data by word range (`ref` + `ar`), never typed into scene files.
 * Two voices for spoken words: `drip` sets them heavy, outlined and running like wax (the proud);
 * `waver` makes them faint and unsteady (a voice that turns away). `pen` and `carve` write word by word
 * (see InkWords).
 */
export function Calligraphy({ cfg }) {
  const uid = useUid('cal');
  const { x = 800, y = 250, size = 64, color = '#f3d28a', font = 'quran', write = true, dur = 3400, delay = 0, w = 900, arc, rise, glow = true, drip = false, waver = false, pen = false, carve = false } = cfg;
  const text = cfg.text || arabicWords(cfg.ref, cfg.ar);
  const family = FONTS[font] || FONTS.quran;
  const drips = useMemo(() => {
    if (!drip) return [];
    const r = rng(Math.round(x + y));
    const n = Math.max(4, Math.round(w / (size * 0.8)));
    return Array.from({ length: n }, (_, i) => ({ x: x - w / 2 + ((i + 0.3 + r() * 0.4) * w) / n, len: size * (0.3 + r() * 0.5), d: r() * 3, t: 2.6 + r() * 1.8 }));
  }, [drip, x, y, w, size]);
  if ((pen || carve) && !arc && !rise) return <InkWords cfg={cfg} text={text} family={family} uid={uid} />;

  if (rise) {
    const words = text.split(/\s+/);
    return (
      <Svg>
        {words.map((wd, i) => (
          <motion.text key={i} x={x + (i - (words.length - 1) / 2) * -size * 1.6} y={y} fontFamily={family} fontSize={size} fill={color} textAnchor="middle" initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 0], y: -320 }} transition={{ duration: 5.5, delay: delay / 1000 + i * 0.55, ease: 'easeOut' }}>
            {wd}
          </motion.text>
        ))}
      </Svg>
    );
  }

  const pathId = `${uid}p`;
  const body = arc ? (
    <text fontFamily={family} fontSize={size} fill={color}>
      <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
        {text}
      </textPath>
    </text>
  ) : (
    <text x={x} y={y} fontFamily={family} fontSize={size} fill={color} textAnchor="middle" stroke={drip ? '#3a1c08' : undefined} strokeWidth={drip ? size * 0.05 : undefined} paintOrder="stroke">
      {text}
    </text>
  );
  const span = arc ? arc.r * 2 + 200 : w;
  return (
    <Svg>
      <defs>
        {arc && <path id={pathId} d={`M${x - arc.r},${arc.cy} A${arc.r} ${arc.r * (arc.flat ?? 0.5)} 0 0 1 ${x + arc.r},${arc.cy}`} />}
        <linearGradient id={`${uid}g`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.18" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="8000" height="8000">
          <motion.rect y={-3000} height={8000} width={span + 280} fill={`url(#${uid}g)`} initial={{ x: x + span / 2 }} animate={{ x: write ? x - span / 2 - 280 : x + span / 2 }} transition={{ duration: dur / 1000, delay: delay / 1000, ease: [0.45, 0.05, 0.3, 1] }} />
        </mask>
        {glow && (
          <filter id={`${uid}f`} x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation={size * 0.14} />
          </filter>
        )}
        {waver && (
          <filter id={`${uid}w`} x="-10%" y="-40%" width="120%" height="180%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="4">
              <animate attributeName="baseFrequency" values="0.012;0.03;0.012" dur="3.6s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale={size * 0.16} />
          </filter>
        )}
      </defs>
      <g mask={`url(#${uid}m)`}>
        <g filter={waver ? `url(#${uid}w)` : undefined} className={waver ? 'flicker' : undefined} opacity={waver ? 0.62 : 1}>
          {glow && (
            <g filter={`url(#${uid}f)`} opacity="0.75">
              {body}
            </g>
          )}
          {body}
        </g>
        {drips.map((d, i) => (
          <g key={i} transform={`translate(${d.x.toFixed(1)} ${(y + size * 0.1).toFixed(1)})`}>
            <motion.path d={`M-3,0 C-3,${d.len * 0.5} -1.5,${d.len * 0.8} 0,${d.len} C1.5,${d.len * 0.8} 3,${d.len * 0.5} 3,0 Z`} fill={color} stroke="#3a1c08" strokeWidth="0.8" style={{ originY: 0 }} initial={{ scaleY: 0 }} animate={{ scaleY: [0, 1, 1] }} transition={{ duration: d.t, delay: dur / 1000 + d.d, repeat: Infinity, repeatDelay: 1.2, times: [0, 0.6, 1] }} />
            <motion.circle cx="0" r="2.6" fill={color} initial={{ cy: d.len, opacity: 0 }} animate={{ cy: [d.len, d.len + size * 1.4], opacity: [0, 0.9, 0] }} transition={{ duration: 1.3, delay: dur / 1000 + d.d + d.t * 0.6, repeat: Infinity, repeatDelay: d.t * 0.4 + 1.2, ease: 'easeIn' }} />
          </g>
        ))}
      </g>
    </Svg>
  );
}

/**
 * Arabic written word by word, right to left, as a pen moves. `pen`: each word's outline is traced in
 * thick wet ink that thins as the letters fill. `carve`: the words are cut into stone instead (heavy,
 * chiselled, their cut shadowed) and `crack` {delay, dur, n} splits hairlines across them. `recede`
 * {to, dur, delay, fade} shrinks the writing away, as if the camera were leaving it behind. (A glyph's
 * true stroke order is not in any font, so its outline stands in for it.)
 */
function InkWords({ cfg, text, family, uid }) {
  const { x = 800, y = 250, size = 64, color = '#f3d28a', dur = 3400, delay = 0, w = 900, glow = true, carve = false, crack, recede } = cfg;
  const words = text.split(/\s+/).filter(Boolean);
  const per = dur / 1000 / Math.max(1, words.length);
  const trace = size * 14;
  const cracks = useMemo(() => {
    if (!crack) return [];
    const r = rng(Math.round(x * 3 + y));
    return Array.from({ length: crack.n ?? 5 }, () => {
      let px = x + (r() - 0.5) * w * 0.85;
      let py = y - size * (0.15 + r() * 0.7);
      let d = `M${px.toFixed(1)},${py.toFixed(1)}`;
      const dir = r() < 0.5 ? -1 : 1;
      for (let k = 0, n = 5 + Math.floor(r() * 4); k < n; k++) {
        px += dir * size * (0.1 + r() * 0.25);
        py += (r() - 0.4) * size * 0.35;
        d += ` L${px.toFixed(1)},${py.toFixed(1)}`;
      }
      return d;
    });
  }, [crack, x, y, w, size]);
  const at = (i) => delay / 1000 + i * per * 0.85;
  const line = (children, props = {}) => (
    <text x={x} y={y} fontFamily={family} fontSize={size} textAnchor="middle" direction="rtl" {...props}>
      {children}
    </text>
  );
  const shown = (i, extra = {}) => ({ initial: { fillOpacity: 0, ...extra.from }, animate: { fillOpacity: 1, ...extra.to }, transition: { duration: per * 1.6, delay: at(i), ease: 'easeOut' } });
  return (
    <Svg>
      <defs>
        {carve && (
          <linearGradient id={`${uid}s`} x1="0" y1={y - size} x2="0" y2={y + size * 0.3} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={mixColor(color, '#ffffff', 0.35)} />
            <stop offset="0.55" stopColor={color} />
            <stop offset="1" stopColor={mixColor(color, '#000000', 0.45)} />
          </linearGradient>
        )}
        {glow && !carve && (
          <filter id={`${uid}f`} x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={size * 0.12} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
        {crack && (
          <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="8000" height="8000">
            {line(text, { fill: '#fff' })}
          </mask>
        )}
      </defs>
      <motion.g initial={{ scale: 1, opacity: 1 }} animate={recede ? { scale: recede.to ?? 0.5, opacity: recede.fade ?? 0.6 } : { scale: 1, opacity: 1 }} transition={{ duration: (recede?.dur ?? 8000) / 1000, delay: (recede?.delay ?? 0) / 1000, ease: [0.4, 0, 0.2, 1] }}>
        {carve ? (
          <>
            {line(
              words.map((wd, i) => (
                <motion.tspan key={i} fill="#1a0f0a" {...shown(i)}>
                  {wd}{' '}
                </motion.tspan>
              )),
              { dx: size * 0.05, dy: size * 0.06, opacity: 0.6 },
            )}
            {line(
              words.map((wd, i) => (
                <motion.tspan key={i} fill={`url(#${uid}s)`} stroke="#2a1a10" strokeWidth={size * 0.015} {...shown(i)}>
                  {wd}{' '}
                </motion.tspan>
              )),
            )}
          </>
        ) : (
          line(
              words.map((wd, i) => (
                <motion.tspan key={i} fill={color} stroke={color} strokeLinejoin="round" style={{ strokeDasharray: trace }} {...shown(i, { from: { strokeDashoffset: trace, strokeWidth: size * 0.07 }, to: { strokeDashoffset: 0, strokeWidth: size * 0.01 } })}>
                  {wd}{' '}
                </motion.tspan>
              )),
              { filter: glow ? `url(#${uid}f)` : undefined },
            )
        )}
        {crack && (
          <g mask={`url(#${uid}k)`}>
            {cracks.map((d, i) => (
              <motion.path key={i} d={d} stroke="#140c08" strokeWidth={size * 0.028} fill="none" strokeLinejoin="bevel" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: (crack.dur ?? 2400) / 1000, delay: (crack.delay ?? dur) / 1000 + i * 0.3, ease: 'easeOut' }} />
            ))}
          </g>
        )}
      </motion.g>
    </Svg>
  );
}

function OrbitWord({ word, i, n, time, x, y, rx, ry, period, size, color, show }) {
  const a0 = (i / n) * Math.PI * 2;
  const ang = useTransform(time, (t) => a0 + (t / 1000 / period) * Math.PI * 2);
  const tx = useTransform(ang, (a) => x + Math.cos(a) * rx);
  const ty = useTransform(ang, (a) => y + Math.sin(a) * ry);
  const sc = useTransform(ang, (a) => 0.65 + 0.4 * ((Math.sin(a) + 1) / 2));
  const op = useTransform(ang, (a) => 0.3 + 0.7 * ((Math.sin(a) + 1) / 2));
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 1.2, delay: show ? i * 0.35 : 0 }}>
      <motion.g style={{ x: tx, y: ty, scale: sc, opacity: op }}>
        <text fontFamily={FONTS.ruqaa} fontSize={size} fill={color} textAnchor="middle" dominantBaseline="middle">
          {word}
        </text>
      </motion.g>
    </motion.g>
  );
}

/** The names of all things (2:31) circling Adam's silhouette — names the angels could not give. */
export function Orbit({ cfg }) {
  const time = useTime();
  const { x = 800, y = 520, rx = 280, ry = 70, period = 28, size = 30, color = '#f6dfa4', show = true } = cfg;
  const words = cfg.words || ['سماء', 'أرض', 'ماء', 'نار', 'شجرة', 'نجم', 'جبل', 'طير', 'بحر', 'قمر', 'شمس', 'ريح'];
  return (
    <Svg>
      {words.map((wd, i) => (
        <OrbitWord key={i} word={wd} i={i} n={words.length} time={time} x={x} y={y} rx={rx} ry={ry} period={period} size={size} color={color} show={show} />
      ))}
    </Svg>
  );
}

const LETTERS = 'بتثجحخسشصضطظعغفقكمنهي';

/**
 * The whisper: a thin snake of smoke. Its "script" is random isolated letters, mirrored and
 * blurred, so it can never be read as words.
 */
export function Wisp({ cfg }) {
  const uid = useUid('wsp');
  const { points = [[200, 700], [500, 640], [700, 600]], wrap, width = 9, color = '#0d0a0b', draw = true, dur = 4200, script = false, seed = 13 } = cfg;
  const pts = useMemo(() => {
    if (!wrap) return points;
    const { x, y, r = 40, turns = 1.4 } = wrap;
    const spiral = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 11) * turns * Math.PI * 2;
      const rr = r * (1 - i / 16);
      return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.6];
    });
    return [...points, ...spiral];
  }, [points, wrap]);
  const d = useMemo(() => smoothPath(pts), [pts]);
  const glyphs = useMemo(() => {
    if (!script) return [];
    const r = rng(seed);
    return sampleCurve(pts, 12).map(([gx, gy]) => ({
      x: gx + (r() - 0.5) * 40,
      y: gy - 20 + (r() - 0.5) * 30,
      ch: Array.from({ length: 3 }, () => LETTERS[Math.floor(r() * LETTERS.length)]).join('‌'),
      rot: (r() - 0.5) * 90,
      sk: (r() - 0.5) * 50,
      d: r() * 3,
    }));
  }, [pts, script, seed]);
  const t = { duration: dur / 1000, ease: 'easeInOut' };
  return (
    <Svg>
      <defs>
        <filter id={`${uid}f`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <g className="wiggle">
        <motion.path d={d} fill="none" stroke={color} strokeWidth={width * 3.4} strokeLinecap="round" opacity={0.28} filter={`url(#${uid}f)`} initial={{ pathLength: 0 }} animate={{ pathLength: draw ? 1 : 0 }} transition={t} />
        <motion.path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" opacity={0.8} initial={{ pathLength: 0 }} animate={{ pathLength: draw ? 1 : 0 }} transition={t} />
        <motion.path d={d} fill="none" stroke="#4a3846" strokeWidth={width * 0.3} strokeLinecap="round" opacity={0.6} initial={{ pathLength: 0 }} animate={{ pathLength: draw ? 1 : 0 }} transition={t} />
      </g>
      {glyphs.map((g, i) => (
        <g key={i} transform={`translate(${g.x.toFixed(1)} ${g.y.toFixed(1)}) rotate(${g.rot.toFixed(1)}) skewX(${g.sk.toFixed(1)}) scale(-1 1)`}>
          <motion.text fontFamily="Amiri, serif" fontSize="26" fill="#7a6577" style={{ filter: 'blur(1.4px)' }} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.7, 0] }} transition={{ duration: 2.2, delay: 1 + g.d, repeat: Infinity, repeatDelay: 1.2 }}>
            {g.ch}
          </motion.text>
        </g>
      ))}
    </Svg>
  );
}

/**
 * Guidance carried as light: faint letters drift up from `from` [x, y] like smoke and settle over
 * `area` [x0, y0, x1, y1], then fade (single letters, never words). `wave` sends them outward from
 * `from` across the area instead, behind a soft ring of light, like a gentle wave.
 */
export function Guidance({ cfg }) {
  const uid = useUid('gdn');
  const { reduced } = useStage();
  const { from = [800, 600], area = [600, 620, 1000, 720], count = 18, color = '#ffe6a6', size = 26, wave = false, seed = 19 } = cfg;
  const glyphs = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => {
      const tx = area[0] + r() * (area[2] - area[0]);
      const ty = area[1] + r() * (area[3] - area[1]);
      const mx = wave ? (from[0] + tx) / 2 : (from[0] + tx) / 2 + (r() - 0.5) * 160;
      const my = wave ? (from[1] + ty) / 2 - 20 : Math.min(from[1], ty) - 60 - r() * 120;
      return { tx, ty, mx, my, ch: LETTERS[Math.floor(r() * LETTERS.length)], d: (i / count) * 5 + r() * 0.8, t: 4.5 + r() * 2, rot: (r() - 0.5) * 30 };
    });
  }, [from, area, count, wave, seed]);
  if (reduced) return null;
  return (
    <Svg>
      <defs>
        <filter id={`${uid}f`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {wave && (
        <motion.ellipse cx={from[0]} cy={from[1]} fill="none" stroke={color} strokeWidth="3" initial={{ rx: 10, ry: 4, opacity: 0 }} animate={{ rx: [10, (area[2] - area[0]) * 0.6], ry: [4, (area[3] - area[1]) * 0.7], opacity: [0.7, 0] }} transition={{ duration: 3.4, repeat: Infinity, repeatDelay: 0.8, ease: 'easeOut' }} filter={`url(#${uid}f)`} />
      )}
      {glyphs.map((g, i) => (
        <motion.g key={i} initial={{ x: from[0], y: from[1], opacity: 0 }} animate={{ x: [from[0], g.mx, g.tx], y: [from[1], g.my, g.ty], opacity: [0, 0.9, 0.7, 0] }} transition={{ duration: g.t, delay: g.d, repeat: Infinity, repeatDelay: 1.5, ease: 'easeOut', opacity: { duration: g.t, delay: g.d, repeat: Infinity, repeatDelay: 1.5, times: [0, 0.25, 0.75, 1] } }}>
          <g transform={`rotate(${g.rot.toFixed(1)})`}>
            <text fontFamily="Amiri, serif" fontSize={size * 1.2} fill={color} textAnchor="middle" filter={`url(#${uid}f)`} opacity="0.7">
              {g.ch}
            </text>
            <text fontFamily="Amiri, serif" fontSize={size} fill="#fff6dc" textAnchor="middle">
              {g.ch}
            </text>
          </g>
        </motion.g>
      ))}
    </Svg>
  );
}

/** Something falling (or descending) along a curve, leaving a trail: Iblis like a meteor of smoke. */
export function Trail({ cfg }) {
  const uid = useUid('trl');
  const { from = { x: 820, y: -200 }, to = { x: 760, y: 1100 }, go = true, dur = 4000, kind = 'smoke', size = 1, bend = 140 } = cfg;
  const mid = { x: (from.x + to.x) / 2 + bend, y: (from.y + to.y) / 2 };
  const d = `M${from.x},${from.y} Q${mid.x},${mid.y} ${to.x},${to.y}`;
  const p = useMotionValue(0);
  useEffect(() => {
    if (!go) return undefined;
    const c = animate(p, 1, { duration: dur / 1000, ease: [0.55, 0, 0.85, 0.65] });
    return () => c.stop();
  }, [go, dur, p]);
  const q = (a, b, c, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
  const hx = useTransform(p, (t) => q(from.x, mid.x, to.x, t));
  const hy = useTransform(p, (t) => q(from.y, mid.y, to.y, t));
  const smoke = kind === 'smoke';
  return (
    <Svg>
      <defs>
        <filter id={`${uid}f`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <motion.path d={d} fill="none" stroke={smoke ? '#140f0f' : '#ffe9b8'} strokeWidth={42 * size} strokeLinecap="round" opacity={smoke ? 0.5 : 0.25} filter={`url(#${uid}f)`} style={{ pathLength: p }} />
      <motion.path d={d} fill="none" stroke={smoke ? '#3a1c14' : '#fff6dc'} strokeWidth={7 * size} strokeLinecap="round" opacity={0.7} style={{ pathLength: p }} />
      <motion.g style={{ x: hx, y: hy }}>
        <g transform={`scale(${size}) rotate(180)`}>
          {smoke ? (
            <g className="flicker">
              <path d={FLAME_PATH} fill="#ff4a1a" opacity="0.5" filter={`url(#${uid}f)`} transform="scale(0.5)" />
              <path d={FLAME_PATH} fill="#2a0e0a" transform="scale(0.36)" />
              <path d={FLAME_PATH} fill="none" stroke="#ff6a2a" strokeWidth="5" transform="scale(0.36)" />
            </g>
          ) : (
            <circle r="14" fill="#fff6dc" filter={`url(#${uid}f)`} />
          )}
        </g>
      </motion.g>
    </Svg>
  );
}

/** A column of light from above. `fire` makes it the pillar of white fire over the offering. */
export function Beam({ cfg }) {
  const uid = useUid('bm');
  const { vb } = useStage();
  // `top` reaches higher than the screen's edge for scenes whose camera tilts up the column
  const { x = 800, y = 640, w = 120, color = '#fff6dc', on = true, fire = false, dur = 1300, top = vb[1] - 200 } = cfg;
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="0.5" stopColor={color} stopOpacity="0.95" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${uid}r`}>
          <stop offset="0" stopColor={color} stopOpacity="0.95" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <motion.g style={{ originX: 0.5, originY: 0 }} initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: dur / 1000, ease: [0.7, 0, 0.3, 1] }}>
        <rect x={x - w * 1.7} y={top} width={w * 3.4} height={y - top} fill={`url(#${uid}g)`} opacity="0.35" />
        <rect x={x - w / 2} y={top} width={w} height={y - top} fill={`url(#${uid}g)`} />
      </motion.g>
      {fire && on && (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: dur / 1000 }}>
          {[-0.45, -0.2, 0, 0.22, 0.42].map((k, i) => (
            <g key={i} transform={`translate(${x + k * w * 1.6} ${y - 30}) scale(${1.4 + (2 - Math.abs(i - 2)) * 0.5})`}>
              <path d={FLAME_PATH} fill={i === 2 ? '#ffffff' : '#fff1cf'} opacity={0.9} className="flame" style={{ animationDelay: `${-i * 0.2}s` }} />
            </g>
          ))}
        </motion.g>
      )}
      <motion.ellipse cx={x} cy={y - 10} rx={w * 2.4} ry={w * 0.55} fill={`url(#${uid}r)`} initial={{ opacity: 0 }} animate={{ opacity: on ? 0.9 : 0 }} transition={{ delay: on ? (dur / 1000) * 0.8 : 0, duration: 0.8 }} />
    </Svg>
  );
}

export function Lightning({ cfg }) {
  const { flash = 0, x = 980, seed = 4 } = cfg;
  const bolt = useMemo(() => {
    const r = rng(seed + flash);
    const pts = [[x, -400]];
    for (let i = 0; i < 12; i++) pts.push([pts.at(-1)[0] + (r() - 0.5) * 90, pts.at(-1)[1] + 70]);
    return `M${pts.map((p) => p.join(',')).join(' L')}`;
  }, [flash, x, seed]);
  return (
    <AnimatePresence>
      {flash > 0 && (
        <motion.div key={flash} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.12, 0.85, 0] }} transition={{ duration: 1, times: [0, 0.07, 0.24, 0.33, 1] }}>
          <div className="absolute inset-0 bg-[#f7f4ff]" />
          <Svg>
            <path d={bolt} stroke="#ffffff" strokeWidth="5" fill="none" />
          </Svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const TEAR = 'M0,-24 C6,-11 10,-3 10,4 C10,11 5.5,15 0,15 C-5.5,15 -10,11 -10,4 C-10,-3 -6,-11 0,-24 Z';

/**
 * Violence is never shown. A single drop of dark red ink falls onto blank parchment and spreads
 * in veins; that is all.
 */
export function InkDrop({ cfg }) {
  const { vb } = useStage();
  const { x = 800, y = 470, color = '#5c0e09', drop = true } = cfg;
  const veins = useMemo(() => {
    const r = rng(90);
    return Array.from({ length: 9 }, (_, k) => branches({ x, y, angle: k * 40 + r() * 20, len: 50 + r() * 60, depth: 3, seed: 30 + k, spread: 36, width: 3.4, shrink: 0.7 })).flat();
  }, [x, y]);
  return (
    <div className="parchment absolute inset-0">
      <Svg>
        <motion.path d={TEAR} fill={color} initial={{ x, y: vb[1] - 80, opacity: 1 }} animate={drop ? { y, opacity: [1, 1, 0] } : {}} transition={{ duration: 2.4, ease: [0.5, 0, 0.9, 0.5], opacity: { duration: 2.45, times: [0, 0.98, 1] } }} />
        <motion.circle cx={x} cy={y} fill={color} initial={{ r: 0 }} animate={drop ? { r: [0, 22, 30] } : {}} transition={{ delay: 2.4, duration: 2.8, ease: 'easeOut' }} />
        {veins.map((v, i) => (
          <motion.path key={i} d={v.d} stroke={color} strokeWidth={v.w} fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={drop ? { pathLength: 1 } : {}} transition={{ delay: 2.5 + (3 - v.depth) * 0.55, duration: 1.8, ease: 'easeOut' }} />
        ))}
      </Svg>
    </div>
  );
}

/**
 * The scroll of light passed from Adam to Shith; its light can flood the screen (`flood`), or begin as a
 * flood that gathers back into the scroll (`flood: "out"`), picking up where the last scene left off.
 */
export function Scroll({ cfg }) {
  const uid = useUid('scr');
  const { from = { x: 790, y: 600 }, to = { x: 900, y: 610 }, pass = false, bright = false, flood = false, s = 1 } = cfg;
  const at = pass ? to : from;
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor="#fff8e4" stopOpacity="0.95" />
          <stop offset="0.4" stopColor="#ffe2a0" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffe2a0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <motion.g initial={{ x: from.x, y: from.y, scale: 0.6 * s, opacity: 0 }} animate={{ x: at.x, y: at.y, scale: (bright ? 1.3 : 1) * s, opacity: 1 }} transition={{ duration: 2.8, ease: 'easeInOut' }}>
        <motion.circle r="70" fill={`url(#${uid}g)`} animate={{ opacity: bright ? 1 : 0.55 }} transition={{ duration: 2 }} />
        <rect x="-26" y="-10" width="52" height="20" rx="4" fill="#fff3d0" />
        <circle cx="-27" cy="0" r="7" fill="#f3d48b" />
        <circle cx="27" cy="0" r="7" fill="#f3d48b" />
        {[-4, 1, 6].map((ly, i) => (
          <motion.line key={i} x1="-17" x2="17" y1={ly} y2={ly} stroke="#c8913e" strokeWidth="1.3" initial={{ pathLength: 0 }} animate={{ pathLength: bright ? 1 : 0.4 }} transition={{ duration: 1.6, delay: i * 0.3 }} />
        ))}
      </motion.g>
      {flood === 'out' && <motion.circle cx={at.x} cy={at.y} fill="#fffaf0" initial={{ r: 2600, opacity: 1 }} animate={{ r: 0, opacity: 0.5 }} transition={{ duration: 3.4, delay: 0.5, ease: [0.5, 0, 0.3, 1] }} />}
      {flood && flood !== 'out' && <motion.circle cx={to.x} cy={to.y} fill="#fffaf0" initial={{ r: 0, opacity: 0.9 }} animate={{ r: 2600, opacity: 1 }} transition={{ duration: 2.6, ease: [0.6, 0, 0.4, 1] }} />}
    </Svg>
  );
}

const DIGITS = '٠١٢٣٤٥٦٧٨٩';

/**
 * Days and nights counted in a storm: Arabic numerals that appear and fade one after another, `every` ms
 * apart, day and night in turn (day one, night one, day two…), each somewhere in `area` [x0, y0, x1, y1].
 * Set `every` to half the world's `cycle` period and they keep time with the light.
 */
export function Numerals({ cfg }) {
  const { reduced } = useStage();
  const { days = 8, nights = 7, every = 1300, delay = 0, size = 120, day = '#e8dcc0', night = '#9fb4d0', area = [300, 160, 1300, 480], seed = 8 } = cfg;
  const items = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: days + nights }, (_, i) => ({
      text: String(Math.floor(i / 2) + 1).replace(/\d/g, (d) => DIGITS[d]),
      isDay: i % 2 === 0,
      x: area[0] + r() * (area[2] - area[0]),
      y: area[1] + r() * (area[3] - area[1]),
      at: delay / 1000 + (i * every) / 1000,
    }));
  }, [days, nights, every, delay, area, seed]);
  const shown = reduced ? items.slice(-2) : items;
  return (
    <Svg>
      {shown.map((it, i) => (
        <motion.text key={i} x={it.x} y={it.y} fontFamily={FONTS.quran} fontSize={size * (it.isDay ? 1 : 0.85)} fill={it.isDay ? day : night} textAnchor="middle" style={{ filter: `drop-shadow(0 0 ${size * 0.15}px ${it.isDay ? day : night})` }} initial={{ opacity: reduced ? 0.7 : 0, scale: 0.92 }} animate={reduced ? { opacity: 0.7, scale: 1 } : { opacity: [0, 0.85, 0], scale: [0.92, 1, 1.06] }} transition={reduced ? { duration: 0.6 } : { duration: (every * 2.2) / 1000, delay: it.at, times: [0, 0.3, 1], ease: 'easeOut' }}>
          {it.text}
        </motion.text>
      ))}
    </Svg>
  );
}
