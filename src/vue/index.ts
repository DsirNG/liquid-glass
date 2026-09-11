import type { DefineComponent } from 'vue';
import GlassButtonComponent from './components/GlassButton/index.vue';
import GlassTabBarComponent from './components/GlassTabBar/index.vue';
import type { GlassButtonProps } from './components/GlassButton/types';
import type { GlassTabBarItem, GlassTabBarProps } from './components/GlassTabBar/types';

type GlassButtonPublicComponent = DefineComponent<
  GlassButtonProps,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  { click: (event: MouseEvent) => void }
>;

type GlassTabBarPublicComponent = DefineComponent<
  GlassTabBarProps,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  {
    click: (item: GlassTabBarItem, index: number, event: MouseEvent) => void;
  }
>;

/** Vue GlassButton component with an explicit public prop contract. */
export const GlassButton = GlassButtonComponent as unknown as GlassButtonPublicComponent;

/** Vue GlassTabBar component with an explicit public prop contract. */
export const GlassTabBar = GlassTabBarComponent as unknown as GlassTabBarPublicComponent;

export {
  LiquidGlass,
  type GlassButtonProps,
  type GlassButtonSize,
  type GlassButtonVariant,
  type GlassTabBarEmits,
  type GlassTabBarItem,
  type GlassTabBarProps,
} from './components';
export { useLiquidGlass, type UseLiquidGlassReturn } from './composables';

export type {
  LiquidGlassCreateOptions,
  LiquidGlassMaterialOptions,
  LiquidGlassOptions,
  LiquidGlassUpdateOptions,
  LiquidGlassInstance,
  LiquidGlassStatus,
  GlassPreset,
  SurfaceShape,
} from '../types';
