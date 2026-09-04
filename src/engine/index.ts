import type { LiquidGlassCreateOptions, LiquidGlassInstance } from '../types';
import { normalizeOptions } from './options';
import { LiquidGlassEngine } from './LiquidGlassEngine';

export { LiquidGlassEngine } from './LiquidGlassEngine';
export { normalizeOptions } from './options';

/** Creates the DOM-native Liquid Glass engine. */
export function createLiquidGlass(
  element: HTMLElement,
  options?: LiquidGlassCreateOptions
): LiquidGlassInstance {
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error('[LiquidGlass] createLiquidGlass requires a valid HTMLElement.');
  }
  return new LiquidGlassEngine(element, normalizeOptions(options));
}
