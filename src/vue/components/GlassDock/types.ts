import type { FallbackPolicy, LiquidGlassMaterialOptions } from '../../../types';

export type GlassDockItemValue = string | number;
export type GlassDockSize = 'sm' | 'md' | 'lg';
export type GlassDockOrientation = 'horizontal' | 'vertical';

/** Data-only item contract for the Vue GlassDock component. */
export interface GlassDockItem {
  /** Stable value emitted by `update:modelValue` when the item is selected. */
  value: GlassDockItemValue;
  /** Default label used by the built-in item renderer. */
  label: string;
  /** Disabled items are skipped by pointer selection and roving focus navigation. */
  disabled?: boolean;
}

/** Public props for the Vue GlassDock component. */
export interface GlassDockProps extends LiquidGlassMaterialOptions {
  /** Data-driven items rendered by the dock. */
  items: readonly GlassDockItem[];
  /** Controlled business selection state. Hover and focus never change this value. */
  modelValue?: GlassDockItemValue;
  /** Layout density preset. Defaults to `md`. */
  size?: GlassDockSize;
  /** Keyboard and layout axis. Defaults to `horizontal`. */
  orientation?: GlassDockOrientation;
  /** Disables dock-owned selection and visual interaction without blocking slot content. */
  disabled?: boolean;
  /** Enables dock-owned pointer interaction. Defaults to `false`. */
  interactive?: boolean;
  /** Controls capability degradation and runtime recovery behavior. */
  fallbackPolicy?: FallbackPolicy;
  /** Material-only compatibility entry point. Direct material props take precedence. */
  options?: LiquidGlassMaterialOptions;
}

/** Scoped item slot context exposed by GlassDock. */
export interface GlassDockItemSlotProps {
  item: GlassDockItem;
  index: number;
  active: boolean;
  hovered: boolean;
  focused: boolean;
  disabled: boolean;
}

/** Public Vue slot contract for GlassDock. */
export interface GlassDockSlots {
  item?: (props: GlassDockItemSlotProps) => unknown;
}

/** Public Vue event contract for GlassDock. */
export interface GlassDockEmits {
  (event: 'update:modelValue', value: GlassDockItemValue): void;
}
