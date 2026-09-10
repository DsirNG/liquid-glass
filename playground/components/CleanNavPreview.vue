<script setup lang="ts">
import { computed, h, shallowRef } from 'vue';
import { GlassTabBar, type GlassTabBarItem } from '../../src/vue';
import type { LiquidGlassMaterialOptions } from '../../src/core';

const props = defineProps<{
  glassOptions?: LiquidGlassMaterialOptions;
}>();

const activeTab = shallowRef('home');

const HomeIcon = {
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor' }, [
    h('path', { d: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z', 'stroke-width': '1.8', 'stroke-linejoin': 'round' }),
  ]),
};
const ActiveHomeIcon = {
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
    h('path', { d: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z' }),
  ]),
};
const HeartIcon = {
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
    h('path', { d: 'M12 21 4.6 13.6A5 5 0 0 1 11.7 6.5L12 6.8l.3-.3a5 5 0 0 1 7.1 7.1Z' }),
  ]),
};

const navItems = computed<GlassTabBarItem[]>(() => [
  {
    value: 'home',
    label: '双图标',
    icon: HomeIcon,
    activeIcon: ActiveHomeIcon,
    active: activeTab.value === 'home',
  },
  {
    value: 'favorite',
    label: '仅激活图标',
    activeIcon: HeartIcon,
    active: activeTab.value === 'favorite',
  },
  { value: 'about', label: '纯文字', active: activeTab.value === 'about' },
]);

const navOptions = computed<LiquidGlassMaterialOptions>(() => ({
  ...(props.glassOptions ?? {}),
  shape: 'roundedRect',
}));
</script>

<template>
  <section class="clean-nav-preview" aria-label="Pure LiquidGlass navigation preview">
    <div class="clean-nav-preview__caption">
      <span class="clean-nav-preview__eyebrow">PURE NAV</span>
      <span class="clean-nav-preview__hint">LiquidGlass base + hover lens</span>
    </div>

    <GlassTabBar
      :items="navItems"
      :height="76"
      :item-width="104"
      :radius="999"
      :lens-inset="7"
      responsive
      :mobile-height="64"
      :mobile-item-width="100"
      :tablet-height="68"
      :tablet-item-width="70"
      :base-options="navOptions"
      :lens-options="navOptions"
      @click="activeTab = $event.value"
    />
  </section>
</template>

<style scoped>
.clean-nav-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 720px;
}

.clean-nav-preview__caption {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  max-width: 100%;
  color: rgba(255, 255, 255, 0.56);
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
}

.clean-nav-preview__eyebrow {
  color: rgba(255, 255, 255, 0.74);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.clean-nav-preview__hint {
  opacity: 0.72;
}

.clean-nav-preview__icon {
  color: currentColor;
}

.clean-nav-preview__icon svg {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.clean-nav-preview__icon svg .is-filled {
  fill: currentColor;
  stroke: none;
}

@media (max-width: 767px) {
  .clean-nav-preview {
    gap: 6px;
  }

  .clean-nav-preview__caption {
    gap: 7px;
    font-size: 9px;
  }

  .clean-nav-preview__eyebrow {
    font-size: 9px;
  }

  .clean-nav-preview__icon svg {
    width: 18px;
    height: 18px;
  }
}
</style>
