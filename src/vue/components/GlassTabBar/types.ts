import type { Component } from 'vue';
import type { LiquidGlassCreateOptions } from '../../../types';

export interface GlassTabBarItem {
  /** Stable identifier returned by the click event. */
  value: string;
  /** Text rendered by the built-in tab layout. */
  label: string;
  /** Optional Vue component rendered above the name. Omit for a text-only tab. */
  icon?: Component;
  /** Optional icon rendered when this item is active. */
  activeIcon?: Component;
  /** Controls the selected lens. Set this from the owning view or router state. */
  active?: boolean;
  /** Optional badge displayed at the item's upper-right corner. */
  badge?: string | number;
  /** Disabled items are excluded from hover and selection interactions. */
  disabled?: boolean;
}

export interface GlassTabBarProps {
  /** Tab configuration. The component renders icon + name, or name alone when icon is omitted. */
  items: GlassTabBarItem[];
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
  /**
   * Material overrides for the outer bar. Common controls: blur (background softness),
   * opacity (tint transparency, 0–1), refraction (distortion strength), specular
   * (highlight strength, 0–1), shadow (shadow strength, 0–1), tint (glass color).
   * See LiquidGlassMaterialOptions for the full field documentation.
   */
  baseOptions?: LiquidGlassCreateOptions;
  /** Material overrides for the active/hover lens; uses the same fields as baseOptions. */
  lensOptions?: LiquidGlassCreateOptions;
}

export interface GlassTabBarEmits {
  /** Fired when an enabled tab is pressed. Navigation and state changes belong to the caller. */
  (event: 'click', item: GlassTabBarItem, index: number, mouseEvent: MouseEvent): void;
}
