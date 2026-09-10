<script setup lang="ts">
import { computed, ref } from 'vue';
import type {
  LiquidGlassCreateOptions,
  LiquidGlassMaterialOptions,
  SurfaceShape,
  SurfaceProfile,
  MaterialPreset,
  FootprintShape,
  LiquidGlassQuality,
  OpticalDebugMode,
  RefractionCoverage,
} from '../../../types';

import { useLiquidGlass } from '../../composables/useLiquidGlass';

const props = withDefaults(
  defineProps<{
    /** Enables pointer-driven optical interaction. */
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
    surfaceProfile?: SurfaceProfile;
    materialPreset?: MaterialPreset;
    quality?: LiquidGlassQuality;
    shape?: FootprintShape;
    ambientLuma?: number;
    debug?: OpticalDebugMode;
    borderMode?: 'directional' | 'adaptive';
    colorBleed?: number;
    refractionCoverage?: RefractionCoverage;
    options?: LiquidGlassMaterialOptions;
  }>(),
  { interactive: true }
);

const containerRef = ref<HTMLDivElement | null>(null);
const createOptions = computed<LiquidGlassCreateOptions>(() => {
  const options: LiquidGlassCreateOptions = {
    ...props.options,
    interactive: props.interactive,
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
  if (props.surfaceProfile !== undefined) options.surfaceProfile = props.surfaceProfile;
  if (props.materialPreset !== undefined) options.materialPreset = props.materialPreset;
  if (props.quality !== undefined) options.quality = props.quality;
  if (props.shape !== undefined) options.shape = props.shape;
  if (props.ambientLuma !== undefined) options.ambientLuma = props.ambientLuma;
  if (props.debug !== undefined) options.debug = props.debug;
  if (props.borderMode !== undefined) options.borderMode = props.borderMode;
  if (props.colorBleed !== undefined) options.colorBleed = props.colorBleed;
  if (props.refractionCoverage !== undefined) options.refractionCoverage = props.refractionCoverage;

  return options;
});

const { instance, update, resize, destroy } = useLiquidGlass(containerRef, createOptions);

defineExpose({ instance, update, resize, destroy });
</script>

<template>
  <div ref="containerRef" class="lg-root">
    <div class="lg-content">
      <slot />
    </div>
  </div>
</template>

<style>
@import '../../../styles/liquid-glass.css';
</style>
