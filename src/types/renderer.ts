import type { LiquidGlassUpdateOptions } from './glass';
import type { LiquidGlassStatus } from './status';

/** Public instance lifecycle and material update contract. */
export interface LiquidGlassInstance {
  readonly isDestroyed: boolean;
  readonly renderer?: string;
  readonly status: Readonly<LiquidGlassStatus>;
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
