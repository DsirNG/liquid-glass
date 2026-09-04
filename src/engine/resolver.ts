import type { RendererType, ResolvedRendererType } from '../types';
import { supportsWebGLRenderer, supportsSvgRenderer } from '../utils/browser';

/**
 * Pure engine resolver adhering to the zero-silent-fallback principle:
 * - Explicit 'webgl': MUST support WebGL, otherwise throws clear Error.
 * - Explicit 'svg': MUST support SVG Filter, otherwise throws clear Error.
 * - 'auto': Prefers WebGL, gracefully falls back to SVG, or throws if neither is supported.
 */
export function resolveRenderer(requested: RendererType = 'auto'): ResolvedRendererType {
  if (requested === 'webgl') {
    if (!supportsWebGLRenderer()) {
      throw new Error(
        '[LiquidGlass] WebGL renderer was explicitly requested, but WebGL is unsupported or disabled in this environment.'
      );
    }
    return 'webgl';
  }

  if (requested === 'svg') {
    if (!supportsSvgRenderer()) {
      throw new Error(
        '[LiquidGlass] SVG renderer was explicitly requested, but SVG filters are unsupported or disabled in this environment.'
      );
    }
    return 'svg';
  }

  // 'auto' strategy: WebGL -> SVG -> Fail
  if (supportsWebGLRenderer()) {
    return 'webgl';
  }

  if (supportsSvgRenderer()) {
    return 'svg';
  }

  throw new Error(
    '[LiquidGlass] Neither WebGL nor SVG filter renderer is supported in this environment.'
  );
}
