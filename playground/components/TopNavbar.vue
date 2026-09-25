<script setup lang="ts">
import { computed } from 'vue';
import { GlassTabBar, type GlassTabBarItem } from '@dinqorai/liquid-glass/vue';
import type { LiquidGlassMaterialOptions } from '@dinqorai/liquid-glass';
import { t } from '../locales';

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

const navItems = computed<GlassTabBarItem[]>(() => [
  { value: 'home', label: '首页', active: props.modelValue === 'home' },
  { value: 'library', label: '组件库', active: props.modelValue === 'library' },
]);

const navOptions = computed<LiquidGlassMaterialOptions>(() => ({
  blur: 0.8,
  opacity: 0.025,
  specular: 0.75,
  shadow: 0.25,
  refraction: 0.5,
  refractionCoverage: 'full',
  shape: 'roundedRect',
  debug: 'none',
}));

const activeView = computed(() => props.modelValue);

function togglePanel(): void {
  emit('update:isPanelOpen', !props.isPanelOpen);
}
</script>

<template>
  <header class="top-navbar-wrapper">
    <GlassTabBar
      :items="navItems"
      :height="76"
      :item-width="88"
      :radius="999"
      :lens-inset="7"
      responsive
      :mobile-height="56"
      :mobile-item-width="52"
      :tablet-height="68"
      :tablet-item-width="70"
      :base-options="navOptions"
      @click="emit('update:modelValue', $event.value as PlaygroundView)"
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
              class="is-filled"
              d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 19.5v-9Z"
            />
          </svg>
          <svg v-else-if="index === 1" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5M11 7v8M7 11h8" />
          </svg>
          <svg v-else-if="index === 2" viewBox="0 0 24 24">
            <path
              class="is-filled"
              d="M12 20.5 4.8 13.3a4.8 4.8 0 0 1 6.8-6.8L12 7l.4-.5a4.8 4.8 0 0 1 6.8 6.8L12 20.5Z"
            />
          </svg>
          <svg v-else-if="index === 3" viewBox="0 0 24 24">
            <path d="M4 18.5V13M10 18.5V8M16 18.5V4M22 18.5V10" />
          </svg>
          <svg v-else viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20a7 7 0 0 1 14 0" />
          </svg>
        </span>
        <span class="glass-tabbar__label">{{ item.label }}</span>
      </template>
    </GlassTabBar>
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
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
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
.top-navbar-tab-icon .is-filled {
  fill: currentColor;
  stroke: none;
}
</style>
