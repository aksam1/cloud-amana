// Turns any 2D layer into a painted card for the WebGL stage: the layer renders offscreen with its
// animations skipped to their final state, its SVG is drawn into a canvas, and the canvas becomes a
// texture. The look of the flat scenes carries over exactly; the GL stage adds depth, light and motion.
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { MotionGlobalConfig, motionValue } from 'motion/react';
import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter } from 'three';
import { LAYERS } from '../layers/index.js';
import { StageCtx } from '../components/stageKit.jsx';
import { AREA } from './space.js';

const MAX = 4096;
const cache = new Map();
const STILL = { x: motionValue(0), y: motionValue(0), z: motionValue(1), r: motionValue(0), s: motionValue(1) };
// A frame (so motion has applied its final values), or a longer wait where frames are not being drawn
// (a background tab), so painting never stalls.
const frame = () =>
  new Promise((r) => {
    requestAnimationFrame(() => r());
    setTimeout(r, 250);
  });
// Paints overlap, and motion's skip switch is global: it stays on until the last paint in flight is done.
let painting = 0;
let skipBefore = false;

// Only the art: placement and timing belong to the card, not to the picture painted on it.
const CARD_KEYS = new Set(['key', 'show', 'at', 'reveal', 'move', 'area', 'ppu', 'fade', 'z', 'depth', 'fog', 'focus', 'renderOrder', 'opacity', 'tint', 'light', 'sat', 'bright', 'blur', 'hue', 'rough', 'feather', 'dx', 'dz']);
export const artOf = (cfg) => Object.fromEntries(Object.entries(cfg).filter(([k]) => !CARD_KEYS.has(k)));

/** The design area a card captures: its own `area`, the painter's `bounds` for what it draws, or three frames. */
export const areaOf = (layer) => layer.area ?? LAYERS[layer.type]?.bounds?.(layer) ?? AREA;

/** Paint `cfg` (a 2D layer) over the design `area` [x0, y0, x1, y1] at `ppu` texture pixels per design unit. */
export function captureLayer(cfg, area, ppu = 0.7) {
  const art = artOf(cfg);
  const key = JSON.stringify([art, area, ppu]);
  if (!cache.has(key)) {
    const job = paint(art, area, ppu);
    // a painting that came out empty is not kept, so the next request paints it again
    job.then((r) => r.empty && cache.delete(key));
    cache.set(key, job);
  }
  return cache.get(key);
}

async function paint(cfg, area, ppu) {
  // begin outside whatever React work asked for the painting, so the synchronous render below is allowed
  await null;
  const [x0, y0, x1, y1] = area;
  const k = Math.min(ppu, MAX / (x1 - x0), MAX / (y1 - y0));
  const w = Math.round((x1 - x0) * k);
  const h = Math.round((y1 - y0) * k);
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-100000px;top:0;width:${w}px;height:${h}px;pointer-events:none;contain:strict;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  const Comp = LAYERS[cfg.type];
  const ctx = { vb: [x0, y0, x1 - x0, y1 - y0], size: { w, h }, cam: STILL, reduced: true, scene: {} };
  if (painting++ === 0) skipBefore = MotionGlobalConfig.skipAnimations;
  MotionGlobalConfig.skipAnimations = true;
  try {
    // committed at once, so the picture is in the page before it is copied, however busy the page is
    flushSync(() =>
      root.render(
        <StageCtx.Provider value={ctx}>
          <Comp cfg={cfg} beat={0} />
        </StageCtx.Provider>,
      ),
    );
    for (let i = 0; i < 3; i++) await frame();
  } finally {
    if (--painting === 0) MotionGlobalConfig.skipAnimations = skipBefore;
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  const svgs = [...host.querySelectorAll('svg')].filter((svg) => !svg.parentElement?.closest('svg'));
  for (const svg of svgs) {
    const copy = svg.cloneNode(true);
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    copy.setAttribute('width', String(w));
    copy.setAttribute('height', String(h));
    copy.removeAttribute('class');
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
    try {
      await img.decode();
      g.drawImage(img, 0, 0, w, h);
    } catch {
      // a layer that cannot be drawn as an image leaves its card empty rather than failing the scene
    }
  }
  root.unmount();
  host.remove();
  const cut = cutEdges(canvas, w, h);
  const texture = new CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4;
  return { texture, w, h, cut, empty: svgs.length === 0 };
}

/**
 * Which sides of a painting run off the edge of its card [left, right, top, bottom] (1 where they do): there
 * the card cuts the paint off, and the stage roughens the cut. A painting that ends inside its card keeps
 * its own edge (the far edge of a floor meeting a wall stays where it was painted).
 */
function cutEdges(src, w, h) {
  // the four edges are copied onto two small canvases kept for reading, so the painting itself (soon a
  // texture) is never read back
  const read = (cw, ch, draw) => {
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    const g = c.getContext('2d', { willReadFrequently: true });
    draw(g);
    return g.getImageData(0, 0, cw, ch).data;
  };
  const share = (data, from, count, step) => {
    let n = 0;
    for (let i = 0; i < count; i++) if (data[(from + i * step) * 4 + 3] > 24) n++;
    return n / count > 0.04 ? 1 : 0;
  };
  try {
    const cols = read(2, h, (g) => {
      g.drawImage(src, 0, 0, 1, h, 0, 0, 1, h);
      g.drawImage(src, w - 1, 0, 1, h, 1, 0, 1, h);
    });
    const rows = read(w, 2, (g) => {
      g.drawImage(src, 0, 0, w, 1, 0, 0, w, 1);
      g.drawImage(src, 0, h - 1, w, 1, 0, 1, w, 1);
    });
    return [share(cols, 0, h, 2), share(cols, 1, h, 2), share(rows, 0, w, 1), share(rows, w, w, 1)];
  } catch {
    return [1, 1, 0, 0];
  }
}
