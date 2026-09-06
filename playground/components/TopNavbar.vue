<script setup lang="ts">
import { LiquidGlass } from '../../src/vue';
import { t, currentLocale, setLocale } from '../locales';

defineProps<{
  isPanelOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:isPanelOpen', open: boolean): void;
}>();
</script>

<template>
  <header class="top-navbar-wrapper">
    <LiquidGlass
      :options="{
        blur: 14.0,
        opacity: 0.08,
        radius: 26,
        bezel: 24,
        specular: 0.6,
        tint: '#ffffff',
        shadow: 0.35,
      }"
    >
      <div class="top-navbar-content">
        <div class="logo">
          <span class="logo-dot" />
          <span class="logo-text">{{ t.labTitle }}</span>
          <span class="badge">LiquidGlass Native</span>
        </div>

        <!-- Bilingual Switcher -->
        <div class="lang-switch-group">
          <template v-for="loc in ['zh', 'en'] as const" :key="loc">
            <LiquidGlass
              v-if="currentLocale === loc"
              :options="{
                blur: 5,
                opacity: 0.22,
                radius: 14,
                bezel: 8,
                specular: 0.85,
                tint: '#ffffff',
                shadow: 0.15,
              }"
              class="glass-tab-pill"
            >
              <button class="lang-btn active" @click="setLocale(loc)">
                {{ loc === 'zh' ? '中文' : 'EN' }}
              </button>
            </LiquidGlass>
            <button v-else class="lang-btn" @click="setLocale(loc)">
              {{ loc === 'zh' ? '中文' : 'EN' }}
            </button>
          </template>
        </div>

        <LiquidGlass
          :options="{
            blur: 8,
            opacity: isPanelOpen ? 0.22 : 0.1,
            radius: 18,
            bezel: 12,
            specular: isPanelOpen ? 0.85 : 0.5,
            tint: isPanelOpen ? '#a594fd' : '#ffffff',
            shadow: 0.2,
          }"
          class="toggle-glass-wrapper"
        >
          <button class="toggle-ctrl-btn" @click="emit('update:isPanelOpen', !isPanelOpen)">
            {{ isPanelOpen ? t.hideControls : t.showControls }}
          </button>
        </LiquidGlass>
      </div>
    </LiquidGlass>
  </header>
</template>

<style scoped>
.top-navbar-wrapper {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.top-navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 10px 24px;
  min-width: 800px;
  white-space: nowrap;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  white-space: nowrap;
}

.logo-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #a594fd;
  box-shadow: 0 0 10px #a594fd;
  flex-shrink: 0;
}

.logo-text {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.badge {
  font-size: 10px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.16);
  padding: 2px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  flex-shrink: 0;
}

.nav-actions {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.28);
  border-radius: 30px;
  padding: 3px;
  gap: 2px;
  flex-shrink: 0;
  white-space: nowrap;
}

.glass-tab-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

.engine-tab {
  padding: 6px 14px;
  border-radius: 18px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s ease;
  line-height: 1.2;
}

.engine-tab:hover:not(.active) {
  color: rgba(255, 255, 255, 0.95);
}

.engine-tab.active {
  background: transparent;
  color: #fff;
  font-weight: 600;
  box-shadow: none;
}

.lang-switch-group {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.32);
  border-radius: 20px;
  padding: 3px;
  gap: 2px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.lang-btn {
  padding: 4px 10px;
  border-radius: 14px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1.2;
}

.lang-btn:hover:not(.active) {
  color: rgba(255, 255, 255, 0.9);
}

.lang-btn.active {
  background: transparent;
  color: #fff;
  font-weight: 700;
  box-shadow: none;
}

.toggle-glass-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.toggle-glass-wrapper:hover {
  transform: translateY(-1px);
}

.toggle-glass-wrapper:active {
  transform: translateY(0) scale(0.98);
}

.toggle-ctrl-btn {
  padding: 7px 16px;
  border-radius: 18px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 0.2s ease;
  line-height: 1.2;
}
</style>
