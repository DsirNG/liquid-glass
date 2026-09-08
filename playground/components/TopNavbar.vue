<script setup lang="ts">
import { computed, ref } from 'vue';
import { GlassTabBar, type GlassTabBarItem } from '../../src/vue';
import type { LiquidGlassMaterialOptions } from '../../src/core';
import { t } from '../locales';

const props = defineProps<{
  isPanelOpen: boolean;
  glassOptions?: LiquidGlassMaterialOptions;
}>();

const emit = defineEmits<{
  (e: 'update:isPanelOpen', open: boolean): void;
}>();

const activeTab = ref('home');

const navItems: GlassTabBarItem[] = [
  { value: 'home', label: '首页' },
  { value: 'community', label: '社区', badge: 'NEW' },
  { value: 'wealth', label: '财富' },
  { value: 'life', label: '生活' },
  { value: 'profile', label: '我的' },
];

// The demo card and the TabBar share one material source of truth. The card's
// footprint shape is intentionally normalized because a circle selected in
// the inspector must not turn the horizontal navigation into a circle.
const tabBarOptions = computed<LiquidGlassMaterialOptions>(() => ({
  ...(props.glassOptions ?? {}),
  shape: 'roundedRect',
}));

function togglePanel(): void {
  emit('update:isPanelOpen', !props.isPanelOpen);
}
</script>

<template>
  <header class="top-navbar-wrapper">
    <GlassTabBar
      v-model="activeTab"
      :items="navItems"
      :height="94"
      :item-width="104"
      :radius="999"
      responsive
      :mobile-height="60"
      :mobile-item-width="40"
      :tablet-height="80"
      :tablet-item-width="76"
      :lens-inset="8"
      :base-options="tabBarOptions"
      :lens-options="tabBarOptions"
    >
      <template #prefix>
        <div class="top-navbar-brand">
          <span class="top-navbar-brand-dot" />
          <span class="top-navbar-brand-text">logo GlassLab</span>
        </div>
      </template>

      <template #item="{ item, index }">
        <span class="glass-tabbar__icon top-navbar-tab-icon" aria-hidden="true">
          <svg v-if="index === 0" viewBox="0 0 24 24">
            <path
              d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 19.5v-9Z"
            />
          </svg>
          <svg v-else-if="index === 1" viewBox="0 0 24 24">
            <path
              d="M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 21v-2.2C2 15.6 4.7 13 8 13s6 2.6 6 5.8V21H2Zm13-7.2a6.8 6.8 0 0 1 2-.3c2.8 0 5 2.1 5 4.7V21h-3v-2.2c0-2.1-1.6-4-4-5Z"
            />
          </svg>
          <svg v-else-if="index === 2" viewBox="0 0 24 24">
            <path
              d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM7 17h10v2H7v-2Z"
            />
          </svg>
          <svg v-else-if="index === 3" viewBox="0 0 24 24">
            <path d="M12 21s-8-4.7-8-11a4.5 4.5 0 0 1 8-2.7A4.5 4.5 0 0 1 20 10c0 6.3-8 11-8 11Z" />
          </svg>
          <svg v-else viewBox="0 0 24 24">
            <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0H5Z" />
          </svg>
        </span>
        <span class="glass-tabbar__label">{{ item.label }}</span>
        <span v-if="item.badge !== undefined" class="glass-tabbar__badge">{{ item.badge }}</span>
      </template>

      <template #suffix>
        <div class="top-navbar-actions">
          <button class="top-navbar-icon-btn" type="button" aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="5.5" />
              <path d="m15 15 5 5" />
            </svg>
          </button>
          <button
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
  top: 20px;
  left: 50%;
  z-index: 100;
  transform: translateX(-50%);
  max-width: calc(100vw - 24px);
}

.top-navbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 124px;
  padding: 0 8px;
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
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.top-navbar-tab-icon {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  color: currentColor;
  transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

.top-navbar-tab-icon svg {
  width: 22px;
  height: 22px;
  fill: currentColor;
}

.top-navbar-tab-icon :deep(path),
.top-navbar-tab-icon :deep(circle) {
  vector-effect: non-scaling-stroke;
}

.top-navbar-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 4px 0 8px;
}

.top-navbar-icon-btn {
  display: grid;
  width: 34px;
  height: 34px;
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
}

@media (max-width: 767px) {
  .top-navbar-wrapper {
    top: 10px;
  }

  .top-navbar-brand {
    min-width: 30px;
    gap: 0;
    padding-inline: 2px;
  }

  .top-navbar-brand-text {
    display: none;
  }

  .top-navbar-brand-dot {
    width: 8px;
    height: 8px;
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
    width: 18px;
    height: 18px;
  }

  .top-navbar-wrapper :deep(.glass-tabbar__label) {
    font-size: 11px;
    letter-spacing: 0;
  }
}

@media (max-width: 390px) {
  .top-navbar-wrapper {
    top: 8px;
  }

  .top-navbar-wrapper :deep(.glass-tabbar__label) {
    font-size: 10px;
  }
}
</style>
