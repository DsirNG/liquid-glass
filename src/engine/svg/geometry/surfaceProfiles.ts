export type SurfaceProfile =
  | 'convex_squircle'
  | 'convex_circle'
  | 'concave'
  | 'lip'
  | 'fluid_dome'
  | 'viscous_meniscus'
  | 'cylindrical_rod';

export const SURFACE_PROFILES: Record<SurfaceProfile, (x: number) => number> = {
  convex_squircle: (x: number) => Math.pow(Math.max(0, 1 - Math.pow(1 - x, 4)), 0.25),
  convex_circle: (x: number) => Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x))),
  // Recessed bowl: the surface falls from the outer lip toward the center.
  // Zero slope at both ends avoids a sharp refractive band at the footprint.
  concave: (x: number) => {
    const t = Math.max(0, Math.min(1, x));
    return 1 - t * t * (3 - 2 * t);
  },
  lip: (x: number) => {
    const convex = Math.pow(Math.max(0, 1 - Math.pow(1 - Math.min(x * 2, 1), 4)), 0.25);
    const concave = 1 - Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x))) + 0.1;
    const t = 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
    return convex * (1 - t) + concave * t;
  },
  // 💧 液态饱满水滴全曲面：平滑凸透镜球面，从边缘到中心无断点渐变
  fluid_dome: (x: number) => Math.sin((Math.PI / 2) * Math.pow(Math.max(0, Math.min(1, x)), 0.82)),
  // 🌊 表面张力弯月面：C^2 连续平滑吸附水膜，边缘无任何生硬折角
  viscous_meniscus: (x: number) => {
    const c = Math.max(0, Math.min(1, x));
    return c * c * c * (c * (c * 6 - 15) + 10);
  },
  // 🧪 iOS 胶囊液体玻璃管：横向圆柱体截面，产生强烈的垂直向内聚焦压缩与拉伸
  cylindrical_rod: (x: number) => Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x))),
};

/** Alias for backward compatibility */
export const SURFACE_FNS = SURFACE_PROFILES;

/**
 * Calculates Snell's Law refraction displacement profile across bezel cross-section.
 * Pure mathematical raytracing without DOM/Canvas dependencies.
 *
 * @param glassThickness Physical thickness of the glass plate (px)
 * @param bezelWidth Width of the refractive border / chamfer (px)
 * @param heightFn Surface height cross-section curve y = f(x), x in [0, 1]
 * @param ior Index of refraction (e.g. 1.5 for standard glass, 2.0+ for high-density meta-material)
 * @param samples Number of discrete ray samples along the cross section
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
    const x = i / (samples - 1);
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
    // Projected lateral displacement upon exiting base plane
    profile[i] = ref[0] * ((y * bezelWidth + glassThickness) / ref[1]);
  }
  return profile;
}

/**
 * Calculates the peak absolute displacement from the refraction profile.
 * Used strictly for texture amplitude normalization, never to replace the continuous curve.
 */
export function calculateMaxAbsRefraction(profile: Float64Array): number {
  let max = 0;
  for (let i = 0; i < profile.length; i++) {
    const abs = Math.abs(profile[i]);
    if (abs > max) max = abs;
  }
  return max;
}

/**
 * Linearly samples the refraction profile at normalized position t in [0, 1].
 * t = 0 (outer edge boundary) -> t = 1 (inner body boundary).
 */
export function sampleRefractionProfile(profile: Float64Array, t: number): number {
  if (profile.length === 0) return 0;
  const clampedT = Math.max(0, Math.min(1, t));
  const rawIdx = clampedT * (profile.length - 1);
  const i0 = Math.floor(rawIdx);
  const i1 = Math.min(i0 + 1, profile.length - 1);
  const frac = rawIdx - i0;
  return profile[i0] * (1 - frac) + profile[i1] * frac;
}
