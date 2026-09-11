<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import type {
  GlassPreset,
  LiquidGlassMaterialOptions,
  LiquidGlassStatus,
} from '@dinqorai/liquid-glass';
import { LiquidGlass } from '@dinqorai/liquid-glass/vue';
import { CapabilityProbe, type CapabilityReport } from '../../src/engine';

import { t } from '../locales';
import type { BackgroundItem, QualityTier } from '../types';
import { useCardDrag } from '../composables/useCardDrag';
import { installPlaygroundTestHook } from '../utils/browser-test-hook';

import ControlDrawer from '../components/ControlDrawer.vue';
import StageBackdrop from '../components/StageBackdrop.vue';
import MusicPlayerCard from '../components/MusicPlayerCard.vue';

type ContentMode = 'auto' | 'pure' | 'music';

const props = defineProps<{
  params: LiquidGlassMaterialOptions;
  backgrounds: BackgroundItem[];
  currentBg: string;
  glassWidth: number;
  glassHeight: number;
  selectedQuality: QualityTier;
  isPanelOpen: boolean;
  isLightBg: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:isPanelOpen', value: boolean): void;
  (event: 'update:selectedQuality', value: QualityTier): void;
  (event: 'update:glassWidth', value: number): void;
  (event: 'update:glassHeight', value: number): void;
  (event: 'update:currentBg', value: string): void;
  (event: 'updateParam', key: keyof LiquidGlassMaterialOptions, value: unknown): void;
  (event: 'applyPreset', preset: GlassPreset): void;
  (
    event: 'applyMatrix',
    width: number,
    height: number,
    radius: number,
    bezel: number,
    shape?: LiquidGlassMaterialOptions['shape']
  ): void;
}>();

const selectedQualityModel = computed<QualityTier>({
  get: () => props.selectedQuality,
  set: (value) => emit('update:selectedQuality', value),
});

const isPanelOpenModel = computed<boolean>({
  get: () => props.isPanelOpen,
  set: (value) => emit('update:isPanelOpen', value),
});

const glassWidthModel = computed<number>({
  get: () => props.glassWidth,
  set: (value) => emit('update:glassWidth', value),
});

const glassHeightModel = computed<number>({
  get: () => props.glassHeight,
  set: (value) => emit('update:glassHeight', value),
});

const currentBgModel = computed<string>({
  get: () => props.currentBg,
  set: (value) => emit('update:currentBg', value),
});

const contentMode = shallowRef<ContentMode>('auto');
const calibrationMode = shallowRef(false);
const glassRef = ref<InstanceType<typeof LiquidGlass> | null>(null);
const capabilityReport: CapabilityReport = CapabilityProbe.probe();
const fallbackPolicy = 'auto' as const;
const runtimeStatus = shallowRef<LiquidGlassStatus>({
  targetMode: null,
  activeMode: null,
  phase: 'initializing',
  degraded: false,
});

let statusTimer: ReturnType<typeof setInterval> | null = null;
let disposePlaygroundTestHook: (() => void) | null = null;

function syncRuntimeStatus(): void {
  const status = glassRef.value?.instance?.status;
  if (!status) return;

  runtimeStatus.value = {
    ...status,
    lastOperation: status.lastOperation ? { ...status.lastOperation } : undefined,
  };
}

onMounted(() => {
  syncRuntimeStatus();
  statusTimer = setInterval(syncRuntimeStatus, 120);
  disposePlaygroundTestHook = installPlaygroundTestHook(() => ({
    fallbackPolicy,
    capabilityReport,
    status: runtimeStatus.value,
  }));
});

onUnmounted(() => {
  if (statusTimer !== null) clearInterval(statusTimer);
  disposePlaygroundTestHook?.();
  disposePlaygroundTestHook = null;
});

const {
  cardPos,
  isDragging,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  resetPosition,
} = useCardDrag();

function toggleCalibrationMode(): void {
  calibrationMode.value = !calibrationMode.value;
}

function cycleContentMode(): void {
  contentMode.value =
    contentMode.value === 'auto' ? 'pure' : contentMode.value === 'pure' ? 'music' : 'auto';
}

function handleApplyPreset(preset: GlassPreset): void {
  emit('applyPreset', preset);
}

function handleApplyMatrix(
  width: number,
  height: number,
  radius: number,
  bezel: number,
  shape?: string
): void {
  emit('applyMatrix', width, height, radius, bezel, shape as LiquidGlassMaterialOptions['shape']);
}

function updateParam(key: keyof LiquidGlassMaterialOptions, value: unknown): void {
  emit('updateParam', key, value);
}
</script>

<template>
  <section class="home-view" :class="{ 'is-light-stage': isLightBg }">
    <div class="home-view__intro">
      <div>
        <span class="home-view__eyebrow">LIQUIDGLASS PLAYGROUND</span>
        <h1>首页效果实验台</h1>
        <p>拖动卡片，展开右侧面板，实时观察折射、色散与液态形变。</p>
      </div>
      <span class="home-view__state"><i /> LIVE PREVIEW</span>
    </div>

    <ControlDrawer
      v-model:is-open="isPanelOpenModel"
      v-model:selected-quality="selectedQualityModel"
      v-model:glass-width="glassWidthModel"
      v-model:glass-height="glassHeightModel"
      v-model:current-bg="currentBgModel"
      :params="props.params"
      :status="runtimeStatus"
      :capability-report="capabilityReport"
      :fallback-policy="fallbackPolicy"
      :backgrounds="props.backgrounds"
      @apply-preset="handleApplyPreset"
      @apply-matrix="handleApplyMatrix"
      @update-param="updateParam"
    />

    <main class="showcase-stage" :class="{ 'drawer-open': props.isPanelOpen }">
      <div class="stage-viewport">
        <StageBackdrop :is-light="isLightBg" :calibration-mode="calibrationMode" />

        <div class="stage-center">
          <div class="engine-indicator-pill">
            <span class="pulse-dot" />
            <span class="indicator-text">LiquidGlass Native Optics</span>
            <button
              class="stage-action-btn"
              :class="{ active: calibrationMode }"
              type="button"
              @click="toggleCalibrationMode"
            >
              {{ calibrationMode ? 'Normal Backdrop' : 'Test Chart' }}
            </button>
            <button
              class="stage-action-btn"
              :class="{ active: contentMode === 'pure' }"
              type="button"
              title="Switch between card, pure glass and music card"
              @click="cycleContentMode"
            >
              {{
                contentMode === 'pure'
                  ? 'Pure Optics'
                  : contentMode === 'music'
                    ? 'Music Card'
                    : 'Auto Content'
              }}
            </button>
            <button
              v-if="cardPos.x !== 0 || cardPos.y !== 0"
              class="stage-action-btn"
              type="button"
              :title="t.resetPosition"
              @click="resetPosition"
            >
              {{ t.resetPosition }}
            </button>
          </div>

          <div
            class="glass-stage-card-wrapper"
            :class="{ dragging: isDragging }"
            :style="{
              '--glass-card-width': `${props.glassWidth}px`,
              '--glass-card-height': `${props.glassHeight}px`,
              '--glass-card-ratio': props.glassWidth / props.glassHeight,
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
              ref="glassRef"
              :options="props.params"
              :interactive="true"
              style="width: 100%; height: 100%"
            >
              <div v-if="contentMode === 'pure'" class="pure-glass-container" />
              <div
                v-else-if="
                  contentMode === 'auto' && (props.glassHeight < 70 || props.glassWidth < 180)
                "
                class="glass-pill-content"
              >
                <span class="pill-dot" />
                <span class="pill-label">Liquid Glass</span>
              </div>
              <MusicPlayerCard v-else />
            </LiquidGlass>
          </div>

          <div class="glass-buttons-row">
            <span class="row-label">MATRIX</span>
            <button
              class="stage-geo-btn"
              :class="{ active: props.glassWidth === 100 && props.glassHeight === 40 }"
              type="button"
              @click="handleApplyMatrix(100, 40, 16, 12, 'roundedRect')"
            >
              100×40 Btn
            </button>
            <button
              class="stage-geo-btn"
              :class="{ active: props.glassWidth === 160 && props.glassHeight === 52 }"
              type="button"
              @click="handleApplyMatrix(160, 52, 20, 16, 'roundedRect')"
            >
              160×52 Dock
            </button>
            <button
              class="stage-geo-btn"
              :class="{ active: props.glassWidth === 320 && props.glassHeight === 64 }"
              type="button"
              @click="handleApplyMatrix(320, 64, 24, 20, 'capsule')"
            >
              320×64 Bar
            </button>
            <button
              class="stage-geo-btn"
              :class="{ active: props.glassWidth === 360 && props.glassHeight === 180 }"
              type="button"
              @click="handleApplyMatrix(360, 180, 28, 24, 'roundedRect')"
            >
              360×180 Card
            </button>
            <button
              class="stage-geo-btn"
              :class="{ active: props.glassWidth === 500 && props.glassHeight === 300 }"
              type="button"
              @click="handleApplyMatrix(500, 300, 36, 32, 'roundedRect')"
            >
              500×300 Sheet
            </button>
          </div>
        </div>
      </div>
    </main>
  </section>
</template>

<style scoped>
.home-view {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  color: #fff;
}

.home-view__intro {
  position: absolute;
  top: 104px;
  left: 28px;
  z-index: 20;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: min(calc(100% - 56px), 900px);
  pointer-events: none;
}

.home-view__eyebrow {
  color: rgba(255, 255, 255, 0.58);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.home-view__intro h1 {
  margin: 7px 0 4px;
  color: #fff;
  font-size: clamp(22px, 2.4vw, 32px);
  letter-spacing: -0.04em;
}

.home-view__intro p {
  margin: 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
}

.home-view__state {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 2px;
  padding: 7px 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.18);
  color: rgba(255, 255, 255, 0.65);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.home-view__state i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 9px rgba(16, 185, 129, 0.9);
}

.showcase-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 150px 24px 32px;
  overflow-x: hidden;
  overflow-y: auto;
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
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 960px;
  min-height: 440px;
  margin: auto;
}

.stage-center {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(100%, 900px);
  max-width: 100%;
  gap: 16px;
  margin: auto;
}

.engine-indicator-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 30px;
  background: rgba(0, 0, 0, 0.48);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  font-size: 11px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 10px #10b981;
}

.stage-action-btn,
.stage-geo-btn {
  border: 1px solid rgba(255, 255, 255, 0.17);
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.88);
  cursor: pointer;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    transform 180ms ease;
}

.stage-action-btn {
  padding: 4px 9px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 650;
}

.stage-action-btn:hover,
.stage-action-btn.active {
  border-color: rgba(125, 211, 252, 0.5);
  background: rgba(56, 189, 248, 0.28);
}

.stage-action-btn:active,
.stage-geo-btn:active {
  transform: scale(0.96);
}

.glass-stage-card-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(var(--glass-card-width, 380px), 100%);
  height: auto;
  max-width: 100%;
  aspect-ratio: var(--glass-card-ratio, 1.5833);
  cursor: grab;
  touch-action: none;
  user-select: none;
  transition: width 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-stage-card-wrapper.dragging {
  cursor: grabbing;
}

.pure-glass-container {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.glass-pill-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  gap: 8px;
  padding: 6px 14px;
  box-sizing: border-box;
}

.pill-dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 6px #38bdf8;
}

.pill-label {
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.glass-buttons-row {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  gap: 8px;
  flex-wrap: wrap;
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.row-label {
  color: rgba(255, 255, 255, 0.48);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.stage-geo-btn {
  flex: 0 0 auto;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.stage-geo-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.stage-geo-btn.active {
  border-color: #38bdf8;
  background: #38bdf8;
  color: #0f172a;
  font-weight: 750;
}

.home-view.is-light-stage .home-view__intro h1,
.home-view.is-light-stage .pill-label {
  color: #0f172a;
}

.home-view.is-light-stage .home-view__eyebrow,
.home-view.is-light-stage .home-view__intro p,
.home-view.is-light-stage .home-view__state,
.home-view.is-light-stage .row-label {
  color: #475569;
}

.home-view.is-light-stage .engine-indicator-pill,
.home-view.is-light-stage .glass-buttons-row {
  border-color: rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.68);
  color: #0f172a;
}

@media (min-width: 768px) and (max-width: 1199px) {
  .home-view__intro {
    top: 92px;
    left: 20px;
    width: calc(100% - 40px);
  }

  .showcase-stage {
    padding: 132px 18px 24px;
  }

  .showcase-stage.drawer-open {
    padding-right: 336px;
  }

  .stage-viewport {
    min-height: 420px;
  }

  .glass-buttons-row {
    justify-content: flex-start;
  }
}

@media (max-width: 767px) {
  .home-view__intro {
    top: 78px;
    left: 14px;
    width: calc(100% - 28px);
  }

  .home-view__intro h1 {
    font-size: 22px;
  }

  .home-view__intro p {
    max-width: 250px;
    line-height: 1.45;
  }

  .home-view__state {
    padding: 6px 8px;
    font-size: 9px;
  }

  .showcase-stage,
  .showcase-stage.drawer-open {
    align-items: stretch;
    padding: 142px 12px 20px;
  }

  .stage-viewport {
    min-height: 0;
    max-width: 100%;
    margin: 0 auto;
  }

  .stage-center {
    gap: 12px;
  }

  .engine-indicator-pill {
    width: min(100%, 440px);
    gap: 6px;
    padding: 6px 8px;
    font-size: 10px;
  }

  .indicator-text {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stage-action-btn {
    padding: 4px 7px;
    font-size: 9px;
  }

  .glass-stage-card-wrapper {
    align-self: center;
  }

  .glass-buttons-row {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: nowrap;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }

  .glass-buttons-row::-webkit-scrollbar {
    display: none;
  }

  .row-label {
    flex: 0 0 auto;
  }

  .stage-geo-btn {
    padding: 5px 9px;
    font-size: 10px;
  }
}

@media (max-width: 420px) {
  .home-view__intro {
    top: 74px;
  }

  .home-view__state {
    display: none;
  }

  .showcase-stage,
  .showcase-stage.drawer-open {
    padding-inline: 8px;
  }
}
</style>
