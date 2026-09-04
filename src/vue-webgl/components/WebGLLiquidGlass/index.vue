<script setup lang="ts">
import { computed, ref } from 'vue';
import type { LiquidGlassMaterialOptions, SurfaceShape, WebGLCreateOptions } from '../../../types';
import { useWebGLLiquidGlass } from '../../composables/useWebGLLiquidGlass';



const props = withDefaults(
  defineProps<{
    interactive?: boolean;
    backgroundUrl?: string;
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
  { interactive: true }
);

const containerRef = ref<HTMLDivElement | null>(null);
const createOptions = computed<WebGLCreateOptions>(() => {
  const options: WebGLCreateOptions = {
    ...props.options,
    interactive: props.interactive,
    backgroundUrl: props.backgroundUrl,
  };

  if (props.blur !== undefined) options.blur = props.blur;
  if (props.opacity !== undefined) options.opacity = props.opacity;
  if (props.thickness !== undefined) options.thickness = props.thickness;
  if (props.ior !== undefined) options.ior = props.ior;
  if (props.refraction !== undefined) options.refraction = props.refraction;
  if (props.dispersion !== undefined) options.dispersion = props.dispersion;
  if (props.saturation !== undefined) options.saturation = props.saturation;
  if (props.tint !== undefined) options.tint = props.tint;
  if (props.radius !== undefined) options.radius = props.radius;
  if (props.bezel !== undefined) options.bezel = props.bezel;
  if (props.specular !== undefined) options.specular = props.specular;
  if (props.shadow !== undefined) options.shadow = props.shadow;
  if (props.shadowColor !== undefined) options.shadowColor = props.shadowColor;
  if (props.surfaceShape !== undefined) options.surfaceShape = props.surfaceShape;

  return options;
});

const { instance, update, resize, destroy } = useWebGLLiquidGlass(containerRef, createOptions);

defineExpose({ instance, update, resize, destroy });
</script>

<template>
  <div ref="containerRef" class="lg-root lg-webgl-wrapper">
    <div class="lg-content">
      <slot />
    </div>
  </div>
</template>

<style>
@import '../../../styles/liquid-glass.css';
</style>


