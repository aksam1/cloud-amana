// Built places of the generations after Adam, seen at eye level: towns that grow from huts to walled
// villages to towns with stone gateways and marble terraces, a narrow street at night, a workroom in
// daylight, market stalls, and the five statues raised in a square.
import { useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { Svg, useStage, useUid } from '../components/stageKit.jsx';
import { FLAME_PATH, lerp, mixColor, rng } from '../lib/geo.js';

const TIMBER = '#4a3324';
const NIGHT = '#1b2033';

// ── Towns ────────────────────────────────────────────────

/**
 * The build grades, oldest first. Each one belongs to an age, and the age is what it looks like:
 * the roof form, the wall material, how high the buildings stand and how the town is walled.
 *
 *   hut       Adam's valley — domed huts of branch and reed
 *   village   the first settlements — low mud-brick, flat or pitched roofs
 *   town      Sumer, Madyan, Sodom — mud-brick, flat roofs, a corner tower now and then
 *   city      Egypt — ochre limestone, river terraces, pylon gates
 *   assyrian  Nineveh — crenellated mud-brick on ziggurat platforms
 *   israelite Dawud and Sulayman — dressed limestone, terraced roofs
 *   galilaean Bethlehem and Galilee — lime-plastered stone, low and plain
 *   desert    Madyan's trading town — sun-dried brick, very low, tan
 *
 * `tall` is how often a tower rises among them, and `tallMul` how far it goes above the roofs: a
 * mud-brick town's tower is a watch-tower, not a skyscraper.
 */
const GRADES = {
  hut: { h: [44, 62], w: [64, 92], wall: '#7a6248', roof: '#6a5238', kinds: ['dome'], tall: 0, tallMul: 1, wallStyle: 'palisade' },
  village: { h: [62, 92], w: [80, 120], wall: '#94806a', roof: '#a88e5e', kinds: ['gable', 'flat'], tall: 0.04, tallMul: 1.25, wallStyle: 'palisade' },
  town: { h: [84, 150], w: [86, 140], wall: '#a8916e', roof: '#8a7456', kinds: ['flat', 'merlon', 'gable'], tall: 0.12, tallMul: 1.45, wallStyle: 'brick' },
  city: { h: [110, 180], w: [100, 170], wall: '#d6c39e', roof: '#bda882', kinds: ['portico', 'terrace', 'flat'], tall: 0.08, tallMul: 1.4, wallStyle: 'ashlar' },
  assyrian: { h: [96, 170], w: [88, 150], wall: '#b09372', roof: '#9c7a52', kinds: ['merlon', 'flat', 'terrace'], tall: 0.14, tallMul: 1.5, wallStyle: 'brick' },
  israelite: { h: [80, 140], w: [84, 130], wall: '#cfc4ae', roof: '#a89474', kinds: ['flat', 'terrace', 'gable'], tall: 0.05, tallMul: 1.3, wallStyle: 'ashlar' },
  galilaean: { h: [60, 100], w: [72, 110], wall: '#d6cdb8', roof: '#b8ab90', kinds: ['flat', 'gable'], tall: 0, tallMul: 1, wallStyle: 'ashlar' },
  desert: { h: [55, 90], w: [64, 100], wall: '#c2a179', roof: '#a8875e', kinds: ['flat', 'gable'], tall: 0.03, tallMul: 1.2, wallStyle: 'brick' },
};

function buildRow({ x0, x1, s, grade, seed }) {
  const G = GRADES[grade] || GRADES.town;
  const r = rng(seed);
  const out = [];
  let x = x0 + r() * 20;
  while (x < x1) {
    const w = lerp(G.w[0], G.w[1], r()) * s;
    const tall = r() < G.tall;
    const h = lerp(G.h[0], G.h[1], r()) * s * (tall ? G.tallMul : 1);
    // the grade's own roof forms, with the tower standing among them
    const kinds = G.kinds;
    let kind = kinds[Math.floor(r() * kinds.length)];
    if (tall) kind = 'tower';
    out.push({ x, w, h, kind, door: r(), win: r(), smoke: r() });
    x += w + lerp(4, 18, r()) * s;
  }
  return out;
}

function Building({ b, y, pal, night, lit, uid, shade, ruin = 0 }) {
  const { x, w } = b;
  // `ruin` breaks the walls off at uneven heights, some buildings far more than others
  const broken = ruin * (0.35 + b.smoke * 0.65);
  const h = broken > 0.04 ? b.h * (1 - broken * 0.6) : b.h;
  const kind = broken > 0.04 ? 'ruin' : b.kind;
  const sideW = w * 0.16 * shade;
  const wall = pal.wall;
  const side = mixColor(wall, '#000000', 0.32);
  const roof = pal.roof;
  const glow = night ? lit : 0;
  const doorW = Math.min(26, w * 0.24);
  const doorX = x + w * (0.25 + b.door * 0.5) - doorW / 2;
  const doorH = Math.min(h * 0.55, doorW * 1.9);
  const cols = Math.max(3, Math.round(w / 32));
  const door =`M${doorX},${y} L${doorX},${y - doorH + doorW / 2} Q${doorX + doorW / 2},${y - doorH - doorW * 0.15} ${doorX + doorW},${y - doorH + doorW / 2} L${doorX + doorW},${y} Z`;
  const windows = [];
  if (kind !== 'dome') {
    const rows = Math.max(1, Math.floor(h / 55));
    for (let k = 0; k < rows; k++) {
      const wy = y - doorH - 14 - k * 46;
      if (wy < y - h + 14) break;
      [0.22, 0.72].forEach((u, j) => (b.win + j * 0.37 + k * 0.21) % 1 > 0.35 && windows.push({ x: x + w * u - 5, y: wy - 12, lit: (b.win * 7 + j + k) % 1 > 0.4 }));
    }
  }
  const body = () => {
    if (kind === 'dome') {
      return <path d={`M${x},${y} C${x},${y - h * 0.8} ${x + w * 0.2},${y - h} ${x + w / 2},${y - h} C${x + w * 0.8},${y - h} ${x + w},${y - h * 0.8} ${x + w},${y} Z`} fill={wall} />;
    }
    if (kind === 'ruin') {
      const jag = [0, 0.2, 0.38, 0.6, 0.8, 1].map((u, i) => [x + w * u, y - h + ((b.win * 7 + i * 3.1) % 1) * h * (i % 2 ? 0.24 : 0.08)]);
      const end = jag.at(-1)[1];
      return (
        <>
          <path d={`M${x + w},${y} L${x + w},${end} L${x + w + sideW},${end - sideW * 0.5} L${x + w + sideW},${y - sideW * 0.2} Z`} fill={side} />
          <path d={`M${x},${y} L${jag.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' L')} L${x + w},${y} Z`} fill={wall} />
          {[0.12, 0.5, 0.86].map((u) => (
            <ellipse key={u} cx={x + w * u} cy={y - 2} rx={w * 0.17} ry={6} fill={mixColor(wall, '#000000', 0.22)} />
          ))}
        </>
      );
    }
    const top = kind === 'gable' ? y - h * 0.62 : y - h;
    return (
      <>
        <path d={`M${x + w},${y} L${x + w},${top} L${x + w + sideW},${top - sideW * 0.5} L${x + w + sideW},${y - sideW * 0.2} Z`} fill={side} />
        <rect x={x} y={top} width={w} height={y - top} fill={wall} />
        {kind === 'gable' && <path d={`M${x - w * 0.08},${top} L${x + w / 2},${y - h} L${x + w * 1.08 + sideW},${top - sideW * 0.4} Z`} fill={roof} />}
        {(kind === 'flat' || kind === 'tower') && <rect x={x - 3} y={top - 7} width={w + 6} height={8} fill={mixColor(wall, '#000000', 0.15)} />}
        {kind === 'merlon' && (
          <>
            {/* a mud-brick wall: a parapet of stepped merlons along the roofline */}
            <rect x={x} y={top - 7} width={w} height={7} fill={mixColor(wall, '#000000', 0.12)} />
            {Array.from({ length: Math.max(2, Math.floor(w / 22)) }, (_, i, a) => {
              const mw = w / (a.length * 2 - 1);
              return <rect key={i} x={x + i * mw * 2} y={top - 18} width={mw} height={11} fill={wall} />;
            })}
          </>
        )}
        {kind === 'tower' && Array.from({ length: Math.floor(w / 16) }, (_, i) => <rect key={i} x={x + 4 + i * 16} y={top - 17} width={9} height={11} fill={wall} />)}
        {kind === 'portico' && (
          <>
            <path d={`M${x - 6},${top} L${x + w / 2},${top - w * 0.22} L${x + w + 6},${top} Z`} fill={roof} />
            <rect x={x + 4} y={top + 8} width={w - 8} height={y - top - 14} fill={mixColor(wall, '#000000', 0.45)} />
            {Array.from({ length: cols }, (_, i) => {
              const cx = x + 8 + (i * (w - 16)) / (cols - 1);
              return <rect key={i} x={cx - 4} y={top + 4} width={8} height={y - top - 10} fill={pal.column || '#ece0c4'} />;
            })}
            <rect x={x - 4} y={y - 6} width={w + 8} height={6} fill={mixColor(wall, '#ffffff', 0.15)} />
          </>
        )}
        {kind === 'terrace' && (
          <>
            <rect x={x + w * 0.18} y={top - h * 0.38} width={w * 0.64} height={h * 0.38} fill={mixColor(wall, '#ffffff', 0.08)} />
            <rect x={x + w * 0.14} y={top - h * 0.38 - 6} width={w * 0.72} height={6} fill={roof} />
            <path d={`M${x},${top + 10} L${x + w},${top + 10}`} stroke={mixColor(wall, '#000000', 0.25)} strokeWidth="3" strokeDasharray="3 5" />
          </>
        )}
        {kind !== 'portico' &&
          [0.3, 0.55, 0.8].map((u) => <path key={u} d={`M${x},${y - (y - top) * u} L${x + w},${y - (y - top) * u}`} stroke="#000000" strokeOpacity="0.07" strokeWidth="1.5" />)}
      </>
    );
  };
  return (
    <g>
      {body()}
      {kind !== 'portico' && <path d={door} fill="#1e140c" />}
      {glow > 0 && kind !== 'portico' && <path d={door} fill="#ffb25a" opacity={glow * 0.85} />}
      {windows.map((wn, i) => (
        <g key={i}>
          <rect x={wn.x} y={wn.y} width="10" height="12" rx="4" fill="#24180f" />
          {glow > 0 && wn.lit && (
            <>
              <circle cx={wn.x + 5} cy={wn.y + 6} r="16" fill={`url(#${uid}g)`} opacity={glow} />
              <rect x={wn.x} y={wn.y} width="10" height="12" rx="4" fill="#ffc06a" opacity={glow} />
            </>
          )}
        </g>
      ))}
    </g>
  );
}

/**
 * Buildings at eye level along `x0`–`x1` on the ground line `y`, at scale `s`. `grade` sets the age of
 * what has been built — "hut", "village", "town", "city" (Egypt), "assyrian", "israelite", "galilaean"
 * or "desert" — and with it the roof forms, the wall material and how high the buildings stand (see
 * GRADES above). `wall` {x0, x1, gate, h, style} rings it with a palisade, a mud-brick wall or a wall of
 * dressed stone, with a gateway; `night` darkens it and `lit` lights its doors and windows; `grey` drains
 * its colour; `smoke` puts that many smoke columns over the roofs; `rows: 2` adds a hazier row behind;
 * `ruin` (0–1) leaves it broken down to jagged walls and rubble.
 */
export function Town({ cfg }) {
  const uid = useUid('tn');
  const { y = 640, x0 = 300, x1 = 1300, s = 1, grade = 'town', seed = 5, night = false, lit = 0.7, grey = 0, wall, smoke = 0, rows = 1, light = 'left', haze = '#c8bca0', ruin = 0 } = cfg;
  const G = GRADES[grade] || GRADES.town;
  const pal = useMemo(() => {
    const tint = (c) => mixColor(night ? mixColor(c, NIGHT, 0.62) : c, '#8c8c8c', grey);
    return { wall: tint(G.wall), roof: tint(G.roof), column: tint('#ece0c4') };
  }, [G, night, grey]);
  const back = useMemo(() => (rows > 1 ? buildRow({ x0: x0 - 40, x1: x1 + 40, s: s * 0.82, grade, seed: seed + 50 }) : []), [rows, x0, x1, s, grade, seed]);
  const front = useMemo(() => buildRow({ x0, x1, s, grade, seed }), [x0, x1, s, grade, seed]);
  const backPal = useMemo(() => ({ wall: mixColor(pal.wall, night ? NIGHT : haze, 0.3), roof: mixColor(pal.roof, night ? NIGHT : haze, 0.3), column: pal.column }), [pal, night, haze]);
  const smokers = useMemo(() => front.filter((b) => b.kind !== 'portico').slice().sort((a, b) => a.smoke - b.smoke).slice(0, smoke), [front, smoke]);
  const shade = light === 'none' ? 0.6 : 1;
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor="#ffc06a" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffc06a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g>
        {back.map((b, i) => (
          <Building key={`b${i}`} b={b} y={y - 16 * s} pal={backPal} night={night} lit={lit * 0.7} uid={uid} shade={shade} ruin={ruin} />
        ))}
      </g>
      {front.map((b, i) => (
        <Building key={i} b={b} y={y} pal={pal} night={night} lit={lit} uid={uid} shade={shade} ruin={ruin} />
      ))}
      {smokers.map((b, i) => (
        <g key={`s${i}`} transform={`translate(${b.x + b.w / 2} ${y - b.h})`}>
          {[0, 1, 2, 3, 4].map((k) => (
            <circle key={k} r={7 * s} fill={night ? '#3a3a48' : '#9a948c'} className="smoke" style={{ '--t': '8s', '--dx': `${20 + k * 5}px`, '--rise': '-220px', animationDelay: `${-k * 1.6 - i}s` }} />
          ))}
        </g>
      ))}
      {wall && <TownWall wall={wall} y={y} s={s} grade={grade} pal={pal} night={night} lit={lit} />}
    </Svg>
  );
}

/**
 * The wall round a town. `style` comes from the grade: a palisade of timber for the first settlements,
 * courses of mud-brick with stepped merlons for Sumer and Assyria, dressed ashlar with a course of
 * larger blocks for Egypt and Israel.
 */
function TownWall({ wall, y, s, grade, pal, night, lit }) {
  const { x0, x1, gate, h = 44 } = wall;
  const H = h * s;
  const G = GRADES[grade] || GRADES.town;
  const style = wall.style || G.wallStyle || 'brick';
  if (style === 'palisade') {
    const stakes = [];
    for (let x = x0; x <= x1; x += 9 * s) if (!gate || Math.abs(x - gate) > 22 * s) stakes.push(x);
    return (
      <g>
        {stakes.map((x, i) => (
          <path key={i} d={`M${x},${y + 4} L${x},${y - H + (i % 3) * 3} L${x + 3 * s},${y - H - 6 * s + (i % 3) * 3} L${x + 6 * s},${y - H + (i % 3) * 3} L${x + 6 * s},${y + 4} Z`} fill={mixColor(TIMBER, '#8a6a46', 0.35)} />
        ))}
      </g>
    );
  }
  const stone = mixColor(pal.wall, '#000000', 0.12);
  const ashlar = style === 'ashlar';
  const crenels = [];
  // dressed stone is laid in longer blocks than mud-brick
  const step = (ashlar ? 26 : 14) * s;
  for (let x = x0; x < x1; x += step) crenels.push(x);
  const gw = 34 * s;
  // the courses of the wall: mud-brick shows its courses, ashlar shows its joints
  const courses = [];
  if (!ashlar) for (let yy = y; yy > y - H; yy -= 9 * s) courses.push(yy);
  return (
    <g>
      <rect x={x0} y={y - H} width={x1 - x0} height={H + 4} fill={stone} />
      {courses.map((yy, i) => (
        <path key={i} d={`M${x0},${yy} L${x1},${yy}`} stroke="#000000" strokeOpacity="0.07" strokeWidth="1.4" />
      ))}
      {ashlar && Array.from({ length: Math.ceil((x1 - x0) / (step * 2)) }, (_, i) => (
        <path key={i} d={`M${x0 + i * step * 2},${y - H} L${x0 + i * step * 2},${y}`} stroke="#000000" strokeOpacity="0.05" strokeWidth="1.2" />
      ))}
      {crenels.map((x, i) => (
        <rect key={i} x={x} y={y - H - 7 * s} width={8 * s} height={8 * s} fill={stone} />
      ))}
      <path d={`M${x0},${y - H * 0.5} L${x1},${y - H * 0.5}`} stroke="#000000" strokeOpacity="0.08" strokeWidth="2" />
      {gate && (
        <g>
          {[-1, 1].map((d) => (
            <g key={d}>
              <rect x={gate + d * gw - 14 * s} y={y - H * 1.7} width={28 * s} height={H * 1.7 + 4} fill={mixColor(stone, '#ffffff', 0.06)} />
              {[0, 1].map((k) => (
                <rect key={k} x={gate + d * gw - 14 * s + k * 18 * s} y={y - H * 1.7 - 8 * s} width={10 * s} height={9 * s} fill={mixColor(stone, '#ffffff', 0.06)} />
              ))}
            </g>
          ))}
          <path d={`M${gate - gw + 14 * s},${y + 4} L${gate - gw + 14 * s},${y - H * 0.75} Q${gate},${y - H * 1.35} ${gate + gw - 14 * s},${y - H * 0.75} L${gate + gw - 14 * s},${y + 4} Z`} fill="#1e140c" />
          {night && <path d={`M${gate - gw + 14 * s},${y + 4} L${gate - gw + 14 * s},${y - H * 0.75} Q${gate},${y - H * 1.35} ${gate + gw - 14 * s},${y - H * 0.75} L${gate + gw - 14 * s},${y + 4} Z`} fill="#ffb25a" opacity={lit * 0.5} />}
          <path d={`M${gate - gw + 10 * s},${y - H * 0.75} Q${gate},${y - H * 1.45} ${gate + gw - 10 * s},${y - H * 0.75}`} stroke={mixColor(stone, '#000000', 0.3)} strokeWidth={4 * s} fill="none" />
        </g>
      )}
    </g>
  );
}

// ── A narrow street at night ─────────────────────────────

function Lamp({ x, y, s = 1, glow }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r="58" fill={`url(#${glow})`} className="breathe" style={{ '--t': '1.7s' }} />
      <path d="M-14,-6 L4,-6" stroke="#2a1d14" strokeWidth="3" />
      <path d="M-8,4 C-8,-1 8,-1 9,3 L12,2 L9,7 C3,9 -6,9 -8,4 Z" fill="#7a5532" />
      <g transform="translate(10 1) scale(0.1)">
        <path d={FLAME_PATH} fill="#ffcf74" className="flame" />
      </g>
    </g>
  );
}

/**
 * One slice of a narrow street at night: house fronts on both sides with the street's opening of
 * half-width `gap` between them, ground line `y`, wall height `h`. Stack several at rising depths
 * (gaps narrowing) and the street recedes; a camera push walks down it. `lamp`: "left" | "right" | "both";
 * `end` closes the street with a facade and an open, lamplit doorway at its centre.
 */
export function Lane({ cfg }) {
  const uid = useUid('ln');
  const { gap = 200, y = 760, h = 420, seed = 3, lamp, end = false, stone = '#3e3a4e', door = 0.5 } = cfg;
  const r = useMemo(() => rng(seed), [seed]);
  const roof = useMemo(() => {
    const steps = Array.from({ length: 6 }, () => [r() * 0.12, r()]);
    return steps;
  }, [r]);
  const face = (side) => {
    const inner = 800 + side * gap;
    const outer = 800 + side * 2400;
    const top = (u) => y - h * (1 - roof[Math.min(5, Math.floor(u * 6))][0]);
    const pts = [[outer, y + 80]];
    for (let k = 0; k <= 6; k++) {
      const u = k / 6;
      pts.push([lerp(outer, inner, u), top(u)]);
    }
    pts.push([inner, y + 80]);
    return `M${pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' L')} Z`;
  };
  const dx = (side) => 800 + side * (gap + Math.max(70, gap * 0.55) * (0.4 + door));
  const dw = Math.max(26, gap * 0.16);
  const dh = Math.min(h * 0.5, dw * 2.2);
  const arch = (cx, w, hh) => `M${cx - w / 2},${y} L${cx - w / 2},${y - hh + w / 2} Q${cx},${y - hh - w * 0.2} ${cx + w / 2},${y - hh + w / 2} L${cx + w / 2},${y} Z`;
  if (end) {
    const ew = Math.max(40, h * 0.2);
    const eh = ew * 2.1;
    return (
      <Svg>
        <defs>
          <radialGradient id={`${uid}d`} cx="0.5" cy="0.8" r="0.8">
            <stop offset="0" stopColor="#ffd28a" />
            <stop offset="0.6" stopColor="#c9782e" />
            <stop offset="1" stopColor="#5a3018" />
          </radialGradient>
          <radialGradient id={`${uid}w`} cx="800" cy={y - eh * 0.5} r={h * 0.9} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#c98a4a" stopOpacity="0.45" />
            <stop offset="1" stopColor="#c98a4a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}g`}>
            <stop offset="0" stopColor="#ffc26a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffc26a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="-1600" y={y - h} width="4800" height={h + 80} fill={stone} />
        {[0.25, 0.5, 0.75].map((u) => (
          <path key={u} d={`M-1600,${y - h * u} L3200,${y - h * u}`} stroke="#000000" strokeOpacity="0.12" strokeWidth="2" />
        ))}
        <rect x="-1600" y={y - h} width="4800" height={h + 80} fill={`url(#${uid}w)`} />
        <path d={arch(800, ew, eh)} fill={`url(#${uid}d)`} />
        <path d={arch(800, ew + 10, eh + 6)} fill="none" stroke="#2a2030" strokeWidth="6" />
        <Lamp x={800 - ew * 1.1} y={y - eh * 0.75} s={h / 420} glow={`${uid}g`} />
      </Svg>
    );
  }
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor="#ffc26a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffc26a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}p`}>
          <stop offset="0" stopColor="#ffb860" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffb860" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[-1, 1].map((side) => (
        <g key={side}>
          <path d={face(side)} fill={stone} />
          {[0.3, 0.55, 0.8].map((u) => (
            <path key={u} d={`M${800 + side * 2400},${y - h * u} L${800 + side * gap},${y - h * u}`} stroke="#000000" strokeOpacity="0.14" strokeWidth={2 + h / 300} />
          ))}
          <path d={`M${800 + side * gap},${y + 80} L${800 + side * gap},${y - h}`} stroke="#6a6278" strokeOpacity="0.5" strokeWidth={2 + h / 200} />
          <path d={arch(dx(side), dw, dh)} fill="#120e16" />
          <rect x={dx(side) + side * dw * 1.6 - dw * 0.3} y={y - dh * 1.5} width={dw * 0.6} height={dw * 0.7} rx={dw * 0.2} fill="#ffb860" opacity={(seed + side) % 3 ? 0.55 : 0.12} />
        </g>
      ))}
      {(lamp === 'left' || lamp === 'both') && (
        <>
          <ellipse cx={800 - gap * 0.75} cy={y + 18} rx={gap * 0.5} ry={gap * 0.07} fill={`url(#${uid}p)`} />
          <Lamp x={800 - gap - 6} y={y - h * 0.48} s={h / 420} glow={`${uid}g`} />
        </>
      )}
      {(lamp === 'right' || lamp === 'both') && (
        <>
          <ellipse cx={800 + gap * 0.75} cy={y + 18} rx={gap * 0.5} ry={gap * 0.07} fill={`url(#${uid}p)`} />
          <g transform={`translate(${1600} 0) scale(-1 1)`}>
            <Lamp x={800 - gap - 6} y={y - h * 0.48} s={h / 420} glow={`${uid}g`} />
          </g>
        </>
      )}
    </Svg>
  );
}

// ── A workroom in daylight ───────────────────────────────

/** A simple stone workroom: a small window (`win` [x, y, w, h]) throwing one golden beam across a table of parchment. */
export function Room({ cfg }) {
  const uid = useUid('rm');
  const { vb } = useStage();
  // `table` is the table's centre x, kept clear of the chronicle panel in the lower left
  const { win = [1150, 230, 110, 140], beam = true, table = 860 } = cfg;
  const tx = table - 650;
  const [wx, wy, ww, wh] = win;
  const blocks = useMemo(() => {
    const r = rng(41);
    const out = [];
    for (let row = 0; row < 11; row++) {
      let x = -500 - r() * 60;
      while (x < 2100) {
        const w = 80 + r() * 70;
        out.push({ x, y: -150 + row * 76, w, o: 0.5 + r() * 0.4 });
        x += w + 6;
      }
    }
    return out;
  }, []);
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}b`} x1={wx} y1={wy} x2={560 + tx} y2="720" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe6a8" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffe6a8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dfeaf2" />
          <stop offset="1" stopColor="#fff6e0" />
        </linearGradient>
        <radialGradient id={`${uid}l`} cx={wx} cy={wy + wh} r="1100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffd890" stopOpacity="0.35" />
          <stop offset="1" stopColor="#1a0f08" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <rect x={vb[0] - 400} y={vb[1] - 400} width={vb[2] + 800} height={vb[3] + 800} fill="#5e4632" />
      {blocks.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height="70" rx="9" fill="#a3825c" opacity={b.o} />
      ))}
      <rect x={wx - 10} y={wy - 10} width={ww + 20} height={wh + 22} fill="#3a2a1c" />
      <rect x={wx} y={wy} width={ww} height={wh} fill={`url(#${uid}s)`} />
      <rect x={wx - 14} y={wy + wh + 6} width={ww + 28} height="10" fill="#4e3a26" />
      <rect x="-500" y="700" width="2600" height="900" fill="#4a3424" />
      <ellipse cx={640 + tx} cy="790" rx="420" ry="70" fill="#7a5a34" opacity="0.6" />
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx={640 + tx} cy="790" rx={400 - i * 110} ry={64 - i * 16} fill="none" stroke="#a07a44" strokeOpacity="0.35" strokeWidth="5" strokeDasharray="12 8" />
      ))}
      <rect x="250" y="250" width="200" height="14" fill="#3e2c1c" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${270 + i * 44} 230)`}>
          <rect x="-12" y="-6" width="34" height="20" rx="9" fill="#e8d8b4" />
          <circle cx="-12" cy="4" r="8" fill="#c9b080" />
        </g>
      ))}
      <g transform={`translate(${tx} 0)`}>
        <rect x="430" y="610" width="440" height="22" fill="#5a3e26" />
        <rect x="450" y="632" width="16" height="90" fill="#3e2a1a" />
        <rect x="834" y="632" width="16" height="90" fill="#3e2a1a" />
        <path d="M520,612 L650,598 L700,612 L560,624 Z" fill="#efe2c6" />
        <path d="M600,616 L740,606 L770,616 L630,622 Z" fill="#e6d6b2" />
        <path d="M800,608 C792,594 812,590 818,600 L818,610 Z" fill="#2a2420" />
        <path d="M806,600 L790,566 M812,600 L800,562" stroke="#8a6a3e" strokeWidth="2.4" />
      </g>
      {beam && <path d={`M${wx},${wy} L${wx + ww},${wy + 20} L${760 + tx},720 L${430 + tx},700 Z`} fill={`url(#${uid}b)`} />}
      <rect x={vb[0] - 400} y={vb[1] - 400} width={vb[2] + 800} height={vb[3] + 800} fill={`url(#${uid}l)`} />
    </Svg>
  );
}

// ── Market stalls ────────────────────────────────────────

const GOODS = ['#9a6a4a', '#7d8a4e', '#c9a35a', '#a8584a', '#5e7a8a'];

/** Market stalls along a square: timber posts, a counter of jars, baskets and cloth, a striped awning lifting in the breeze. */
export function Stalls({ cfg }) {
  const { items = [], s = 1, grey = 0 } = cfg;
  const tint = (c) => mixColor(c, '#8c8c8c', grey);
  return (
    <Svg>
      {items.map((st, i) => {
        const { x, y, w = 130, color = '#b8644a' } = st;
        const k = st.s ?? s;
        const H = 96 * k;
        const W = w * k;
        const stripe = tint(color);
        const pale = tint(mixColor(color, '#f2e6cc', 0.65));
        return (
          <g key={i}>
            <ellipse cx={x + W / 2} cy={y + 4} rx={W * 0.62} ry={9 * k} fill="#1c140c" opacity="0.25" />
            {[0, W].map((px) => (
              <rect key={px} x={x + px - 3 * k} y={y - H} width={6 * k} height={H} fill={TIMBER} />
            ))}
            <rect x={x} y={y - 34 * k} width={W} height={34 * k} fill={tint('#7a5a3c')} />
            {Array.from({ length: Math.max(2, Math.round(W / (26 * k))) }, (_, j) => {
              const gx = x + 14 * k + j * 24 * k;
              const c = tint(GOODS[(i + j) % GOODS.length]);
              return j % 3 === 0 ? (
                <ellipse key={j} cx={gx} cy={y - 40 * k} rx={9 * k} ry={8 * k} fill={c} />
              ) : j % 3 === 1 ? (
                <path key={j} d={`M${gx - 9 * k},${y - 34 * k} L${gx - 7 * k},${y - 48 * k} L${gx + 7 * k},${y - 48 * k} L${gx + 9 * k},${y - 34 * k} Z`} fill={tint('#8a6a3e')} />
              ) : (
                <rect key={j} x={gx - 8 * k} y={y - 46 * k} width={16 * k} height={12 * k} rx={5 * k} fill={c} />
              );
            })}
            <path d={`M${x - 8 * k},${y - H} L${x + W + 8 * k},${y - H} L${x + W - 4 * k},${y - H - 26 * k} L${x + 4 * k},${y - H - 26 * k} Z`} fill={pale} />
            {Array.from({ length: 5 }, (_, j) => (
              <path key={j} d={`M${x - 8 * k + (j * (W + 16 * k)) / 5},${y - H} L${x - 8 * k + ((j + 0.5) * (W + 16 * k)) / 5},${y - H} L${x + 4 * k + ((j + 0.5) * (W - 8 * k)) / 5},${y - H - 26 * k} L${x + 4 * k + (j * (W - 8 * k)) / 5},${y - H - 26 * k} Z`} fill={stripe} />
            ))}
            <g className="flutter" style={{ '--t': `${2.2 + (i % 3) * 0.5}s`, animationDelay: `${-i * 0.7}s` }}>
              <path d={`M${x - 8 * k},${y - H} L${x + W + 8 * k},${y - H} L${x + W + 8 * k},${y - H + 14 * k} ${Array.from({ length: 6 }, (_, j) => `Q${x + W + 8 * k - ((j + 0.5) * (W + 16 * k)) / 6},${y - H + 22 * k} ${x + W + 8 * k - ((j + 1) * (W + 16 * k)) / 6},${y - H + 14 * k}`).join(' ')} Z`} fill={stripe} />
            </g>
            <rect x={x} y={y - H + 14 * k} width={W} height={H - 48 * k} fill="#1c140c" opacity="0.18" />
          </g>
        );
      })}
    </Svg>
  );
}

// ── The five statues ─────────────────────────────────────

const STATUE = 'M-15,0 C-15,-26 -13,-46 -10,-58 C-12,-62 -9,-67 -6,-67 L6,-67 C9,-67 12,-62 10,-58 C13,-46 15,-26 15,0 Z';

/**
 * Five tall stone blocks in a row along a square (`xs`), carved into faceless robed statues when
 * `carved` (painted upward into shape). Over the generations they gain `lamps` (per statue) and
 * `offerings` at their feet, and cast a `shadow` (0–1) that lengthens across the square; at `night`
 * the lamps light them from below; `color` is the stone (dull bronze, say) and `weather` (0–1) cracks and
 * stains it with the centuries. Carved only to remember; the faces are never made.
 */
export function Statues({ cfg }) {
  const uid = useUid('stt');
  const { xs = [520, 660, 800, 940, 1080], y = 680, h = 230, carved = true, lamps = 0, offerings = false, shadow = 0, night = false, grey = 0, color = '#a39a8c', weather = 0 } = cfg;
  const wasCarved = useRef(carved).current;
  const stone = mixColor(mixColor(mixColor(color, '#4a443c', weather * 0.35), '#8c8c8c', grey), NIGHT, night ? 0.6 : 0);
  const k = h / 100;
  return (
    <Svg>
      <defs>
        <linearGradient id={`${uid}l`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="0.55" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.28" />
        </linearGradient>
        <radialGradient id={`${uid}u`} cx="0.5" cy="1" r="0.9">
          <stop offset="0" stopColor="#ffb860" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffb860" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}b`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {xs.map((x, i) => {
        const L = shadow * h * 1.8;
        return <motion.path key={`sh${i}`} initial={false} animate={{ d: `M${x - 14 * k},${y} L${x + 14 * k},${y} L${x + 14 * k + L},${y + L * 0.22} L${x - 6 * k + L},${y + L * 0.3} Z` }} transition={{ duration: 2.4 }} fill="#120c08" opacity="0.4" filter={`url(#${uid}b)`} />;
      })}
      {xs.map((x, i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <rect x={-20 * k} y={-12 * k} width={40 * k} height={12 * k} fill={mixColor(stone, '#000000', 0.18)} />
          <clipPath id={`${uid}c${i}`}>
            <motion.rect x={-40 * k} width={80 * k} initial={wasCarved ? { y: -82 * k, height: 70 * k } : { y: -12 * k, height: 0 }} animate={carved ? { y: -82 * k, height: 70 * k } : { y: -12 * k, height: 0 }} transition={{ duration: 2.6, delay: i * 0.5, ease: 'easeInOut' }} />
          </clipPath>
          <motion.g initial={false} animate={{ opacity: carved ? 0 : 1 }} transition={{ duration: 2.6, delay: i * 0.5 + 0.6 }}>
            <path d={`M${-14 * k},${-12 * k} L${-15 * k},${-76 * k} L${-6 * k},${-80 * k} L${4 * k},${-77 * k} L${15 * k},${-79 * k} L${14 * k},${-12 * k} Z`} fill={stone} />
            <path d={`M${-14 * k},${-12 * k} L${-15 * k},${-76 * k} L${-6 * k},${-80 * k} L${4 * k},${-77 * k} L${15 * k},${-79 * k} L${14 * k},${-12 * k} Z`} fill={`url(#${uid}l)`} />
          </motion.g>
          <g clipPath={`url(#${uid}c${i})`}>
            <g transform={`translate(0 ${-12 * k}) scale(${k})`}>
              <path d={STATUE} fill={stone} />
              <path d="M-9,-40 C-3,-37 3,-37 9,-40" stroke="#000000" strokeOpacity="0.18" strokeWidth="1.6" fill="none" />
              {[-6, 0, 6].map((fx) => (
                <path key={fx} d={`M${fx},-34 C${fx + 1},-20 ${fx - 1},-10 ${fx},-1`} stroke="#000000" strokeOpacity="0.12" strokeWidth="1.2" fill="none" />
              ))}
              <path d={STATUE} fill={`url(#${uid}l)`} />
              {weather > 0 && (
                <g opacity={weather}>
                  <path d="M-6,-62 L-2,-50 L-7,-41 L-3,-30" stroke="#2a241e" strokeWidth="1.2" fill="none" />
                  <path d="M7,-22 L4,-13 L8,-5" stroke="#2a241e" strokeWidth="1" fill="none" />
                  <ellipse cx="-8" cy="-6" rx="7" ry="4" fill="#5a6a44" opacity="0.6" />
                  <ellipse cx="9" cy="-40" rx="4" ry="6" fill="#5a6a44" opacity="0.45" />
                </g>
              )}
            </g>
          </g>
          {/* lit from below: the glow climbs the lower half, leaving the heads in shadow */}
          {night && <ellipse cx="0" cy={-16 * k} rx={22 * k} ry={28 * k} fill={`url(#${uid}u)`} opacity="0.7" />}
          {offerings && [-14, -4, 8, 16].map((ox, j) => <ellipse key={j} cx={ox * k * 0.8} cy={4 * k * 0.4} rx={4 * k * 0.6} ry={2.4 * k * 0.6} fill={['#a8584a', '#c9a35a', '#7d8a4e', '#d9c08a'][j]} />)}
          {Array.from({ length: lamps }, (_, j) => {
            const lx = (j - (lamps - 1) / 2) * 9 * k;
            return (
              <g key={j} transform={`translate(${lx} ${2 * k}) scale(${k * 0.32})`}>
                <circle r="44" fill={`url(#${uid}u)`} className="breathe" style={{ '--t': `${1.4 + (j % 3) * 0.3}s` }} />
                <path d="M-9,3 C-9,-2 9,-2 10,2 L13,1 L10,6 C3,8 -7,8 -9,3 Z" fill="#7a5532" />
                <g transform="translate(10 0) scale(0.1)">
                  <path d={FLAME_PATH} fill="#ffcf74" className="flame" style={{ animationDelay: `${-j * 0.3}s` }} />
                </g>
              </g>
            );
          })}
        </g>
      ))}
    </Svg>
  );
}

// ── The chiefs' terrace ──────────────────────────────────

const CLOTH = '#8a1e1e';
const MARBLE = '#e4d8c2';

/** A hanging cloth of deep red, gathered at the top and lifting a little in the wind. */
function Drape({ x, y, w, h, dark }) {
  const c = dark ? mixColor(CLOTH, '#000000', 0.35) : CLOTH;
  return (
    <g className="flutter" style={{ '--t': `${3 + (x % 7) * 0.2}s` }}>
      <path d={`M${x},${y} L${x + w},${y} C${x + w * 0.96},${y + h * 0.5} ${x + w * 0.9},${y + h * 0.8} ${x + w * 0.82},${y + h} C${x + w * 0.6},${y + h * 0.94} ${x + w * 0.4},${y + h * 1.03} ${x + w * 0.16},${y + h * 0.96} C${x + w * 0.08},${y + h * 0.7} ${x + w * 0.02},${y + h * 0.4} ${x},${y} Z`} fill={c} />
      {[0.3, 0.55, 0.78].map((u) => (
        <path key={u} d={`M${x + w * u},${y} C${x + w * (u - 0.03)},${y + h * 0.5} ${x + w * (u + 0.02)},${y + h * 0.75} ${x + w * (u - 0.02)},${y + h * 0.97}`} stroke={mixColor(c, '#000000', 0.3)} strokeWidth={3} fill="none" />
      ))}
      <path d={`M${x},${y + 4} L${x + w},${y + 4}`} stroke="#c8963c" strokeWidth="6" />
    </g>
  );
}

function Column({ x, top, bottom, w, marble }) {
  return (
    <g>
      <rect x={x - w / 2} y={top} width={w} height={bottom - top} fill={marble} />
      {[-0.3, -0.1, 0.1, 0.3].map((u) => (
        <path key={u} d={`M${x + u * w},${top} L${x + u * w},${bottom}`} stroke="#000000" strokeOpacity="0.08" strokeWidth={w * 0.06} />
      ))}
      <rect x={x + w * 0.18} y={top} width={w * 0.32} height={bottom - top} fill="#000000" opacity="0.1" />
    </g>
  );
}

/** A chief reclining in heavy, smoky amber light under glowing cloth. `hollow` leaves only a dim outline. */
function Chief({ x, y, s, uid, hollow, flip = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s * flip} ${s})`}>
      <ellipse cx="0" cy="-60" rx="150" ry="96" fill={`url(#${uid}a)`} opacity={hollow ? 0.3 : 0.55} />
      <path d="M-96,-30 C-100,-66 -62,-90 -22,-94 C8,-96 28,-118 50,-118 C74,-116 84,-94 72,-80 C92,-70 102,-48 96,-30 Z" fill={hollow ? '#2a1a10' : `url(#${uid}b)`} fillOpacity={hollow ? 0.35 : 1} stroke="#d89848" strokeOpacity={hollow ? 0.55 : 0.25} strokeWidth="3" />
      {!hollow && <path d="M-88,-36 C-58,-58 -18,-64 22,-58 C52,-54 80,-48 92,-36" stroke="#ffd08a" strokeWidth="3" fill="none" opacity="0.55" />}
      {[0, 1, 2, 3].map((k) => (
        <circle key={k} cx={-40 + k * 30} cy={-100} r={10} fill="#3a2414" className="smoke" style={{ '--t': `${5 + k}s`, '--dx': `${(k - 1.5) * 14}px`, '--rise': '-120px', animationDelay: `${-k * 1.3}s` }} />
      ))}
    </g>
  );
}

/**
 * A grand marble terrace with bronze-capped columns and deep red cloths, where the chiefs recline in
 * thick amber light. `view: "behind"` stands behind them at the balustrade (`y`), looking down at the
 * square; `view: "below"` looks up at it from the square, the chiefs dim and hollow against the sky.
 * `chiefs` [[x, y, scale]…] places them.
 */
export function Terrace({ cfg }) {
  const uid = useUid('tr');
  const { view = 'behind', y = 560, chiefs = [], marble = MARBLE } = cfg;
  const defs = (
    <defs>
      <radialGradient id={`${uid}a`}>
        <stop offset="0" stopColor="#ffb860" stopOpacity="0.75" />
        <stop offset="0.6" stopColor="#a8601e" stopOpacity="0.35" />
        <stop offset="1" stopColor="#3a1c08" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${uid}b`} x1="0" y1="-120" x2="0" y2="-30" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#e89a48" />
        <stop offset="0.6" stopColor="#b0581e" />
        <stop offset="1" stopColor="#6a2a10" />
      </linearGradient>
    </defs>
  );
  const balusters = (x0, x1, top, h) => {
    const out = [];
    for (let x = x0; x <= x1; x += 34) out.push(<path key={x} d={`M${x - 8},${top + h} C${x - 12},${top + h * 0.6} ${x - 4},${top + h * 0.45} ${x - 6},${top + h * 0.2} L${x + 6},${top + h * 0.2} C${x + 4},${top + h * 0.45} ${x + 12},${top + h * 0.6} ${x + 8},${top + h} Z`} fill={mixColor(marble, '#000000', 0.12)} />);
    return out;
  };
  if (view === 'below') {
    return (
      <Svg>
        {defs}
        {[470, 680, 890, 1100, 1310].map((x) => (
          <Column key={x} x={x} top={-300} bottom={y - 50} w={58} marble={marble} />
        ))}
        {[575, 785, 995, 1205].map((x) => (
          <Drape key={x} x={x - 82} y={-200} w={164} h={y - 160} dark />
        ))}
        <rect x="360" y={y - 70} width="1060" height="24" fill={mixColor(marble, '#000000', 0.06)} />
        {balusters(380, 1400, y - 46, 46)}
        <rect x="350" y={y} width="1080" height="16" fill={mixColor(marble, '#000000', 0.18)} />
        <rect x="370" y={y + 16} width="1040" height="900" fill={marble} />
        {[1, 2, 3, 4, 5].map((k) => (
          <path key={k} d={`M370,${y + 16 + k * 70} L1410,${y + 16 + k * 70}`} stroke="#000000" strokeOpacity="0.07" strokeWidth="3" />
        ))}
        {chiefs.map(([cx, cy, cs = 0.7], i) => (
          <Chief key={i} x={cx} y={cy} s={cs} uid={uid} hollow flip={i % 2 ? -1 : 1} />
        ))}
      </Svg>
    );
  }
  return (
    <Svg>
      {defs}
      <Column x={230} top={-400} bottom={1300} w={130} marble={marble} />
      <Column x={1370} top={-400} bottom={1300} w={130} marble={marble} />
      <Drape x={290} y={-300} w={190} h={y + 40} />
      <Drape x={1120} y={-300} w={190} h={y + 40} />
      <rect x="160" y={y - 14} width="1280" height="20" fill={marble} />
      {balusters(190, 1410, y + 6, 64)}
      <rect x="160" y={y + 70} width="1280" height="14" fill={mixColor(marble, '#000000', 0.15)} />
      <rect x="-400" y={y + 84} width="2400" height="900" fill={mixColor(marble, '#8a7a64', 0.25)} />
      {[1, 2, 3].map((k) => (
        <path key={k} d={`M-400,${y + 84 + k * 90} L2000,${y + 84 + k * 90}`} stroke="#000000" strokeOpacity="0.08" strokeWidth="3" />
      ))}
      {chiefs.map(([cx, cy, cs = 1], i) => (
        <Chief key={i} x={cx} y={cy} s={cs} uid={uid} flip={i % 2 ? -1 : 1} />
      ))}
    </Svg>
  );
}

// ── A door at night ──────────────────────────────────────

/**
 * One household's lamplit doorway in a dark wall: an oil lamp beside it, `household` lights inside.
 * `shut` swings the wooden door closed over `shutDur` ms after `shutDelay` ms, leaving a line of light beneath it.
 */
export function Doorway({ cfg }) {
  const uid = useUid('dw');
  const { x = 820, y = 760, s = 1, shut = false, shutDur = 3200, shutDelay = 0, household = 3, stone = '#262838' } = cfg;
  const W = 124 * s;
  const H = 214 * s;
  const arch = `M${x - W / 2},${y} L${x - W / 2},${y - H + W / 2} Q${x},${y - H - W * 0.25} ${x + W / 2},${y - H + W / 2} L${x + W / 2},${y} Z`;
  return (
    <Svg>
      <defs>
        <radialGradient id={`${uid}i`} cx="0.5" cy="0.75" r="0.8">
          <stop offset="0" stopColor="#ffd890" />
          <stop offset="0.6" stopColor="#c47a34" />
          <stop offset="1" stopColor="#4a2814" />
        </radialGradient>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor="#ffc26a" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffc26a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}h`}>
          <stop offset="0" stopColor="#fff3d6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff3d6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={x - 900} y={y - 760} width="1800" height="800" fill={stone} />
      {Array.from({ length: 10 }, (_, k) => (
        <path key={k} d={`M${x - 900},${y - k * 76} L${x + 900},${y - k * 76}`} stroke="#000000" strokeOpacity="0.16" strokeWidth="2" />
      ))}
      <rect x={x - 900} y={y} width="1800" height="400" fill="#16161f" />
      <ellipse cx={x} cy={y + 30} rx={W * 1.6} ry={30 * s} fill="#ffb25a" opacity="0.18" />
      <path d={arch} fill={`url(#${uid}i)`} />
      {Array.from({ length: household }, (_, i) => {
        const hx = x + (i - (household - 1) / 2) * W * 0.28;
        const k = s * (0.62 - i * 0.08);
        return (
          <g key={i} transform={`translate(${hx} ${y - 6}) scale(${k})`}>
            <ellipse cx="0" cy="-46" rx="40" ry="60" fill={`url(#${uid}h)`} />
            <path d={BODY} fill="#ffe8c4" opacity="0.9" />
            <circle cx="0" cy="-77" r="9.5" fill="#fffaf0" />
          </g>
        );
      })}
      <path d={arch} fill="none" stroke="#14141c" strokeWidth={10 * s} />
      <Lamp x={x - W * 0.95} y={y - H * 0.72} s={s} glow={`${uid}g`} />
      <motion.g style={{ originX: 1 }} initial={{ scaleX: 0.06 }} animate={{ scaleX: shut ? 1 : 0.06 }} transition={{ duration: shutDur / 1000, delay: shutDelay / 1000, ease: [0.5, 0, 0.4, 1] }}>
        <path d={arch} fill="#4a3220" />
        {[0.2, 0.4, 0.6, 0.8].map((u) => (
          <path key={u} d={`M${x - W / 2 + W * u},${y - H} L${x - W / 2 + W * u},${y}`} stroke="#2e1e12" strokeWidth={3 * s} />
        ))}
      </motion.g>
      <motion.path d={`M${x - W / 2},${y - 2} L${x + W / 2},${y - 2}`} stroke="#ffcf80" strokeWidth={3 * s} initial={{ opacity: 0 }} animate={{ opacity: shut ? [0, 0, 0.9] : 0 }} transition={{ duration: shutDur / 1000, delay: shutDelay / 1000 }} />
    </Svg>
  );
}

const BODY = 'M-17,0 C-16,-28 -13,-50 -9,-61 C-6,-67 6,-67 9,-61 C13,-50 16,-28 17,0 Z';

// ── Sand and pillars ─────────────────────────────────────

/**
 * A land of sand and towering stone: eroded rock pillars `items` [{x, y, w, h}], and far off a `city`
 * {x, y, s, n} of enormous columns under long lintels, pale in the haze.
 */
export function Pillars({ cfg }) {
  const { items = [], city, rock = '#b4865a', haze = '#ead2aa', seed = 9 } = cfg;
  const rocks = useMemo(() => {
    const r = rng(seed);
    return items.map(({ x, y, w = 90, h = 380 }) => {
      const pts = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        const bulge = 1 - 0.28 * Math.sin(t * Math.PI) + (t > 0.85 ? 0.18 : 0);
        pts.push([x - (w / 2) * bulge + (r() - 0.5) * 10, y - h * t]);
      }
      const right = pts.map(([px, py], k) => [x + (x - px) + (r() - 0.5) * 10, py]).reverse();
      return { x, y, w, h, d: `M${[...pts, ...right].map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' L')} Z`, strata: Array.from({ length: 7 }, (_, k) => y - h * ((k + 1) / 8)) };
    });
  }, [items, seed]);
  return (
    <Svg>
      {city && (
        <g opacity="0.75">
          {Array.from({ length: city.n ?? 9 }, (_, i) => {
            const s = city.s ?? 1;
            const cx = city.x + (i - ((city.n ?? 9) - 1) / 2) * 70 * s;
            const top = city.y - 260 * s;
            return (
              <g key={i}>
                <rect x={cx - 14 * s} y={top} width={28 * s} height={260 * s} fill={mixColor(rock, haze, 0.55)} />
                <rect x={cx - 20 * s} y={top - 10 * s} width={40 * s} height={12 * s} fill={mixColor(rock, haze, 0.45)} />
              </g>
            );
          })}
          <rect x={city.x - ((city.n ?? 9) / 2) * 70 * (city.s ?? 1)} y={city.y - 296 * (city.s ?? 1)} width={(city.n ?? 9) * 70 * (city.s ?? 1)} height={26 * (city.s ?? 1)} fill={mixColor(rock, haze, 0.5)} />
        </g>
      )}
      {rocks.map((k, i) => (
        <g key={i}>
          <path d={k.d} fill={rock} />
          <rect x={k.x} y={k.y - k.h} width={k.w * 0.7} height={k.h} fill="#5a3418" opacity="0.16" />
          {k.strata.map((sy, j) => (
            <path key={j} d={`M${k.x - k.w * 0.45},${sy} L${k.x + k.w * 0.45},${sy + 2}`} stroke="#6a4424" strokeOpacity="0.35" strokeWidth="2" />
          ))}
        </g>
      ))}
    </Svg>
  );
}
