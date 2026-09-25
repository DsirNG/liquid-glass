<script setup lang="ts">
import { ref } from 'vue';
import { GlassButton } from '@dinqorai/liquid-glass/vue';
const action = ref('选择一个操作');
import '@dinqorai/liquid-glass/style.css';
</script>

<template>
  <div class="demo-scene">
    <div class="scene-art" aria-hidden="true"><i /><i /><i /></div>
    <div class="button-stack">
      <div class="button-row">
        <GlassButton @click="action = '已收藏'">收藏</GlassButton>
        <GlassButton variant="primary" @click="action = '已继续'">继续</GlassButton>
        <GlassButton variant="ghost" @click="action = '已取消'">取消</GlassButton>
        <GlassButton variant="danger" @click="action = '已移除'">移除</GlassButton>
      </div>
      <div class="button-row">
        <GlassButton size="sm">Small</GlassButton><GlassButton size="md">Medium</GlassButton
        ><GlassButton size="lg">Large</GlassButton><GlassButton disabled>Disabled</GlassButton>
      </div>
      <p aria-live="polite">{{ action }}</p>
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
  display: var(--demo-art-display, block);
}
.scene-art i {
  position: absolute;
  width: 26%;
  height: 4px;
  border-radius: 999px;
  top: 34%;
  box-shadow: 0 0 12px currentColor;
}
.scene-art i:nth-child(1) {
  left: 8%;
  color: #5bd2ff;
  background: currentColor;
}
.scene-art i:nth-child(2) {
  left: 37%;
  color: #ff94b1;
  background: currentColor;
}
.scene-art i:nth-child(3) {
  left: 66%;
  color: #9ceeb2;
  background: currentColor;
}
@media (max-width: 540px) {
  .demo-scene {
    padding: 36px 16px;
    min-height: 360px;
  }
}

.button-stack {
  display: grid;
  gap: 32px;
  text-align: center;
}
.button-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
p {
  font-size: 13px;
  opacity: 0.65;
  margin: 0;
}
</style>
