import type { LiquidGlassMaterialOptions } from './material';

export type {
  LiquidGlassMaterialOptions,
  SurfaceShape,
  SurfaceProfile,
  MaterialPreset,
  FootprintShape,
  LiquidGlassQuality,
  OpticalDebugMode,
  BorderContrastMode,
  RefractionCoverage,
} from './material';

export type GlassPreset = 'ios-like' | 'clear' | 'vivid' | 'heavy';
export type FallbackPolicy = 'auto' | 'preserve' | 'strict';

/** Public DOM-native creation options. */
export interface LiquidGlassCreateOptions extends LiquidGlassMaterialOptions {
  /** Enables pointer-driven optical highlights where supported. */
  interactive?: boolean;
  /** Controls capability degradation and runtime recovery behavior. */
  fallbackPolicy?: FallbackPolicy;
}

/** Alias kept for callers that used the old core option name. */
export type LiquidGlassOptions = LiquidGlassCreateOptions;

/** Material parameters are the only values that can change after creation. */
export type LiquidGlassUpdateOptions = Partial<LiquidGlassMaterialOptions>;

/** Normalized options shared across engines. */
export interface NormalizedLiquidGlassOptions extends Required<LiquidGlassMaterialOptions> {
  interactive: boolean;
  fallbackPolicy: FallbackPolicy;
}

/** @deprecated Use NormalizedLiquidGlassOptions. */
export type ResolvedLiquidGlassOptions = NormalizedLiquidGlassOptions;
