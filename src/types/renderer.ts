import type { LiquidGlassUpdateOptions } from './glass';

/** @deprecated Renderer selection is no longer part of the DOM core API. */
export type RendererType = 'auto' | 'webgl' | 'svg';

/** @deprecated Use LiquidGlassEngineType for runtime entry-point identity. */
export type ResolvedRendererType = Exclude<RendererType, 'auto'>;

/** Runtime engine used by an instance. */
export type LiquidGlassEngineType = 'dom' | 'webgl';

/** Public instance lifecycle and material update contract. */
export interface LiquidGlassInstance {
  readonly renderer: LiquidGlassEngineType;
  readonly isDestroyed: boolean;
  update(options: LiquidGlassUpdateOptions): void;
  resize(): void;
  destroy(): void;
}

/** Internal lifecycle protocol implemented by engine layers. */
export interface RendererDelegate {
  update(options: LiquidGlassUpdateOptions): void;
  resize(): void;
  destroy(): void;
}
