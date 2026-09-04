import type { SurfaceShape } from '../../types';

export const SURFACE_FNS: Record<SurfaceShape, (x: number) => number> = {
  convex_squircle: (x: number) => Math.pow(Math.max(0, 1 - Math.pow(1 - x, 4)), 0.25),
  convex_circle: (x: number) => Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x))),
  concave: (x: number) => 1 - Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x))),
  lip: (x: number) => {
    const convex = Math.pow(Math.max(0, 1 - Math.pow(1 - Math.min(x * 2, 1), 4)), 0.25);
    const concave = 1 - Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x))) + 0.1;
    const t = 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
    return convex * (1 - t) + concave * t;
  },
};

/**
 * Calculates Snell's Law refraction displacement profile across bezel cross-section
 */
export function calculateRefractionProfile(
  glassThickness: number,
  bezelWidth: number,
  heightFn: (x: number) => number,
  ior: number,
  samples = 128
): Float64Array {
  const eta = 1 / Math.max(1.0001, ior);
  function refract(nx: number, ny: number): [number, number] | null {
    const dot = ny;
    const k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) return null; // Total internal reflection
    const sq = Math.sqrt(k);
    return [-(eta * dot + sq) * nx, eta - (eta * dot + sq) * ny];
  }

  const profile = new Float64Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = i / samples;
    const y = heightFn(x);
    const dx = x < 1 ? 0.0001 : -0.0001;
    const y2 = heightFn(x + dx);
    const deriv = (y2 - y) / dx;
    const mag = Math.sqrt(deriv * deriv + 1);
    const ref = refract(-deriv / mag, -1 / mag);
    if (!ref || Math.abs(ref[1]) < 1e-6) {
      profile[i] = 0;
      continue;
    }
    profile[i] = ref[0] * ((y * bezelWidth + glassThickness) / ref[1]);
  }
  return profile;
}

/**
 * Generates an SVG feDisplacementMap input image (Red = X offset, Green = Y offset, 128 = neutral)
 */
export function generateDisplacementMap(
  w: number,
  h: number,
  radius: number,
  bezelWidth: number,
  profile: Float64Array,
  maxDisp: number
): string {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.floor(w));
  c.height = Math.max(2, Math.floor(h));
  const ctx = c.getContext('2d');
  if (!ctx) return '';

  const img = ctx.createImageData(c.width, c.height);
  const d = img.data;

  // Initialize with neutral vector (128, 128, 0, 255)
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 128;
    d[i + 1] = 128;
    d[i + 2] = 0;
    d[i + 3] = 255;
  }

  const r = radius;
  const rSq = r * r;
  const r1Sq = (r + 1) ** 2;
  const rBSq = Math.max(r - bezelWidth, 0) ** 2;
  const wB = c.width - r * 2;
  const hB = c.height - r * 2;
  const S = profile.length;
  const invMaxDisp = maxDisp > 0 ? 1 / maxDisp : 1;

  for (let y1 = 0; y1 < c.height; y1++) {
    for (let x1 = 0; x1 < c.width; x1++) {
      const x = x1 < r ? x1 - r : x1 >= c.width - r ? x1 - r - wB : 0;
      const y = y1 < r ? y1 - r : y1 >= c.height - r ? y1 - r - hB : 0;
      const dSq = x * x + y * y;
      if (dSq > r1Sq || dSq < rBSq) continue;

      const dist = Math.sqrt(dSq);
      const fromSide = r - dist;
      const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
      if (op <= 0 || dist === 0) continue;

      const cos = x / dist;
      const sin = y / dist;
      const bi = Math.min(((fromSide / bezelWidth) * S) | 0, S - 1);
      const disp = profile[bi] || 0;
      const dX = -cos * disp * invMaxDisp;
      const dY = -sin * disp * invMaxDisp;
      const idx = (y1 * c.width + x1) * 4;

      d[idx] = (128 + dX * 127 * op + 0.5) | 0;
      d[idx + 1] = (128 + dY * 127 * op + 0.5) | 0;
    }
  }

  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

/**
 * Generates an edge specular highlight mask
 */
export function generateSpecularMap(
  w: number,
  h: number,
  radius: number,
  bezelWidth: number,
  angle = Math.PI / 3
): string {
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.floor(w));
  c.height = Math.max(2, Math.floor(h));
  const ctx = c.getContext('2d');
  if (!ctx) return '';

  const img = ctx.createImageData(c.width, c.height);
  const d = img.data;

  const r = radius;
  const rSq = r * r;
  const r1Sq = (r + 1) ** 2;
  const rBSq = Math.max(r - bezelWidth, 0) ** 2;
  const wB = c.width - r * 2;
  const hB = c.height - r * 2;
  const sv = [Math.cos(angle), Math.sin(angle)];

  for (let y1 = 0; y1 < c.height; y1++) {
    for (let x1 = 0; x1 < c.width; x1++) {
      const x = x1 < r ? x1 - r : x1 >= c.width - r ? x1 - r - wB : 0;
      const y = y1 < r ? y1 - r : y1 >= c.height - r ? y1 - r - hB : 0;
      const dSq = x * x + y * y;
      if (dSq > r1Sq || dSq < rBSq) continue;

      const dist = Math.sqrt(dSq);
      const fromSide = r - dist;
      const op = dSq < rSq ? 1 : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
      if (op <= 0 || dist === 0) continue;

      const cos = x / dist;
      const sin = -y / dist;
      const dot = Math.abs(cos * sv[0] + sin * sv[1]);
      const edge = Math.sqrt(Math.max(0, 1 - (1 - fromSide) ** 2));
      const coeff = dot * edge;
      const col = (255 * coeff) | 0;
      const alpha = (col * coeff * op) | 0;
      const idx = (y1 * c.width + x1) * 4;

      d[idx] = col;
      d[idx + 1] = col;
      d[idx + 2] = col;
      d[idx + 3] = alpha;
    }
  }

  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}
