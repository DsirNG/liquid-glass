<script setup lang="ts">
import type { GlassPreset, LiquidGlassMaterialOptions } from '../../src/core';
import type { BackgroundItem, DemoEngine, QualityTier } from '../types';
import { t } from '../locales';

defineProps<{
  isOpen: boolean;
  selectedEngine: DemoEngine;
  selectedQuality: QualityTier;
  glassWidth: number;
  glassHeight: number;
  params: LiquidGlassMaterialOptions;
  currentBg: string;
  backgrounds: BackgroundItem[];
}>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'update:selectedEngine', value: DemoEngine): void;
  (e: 'update:selectedQuality', value: QualityTier): void;
  (e: 'update:glassWidth', value: number): void;
  (e: 'update:glassHeight', value: number): void;
  (e: 'update:currentBg', value: string): void;
  (e: 'updateParam', key: keyof LiquidGlassMaterialOptions, value: unknown): void;
  (e: 'applyPreset', preset: GlassPreset): void;
}>();

function onParamInput(key: keyof LiquidGlassMaterialOptions, e: Event, isNumber = true) {
  const target = e.target as HTMLInputElement;
  const val = isNumber ? Number(target.value) : target.value;
  emit('updateParam', key, val);
}
</script>

<template>
  <aside class="control-drawer" :class="{ open: isOpen }">
    <div class="drawer-header">
      <div>
        <h3>{{ t.inspectorTitle }}</h3>
        <p class="subtitle">{{ t.inspectorSubtitle }}</p>
      </div>
      <button class="close-icon-btn" @click="emit('update:isOpen', false)">✕</button>
    </div>

    <div class="drawer-body">
      <!-- Engine Selection -->
      <section class="ctrl-group">
        <label class="group-title">{{ t.engineMode }}</label>
        <div class="radio-pill-group">
          <button
            :class="{ active: selectedEngine === 'dom' }"
            @click="emit('update:selectedEngine', 'dom')"
          >
            {{ t.engineSvgLight }}
          </button>
          <button
            :class="{ active: selectedEngine === 'webgl' }"
            @click="emit('update:selectedEngine', 'webgl')"
          >
            {{ t.engineWebglShader }}
          </button>
        </div>
      </section>

      <!-- Quality Tier -->
      <section class="ctrl-group">
        <label class="group-title">{{ t.qualityTier }}</label>
        <div class="radio-pill-group">
          <button
            :class="{ active: selectedQuality === 'low' }"
            @click="emit('update:selectedQuality', 'low')"
          >
            {{ t.qualityLow }}
          </button>
          <button
            :class="{ active: selectedQuality === 'medium' }"
            @click="emit('update:selectedQuality', 'medium')"
          >
            {{ t.qualityMedium }}
          </button>
          <button
            :class="{ active: selectedQuality === 'high' }"
            @click="emit('update:selectedQuality', 'high')"
          >
            {{ t.qualityHigh }}
          </button>
          <button
            :class="{ active: selectedQuality === 'ultra' }"
            @click="emit('update:selectedQuality', 'ultra')"
          >
            {{ t.qualityUltra }}
          </button>
        </div>
      </section>

      <!-- Presets -->
      <section class="ctrl-group">
        <label class="group-title">{{ t.presetsTitle }}</label>
        <div class="preset-buttons">
          <button @click="emit('applyPreset', 'ios-like')">{{ t.presetIos }}</button>
          <button @click="emit('applyPreset', 'clear')">{{ t.presetClear }}</button>
          <button @click="emit('applyPreset', 'vivid')">{{ t.presetVivid }}</button>
          <button @click="emit('applyPreset', 'heavy')">{{ t.presetHeavy }}</button>
        </div>
      </section>

      <!-- Geometry -->
      <section class="ctrl-group">
        <label class="group-title">{{ t.geometryTitle }}</label>
        <div class="slider-row">
          <span>{{ t.width }}</span>
          <input
            :value="glassWidth"
            type="range"
            min="260"
            max="680"
            step="10"
            @input="emit('update:glassWidth', Number(($event.target as HTMLInputElement).value))"
          />
          <span class="val">{{ glassWidth }}px</span>
        </div>
        <div class="slider-row">
          <span>{{ t.height }}</span>
          <input
            :value="glassHeight"
            type="range"
            min="160"
            max="520"
            step="10"
            @input="emit('update:glassHeight', Number(($event.target as HTMLInputElement).value))"
          />
          <span class="val">{{ glassHeight }}px</span>
        </div>
        <div class="slider-row">
          <span>{{ t.radius }}</span>
          <input
            :value="params.radius"
            type="range"
            min="8"
            max="100"
            @input="onParamInput('radius', $event)"
          />
          <span class="val">{{ params.radius }}px</span>
        </div>
        <div class="slider-row">
          <span>{{ t.bezel }}</span>
          <input
            :value="params.bezel"
            type="range"
            min="4"
            max="70"
            @input="onParamInput('bezel', $event)"
          />
          <span class="val">{{ params.bezel }}px</span>
        </div>
      </section>

      <!-- Optics & Physics -->
      <section class="ctrl-group">
        <label class="group-title">{{ t.opticsTitle }}</label>
        <div class="slider-row">
          <span>{{ t.thickness }}</span>
          <input
            :value="params.thickness"
            type="range"
            min="10"
            max="150"
            @input="onParamInput('thickness', $event)"
          />
          <span class="val">{{ params.thickness }}</span>
        </div>
        <div class="slider-row">
          <span>{{ t.ior }}</span>
          <input
            :value="params.ior"
            type="range"
            min="1.0"
            max="3.0"
            step="0.05"
            @input="onParamInput('ior', $event)"
          />
          <span class="val">{{ params.ior?.toFixed(2) }}</span>
        </div>
        <div class="slider-row">
          <span>{{ t.dispersion }}</span>
          <input
            :value="params.dispersion"
            type="range"
            min="0.0"
            max="0.09"
            step="0.005"
            @input="onParamInput('dispersion', $event)"
          />
          <span class="val">{{ ((params.dispersion ?? 0) * 100).toFixed(1) }}%</span>
        </div>
        <div class="slider-row">
          <span>{{ t.blur }}</span>
          <input
            :value="params.blur"
            type="range"
            min="0.0"
            max="10.0"
            step="0.2"
            @input="onParamInput('blur', $event)"
          />
          <span class="val">{{ params.blur?.toFixed(1) }}px</span>
        </div>
        <div class="slider-row">
          <span>{{ t.specular }}</span>
          <input
            :value="params.specular"
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            @input="onParamInput('specular', $event)"
          />
          <span class="val">{{ params.specular?.toFixed(2) }}</span>
        </div>
      </section>

      <!-- Color & Atmosphere -->
      <section class="ctrl-group">
        <label class="group-title">{{ t.appearanceTitle }}</label>
        <div class="color-row">
          <span>{{ t.tintColor }}</span>
          <input :value="params.tint" type="color" @input="onParamInput('tint', $event, false)" />
        </div>
        <div class="slider-row">
          <span>{{ t.tintOpacity }}</span>
          <input
            :value="params.opacity"
            type="range"
            min="0.0"
            max="0.4"
            step="0.02"
            @input="onParamInput('opacity', $event)"
          />
          <span class="val">{{ Math.round((params.opacity ?? 0) * 100) }}%</span>
        </div>
        <div class="slider-row">
          <span>{{ t.shadowDepth }}</span>
          <input
            :value="params.shadow"
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            @input="onParamInput('shadow', $event)"
          />
          <span class="val">{{ params.shadow?.toFixed(2) }}</span>
        </div>
      </section>

      <!-- Background Wallpaper -->
      <section class="ctrl-group">
        <label class="group-title">{{ t.wallpapersTitle }}</label>
        <div class="bg-grid">
          <button
            v-for="bg in backgrounds"
            :key="bg.id"
            class="bg-card"
            :class="{ active: currentBg === bg.url }"
            :style="{ backgroundImage: `url(${bg.url})` }"
            @click="emit('update:currentBg', bg.url)"
          >
            <span>{{ bg.name }}</span>
          </button>
        </div>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.control-drawer {
  position: fixed;
  top: 16px;
  right: 16px;
  bottom: 16px;
  width: 320px;
  background: rgba(16, 18, 24, 0.75);
  backdrop-filter: blur(40px) saturate(1.8);
  -webkit-backdrop-filter: blur(40px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 28px;
  z-index: 120;
  display: flex;
  flex-direction: column;
  transform: translateX(calc(100% + 24px));
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.4);
}

.control-drawer.open {
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.drawer-header h3 {
  font-size: 15px;
  font-weight: 700;
}

.subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.close-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ctrl-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.45);
}

.radio-pill-group {
  display: flex;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
}

.radio-pill-group button {
  flex: 1;
  padding: 7px 4px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  font-size: 11px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
}

.radio-pill-group button.active {
  background: #8b7cf7;
  color: #fff;
  font-weight: 600;
}

.preset-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.preset-buttons button {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.preset-buttons button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.slider-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.slider-row input[type='range'] {
  flex: 1;
  accent-color: #8b7cf7;
  height: 4px;
  cursor: pointer;
}

.slider-row .val {
  min-width: 44px;
  text-align: right;
  font-family: monospace;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
}

.color-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.color-row input[type='color'] {
  width: 32px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.bg-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.bg-card {
  height: 52px;
  border-radius: 12px;
  border: 2px solid transparent;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  padding: 6px;
  position: relative;
  overflow: hidden;
  transition: transform 0.15s;
}

.bg-card span {
  font-size: 9px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 6px;
}

.bg-card.active {
  border-color: #8b7cf7;
}
</style>
