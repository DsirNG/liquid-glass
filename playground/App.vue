<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import type { GlassPreset, LiquidGlassMaterialOptions } from '../src/core';
import { GLASS_PRESETS } from '../src/core';
import { LiquidGlass, GlassButton, LiquidGlassReactButton } from '../src/vue';
import { WebGLLiquidGlass } from '../src/vue-webgl';

import { t } from './locales';
import { DEFAULT_BACKGROUNDS, type DemoEngine, type QualityTier } from './types';
import { useCardDrag } from './composables/useCardDrag';

import TopNavbar from './components/TopNavbar.vue';
import ControlDrawer from './components/ControlDrawer.vue';
import StageBackdrop from './components/StageBackdrop.vue';
import MusicPlayerCard from './components/MusicPlayerCard.vue';

// Background Wallpapers
const backgrounds = DEFAULT_BACKGROUNDS;
const currentBg = ref(backgrounds[0].url);

// Engine & Quality selection
const selectedEngine = ref<DemoEngine>('dom');
const selectedQuality = ref<QualityTier>('high');

// Geometry Dimensions
const glassWidth = ref(380);
const glassHeight = ref(240);

// Calibrated Optical Material Parameters (Strictly Material Options)
const params = reactive<LiquidGlassMaterialOptions>({
  ...GLASS_PRESETS['ios-like'],
  blur: 0,
  opacity: 0.08,
  radius: 26,
  bezel: 24,
  specular: 0.6,
  tint: '#ffffff',
  shadow: 0.35,
});

// Control panel visibility
const isPanelOpen = ref(true);

// 4 Standard Presets (Material only)
function applyPreset(presetKey: GlassPreset) {
  const preset = GLASS_PRESETS[presetKey];
  Object.assign(params, preset);
}

// Stage LiquidGlass reference & physical engine status
const domGlassRef = ref<InstanceType<typeof LiquidGlass> | null>(null);
const webglGlassRef = ref<InstanceType<typeof WebGLLiquidGlass> | null>(null);

const resolvedEngineLabel = computed(() => {
  const resolved =
    selectedEngine.value === 'webgl'
      ? webglGlassRef.value?.instance?.renderer
      : domGlassRef.value?.instance?.renderer;
  return resolved ? resolved.toUpperCase() : '...';
});

// Card Drag & Free Movement
const {
  cardPos,
  isDragging,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  resetPosition,
} = useCardDrag(() => {
  domGlassRef.value?.resize();
  webglGlassRef.value?.resize();
});

// Solid color background detection & adaptation
const isSolidColor = computed(() => {
  const bg = currentBg.value;
  return typeof bg === 'string' && (bg.startsWith('#') || bg.startsWith('rgb'));
});

const isLightBg = computed(() => {
  if (!isSolidColor.value) return false;
  const hex = currentBg.value.replace('#', '');
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    return luma > 175;
  }
  return false;
});

const rootStyle = computed(() => {
  if (isSolidColor.value) {
    return {
      backgroundColor: currentBg.value,
      backgroundImage: 'none',
    };
  }
  return {
    backgroundImage: `url(${currentBg.value})`,
    backgroundColor: '#0b0d14',
  };
});

const webglBgUrl = computed(() => {
  if (!isSolidColor.value) return currentBg.value;
  const color = encodeURIComponent(currentBg.value);
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="${color}"/></svg>`;
});
</script>

<template>
  <div class="lab-root" :style="rootStyle" :class="{ 'is-light-stage': isLightBg }">
    <!-- Top Floating Glass Navbar -->
    <TopNavbar v-model:selected-engine="selectedEngine" v-model:is-panel-open="isPanelOpen" />

    <!-- Parameter Inspector Drawer -->
    <ControlDrawer
      v-model:is-open="isPanelOpen"
      v-model:selected-engine="selectedEngine"
      v-model:selected-quality="selectedQuality"
      v-model:glass-width="glassWidth"
      v-model:glass-height="glassHeight"
      v-model:current-bg="currentBg"
      :params="params"
      :backgrounds="backgrounds"
      @apply-preset="applyPreset"
      @update-param="(key, val) => ((params as Record<string, unknown>)[key] = val)"
    />

    <!-- Central Showcase Stage -->
    <main class="showcase-stage">
      <!-- Minimalist Real DOM Typography Backdrop (Refracted by LiquidGlass) -->
      <StageBackdrop :is-light="isLightBg" />

      <!-- Center Stage: The ONE and ONLY LiquidGlass -->
      <div class="stage-center">
        <!-- Live Status Pill: Direct single source of truth -->
        <div class="engine-indicator-pill">
          <span class="pulse-dot" />
          <span class="indicator-text">
            Requested: <strong>{{ selectedEngine.toUpperCase() }}</strong>
            <span class="indicator-sep">/</span>
            Resolved: <strong>{{ resolvedEngineLabel }}</strong>
          </span>
          <button
            v-if="cardPos.x !== 0 || cardPos.y !== 0"
            class="reset-pos-btn"
            :title="t.resetPosition"
            @click="resetPosition"
          >
            ↺ {{ t.resetPosition }}
          </button>
        </div>

        <!-- The Single Interactive Liquid Glass Card -->
        <div
          class="glass-stage-card-wrapper"
          :class="{ dragging: isDragging }"
          :style="{
            width: `${glassWidth}px`,
            height: `${glassHeight}px`,
            transform: `translate3d(${cardPos.x}px, ${cardPos.y}px, 0)`,
          }"
          :title="t.dragHint"
          @pointerdown="handlePointerDown"
          @pointermove="handlePointerMove"
          @pointerup="handlePointerUp"
          @pointercancel="handlePointerUp"
          @dblclick="resetPosition"
        >
          <LiquidGlass
            v-if="selectedEngine === 'dom'"
            ref="domGlassRef"
            :options="params"
            :interactive="true"
            style="width: 100%; height: 100%"
          >
            <MusicPlayerCard current-renderer="dom" />
          </LiquidGlass>
          <WebGLLiquidGlass
            v-else
            ref="webglGlassRef"
            :options="params"
            :background-url="webglBgUrl"
            :interactive="true"
            style="width: 100%; height: 100%"
          >
            <MusicPlayerCard current-renderer="webgl" />
          </WebGLLiquidGlass>
        </div>

        <!-- GlassButton Component Showcase Row -->
        <div class="glass-buttons-row">
          <GlassButton size="sm" variant="ghost">Ghost SM</GlassButton>
          <GlassButton size="md" variant="default">Default MD</GlassButton>
          <GlassButton size="md" variant="primary">Primary MD</GlassButton>
          <GlassButton size="md" variant="danger">Danger</GlassButton>
          <GlassButton size="sm" :disabled="true">Disabled</GlassButton>
        </div>

        <!-- 1:1 Liquid Glass React Buttons (Pure SVG UI Reproduction) -->
        <div class="glass-buttons-row">
          <span
            class="row-label"
            style="font-size: 11px; opacity: 0.7; letter-spacing: 0.5px; margin-right: 4px"
            >SVG 1:1 REPRO:</span
          >
          <LiquidGlassReactButton>
            <span>Click Me</span>
          </LiquidGlassReactButton>
          <LiquidGlassReactButton>
            <span style="display: inline-flex; align-items: center; gap: 6px">
              Log Out
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
          </LiquidGlassReactButton>
          <LiquidGlassReactButton :displacement-scale="85" :saturation="160">
            <span>Vivid Pill</span>
          </LiquidGlassReactButton>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
/* Global resets & typography */
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial,
    sans-serif;
  background-color: #0b0d14;
  color: #fff;
  user-select: none;
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}

/* Root layout */
.lab-root {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: background-image 0.4s ease;
}

/* Central Stage */
.showcase-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.stage-center {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.engine-indicator-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 6px 16px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
}

.indicator-sep {
  opacity: 0.35;
  margin: 0 6px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 10px #10b981;
}

.reset-pos-btn {
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 4px;
}

.reset-pos-btn:hover {
  background: rgba(255, 255, 255, 0.28);
}

.glass-stage-card-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  touch-action: none;
  user-select: none;
  transition:
    width 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    height 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-stage-card-wrapper.dragging {
  cursor: grabbing;
}

.glass-buttons-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Adaptations when background is bright solid color (Studio Gray, White) */
.lab-root.is-light-stage {
  color: #0f172a;
}

.lab-root.is-light-stage .engine-indicator-pill {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 0, 0, 0.12);
  color: #0f172a;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.lab-root.is-light-stage .engine-indicator-pill strong {
  color: #000;
}

.lab-root.is-light-stage .reset-pos-btn {
  background: rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.15);
  color: #0f172a;
}

.lab-root.is-light-stage .glass-buttons-row {
  background: rgba(255, 255, 255, 0.55);
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
}

.lab-root.is-light-stage .glass-buttons-row .row-label {
  color: #0f172a;
}

/* On light/white stage: buttons become frosted white crystal with crisp dark text */
.lab-root.is-light-stage .lg-react-glass-capsule {
  background: rgba(255, 255, 255, 0.7);
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 0 0 1px rgba(0, 0, 0, 0.06);
}

.lab-root.is-light-stage .lg-react-glass-content {
  color: #0f172a !important;
  text-shadow: none !important;
}
</style>
