import type { LiquidGlassQuality } from '../../types';

export const OPTICAL_FIELD_DIMENSIONS: Readonly<Record<LiquidGlassQuality, number>> = Object.freeze(
  {
    low: 128,
    medium: 256,
    high: 512,
    ultra: 1024,
  }
);

export function resolveOpticalFieldDimension(quality: LiquidGlassQuality = 'high'): number {
  return OPTICAL_FIELD_DIMENSIONS[quality] ?? OPTICAL_FIELD_DIMENSIONS.high;
}
