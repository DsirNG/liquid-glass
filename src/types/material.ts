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

/**
 * Optical material parameters shared by every Liquid Glass implementation.
 */
export interface LiquidGlassMaterialOptions {
  blur?: number;
  opacity?: number;
  thickness?: number;
  ior?: number;
  refraction?: number;
  dispersion?: number;
  saturation?: number;
  tint?: string;
  radius?: number;
  bezel?: number;
  specular?: number;
  shadow?: number;
  shadowColor?: string;
  surfaceShape?: SurfaceShape;
  surfaceProfile?: SurfaceProfile;
  materialPreset?: MaterialPreset;
  quality?: LiquidGlassQuality;
  ambientLuma?: number;
  shape?: FootprintShape;
  capability?: 'auto' | 'full' | 'material';
  debug?: OpticalDebugMode;
  borderMode?: BorderContrastMode;
  colorBleed?: number;
}
