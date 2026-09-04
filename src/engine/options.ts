import type { LiquidGlassOptions, NormalizedLiquidGlassOptions } from '../types';
import { DEFAULT_GLASS_OPTIONS } from '../constants';
import { clamp } from '../utils/math';

function sanitizeNumber(val: unknown, fallback: number, min: number, max: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    return fallback;
  }
  return clamp(val, min, max);
}

/**
 * Validates and normalizes user-provided options against defaults and safe numeric ranges.
 */
export function normalizeOptions(options?: LiquidGlassOptions): NormalizedLiquidGlassOptions {
  const d = DEFAULT_GLASS_OPTIONS;
  const o = options || {};

  return {
    renderer: o.renderer === 'webgl' || o.renderer === 'svg' ? o.renderer : 'auto',
    blur: sanitizeNumber(o.blur, d.blur, 0, 50),
    opacity: sanitizeNumber(o.opacity, d.opacity, 0, 1),
    thickness: sanitizeNumber(o.thickness, d.thickness, 0, 200),
    ior: sanitizeNumber(o.ior, d.ior, 1.0, 3.5),
    refraction: sanitizeNumber(o.refraction, d.refraction, 0, 5),
    dispersion: sanitizeNumber(o.dispersion, d.dispersion, 0, 0.2),
    saturation: sanitizeNumber(o.saturation, d.saturation, 0, 5),
    tint: typeof o.tint === 'string' && o.tint.trim().length > 0 ? o.tint : d.tint,
    radius: sanitizeNumber(o.radius, d.radius, 0, 1000),
    bezel: sanitizeNumber(o.bezel, d.bezel, 0, 500),
    specular: sanitizeNumber(o.specular, d.specular, 0, 2),
    shadow: sanitizeNumber(o.shadow, d.shadow, 0, 2),
    shadowColor:
      typeof o.shadowColor === 'string' && o.shadowColor.trim().length > 0
        ? o.shadowColor
        : d.shadowColor,
    surfaceShape: o.surfaceShape || d.surfaceShape,
    interactive: typeof o.interactive === 'boolean' ? o.interactive : d.interactive,
    backgroundUrl:
      typeof o.backgroundUrl === 'string' && o.backgroundUrl ? o.backgroundUrl : undefined,
  };
}
