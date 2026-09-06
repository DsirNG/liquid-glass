<script setup lang="ts">
import { computed, ref } from 'vue';
import type {
  LiquidGlassCreateOptions,
  LiquidGlassMaterialOptions,
  SurfaceShape,
} from '../../../types';
import { useLiquidGlass } from '../../composables/useLiquidGlass';

export type GlassButtonSize = 'sm' | 'md' | 'lg';
export type GlassButtonVariant = 'default' | 'primary' | 'ghost' | 'danger';

const props = withDefaults(
  defineProps<{
    size?: GlassButtonSize;
    variant?: GlassButtonVariant;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    interactive?: boolean;
    blur?: number;
    opacity?: number;
    thickness?: number;
    ior?: number;
    refraction?: number;
    dispersion?: number;
    saturation?: number;
    tint?: string;
    radius?: number;
    bezel?: number;
    specular?: number;
    shadow?: number;
    shadowColor?: string;
    surfaceShape?: SurfaceShape;
    options?: LiquidGlassMaterialOptions;
  }>(),
  {
    size: 'md',
    variant: 'default',
    disabled: false,
    type: 'button',
    interactive: true,
  }
);

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const buttonRef = ref<HTMLButtonElement | null>(null);

// Size-based geometry presets
const SIZE_CONFIGS: Record<GlassButtonSize, { radius: number; bezel: number; thickness: number }> =
  {
    sm: { radius: 16, bezel: 12, thickness: 30 },
    md: { radius: 20, bezel: 16, thickness: 42 },
    lg: { radius: 24, bezel: 20, thickness: 54 },
  };

// Variant-based material presets
const VARIANT_CONFIGS: Record<
  GlassButtonVariant,
  { tint: string; opacity: number; specular: number; blur: number; shadow: number }
> = {
  default: {
    tint: '#ffffff',
    opacity: 0.12,
    specular: 0.75,
    blur: 4.0,
    shadow: 0.25,
  },
  primary: {
    tint: '#8b7cf7',
    opacity: 0.26,
    specular: 0.85,
    blur: 5.0,
    shadow: 0.35,
  },
  ghost: {
    tint: '#ffffff',
    opacity: 0.05,
    specular: 0.5,
    blur: 2.0,
    shadow: 0.12,
  },
  danger: {
    tint: '#ef4444',
    opacity: 0.24,
    specular: 0.8,
    blur: 4.5,
    shadow: 0.3,
  },
};

const createOptions = computed<LiquidGlassCreateOptions>(() => {
  const sizeCfg = SIZE_CONFIGS[props.size] || SIZE_CONFIGS.md;
  const variantCfg = VARIANT_CONFIGS[props.variant] || VARIANT_CONFIGS.default;

  const baseOptions: LiquidGlassCreateOptions = {
    radius: sizeCfg.radius,
    bezel: sizeCfg.bezel,
    thickness: sizeCfg.thickness,
    tint: variantCfg.tint,
    opacity: variantCfg.opacity,
    specular: variantCfg.specular,
    blur: variantCfg.blur,
    shadow: variantCfg.shadow,
    interactive: props.interactive && !props.disabled,
    ...props.options,
  };

  if (props.blur !== undefined) baseOptions.blur = props.blur;
  if (props.opacity !== undefined) baseOptions.opacity = props.opacity;
  if (props.thickness !== undefined) baseOptions.thickness = props.thickness;
  if (props.ior !== undefined) baseOptions.ior = props.ior;
  if (props.refraction !== undefined) baseOptions.refraction = props.refraction;
  if (props.dispersion !== undefined) baseOptions.dispersion = props.dispersion;
  if (props.saturation !== undefined) baseOptions.saturation = props.saturation;
  if (props.tint !== undefined) baseOptions.tint = props.tint;
  if (props.radius !== undefined) baseOptions.radius = props.radius;
  if (props.bezel !== undefined) baseOptions.bezel = props.bezel;
  if (props.specular !== undefined) baseOptions.specular = props.specular;
  if (props.shadow !== undefined) baseOptions.shadow = props.shadow;
  if (props.shadowColor !== undefined) baseOptions.shadowColor = props.shadowColor;
  if (props.surfaceShape !== undefined) baseOptions.surfaceShape = props.surfaceShape;

  return baseOptions;
});

const { instance, update, resize, destroy } = useLiquidGlass(buttonRef, createOptions);

function handleClick(e: MouseEvent): void {
  if (props.disabled) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  emit('click', e);
}

defineExpose({
  instance,
  update,
  resize,
  destroy,
});
</script>

<template>
  <button
    ref="buttonRef"
    :type="type"
    :disabled="disabled"
    class="lg-glass-button"
    :class="[`lg-btn-size-${size}`, `lg-btn-variant-${variant}`, { 'is-disabled': disabled }]"
    @click="handleClick"
  >
    <span class="lg-glass-button-content">
      <slot />
    </span>
  </button>
</template>

<style>
@import '../../../styles/liquid-glass.css';

.lg-glass-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-sizing: border-box;
  margin: 0;
  border: none;
  background: transparent;
  color: #fff;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  vertical-align: middle;
  text-decoration: none;
  white-space: nowrap;
  outline: none;
  line-height: 1;
  transition:
    transform 0.15s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.15s ease,
    opacity 0.2s ease;
}

/* Sizes */
.lg-glass-button.lg-btn-size-sm {
  height: 32px;
  padding: 0 14px;
  font-size: 13px;
}

.lg-glass-button.lg-btn-size-md {
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
}

.lg-glass-button.lg-btn-size-lg {
  height: 48px;
  padding: 0 26px;
  font-size: 16px;
}

/* Micro-interactions */
.lg-glass-button:hover:not(.is-disabled) {
  transform: translateY(-1px);
}

.lg-glass-button:active:not(.is-disabled) {
  transform: scale(0.97) translateY(0);
}

.lg-glass-button.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Internal Slot Content layer */
.lg-glass-button-content {
  position: relative;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 100%;
}
</style>
