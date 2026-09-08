import type { Component } from 'vue';
import type { LiquidGlassCreateOptions } from '../../../types';

export interface GlassTabBarItem {
  /** Stable value emitted when this tab is selected. */
  value: string;
  /** Default text rendered when the item slot is not provided. */
  label: string;
  /** Optional Vue component used as the default icon. */
  icon?: Component;
  /** Optional icon used while this item is selected. */
  activeIcon?: Component;
  /** Optional badge displayed at the item's upper-right corner. */
  badge?: string | number;
  /** Disabled items are excluded from hover and selection interactions. */
  disabled?: boolean;
}

export interface GlassTabBarProps {
  items: GlassTabBarItem[];
  modelValue?: string;
  /** Height of the outer glass bar in pixels. */
  height?: number;
  /** Fixed width reserved by every tab item in pixels. */
  itemWidth?: number;
  /** Enables breakpoint-aware dimensions for tablet and phone layouts. */
  responsive?: boolean;
  /** Outer bar height used below 768px when responsive is enabled. */
  mobileHeight?: number;
  /** Tab width used below 768px when responsive is enabled. */
  mobileItemWidth?: number;
  /** Outer bar height used from 768px through 1199px when responsive is enabled. */
  tabletHeight?: number;
  /** Tab width used from 768px through 1199px when responsive is enabled. */
  tabletItemWidth?: number;
  /** Height of the selected lens. Defaults to the bar height minus 12px. */
  itemHeight?: number;
  /** Vertical inset used by the selected lens. Takes precedence over itemHeight. */
  lensInset?: number;
  /** Optional fixed size for the hover lens. */
  lensWidth?: number;
  lensHeight?: number;
  /** Radius of the outer bar and lenses. */
  radius?: number;
  /** Material options for the outer bar. */
  baseOptions?: LiquidGlassCreateOptions;
  /** Material options for the selected/hover lens. */
  lensOptions?: LiquidGlassCreateOptions;
}

export interface GlassTabBarEmits {
  (event: 'update:modelValue', value: string): void;
  (event: 'change', value: string, item: GlassTabBarItem, index: number): void;
}
