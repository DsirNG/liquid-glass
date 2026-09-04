import type {
  LiquidGlassMaterialOptions,
  LiquidGlassUpdateOptions,
  NormalizedLiquidGlassOptions,
} from './glass';

/** Options for the optional Three.js-backed WebGL entry point. */
export interface WebGLCreateOptions extends LiquidGlassMaterialOptions {
  interactive?: boolean;
  backgroundUrl?: string;
}

/** Fully normalized options consumed by the WebGL wrapper. */
export interface NormalizedWebGLOptions extends NormalizedLiquidGlassOptions {
  backgroundUrl?: string;
}

export interface WebGLGlassParams {
  x: number;
  y: number;
  width: number;
  height: number;
  options: NormalizedLiquidGlassOptions;
  lightAngle?: number;
  backgroundUrl?: string;
}

/** @deprecated Use LiquidGlassUpdateOptions. */
export type WebGLUpdateOptions = LiquidGlassUpdateOptions;
