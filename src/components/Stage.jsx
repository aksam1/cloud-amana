import { Component, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'motion/react';
import { LAYERS } from '../layers/index.js';
import { expandLayers, resolveLayer, visibleAt } from '../lib/story.js';
import { StageCtx } from './stageKit.jsx';

/*
 * Every scene is drawn in one 1600×900 design space. The visible window (viewBox) is fitted to
 * the screen so the central 900×900 "safe square" is always on screen: wide screens crop sky and
 * ground, phones in portrait reveal more sky above and earth below instead of squashing the art.
 */
export function viewBoxFor(w, h) {
  const a = w / Math.max(1, h);
  let vw;
  let vh;
  if (a >= 16 / 9) [vw, vh] = [1600, 1600 / a];
  else if (a >= 1) [vw, vh] = [900 * a, 900];
  else [vw, vh] = [900, 900 / a];
  return [800 - vw / 2, 450 - vh / 2, vw, vh];
}

export function useCamera() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const z = useMotionValue(1);
  const r = useMotionValue(0);
  const s = useMotionValue(1);
  return useMemo(() => ({ x, y, z, r, s }), [x, y, z, r, s]);
}

/**
 * Parallax: a layer at depth d moves d× as far as the camera and zooms 1+(z−1)·d.
 * Depth 0 is fixed to the screen (flashes, inserts); depth > 1 is foreground.
 * A scene's `focus` names the depth of its subjects, so camera values frame that plane exactly.
 */
function useParallax(cam, depth) {
  return useTransform([cam.x, cam.y, cam.z, cam.r, cam.s], ([x, y, z, r, s]) => {
    const zd = Math.max(0.05, 1 + (z - 1) * depth);
    return `scale(${zd}) rotate(${r * depth}deg) translate(${-x * depth * s}px, ${-y * depth * s}px)`;
  });
}

/** One layer that throws drops out of the picture instead of blanking the whole story (React still logs it). */
class LayerGuard extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const FILTER_KEYS = ['sat', 'bright', 'blur', 'hue'];
const usesFilter = (l) => FILTER_KEYS.some((k) => k in l || Object.values(l.at || {}).some((o) => k in o));
const filterOf = (c) => `saturate(${c.sat ?? 1}) brightness(${c.bright ?? 1}) blur(${c.blur ?? 0}px) hue-rotate(${c.hue ?? 0}deg)`;

function LayerShell({ layer, beat, z, cam, focus, dissolve }) {
  const cfg = resolveLayer(layer, beat);
  const transform = useParallax(cam, (cfg.depth ?? 1) / focus);
  const Comp = LAYERS[cfg.type];
  if (!Comp) {
    if (import.meta.env.DEV) console.warn(`Unknown layer type "${cfg.type}"`);
    return null;
  }
  const animate = { opacity: cfg.opacity ?? 1 };
  if (usesFilter(layer)) animate.filter = filterOf(cfg);
  return (
    <motion.div
      // `sweep` (ms) paints the layer in left to right when it first appears. The mask sits on this
      // outer box, which stays fixed to the screen, so art the camera pans to later is never cut off.
      className={cfg.sweep ? 'brush-reveal absolute inset-0' : 'absolute inset-0'}
      style={{ zIndex: z, mixBlendMode: cfg.blend, pointerEvents: 'none', '--dur': cfg.sweep && `${cfg.sweep}ms` }}
      initial={{ opacity: 0, ...(animate.filter ? { filter: animate.filter } : {}) }}
      animate={animate}
      exit={{ opacity: 0 }}
      // a layer's `fade` (ms) overrides the scene's `dissolve`, how long layers take to come and go
      transition={{ duration: (cfg.fade ?? dissolve) / 1000, ease: 'easeInOut' }}
    >
      <motion.div className="absolute inset-0" style={{ transform, transformOrigin: '50% 50%' }}>
        <LayerGuard>
          <Comp cfg={cfg} beat={beat} />
        </LayerGuard>
      </motion.div>
    </motion.div>
  );
}

/** `bare` leaves out the background, grain and vignette (the 2D writing laid over a WebGL scene). */
export function Stage({ scene, beat, cam, reduced, bare = false }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width && height) setSize({ w: width, h: height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const vb = useMemo(() => viewBoxFor(size.w, size.h), [size]);
  useEffect(() => cam.s.set(size.w / vb[2]), [size, vb, cam]);

  const layers = useMemo(() => expandLayers(scene.layers), [scene]);
  const ctx = useMemo(() => ({ vb, size, cam, reduced, scene }), [vb, size, cam, reduced, scene]);

  return (
    // `isolate` keeps the layers' z-indexes (one per layer, so long scenes reach the dozens) inside the
    // stage, below the player's captions and controls.
    <div ref={ref} className="absolute inset-0 isolate overflow-hidden" style={bare ? undefined : { background: scene.base || '#07060a' }}>
      <StageCtx.Provider value={ctx}>
        <AnimatePresence>
          {layers.map((l, i) => visibleAt(l, beat) && <LayerShell key={l.key} layer={l} beat={beat} z={i} cam={cam} focus={scene.focus ?? 1} dissolve={scene.dissolve ?? 1400} />)}
        </AnimatePresence>
      </StageCtx.Provider>
      {!bare && <div className="stage-grain" />}
      {!bare && <div className="stage-vignette" />}
    </div>
  );
}
