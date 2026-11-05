// Madyan's market: the merchant's balance, drawn in ink and bronze.
import { Svg } from '../components/stageKit.jsx';

const INK = '#2a2420';
const BRONZE = '#b8874a';

/**
 * A merchant's balance on a post, its foot at (`x`, `y`), `h` tall, its beam `w` long. `tilt` (degrees)
 * dips the right pan (negative the left): 0 is a fair measure. `goods` and `weight` colour what lies in
 * the left and right pans.
 */
export function Balance({ cfg }) {
  const { x = 800, y = 760, h = 120, w = 120, tilt = 0, goods = '#c8a050', weight = '#5a4a3a' } = cfg;
  const top = y - h;
  const a = (tilt * Math.PI) / 180;
  const ends = [-1, 1].map((k) => [x + k * (w / 2) * Math.cos(a), top + k * (w / 2) * Math.sin(a)]);
  const drop = h * 0.42;
  const pr = w * 0.2;
  return (
    <Svg>
      <ellipse cx={x} cy={y + 2} rx={w * 0.22} ry={w * 0.04} fill="#000" opacity="0.2" />
      <path d={`M${x - w * 0.14},${y} L${x + w * 0.14},${y} L${x + w * 0.05},${y - h * 0.1} L${x - w * 0.05},${y - h * 0.1} Z`} fill={INK} />
      <line x1={x} y1={y - h * 0.1} x2={x} y2={top - h * 0.06} stroke={INK} strokeWidth={w * 0.035} strokeLinecap="round" />
      <path d={`M${x - w * 0.03},${top - h * 0.06} L${x},${top - h * 0.16} L${x + w * 0.03},${top - h * 0.06} Z`} fill={BRONZE} stroke={INK} strokeWidth="1" />
      <line x1={ends[0][0]} y1={ends[0][1]} x2={ends[1][0]} y2={ends[1][1]} stroke={BRONZE} strokeWidth={w * 0.03} strokeLinecap="round" />
      <circle cx={x} cy={top} r={w * 0.028} fill={INK} />
      {ends.map(([ex, ey], i) => {
        const py = ey + drop;
        return (
          <g key={i}>
            <path d={`M${ex},${ey} L${ex - pr * 0.85},${py} M${ex},${ey} L${ex + pr * 0.85},${py} M${ex},${ey} L${ex},${py}`} stroke={INK} strokeWidth="1.2" strokeOpacity="0.8" />
            <path d={`M${ex - pr},${py} Q${ex},${py + pr * 0.7} ${ex + pr},${py} Z`} fill={BRONZE} stroke={INK} strokeWidth="1.2" />
            {i === 0 ? (
              <ellipse cx={ex} cy={py - pr * 0.12} rx={pr * 0.7} ry={pr * 0.3} fill={goods} stroke={INK} strokeWidth="0.8" />
            ) : (
              <rect x={ex - pr * 0.25} y={py - pr * 0.42} width={pr * 0.5} height={pr * 0.4} rx={pr * 0.06} fill={weight} stroke={INK} strokeWidth="0.8" />
            )}
          </g>
        );
      })}
    </Svg>
  );
}

Balance.bounds = (c) => {
  const { x = 800, y = 760, h = 120, w = 120 } = c;
  return [x - w * 0.75, y - h * 1.25, x + w * 0.75, y + 6];
};
