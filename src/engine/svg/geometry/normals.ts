import type { FootprintGeometry } from './sdf';
import { evaluateFootprintSdf } from './sdf';

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Computes outward surface normal vector using numerical finite difference gradient of the SDF.
 * Outward vector points toward the outer boundary / exterior of the glass footprint.
 */
export function evaluateFootprintNormal(

  x: number,
  y: number,
  geometry: FootprintGeometry,
  eps = 0.5
): Vec2 {
  const dx =
    evaluateFootprintSdf(x + eps, y, geometry) -
    evaluateFootprintSdf(x - eps, y, geometry);
  const dy =
    evaluateFootprintSdf(x, y + eps, geometry) -
    evaluateFootprintSdf(x, y - eps, geometry);

  const len = Math.hypot(dx, dy);
  if (len < 1e-6) {
    return { x: 0, y: 0 };
  }
  return { x: dx / len, y: dy / len };
}
