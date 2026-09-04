<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import type { RendererType, GlassPreset, LiquidGlassMaterialOptions } from '../src/core';
import { GLASS_PRESETS } from '../src/core';
import { LiquidGlass } from '../src/vue';
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

// Engine & Quality selection
const selectedEngine = ref<RendererType>('svg');
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
const mainGlassRef = ref<InstanceType<typeof LiquidGlass> | null>(null);

const resolvedEngineLabel = computed(() => {
  const resolved = mainGlassRef.value?.renderer;
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
} = useCardDrag(() => mainGlassRef.value?.resize());
</script>

<template>
  <div class="lab-root" :style="{ backgroundImage: `url(${currentBg})` }">
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
      <StageBackdrop />

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
            ref="mainGlassRef"
            :renderer="selectedEngine"
            :options="params"
            :background-url="currentBg"
            :interactive="true"
            style="width: 100%; height: 100%"
          >
            <template #default="{ renderer: currentRunRenderer }">
              <MusicPlayerCard :current-renderer="currentRunRenderer" />
            </template>
          </LiquidGlass>
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
</style>
