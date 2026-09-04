import type { NormalizedLiquidGlassOptions } from '../types/glass';

/** Defaults for the DOM-native material engine. */
export const DEFAULT_GLASS_OPTIONS: Readonly<NormalizedLiquidGlassOptions> = Object.freeze({
  blur: 2.0,
  opacity: 0.06,
  thickness: 45,
  ior: 2.2,
  refraction: 1.0,
  dispersion: 0.018,
  saturation: 1.3,
  tint: '#ffffff',
  radius: 40,
  bezel: 36,
  specular: 0.65,
  shadow: 0.4,
  shadowColor: 'rgba(255, 255, 255, 0.45)',
  surfaceShape: 'convex_squircle',
  interactive: true,
});
