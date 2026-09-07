import type { LiquidGlassCreateOptions, NormalizedLiquidGlassOptions } from '../types';
import { DEFAULT_GLASS_OPTIONS } from '../constants';
import { clamp } from '../utils/math';

function sanitizeNumber(val: unknown, fallback: number, min: number, max: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    return fallback;
  }
  return clamp(val, min, max);
}

/** Validates and normalizes material and runtime options for an engine. */
export function normalizeOptions(options?: LiquidGlassCreateOptions): NormalizedLiquidGlassOptions {
  const d = DEFAULT_GLASS_OPTIONS;
  const o = options ?? {};

  return {
    blur: sanitizeNumber(o.blur, d.blur, 0, 50),
    opacity: sanitizeNumber(o.opacity, d.opacity, 0, 1),
    thickness: sanitizeNumber(o.thickness, d.thickness, 0, 200),
    ior: sanitizeNumber(o.ior, d.ior, 1.0, 3.5),
    refraction: sanitizeNumber(o.refraction, d.refraction, 0, 5),
    dispersion: sanitizeNumber(o.dispersion, d.dispersion, 0, 5),
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
    surfaceShape: o.surfaceShape ?? d.surfaceShape,
    surfaceProfile: o.surfaceProfile ?? (o.surfaceShape as any) ?? d.surfaceProfile,
    materialPreset: o.materialPreset ?? d.materialPreset,
    quality: o.quality ?? d.quality,
    ambientLuma: sanitizeNumber(o.ambientLuma, d.ambientLuma, 0, 1),
    shape: o.shape ?? d.shape,
    capability: o.capability ?? d.capability,
    debug: o.debug ?? d.debug,
    interactive: typeof o.interactive === 'boolean' ? o.interactive : d.interactive,
    borderMode: o.borderMode ?? d.borderMode,
    colorBleed: sanitizeNumber(o.colorBleed, d.colorBleed, 0, 1),
    refractionCoverage: o.refractionCoverage === 'rim' ? 'rim' : 'full',
  };
}
