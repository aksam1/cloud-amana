import tl from '../../src/story/timeline.json' with { type: 'json' };
import { parseDate, fillDates } from '../../src/lib/mapWorld.js';

const bp = fillDates(tl.nodes);
const raw = bp.slice(1).map((_, i) => {
  const d = Math.log10(bp[i] + 1) - Math.log10(bp[i + 1] + 1);
  return Math.max(d, 0);
});

function run(exp, minGap, span) {
  const r = raw.map((d) => Math.max(d, 1e-9) ** exp);
  const sum = (k) => r.reduce((t, v) => t + Math.max(minGap, k * v), 0);
  let lo = 0;
  let hi = 1e7;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (sum(mid) < span) lo = mid;
    else hi = mid;
  }
  const k = (lo + hi) / 2;
  const gaps = r.map((v) => Math.max(minGap, k * v));
  const floored = gaps.filter((g) => g <= minGap * 1.001).length;
  const pre = gaps.slice(0, 4).reduce((a, b) => a + b, 0);
  const prop = gaps.slice(5, 27).reduce((a, b) => a + b, 0);
  console.log(
    `exp ${exp}  min ${minGap}  span ${span}  k ${k.toFixed(1)}  ` +
      `creation→adam ${gaps[0].toFixed(0)}/${gaps[1].toFixed(0)}  ` +
      `adam→nuh ${gaps[2].toFixed(0)}  ` +
      `prophets avg ${(prop / 22).toFixed(0)}  prophets total ${prop.toFixed(0)}  ` +
      `pre-Adam total ${pre.toFixed(0)}  floored ${floored}/${gaps.length}`
  );
}

for (const exp of [0.55, 0.7, 0.85, 1.0]) for (const minGap of [90, 120, 150]) run(exp, minGap, 5200);
