import '../styles/liquid-glass.css';

import type {
  LiquidGlassInstance,
  NormalizedWebGLOptions,
  WebGLCreateOptions,
} from '../types';
import { normalizeOptions } from '../engine/options';
import { WebGLEnhancement } from './WebGLEnhancement';

export { WebGLEnhancement } from './WebGLEnhancement';
export { WebGLGlassRenderer } from '../engine/webgl/GlassRenderer';
export { vertexShader, fragmentShader } from '../engine/webgl/shaders';

/** Creates the optional Three.js-backed WebGL implementation. */
export function createWebGLLiquidGlass(
  element: HTMLElement,
  options?: WebGLCreateOptions
): LiquidGlassInstance {
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error('[LiquidGlass/WebGL] createWebGLLiquidGlass requires a valid HTMLElement.');
  }

  const normalized: NormalizedWebGLOptions = {
    ...normalizeOptions(options),
    backgroundUrl:
      typeof options?.backgroundUrl === 'string' && options.backgroundUrl
        ? options.backgroundUrl
        : undefined,
  };
  return new WebGLEnhancement(element, normalized);
}

export type {
  LiquidGlassInstance,
  LiquidGlassMaterialOptions,
  LiquidGlassUpdateOptions,
  WebGLCreateOptions,
  WebGLGlassParams,
} from '../types';
