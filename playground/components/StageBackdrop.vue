<script setup lang="ts">
defineProps<{
  isLight?: boolean;
  calibrationMode?: boolean;
}>();
</script>

<template>
  <div
    class="stage-backdrop-dom"
    :class="{ 'is-light': isLight, 'is-calibration': calibrationMode }"
  >
    <!-- 1. Optical Calibration Chart Mode (High Frequency Spatial Patterns) -->
    <div v-if="calibrationMode" class="calibration-chart">
      <!-- Orthogonal Grid & Checkerboard Background -->
      <div class="chart-grid-layer" />

      <!-- Concentric Rings & Crosshair Target -->
      <div class="chart-center-target">
        <div class="ring ring-1" />
        <div class="ring ring-2" />
        <div class="ring ring-3" />
        <div class="crosshair-h" />
        <div class="crosshair-v" />
      </div>

      <!-- Fine Typography Test Samples -->
      <div class="chart-text-matrix">
        <div class="text-col">
          <p class="chart-label">FINE TEXT (8PX - HIGH FREQUENCY)</p>
          <p class="sample-8px">
            The quick brown fox jumps over the lazy dog. 0123456789.
            Liquid Glass optical deflection preserves body legibility while refracting edges.
          </p>
          <p class="chart-label">MEDIUM TEXT (11PX - UI LABEL)</p>
          <p class="sample-11px">
            Apple Liquid Glass iOS 26 Material Engine • Snell Law Raytracing • SDF Bezel Profiling
          </p>
          <p class="chart-label">BOLD GEOMETRIC (16PX - INTERFACE DISPLAY)</p>
          <p class="sample-16px">
            PARALLEL REFRACTION GRID • ZERO TEARING
          </p>
        </div>
        <div class="text-col">
          <p class="chart-label">HIGH CONTRAST CHROMATIC BARS</p>
          <div class="color-bars">
            <span style="background: #ef4444;" title="Red" />
            <span style="background: #22c55e;" title="Green" />
            <span style="background: #3b82f6;" title="Blue" />
            <span style="background: #eab308;" title="Yellow" />
            <span style="background: #a855f7;" title="Purple" />
            <span style="background: #06b6d4;" title="Cyan" />
            <span style="background: #ffffff;" title="White" />
            <span style="background: #000000;" title="Black" />
          </div>
          <p class="chart-label">MONOSPACE LINEAR RULER</p>
          <p class="sample-mono">
            |...+....|...+....|...+....|...+....|...+....|
            00  10   20  30   40  50   60  70   80  90  100
          </p>
        </div>
      </div>
    </div>

    <!-- 2. Standard Minimalist Typography Mode -->
    <div v-else class="typography-mode">
      <span class="backdrop-label">NEXT-GEN OPTICS</span>
      <h1 class="backdrop-title">Liquid Glass</h1>
      <p class="backdrop-subtitle">Native Real-Time DOM Backdrop Refraction</p>
    </div>
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
  pointer-events: none;
  user-select: none;
  z-index: 1;
}

.typography-mode {
  text-align: center;
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

/* Optical Calibration Chart Styles */
.calibration-chart {
  position: relative;
  width: min(92vw, 840px);
  height: 480px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background-color: rgba(11, 13, 20, 0.85);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  box-sizing: border-box;
}

.chart-grid-layer {
  position: absolute;
  inset: 0;
  background-size: 20px 20px, 20px 20px, 100px 100px, 100px 100px;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.07) 1px, transparent 1px),
    linear-gradient(to right, rgba(255, 255, 255, 0.2) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
  pointer-events: none;
}

.chart-center-target {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 240px;
  height: 240px;
  pointer-events: none;
}

.ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.25);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.ring-1 { width: 60px; height: 60px; border-color: rgba(56, 189, 248, 0.5); }
.ring-2 { width: 140px; height: 140px; border-color: rgba(168, 85, 247, 0.4); }
.ring-3 { width: 220px; height: 220px; border-color: rgba(255, 255, 255, 0.25); }

.crosshair-h {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: rgba(56, 189, 248, 0.4);
}
.crosshair-v {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: rgba(56, 189, 248, 0.4);
}

.chart-text-matrix {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  width: 100%;
}

.text-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chart-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #38bdf8;
  margin: 0;
}

.sample-8px {
  font-size: 8px;
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.sample-11px {
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  color: #fff;
  margin: 0;
}

.sample-16px {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #f8fafc;
  margin: 0;
}

.sample-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  color: #a5f3fc;
  white-space: pre;
  margin: 0;
}

.color-bars {
  display: flex;
  height: 22px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.color-bars span {
  flex: 1;
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

.stage-backdrop-dom.is-light .calibration-chart {
  background-color: rgba(248, 250, 252, 0.88);
  border-color: rgba(0, 0, 0, 0.15);
}
.stage-backdrop-dom.is-light .chart-grid-layer {
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
    linear-gradient(to right, rgba(0, 0, 0, 0.22) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.22) 1px, transparent 1px);
}
.stage-backdrop-dom.is-light .sample-8px,
.stage-backdrop-dom.is-light .sample-11px,
.stage-backdrop-dom.is-light .sample-16px {
  color: #0f172a;
}
.stage-backdrop-dom.is-light .sample-mono {
  color: #0369a1;
}
</style>
