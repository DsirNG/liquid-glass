<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import type { GlassPreset, LiquidGlassMaterialOptions } from '../src/core';
import { GLASS_PRESETS } from '../src/core';
import { LiquidGlass, GlassButton } from '../src/vue';

import { t } from './locales';
import { DEFAULT_BACKGROUNDS, type QualityTier } from './types';
import { useCardDrag } from './composables/useCardDrag';

import TopNavbar from './components/TopNavbar.vue';
import ControlDrawer from './components/ControlDrawer.vue';
import StageBackdrop from './components/StageBackdrop.vue';
import MusicPlayerCard from './components/MusicPlayerCard.vue';

// Background Wallpapers
const backgrounds = DEFAULT_BACKGROUNDS;
const currentBg = ref(backgrounds[0].url);

// Quality selection
const selectedQuality = ref<QualityTier>('high');

// Geometry Dimensions
const glassWidth = ref(380);
const glassHeight = ref(240);

// Calibrated Optical Material Parameters (Strictly Material Options)
const params = reactive<LiquidGlassMaterialOptions>({
  ...GLASS_PRESETS['ios-like'],
  blur: 0.1,
  opacity: 0.08,
  radius: 26,
  bezel: 24,
  specular: 0.7,
  tint: '#ffffff',
  shadow: 0.35,
  refraction: 1.0,
  dispersion: 2.0,
  saturation: 130,
});

// Control panel visibility
const isPanelOpen = ref(true);
const calibrationMode = ref(false);
const contentMode = ref<'auto' | 'pure' | 'music'>('auto');

// 4 Standard Presets (Material only)
function applyPreset(presetKey: GlassPreset) {
  const preset = GLASS_PRESETS[presetKey];
  Object.assign(params, preset);
}

function handleApplyMatrix(w: number, h: number, r: number, b: number, shape?: string) {
  glassWidth.value = w;
  glassHeight.value = h;
  params.radius = r;
  params.bezel = b;
  params.shape = (shape as any) || 'roundedRect';
}

// Stage LiquidGlass reference

const domGlassRef = ref<InstanceType<typeof LiquidGlass> | null>(null);

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
</script>

<template>
  <div class="lab-root" :style="rootStyle" :class="{ 'is-light-stage': isLightBg }">
    <!-- Top Floating Glass Navbar -->
    <TopNavbar v-model:is-panel-open="isPanelOpen" />

    <!-- Parameter Inspector Drawer -->
    <ControlDrawer
      v-model:is-open="isPanelOpen"
      v-model:selected-quality="selectedQuality"
      v-model:glass-width="glassWidth"
      v-model:glass-height="glassHeight"
      v-model:current-bg="currentBg"
      :params="params"
      :backgrounds="backgrounds"
      @apply-preset="applyPreset"
      @apply-matrix="handleApplyMatrix"
      @update-param="(key, val) => ((params as Record<string, unknown>)[key] = val)"
    />


    <!-- Central Showcase Stage -->
    <main class="showcase-stage" :class="{ 'drawer-open': isPanelOpen }">
      <div class="stage-viewport">
        <!-- Minimalist Real DOM Typography or Optical Test Chart Backdrop -->
        <StageBackdrop :is-light="isLightBg" :calibration-mode="calibrationMode" />

        <!-- Center Stage: Unified LiquidGlass Engine -->
        <div class="stage-center">
          <!-- Live Status & Mode Switcher Pill -->
          <div class="engine-indicator-pill">
            <span class="pulse-dot" />
            <span class="indicator-text"> LiquidGlass Native Optics </span>
            <button
              class="reset-pos-btn"
              :style="{ background: calibrationMode ? '#38bdf8' : '', color: calibrationMode ? '#0f172a' : '' }"
              @click="calibrationMode = !calibrationMode"
            >
              🎯 {{ calibrationMode ? 'Normal Backdrop' : 'Test Chart' }}
            </button>
            <button
              class="reset-pos-btn"
              :style="{ background: contentMode === 'pure' ? '#a855f7' : '', color: contentMode === 'pure' ? '#fff' : '' }"
              :title="'Switch between card, button pill, and pure naked glass'"
              @click="
                contentMode =
                  contentMode === 'auto'
                    ? 'pure'
                    : contentMode === 'pure'
                      ? 'music'
                      : 'auto'
              "
            >
              🪟 {{ contentMode === 'pure' ? 'Pure Optics (Naked)' : contentMode === 'auto' ? 'Auto Content' : 'Music Card' }}
            </button>
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
              ref="domGlassRef"
              :options="params"
              :interactive="true"
              style="width: 100%; height: 100%"
            >
              <!-- 1. Pure Optics Mode (Zero obstruction to observe live backdrop refraction) -->
              <div v-if="contentMode === 'pure'" class="pure-glass-container" />

              <!-- 2. Small Button / Capsule (<70px height or <180px width) -->
              <div
                v-else-if="contentMode === 'pill' || glassHeight < 70 || glassWidth < 180"
                class="glass-pill-content"
              >
                <span class="pill-dot" />
                <span class="pill-label">
                  {{ params.shape === 'circle' ? '✦' : 'Liquid Glass' }}
                </span>
              </div>

              <!-- 3. Full Music Player Card -->
              <MusicPlayerCard v-else />
            </LiquidGlass>
          </div>

          <!-- Compact Geometry Presets Quick-Switch Row -->
          <div class="glass-buttons-row">
            <span class="row-label">MATRIX:</span>
            <button
              class="stage-geo-btn"
              :class="{ active: glassWidth === 100 && glassHeight === 40 }"
              @click="handleApplyMatrix(100, 40, 16, 12, 'roundedRect')"
            >
              100×40 Btn
            </button>
            <button
              class="stage-geo-btn"
              :class="{ active: glassWidth === 160 && glassHeight === 52 }"
              @click="handleApplyMatrix(160, 52, 20, 16, 'roundedRect')"
            >
              160×52 Dock
            </button>
            <button
              class="stage-geo-btn"
              :class="{ active: glassWidth === 320 && glassHeight === 64 }"
              @click="handleApplyMatrix(320, 64, 24, 20, 'capsule')"
            >
              320×64 Bar
            </button>
            <button
              class="stage-geo-btn"
              :class="{ active: glassWidth === 360 && glassHeight === 180 }"
              @click="handleApplyMatrix(360, 180, 28, 24, 'roundedRect')"
            >
              360×180 Card
            </button>
            <button
              class="stage-geo-btn"
              :class="{ active: glassWidth === 500 && glassHeight === 300 }"
              @click="handleApplyMatrix(500, 300, 36, 32, 'roundedRect')"
            >
              500×300 Sheet
            </button>
          </div>
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

/* Central Stage with flex-center margin auto to avoid overflow clipping */
.showcase-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 80px 24px 30px;
  box-sizing: border-box;
  transition: padding-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (min-width: 1024px) {
  .showcase-stage.drawer-open {
    padding-right: 340px;
  }
}

.stage-viewport {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 520px;
  width: 100%;
  max-width: 960px;
  margin: auto;
}

.stage-center {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin: auto;
}

.engine-indicator-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 6px 14px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 11px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 10px #10b981;
}

.reset-pos-btn {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 2px;
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

/* Adaptive Inner Glass Content */
.pure-glass-container {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.glass-pill-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 14px;
  box-sizing: border-box;
}

.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 6px #38bdf8;
  flex-shrink: 0;
}

.pill-label {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

/* Compact Geometry Bar */
.glass-buttons-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 6px 14px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.row-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.45);
}

.stage-geo-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.85);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.stage-geo-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.stage-geo-btn.active {
  background: #38bdf8;
  color: #0f172a;
  font-weight: 700;
  border-color: #38bdf8;
}

/* Adaptations when background is bright solid color */
.lab-root.is-light-stage {
  color: #0f172a;
}

.lab-root.is-light-stage .engine-indicator-pill {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.12);
  color: #0f172a;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.lab-root.is-light-stage .reset-pos-btn {
  background: rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.15);
  color: #0f172a;
}

.lab-root.is-light-stage .glass-buttons-row {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
}

.lab-root.is-light-stage .row-label {
  color: #475569;
}

.lab-root.is-light-stage .stage-geo-btn {
  background: rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.1);
  color: #1e293b;
}

.lab-root.is-light-stage .stage-geo-btn.active {
  background: #0284c7;
  color: #fff;
  border-color: #0284c7;
}

.lab-root.is-light-stage .pill-label {
  color: #0f172a;
}
</style>
