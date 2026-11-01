// Air and light: skies, stars, sun, god-rays, mist, clouds, the first thread of light,
// the smoke of the young heavens, the seven heavens, and the radiance that stands for
// divine presence (pure light, never a figure).
import { useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Svg, useStage, useUid, usePct } from '../components/stageKit.jsx';
import { rng } from '../lib/geo.js';

const strHash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);

function Glow({ x = 800, y = 600, rx = 700, ry = 300, color = '#ffcf8a', opacity = 0.5 }) {
  const id = useUid('glow');
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity="1" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <motion.ellipse cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${id})`} initial={false} animate={{ opacity }} transition={{ duration: 2.4 }} />
    </>
  );
}

export function Sky({ cfg }) {
  const { vb } = useStage();
  const uid = useUid('sky');
  const stops = cfg.stops || [[0, '#05060c'], [1, '#1b1526']];
  const key = stops.map((s) => s.join(':')).join('|');
  const gid = uid + strHash(key);
  const shift = (cfg.shift ?? 2600) / 1000;
  return (
    <Svg>
      <AnimatePresence initial={false}>
        <motion.g key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.01, delay: shift } }} transition={{ duration: shift, ease: 'easeInOut' }}>
          <defs>
            <linearGradient id={gid} x1="0" y1={cfg.y0 ?? 0} x2="0" y2={cfg.y1 ?? 900} gradientUnits="userSpaceOnUse">
              {stops.map(([o, c], i) => (
                <stop key={i} offset={o} stopColor={c} />
              ))}
            </linearGradient>
          </defs>
          <rect x={vb[0] - 900} y={vb[1] - 900} width={vb[2] + 1800} height={vb[3] + 1800} fill={`url(#${gid})`} />
        </motion.g>
      </AnimatePresence>
      {cfg.glow && <Glow {...cfg.glow} />}
    </Svg>
  );
}

export function Stars({ cfg }) {
  const { count = 180, seed = 7, maxY = 640, color = '#fff6df', size = 1 } = cfg;
  const stars = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => ({
      x: -500 + r() * 2600,
      y: -900 + r() * (maxY + 900),
      s: (0.4 + r() * r() * 2.2) * size,
      d: r() * 5,
      o: 0.35 + r() * 0.65,
    }));
  }, [count, seed, maxY, size]);
  return (
    <Svg>
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill={color} opacity={s.o} className={i % 3 === 0 ? 'twinkle' : undefined} style={{ animationDelay: `${s.d}s` }} />
      ))}
    </Svg>
  );
}

export function Sun({ cfg }) {
  const id = useUid('sun');
  const { x = 800, y = 520, r = 38, color = '#ffe3a3', halo = 7, path, dur = 6000 } = cfg;
  const start = path ? { x: path[0][0], y: path[0][1] } : { x, y };
  const target = path ? { x: path.map((p) => p[0]), y: path.map((p) => p[1]) } : { x, y };
  return (
    <Svg>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity="0.95" />
          <stop offset="0.25" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <motion.g initial={start} animate={target} transition={{ duration: dur / 1000, ease: 'easeInOut' }}>
        <circle r={r * halo} fill={`url(#${id})`} />
        <circle r={r} fill={color} />
      </motion.g>
    </Svg>
  );
}

export function Rays({ cfg }) {
  const id = useUid('rays');
  const { x = 800, y = 0, count = 9, spread = 70, angle = 90, len = 1500, color = '#ffe8b0', seed = 3 } = cfg;
  const wedges = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => {
      const a = ((angle - spread / 2 + (spread * (i + 0.5)) / count + (r() - 0.5) * 6) * Math.PI) / 180;
      const w = ((1 + r() * 2.6) * Math.PI) / 180;
      const p = (ang) => `${(x + Math.cos(ang) * len).toFixed(1)},${(y + Math.sin(ang) * len).toFixed(1)}`;
      return { pts: `${x},${y} ${p(a - w)} ${p(a + w)}`, o: 0.4 + r() * 0.6, d: r() * 4 };
    });
  }, [x, y, count, spread, angle, len, seed]);
  return (
    <Svg>
      <defs>
        <radialGradient id={id} cx={x} cy={y} r={len} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color} stopOpacity="0.9" />
          <stop offset="0.6" stopColor={color} stopOpacity="0.25" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {wedges.map((w, i) => (
        <polygon key={i} points={w.pts} fill={`url(#${id})`} fillOpacity={w.o} className="breathe" style={{ '--t': `${4 + w.d}s`, animationDelay: `${w.d}s` }} />
      ))}
    </Svg>
  );
}

export function Mist({ cfg }) {
  const id = useUid('mist');
  const { y = 640, color = '#efe6d2', bands = 4, spread = 46, h = 70, seed = 2 } = cfg;
  const items = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: bands }, (_, i) => ({ y: y + (i - bands / 2) * spread, x: 300 + r() * 1000, w: 900 + r() * 900, t: 30 + r() * 30, o: 0.35 + r() * 0.5 }));
  }, [y, bands, spread, seed]);
  return (
    <Svg>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity="0.85" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {items.map((m, i) => (
        <g key={i} className="drift" style={{ '--t': `${m.t}s`, animationDelay: `${-i * 7}s` }}>
          <ellipse cx={m.x} cy={m.y} rx={m.w} ry={h} fill={`url(#${id})`} opacity={m.o} />
        </g>
      ))}
    </Svg>
  );
}

export function Clouds({ cfg }) {
  const { vb } = useStage();
  const id = useUid('cl');
  const { y = 260, count = 7, color = '#ece3d0', rim, seed = 11, spanY = 120, scale = 1, enter, enterDur = 7000, part = false, partDelay = 0, rise } = cfg;
  // once parted, `part: false` closes the clouds back over the gap instead of snapping them home
  const parted = useRef(false);
  if (part) parted.current = true;
  const clouds = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => {
      const cx = -300 + ((i + r() * 0.8) / count) * 2200;
      const cy = y + (r() - 0.5) * spanY;
      const w = (260 + r() * 420) * scale;
      const puffs = Array.from({ length: 5 + Math.floor(r() * 4) }, () => ({
        dx: (r() - 0.5) * w,
        dy: (r() - 0.5) * 34 * scale,
        rx: (70 + r() * 120) * scale,
        ry: (26 + r() * 46) * scale,
      }));
      return { cx, cy, puffs, drift: 30 + r() * 70, t: 18 + r() * 22, o: 0.55 + r() * 0.45 };
    });
  }, [y, count, seed, spanY, scale]);
  return (
    <Svg>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity="0.92" />
          <stop offset="0.65" stopColor={color} stopOpacity="0.45" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
        {rim && (
          <radialGradient id={`${id}r`}>
            <stop offset="0" stopColor={rim} stopOpacity="0.8" />
            <stop offset="1" stopColor={rim} stopOpacity="0" />
          </radialGradient>
        )}
      </defs>
      {clouds.map((c, i) => {
        let initial = { x: 0, y: 0 };
        let animate = { x: [-c.drift / 2, c.drift / 2] };
        let transition = { duration: c.t, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' };
        if (enter !== undefined) {
          initial = { x: enter * (0.7 + (i % 3) * 0.15), y: 0 };
          animate = { x: 0 };
          transition = { duration: enterDur / 1000, ease: [0.2, 0.6, 0.3, 1], delay: (i % 4) * 0.25 };
        }
        if (part) {
          animate = { x: c.cx < 800 ? -900 : 900, opacity: 0.4 };
          transition = { duration: 3.2, delay: partDelay / 1000, ease: [0.5, 0, 0.3, 1] };
        } else if (parted.current) {
          animate = { x: 0, opacity: c.o };
          transition = { duration: 4, ease: [0.4, 0, 0.3, 1] };
        }
        if (rise) {
          // a negative `rise` sends the clouds rushing down past a camera climbing through them
          const span = vb[3] + 900;
          const ys = [span / 2 + (i / count) * span, -span / 2];
          if (rise < 0) ys.reverse();
          initial = { x: 0, y: ys[0] };
          animate = { y: ys };
          transition = { duration: (span / Math.abs(rise)) * (1 + i / count), repeat: Infinity, ease: 'linear' };
        }
        return (
          <motion.g key={i} initial={initial} animate={animate} transition={transition} opacity={c.o}>
            {rim && c.puffs.map((p, k) => <ellipse key={`r${k}`} cx={c.cx + p.dx} cy={c.cy + p.dy + p.ry * 0.45} rx={p.rx * 1.05} ry={p.ry} fill={`url(#${id}r)`} />)}
            {c.puffs.map((p, k) => (
              <ellipse key={k} cx={c.cx + p.dx} cy={c.cy + p.dy} rx={p.rx} ry={p.ry} fill={`url(#${id})`} />
            ))}
          </motion.g>
        );
      })}
    </Svg>
  );
}

/** The single golden thread that splits the dark (scene 1). */
export function Thread({ cfg }) {
  const id = useUid('thr');
  const { x = 800, grow = false, split = false } = cfg;
  return (
    <Svg>
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2c4" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff6dc" />
          <stop offset="1" stopColor="#fff2c4" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}f`}>
          <stop offset="0" stopColor="#fff8e4" stopOpacity="0.95" />
          <stop offset="0.4" stopColor="#f3cf86" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f3cf86" stopOpacity="0" />
        </radialGradient>
      </defs>
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
        initial={{ scaleY: 0, scaleX: 1, opacity: 0 }}
        animate={{ scaleY: grow ? 1 : 0, scaleX: split ? 26 : 1, opacity: grow ? (split ? 0 : 1) : 0 }}
        transition={{ duration: split ? 2 : 3.4, ease: [0.6, 0, 0.2, 1] }}
      >
        <rect x={x - 16} y={-400} width={32} height={1700} fill={`url(#${id}c)`} opacity={0.3} />
        <rect x={x - 1.3} y={-400} width={2.6} height={1700} fill={`url(#${id}c)`} />
      </motion.g>
      {split && <motion.circle cx={x} cy={450} fill={`url(#${id}f)`} initial={{ r: 0, opacity: 1 }} animate={{ r: 1500, opacity: 0 }} transition={{ duration: 2.6, ease: 'easeOut' }} />}
    </Svg>
  );
}

/** Smoke and matter turning in a slow spiral; CSS-composited so it stays smooth while it spins. */
export function Nebula({ cfg }) {
  const pct = usePct();
  const { x = 800, y = 450, size = 1.5, colors = ['#2b4c9a', '#b8823e', '#16244f'], spin = 90 } = cfg;
  const [a, b, c] = colors;
  const mask = 'radial-gradient(circle, #000 6%, rgba(0,0,0,.6) 34%, transparent 62%)';
  return (
    <div className="absolute" style={{ ...pct(x, y), width: `${size * 100}vmax`, height: `${size * 100}vmax`, transform: 'translate(-50%, -50%)' }}>
      <div
        className="spin absolute inset-0 rounded-full"
        style={{ '--t': `${spin}s`, background: `conic-gradient(from 0deg, transparent 0 7%, ${a} 15%, transparent 29%, ${b} 41%, transparent 54%, ${c} 67%, transparent 79%, ${b} 90%, transparent)`, filter: 'blur(40px)', maskImage: mask, WebkitMaskImage: mask }}
      />
      <div
        className="spin absolute inset-[16%] rounded-full"
        style={{ '--t': `${spin * 0.55}s`, animationDirection: 'reverse', opacity: 0.85, background: `conic-gradient(from 90deg, transparent 0 12%, ${b} 22%, transparent 36%, ${a} 52%, transparent 66%, #d9a85a 80%, transparent 92%)`, filter: 'blur(26px)', maskImage: mask, WebkitMaskImage: mask }}
      />
      <div className="breathe absolute inset-[40%] rounded-full" style={{ '--t': '4s', background: 'radial-gradient(circle, #fff1c8 0%, rgba(240,200,120,.5) 30%, transparent 70%)', filter: 'blur(10px)' }} />
    </div>
  );
}

/** Seven heavens in layers (67:3): broad translucent bands that arrive one after another. */
export function Heavens({ cfg }) {
  const { cx = 800, cy = 1500, r0 = 960, gap = 64, reveal = true, colors = ['#e6c27a', '#8aa3dc'] } = cfg;
  return (
    <Svg>
      {Array.from({ length: 7 }, (_, i) => {
        const r = r0 + i * gap;
        const d = `M${cx - r * 1.7},${cy} A${r * 1.7} ${r} 0 0 1 ${cx + r * 1.7},${cy}`;
        const t = { duration: 2.4, delay: i * 0.38, ease: 'easeOut' };
        return (
          <g key={i}>
            <motion.path d={d} fill="none" stroke={colors[i % 2]} strokeWidth={gap * 0.55} strokeOpacity={0.05 + (6 - i) * 0.014} initial={{ pathLength: 0 }} animate={{ pathLength: reveal ? 1 : 0 }} transition={t} />
            <motion.path d={d} fill="none" stroke="#fff3cf" strokeWidth={1.2} strokeOpacity={0.4} initial={{ pathLength: 0 }} animate={{ pathLength: reveal ? 1 : 0 }} transition={t} />
          </g>
        );
      })}
    </Svg>
  );
}

/**
 * Divine presence is shown only as light (never a form): a breathing core with slow rays.
 * `harsh` turns it white and wide, for the moment the court's light turns against Iblis.
 */
export function Radiance({ cfg }) {
  const pct = usePct();
  const { x = 800, y = 320, size = 0.95, intensity = 1, rays = true, harsh = false } = cfg;
  const mask = 'radial-gradient(circle, #000 4%, transparent 62%)';
  return (
    <motion.div
      className="absolute"
      style={{ ...pct(x, y), width: `${size * 100}vmax`, height: `${size * 100}vmax`, x: '-50%', y: '-50%' }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: intensity, scale: harsh ? 1.35 : 1 }}
      transition={{ duration: 2.4, ease: 'easeInOut' }}
    >
      {rays && (
        <div className="spin absolute inset-0 rounded-full" style={{ '--t': '160s', background: 'repeating-conic-gradient(from 0deg, rgba(255,240,205,.2) 0deg 2.5deg, transparent 2.5deg 13deg)', maskImage: mask, WebkitMaskImage: mask }} />
      )}
      <div
        className="breathe absolute inset-[18%] rounded-full"
        style={{ '--t': '6s', background: `radial-gradient(circle, #ffffff 0%, ${harsh ? 'rgba(255,255,255,.9)' : 'rgba(255,236,180,.8)'} 18%, rgba(230,180,90,.22) 46%, transparent 70%)`, filter: 'blur(6px)' }}
      />
    </motion.div>
  );
}

export function Tint({ cfg }) {
  return <div className="absolute inset-0" style={{ background: cfg.color || '#000', opacity: cfg.amount ?? 0.3 }} />;
}

/** Real artwork drop-in: replace procedural layers with generated paintings when they exist. */
export function ImageLayer({ cfg }) {
  return <img src={cfg.src} alt="" className="absolute inset-0 h-full w-full" style={{ objectFit: cfg.fit || 'cover', objectPosition: cfg.position || '50% 50%' }} />;
}
