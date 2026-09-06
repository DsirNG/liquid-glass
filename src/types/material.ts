export type SurfaceShape = 'convex_squircle' | 'convex_circle' | 'concave' | 'lip';
export type SurfaceProfile = 'convex_squircle' | 'convex_circle' | 'concave' | 'lip';
export type MaterialPreset = 'pure' | 'ios';
export type FootprintShape = 'roundedRect' | 'capsule' | 'circle';
export type OpticalDebugMode =
  | 'none'
  | 'vector'
  | 'outer'
  | 'inner'
  | 'body'
  | 'coverage'
  | 'refraction'
  | 'final';

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
  ambientLuma?: number;
  shape?: FootprintShape;
  capability?: 'auto' | 'full' | 'material';
  debug?: OpticalDebugMode;
}

