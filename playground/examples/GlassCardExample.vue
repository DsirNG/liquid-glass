<script setup lang="ts">
import { ref } from 'vue';
import { GlassCard, GlassButton } from '@dinqorai/liquid-glass/vue';
const saved = ref(false);
import '@dinqorai/liquid-glass/style.css';
</script>

<template>
  <div class="demo-scene">
    <div class="scene-art" aria-hidden="true"><i /><i /><i /></div>
    <GlassCard class="travel-card" :radius="28" :blur="0.8">
      <template #header
        ><div class="card-top">
          <span>周末计划</span
          ><svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" />
          </svg></div
      ></template>
      <h3>去山间，慢下来。</h3>
      <p>留一点时间给风景。<br />山路、落日，和一段安静的旅途。</p>
      <template #footer
        ><div class="card-bottom">
          <span>9 月 28 日 · 周六</span
          ><GlassButton size="sm" @click="saved = !saved">{{
            saved ? '已加入 ✓' : '加入计划'
          }}</GlassButton>
        </div></template
      >
    </GlassCard>
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
  top: 48%;
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

.travel-card {
  max-width: 370px;
}
.card-top,
.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  font-size: 12px;
}
.card-top {
  opacity: 0.8;
}
h3 {
  margin: 12px 0;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.03em;
}
p {
  font-size: 14px;
  line-height: 1.8;
  opacity: 0.75;
  margin: 0 0 16px;
}
svg {
  width: 24px;
  height: 24px;
  stroke: currentColor;
  stroke-width: 1.5;
  fill: none;
}
</style>
