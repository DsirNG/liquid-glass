<script setup lang="ts">
import { ref } from 'vue';
import { LiquidGlass } from '@dinqorai/liquid-glass/vue';
const query = ref('');
const volume = ref(38);
import '@dinqorai/liquid-glass/style.css';
</script>

<template>
  <div class="demo-scene reference-scene">
    <div class="scene-art" aria-hidden="true"><i /><i /><i /></div>
    <LiquidGlass class="search-glass" :radius="999" :bezel="14" :blur="2">
      <label class="search-content"
        ><svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10" cy="10" r="7" />
          <path d="m15 15 7 7" /></svg
        ><input v-model="query" aria-label="搜索 App 资源库" placeholder="App资源库"
      /></label>
    </LiquidGlass>
    <div class="volume-row">
      <LiquidGlass class="volume-glass" :radius="999" :bezel="12" :blur="0">
        <div class="volume-fill" :style="{ height: volume + '%' }" />
        <svg class="speaker" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 9h4l6-5v16l-6-5H3Z" fill="currentColor" />
          <path
            d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <input
          v-model.number="volume"
          class="volume-input"
          type="range"
          min="0"
          max="100"
          aria-label="音量"
        />
      </LiquidGlass>
      <div class="volume-copy">
        <strong>听见，通透。</strong>
        <p>拖动音量，观察玻璃的弧面与透色。</p>
        <output>音量 {{ volume }}%</output>
      </div>
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
  top: 22%;
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

.reference-scene {
  gap: 44px;
}
.search-glass {
  width: min(100%, 560px);
  height: 72px;
}
.search-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 0 24px;
}
.search-content svg {
  width: 26px;
  height: 26px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  fill: none;
  flex-shrink: 0;
}
.search-content input {
  width: 190px;
  min-width: 0;
  border: 0;
  padding: 0;
  outline: none;
  background: transparent;
  color: inherit;
  font: 400 28px/1.2 inherit;
  font-family: inherit;
  font-size: 28px;
}
input::placeholder {
  color: inherit;
  opacity: 1;
}
.search-glass:focus-within {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}
.volume-row {
  display: flex;
  align-items: center;
  gap: 32px;
  width: min(100%, 420px);
}
.volume-glass {
  width: 72px;
  height: 220px;
  flex-shrink: 0;
  overflow: hidden;
}
.volume-fill {
  position: absolute;
  inset: auto 0 0;
  background: rgba(255, 255, 255, 0.84);
  transition: height 100ms linear;
}
.speaker {
  position: absolute;
  bottom: 20px;
  left: 22px;
  width: 28px;
  height: 28px;
  color: #6d5840;
  pointer-events: none;
}
.volume-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  cursor: ns-resize;
  writing-mode: vertical-lr;
  direction: rtl;
  opacity: 0;
}
.volume-glass:focus-within {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}
.volume-copy strong {
  font-size: 22px;
  font-weight: 500;
}
.volume-copy p {
  font-size: 12px;
  line-height: 1.8;
  opacity: 0.7;
}
output {
  font-size: 12px;
  opacity: 0.65;
}
@media (max-width: 420px) {
  .search-glass {
    height: 60px;
  }
  .search-content input {
    font-size: 24px;
    width: 160px;
  }
  .volume-row {
    gap: 22px;
  }
  .volume-copy strong {
    font-size: 19px;
  }
}
</style>
