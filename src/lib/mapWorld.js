// Lays the timeline out as a campaign map: a winding road west → east through five regions,
// with procedural ink terrain placed around (never on) the road.
import { lerp, rng, sampleCurve } from './geo.js';

const SPACING = 214;
const ERA_GAP = 200;
const H = 1500;
const MID = 760;

export function buildWorld({ eras, nodes }) {
  let x = 380;
  let prev = null;
  const placed = nodes.map((n, i) => {
    if (prev && n.era !== prev) x += ERA_GAP;
    prev = n.era;
    const p = { ...n, i, x, y: MID + Math.sin(i * 0.93 + 0.4) * 250 + Math.sin(i * 0.37) * 90 };
    x += SPACING;
    return p;
  });
  const W = x + 360;
  const byId = Object.fromEntries(placed.map((n) => [n.id, n]));

  const segs = placed.slice(1).map((b, k) => {
    const a = placed[k];
    const p0 = placed[k - 1] || a;
    const p3 = placed[k + 2] || b;
    const c1 = [a.x + (b.x - p0.x) / 6, a.y + (b.y - p0.y) / 6];
    const c2 = [b.x - (p3.x - a.x) / 6, b.y - (p3.y - a.y) / 6];
    return { from: a.id, to: b.id, d: `M${a.x},${a.y} C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${b.x},${b.y}` };
  });

  const regions = eras.map((e) => {
    const ns = placed.filter((n) => n.era === e.id);
    return { ...e, x0: ns[0].x - 170, x1: ns.at(-1).x + 170, cx: (ns[0].x + ns.at(-1).x) / 2 };
  });
  const regionAt = (px) => regions.find((g) => px >= g.x0 - ERA_GAP / 2 && px <= g.x1 + ERA_GAP / 2)?.id;

  const road = sampleCurve(placed.map((n) => [n.x, n.y]), placed.length * 8);
  const nearRoad = (px, py, d) => road.some(([rx, ry]) => (rx - px) ** 2 + (ry - py) ** 2 < d * d);
  const r = rng(2024);

  const mountains = [];
  for (let k = 0; k < 320 && mountains.length < 190; k++) {
    const mx = 60 + r() * (W - 120);
    const my = 150 + r() * (H - 300);
    const reg = regionAt(mx);
    if (reg === 'creation' || nearRoad(mx, my, 150)) continue;
    mountains.push({ x: mx, y: my, s: 0.55 + r() * 1.05, v: Math.floor(r() * 3), dark: reg === 'lastday' });
  }
  mountains.sort((a, b) => a.y - b.y);

  const river = (cx, seed) => {
    const rr = rng(seed);
    return Array.from({ length: 8 }, (_, i) => [cx + (rr() - 0.5) * 220 + Math.sin(i) * 60, lerp(-40, H + 40, i / 7)]);
  };
  const at = (id, dx = 0) => (byId[id]?.x ?? 0) + dx;
  const rivers = [river(at('humanity', -110), 5), river(at('nuh', 105), 9), river(at('yusuf', 105), 13), river(at('dawud', 105), 17)];

  const scatter = (count, x0, x1, avoid = 90, seed = 1) => {
    const rr = rng(seed);
    const out = [];
    for (let k = 0; k < count * 4 && out.length < count; k++) {
      const px = lerp(x0, x1, rr());
      const py = 160 + rr() * (H - 320);
      if (!nearRoad(px, py, avoid)) out.push({ x: px, y: py, s: 0.6 + rr() * 0.8 });
    }
    return out;
  };
  const reg = Object.fromEntries(regions.map((g) => [g.id, g]));
  const trees = [...scatter(34, reg.adam.x0, reg.adam.x1, 95, 3), ...scatter(18, reg.prophets.x0, at('yusuf'), 95, 4)];
  const dunes = [...scatter(40, at('hud', -150), at('salih', 150), 80, 6), ...scatter(26, at('shuayb', -140), at('musa', 60), 80, 7), ...scatter(50, reg.messenger.x0, reg.messenger.x1, 80, 8)];
  const palms = scatter(16, reg.messenger.x0, reg.messenger.x1, 100, 10);
  const stars = scatter(110, reg.creation.x0 - 120, reg.creation.x1 + 60, 60, 12);
  const cracks = scatter(22, reg.lastday.x0, reg.lastday.x1 + 120, 90, 14);
  const yunus = byId.yunus;
  const sea = yunus ? { x: yunus.x, y: yunus.y > MID ? yunus.y - 330 : yunus.y + 330 } : null;

  return { W, H, nodes: placed, byId, segs, regions, mountains, rivers, trees, dunes, palms, stars, cracks, sea };
}
