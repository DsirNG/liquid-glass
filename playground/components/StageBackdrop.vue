<script setup lang="ts">
// Pure presentation component representing the native DOM typography refracted by Liquid Glass
</script>

<template>
  <div class="stage-backdrop-dom">
    <span class="backdrop-label">NEXT-GEN OPTICS</span>
    <h1 class="backdrop-title">Liquid Glass</h1>
    <p class="backdrop-subtitle">Native Real-Time DOM Backdrop Refraction</p>
  </div>
</template>

<style scoped>
.stage-backdrop-dom {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  pointer-events: none;
  user-select: none;
  z-index: 1;
  white-space: nowrap;
}

.backdrop-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(167, 139, 250, 0.85);
  margin-bottom: 8px;
}

.backdrop-title {
  font-size: clamp(60px, 8.5vw, 116px);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.96) 20%,
    rgba(165, 148, 253, 0.75) 60%,
    rgba(56, 189, 248, 0.55) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.backdrop-subtitle {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 14px;
}
</style>
