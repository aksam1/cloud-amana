// Canvas layers for things there are too many of for SVG, or that move on their own: particles,
// a flock of sheep, and the globe of lights.
import { useEffect, useRef } from 'react';
import { useStage } from '../components/stageKit.jsx';
import { mixColor, rng, vnoise } from '../lib/geo.js';

const KINDS = {
  embers: { colors: ['#ffb347', '#ff7a2a', '#ffd27a', '#ff5a1f'], size: [1, 2.8], vx: [-14, 14], vy: [-95, -35], life: [3, 7], sway: 22, glow: true, from: 'area' },
  dust: { colors: ['#f6dfa4', '#fff1c9'], size: [0.6, 1.8], vx: [-5, 5], vy: [-16, -4], life: [7, 13], sway: 9, glow: true, alpha: 0.65, from: 'area' },
  snow: { colors: ['#ffffff', '#eef2f6'], size: [1.2, 2.8], vx: [-10, 10], vy: [30, 62], life: [14, 22], sway: 22, from: 'top' },
  petals: { colors: ['#f7c6d0', '#fde8ec', '#ffffff'], size: [2.6, 4.6], vx: [12, 42], vy: [24, 46], life: [14, 22], sway: 30, shape: 'leaf', from: 'top' },
  leaves: { colors: ['#c8642a', '#e08a3a', '#9a4a22', '#d9a441'], size: [3.2, 6], vx: [24, 64], vy: [36, 72], life: [10, 16], sway: 28, shape: 'leaf', from: 'top' },
  rain: { colors: ['#d9dce6'], size: [26, 50], vx: [-170, -130], vy: [950, 1250], life: [2.4, 2.4], shape: 'line', alpha: 0.32, from: 'top' },
  sparks: { colors: ['#fff6dc', '#ffe2a0', '#ffffff'], size: [1, 2.4], life: [2.5, 4.5], glow: true, shape: 'spiral', from: 'origin' },
  rise: { colors: ['#fff6dc', '#ffe6a8', '#ffffff'], size: [1, 2.8], vx: [-10, 10], vy: [-70, -32], life: [6, 10], sway: 12, glow: true, from: 'origin' },
  downpour: { colors: ['#c9cfdc', '#aab2c4'], size: [70, 130], vx: [-300, -240], vy: [1600, 2000], life: [1.6, 1.6], shape: 'line', alpha: 0.42, from: 'top' },
  spray: { colors: ['#ffffff', '#e8f0f4'], size: [1, 3], vx: [-90, 90], vy: [-160, -60], life: [1.2, 2.2], sway: 10, alpha: 0.75, from: 'area' },
  ash: { colors: ['#8d8781', '#6f6964'], size: [0.8, 2], vx: [-12, 6], vy: [10, 26], life: [10, 16], sway: 16, alpha: 0.55, from: 'top' },
};

const pick = ([a, b], r) => a + (b - a) * r();

function useCanvas(draw) {
  const ref = useRef(null);
  const { vb, size } = useStage();
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    const k = (size.w / vb[2]) * dpr;
    const view = { k, ox: vb[0], oy: vb[1], vb };
    let raf;
    let last = performance.now();
    const start = last;
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(k, 0, 0, k, -view.ox * k, -view.oy * k);
      drawRef.current(ctx, dt, (now - start) / 1000, view);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [vb, size]);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

/** Drifting particles in design coordinates. `kind` and `count` may change per beat. */
export function Particles({ cfg }) {
  const { reduced } = useStage();
  const state = useRef({ parts: [], r: rng(cfg.seed || 9), warm: false });
  return useCanvas((ctx, dt, t, view) => {
    const s = state.current;
    const kind = KINDS[cfg.kind] || KINDS.dust;
    const target = Math.round((cfg.count ?? 80) * (reduced ? 0.3 : 1));
    const [vx0, vy0, vw, vh] = view.vb;
    const area = cfg.area || [vx0, vy0, vx0 + vw, vy0 + vh];
    const o = cfg.origin || { x: 800, y: 600, r: 30 };
    const spawn = (prewarm) => {
      const r = s.r;
      // `scale` enlarges each mote: petals drifting right past the lens are big and soft
      const p = { k: cfg.kind, c: kind.colors[Math.floor(r() * kind.colors.length)], s: pick(kind.size, r) * (cfg.scale ?? 1), life: pick(kind.life, r), age: prewarm ? r() * pick(kind.life, r) : 0, ph: r() * 6.28, rot: r() * 6.28 };
      if (kind.shape === 'spiral') Object.assign(p, { a0: r() * 6.28, x: o.x, y: o.y });
      else {
        p.vx = pick(kind.vx, r);
        p.vy = pick(kind.vy, r);
        if (kind.from === 'origin') Object.assign(p, { x: o.x + (r() - 0.5) * o.r * 2, y: o.y + (r() - 0.5) * o.r });
        else if (kind.from === 'top' && !prewarm) Object.assign(p, { x: area[0] + r() * (area[2] - area[0]) - p.vx * 2, y: area[1] - 30 });
        else Object.assign(p, { x: area[0] + r() * (area[2] - area[0]), y: area[1] + r() * (area[3] - area[1]) });
      }
      s.parts.push(p);
    };
    if (!s.warm) {
      for (let i = 0; i < target; i++) spawn(true);
      s.warm = true;
    }
    const rate = target / ((kind.life[0] + kind.life[1]) / 2);
    s.acc = (s.acc || 0) + rate * dt;
    while (s.acc >= 1 && s.parts.length < target * 1.2) {
      spawn(false);
      s.acc -= 1;
    }
    ctx.globalCompositeOperation = kind.glow ? 'lighter' : 'source-over';
    s.parts = s.parts.filter((p) => {
      p.age += dt;
      if (p.age > p.life) return false;
      const lifeT = p.age / p.life;
      const fade = Math.min(1, lifeT * 5, (1 - lifeT) * 3) * (kind.alpha ?? 1);
      const K = KINDS[p.k] || kind;
      if (K.shape === 'spiral') {
        const rad = 14 + p.age * 46;
        p.x = o.x + Math.cos(p.a0 + p.age * 3.2) * rad;
        p.y = o.y - p.age * 150 + Math.sin(p.a0 + p.age * 3.2) * rad * 0.3;
      } else {
        p.x += (p.vx + Math.sin(t * 1.3 + p.ph) * (K.sway || 0)) * dt;
        p.y += p.vy * dt;
      }
      ctx.globalAlpha = Math.max(0, fade);
      ctx.fillStyle = p.c;
      if (K.shape === 'line') {
        ctx.strokeStyle = p.c;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.04, p.y - p.s);
        ctx.stroke();
      } else if (K.shape === 'leaf') {
        p.rot += dt * 1.6;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.s, p.s * 0.45, p.rot, 0, Math.PI * 2);
        ctx.fill();
      } else {
        if (K.glow) {
          ctx.globalAlpha = Math.max(0, fade * 0.18);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s * 3.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = Math.max(0, fade);
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fill();
      }
      return p.y > area[1] - 400 && p.y < area[3] + 400;
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  });
}

/** A point that slides from (x, y) to `to` over `dur` ms after `born` (or stays put without `to`). */
function glide({ x, y, to, dur = 6000 }, born, now) {
  if (!to) return [x, y];
  const k = Math.min(1, (now - born) / dur);
  const e = k * k * (3 - 2 * k);
  return [x + (to[0] - x) * e, y + (to[1] - y) * e];
}

/**
 * A flock that moves like slow water: each sheep wanders on its own noise, keeps a little apart, stays
 * within the flock (`cx`, `cy`, `w`, `h`, carried along by `drift` {to, dur}) and parts around the
 * shepherd (`around` {x, y, r, to?, dur?}). `flow` [vx, vy] is the flock's walking pace; `rest` lays
 * every sheep down in the grass. Painted wool, not light.
 */
export function Flock({ cfg }) {
  const { reduced } = useStage();
  const st = useRef(null);
  if (!st.current) {
    const { cx = 800, cy = 700, w = 300, h = 50, count = 24, size = 24, seed = 21 } = cfg;
    const r = rng(seed);
    st.current = {
      born: performance.now(),
      sheep: Array.from({ length: count }, () => {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r());
        return { x: cx + (Math.cos(a) * d * w) / 2, y: cy + (Math.sin(a) * d * h) / 2, vx: 0, vy: 0, ph: r() * 100, s: size * (0.8 + r() * 0.35), tone: r(), face: r() < 0.5 ? -1 : 1, legs: r() * 6, graze: r() * 6, grazing: r() < 0.4 };
      }),
    };
  }
  return useCanvas((ctx, dt, t) => {
    const { cx = 800, cy = 700, w = 300, h = 50, flow = [0, 0], wander = 9, rest = false, color = '#ece6d8', shade = '#b9ae9a', head = '#5e5246', rim = '#fff3d4' } = cfg;
    const now = performance.now();
    const S = st.current;
    const [ccx, ccy] = glide({ x: cx, y: cy, ...cfg.drift }, S.born, now);
    const shep = cfg.around && glide(cfg.around, S.born, now);
    const still = rest || reduced;
    if (!still) {
      for (const s of S.sheep) {
        const ang = (vnoise(t * 0.07 + s.ph) - 0.5) * 5;
        let ax = flow[0] + Math.cos(ang) * wander;
        let ay = flow[1] + Math.sin(ang) * wander * 0.35;
        const ex = (s.x - ccx) / (w / 2);
        const ey = (s.y - ccy) / (h / 2);
        const e = ex * ex + ey * ey;
        if (e > 1) {
          ax -= ex * (e - 1) * 28;
          ay -= ey * (e - 1) * 12;
        }
        if (shep) {
          const dx = s.x - shep[0];
          const dy = (s.y - shep[1]) * 2.4;
          const d = Math.hypot(dx, dy) || 1;
          const rr = cfg.around.r ?? 50;
          if (d < rr) {
            const k = (1 - d / rr) * 70;
            ax += (dx / d) * k;
            ay += (dy / d) * k * 0.4;
          }
        }
        for (const o of S.sheep) {
          if (o === s) continue;
          const dx = s.x - o.x;
          const dy = (s.y - o.y) * 2;
          const d = Math.hypot(dx, dy) || 1;
          const min = (s.s + o.s) * 0.5;
          if (d < min) {
            ax += (dx / d) * (min - d) * 3;
            ay += (dy / d) * (min - d) * 1;
          }
        }
        s.graze -= dt;
        if (s.graze < 0) {
          s.grazing = !s.grazing;
          s.graze = s.grazing ? 2 + Math.random() * 4 : 3 + Math.random() * 7;
        }
        const k = s.grazing ? 0.15 : 1;
        const blend = Math.min(1, dt * 1.4);
        s.vx += (ax * k - s.vx) * blend;
        s.vy += (ay * k - s.vy) * blend;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (Math.abs(s.vx) > 2.5) s.face = Math.sign(s.vx);
        s.legs += Math.hypot(s.vx, s.vy) * dt * 0.45;
      }
    }
    const ell = (x, y, rx, ry, rot = 0) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
      ctx.fill();
    };
    for (const s of [...S.sheep].sort((a, b) => a.y - b.y)) {
      const L = s.s;
      const down = still || s.grazing;
      ctx.fillStyle = 'rgba(26, 20, 12, 0.22)';
      ell(s.x, s.y + 1, L * 0.56, L * 0.12);
      if (!rest) {
        const sw = Math.sin(s.legs) * L * 0.07 * Math.min(1, Math.hypot(s.vx, s.vy) / 6);
        ctx.strokeStyle = head;
        ctx.lineWidth = L * 0.075;
        ctx.lineCap = 'round';
        [-0.27, -0.13, 0.13, 0.27].forEach((lx, i) => {
          const off = (i % 2 ? 1 : -1) * sw;
          ctx.beginPath();
          ctx.moveTo(s.x + lx * L, s.y - L * 0.2);
          ctx.lineTo(s.x + lx * L + off, s.y);
          ctx.stroke();
        });
      }
      const by = s.y - (rest ? L * 0.15 : L * 0.31);
      ctx.fillStyle = shade;
      ell(s.x, by + L * 0.05, L * 0.5, L * 0.23);
      ctx.fillStyle = mixColor(color, shade, s.tone * 0.35);
      ell(s.x, by, L * 0.47, L * 0.21);
      ctx.fillStyle = mixColor(color, '#ffffff', 0.25);
      for (let k = 0; k < 3; k++) ell(s.x + (-0.22 + k * 0.22) * L, by - L * 0.11, L * 0.13, L * 0.1);
      ctx.fillStyle = head;
      ell(s.x + s.face * L * 0.5, by + (down ? L * 0.15 : -L * 0.05), L * 0.14, L * 0.1, s.face * 0.45);
      ell(s.x + s.face * L * 0.43, by + (down ? L * 0.06 : -L * 0.13), L * 0.07, L * 0.035, -s.face * 0.5);
      ctx.strokeStyle = rim;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = L * 0.05;
      ctx.beginPath();
      ctx.ellipse(s.x, by, L * 0.45, L * 0.19, 0, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  });
}

function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * The curved earth against the stars, every human life a point of light (5:32).
 * phase: 'appear' → lights come on in waves · 'dark' → one goes out, a shadow ripples across all ·
 * 'gold' → one flares, a warm gold wave spreads and stays.
 */
export function Globe({ cfg }) {
  const g = useRef(null);
  if (!g.current) {
    const r = rng(cfg.seed || 17);
    const blobs = Array.from({ length: 7 }, () => {
      const cx = (r() - 0.5) * 1.5;
      const cy = -0.95 + r() * 0.62;
      const rad = 0.1 + r() * 0.17;
      return Array.from({ length: 26 }, (_, i) => {
        const a = (i / 26) * Math.PI * 2;
        const rr = rad * (0.7 + r() * 0.5);
        return [cx + Math.cos(a) * rr * 1.4, cy + Math.sin(a) * rr];
      });
    });
    const lights = [];
    let guard = 0;
    while (lights.length < (cfg.lights || 1500) && guard++ < 40000) {
      const u = (r() - 0.5) * 2;
      const v = -r();
      if (u * u + v * v > 0.97) continue;
      if (blobs.some((b) => inPoly(u, v, b))) lights.push({ u, v, d: Math.hypot(u + 0.6, v + 0.6), tw: r() * 6.28 });
    }
    const pivot = (tu, tv) => lights.reduce((best, l) => (Math.hypot(l.u - tu, l.v - tv) < Math.hypot(best.u - tu, best.v - tv) ? l : best), lights[0]);
    // The appear clock starts at mount, even when a viewer jumps straight to a later beat.
    g.current = { blobs, lights, dark: pivot(-0.1, -0.62), gold: pivot(0.18, -0.58), phases: { appear: performance.now() } };
  }
  const st = g.current;
  if (!st.phases[cfg.phase || 'appear']) st.phases[cfg.phase || 'appear'] = performance.now();

  return useCanvas((ctx, dt, t) => {
    const { x = 800, y = 1180, r: R1 = 760, r0, zoomDur = 7000 } = cfg;
    const now = performance.now();
    const born = st.phases.appear || now;
    const zt = Math.min(1, (now - born) / zoomDur);
    const ease = 1 - Math.pow(1 - zt, 3);
    const R = r0 ? r0 + (R1 - r0) * ease : R1;

    const sphere = ctx.createRadialGradient(x - R * 0.2, y - R * 0.5, R * 0.1, x, y, R);
    sphere.addColorStop(0, '#24506e');
    sphere.addColorStop(0.7, '#122c45');
    sphere.addColorStop(1, '#0a1828');
    ctx.fillStyle = sphere;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(64, 104, 78, 0.78)';
    st.blobs.forEach((b) => {
      ctx.beginPath();
      b.forEach(([u, v], i) => (i ? ctx.lineTo(x + u * R, y + v * R) : ctx.moveTo(x + u * R, y + v * R)));
      ctx.closePath();
      ctx.fill();
    });

    const rim = ctx.createRadialGradient(x, y, R * 0.94, x, y, R * 1.12);
    rim.addColorStop(0, 'rgba(140, 200, 255, 0)');
    rim.addColorStop(0.35, 'rgba(160, 210, 255, 0.35)');
    rim.addColorStop(1, 'rgba(160, 210, 255, 0)');
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(x, y, R * 1.12, 0, Math.PI * 2);
    ctx.fill();

    const tDark = st.phases.dark;
    const tGold = st.phases.gold;
    ctx.globalCompositeOperation = 'lighter';
    for (const l of st.lights) {
      const on = Math.min(1, Math.max(0, ((now - born) / 1000 - 1.5 - l.d * 2.2) / 0.8));
      if (on <= 0) continue;
      let a = on * (0.55 + 0.35 * Math.sin(t * 2 + l.tw));
      let col = [255, 244, 214];
      let sz = 1.6;
      if (tDark) {
        if (l === st.dark) a = 0;
        else {
          const rho = ((now - tDark) / 1000) * 0.42;
          const dist = Math.hypot(l.u - st.dark.u, l.v - st.dark.v);
          const band = Math.abs(dist - rho);
          if (band < 0.14) a *= 0.12 + band * 6;
        }
      }
      if (tGold) {
        const rho = ((now - tGold) / 1000) * 0.38;
        const dist = Math.hypot(l.u - st.gold.u, l.v - st.gold.v);
        if (dist < rho) {
          col = [255, 205, 110];
          a = Math.min(1, a * 1.35 + 0.15);
          sz = 2;
        }
        if (l === st.gold) {
          a = 1;
          sz = 3 + Math.sin(t * 4) * 0.8;
          ctx.fillStyle = 'rgba(255, 220, 140, 0.25)';
          ctx.beginPath();
          ctx.arc(x + l.u * R, y + l.v * R, 26, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${a.toFixed(3)})`;
      ctx.fillRect(x + l.u * R - sz / 2, y + l.v * R - sz / 2, sz, sz);
    }
    ctx.globalCompositeOperation = 'source-over';
  });
}
