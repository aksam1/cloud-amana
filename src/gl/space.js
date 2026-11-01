// World space for WebGL scenes. The 2D design frame (1600×900, y down) stands at Z = 0 and the reference
// camera at Z = R looks straight at it, so a painted card placed at the old parallax `depth` d sits at
// Z = R − R/d and, scaled by its distance, looks exactly as it did on the flat stage until the camera moves.
// Scene files give positions in design coordinates [x, y, z]: x right, y down, z toward the viewer.

export const R = 1000;
export const FOV = (2 * Math.atan(450 / R) * 180) / Math.PI;

/** Design [x, y, z] → world [X, Y, Z] (Y up, the frame's centre on the axis). */
export const world = ([x, y, z = 0]) => [x - 800, 450 - y, z];

/**
 * Where a thing stands: design [x, y] as it looks from the reference camera, at world depth z (so it lines
 * up with a card at the same depth). Sizes given in design units scale the same way, by scaleAt(z).
 */
export const place = ([x, y, z = 0]) => {
  const k = (R - z) / R;
  return [(x - 800) * k, (450 - y) * k, z];
};

/** A world position moved to where its montage `set` stands: `dx` across and `dz` along the camera's flight. */
export const shift = ([X, Y, Z], at) => [X + (at?.dx ?? 0), Y, Z + (at?.dz ?? 0)];

/** A layer's world Z: explicit `z`, or from its parallax `depth`. */
export const zOf = (l) => (l.z !== undefined ? l.z : l.depth ? R - R / l.depth : 0);

/** How much larger than the design frame something must be at Z to look the same from the reference camera. */
export const scaleAt = (z) => (R - z) / R;

/** The design area a card captures unless it says otherwise: three frames wide, two tall. */
export const AREA = [-800, -450, 2400, 1350];

const EASES = {
  linear: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - (1 - t) ** 3,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
};
export const ease = (name) => EASES[name] || EASES.inOut;
