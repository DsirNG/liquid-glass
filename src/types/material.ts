/**
 * Optical material parameters shared by every Liquid Glass implementation.
 * Engine and framework concerns intentionally do not belong here.
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
}

export type SurfaceShape = 'convex_squircle' | 'convex_circle' | 'concave' | 'lip';
