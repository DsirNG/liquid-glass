import type { LiquidGlassMaterialOptions } from '../../src/core';

/**
 * Playground default for inspecting the optical layer without a tint, fill, or
 * extra blur hiding the backdrop refraction. Other material values remain
 * configurable and are intentionally preserved from the supplied options.
 */
export function withPureRefraction(
  options?: LiquidGlassMaterialOptions
): LiquidGlassMaterialOptions {
  return {
    ...(options ?? {}),
    blur: 0,
    opacity: 0,
    specular: 0.75,
    shadow: 0.25,
    refraction: options?.refraction ?? 1,
    refractionCoverage: 'full',
    debug: 'none',
  };
}
