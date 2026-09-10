export type SurfaceShape =
  | 'convex_squircle'
  | 'convex_circle'
  | 'concave'
  | 'lip'
  | 'fluid_dome'
  | 'viscous_meniscus'
  | 'cylindrical_rod';
export type SurfaceProfile = SurfaceShape;
export type MaterialPreset = 'pure' | 'ios';
export type FootprintShape = 'roundedRect' | 'capsule' | 'circle';
export type LiquidGlassQuality = 'low' | 'medium' | 'high' | 'ultra';
export type OpticalDebugMode =
  'none' | 'vector' | 'outer' | 'inner' | 'body' | 'coverage' | 'refraction' | 'final';

export type BorderContrastMode = 'directional' | 'adaptive';
export type RefractionCoverage = 'full' | 'rim';

/**
 * Optical material parameters shared by every Liquid Glass implementation.
 */
export interface LiquidGlassMaterialOptions {
  /** Backdrop blur amount. */
  blur?: number;
  /** Tint opacity from 0 to 1. */
  opacity?: number;
  /** Perceived glass thickness. */
  thickness?: number;
  /** Index of refraction used by the optical field. */
  ior?: number;
  /** Refraction strength. */
  refraction?: number;
  /** Chromatic dispersion strength. */
  dispersion?: number;
  /** Backdrop saturation multiplier. */
  saturation?: number;
  /** Glass tint color. */
  tint?: string;
  /** Outer corner radius in pixels. */
  radius?: number;
  /** Optical bezel width in pixels. */
  bezel?: number;
  /** Specular highlight strength from 0 to 1. */
  specular?: number;
  /** Outer shadow strength from 0 to 1. */
  shadow?: number;
  /** Outer shadow color. */
  shadowColor?: string;
  /** Optical surface profile. */
  surfaceShape?: SurfaceShape;
  /** Alias for surfaceShape. */
  surfaceProfile?: SurfaceProfile;
  /** Material calibration preset. */
  materialPreset?: MaterialPreset;
  /** Optical field quality tier. */
  quality?: LiquidGlassQuality;
  /** Estimated ambient luminance from 0 to 1. */
  ambientLuma?: number;
  /** Footprint shape of the component. */
  shape?: FootprintShape;
  /** Renderer capability override. */
  capability?: 'auto' | 'full' | 'material';
  /** Debug layer to display. */
  debug?: OpticalDebugMode;
  /** Border contrast strategy. */
  borderMode?: BorderContrastMode;
  /** Color bleed strength. */
  colorBleed?: number;
  /** Whether refraction covers the full surface or only the rim. */
  refractionCoverage?: RefractionCoverage;
}
