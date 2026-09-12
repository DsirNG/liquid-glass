<script setup lang="ts">
import { computed } from 'vue';
import type { LiquidGlassMaterialOptions } from '../../../types';
import LiquidGlass from '../LiquidGlass/index.vue';
import type { GlassCardProps, GlassCardSize } from './types';

const props = withDefaults(defineProps<GlassCardProps>(), {
  size: 'md',
  disabled: false,
  interactive: false,
});

const SIZE_DEFAULTS: Record<GlassCardSize, { radius: number }> = {
  sm: { radius: 16 },
  md: { radius: 20 },
  lg: { radius: 24 },
};

const MATERIAL_OPTION_KEYS: ReadonlyArray<keyof LiquidGlassMaterialOptions> = [
  'blur',
  'opacity',
  'thickness',
  'ior',
  'refraction',
  'dispersion',
  'saturation',
  'tint',
  'radius',
  'bezel',
  'specular',
  'shadow',
  'shadowColor',
  'surfaceShape',
  'surfaceProfile',
  'materialPreset',
  'quality',
  'ambientLuma',
  'shape',
  'capability',
  'debug',
  'borderMode',
  'colorBleed',
  'refractionCoverage',
];

const resolvedMaterialOptions = computed<LiquidGlassMaterialOptions>(() => {
  const resolved: LiquidGlassMaterialOptions = {
    radius: SIZE_DEFAULTS[props.size].radius,
    ...props.options,
  };
  const source = props as unknown as Record<string, unknown>;
  const target = resolved as Record<string, unknown>;

  for (const key of MATERIAL_OPTION_KEYS) {
    const value = source[key];
    if (value !== undefined) target[key] = value;
  }

  return resolved;
});

const effectiveInteractive = computed(() => props.interactive && !props.disabled);
</script>

<template>
  <LiquidGlass
    class="glass-card"
    :class="[
      `glass-card--${size}`,
      {
        'glass-card--interactive': interactive,
        'glass-card--disabled': disabled,
      },
    ]"
    :options="resolvedMaterialOptions"
    :fallback-policy="fallbackPolicy"
    :interactive="effectiveInteractive"
    :aria-disabled="interactive && disabled ? 'true' : undefined"
  >
    <div v-if="$slots.header" class="glass-card__header">
      <slot name="header" />
    </div>

    <div class="glass-card__body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="glass-card__footer">
      <slot name="footer" />
    </div>
  </LiquidGlass>
</template>

<style>
@import '../../../styles/liquid-glass.css';

.glass-card {
  display: block;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.92);
}

.glass-card > .lg-content {
  display: flex;
  width: 100%;
  min-height: 0;
  flex-direction: column;
  box-sizing: border-box;
}

.glass-card--sm > .lg-content {
  min-height: 128px;
  gap: 12px;
  padding: 16px;
}

.glass-card--md > .lg-content {
  min-height: 176px;
  gap: 16px;
  padding: 24px;
}

.glass-card--lg > .lg-content {
  min-height: 240px;
  gap: 20px;
  padding: 32px;
}

.glass-card__header,
.glass-card__footer {
  flex: 0 0 auto;
  min-width: 0;
}

.glass-card__body {
  min-width: 0;
  flex: 1 1 auto;
}

.glass-card--interactive {
  transition: opacity 180ms ease;
}

.glass-card--disabled {
  opacity: 0.58;
}
</style>
