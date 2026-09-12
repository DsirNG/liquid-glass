import type { FallbackPolicy, LiquidGlassMaterialOptions } from '../../../types';

export type GlassCardSize = 'sm' | 'md' | 'lg';

/** Public props reserved for the Vue GlassCard implementation. */
export interface GlassCardProps extends LiquidGlassMaterialOptions {
  /** Layout density preset. Defaults to `md`. */
  size?: GlassCardSize;
  /** Disables the card's own visual interaction without blocking slot controls. */
  disabled?: boolean;
  /** Enables visual pointer interaction. Defaults to `false`. */
  interactive?: boolean;
  /** Controls capability degradation and runtime recovery behavior. */
  fallbackPolicy?: FallbackPolicy;
  /** Compatibility entry point for base material options. */
  options?: LiquidGlassMaterialOptions;
}

/** Slot names reserved by the GlassCard container contract. */
export interface GlassCardSlots {
  header?: () => unknown;
  default?: () => unknown;
  footer?: () => unknown;
}
