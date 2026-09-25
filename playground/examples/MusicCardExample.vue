<script setup lang="ts">
import { ref } from 'vue';
import { GlassCard, GlassButton } from '@dinqorai/liquid-glass/vue';
const playing = ref(false);
import '@dinqorai/liquid-glass/style.css';
</script>

<template>
  <div class="demo-scene">
    <div class="scene-art" aria-hidden="true"><i /><i /><i /></div>
    <GlassCard class="music-card" :radius="28" :blur="0.8">
      <div class="album" aria-hidden="true">
        <span>AFTER<br />HOURS</span><i />
      </div>
      <div class="track">
        <div>
          <strong>Golden Hour</strong>
          <p>Sunday Sessions</p>
        </div>
        <span>♡</span>
      </div>
      <label class="progress"
        ><span class="sr-only">播放进度</span><input type="range" min="0" max="100" value="32"
      /></label>
      <div class="times"><span>1:24</span><span>−2:58</span></div>
      <div class="transport">
        <button aria-label="上一首">◀◀</button
        ><GlassButton :aria-label="playing ? '暂停' : '播放'" @click="playing = !playing">{{
          playing ? 'Ⅱ' : '▶'
        }}</GlassButton
        ><button aria-label="下一首">▶▶</button>
      </div>
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

.music-card {
  max-width: 310px;
}
.album {
  height: 170px;
  overflow: hidden;
  border-radius: 12px;
  background: linear-gradient(145deg, #f7ac76, #aa3655 55%, #392848);
  position: relative;
  padding: 16px;
  box-sizing: border-box;
  color: #fff5da;
  font:
    600 28px/1.05 Georgia,
    serif;
  letter-spacing: -0.05em;
}
.album i {
  position: absolute;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: #eebb66;
  right: -22px;
  bottom: -70px;
}
.track {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
}
.track strong {
  font-size: 17px;
  font-weight: 600;
}
.track p {
  margin: 5px 0 12px;
  font-size: 12px;
  opacity: 0.6;
}
.progress input {
  width: 100%;
  height: 3px;
  accent-color: currentColor;
  display: block;
  margin: 0;
}
.times {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  opacity: 0.55;
  margin-top: 8px;
}
.transport {
  display: flex;
  justify-content: center;
  gap: 24px;
  align-items: center;
  margin-top: 20px;
}
.transport button {
  color: inherit;
}
.transport > button:not(.lg-root) {
  border: 0;
  background: transparent;
  cursor: pointer;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
