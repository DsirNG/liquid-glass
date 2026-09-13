<script setup lang="ts">
import { computed, ref, useAttrs, watch } from 'vue';
import type { LiquidGlassMaterialOptions, LiquidGlassUpdateOptions } from '../../../types';
import LiquidGlass from '../LiquidGlass/index.vue';
import type { GlassDockEmits, GlassDockItem, GlassDockProps, GlassDockSize } from './types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<GlassDockProps>(), {
  size: 'md',
  orientation: 'horizontal',
  disabled: false,
  interactive: false,
});

const emit = defineEmits<GlassDockEmits>();
const attrs = useAttrs();

const SIZE_CONFIGS: Record<GlassDockSize, { radius: number }> = {
  sm: { radius: 16 },
  md: { radius: 20 },
  lg: { radius: 24 },
};

const MATERIAL_OPTION_KEYS: ReadonlyArray<keyof LiquidGlassMaterialOptions> = [
  'blur',
  'opacity',
  'thickness',
  'ior',
  'refraction',
  'dispersion',
  'saturation',
  'tint',
  'radius',
  'bezel',
  'specular',
  'shadow',
  'shadowColor',
  'surfaceShape',
  'surfaceProfile',
  'materialPreset',
  'quality',
  'ambientLuma',
  'shape',
  'capability',
  'debug',
  'borderMode',
  'colorBleed',
  'refractionCoverage',
];

const resolvedMaterialOptions = computed<LiquidGlassMaterialOptions>(() => {
  const resolved: LiquidGlassMaterialOptions = {
    radius: SIZE_CONFIGS[props.size].radius,
    ...props.options,
  };
  const source = props as unknown as Record<string, unknown>;
  const target = resolved as Record<string, unknown>;

  for (const key of MATERIAL_OPTION_KEYS) {
    const value = source[key];
    if (value !== undefined) target[key] = value;
  }

  return resolved;
});

const effectiveInteractive = computed(() => props.interactive && !props.disabled);
const firstEnabledIndex = computed(() => props.items.findIndex((item) => !item.disabled));
const activeIndex = computed(() => {
  const requestedIndex = props.items.findIndex(
    (item) => Object.is(item.value, props.modelValue) && !item.disabled
  );
  return requestedIndex;
});

const hoveredIndex = ref<number | null>(null);
const focusedIndex = ref<number | null>(null);
const rovingIndex = ref(-1);
const itemRefs = ref<(HTMLButtonElement | null)[]>([]);

watch(
  [activeIndex, firstEnabledIndex],
  ([index, fallbackIndex]) => {
    if (focusedIndex.value === null) rovingIndex.value = index >= 0 ? index : fallbackIndex;
  },
  { immediate: true }
);

watch(
  () => props.items,
  () => {
    if (
      hoveredIndex.value !== null &&
      (!props.items[hoveredIndex.value] || props.items[hoveredIndex.value].disabled)
    ) {
      hoveredIndex.value = null;
    }

    if (
      focusedIndex.value !== null &&
      (!props.items[focusedIndex.value] ||
        props.items[focusedIndex.value].disabled ||
        props.disabled)
    ) {
      focusedIndex.value = null;
    }

    if (!props.items[rovingIndex.value] || props.items[rovingIndex.value].disabled) {
      rovingIndex.value = activeIndex.value >= 0 ? activeIndex.value : firstEnabledIndex.value;
    }
  },
  { deep: true }
);

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      hoveredIndex.value = null;
      focusedIndex.value = null;
      return;
    }

    if (focusedIndex.value === null) {
      rovingIndex.value = activeIndex.value >= 0 ? activeIndex.value : firstEnabledIndex.value;
    }
  }
);

const liquidGlassRef = ref<InstanceType<typeof LiquidGlass> | null>(null);
const contentRef = ref<HTMLDivElement | null>(null);
const instance = computed(() => liquidGlassRef.value?.instance ?? null);

function getStatus() {
  return liquidGlassRef.value?.getStatus();
}

function update(options: LiquidGlassUpdateOptions): void {
  liquidGlassRef.value?.update(options);
}

function resize(): void {
  liquidGlassRef.value?.resize();
}

function destroy(): void {
  liquidGlassRef.value?.destroy();
}

function setItemRef(element: Element | null, index: number): void {
  itemRefs.value[index] = element as HTMLButtonElement | null;
}

function enabledIndices(): number[] {
  return props.items.reduce<number[]>((indices, item, index) => {
    if (!item.disabled && !props.disabled) indices.push(index);
    return indices;
  }, []);
}

function focusItem(index: number): void {
  const item = props.items[index];
  if (!item || item.disabled || props.disabled) return;

  rovingIndex.value = index;
  itemRefs.value[index]?.focus();
}

function moveFocus(index: number, direction: 'next' | 'previous' | 'first' | 'last'): void {
  const indices = enabledIndices();
  if (indices.length === 0) return;

  const currentPosition = Math.max(0, indices.indexOf(index));
  const nextPosition =
    direction === 'first'
      ? 0
      : direction === 'last'
        ? indices.length - 1
        : direction === 'next'
          ? (currentPosition + 1) % indices.length
          : (currentPosition - 1 + indices.length) % indices.length;

  focusItem(indices[nextPosition]);
}

function selectItem(item: GlassDockItem, index: number): void {
  if (props.disabled || item.disabled) return;
  rovingIndex.value = index;
  emit('update:modelValue', item.value);
}

function handleKeydown(index: number, event: KeyboardEvent): void {
  if (props.disabled) return;

  const isHorizontal = props.orientation === 'horizontal';
  if (
    (isHorizontal && event.key === 'ArrowRight') ||
    (!isHorizontal && event.key === 'ArrowDown')
  ) {
    event.preventDefault();
    moveFocus(index, 'next');
    return;
  }

  if ((isHorizontal && event.key === 'ArrowLeft') || (!isHorizontal && event.key === 'ArrowUp')) {
    event.preventDefault();
    moveFocus(index, 'previous');
    return;
  }

  if (event.key === 'Home') {
    event.preventDefault();
    moveFocus(index, 'first');
    return;
  }

  if (event.key === 'End') {
    event.preventDefault();
    moveFocus(index, 'last');
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    const item = props.items[index];
    if (item) selectItem(item, index);
  }
}

function handleFocus(index: number): void {
  if (props.disabled || props.items[index]?.disabled) return;
  focusedIndex.value = index;
  rovingIndex.value = index;
}

function handleBlur(index: number, event: FocusEvent): void {
  if (event.relatedTarget instanceof Node && contentRef.value?.contains(event.relatedTarget))
    return;
  if (focusedIndex.value === index) focusedIndex.value = null;
}

function handlePointerEnter(index: number): void {
  if (!effectiveInteractive.value || props.items[index]?.disabled) return;
  hoveredIndex.value = index;
}

function handlePointerMove(index: number): void {
  if (!effectiveInteractive.value || props.items[index]?.disabled) return;
  if (hoveredIndex.value !== index) hoveredIndex.value = index;
}

function handlePointerLeave(): void {
  hoveredIndex.value = null;
}

function itemScale(index: number): string {
  if (!effectiveInteractive.value || hoveredIndex.value === null) return '1';
  const distance = Math.abs(index - hoveredIndex.value);
  if (distance === 0) return '1.12';
  if (distance === 1) return '1.05';
  return '1';
}

defineExpose({ instance, getStatus, update, resize, destroy });
</script>

<template>
  <LiquidGlass
    v-bind="attrs"
    ref="liquidGlassRef"
    class="glass-dock"
    :class="[
      `glass-dock--${size}`,
      `glass-dock--${orientation}`,
      {
        'glass-dock--interactive': interactive,
        'glass-dock--disabled': disabled,
      },
    ]"
    role="toolbar"
    :aria-orientation="orientation"
    :aria-disabled="disabled ? 'true' : undefined"
    :options="resolvedMaterialOptions"
    :fallback-policy="fallbackPolicy"
    :interactive="effectiveInteractive"
  >
    <div ref="contentRef" class="glass-dock__content" @pointerleave="handlePointerLeave">
      <button
        v-for="(item, index) in items"
        :key="item.value"
        :ref="(element) => setItemRef(element as Element | null, index)"
        type="button"
        class="glass-dock__item"
        :class="{
          'is-active': activeIndex === index,
          'is-hovered': hoveredIndex === index,
          'is-focused': focusedIndex === index,
          'is-disabled': item.disabled || disabled,
        }"
        :style="{ '--glass-dock-item-scale': itemScale(index) }"
        :aria-pressed="activeIndex === index ? 'true' : 'false'"
        :aria-selected="activeIndex === index ? 'true' : 'false'"
        :aria-disabled="item.disabled || disabled ? 'true' : undefined"
        :disabled="item.disabled"
        :tabindex="disabled || rovingIndex !== index ? -1 : 0"
        @pointerenter="handlePointerEnter(index)"
        @pointermove="handlePointerMove(index)"
        @focus="handleFocus(index)"
        @blur="handleBlur(index, $event)"
        @keydown="handleKeydown(index, $event)"
        @click="selectItem(item, index)"
      >
        <slot
          name="item"
          :item="item"
          :index="index"
          :active="activeIndex === index"
          :hovered="hoveredIndex === index"
          :focused="focusedIndex === index"
          :disabled="Boolean(item.disabled || disabled)"
        >
          <span class="glass-dock__label">{{ item.label }}</span>
        </slot>
      </button>
    </div>
  </LiquidGlass>
</template>

<style>
@import '../../../styles/liquid-glass.css';

.glass-dock {
  display: inline-flex;
  width: max-content;
  max-width: 100%;
  overflow: visible;
  user-select: none;
}

.glass-dock > .lg-content {
  display: flex;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.glass-dock--horizontal > .lg-content {
  flex-direction: row;
}

.glass-dock--vertical > .lg-content {
  flex-direction: column;
}

.glass-dock__content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  box-sizing: border-box;
}

.glass-dock--vertical .glass-dock__content {
  align-items: stretch;
  min-width: 96px;
  flex-direction: column;
}

.glass-dock--sm .glass-dock__content {
  gap: 4px;
  padding: 6px;
}

.glass-dock--lg .glass-dock__content {
  gap: 10px;
  padding: 10px;
}

.glass-dock__item {
  position: relative;
  display: inline-flex;
  min-width: 56px;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border: 0;
  border-radius: 12px;
  outline: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.68);
  cursor: pointer;
  font: inherit;
  line-height: 1;
  transform: scale(var(--glass-dock-item-scale, 1));
  transform-origin: center;
  transition:
    color 160ms ease,
    opacity 160ms ease,
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.glass-dock--sm .glass-dock__item {
  min-width: 48px;
  min-height: 32px;
  padding: 0 10px;
  border-radius: 10px;
  font-size: 13px;
}

.glass-dock--lg .glass-dock__item {
  min-width: 68px;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 14px;
  font-size: 15px;
}

.glass-dock--vertical .glass-dock__item {
  justify-content: flex-start;
}

.glass-dock__item.is-active,
.glass-dock__item.is-hovered,
.glass-dock__item:focus-visible {
  color: #fff;
}

.glass-dock__item.is-focused:focus-visible {
  box-shadow: 0 0 0 2px rgb(255 255 255 / 60%);
}

.glass-dock__item.is-disabled {
  color: rgb(255 255 255 / 34%);
  cursor: not-allowed;
  opacity: 0.55;
}

.glass-dock--disabled .glass-dock__item {
  cursor: default;
}
</style>
