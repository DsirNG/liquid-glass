<script setup lang="ts">
defineProps<{
  isLight?: boolean;
}>();
</script>

<template>
  <div class="stage-backdrop-dom" :class="{ 'is-light': isLight }">
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
  transition: color 0.3s;
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
  transition: all 0.3s;
}

.backdrop-subtitle {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 14px;
  transition: color 0.3s;
}

/* Light Background Adaptation */
.stage-backdrop-dom.is-light .backdrop-label {
  color: #6366f1;
}

.stage-backdrop-dom.is-light .backdrop-title {
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.95) 20%,
    rgba(79, 70, 229, 0.85) 60%,
    rgba(14, 165, 233, 0.75) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stage-backdrop-dom.is-light .backdrop-subtitle {
  color: rgba(30, 41, 59, 0.75);
}
</style>
