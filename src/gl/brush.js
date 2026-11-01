// Brush-stroke reveal masks. Each pixel holds the moment (0–1) the brush reaches it: overlapping strokes
// are laid down in order, each one painted from its start to its end, and the earliest stroke over a pixel
// wins. A card shows the pixels whose moment has passed, so it paints in stroke by stroke rather than fading.
import { CanvasTexture, LinearFilter } from 'three';
import { rng } from '../lib/geo.js';

const cache = new Map();

/** `dir`: the way the painting travels — "right", "left", "up" (from the bottom) or "down". */
export function brushMask(dir = 'right', seed = 3) {
  const key = `${dir}:${seed}`;
  if (cache.has(key)) return cache.get(key);
  const W = 512;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'darken';
  const r = rng(seed);
  const vertical = dir === 'up' || dir === 'down';
  const flip = dir === 'left' || dir === 'up';
  const L = vertical ? H : W;
  const S = vertical ? W : H;
  const rows = 9;
  const strokes = [];
  for (let row = 0; row < rows; row++) {
    for (let i = 0; i < 4; i++) {
      strokes.push({
        a: (i / 4) * L * 0.9 - L * 0.08 + (r() - 0.5) * L * 0.08,
        len: L * (0.32 + r() * 0.16),
        c: ((row + 0.5) / rows) * S + (r() - 0.5) * S * 0.04,
        w: (S / rows) * (1.3 + r() * 0.5),
        bow: (r() - 0.5) * S * 0.08,
      });
    }
  }
  // a gentle diagonal sweep: strokes that start further along come later, upper rows a little sooner
  strokes.sort((p, q) => p.a + p.c * 0.25 - (q.a + q.c * 0.25));
  const n = strokes.length;
  strokes.forEach((s, k) => {
    for (let j = 0; j <= 48; j++) {
      const t = j / 48;
      const along = s.a + t * s.len;
      const across = s.c + Math.sin(t * Math.PI) * s.bow;
      const shade = Math.round(Math.min(1, (k + t) / n) * 255);
      g.fillStyle = `rgb(${shade},${shade},${shade})`;
      // the brush swells mid-stroke and its bristles leave a ragged edge
      const rad = (s.w / 2) * (0.7 + 0.3 * Math.sin(t * Math.PI)) * (0.85 + r() * 0.3);
      const p = flip ? L - along : along;
      const [x, y] = vertical ? [across, p] : [p, across];
      g.beginPath();
      g.ellipse(x, y, vertical ? rad : rad * 1.7, vertical ? rad * 1.7 : rad, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  cache.set(key, texture);
  return texture;
}
