// The ink-wash finish over every WebGL frame, so a moving 3D camera still looks hand-painted: colours
// running into each other a little where washes meet (wet-in-wet), pigment gathering at the edges of
// shapes, saturation eased back and every colour leaning toward the scene's key so the palette holds
// together, watercolour pooling in flat colour, fine paper grain, a warm parchment tint, corners darkened
// like aged paper, and an optional heat haze wavering along the horizon.
import { Effect, EffectAttribute } from 'postprocessing';
import { Color, Uniform, Vector3 } from 'three';

const fragment = /* glsl */ `
// time, resolution and inputBuffer come from the effect pass
uniform float grain;
uniform float bleed;
uniform float pool;
uniform float vignette;
uniform float haze;
uniform float hazeY;
uniform vec3 paper;
uniform vec3 key;
uniform float keyAmt;
uniform float wet;
uniform float spread;
uniform float knee;
uniform float gather;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // heat haze: a band near the horizon read through a gentle shimmer
  float band = smoothstep(0.08, 0.0, abs(uv.y - hazeY));
  vec2 p = uv + haze * band * vec2(0.0028 * sin(uv.y * 190.0 + time * 3.1), 0.0012 * sin(uv.x * 150.0 + time * 2.3));
  vec3 c = texture2D(inputBuffer, p).rgb;
  float l = luma(c);

  // wet-in-wet: the colour of the neighbourhood runs a little into each pixel (light and dark stay put)
  vec2 r = spread / resolution;
  vec3 sum = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.7853982 + 0.39;
    float reach = mod(float(i), 2.0) < 0.5 ? 1.0 : 0.55;
    sum += texture2D(inputBuffer, p + vec2(cos(a), sin(a)) * r * reach).rgb;
  }
  vec3 avg = sum / 8.0;
  float la = luma(avg);
  c = l + mix(c - l, avg - la, wet);
  // pigment gathers where a wash meets a lighter one: a shape darker than its surroundings darkens more
  c *= 1.0 - clamp((la - l) * 1.6, 0.0, 0.22) * gather;
  // ink bleed: strong edges darken a little
  float edge = clamp(length(vec2(dFdx(l), dFdy(l))) * 6.0, 0.0, 1.0);
  c *= 1.0 - edge * 0.18 * bleed;

  // one palette: strong saturation eased back, then every colour leans toward the scene's key
  float lc = luma(c);
  vec3 chroma = c - lc;
  chroma /= 1.0 + length(chroma) * knee;
  c = lc + chroma;
  c = mix(c, lc * key / max(luma(key), 0.05), keyAmt);

  // watercolour pooling: slow blotches where the pigment settled deeper, strongest in flat midtones
  float blot = noise(uv * vec2(5.0, 3.5) + 7.3) * 0.65 + noise(uv * vec2(19.0, 13.0)) * 0.35;
  float flat_ = 1.0 - clamp(length(avg - c) * 5.0, 0.0, 1.0);
  c *= 1.0 - pool * (blot - 0.5) * (0.13 + 0.05 * flat_) * (0.4 + 0.6 * (1.0 - abs(lc - 0.5) * 2.0));
  // parchment: a warm tint and a fine grain that crawls very slowly
  c = mix(c, c * paper, 0.1);
  c += (hash(floor(uv * resolution) + floor(time * 8.0)) - 0.5) * 0.04 * grain;
  // the corners darken like the edge of an old page
  vec2 d = (uv - 0.5) * vec2(1.05, 1.2);
  c *= mix(1.0 - 0.42 * vignette, 1.0, smoothstep(0.82, 0.22, length(d)));
  outputColor = vec4(c, inputColor.a);
}
`;

/**
 * `key` is the colour the whole frame leans toward (the scene's fog by default) by `keyAmt`; `wet` is how
 * far colours run into their neighbours, over `spread` pixels; `knee` eases back strong saturation;
 * `gather` darkens the edges of washes.
 */
export class InkWashEffect extends Effect {
  constructor({ grain = 1, bleed = 1, pool = 1, vignette = 1, haze = 0, hazeY = 0.55, key = '#e8d0b0', keyAmt = 0.16, wet = 0.35, spread = 3.5, knee = 1.6, gather = 1 } = {}) {
    super('InkWashEffect', fragment, {
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map([
        ['grain', new Uniform(grain)],
        ['bleed', new Uniform(bleed)],
        ['pool', new Uniform(pool)],
        ['vignette', new Uniform(vignette)],
        ['haze', new Uniform(haze)],
        ['hazeY', new Uniform(hazeY)],
        ['paper', new Uniform(new Vector3(1.0, 0.95, 0.86))],
        ['key', new Uniform(new Color(key))],
        ['keyAmt', new Uniform(keyAmt)],
        ['wet', new Uniform(wet)],
        ['spread', new Uniform(spread)],
        ['knee', new Uniform(knee)],
        ['gather', new Uniform(gather)],
      ]),
    });
  }
}
