<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue';
import type { GlassPreset, LiquidGlassMaterialOptions } from '@dinqorai/liquid-glass';
import { GLASS_PRESETS } from '@dinqorai/liquid-glass';

import { DEFAULT_BACKGROUNDS, type QualityTier } from './types';
import { withPureRefraction } from './utils/material';
import type { PlaygroundView } from './components/TopNavbar.vue';
import TopNavbar from './components/TopNavbar.vue';
import HomeShowcase from './views/HomeShowcase.vue';
import ComponentLibraryView from './views/ComponentLibraryView.vue';

const backgrounds = DEFAULT_BACKGROUNDS;
const activeView = shallowRef<PlaygroundView>('home');
const currentBg = shallowRef(backgrounds[0].url);
const glassWidth = shallowRef(380);
const glassHeight = shallowRef(240);
const isPanelOpen = shallowRef(true);

const params = reactive<LiquidGlassMaterialOptions>({
  ...withPureRefraction(GLASS_PRESETS['ios-like']),
  radius: 26,
  bezel: 24,
  tint: '#ffffff',
  refraction: 1.0,
  dispersion: 2.0,
  saturation: 1.3,
  quality: 'high',
  borderMode: 'directional',
  ambientLuma: 0.5,
});

const selectedQuality = computed<QualityTier>({
  get: () => params.quality ?? 'high',
  set: (value) => {
    params.quality = value;
  },
});

function applyPreset(presetKey: GlassPreset): void {
  Object.assign(params, GLASS_PRESETS[presetKey]);
}

function handleApplyMatrix(
  width: number,
  height: number,
  radius: number,
  bezel: number,
  shape?: LiquidGlassMaterialOptions['shape']
): void {
  glassWidth.value = width;
  glassHeight.value = height;
  params.radius = radius;
  params.bezel = bezel;
  params.shape = shape || 'roundedRect';
}

function updateParam(key: keyof LiquidGlassMaterialOptions, value: unknown): void {
  (params as Record<string, unknown>)[key] = value;
}

const isSolidColor = computed(() => {
  const bg = currentBg.value;
  return bg.startsWith('#') || bg.startsWith('rgb');
});

const isLightBg = computed(() => {
  if (!isSolidColor.value) return false;
  const hex = currentBg.value.replace('#', '');
  if (hex.length !== 6) return false;

  const red = parseInt(hex.substring(0, 2), 16);
  const green = parseInt(hex.substring(2, 4), 16);
  const blue = parseInt(hex.substring(4, 6), 16);
  return 0.299 * red + 0.587 * green + 0.114 * blue > 175;
});

watch(
  isLightBg,
  (light) => {
    params.ambientLuma = light ? 0.92 : 0.4;
  },
  { immediate: true }
);

const rootStyle = computed(() => {
  if (isSolidColor.value) {
    return {
      backgroundColor: currentBg.value,
      backgroundImage: 'none',
    };
  }

  return {
    backgroundColor: '#0b0d14',
    backgroundImage: `url(${currentBg.value})`,
  };
});
</script>

<template>
  <div class="lab-root" :style="rootStyle" :class="{ 'is-light-stage': isLightBg }">
    <TopNavbar v-model="activeView" v-model:is-panel-open="isPanelOpen" />

    <div class="lab-content">
      <HomeShowcase
        v-if="activeView === 'home'"
        v-model:is-panel-open="isPanelOpen"
        v-model:selected-quality="selectedQuality"
        v-model:glass-width="glassWidth"
        v-model:glass-height="glassHeight"
        v-model:current-bg="currentBg"
        :params="params"
        :backgrounds="backgrounds"
        :is-light-bg="isLightBg"
        @apply-preset="applyPreset"
        @apply-matrix="handleApplyMatrix"
        @update-param="updateParam"
      />

      <ComponentLibraryView v-else />
    </div>
  </div>
</template>

<style>
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #0b0d14;
  color: #fff;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial,
    sans-serif;
  user-select: none;
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}

button,
input {
  font: inherit;
}

.lab-root {
  position: relative;
  display: flex;
  width: 100vw;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  transition: background-image 0.4s ease;
}

.lab-content {
  position: relative;
  flex: 1;
  min-height: 0;
}
</style>
