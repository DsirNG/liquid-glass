<script setup lang="ts">
import { ref } from 'vue';
import { t } from '../locales';

const isPlaying = ref(false);
</script>

<template>
  <div class="glass-card-content">
    <div class="drag-handle-bar" />
    <div class="card-inner-header">
      <div class="card-chip">{{ t.nowPlaying }}</div>
      <div class="hifi-icon">Liquid Glass Optics</div>
    </div>

    <div class="track-info">
      <h2 class="track-title">{{ t.trackTitle }}</h2>
      <p class="track-artist">{{ t.trackArtist }}</p>
    </div>

    <div class="playback-controls">
      <button class="icon-btn" @click="isPlaying = !isPlaying">
        {{ isPlaying ? '⏸' : '▶' }}
      </button>
      <div class="progress-bar">
        <div class="progress-fill" style="width: 48%" />
      </div>
      <span class="time">02:14</span>
    </div>
  </div>
</template>

<style scoped>
.glass-card-content {
  width: 100%;
  height: 100%;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
}

.drag-handle-bar {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 38px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

.card-inner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-chip {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.hifi-icon {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.track-info {
  margin: 10px 0;
}

.track-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.track-artist {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
}

.playback-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s;
}

.icon-btn:hover {
  transform: scale(1.08);
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #fff;
}

.time {
  font-size: 11px;
  font-family: monospace;
  color: rgba(255, 255, 255, 0.6);
}
</style>
