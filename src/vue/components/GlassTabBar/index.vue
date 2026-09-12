<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { LiquidGlassCreateOptions } from '../../../types';
import LiquidGlass from '../LiquidGlass/index.vue';
import type { GlassTabBarEmits, GlassTabBarProps } from './types';

const props = withDefaults(defineProps<GlassTabBarProps>(), {
  height: 94,
  itemWidth: 116,
  responsive: false,
  mobileHeight: 60,
  mobileItemWidth: 40,
  tabletHeight: 80,
  tabletItemWidth: 76,
});

const emit = defineEmits<GlassTabBarEmits>();

const baseGlassRef = ref<InstanceType<typeof LiquidGlass> | null>(null);
const lensGlassRef = ref<InstanceType<typeof LiquidGlass> | null>(null);
const navRef = ref<HTMLElement | null>(null);
const lensRef = ref<HTMLElement | null>(null);
const itemRefs = ref<(HTMLElement | null)[]>([]);

const selectedIndex = computed(() => {
  const activeIndex = props.items.findIndex((item) => item.active && !item.disabled);
  if (activeIndex >= 0) return activeIndex;
  return Math.max(0, props.items.findIndex((item) => !item.disabled));
});
const hoverIndex = ref<number | null>(null);
const isHovering = computed(() => hoverIndex.value !== null);
const targetIndex = computed(() => hoverIndex.value ?? selectedIndex.value);
const viewportWidth = ref(typeof window === 'undefined' ? 1440 : window.innerWidth);

const isMobileViewport = computed(
  () => props.responsive && viewportWidth.value > 0 && viewportWidth.value < 768
);
const isTabletViewport = computed(
  () => props.responsive && viewportWidth.value >= 768 && viewportWidth.value < 1200
);
const barHeight = computed(() => {
  if (isMobileViewport.value) return props.mobileHeight;
  if (isTabletViewport.value) return props.tabletHeight;
  return props.height;
});
const tabItemWidth = computed(() => {
  if (isMobileViewport.value) return props.mobileItemWidth;
  if (isTabletViewport.value) return props.tabletItemWidth;
  return props.itemWidth;
});

watch(
  () => props.items.map((item) => `${item.value}:${item.active}:${item.disabled}`),
  () => {
    void nextTick(() => scheduleLensTarget(targetIndex.value));
  }
);

const TABBAR_PAD = 8;

const selectedLensHeight = computed(() => {
  if (props.lensInset !== undefined) {
    return Math.max(20, Math.round(barHeight.value - props.lensInset * 2));
  }
  if (props.itemHeight !== undefined) return Math.max(20, props.itemHeight);
  return Math.max(20, Math.round(barHeight.value - 12));
});

const autoInset = computed(() =>
  Math.max(0, Math.round((barHeight.value - selectedLensHeight.value) / 2))
);

const baseRadius = computed(() => {
  if (props.radius !== undefined) return props.radius;
  if (props.baseOptions?.radius !== undefined) return props.baseOptions.radius;
  return Math.round(barHeight.value / 2);
});

const selectedLensRadius = computed(() => {
  if (props.radius !== undefined) return props.radius;
  if (props.lensOptions?.radius !== undefined) return props.lensOptions.radius;
  return Math.round(selectedLensHeight.value / 2);
});

const hoverLensHeight = computed(() => {
  if (props.lensHeight !== undefined) return Math.max(20, props.lensHeight);
  return Math.round(barHeight.value + 10);
});

const hoverLensWidth = computed(() => {
  if (props.lensWidth !== undefined) return Math.max(20, props.lensWidth);
  return Math.round(tabItemWidth.value * (150 / 116));
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
  Math.max(20, Math.round(tabItemWidth.value + (TABBAR_PAD - autoInset.value) * 2))
);

const rootStyle = computed(() => ({
  '--tabbar-height': `${barHeight.value}px`,
  '--tabbar-pad': `${tabbarPad.value}px`,
  '--tabbar-radius': `${baseRadius.value}px`,
  '--item-width': `${tabItemWidth.value}px`,
  '--lens-selected-width': `${selectedLensWidth.value}px`,
  '--lens-selected-height': `${selectedLensHeight.value}px`,
  '--lens-selected-radius': `${selectedLensRadius.value}px`,
  '--lens-hover-width': `${hoverLensWidth.value}px`,
  '--lens-hover-height': `${hoverLensHeight.value}px`,
  '--lens-hover-radius': `${hoverLensRadius.value}px`,
}));

const baseCreateOptions = computed<LiquidGlassCreateOptions>(() => ({
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
  ...props.baseOptions,
  radius: baseRadius.value,
  interactive: false,
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
  radius: isHovering.value ? hoverLensRadius.value : selectedLensRadius.value,
  interactive: false,
}));

const baseInstance = computed(() => baseGlassRef.value?.instance ?? null);
const lensInstance = computed(() => lensGlassRef.value?.instance ?? null);

let currentX = 0;
let targetX = 0;
let animationFrame: number | null = null;
let lensMeasureFrame: number | null = null;
let pendingLensIndex: number | null = null;
let pendingPointerX: number | undefined;

const MAX_FOLLOW_OFFSET = 14;
const FOLLOW_STRENGTH = 0.25;
// Position following should settle in a few frames. The press "dongdong"
// animation remains separate, so this does not remove the elastic click feel.
const LENS_FOLLOW_LERP = 0.72;
const LENS_SNAP_DISTANCE = 0.1;

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

  if (Math.abs(distance) < LENS_SNAP_DISTANCE) {
    currentX = targetX;
    renderLensX();
    return;
  }

  currentX += distance * LENS_FOLLOW_LERP;
  renderLensX();
  animationFrame = requestAnimationFrame(animateLens);
}

function updateLensTarget(index: number, clientX?: number): void {
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

function flushScheduledLensTarget(): void {
  lensMeasureFrame = null;
  const index = pendingLensIndex;
  const clientX = pendingPointerX;
  pendingLensIndex = null;
  pendingPointerX = undefined;

  if (index !== null) updateLensTarget(index, clientX);
}

function scheduleLensTarget(index: number, clientX?: number): void {
  pendingLensIndex = index;
  pendingPointerX = clientX;
  if (lensMeasureFrame !== null) return;

  if (typeof requestAnimationFrame === 'undefined') {
    flushScheduledLensTarget();
    return;
  }

  lensMeasureFrame = requestAnimationFrame(flushScheduledLensTarget);
}

function handleItemEnter(index: number, event: PointerEvent): void {
  if (props.items[index]?.disabled) return;
  hoverIndex.value = index;
  scheduleLensTarget(index, event.clientX);
}

function handleItemMove(index: number, event: PointerEvent): void {
  if (hoverIndex.value !== index || props.items[index]?.disabled) return;
  scheduleLensTarget(index, event.clientX);
}

function moveFocus(index: number, direction: 'next' | 'previous' | 'first' | 'last'): void {
  const enabledIndices = props.items.reduce<number[]>((indices, item, itemIndex) => {
    if (!item.disabled) indices.push(itemIndex);
    return indices;
  }, []);
  if (enabledIndices.length === 0) return;

  const currentPosition = Math.max(0, enabledIndices.indexOf(index));
  const nextPosition =
    direction === 'first'
      ? 0
      : direction === 'last'
        ? enabledIndices.length - 1
        : direction === 'next'
          ? (currentPosition + 1) % enabledIndices.length
          : (currentPosition - 1 + enabledIndices.length) % enabledIndices.length;

  itemRefs.value[enabledIndices[nextPosition]]?.focus();
}

function handleItemKeydown(index: number, event: KeyboardEvent): void {
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault();
    moveFocus(index, 'next');
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault();
    moveFocus(index, 'previous');
  } else if (event.key === 'Home') {
    event.preventDefault();
    moveFocus(index, 'first');
  } else if (event.key === 'End') {
    event.preventDefault();
    moveFocus(index, 'last');
  }
}

function handleNavLeave(): void {
  hoverIndex.value = null;
  scheduleLensTarget(selectedIndex.value);
}

const isJiggling = ref(false);
const clickingIndex = ref<number | null>(null);
let jiggleTimer: ReturnType<typeof setTimeout> | null = null;

function handleViewportResize(): void {
  viewportWidth.value = window.innerWidth;
}

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

function handleClick(index: number, event: MouseEvent): void {
  const item = props.items[index];
  if (!item || item.disabled) return;

  triggerBounce(index);
  emit('click', item, index, event);
}

watch(
  selectedIndex,
  () => {
    void nextTick(() => {
      if (!isHovering.value) scheduleLensTarget(selectedIndex.value);
    });
  }
);

watch([barHeight, tabItemWidth, () => props.itemHeight, () => props.lensInset], () => {
  void nextTick(() => scheduleLensTarget(targetIndex.value));
});

onMounted(async () => {
  window.addEventListener('resize', handleViewportResize, { passive: true });
  await nextTick();
  updateLensTarget(selectedIndex.value);
  currentX = targetX;
  renderLensX();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleViewportResize);
  if (animationFrame !== null) cancelAnimationFrame(animationFrame);
  if (lensMeasureFrame !== null) cancelAnimationFrame(lensMeasureFrame);
  if (jiggleTimer) clearTimeout(jiggleTimer);
  animationFrame = null;
  lensMeasureFrame = null;
  pendingLensIndex = null;
  pendingPointerX = undefined;
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
    <LiquidGlass
      ref="baseGlassRef"
      class="glass-tabbar"
      :options="baseCreateOptions"
      :interactive="false"
    >
      <nav ref="navRef" class="glass-tabbar__content" role="tablist">
        <div v-if="$slots.prefix" class="glass-tabbar__prefix">
          <slot name="prefix" />
        </div>

        <div
          ref="lensRef"
          class="glass-tabbar__lens"
          :class="{ 'is-hovering': isHovering, 'is-bouncing': isJiggling }"
          aria-hidden="true"
        >
          <LiquidGlass
            ref="lensGlassRef"
            class="glass-tabbar__lens-surface"
            :options="lensOptions"
            :interactive="false"
            aria-hidden="true"
          />
        </div>

        <button
          v-for="(item, index) in items"
          :key="item.value"
          :ref="(element) => setItemRef(element as Element | null, index)"
          type="button"
          class="glass-tabbar__item"
          role="tab"
          :aria-selected="selectedIndex === index"
          :aria-disabled="item.disabled ? 'true' : undefined"
          :tabindex="selectedIndex === index ? 0 : -1"
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
          @keydown="handleItemKeydown(index, $event)"
          @click="handleClick(index, $event)"
        >
          <slot
            name="item"
            :item="item"
            :index="index"
            :is-selected="selectedIndex === index"
            :is-hovered="hoverIndex === index"
          >
            <span v-if="item.icon || item.activeIcon" class="glass-tabbar__icon">
              <component :is="selectedIndex === index && item.activeIcon ? item.activeIcon : item.icon" />
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
    </LiquidGlass>
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
  padding: 0;
  box-sizing: border-box;
  border-radius: var(--tabbar-radius, 999px);
  isolation: isolate;
  user-select: none;
  touch-action: none;
  overflow: visible;
}

/*
 * LiquidGlass owns the outer base and provides its own .lg-content layer.
 * Keep that layer as the full-size flex surface, then use the nav below as
 * the geometry reference for the moving lens.
 */
.glass-tabbar > .lg-content {
  display: inline-flex;
  align-items: stretch;
  width: 100%;
  height: 100%;
  flex: 0 0 auto;
}

.glass-tabbar__content {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  width: max-content;
  height: 100%;
  padding: 0 var(--tabbar-pad, 8px);
  box-sizing: border-box;
  isolation: isolate;
  user-select: none;
  touch-action: none;
  overflow: visible;
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

.glass-tabbar__lens-surface {
  width: 100%;
  height: 100%;
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
