import type {
  BorderContrastMode,
  FootprintShape,
  LiquidGlassMaterialOptions,
  LiquidGlassQuality,
  MaterialPreset,
  OpticalDebugMode,
  RefractionCoverage,
  SurfaceProfile,
  SurfaceShape,
} from '../../../types';

export type GlassButtonSize = 'sm' | 'md' | 'lg';
export type GlassButtonVariant = 'default' | 'primary' | 'ghost' | 'danger';

/** Public props accepted by the GlassButton component. */
export interface GlassButtonProps extends LiquidGlassMaterialOptions {
  /** Button size preset. */
  size?: GlassButtonSize;
  /** Button visual variant. */
  variant?: GlassButtonVariant;
  /** Disables interaction and applies disabled styling. */
  disabled?: boolean;
  /** Native button type. */
  type?: 'button' | 'submit' | 'reset';
  /** Enables pointer-driven optical interaction. */
  interactive?: boolean;
  /** Optional per-component material overrides. */
  options?: LiquidGlassMaterialOptions;
  surfaceShape?: SurfaceShape;
  surfaceProfile?: SurfaceProfile;
  materialPreset?: MaterialPreset;
  quality?: LiquidGlassQuality;
  shape?: FootprintShape;
  debug?: OpticalDebugMode;
  borderMode?: BorderContrastMode;
  refractionCoverage?: RefractionCoverage;
}
