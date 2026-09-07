import type { LiquidGlassMaterialOptions } from './material';

export type {
  LiquidGlassMaterialOptions,
  SurfaceShape,
  SurfaceProfile,
  MaterialPreset,
  FootprintShape,
  LiquidGlassQuality,
  OpticalDebugMode,
} from './material';

export type GlassPreset = 'ios-like' | 'clear' | 'vivid' | 'heavy';

/** Public DOM-native creation options. */
export interface LiquidGlassCreateOptions extends LiquidGlassMaterialOptions {
  /** Enables pointer-driven optical highlights where supported. */
  interactive?: boolean;
}

/** Alias kept for callers that used the old core option name. */
export type LiquidGlassOptions = LiquidGlassCreateOptions;

/** Material parameters are the only values that can change after creation. */
export type LiquidGlassUpdateOptions = Partial<LiquidGlassMaterialOptions>;

/** Normalized options shared across engines. */
export interface NormalizedLiquidGlassOptions extends Required<LiquidGlassMaterialOptions> {
  interactive: boolean;
}

/** @deprecated Use NormalizedLiquidGlassOptions. */
export type ResolvedLiquidGlassOptions = NormalizedLiquidGlassOptions;
