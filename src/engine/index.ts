import type {
  LiquidGlassInstance,
  LiquidGlassCreateOptions,
  ResolvedLiquidGlassOptions,
} from '../types';
import { normalizeOptions } from './options';
import { resolveRenderer } from './resolver';
import { RendererManager } from './RendererManager';

export { RendererManager } from './RendererManager';
export { resolveRenderer } from './resolver';
export { normalizeOptions } from './options';

/**
 * Creates and mounts a framework-agnostic Liquid Glass instance onto a DOM element.
 *
 * @example
 * ```ts
 * const glass = createLiquidGlass(element, { blur: 20 });
 * glass.update({ blur: 30 });
 * glass.destroy();
 * ```
 */
export function createLiquidGlass(
  element: HTMLElement,
  options?: LiquidGlassCreateOptions
): LiquidGlassInstance {
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error('[LiquidGlass] createLiquidGlass requires a valid HTMLElement.');
  }

  const normalized = normalizeOptions(options);
  const requestedRenderer = normalized.renderer;
  const resolvedRenderer = resolveRenderer(requestedRenderer);
  const resolvedOptions: ResolvedLiquidGlassOptions = {
    ...normalized,
    renderer: resolvedRenderer,
  };

  return new RendererManager(element, resolvedRenderer, resolvedOptions);
}
