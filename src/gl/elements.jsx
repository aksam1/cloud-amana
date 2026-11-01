// What a WebGL scene is made of. Cards are painted 2D layers standing at their depth (brush-revealed,
// fogged by distance, blurred when out of focus). Lights are people of light with a breathing, layered
// glow. Crowds and armies are thousands of them drawn at once. Dust, ribbons and storms are particles and
// ink strokes drifting on a gentle noise field, never in straight lines.
import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, InstancedBufferAttribute, InstancedBufferGeometry, NormalBlending, PlaneGeometry, ShaderMaterial, Vector3 } from 'three';
import { areaOf, artOf, captureLayer } from './capture.jsx';
import { brushMask } from './brush.js';
import { figureTexture, glowTexture, soldierTexture, windTexture } from './textures.js';
import { place, scaleAt, shift, world, zOf } from './space.js';
import { resolveLayer, visibleAt } from '../lib/story.js';
import { rng } from '../lib/geo.js';

const clamp01 = (v) => Math.min(1, Math.max(0, v));

/**
 * Fades a layer in while its `show` covers the beat and out after; `since` is when it last appeared. In
 * still mode (reviewing one moment), and on a beat the stage reached by dissolving through a snapshot of
 * the last shot (`snapBeat`), everything stands at once in its final state.
 */
export function usePresence(layer, beat, dissolve, env, gone = false) {
  const on = visibleAt(layer, beat) && !gone;
  const st = useRef(null);
  if (st.current === null) st.current = { o: env.current.still && on ? 1 : 0, since: null };
  const fade = Math.max(0.05, (typeof layer.fade === 'number' ? layer.fade : dissolve) / 1000);
  useFrame(({ clock }, dt) => {
    const s = st.current;
    if (on && s.since === null) s.since = clock.elapsedTime;
    if (!on && s.o === 0) s.since = null;
    const target = on ? 1 : 0;
    if (env.current.still || env.current.snapBeat === beat) s.o = target;
    else s.o += Math.sign(target - s.o) * Math.min(Math.abs(target - s.o), dt / fade);
  });
  return st;
}

/**
 * How far along a timed motion is (0–1): `dur` ms after `delay` ms from `start`. In still mode it stands at
 * the held `moment` of the beat (the end, unless the review asks for part way), counting delays too.
 */
const progressOf = (env, now, start, delay, dur) => {
  const e = env.current;
  if (e.still) return e.moment >= 1 ? 1 : Math.min(1, Math.max(0, (e.moment * (delay + dur) - delay) / Math.max(1, dur)));
  return Math.min(1, Math.max(0, (now - start - delay / 1000) / Math.max(0.001, dur / 1000)));
};

/** Keyframes along [x, y, z] points at an even pace (times follow the distance walked). */
function track(points) {
  const d = [0];
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    d.push(d[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], (b[2] ?? 0) - (a[2] ?? 0)));
  }
  const total = d.at(-1) || 1;
  const at = (u) => {
    const s = clamp01(u) * total;
    let i = 1;
    while (i < d.length - 1 && d[i] < s) i++;
    const f = (s - d[i - 1]) / Math.max(1e-6, d[i] - d[i - 1]);
    const [a, b] = [points[i - 1], points[i]];
    return a[2] === undefined && b[2] === undefined ? [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f] : [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, (a[2] ?? 0) + ((b[2] ?? 0) - (a[2] ?? 0)) * f];
  };
  return at;
}

// ── Cards ────────────────────────────────────────────────

const cardVertex = /* glsl */ `
varying vec2 vUv;
varying float vDepth;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

// A breakable card is cut into shards (`shardGeometry`): until `shatterT` passes 0 they sit edge to edge,
// exactly the flat card; then each flies out from the middle with its own push and spin, falls under
// gravity and comes to rest on the floor line, still carrying its piece of the painting.
const shardVertex = /* glsl */ `
attribute vec3 aCenter;
attribute vec3 aRand;
uniform float shatterT;
uniform float grav;
uniform float spread;
uniform float spin;
uniform float floorY;
varying vec2 vUv;
varying float vDepth;
void main() {
  vUv = uv;
  vec3 p = position;
  float t = shatterT - aRand.z * 0.45;
  if (t > 0.0) {
    vec2 local = p.xy - aCenter.xy;
    float len = length(aCenter.xy);
    vec2 dir = len > 0.001 ? aCenter.xy / len : vec2(0.0, 1.0);
    vec2 c = aCenter.xy + dir * spread * (0.4 + aRand.x) * t + vec2((aRand.y - 0.5) * spread * 0.5 * t, spread * 0.3 * t);
    c.y -= 0.5 * grav * t * t;
    c.y = max(c.y, floorY + abs(local.y) * 0.35);
    float ang = (aRand.x - 0.5) * spin * min(t, 1.1);
    float ca = cos(ang);
    float sa = sin(ang);
    p = vec3(c + vec2(ca * local.x - sa * local.y, sa * local.x + ca * local.y), (aRand.y - 0.5) * spread * 0.5 * min(t, 1.4));
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

/** A `w` × `h` card cut into `cols` × `rows` jittered cells, two triangle shards each, every shard with its own vertices. */
function shardGeometry(w, h, cols, rows, seed) {
  const r = rng(seed);
  const grid = [];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const edge = i === 0 || j === 0 || i === cols || j === rows;
      grid.push([-w / 2 + (i / cols) * w + (edge ? 0 : (r() - 0.5) * (w / cols) * 0.7), -h / 2 + (j / rows) * h + (edge ? 0 : (r() - 0.5) * (h / rows) * 0.7)]);
    }
  }
  const at = (i, j) => grid[j * (cols + 1) + i];
  const pos = [];
  const uv = [];
  const centre = [];
  const rand = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const [a, b, c, d] = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)];
      const tris = r() < 0.5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
      for (const tri of tris) {
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
        const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
        const rr = [r(), r(), r()];
        for (const [x, y] of tri) {
          pos.push(x, y, 0);
          uv.push(x / w + 0.5, y / h + 0.5);
          centre.push(cx, cy, 0);
          rand.push(...rr);
        }
      }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setAttribute('aCenter', new Float32BufferAttribute(centre, 3));
  g.setAttribute('aRand', new Float32BufferAttribute(rand, 3));
  return g;
}

const cardFragment = /* glsl */ `
uniform sampler2D map;
uniform sampler2D map2;
uniform float swap;
uniform sampler2D mask;
uniform float progress;
uniform float useMask;
uniform float opacity;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
uniform float haze;
uniform float focus;
uniform float dof;
uniform float light;
uniform vec3 tint;
uniform float tintAmt;
uniform float sat;
uniform vec2 texel;
uniform float rough;
uniform float feather;
uniform vec2 cutY;
varying vec2 vUv;
varying float vDepth;
float h21(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  // depth of field: cards away from the focal distance sample blurrier mip levels
  float bias = dof * clamp(abs(vDepth - focus) / max(focus, 1.0), 0.0, 1.0) * 5.0;
  // a hand holds the brush: the picture is read through a gentle wobble fixed to the painting, so ruled
  // edges waver a little and stay that way as the camera moves
  vec2 px = vUv / texel;
  vec2 w = vec2(vn(px / 90.0), vn(px / 90.0 + 31.7)) - 0.5 + (vec2(vn(px / 26.0 + 3.1), vn(px / 26.0 + 8.9)) - 0.5) * 0.45;
  vec2 uv = vUv + w * texel * 6.0 * rough;
  vec4 c = mix(texture2D(map, uv, bias), texture2D(map2, uv, bias), swap);
  // dry brush: where the paint thins out at the edge of a shape, the paper shows through in flecks. An
  // edge is where the painting's cover changes sharply (it differs from its blurred self); a soft wash that
  // is evenly half-clear, like a cloud, has no edge inside it and stays whole
  float soft = mix(texture2D(map, uv, bias + 2.0).a, texture2D(map2, uv, bias + 2.0).a, swap);
  float edgeBand = smoothstep(0.06, 0.3, abs(c.a - soft));
  c.a *= 1.0 - edgeBand * rough * 0.35 * smoothstep(0.4, 0.8, vn(px / 3.5));
  // where a card cuts its painting off, the paint gives out the way a dry brush does: a ragged edge that
  // wanders in and out, broken into streaks along the stroke, never a ruled line. Its sides always do; its
  // top and bottom only where the painting runs off them (cutY: bottom, top), so a painting that ends
  // inside its card (the far edge of a floor) keeps the edge it was painted with.
  if (feather > 0.0) {
    vec2 tex = 1.0 / texel;
    float dx = min(vUv.x, 1.0 - vUv.x) * tex.x / feather;
    float dy = min(mix(1e3, vUv.y, cutY.x), mix(1e3, 1.0 - vUv.y, cutY.y)) * tex.y / feather;
    float sx = dx + (vn(vec2(px.y / 37.0, vUv.x < 0.5 ? 5.3 : 9.1)) - 0.5) * 0.9 + (vn(vec2(px.y / 5.0, px.x / 19.0)) - 0.5) * 0.35;
    float sy = dy + (vn(vec2(px.x / 37.0, vUv.y < 0.5 ? 2.7 : 7.7)) - 0.5) * 0.9 + (vn(vec2(px.x / 5.0, px.y / 19.0)) - 0.5) * 0.35;
    c.a *= smoothstep(0.05, 0.7, sx) * smoothstep(0.05, 0.7, sy);
  }
  if (useMask > 0.5) {
    float m = texture2D(mask, vUv).r;
    c.a *= 1.0 - smoothstep(progress - 0.06, progress + 0.002, m);
  }
  // the wash settled unevenly on the paper: soft mottling that belongs to the painting and moves with it
  vec3 col = c.rgb * (0.94 + 0.12 * rough * (vn(px / 170.0) * 0.6 + vn(px / 48.0) * 0.4));
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, sat) * light;
  col = mix(col, tint, tintAmt);
  col = mix(col, fogColor, smoothstep(fogNear, fogFar, vDepth) * haze);
  gl_FragColor = vec4(col, c.a * opacity);
  if (gl_FragColor.a < 0.004) discard;
}`;

/**
 * A painted card: any 2D layer, captured over its design `area` and stood at its depth. `reveal`
 * {dir, dur, delay} paints it in stroke by stroke when it first appears; `move` {path, dur, delay} slides
 * it along design-unit offsets (a block hauled up a ramp, a caravan crossing); `light`, `sat`, `tint`
 * [colour, amount] and `fog` (how much distance haze it takes, 0 for a sky) grade it; per-beat changes to its art crossfade to a fresh painting.
 * Its edges are read as if brushed (`rough`, 0 for crisp) and wherever it cuts its painting off, on any side, the
 * paint gives out raggedly over `feather` texture pixels.
 * Every element stands where its montage `set` puts it (`dx` across, `dz` along the camera's flight).
 */
export function Card({ layer, beat, env, dissolve }) {
  const cfg = resolveLayer(layer, beat);
  const z = zOf(layer);
  const k = scaleAt(z);
  const area = useMemo(() => areaOf(layer), [layer]);
  const ppu = layer.ppu ?? 0.7;
  const pres = usePresence(layer, beat, dissolve, env);
  const mesh = useRef(null);
  // a card that breaks in some beat (`shatter`) is cut into shards from the start, edge to edge until then
  const breakable = !!layer.shatter || Object.values(layer.at ?? {}).some((a) => a && a.shatter);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          shatterT: { value: -1 },
          grav: { value: 0 },
          spread: { value: 0 },
          spin: { value: 0 },
          floorY: { value: -1e6 },
          map: { value: null },
          map2: { value: null },
          swap: { value: 0 },
          mask: { value: layer.reveal ? brushMask(layer.reveal.dir || 'right', layer.reveal.seed || 3) : null },
          progress: { value: layer.reveal ? 0 : 1.1 },
          useMask: { value: layer.reveal ? 1 : 0 },
          opacity: { value: 0 },
          fogColor: { value: new Color('#ffffff') },
          fogNear: { value: 1e5 },
          fogFar: { value: 2e5 },
          haze: { value: 1 },
          focus: { value: 1000 },
          dof: { value: 0 },
          light: { value: 1 },
          tint: { value: new Color('#000000') },
          tintAmt: { value: 0 },
          sat: { value: 1 },
          texel: { value: [1 / 1024, 1 / 1024] },
          rough: { value: layer.rough ?? 1 },
          feather: { value: layer.feather ?? 36 },
          cutY: { value: [0, 0] },
        },
        vertexShader: breakable ? shardVertex : cardVertex,
        fragmentShader: cardFragment,
        transparent: true,
        depthWrite: false,
      }),
    [layer.reveal, breakable],
  );
  const artKey = JSON.stringify(artOf(cfg));
  const loaded = useRef(null);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    let live = true;
    captureLayer(cfg, area, ppu).then(({ texture, w, h, cut }) => {
      if (!live) return;
      // sent to the GPU now rather than on the card's first frame, so a new shot never stalls on uploads
      gl.initTexture(texture);
      const u = material.uniforms;
      u.texel.value = [1 / w, 1 / h];
      u.cutY.value = [cut[3], cut[2]];
      // a shot reached through the dissolve (or held still) stands complete: its art is not crossfaded
      const e = env.current;
      if (!u.map.value || e.still || e.snapBeat === beat) {
        u.map.value = texture;
        u.map2.value = texture;
        u.swap.value = 0;
      } else {
        u.map2.value = texture;
        u.swap.value = 0.0001;
      }
      loaded.current = true;
    });
    return () => {
      live = false;
    };
    // the art key stands for cfg, area and ppu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artKey, material]);
  const move = useMemo(() => (cfg.move ? { at: track([[0, 0, 0], ...cfg.move.path]), dur: cfg.move.dur ?? 6000, delay: cfg.move.delay ?? 0, key: JSON.stringify(cfg.move) } : null), [cfg.move]);
  const moveStart = useRef(null);
  useEffect(() => {
    moveStart.current = null;
  }, [move?.key]);
  const [x0, y0, x1, y1] = area;
  const shotZ = layer.dz ?? 0;
  const base = [((x0 + x1) / 2 - 800) * k + (layer.dx ?? 0), (450 - (y0 + y1) / 2) * k, z + shotZ];
  const shards = useMemo(() => {
    if (!breakable) return null;
    const sh = layer.shatter ?? Object.values(layer.at ?? {}).find((a) => a && a.shatter).shatter;
    return shardGeometry((x1 - x0) * k, (y1 - y0) * k, sh.cols ?? 6, sh.rows ?? 9, sh.seed ?? 5);
    // cut once per card
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakable, x0, y0, x1, y1, k]);
  const broke = useRef(null);
  useFrame(({ clock }, dt) => {
    const u = material.uniforms;
    const e = env.current;
    const o = pres.current.o * (cfg.opacity ?? 1);
    u.opacity.value = loaded.current ? o : 0;
    mesh.current.visible = o > 0.002 && !!loaded.current;
    if (u.swap.value > 0) {
      u.swap.value = Math.min(1, u.swap.value + dt / Math.max(0.2, dissolve / 1000));
      if (u.swap.value >= 1) {
        u.map.value = u.map2.value;
        u.swap.value = 0;
      }
    }
    if (layer.reveal && pres.current.since !== null && loaded.current) {
      const r = layer.reveal;
      u.progress.value = progressOf(env, clock.elapsedTime, pres.current.since, r.delay ?? 0, r.dur ?? 2600) * 1.08;
      u.useMask.value = u.progress.value < 1.08 ? 1 : 0;
    }
    u.fogColor.value.copy(e.fogColor);
    u.fogNear.value = e.fogNear;
    u.fogFar.value = e.fogFar;
    u.haze.value = cfg.fog ?? 1;
    u.focus.value = e.focus;
    u.dof.value = cfg.focus === false ? 0 : e.dof;
    u.light.value = e.light * (cfg.light ?? 1);
    u.sat.value = cfg.sat ?? 1;
    if (cfg.tint) {
      u.tint.value.set(cfg.tint[0]);
      u.tintAmt.value = cfg.tint[1];
    } else u.tintAmt.value = 0;
    if (move) {
      if (moveStart.current === null) moveStart.current = clock.elapsedTime;
      const [dx, dy, dz] = move.at(progressOf(env, clock.elapsedTime, moveStart.current, move.delay, move.dur));
      mesh.current.position.set(base[0] + dx * k, base[1] - dy * k, base[2] + dz);
    }
    // `shatter` {delay, dur, spread, gravity, spin, floor} (design units, ms; `floor` the design y the
    // shards come to rest on, the card's foot by default)
    if (breakable) {
      const sh = cfg.shatter;
      if (sh) {
        if (broke.current === null) broke.current = clock.elapsedTime;
        const delay = sh.delay ?? 0;
        const dur = sh.dur ?? 2600;
        u.shatterT.value = e.still ? (Math.min(1, e.moment ?? 1) * (delay + dur) - delay) / 1000 : clock.elapsedTime - broke.current - delay / 1000;
        u.grav.value = (sh.gravity ?? 1700) * k;
        u.spread.value = (sh.spread ?? 240) * k;
        u.spin.value = sh.spin ?? 5;
        u.floorY.value = ((y0 + y1) / 2 - (sh.floor ?? y1 - 8)) * k;
      } else {
        broke.current = null;
        u.shatterT.value = -1;
      }
    }
  });
  return (
    <mesh ref={mesh} position={base} renderOrder={Math.round(z + shotZ)} material={material} frustumCulled={false}>
      {shards ? <primitive object={shards} attach="geometry" /> : <planeGeometry args={[(x1 - x0) * k, (y1 - y0) * k]} />}
    </mesh>
  );
}

// ── People of light ──────────────────────────────────────

/**
 * A person of light at `pos` [x, y, z?] (feet on the ground line y; z defaults to the layer's depth), `h`
 * design units tall at that depth: a soft body,
 * a bright core, a halo and a faint outer glow that breathes about every four seconds. `path` walks them
 * over `dur` ms after `delay`; `pose`: "stand", "walk", "raise", "reach", "kneel" or "gone" (fades out).
 * `w` is the body's width to its height (0.5; broader for the people of ʿAd); `bright` is how much light
 * the body itself gives (1.5; under 1 for dim figures in daylight, so they stay amber rather than white),
 * and `solid` (0–1) lays a deeper amber shape beneath it so a figure keeps its presence against bright sand. `kind: "flame"` is a fire
 * instead (a brazier, a lamp): glow only, flickering, `h` tall.
 */
export function Light({ layer, beat, env, dissolve }) {
  const cfg = resolveLayer(layer, beat);
  const { h: hd = 60, color = '#fff4d6', glow = 1, pose = 'stand', path, dur = 6000, delay = 0, kind = 'person', w = 0.5, bright = 1.5, solid = 0 } = cfg;
  const flame = kind === 'flame';
  const z0 = zOf(layer);
  const at = (p) => shift(place([p[0], p[1], p[2] ?? z0]), layer);
  const h = hd * scaleAt((cfg.pos ?? path?.[0] ?? [0, 0, z0])[2] ?? z0);
  const pres = usePresence(layer, beat, dissolve, env, pose === 'gone');
  const group = useRef(null);
  const glows = useRef([]);
  const bodyRef = useRef(null);
  const underRef = useRef(null);
  const phase = useMemo(() => (layer.key?.length ?? 1) * 1.7, [layer.key]);
  // the walk is interpolated in the world, so a path into the distance keeps to the ground between its points
  const route = useMemo(() => (path ? track(path.map(at)) : null), [path, layer.dx, layer.dz, z0]);
  const routeKey = JSON.stringify(path ?? cfg.pos);
  const started = useRef(null);
  useEffect(() => {
    started.current = null;
  }, [routeKey]);
  const tint = useMemo(() => new Color(color), [color]);
  const body = figureTexture(color, pose === 'walk' || pose === 'gone' ? 'stand' : pose);
  const halo = glowTexture();
  const layersOfGlow = flame
    ? [
        { s: [h * 0.34, h * 0.72], y: h * 0.34, o: 1, boost: 2.4 },
        { s: [h * 1.1, h * 1.35], y: h * 0.42, o: 0.55, boost: 1.5 },
        { s: [h * 3.2, h * 3.2], y: h * 0.5, o: 0.22, boost: 1 },
      ]
    : [
        { s: [h * 0.7, h * 0.85], y: h * 0.5, o: 0.95, boost: 2.2 },
        { s: [h * 1.6, h * 1.7], y: h * 0.5, o: 0.5, boost: 1.4 },
        { s: [h * 3.4, h * 3.4], y: h * 0.45, o: 0.2, boost: 1 },
      ];
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (started.current === null) started.current = t;
    const u = route ? progressOf(env, t, started.current, delay, dur) : 1;
    const [X, Y, Z] = route ? route(u) : at(cfg.pos ?? [800, 700]);
    // a walker's step bobs until the walk is done
    const bob = pose === 'walk' && u < 1 ? Math.abs(Math.sin(t * 5.5)) * h * 0.02 : 0;
    group.current.position.set(X, Y + bob, Z);
    // drawn just after the cards at its depth (a group's own order would sort it before every card)
    const order = Math.round(Z) + 0.5;
    glows.current.forEach((sp) => sp && (sp.renderOrder = order));
    if (bodyRef.current) bodyRef.current.renderOrder = order + 0.1;
    if (underRef.current) underRef.current.renderOrder = order + 0.05;
    const o = pres.current.o;
    // a person breathes slowly (about every four seconds); a flame flickers
    const breathe = flame ? Math.sin(t * 11 + phase) * 0.5 + Math.sin(t * 17.3 + phase * 2) * 0.3 + Math.sin(t * 5.1) * 0.2 : Math.sin((t / 4) * Math.PI * 2 + phase);
    glows.current.forEach((sp, i) => {
      if (!sp) return;
      const L = layersOfGlow[i];
      const s = 1 + breathe * (flame ? 0.08 + i * 0.04 : 0.04 + i * 0.03);
      sp.scale.set(L.s[0] * s, L.s[1] * s, 1);
      sp.material.opacity = o * L.o * glow * (0.88 + breathe * 0.12);
    });
    if (bodyRef.current) bodyRef.current.material.opacity = o;
    if (underRef.current) underRef.current.material.opacity = o * Math.min(1, solid * 1.4);
  });
  return (
    <group ref={group}>
      {layersOfGlow.map((L, i) => (
        <sprite key={i} ref={(el) => (glows.current[i] = el)} position={[0, L.y, 0]}>
          <spriteMaterial map={halo} color={tint.clone().multiplyScalar(L.boost)} blending={AdditiveBlending} transparent depthWrite={false} opacity={0} />
        </sprite>
      ))}
      {!flame && solid > 0 && (
        <sprite ref={underRef} center={[0.5, 0]} scale={[h * w * 1.04, h * 1.02, 1]}>
          <spriteMaterial map={body} color={tint.clone().multiplyScalar(0.55)} transparent depthWrite={false} opacity={0} />
        </sprite>
      )}
      {!flame && (
        <sprite ref={bodyRef} center={[0.5, 0]} scale={[h * w, h, 1]}>
          <spriteMaterial map={body} color={new Color(bright, bright, bright)} transparent depthWrite={false} opacity={0} />
        </sprite>
      )}
    </group>
  );
}

// ── Crowds and armies ────────────────────────────────────

const crowdVertex = /* glsl */ `
attribute vec3 aOffset;
attribute float aSeed;
uniform float time;
uniform float size;
uniform float speed;
uniform float mill;
uniform float march;
uniform vec2 flow;
uniform vec4 area;
varying vec2 vUv;
varying float vSeed;
varying float vGlint;
void main() {
  vec3 p = aOffset;
  float w = area.y - area.x;
  float d = area.w - area.z;
  float pace = speed * time * (march > 0.5 ? 1.0 : 0.7 + aSeed * 0.6);
  p.x = area.x + mod(p.x - area.x + flow.x * pace, w);
  p.z = area.z + mod(p.z - area.z + flow.y * pace, d);
  p.x += sin(time * 0.6 + aSeed * 40.0) * mill;
  p.z += cos(time * 0.45 + aSeed * 23.0) * mill;
  p.y += abs(sin(time * 5.0 + (march > 0.5 ? 0.0 : aSeed * 30.0))) * size * 0.025 * (march + 0.4);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float s = size * (0.86 + aSeed * 0.28);
  mv.xy += position.xy * vec2(s * 0.5, s);
  vUv = uv;
  vSeed = aSeed;
  vGlint = march * pow(max(0.0, sin(time * 1.4 - (p.x + p.z) * 0.004)), 28.0);
  gl_Position = projectionMatrix * mv;
}`;

const crowdFragment = /* glsl */ `
uniform sampler2D map;
uniform vec3 color;
uniform float dim;
uniform float opacity;
uniform float outP;
uniform float flicker;
uniform float glow;
uniform float time;
varying vec2 vUv;
varying float vSeed;
varying float vGlint;
void main() {
  vec4 t = texture2D(map, vUv);
  float alive = smoothstep(outP, outP + 0.015, vSeed);
  float fl = 1.0 - flicker * 0.4 * step(0.62, fract(sin(vSeed * 91.7 + floor(time * 7.0 + vSeed * 13.0)) * 43758.5453));
  vec3 c = t.rgb * color * glow * (1.0 + vGlint * 3.0);
  gl_FragColor = vec4(c, t.a * opacity * (1.0 - dim * 0.75) * alive * fl);
  if (gl_FragColor.a < 0.01) discard;
}`;

/**
 * Thousands of people of dim light on the ground line `y` across `area` [x0, x1, z0, z1] (x as seen from the
 * reference camera, sizes in design units, both scaled by each person's depth): `flow` [dx, dz]
 * and `speed` stream them (wrapping round), `mill` lets them wander, `dim` lowers them, `out` (0–1) puts
 * their lights out one by one, `flicker` makes them restless. `kind: "army"` stands soldiers in `rows` ×
 * `cols` that march in step, shields glinting in a rolling wave. `y` may be [front, back] so the ranks
 * recede up the frame, as ground does seen from above. `ground` (a world height, e.g. -300) lays the crowd
 * out in the world instead: `area` [x0, x1, z0, z1] and `size` in world units, so an avenue keeps its width.
 */
export function Crowd({ layer, beat, env, dissolve, lite }) {
  const cfg = resolveLayer(layer, beat);
  const { area = [300, 1300, -600, 200], y = 700, count = 400, size = 30, color = '#ffc890', dim = 0.3, flow = [0, 0], speed = 20, mill = 6, kind = 'people', out = 0, outDur = 8000, flicker = 0.35, rows = 12, cols = 30, glow = 1, ground } = cfg;
  const inWorld = ground !== undefined;
  // world units per design unit for this crowd (1 when it is laid out in the world)
  const k = inWorld ? 1 : scaleAt((area[2] + area[3]) / 2);
  const army = kind === 'army';
  const n = army ? rows * cols : Math.max(20, Math.round(count * (lite ? 0.4 : 1)));
  const pres = usePresence(layer, beat, dissolve, env);
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(1, 1).translate(0, 0.5, 0);
    const g = new InstancedBufferGeometry();
    g.index = plane.index;
    g.setAttribute('position', plane.getAttribute('position'));
    g.setAttribute('uv', plane.getAttribute('uv'));
    const r = rng(layer.seed ?? 7);
    const offsets = new Float32Array(n * 3);
    const seeds = new Float32Array(n);
    const [x0, x1, z0, z1] = area;
    for (let i = 0; i < n; i++) {
      let x;
      let z;
      if (army) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        x = x0 + ((col + 0.5) / cols) * (x1 - x0);
        z = z0 + ((row + 0.5) / rows) * (z1 - z0);
      } else {
        x = x0 + r() * (x1 - x0);
        z = z0 + r() * (z1 - z0);
      }
      const gy = Array.isArray(y) ? y[1] + (y[0] - y[1]) * ((z - z0) / (z1 - z0 || 1)) : y;
      offsets.set(shift(inWorld ? [x, ground, z] : place([x, gy, z]), layer), i * 3);
      seeds[i] = r();
    }
    g.setAttribute('aOffset', new InstancedBufferAttribute(offsets, 3));
    g.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 1));
    g.instanceCount = n;
    return g;
    // the layout depends only on these
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, army, rows, cols, JSON.stringify(y), JSON.stringify(area), layer.seed, layer.dx, layer.dz, ground]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          map: { value: army ? soldierTexture() : figureTexture('#ffe2b8') },
          color: { value: new Color(color) },
          time: { value: 0 },
          size: { value: size * k },
          speed: { value: speed * k },
          mill: { value: mill },
          march: { value: army ? 1 : 0 },
          flow: { value: flow },
          area: { value: [(inWorld ? area[0] : (area[0] - 800) * k) + (layer.dx ?? 0), (inWorld ? area[1] : (area[1] - 800) * k) + (layer.dx ?? 0), area[2] + (layer.dz ?? 0), area[3] + (layer.dz ?? 0)] },
          dim: { value: dim },
          opacity: { value: 0 },
          outP: { value: 0 },
          flicker: { value: flicker },
          glow: { value: glow },
        },
        vertexShader: crowdVertex,
        fragmentShader: crowdFragment,
        transparent: true,
        depthWrite: false,
        blending: army ? NormalBlending : AdditiveBlending,
      }),
    // rebuilt only when the kind of crowd changes; values below follow the beat
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [army],
  );
  const outStart = useRef(null);
  useEffect(() => {
    outStart.current = null;
  }, [out]);
  useFrame(({ clock }, dt) => {
    const u = material.uniforms;
    u.time.value = clock.elapsedTime;
    u.opacity.value = pres.current.o;
    u.color.value.set(color);
    u.size.value = size * k;
    u.speed.value = speed * k;
    u.mill.value = mill * k;
    u.flow.value = flow;
    u.dim.value += (dim - u.dim.value) * Math.min(1, dt * 0.8);
    u.flicker.value = flicker;
    u.glow.value = glow;
    if (out) {
      if (outStart.current === null) outStart.current = clock.elapsedTime;
      u.outP.value = Math.min(out, progressOf(env, clock.elapsedTime, outStart.current, 0, outDur) * out) * 1.02;
    } else u.outP.value = 0;
  });
  const zMid = (area[2] + area[3]) / 2 + (layer.dz ?? 0);
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={Math.round(zMid)} />;
}

// ── Dust, sand and mist ──────────────────────────────────

const dustVertex = /* glsl */ `
attribute float aSeed;
uniform float time;
uniform float size;
uniform float swirl;
uniform float pr;
uniform vec3 wind;
uniform vec3 boxMin;
uniform vec3 boxSize;
uniform vec3 sunDir;
varying float vGlow;
varying float vSeed;
void main() {
  vec3 p = position + wind * time * (0.6 + aSeed * 0.8);
  p += vec3(sin(time * 0.37 + aSeed * 12.0 + p.y * 0.004), sin(time * 0.29 + aSeed * 7.0 + p.x * 0.003) * 0.6, cos(time * 0.33 + aSeed * 5.0 + p.z * 0.002)) * swirl;
  p = boxMin + mod(p - boxMin, boxSize);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = size * (0.6 + aSeed) * pr * (1000.0 / max(1.0, -mv.z));
  vGlow = pow(max(0.0, dot(normalize(mv.xyz), sunDir)), 6.0);
  vSeed = aSeed;
}`;

const dustFragment = /* glsl */ `
uniform vec3 color;
uniform float opacity;
varying float vGlow;
varying float vSeed;
void main() {
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, r);
  gl_FragColor = vec4(color * (0.7 + vGlow * 2.4), a * opacity * (0.35 + 0.65 * vGlow + 0.2 * vSeed));
}`;

function usePoints(n, fill) {
  return useMemo(() => {
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    fill(pos, seed);
    return [new Float32BufferAttribute(pos, 3), new Float32BufferAttribute(seed, 1)];
    // the fill is fixed per element
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);
}

/**
 * Drifting particles filling the volume `box` [x0, y0, z0, x1, y1, z1] (world units around the design frame:
 * x right, y down, z toward the viewer): sand, dust, mist or embers, `count` of them carried by `wind`
 * [x, y, z] (units a second, y down) and a slow swirl, catching the light when they cross the sun.
 * `blend: "normal"` lays them over the scene instead of adding light (smoke, dark sand).
 */
export function Dust({ layer, beat, env, dissolve, lite }) {
  const cfg = resolveLayer(layer, beat);
  const { count = 2000, box = [-800, 0, -4000, 2400, 900, 800], wind = [20, 0, 0], size = 3, color = '#ffe0a8', opacity = 0.6, swirl = 40, blend = 'add' } = cfg;
  const n = Math.round(count * (lite ? 0.3 : 1));
  const pres = usePresence(layer, beat, dissolve, env);
  const shotZ = layer.dz ?? 0;
  const shotX = layer.dx ?? 0;
  const [x0, y0, z0, x1, y1, z1] = [box[0] + shotX, box[1], box[2] + shotZ, box[3] + shotX, box[4], box[5] + shotZ];
  const [pos, seed] = usePoints(n, (p, s) => {
    const r = rng(layer.seed ?? 11);
    for (let i = 0; i < n; i++) {
      p.set(world([x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), z0 + r() * (z1 - z0)]), i * 3);
      s[i] = r();
    }
  });
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          size: { value: size },
          swirl: { value: swirl },
          pr: { value: Math.min(window.devicePixelRatio || 1, 2) },
          wind: { value: new Vector3() },
          boxMin: { value: new Vector3(x0 - 800, 450 - y1, z0) },
          boxSize: { value: new Vector3(x1 - x0, y1 - y0, z1 - z0) },
          sunDir: { value: new Vector3(0, 0, -1) },
          color: { value: new Color(color) },
          opacity: { value: 0 },
        },
        vertexShader: dustVertex,
        fragmentShader: dustFragment,
        transparent: true,
        depthWrite: false,
        blending: blend === 'normal' ? NormalBlending : AdditiveBlending,
      }),
    // the box is fixed per element; values below follow the beat
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useFrame(({ clock }) => {
    const u = material.uniforms;
    u.time.value = clock.elapsedTime;
    u.wind.value.set(wind[0], -wind[1], wind[2] ?? 0);
    u.size.value = size;
    u.swirl.value = swirl;
    u.color.value.set(color);
    u.opacity.value = pres.current.o * opacity;
    u.sunDir.value.copy(env.current.sunDir);
  });
  return (
    <points material={material} frustumCulled={false} renderOrder={Math.round(z1)}>
      <bufferGeometry>
        <primitive object={pos} attach="attributes-position" />
        <primitive object={seed} attach="attributes-aSeed" />
      </bufferGeometry>
    </points>
  );
}

const ribbonVertex = /* glsl */ `
attribute float aSeed;
uniform float time;
uniform float rate;
uniform float len;
uniform float lift;
uniform float size;
uniform float pr;
uniform vec3 wind;
uniform vec3 sunDir;
varying float vAge;
varying float vGlow;
void main() {
  float age = fract(time * rate * (0.7 + aSeed * 0.6) + aSeed);
  vec3 p = position + wind * age * len + vec3(0.0, lift * age, 0.0);
  p += vec3(sin(time * 0.8 + aSeed * 20.0), cos(time * 0.6 + aSeed * 9.0), 0.0) * 8.0 * age;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = size * (0.6 + age * 1.4) * pr * (1000.0 / max(1.0, -mv.z));
  vAge = age;
  vGlow = pow(max(0.0, dot(normalize(mv.xyz), sunDir)), 5.0);
}`;

const ribbonFragment = /* glsl */ `
uniform vec3 color;
uniform float opacity;
varying float vAge;
varying float vGlow;
void main() {
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, r) * sin(vAge * 3.14159) * (1.0 - vAge * 0.6);
  gl_FragColor = vec4(color * (0.8 + vGlow * 2.0), a * opacity);
}`;

/** Veils of sand lifted off dune crests: particles leaving each crest `line` [[x, y, z]…] on the `wind`. */
export function Ribbons({ layer, beat, env, dissolve, lite }) {
  const cfg = resolveLayer(layer, beat);
  const { lines = [], count = 1600, wind = [1, -0.12, 0], len = 420, lift = 40, rate = 0.22, size = 3.2, color = '#ffe2b0', opacity = 0.55 } = cfg;
  const n = Math.round(count * (lite ? 0.3 : 1));
  const pres = usePresence(layer, beat, dissolve, env);
  const [pos, seed] = usePoints(n, (p, s) => {
    const r = rng(layer.seed ?? 5);
    for (let i = 0; i < n; i++) {
      const line = lines[i % Math.max(1, lines.length)] ?? [[800, 600, 0], [900, 600, 0]];
      const seg = Math.floor(r() * (line.length - 1));
      const f = r();
      const a = line[seg];
      const b = line[seg + 1] ?? a;
      const [X, Y, Z] = place([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, (a[2] ?? zOf(layer)) + ((b[2] ?? zOf(layer)) - (a[2] ?? zOf(layer))) * f]);
      p.set(shift([X, Y, Z], layer), i * 3);
      s[i] = r();
    }
  });
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { time: { value: 0 }, rate: { value: rate }, len: { value: len }, lift: { value: lift }, size: { value: size }, pr: { value: Math.min(window.devicePixelRatio || 1, 2) }, wind: { value: new Vector3() }, sunDir: { value: new Vector3(0, 0, -1) }, color: { value: new Color(color) }, opacity: { value: 0 } },
        vertexShader: ribbonVertex,
        fragmentShader: ribbonFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    // values below follow the beat
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const zFront = Math.max(...lines.flat().map((q) => q[2] ?? zOf(layer))) + (layer.dz ?? 0);
  useFrame(({ clock }) => {
    const u = material.uniforms;
    u.time.value = clock.elapsedTime;
    u.wind.value.set(wind[0], -wind[1], wind[2] ?? 0).normalize();
    u.len.value = len;
    u.lift.value = lift;
    u.rate.value = rate;
    u.opacity.value = pres.current.o * opacity;
    u.sunDir.value.copy(env.current.sunDir);
  });
  return (
    <points material={material} frustumCulled={false} renderOrder={Math.round(zFront) + 2}>
      <bufferGeometry>
        <primitive object={pos} attach="attributes-position" />
        <primitive object={seed} attach="attributes-aSeed" />
      </bufferGeometry>
    </points>
  );
}

// ── Cloth ────────────────────────────────────────────────

const clothVertex = /* glsl */ `
uniform float time;
uniform float amp;
uniform float speed;
uniform float h;
varying vec2 vUv;
varying float vShade;
void main() {
  float hang = clamp(-position.y / h, 0.0, 1.0);
  vec3 p = position;
  float wave = sin(position.x * 0.025 + time * speed + position.y * 0.045);
  p.z += wave * amp * hang;
  p.x += sin(time * speed * 0.8 + position.y * 0.03) * amp * 0.35 * hang;
  vShade = 0.82 + 0.18 * cos(position.x * 0.025 + time * speed + position.y * 0.045);
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const clothFragment = /* glsl */ `
uniform vec3 color;
uniform vec3 trim;
uniform float opacity;
uniform float light;
varying vec2 vUv;
varying float vShade;
void main() {
  float band = step(vUv.y, 0.07) + step(0.93, vUv.y) * 0.6 + step(vUv.x, 0.03) * 0.5 + step(0.97, vUv.x) * 0.5;
  vec3 c = mix(color, trim, clamp(band, 0.0, 1.0)) * vShade * light;
  gl_FragColor = vec4(c, opacity);
}`;

/**
 * A hanging cloth (crimson and gold by default), its top edge centred at `pos`, `w` × `h` world units,
 * moving in the wind (`amp`, `speed`). `tear` {path, dur, delay, spin} tears it loose to fly off along
 * design-unit offsets like a red bird. `pole` (design units) stands it on a pole, as a banner.
 */
export function Cloth({ layer, beat, env, dissolve }) {
  const cfg = resolveLayer(layer, beat);
  const { pos: p0 = [800, 300], w: wd = 120, h: hd = 320, color = '#8a1e1e', trim = '#c8963c', amp: ad = 14, speed = 2.6, tear, pole = 0 } = cfg;
  const zc = p0[2] ?? zOf(layer);
  const kc = scaleAt(zc);
  const [w, h, amp] = [wd * kc, hd * kc, ad * kc];
  const pres = usePresence(layer, beat, dissolve, env);
  const group = useRef(null);
  const poleRef = useRef(null);
  const geometry = useMemo(() => new PlaneGeometry(w, h, 24, 14).translate(0, -h / 2, 0), [w, h]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { time: { value: 0 }, amp: { value: amp }, speed: { value: speed }, h: { value: h }, color: { value: new Color(color) }, trim: { value: new Color(trim) }, opacity: { value: 0 }, light: { value: 1 } },
        vertexShader: clothVertex,
        fragmentShader: clothFragment,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
      }),
    // values below follow the beat
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [h],
  );
  const flight = useMemo(() => (tear ? track([[0, 0, 0], ...tear.path]) : null), [tear]);
  const torn = useRef(null);
  useEffect(() => {
    torn.current = null;
  }, [flight]);
  const [X, Y, Z] = shift(place([p0[0], p0[1], zc]), layer);
  useFrame(({ clock }) => {
    const u = material.uniforms;
    u.time.value = clock.elapsedTime;
    u.opacity.value = pres.current.o;
    u.light.value = env.current.light;
    u.color.value.set(color);
    u.amp.value = amp * (flight ? 2.4 : 1);
    // the pole comes and goes with its banner (a pole left standing in another set's shot reads as a
    // stray stroke across it)
    if (poleRef.current) poleRef.current.material.opacity = 0.9 * pres.current.o;
    if (flight) {
      if (torn.current === null) torn.current = clock.elapsedTime;
      const f = progressOf(env, clock.elapsedTime, torn.current, tear.delay ?? 0, tear.dur ?? 5000);
      const [dx, dy, dz] = flight(f);
      group.current.position.set(X + dx * kc, Y - dy * kc, Z + dz);
      group.current.rotation.z = Math.max(0, f) * (tear.spin ?? 2.4);
    } else {
      group.current.position.set(X, Y, Z);
      group.current.rotation.z = 0;
    }
  });
  return (
    <group ref={group}>
      <mesh geometry={geometry} material={material} renderOrder={Math.round(Z) + 0.5} />
      {pole > 0 && (
        <mesh ref={poleRef} position={[-w / 2, -(pole * kc) / 2 + h * 0.08, -1]} renderOrder={Math.round(Z) + 0.4}>
          <planeGeometry args={[Math.max(2, w * 0.05), pole * kc + h * 0.16]} />
          <meshBasicMaterial color="#3a2a1e" transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// ── Wind and storm ───────────────────────────────────────

const stormFragment = /* glsl */ `
uniform sampler2D map;
uniform float time;
uniform float speed;
uniform float opacity;
uniform float light;
varying vec2 vUv;
void main() {
  vec2 uv = vUv * vec2(1.6, 1.0) + vec2(time * speed, sin(time * 0.3 + vUv.x * 3.0) * 0.02);
  vec4 c = texture2D(map, uv);
  gl_FragColor = vec4(c.rgb * light, c.a * opacity);
}`;

/** Wind made visible: huge sweeping ink strokes tearing across the frame at several depths (`zs`). */
export function Storm({ layer, beat, env, dissolve }) {
  const cfg = resolveLayer(layer, beat);
  const { zs = [-2500, -900, 300], speed = 0.35, tone = 'pale', opacity = 0.8 } = cfg;
  const pres = usePresence(layer, beat, dissolve, env);
  const materials = useMemo(
    () =>
      zs.map(
        (z, i) =>
          new ShaderMaterial({
            uniforms: { map: { value: windTexture(7 + i, tone) }, time: { value: 0 }, speed: { value: speed * (1 + i * 0.6) }, opacity: { value: 0 }, light: { value: 1 } },
            vertexShader: cardVertex,
            fragmentShader: stormFragment,
            transparent: true,
            depthWrite: false,
          }),
      ),
    // values below follow the beat
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zs.join(), tone],
  );
  useFrame(({ clock }) => {
    materials.forEach((m, i) => {
      m.uniforms.time.value = clock.elapsedTime;
      m.uniforms.speed.value = speed * (1 + i * 0.6);
      m.uniforms.opacity.value = pres.current.o * opacity * (0.6 + i * 0.2);
      m.uniforms.light.value = env.current.light;
    });
  });
  return zs.map((z, i) => {
    const k = scaleAt(z);
    return (
      <mesh key={z} position={[layer.dx ?? 0, 0, z + (layer.dz ?? 0)]} renderOrder={Math.round(z + (layer.dz ?? 0)) + 3} material={materials[i]} frustumCulled={false}>
        <planeGeometry args={[3600 * k, 1400 * k]} />
      </mesh>
    );
  });
}

/** The sun (or any light source): a bright disc and a wide glow; god-rays stream from it. */
export const Sun = forwardRef(function Sun({ layer, beat, env, dissolve }, ref) {
  const cfg = resolveLayer(layer, beat);
  const { pos = [1100, 300, -6000], size: sd = 40, color = '#ffe2b0' } = cfg;
  const size = sd * scaleAt(pos[2]);
  const pres = usePresence(layer, beat, dissolve, env);
  const disc = useRef(null);
  const halo = useRef(null);
  const bright = useMemo(() => new Color(color).multiplyScalar(1.7), [color]);
  useFrame(() => {
    disc.current.material.opacity = pres.current.o;
    halo.current.material.opacity = pres.current.o * 0.55;
  });
  // stable, so the god-rays are not handed a new light source on every render
  const setDisc = useCallback(
    (el) => {
      disc.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );
  return (
    <group position={shift(place(pos), layer)}>
      <mesh ref={setDisc} renderOrder={Math.round(pos[2] + (layer.dz ?? 0))}>
        <circleGeometry args={[size, 48]} />
        <meshBasicMaterial color={bright} transparent depthWrite={false} opacity={0} />
      </mesh>
      <sprite ref={halo} scale={[size * 7, size * 7, 1]} renderOrder={Math.round(pos[2] + (layer.dz ?? 0)) + 1}>
        <spriteMaterial map={glowTexture()} color={color} blending={AdditiveBlending} transparent depthWrite={false} opacity={0} />
      </sprite>
    </group>
  );
});
