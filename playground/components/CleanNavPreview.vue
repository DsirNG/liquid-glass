<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { GlassTabBar, type GlassTabBarItem } from '../../src/vue';
import type { LiquidGlassMaterialOptions } from '../../src/core';

const props = defineProps<{
  glassOptions?: LiquidGlassMaterialOptions;
}>();

const activeTab = shallowRef('home');

const navItems: GlassTabBarItem[] = [
  { value: 'home', label: 'Home' },
  { value: 'discover', label: 'Discover' },
  { value: 'saved', label: 'Saved' },
  { value: 'activity', label: 'Activity' },
  { value: 'profile', label: 'Profile' },
];

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
      v-model="activeTab"
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
      :lens-options="navOptions"
    >
      <template #item="{ item, index }">
        <span class="glass-tabbar__icon clean-nav-preview__icon" aria-hidden="true">
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
