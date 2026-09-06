export type FootprintShape = 'roundedRect' | 'capsule' | 'circle';

export interface FootprintGeometry {
  shape?: FootprintShape;
  width: number;
  height: number;
  radius: number;
}

/**
 * Analytical Signed Distance Field for a 2D Box with rounded corners.
 * Coordinates (x, y) relative to box top-left (0..width, 0..height).
 * Returns: negative inside, 0 at boundary, positive outside.
 */
export function roundedRectSdf(x: number, y: number, w: number, h: number, r: number): number {
  const halfW = w / 2;
  const halfH = h / 2;
  const maxR = Math.min(halfW, halfH);
  const clampedR = Math.max(0, Math.min(r, maxR));

  // Center coordinate
  const px = Math.abs(x - halfW) - (halfW - clampedR);
  const py = Math.abs(y - halfH) - (halfH - clampedR);

  const outsideX = Math.max(0, px);
  const outsideY = Math.max(0, py);
  const outsideDist = Math.hypot(outsideX, outsideY);
  const insideDist = Math.min(Math.max(px, py), 0);

  return outsideDist + insideDist - clampedR;
}

/**
 * Analytical Signed Distance Field for a 2D Capsule.
 */
export function capsuleSdf(x: number, y: number, w: number, h: number): number {
  const r = Math.min(w, h) / 2;
  return roundedRectSdf(x, y, w, h, r);
}

/**
 * Analytical Signed Distance Field for a 2D Circle / Ellipse centered in bounding box.
 */
export function circleSdf(x: number, y: number, w: number, h: number): number {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(cx, cy);
  const dist = Math.hypot(x - cx, y - cy);
  return dist - r;
}

/**
 * Evaluates the SDF for any configured footprint geometry.
 */
export function evaluateFootprintSdf(x: number, y: number, geometry: FootprintGeometry): number {
  const shape = geometry.shape || 'roundedRect';
  switch (shape) {
    case 'capsule':
      return capsuleSdf(x, y, geometry.width, geometry.height);
    case 'circle':
      return circleSdf(x, y, geometry.width, geometry.height);
    case 'roundedRect':
    default:
      return roundedRectSdf(x, y, geometry.width, geometry.height, geometry.radius);
  }
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Computes subpixel boundary coverage [0..1] using smoothstep anti-aliasing.
 * sdf <= -halfAa -> 1 (fully inside)
 * sdf >= halfAa -> 0 (fully outside)
 */
export function calculateCoverage(sdf: number, aaWidth = 1.0): number {
  const half = aaWidth * 0.5;
  if (sdf <= -half) return 1;
  if (sdf >= half) return 0;
  // True smoothstep S-curve transition
  return smoothstep(half, -half, sdf);
}

