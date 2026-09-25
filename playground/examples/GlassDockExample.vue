<script setup lang="ts">
import { ref } from 'vue';
import { GlassDock } from '@dinqorai/liquid-glass/vue';
const active = ref<string | number>('music');
const items = [
  { value: 'phone', label: '电话' },
  { value: 'mail', label: '邮件' },
  { value: 'browser', label: '浏览器' },
  { value: 'music', label: '音乐' },
];
import '@dinqorai/liquid-glass/style.css';
</script>

<template>
  <div class="demo-scene">
    <div class="scene-art" aria-hidden="true"><i /><i /><i /></div>
    <div class="dock-demo">
      <span class="dock-title">随手可达。</span>
      <GlassDock v-model="active" :items="items" :radius="30" aria-label="应用程序">
        <template #item="{ item, active: selected }"
          ><span class="app-icon" :class="String(item.value)">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                v-if="item.value === 'phone'"
                d="m7 3 3 5-3 3a15 15 0 0 0 6 6l3-3 5 3-2 4C10 23 1 14 3 5Z"
              />
              <template v-else-if="item.value === 'mail'">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 6 9 7 9-7" />
              </template>
              <template v-else-if="item.value === 'browser'">
                <circle cx="12" cy="12" r="9" />
                <path d="m16 8-2 6-6 2 2-6Z" />
              </template>
              <template v-else>
                <path d="M9 17V5l11-2v12M9 8l11-2" />
                <ellipse cx="6" cy="18" rx="3" ry="2" />
                <ellipse cx="17" cy="16" rx="3" ry="2" />
              </template></svg></span
          ><span class="app-name">{{ item.label }}</span
          ><i class="active-dot" :class="{ selected }"
        /></template>
      </GlassDock>
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
  width: 100px;
  height: 100px;
  border-radius: 24px;
  top: 62%;
  box-shadow: inset 0 1px 2px #ffffff80;
}
.scene-art i:nth-child(1) {
  left: 12%;
  background: linear-gradient(#48c9ff, #0080ef);
}
.scene-art i:nth-child(2) {
  left: 39%;
  background: linear-gradient(#ff758f, #dd154b);
}
.scene-art i:nth-child(3) {
  left: 68%;
  background: linear-gradient(#85f387, #0cac55);
}
@media (max-width: 540px) {
  .demo-scene {
    padding: 36px 16px;
    min-height: 360px;
  }
}

.dock-demo {
  display: grid;
  gap: 76px;
  justify-items: center;
}
.dock-title {
  font-size: 30px;
  font-weight: 600;
}
.app-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: white;
  box-shadow:
    inset 0 1px 1px #ffffff80,
    0 2px 4px #0002;
}
.phone {
  background: linear-gradient(#62e576, #12b835);
}
.mail {
  background: linear-gradient(#49b9ff, #0876eb);
}
.browser {
  background: linear-gradient(#fff, #ddefff);
  color: #1586dd;
}
.music {
  background: linear-gradient(#ff6d88, #ec2451);
}
svg {
  width: 25px;
  height: 25px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.app-name {
  font-size: 10px;
}
.active-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0;
}
.active-dot.selected {
  opacity: 0.9;
}
.dock-demo :deep(.glass-dock__item) {
  flex-direction: column;
  gap: 5px;
  padding: 8px 10px 3px;
}
@media (max-width: 420px) {
  .dock-demo :deep(.glass-dock__content) {
    gap: 2px;
  }
  .dock-demo :deep(.glass-dock__item) {
    min-width: 48px;
    padding-inline: 5px;
  }
}
</style>
