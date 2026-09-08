<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { LiquidGlassCreateOptions } from '../../../types';
import { useLiquidGlass } from '../../composables/useLiquidGlass';
import type { GlassTabBarEmits, GlassTabBarProps } from './types';

const props = withDefaults(defineProps<GlassTabBarProps>(), {
  modelValue: '',
  height: 94,
  itemWidth: 116,
});

const emit = defineEmits<GlassTabBarEmits>();

const navRef = ref<HTMLElement | null>(null);
const lensRef = ref<HTMLElement | null>(null);
const itemRefs = ref<(HTMLElement | null)[]>([]);

const selectedIndex = ref(0);
const hoverIndex = ref<number | null>(null);
const isHovering = computed(() => hoverIndex.value !== null);
const targetIndex = computed(() => hoverIndex.value ?? selectedIndex.value);

function syncSelectedIndex(): void {
  const index = props.items.findIndex((item) => item.value === props.modelValue);
  if (index >= 0) selectedIndex.value = index;
}

watch(() => props.modelValue, syncSelectedIndex, { immediate: true });
watch(
  () => props.items.map((item) => item.value),
  () => {
    if (selectedIndex.value >= props.items.length) selectedIndex.value = 0;
    syncSelectedIndex();
    void nextTick(() => setLensTarget(targetIndex.value));
  }
);

const TABBAR_PAD = 8;

const selectedLensHeight = computed(() => {
  if (props.lensInset !== undefined) {
    return Math.max(20, Math.round(props.height - props.lensInset * 2));
  }
  if (props.itemHeight !== undefined) return Math.max(20, props.itemHeight);
  return Math.max(20, Math.round(props.height - 12));
});

const autoInset = computed(() =>
  Math.max(0, Math.round((props.height - selectedLensHeight.value) / 2))
);

const baseRadius = computed(() => {
  if (props.radius !== undefined) return props.radius;
  if (props.baseOptions?.radius !== undefined) return props.baseOptions.radius;
  return Math.round(props.height / 2);
});

const selectedLensRadius = computed(() => {
  if (props.radius !== undefined) return props.radius;
  if (props.lensOptions?.radius !== undefined) return props.lensOptions.radius;
  return Math.round(selectedLensHeight.value / 2);
});

const hoverLensHeight = computed(() => {
  if (props.lensHeight !== undefined) return Math.max(20, props.lensHeight);
  return Math.round(props.height + 10);
});

const hoverLensWidth = computed(() => {
  if (props.lensWidth !== undefined) return Math.max(20, props.lensWidth);
  return Math.round(props.itemWidth * (150 / 116));
});

const hoverLensRadius = computed(() => {
  if (props.radius !== undefined) return props.radius;
  if (props.lensOptions?.radius !== undefined) return props.lensOptions.radius;
  return Math.round(hoverLensHeight.value / 2);
});

const tabbarPad = computed(() => {
  if (props.lensInset !== undefined) return props.lensInset;
  const minClearance = Math.max(autoInset.value, baseRadius.value - selectedLensRadius.value);
  return Math.round(Math.max(TABBAR_PAD, minClearance));
});

const selectedLensWidth = computed(() =>
  Math.max(20, Math.round(props.itemWidth + (TABBAR_PAD - autoInset.value) * 2))
);

const rootStyle = computed(() => ({
  '--tabbar-height': `${props.height}px`,
  '--tabbar-pad': `${tabbarPad.value}px`,
  '--tabbar-radius': `${baseRadius.value}px`,
  '--item-width': `${props.itemWidth}px`,
  '--lens-selected-width': `${selectedLensWidth.value}px`,
  '--lens-selected-height': `${selectedLensHeight.value}px`,
  '--lens-selected-radius': `${selectedLensRadius.value}px`,
  '--lens-hover-width': `${hoverLensWidth.value}px`,
  '--lens-hover-height': `${hoverLensHeight.value}px`,
  '--lens-hover-radius': `${hoverLensRadius.value}px`,
}));

const baseCreateOptions = computed<LiquidGlassCreateOptions>(() => ({
  radius: baseRadius.value,
  thickness: 30,
  bezel: 14,
  blur: 3,
  opacity: 0.08,
  refraction: 0.28,
  dispersion: 0.02,
  saturation: 1.08,
  specular: 0.58,
  shadow: 0.14,
  tint: '#ffffff',
  interactive: false,
  ...props.baseOptions,
}));

const selectedLensOptions = computed<LiquidGlassCreateOptions>(() => {
  const radius = selectedLensRadius.value;
  return {
    radius,
    bezel: Math.min(16, Math.max(2, radius - 2)),
    thickness: 38,
    blur: 2.2,
    opacity: 0.1,
    refraction: 0.85,
    saturation: 1.12,
    specular: 0.68,
    tint: '#ffffff',
    shadow: 0.12,
    interactive: false,
  };
});

const hoverLensOptions = computed<LiquidGlassCreateOptions>(() => ({
  radius: hoverLensRadius.value,
  bezel: 16,
  thickness: 38,
  blur: 1.2,
  opacity: 0.06,
  refraction: 0.92,
  saturation: 1.18,
  specular: 0.86,
  tint: '#ffffff',
  shadow: 0.18,
  interactive: false,
}));

const lensOptions = computed<LiquidGlassCreateOptions>(() => ({
  ...(isHovering.value ? hoverLensOptions.value : selectedLensOptions.value),
  ...props.lensOptions,
}));

const { instance: baseInstance } = useLiquidGlass(navRef, baseCreateOptions);
const { instance: lensInstance } = useLiquidGlass(lensRef, lensOptions);

let currentX = 0;
let targetX = 0;
let animationFrame: number | null = null;

const MAX_FOLLOW_OFFSET = 14;
const FOLLOW_STRENGTH = 0.25;
const DAMPING = 0.18;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function setItemRef(element: Element | null, index: number): void {
  itemRefs.value[index] = element as HTMLElement | null;
}

function renderLensX(): void {
  lensRef.value?.style.setProperty('--lens-x', `${currentX}px`);
}

function startLensAnimation(): void {
  if (animationFrame !== null || typeof requestAnimationFrame === 'undefined') return;
  animationFrame = requestAnimationFrame(animateLens);
}

function animateLens(): void {
  animationFrame = null;
  const distance = targetX - currentX;

  if (Math.abs(distance) < 0.05) {
    currentX = targetX;
    renderLensX();
    return;
  }

  currentX += distance * DAMPING;
  renderLensX();
  animationFrame = requestAnimationFrame(animateLens);
}

function setLensTarget(index: number, clientX?: number): void {
  const nav = navRef.value;
  const item = itemRefs.value[index];
  if (!nav || !item) return;

  const navRect = nav.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const centerX = itemRect.left - navRect.left + itemRect.width / 2;

  let offset = 0;
  if (clientX !== undefined) {
    const pointerOffset = clientX - (itemRect.left + itemRect.width / 2);
    offset = clamp(pointerOffset * FOLLOW_STRENGTH, -MAX_FOLLOW_OFFSET, MAX_FOLLOW_OFFSET);
  }

  targetX = centerX + offset;
  startLensAnimation();
}

function handleItemEnter(index: number, event: PointerEvent): void {
  if (props.items[index]?.disabled) return;
  hoverIndex.value = index;
  setLensTarget(index, event.clientX);
}

function handleItemMove(index: number, event: PointerEvent): void {
  if (hoverIndex.value !== index || props.items[index]?.disabled) return;
  setLensTarget(index, event.clientX);
}

function handleNavLeave(): void {
  hoverIndex.value = null;
  setLensTarget(selectedIndex.value);
}

const isJiggling = ref(false);
const clickingIndex = ref<number | null>(null);
let jiggleTimer: ReturnType<typeof setTimeout> | null = null;

function triggerBounce(index: number): void {
  isJiggling.value = false;
  clickingIndex.value = index;
  if (jiggleTimer) clearTimeout(jiggleTimer);
  void lensRef.value?.offsetWidth;
  isJiggling.value = true;
  jiggleTimer = setTimeout(() => {
    isJiggling.value = false;
    clickingIndex.value = null;
    jiggleTimer = null;
  }, 450);
}

function handleSelect(index: number): void {
  const item = props.items[index];
  if (!item || item.disabled) return;

  selectedIndex.value = index;
  triggerBounce(index);
  emit('update:modelValue', item.value);
  emit('change', item.value, item, index);

  if (hoverIndex.value === null) setLensTarget(index);
}

watch(
  () => selectedIndex.value,
  () => {
    void nextTick(() => {
      if (!isHovering.value) setLensTarget(selectedIndex.value);
    });
  }
);

watch(
  [() => props.height, () => props.itemWidth, () => props.itemHeight, () => props.lensInset],
  () => {
    void nextTick(() => setLensTarget(targetIndex.value));
  }
);

onMounted(async () => {
  await nextTick();
  setLensTarget(selectedIndex.value);
  currentX = targetX;
  renderLensX();
});

onUnmounted(() => {
  if (animationFrame !== null) cancelAnimationFrame(animationFrame);
  if (jiggleTimer) clearTimeout(jiggleTimer);
  animationFrame = null;
  jiggleTimer = null;
});

defineExpose({
  navRef,
  lensRef,
  baseInstance,
  lensInstance,
  selectedIndex,
  hoverIndex,
  targetIndex,
});
</script>

<template>
  <div class="glass-tabbar-shell" :style="rootStyle" @pointerleave="handleNavLeave">
    <nav ref="navRef" class="glass-tabbar" :style="rootStyle">
      <div v-if="$slots.prefix" class="glass-tabbar__prefix">
        <slot name="prefix" />
      </div>

      <div
        ref="lensRef"
        class="glass-tabbar__lens"
        :class="{ 'is-hovering': isHovering, 'is-bouncing': isJiggling }"
        aria-hidden="true"
      />

      <button
        v-for="(item, index) in items"
        :key="item.value"
        :ref="(element) => setItemRef(element as Element | null, index)"
        type="button"
        class="glass-tabbar__item"
        :class="{
          'is-selected': selectedIndex === index,
          'is-hovered': hoverIndex === index,
          'is-previewing-other': isHovering && hoverIndex !== index && selectedIndex === index,
          'is-disabled': item.disabled,
          'is-clicking': clickingIndex === index,
        }"
        :disabled="item.disabled"
        @pointerenter="handleItemEnter(index, $event)"
        @pointermove="handleItemMove(index, $event)"
        @click="handleSelect(index)"
      >
        <slot
          name="item"
          :item="item"
          :index="index"
          :is-selected="selectedIndex === index"
          :is-hovered="hoverIndex === index"
        >
          <span class="glass-tabbar__icon">
            <component
              :is="selectedIndex === index && item.activeIcon ? item.activeIcon : item.icon"
              v-if="item.icon || item.activeIcon"
            />
          </span>
          <span class="glass-tabbar__label">{{ item.label }}</span>
          <span v-if="item.badge !== undefined" class="glass-tabbar__badge">
            {{ item.badge }}
          </span>
        </slot>
      </button>

      <div v-if="$slots.suffix" class="glass-tabbar__suffix">
        <slot name="suffix" />
      </div>
    </nav>
  </div>
</template>

<style>
@import '../../../styles/liquid-glass.css';

.glass-tabbar-shell {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: max(var(--tabbar-height, 94px), var(--lens-hover-height, 104px));
  overflow: visible;
  user-select: none;
  touch-action: none;
  box-sizing: border-box;
}

.glass-tabbar {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  width: max-content;
  height: var(--tabbar-height, 94px);
  padding: 0 var(--tabbar-pad, 8px);
  box-sizing: border-box;
  border-radius: var(--tabbar-radius, 999px);
  isolation: isolate;
  user-select: none;
  touch-action: none;
  overflow: visible;
}

/*
 * LiquidGlass protects raw children by wrapping them in .lg-content. The
 * outer bar still needs that protected content layer to behave as one row;
 * otherwise each prefix/item/suffix becomes a normal block and stacks
 * vertically. Keep the wrapper as the flex geometry surface while the lens
 * remains absolutely positioned against it.
 */
.glass-tabbar > .lg-content {
  display: inline-flex;
  align-items: stretch;
  width: max-content;
  height: 100%;
  flex: 0 0 auto;
}

.glass-tabbar__prefix,
.glass-tabbar__suffix {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 12px;
  padding: 0 8px;
  box-sizing: border-box;
  pointer-events: auto;
}

.glass-tabbar .glass-tabbar__lens {
  position: absolute;
  left: 0;
  top: 50%;
  width: var(--lens-selected-width, 120px);
  height: var(--lens-selected-height, 82px);
  z-index: 3;
  border-radius: var(--lens-selected-radius, 999px);
  pointer-events: none;
  transform: translate3d(var(--lens-x, 0px), -50%, 0) translateX(-50%);
  will-change: transform, width, height;
  transition:
    width 180ms cubic-bezier(0.22, 1, 0.36, 1),
    height 180ms cubic-bezier(0.22, 1, 0.36, 1),
    border-radius 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.glass-tabbar .glass-tabbar__lens.is-hovering {
  width: var(--lens-hover-width, 150px);
  height: var(--lens-hover-height, 104px);
  border-radius: var(--lens-hover-radius, 999px);
}

.glass-tabbar__item {
  position: relative;
  z-index: 4;
  flex: 0 0 var(--item-width, 116px);
  width: var(--item-width, 116px);
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.65);
  font-family: inherit;
  font-weight: 500;
  line-height: 1;
  opacity: 0.65;
  box-sizing: border-box;
  transition:
    color 240ms ease,
    opacity 240ms ease;
}

.glass-tabbar__icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

.glass-tabbar__icon svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.glass-tabbar__label {
  font-size: 14px;
  letter-spacing: 0.2px;
  font-weight: 500;
  transition: color 240ms ease;
  will-change: color;
}

.glass-tabbar__badge {
  position: absolute;
  top: 14px;
  right: 24px;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  color: #fff;
  background: #ff4757;
  pointer-events: none;
}

.glass-tabbar__item.is-selected,
.glass-tabbar__item.is-hovered {
  color: #fff;
  opacity: 1;
}

.glass-tabbar__item.is-previewing-other {
  opacity: 0.6;
}

.glass-tabbar__item.is-hovered .glass-tabbar__icon {
  transform: scale(1.06);
}

/* Text deliberately never scales or translates, so its baseline stays stable. */
.glass-tabbar__item.is-hovered .glass-tabbar__label {
  transform: none;
}

.glass-tabbar__item.is-disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.glass-tabbar .glass-tabbar__lens.is-bouncing {
  animation: glass-tabbar-lens-dongdong 450ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.glass-tabbar__item.is-clicking .glass-tabbar__icon,
.glass-tabbar__item.is-clicking .glass-tabbar__label {
  animation: glass-tabbar-content-dongdong 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center;
}

@keyframes glass-tabbar-lens-dongdong {
  0% {
    transform: translate3d(var(--lens-x, 0px), -50%, 0) translateX(-50%) scale(1);
  }
  25% {
    transform: translate3d(var(--lens-x, 0px), -50%, 0) translateX(-50%) scale(0.92, 0.88);
  }
  50% {
    transform: translate3d(var(--lens-x, 0px), -50%, 0) translateX(-50%) scale(1.06, 1.08);
  }
  75% {
    transform: translate3d(var(--lens-x, 0px), -50%, 0) translateX(-50%) scale(0.98, 0.97);
  }
  100% {
    transform: translate3d(var(--lens-x, 0px), -50%, 0) translateX(-50%) scale(1, 1);
  }
}

@keyframes glass-tabbar-content-dongdong {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(0.82);
  }
  60% {
    transform: scale(1.15);
  }
  80% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}
</style>
