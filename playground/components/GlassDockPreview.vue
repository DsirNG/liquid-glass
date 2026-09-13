<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import {
  GlassDock,
  type GlassDockItem,
  type GlassDockItemValue,
  type GlassDockOrientation,
  type GlassDockSize,
} from '@dinqorai/liquid-glass/vue';
import type { LiquidGlassMaterialOptions } from '@dinqorai/liquid-glass';

const props = defineProps<{
  glassOptions?: LiquidGlassMaterialOptions;
}>();

type DockValue = 'home' | 'search' | 'settings' | 'profile';

const activeDock = shallowRef<DockValue>('home');
const orientation = shallowRef<GlassDockOrientation>('horizontal');
const selectedSize = shallowRef<GlassDockSize>('md');
const lastAction = shallowRef('Click an item or use Arrow keys');

const dockItems = computed<GlassDockItem[]>(() => [
  { value: 'home', label: 'Home' },
  { value: 'search', label: 'Search' },
  { value: 'settings', label: 'Settings', disabled: true },
  { value: 'profile', label: 'Profile' },
]);

const enabledItems = computed(() => dockItems.value.filter((item) => !item.disabled));
const activeLabel = computed(
  () => dockItems.value.find((item) => item.value === activeDock.value)?.label ?? 'None'
);

function handleDockUpdate(value: GlassDockItemValue): void {
  if (typeof value !== 'string') return;
  activeDock.value = value as DockValue;
  lastAction.value = `${activeLabel.value} selected`;
}

function selectFromParent(value: DockValue): void {
  activeDock.value = value;
  lastAction.value = `Parent selected ${dockItems.value.find((item) => item.value === value)?.label}`;
}

function iconFor(value: GlassDockItemValue): string {
  switch (value) {
    case 'home':
      return '⌂';
    case 'search':
      return '⌕';
    case 'settings':
      return '⚙';
    case 'profile':
      return '◉';
    default:
      return '•';
  }
}
</script>

<template>
  <section class="dock-preview" aria-labelledby="glass-dock-preview-title">
    <div class="dock-preview__heading">
      <div>
        <span class="dock-preview__kicker">VUE COMPONENT</span>
        <h2 id="glass-dock-preview-title">GlassDock</h2>
      </div>
      <span class="dock-preview__status" aria-live="polite">{{ lastAction }}</span>
    </div>

    <div class="dock-preview__controls" aria-label="GlassDock preview controls">
      <div class="dock-preview__control-group" role="group" aria-label="Orientation">
        <span class="dock-preview__control-label">ORIENTATION</span>
        <button
          v-for="axis in ['horizontal', 'vertical'] as GlassDockOrientation[]"
          :key="axis"
          class="dock-preview__control-button"
          :class="{ active: orientation === axis }"
          type="button"
          :aria-pressed="orientation === axis"
          @click="orientation = axis"
        >
          {{ axis }}
        </button>
      </div>

      <div class="dock-preview__control-group" role="group" aria-label="Size">
        <span class="dock-preview__control-label">SIZE</span>
        <button
          v-for="size in ['sm', 'md', 'lg'] as GlassDockSize[]"
          :key="size"
          class="dock-preview__control-button"
          :class="{ active: selectedSize === size }"
          type="button"
          :aria-pressed="selectedSize === size"
          @click="selectedSize = size"
        >
          {{ size }}
        </button>
      </div>
    </div>

    <div class="dock-preview__stage">
      <GlassDock
        v-model="activeDock"
        :items="dockItems"
        :orientation="orientation"
        :size="selectedSize"
        :options="props.glassOptions"
        material-preset="pure"
        fallback-policy="auto"
        interactive
        aria-label="GlassDock consumer preview"
        class="dock-preview__dock"
        @update:model-value="handleDockUpdate"
      >
        <template #item="{ item, active, hovered, focused, disabled }">
          <span class="dock-preview__item" :class="{ active, hovered, focused, disabled }">
            <span class="dock-preview__icon" aria-hidden="true">{{ iconFor(item.value) }}</span>
            <span class="dock-preview__item-label">{{ item.label }}</span>
          </span>
        </template>
      </GlassDock>
    </div>

    <div class="dock-preview__state-panel">
      <div>
        <span class="dock-preview__state-label">ACTIVE ITEM</span>
        <strong>{{ activeLabel }}</strong>
      </div>
      <div>
        <span class="dock-preview__state-label">DISABLED ITEM</span>
        <strong>Settings · skipped</strong>
      </div>
    </div>

    <div
      class="dock-preview__parent-controls"
      role="group"
      aria-label="Parent controlled selection"
    >
      <span class="dock-preview__control-label">PARENT MODEL VALUE</span>
      <button
        v-for="item in enabledItems"
        :key="item.value"
        class="dock-preview__parent-button"
        type="button"
        :class="{ active: activeDock === item.value }"
        @click="selectFromParent(item.value as DockValue)"
      >
        {{ item.label }}
      </button>
    </div>

    <p class="dock-preview__note">
      GlassDock uses one LiquidGlass instance for the dock surface. Hover stays transient, while the
      selected item remains controlled by v-model and the disabled Settings item is skipped.
    </p>
  </section>
</template>

<style scoped>
.dock-preview {
  width: min(820px, 100%);
}

.dock-preview__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.dock-preview__kicker,
.dock-preview__control-label,
.dock-preview__state-label {
  color: rgba(255, 255, 255, 0.48);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.dock-preview h2 {
  margin: 4px 0 0;
  color: #fff;
  font-size: 20px;
}

.dock-preview__status,
.dock-preview__note {
  color: rgba(255, 255, 255, 0.58);
  font-size: 11px;
}

.dock-preview__controls,
.dock-preview__parent-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.dock-preview__controls {
  justify-content: space-between;
  margin-bottom: 16px;
}

.dock-preview__control-group {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.dock-preview__control-label {
  margin-right: 3px;
  font-size: 9px;
}

.dock-preview__control-button,
.dock-preview__parent-button {
  padding: 6px 9px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.58);
  font: inherit;
  font-size: 10px;
  cursor: pointer;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
}

.dock-preview__control-button:hover,
.dock-preview__parent-button:hover,
.dock-preview__control-button.active,
.dock-preview__parent-button.active {
  border-color: rgba(125, 211, 252, 0.48);
  background: rgba(125, 211, 252, 0.16);
  color: #fff;
}

.dock-preview__stage {
  display: flex;
  min-height: 212px;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 22px;
  background:
    radial-gradient(circle at 50% 25%, rgba(125, 211, 252, 0.15), transparent 42%),
    rgba(255, 255, 255, 0.035);
  overflow: auto;
}

.dock-preview__dock {
  max-width: 100%;
}

.dock-preview__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 100%;
}

.dock-preview__icon {
  display: inline-grid;
  width: 20px;
  height: 20px;
  place-items: center;
  color: #7dd3fc;
  font-size: 18px;
  line-height: 1;
}

.dock-preview__item-label {
  font-size: 11px;
  white-space: nowrap;
}

.dock-preview__item.disabled {
  opacity: 0.55;
}

.dock-preview__state-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.dock-preview__state-panel > div {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 11px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.045);
}

.dock-preview__state-panel strong {
  color: rgba(255, 255, 255, 0.86);
  font-size: 12px;
  font-weight: 600;
}

.dock-preview__parent-controls {
  margin-top: 14px;
}

.dock-preview__parent-button {
  padding-block: 5px;
}

.dock-preview__note {
  margin: 16px 0 0;
  line-height: 1.5;
}

@media (max-width: 650px) {
  .dock-preview__heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .dock-preview__controls {
    align-items: flex-start;
    flex-direction: column;
  }

  .dock-preview__stage {
    min-height: 240px;
    padding: 14px;
  }

  .dock-preview__state-panel {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
