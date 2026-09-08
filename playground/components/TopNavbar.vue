<script setup lang="ts">
import { computed } from 'vue';
import { GlassTabBar, type GlassTabBarItem } from '../../src/vue';
import type { LiquidGlassMaterialOptions } from '../../src/core';
import { t } from '../locales';
import { withPureRefraction } from '../utils/material';

export type PlaygroundView = 'home' | 'library';

const props = withDefaults(
  defineProps<{
    modelValue?: PlaygroundView;
    isPanelOpen: boolean;
  }>(),
  {
    modelValue: 'home',
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: PlaygroundView): void;
  (event: 'update:isPanelOpen', value: boolean): void;
}>();

const navItems: GlassTabBarItem[] = [
  { value: 'home', label: '首页' },
  { value: 'library', label: '组件库' },
];

// The top navigation has its own material contract. HomeShowcase's control
// panel intentionally updates only the main card options.
const tabBarOptions: LiquidGlassMaterialOptions = withPureRefraction({
  shape: 'roundedRect',
  radius: 999,
  bezel: 16,
  refraction: 0.82,
  dispersion: 0.8,
  saturation: 1.15,
  specular: 0.72,
  shadow: 0.18,
  quality: 'high',
});

const activeView = computed<PlaygroundView>({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function togglePanel(): void {
  emit('update:isPanelOpen', !props.isPanelOpen);
}
</script>

<template>
  <header class="top-navbar-wrapper">
    <GlassTabBar
      v-model="activeView"
      :items="navItems"
      :height="64"
      :item-width="124"
      :radius="999"
      responsive
      :mobile-height="56"
      :mobile-item-width="84"
      :tablet-height="60"
      :tablet-item-width="104"
      :lens-inset="7"
      :base-options="tabBarOptions"
      :lens-options="tabBarOptions"
    >
      <template #prefix>
        <div class="top-navbar-brand">
          <span class="top-navbar-brand-dot" />
          <span class="top-navbar-brand-text">LiquidGlass Lab</span>
        </div>
      </template>

      <template #item="{ item, index }">
        <span class="glass-tabbar__icon top-navbar-tab-icon" aria-hidden="true">
          <svg v-if="index === 0" viewBox="0 0 24 24">
            <path
              d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 19.5v-9Z"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24">
            <path d="M5 5h14M5 12h14M5 19h14" />
            <circle cx="9" cy="5" r="1.6" />
            <circle cx="15" cy="12" r="1.6" />
            <circle cx="10" cy="19" r="1.6" />
          </svg>
        </span>
        <span class="glass-tabbar__label">{{ item.label }}</span>
      </template>

      <template #suffix>
        <div class="top-navbar-actions">
          <span class="top-navbar-version">Vue</span>
          <button
            v-if="activeView === 'home'"
            class="top-navbar-icon-btn top-navbar-panel-btn"
            type="button"
            :aria-label="props.isPanelOpen ? t.hideControls : t.showControls"
            :title="props.isPanelOpen ? t.hideControls : t.showControls"
            @click.stop="togglePanel"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5h16M4 12h16M4 19h16" />
            </svg>
          </button>
        </div>
      </template>
    </GlassTabBar>
  </header>
</template>

<style scoped>
.top-navbar-wrapper {
  position: fixed;
  top: 18px;
  left: 50%;
  z-index: 100;
  max-width: calc(100vw - 24px);
  transform: translateX(-50%);
}

.top-navbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 158px;
  padding: 0 10px;
  white-space: nowrap;
}

.top-navbar-brand-dot {
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.9);
}

.top-navbar-brand-text {
  color: rgba(255, 255, 255, 0.96);
  font-size: 14px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.top-navbar-tab-icon {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  color: currentColor;
}

.top-navbar-tab-icon svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.top-navbar-tab-icon :deep(path),
.top-navbar-tab-icon :deep(circle) {
  vector-effect: non-scaling-stroke;
}

.top-navbar-actions {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 7px 0 10px;
}

.top-navbar-version {
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.top-navbar-icon-btn {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  transition:
    background 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.top-navbar-icon-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}

.top-navbar-icon-btn:active {
  transform: scale(0.9);
}

.top-navbar-icon-btn svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

@media (min-width: 768px) and (max-width: 1199px) {
  .top-navbar-wrapper {
    top: 14px;
  }

  .top-navbar-brand {
    min-width: 136px;
  }
}

@media (max-width: 767px) {
  .top-navbar-wrapper {
    top: 10px;
    max-width: calc(100vw - 16px);
  }

  .top-navbar-brand {
    min-width: 28px;
    gap: 0;
    padding-inline: 4px;
  }

  .top-navbar-brand-text {
    display: none;
  }

  .top-navbar-brand-dot {
    width: 8px;
    height: 8px;
  }

  .top-navbar-version {
    display: none;
  }

  .top-navbar-actions {
    gap: 0;
    padding-inline: 2px 4px;
  }

  .top-navbar-icon-btn {
    width: 30px;
    height: 30px;
  }

  .top-navbar-wrapper :deep(.glass-tabbar__icon),
  .top-navbar-wrapper :deep(.top-navbar-tab-icon) {
    width: 20px;
    height: 20px;
  }

  .top-navbar-wrapper :deep(.top-navbar-tab-icon svg) {
    width: 17px;
    height: 17px;
  }

  .top-navbar-wrapper :deep(.glass-tabbar__label) {
    font-size: 11px;
    letter-spacing: 0;
  }
}
</style>
