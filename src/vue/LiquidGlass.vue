<script setup lang="ts">
import { ref, computed } from 'vue';
import type {
  LiquidGlassCreateOptions,
  LiquidGlassMaterialOptions,
  RendererType,
  SurfaceShape,
} from '../types';
import { useLiquidGlass } from './useLiquidGlass';

const props = withDefaults(
  defineProps<{
    renderer?: RendererType;
    interactive?: boolean;
    /**
     * @deprecated Planned for removal after DOM-backdrop engine migration.
     * Legacy WebGL backdrop texture only.
     */
    backgroundUrl?: string;

    // Individual material props
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

    // Strictly material options (no renderer/interactive/backgroundUrl allowed in options)
    options?: LiquidGlassMaterialOptions;
  }>(),
  {
    renderer: 'auto',
    interactive: true,
  }
);

const containerRef = ref<HTMLDivElement | null>(null);

const createOptions = computed<LiquidGlassCreateOptions>(() => {
  const opts: LiquidGlassCreateOptions = {
    ...props.options,
    renderer: props.renderer,
    interactive: props.interactive,
    backgroundUrl: props.backgroundUrl,
  };

  if (props.blur !== undefined) opts.blur = props.blur;
  if (props.opacity !== undefined) opts.opacity = props.opacity;
  if (props.thickness !== undefined) opts.thickness = props.thickness;
  if (props.ior !== undefined) opts.ior = props.ior;
  if (props.refraction !== undefined) opts.refraction = props.refraction;
  if (props.dispersion !== undefined) opts.dispersion = props.dispersion;
  if (props.saturation !== undefined) opts.saturation = props.saturation;
  if (props.tint !== undefined) opts.tint = props.tint;
  if (props.radius !== undefined) opts.radius = props.radius;
  if (props.bezel !== undefined) opts.bezel = props.bezel;
  if (props.specular !== undefined) opts.specular = props.specular;
  if (props.shadow !== undefined) opts.shadow = props.shadow;
  if (props.shadowColor !== undefined) opts.shadowColor = props.shadowColor;
  if (props.surfaceShape !== undefined) opts.surfaceShape = props.surfaceShape;

  return opts;
});

const {
  instance,
  renderer: activeRenderer,
  update,
  resize,
  destroy,
} = useLiquidGlass(containerRef, createOptions);

defineExpose({
  instance,
  renderer: activeRenderer,
  update,
  resize,
  destroy,
});
</script>

<template>
  <div ref="containerRef" class="lg-root">
    <div class="lg-content">
      <slot :renderer="activeRenderer" />
    </div>
  </div>
</template>

<style>
@import '../styles/liquid-glass.css';
</style>
