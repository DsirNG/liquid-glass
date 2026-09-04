import type { LiquidGlassOptions } from './glass';

export interface WebGLGlassParams {
  x: number;
  y: number;
  width: number;
  height: number;
  options: LiquidGlassOptions;
  lightAngle?: number;
  backgroundUrl?: string;
}
