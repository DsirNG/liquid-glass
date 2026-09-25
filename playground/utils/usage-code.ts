import button from '../examples/GlassButtonExample.vue?raw';
import tabbar from '../examples/GlassTabBarExample.vue?raw';
import card from '../examples/GlassCardExample.vue?raw';
import dock from '../examples/GlassDockExample.vue?raw';
import glass from '../examples/LiquidGlassExample.vue?raw';
import music from '../examples/MusicCardExample.vue?raw';

export type UsageCodeId =
  'glass-button' | 'glass-tab-bar' | 'glass-card' | 'glass-dock' | 'liquid-glass' | 'music-card';
// The rendered examples are the source of truth for the copyable code.
export const USAGE_CODE: Record<UsageCodeId, string> = {
  'glass-button': button,
  'glass-tab-bar': tabbar,
  'glass-card': card,
  'glass-dock': dock,
  'liquid-glass': glass,
  'music-card': music,
};
