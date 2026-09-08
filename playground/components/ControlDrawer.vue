<script setup lang="ts">
import type { GlassPreset, LiquidGlassMaterialOptions } from '../../src/core';
import type { BackgroundItem, QualityTier } from '../types';
import { DEFAULT_SOLID_COLORS } from '../types';
import { t } from '../locales';

defineProps<{
  isOpen: boolean;
  selectedQuality: QualityTier;
  glassWidth: number;
  glassHeight: number;
  params: LiquidGlassMaterialOptions;
  currentBg: string;
  backgrounds: BackgroundItem[];
}>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'update:selectedQuality', value: QualityTier): void;
  (e: 'update:glassWidth', value: number): void;
  (e: 'update:glassHeight', value: number): void;
  (e: 'update:currentBg', value: string): void;
  (e: 'updateParam', key: keyof LiquidGlassMaterialOptions, value: unknown): void;
  (e: 'applyPreset', preset: GlassPreset): void;
  (e: 'applyMatrix', w: number, h: number, r: number, b: number, shape?: string): void;
}>();

function onParamInput(key: keyof LiquidGlassMaterialOptions, e: Event, isNumber = true) {
  const target = e.target as HTMLInputElement;
  const val = isNumber ? Number(target.value) : target.value;
  emit('updateParam', key, val);
}

function setInspectionMode(mode: 'final' | 'refraction' | 'frosted'): void {
  const modeOptions: Record<
    'final' | 'refraction' | 'frosted',
    Partial<LiquidGlassMaterialOptions>
  > = {
    final: {
      debug: 'none',
      refraction: 1.0,
      blur: 0.1,
      opacity: 0.08,
      specular: 0.7,
      shadow: 0.35,
    },
    refraction: {
      debug: 'none',
      blur: 0,
      opacity: 0,
      specular: 0.75,
      shadow: 0.25,
      refraction: 1.0,
    },
    frosted: {
      debug: 'none',
      refraction: 0,
      blur: 8.0,
      opacity: 0.12,
      specular: 0.5,
      shadow: 0.35,
    },
  };

  const nextOptions = modeOptions[mode];
  for (const [key, value] of Object.entries(nextOptions)) {
    emit('updateParam', key as keyof LiquidGlassMaterialOptions, value);
  }
}

function isSolidColor(val: string): boolean {
  return typeof val === 'string' && (val.startsWith('#') || val.startsWith('rgb'));
}

function onCustomColorInput(e: Event) {
  const target = e.target as HTMLInputElement;
  emit('update:currentBg', target.value);
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
      <!-- 🔬 质检观察模式 (Inspection Modes) -->
      <section class="ctrl-group">
        <label class="group-title">{{ t.inspectionMode }}</label>
        <div
          class="radio-pill-group"
          style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px"
        >
          <button
            :class="{
              active:
                (!params.debug || params.debug === 'none') &&
                (params.refraction ?? 1) > 0 &&
                (params.opacity ?? 0) > 0,
            }"
            style="font-size: 10px; padding: 8px 2px; font-weight: 700; text-align: center"
            @click="setInspectionMode('final')"
          >
            {{ t.modeFinal }}
          </button>
          <button
            :class="{
              active:
                params.debug === 'refraction' ||
                ((!params.debug || params.debug === 'none') &&
                  (params.opacity ?? 0) === 0 &&
                  (params.refraction ?? 1) > 0),
            }"
            style="
              font-size: 10px;
              padding: 8px 2px;
              font-weight: 700;
              text-align: center;
              color: #38bdf8;
            "
            @click="setInspectionMode('refraction')"
          >
            {{ t.modePureRefraction }}
          </button>
          <button
            :class="{ active: params.refraction === 0 }"
            style="font-size: 10px; padding: 8px 2px; font-weight: 700; text-align: center"
            @click="setInspectionMode('frosted')"
          >
            {{ t.modeFrosted }}
          </button>
        </div>
      </section>

      <!-- Visual Calibration Matrix (100x40 to 500x300) -->
      <section class="ctrl-group">
        <label class="group-title">📐 Geometry Calibration Matrix</label>
        <div
          class="preset-buttons"
          style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px"
        >
          <button @click="emit('applyMatrix', 100, 40, 16, 12, 'roundedRect')">100×40 Btn</button>
          <button @click="emit('applyMatrix', 160, 52, 20, 16, 'roundedRect')">160×52 Dock</button>
          <button @click="emit('applyMatrix', 320, 64, 24, 20, 'capsule')">320×64 Bar</button>
          <button @click="emit('applyMatrix', 360, 180, 28, 24, 'roundedRect')">
            360×180 Card
          </button>
          <button @click="emit('applyMatrix', 500, 300, 36, 32, 'roundedRect')">
            500×300 Sheet
          </button>
          <button @click="emit('applyMatrix', 80, 80, 40, 20, 'circle')">80×80 Circ</button>
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
            min="80"
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
            min="40"
            max="520"
            step="10"
            @input="emit('update:glassHeight', Number(($event.target as HTMLInputElement).value))"
          />
          <span class="val">{{ glassHeight }}px</span>
        </div>
        <div class="slider-row-block">
          <div class="slider-header">
            <span>{{ t.radius }}</span>
            <span class="val">{{ params.radius }}px</span>
          </div>
          <input
            :value="params.radius"
            type="range"
            min="8"
            max="100"
            @input="onParamInput('radius', $event)"
          />
        </div>
        <div class="slider-row-block">
          <div class="slider-header">
            <span>{{ t.bezel }}</span>
            <span class="val">{{ params.bezel }}px</span>
          </div>
          <input
            :value="params.bezel"
            type="range"
            min="4"
            max="70"
            @input="onParamInput('bezel', $event)"
          />
          <small class="param-hint">{{ t.bezelHint }}</small>
        </div>

        <!-- 💧 曲面流体形态切换 (Lens Profile) -->
        <div class="profile-mode-box" style="margin-top: 14px">
          <div class="slider-header" style="margin-bottom: 6px">
            <span style="font-weight: 600; font-size: 11px">{{ t.lensProfileTitle }}</span>
          </div>
          <div
            class="radio-pill-group"
            style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px"
          >
            <button
              :class="{
                active:
                  !params.surfaceProfile ||
                  params.surfaceProfile === 'convex_squircle' ||
                  params.surfaceProfile === 'convex_circle',
              }"
              style="font-size: 10px; padding: 7px 4px; font-weight: 700; text-align: center"
              @click="emit('updateParam', 'surfaceProfile', 'convex_squircle')"
            >
              {{ t.profileChamfer }}
            </button>
            <button
              :class="{ active: params.surfaceProfile === 'fluid_dome' }"
              style="
                font-size: 10px;
                padding: 7px 4px;
                font-weight: 700;
                text-align: center;
                color: #38bdf8;
              "
              @click="emit('updateParam', 'surfaceProfile', 'fluid_dome')"
            >
              {{ t.profileFluidDome }}
            </button>
            <button
              :class="{ active: params.surfaceProfile === 'viscous_meniscus' }"
              style="
                font-size: 10px;
                padding: 7px 4px;
                font-weight: 700;
                text-align: center;
                color: #a855f7;
              "
              @click="emit('updateParam', 'surfaceProfile', 'viscous_meniscus')"
            >
              {{ t.profileViscous }}
            </button>
            <button
              :class="{ active: params.surfaceProfile === 'cylindrical_rod' }"
              style="
                font-size: 10px;
                padding: 7px 4px;
                font-weight: 700;
                text-align: center;
                color: #10b981;
              "
              @click="emit('updateParam', 'surfaceProfile', 'cylindrical_rod')"
            >
              {{ t.profileRod }}
            </button>
          </div>
          <small class="param-hint" style="display: block; margin-top: 5px; line-height: 1.4">
            {{ t.profileHint }}
          </small>
        </div>
      </section>

      <!-- Liquid deformation coverage: maps directly to refractionCoverage. -->
      <div class="coverage-mode-box" style="margin-top: 14px">
        <div class="slider-header" style="margin-bottom: 6px">
          <span style="font-weight: 600; font-size: 11px">液态变形范围 (Coverage)</span>
        </div>
        <div
          class="radio-pill-group"
          style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px"
        >
          <button
            :class="{ active: (params.refractionCoverage ?? 'rim') === 'rim' }"
            style="font-size: 10px; padding: 7px 4px; font-weight: 700; text-align: center"
            @click="emit('updateParam', 'refractionCoverage', 'rim')"
          >
            边缘液态 (Rim)
          </button>
          <button
            :class="{ active: params.refractionCoverage === 'full' }"
            style="font-size: 10px; padding: 7px 4px; font-weight: 700; text-align: center"
            @click="emit('updateParam', 'refractionCoverage', 'full')"
          >
            全域液态 (Full)
          </button>
        </div>
        <small class="param-hint" style="display: block; margin-top: 5px; line-height: 1.4">
          Rim 只在边缘变形；Full 让整张卡片参与液态折射。
        </small>
      </div>

      <!-- Optics & Physics -->
      <section class="ctrl-group">
        <label class="group-title">{{ t.opticsTitle }}</label>
        <div class="slider-row-block">
          <div class="slider-header">
            <span>{{ t.refraction }}</span>
            <span class="val">{{ (params.refraction ?? 1.0).toFixed(1) }}x</span>
          </div>
          <input
            :value="params.refraction"
            type="range"
            min="0.0"
            max="3.0"
            step="0.1"
            @input="onParamInput('refraction', $event)"
          />
          <small class="param-hint">{{ t.refractionHint }}</small>
        </div>
        <div class="slider-row-block">
          <div class="slider-header">
            <span>{{ t.thickness }}</span>
            <span class="val">{{ params.thickness }}</span>
          </div>
          <input
            :value="params.thickness"
            type="range"
            min="10"
            max="150"
            @input="onParamInput('thickness', $event)"
          />
          <small class="param-hint">{{ t.thicknessHint }}</small>
        </div>
        <div class="slider-row-block">
          <div class="slider-header">
            <span>{{ t.ior }}</span>
            <span class="val">{{ params.ior?.toFixed(2) }}</span>
          </div>
          <input
            :value="params.ior"
            type="range"
            min="1.0"
            max="3.0"
            step="0.05"
            @input="onParamInput('ior', $event)"
          />
          <small class="param-hint">{{ t.iorHint }}</small>
        </div>
        <div class="slider-row-block">
          <div class="slider-header">
            <span>{{ t.dispersion }}</span>
            <span class="val">{{ (params.dispersion ?? 1.0).toFixed(1) }}x</span>
          </div>
          <input
            :value="params.dispersion"
            type="range"
            min="0.0"
            max="4.0"
            step="0.1"
            @input="onParamInput('dispersion', $event)"
          />
          <small class="param-hint">{{ t.dispersionHint }}</small>
        </div>
        <div class="slider-row-block">
          <div class="slider-header">
            <span style="color: #38bdf8; font-weight: 600">{{ t.colorBleed }}</span>
            <span class="val" style="color: #38bdf8"
              >{{ Math.round((params.colorBleed ?? 0.6) * 100) }}%</span
            >
          </div>
          <input
            :value="params.colorBleed ?? 0.6"
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            @input="onParamInput('colorBleed', $event)"
          />
          <small class="param-hint">{{ t.colorBleedHint }}</small>
        </div>
        <div class="slider-row-block">
          <div class="slider-header">
            <span>色彩饱和度 (Saturation)</span>
            <span class="val">{{ Math.round((params.saturation ?? 1.3) * 100) }}%</span>
          </div>
          <input
            :value="params.saturation"
            type="range"
            min="0.0"
            max="2.5"
            step="0.1"
            @input="onParamInput('saturation', $event)"
          />
          <small class="param-hint">调整透镜内背景颜色的强弱，100% 为原始饱和度</small>
        </div>
        <div class="slider-row-block">
          <div class="slider-header">
            <span>{{ t.blur }}</span>
            <span class="val">{{ params.blur?.toFixed(1) }}px</span>
          </div>
          <input
            :value="params.blur"
            type="range"
            min="0.0"
            max="10.0"
            step="0.2"
            @input="onParamInput('blur', $event)"
          />
          <small class="param-hint">{{ t.blurHint }}</small>
        </div>
        <div class="slider-row-block">
          <div class="slider-header">
            <span>{{ t.specular }}</span>
            <span class="val">{{ params.specular?.toFixed(2) }}</span>
          </div>
          <input
            :value="params.specular"
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            @input="onParamInput('specular', $event)"
          />
          <small class="param-hint">{{ t.specularHint }}</small>
        </div>

        <!-- 🌓 白底边缘呈现方案 Tab 切换 (Border Contrast Mode) -->
        <div class="border-mode-box" style="margin-top: 14px">
          <div class="slider-header" style="margin-bottom: 6px">
            <span style="font-weight: 600; font-size: 11px">{{ t.borderModeTitle }}</span>
          </div>
          <div
            class="radio-pill-group"
            style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px"
          >
            <button
              :class="{ active: (params.borderMode ?? 'directional') === 'directional' }"
              style="font-size: 10px; padding: 7px 4px; font-weight: 700; text-align: center"
              @click="emit('updateParam', 'borderMode', 'directional')"
            >
              {{ t.borderModeDirectional }}
            </button>
            <button
              :class="{ active: params.borderMode === 'adaptive' }"
              style="font-size: 10px; padding: 7px 4px; font-weight: 700; text-align: center"
              @click="emit('updateParam', 'borderMode', 'adaptive')"
            >
              {{ t.borderModeAdaptive }}
            </button>
          </div>
          <small class="param-hint" style="display: block; margin-top: 5px; line-height: 1.4">
            {{
              (params.borderMode ?? 'directional') === 'directional'
                ? t.borderModeDirectionalHint
                : t.borderModeAdaptiveHint
            }}
          </small>
        </div>
      </section>

      <!-- Color & Atmosphere -->
      <section class="ctrl-group">
        <label class="group-title">{{ t.appearanceTitle }}</label>
        <div class="color-row">
          <span>{{ t.tintColor }}</span>
          <input :value="params.tint" type="color" @input="onParamInput('tint', $event, false)" />
        </div>
        <div class="slider-row-block">
          <div class="slider-header">
            <span>{{ t.tintOpacity }}</span>
            <span class="val">{{ Math.round((params.opacity ?? 0) * 100) }}%</span>
          </div>
          <input
            :value="params.opacity"
            type="range"
            min="0.0"
            max="0.4"
            step="0.02"
            @input="onParamInput('opacity', $event)"
          />
          <small class="param-hint">{{ t.tintOpacityHint }}</small>
        </div>
        <div class="slider-row-block">
          <div class="slider-header">
            <span>{{ t.shadowDepth }}</span>
            <span class="val">{{ params.shadow?.toFixed(2) }}</span>
          </div>
          <input
            :value="params.shadow"
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            @input="onParamInput('shadow', $event)"
          />
          <small class="param-hint">{{ t.shadowDepthHint }}</small>
        </div>
      </section>

      <!-- Background Wallpaper & Solid Colors -->
      <section class="ctrl-group">
        <div class="group-title-row">
          <label class="group-title">{{ t.wallpapersTitle }}</label>
          <div class="custom-color-picker-wrap">
            <span class="custom-color-label">自定义纯色:</span>
            <input
              type="color"
              :value="isSolidColor(currentBg) ? currentBg : '#0f172a'"
              class="custom-color-input"
              @input="onCustomColorInput"
            />
          </div>
        </div>

        <label class="subgroup-title">图片壁纸</label>
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

        <label class="subgroup-title" style="margin-top: 14px">纯色背景</label>
        <div class="solid-colors-grid">
          <button
            v-for="solid in DEFAULT_SOLID_COLORS"
            :key="solid.id"
            class="solid-color-card"
            :class="{ active: currentBg === solid.color }"
            :style="{ backgroundColor: solid.color }"
            :title="solid.name"
            @click="emit('update:currentBg', solid.color)"
          >
            <span
              class="solid-color-name"
              :class="{ 'dark-text': solid.color === '#ffffff' || solid.color === '#e2e8f0' }"
            >
              {{ solid.name }}
            </span>
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

.group-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.subgroup-title {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
}

.custom-color-picker-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.custom-color-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}

.custom-color-input {
  width: 24px;
  height: 22px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
}

.solid-colors-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.solid-color-card {
  height: 38px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition:
    transform 0.15s,
    border-color 0.15s;
}

.solid-color-card:hover {
  transform: scale(1.02);
}

.solid-color-card.active {
  border-color: #8b7cf7;
  box-shadow: 0 0 8px rgba(139, 124, 247, 0.5);
}

.solid-color-name {
  font-size: 9px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  text-align: center;
  line-height: 1.1;
}

.solid-color-name.dark-text {
  color: #1e293b;
  text-shadow: none;
}

/* Tablet: keep the inspector as a right rail without covering the usable stage. */
@media (min-width: 768px) and (max-width: 1199px) {
  .control-drawer {
    top: 12px;
    right: 12px;
    bottom: 12px;
    width: min(312px, calc(100vw - 24px));
  }

  .drawer-body {
    padding-inline: 16px;
  }
}

/* Phone: turn the inspector into a bottom sheet so the demo remains visible. */
@media (max-width: 767px) {
  .control-drawer {
    top: auto;
    right: 8px;
    bottom: 8px;
    left: 8px;
    width: auto;
    height: min(78vh, 680px);
    max-height: calc(100vh - 72px);
    border-radius: 24px;
    transform: translateY(calc(100% + 20px));
  }

  .control-drawer.open {
    transform: translateY(0);
  }

  .drawer-header {
    padding: 16px 16px 12px;
  }

  .drawer-body {
    gap: 16px;
    padding: 14px 14px max(24px, env(safe-area-inset-bottom));
  }

  .group-title {
    font-size: 10px;
  }

  .slider-row {
    gap: 8px;
  }

  .preset-buttons button {
    min-width: 0;
    padding-inline: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
