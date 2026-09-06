import type { LiquidGlassUpdateOptions } from './glass';

/** Public instance lifecycle and material update contract. */
export interface LiquidGlassInstance {
  readonly isDestroyed: boolean;
  readonly renderer?: string;
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
