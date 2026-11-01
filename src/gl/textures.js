// Small painted textures the WebGL stage draws many times: people of light, their glow, soldiers of dim
// light, and the long ink strokes of wind. Drawn once into canvases and shared.
import { CanvasTexture, LinearFilter, RepeatWrapping } from 'three';
import { BODY_PATH, rng } from '../lib/geo.js';

const cache = new Map();
const once = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};
const toTexture = (canvas, wrap = false) => {
  const t = new CanvasTexture(canvas);
  t.minFilter = LinearFilter;
  t.generateMipmaps = false;
  if (wrap) t.wrapS = t.wrapT = RepeatWrapping;
  return t;
};
const canvasOf = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
};
const alpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/**
 * A person of light, no face or detail: a soft body and head, the feet at the bottom centre of a 128×256
 * texture. `pose`: "stand", "raise" (an arm lifted, calling), "reach" (an arm held out) or "kneel".
 */
export function figureTexture(color = '#fff4d6', pose = 'stand') {
  return once(`fig:${color}:${pose}`, () => {
    const [c, g] = canvasOf(128, 256);
    g.translate(64, 250);
    g.scale(2.2, 2.2 * (pose === 'kneel' ? 0.6 : 1));
    g.filter = 'blur(1.3px)';
    const grad = g.createLinearGradient(0, -67, 0, 0);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.42, color);
    grad.addColorStop(1, alpha(color, 0.18));
    g.fillStyle = grad;
    g.fill(new Path2D(BODY_PATH));
    g.beginPath();
    g.arc(0, -77, 9.5, 0, Math.PI * 2);
    g.fillStyle = '#fffaf0';
    g.fill();
    if (pose === 'raise' || pose === 'reach') {
      g.strokeStyle = '#fffaf0';
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(6, -60);
      if (pose === 'raise') g.quadraticCurveTo(18, -84, 28, -108);
      else g.quadraticCurveTo(30, -68, 56, -72);
      g.stroke();
    }
    return toTexture(c);
  });
}

/** A soft round glow, white so a material colour can tint it. */
export function glowTexture() {
  return once('glow', () => {
    const [c, g] = canvasOf(256, 256);
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.14)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    return toTexture(c);
  });
}

/** A soldier of dim amber light: broad shoulders, a crested helmet, a round bronze shield and a spear. */
export function soldierTexture() {
  return once('soldier', () => {
    const [c, g] = canvasOf(128, 256);
    g.translate(64, 250);
    g.scale(2.2, 2.2);
    g.filter = 'blur(0.8px)';
    g.strokeStyle = '#6a4a2a';
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(16, 2);
    g.lineTo(22, -112);
    g.stroke();
    const grad = g.createLinearGradient(0, -70, 0, 0);
    grad.addColorStop(0, '#ffd89a');
    grad.addColorStop(0.5, '#d89a52');
    grad.addColorStop(1, 'rgba(160,100,50,0.25)');
    g.fillStyle = grad;
    g.fill(new Path2D('M-21,0 C-20,-28 -18,-48 -14,-60 C-10,-67 10,-67 14,-60 C18,-48 20,-28 21,0 Z'));
    g.beginPath();
    g.arc(0, -78, 10, 0, Math.PI * 2);
    g.fillStyle = '#e8b878';
    g.fill();
    g.fillStyle = '#8a3a22';
    g.fill(new Path2D('M-3,-88 C-2,-100 8,-104 14,-98 C8,-96 4,-92 3,-87 Z'));
    const shield = g.createRadialGradient(-14, -44, 2, -12, -40, 20);
    shield.addColorStop(0, '#f0c87a');
    shield.addColorStop(0.6, '#b8803e');
    shield.addColorStop(1, '#6a4420');
    g.fillStyle = shield;
    g.beginPath();
    g.ellipse(-12, -40, 15, 19, 0, 0, Math.PI * 2);
    g.fill();
    return toTexture(c);
  });
}

/** Long sweeping strokes of wind painted in ink, tiling sideways. */
export function windTexture(seed = 5, tone = 'pale') {
  return once(`wind:${seed}:${tone}`, () => {
    const [c, g] = canvasOf(1024, 512);
    const r = rng(seed);
    for (let i = 0; i < 26; i++) {
      const y = r() * 512;
      const w = 8 + r() * 46;
      const shade = tone === 'pale' ? 200 + r() * 40 : 30 + r() * 40;
      g.strokeStyle = `rgba(${shade},${shade - 10},${shade - 24},${0.05 + r() * 0.16})`;
      g.lineWidth = w;
      g.lineCap = 'round';
      g.beginPath();
      const x0 = r() * 1024;
      g.moveTo(x0 - 600, y + (r() - 0.5) * 60);
      g.bezierCurveTo(x0 - 200, y - 40 + r() * 80, x0 + 200, y - 40 + r() * 80, x0 + 600, y + (r() - 0.5) * 60);
      g.stroke();
    }
    return toTexture(c, true);
  });
}
