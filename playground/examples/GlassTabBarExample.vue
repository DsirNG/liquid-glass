<script setup lang="ts">
import { ref, computed } from 'vue';
import { GlassTabBar } from '@dinqorai/liquid-glass/vue';
const active = ref('home');
const items = computed(() =>
  [
    { value: 'home', label: '首页' },
    { value: 'search', label: '探索' },
    { value: 'saved', label: '收藏' },
    { value: 'profile', label: '我的' },
  ].map((item) => ({ ...item, active: active.value === item.value }))
);
import '@dinqorai/liquid-glass/style.css';
</script>

<template>
  <div class="demo-scene">
    <div class="scene-art" aria-hidden="true"><i /><i /><i /></div>
    <div class="navigation-demo">
      <span class="page-title">{{ items.find((item) => item.active)?.label }}</span>
      <GlassTabBar
        :items="items"
        :height="70"
        :item-width="76"
        responsive
        :mobile-item-width="58"
        @click="active = $event.value"
      >
        <template #item="{ item, index }">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path v-if="index === 0" d="m3 10 9-7 9 7v10H15v-6H9v6H3Z" />
            <template v-else-if="index === 1">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </template>
            <path v-else-if="index === 2" d="M6 3h12v18l-6-4-6 4Z" />
            <template v-else>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </template>
          </svg>
          <span>{{ item.label }}</span>
        </template>
      </GlassTabBar>
    </div>
  </div>
</template>

<style scoped>
.demo-scene {
  position: relative;
  display: grid;
  place-items: center;
  gap: 28px;
  min-height: 400px;
  padding: 48px 28px;
  box-sizing: border-box;
  overflow: hidden;
  color: var(--demo-ink, #fff);
  background: var(
    --demo-backdrop,
    radial-gradient(ellipse at 20% 10%, #c18543, transparent 65%),
    linear-gradient(115deg, #8a562b, #382418)
  );
  background-size: cover;
  background-position: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.demo-scene > :not(.scene-art) {
  position: relative;
}
.scene-art {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: var(--demo-art-display, none);
}
.scene-art i {
  position: absolute;
  width: 28%;
  height: 5px;
  border-radius: 999px;
  top: 70%;
  box-shadow: 0 0 10px currentColor;
}
.scene-art i:nth-child(1) {
  left: 7%;
  color: #42c7ff;
  background: currentColor;
}
.scene-art i:nth-child(2) {
  left: 36%;
  color: #ff6d9f;
  background: currentColor;
}
.scene-art i:nth-child(3) {
  left: 65%;
  color: #79e7ac;
  background: currentColor;
}
@media (max-width: 540px) {
  .demo-scene {
    padding: 36px 16px;
    min-height: 360px;
  }
}

.navigation-demo {
  display: grid;
  gap: 90px;
  justify-items: center;
}
.page-title {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.03em;
}
svg {
  width: 23px;
  height: 23px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.navigation-demo :deep(.glass-tabbar__item) {
  font-size: 11px;
}
</style>
