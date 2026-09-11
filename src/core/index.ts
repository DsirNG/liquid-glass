import '../styles/liquid-glass.css';

export { createLiquidGlass } from '../engine';
export { DEFAULT_GLASS_OPTIONS, GLASS_PRESETS } from '../constants';

export type {
  LiquidGlassMaterialOptions,
  LiquidGlassCreateOptions,
  LiquidGlassOptions,
  LiquidGlassUpdateOptions,
  NormalizedLiquidGlassOptions,
  ResolvedLiquidGlassOptions,
  LiquidGlassInstance,
  LiquidGlassStatus,
  LiquidGlassOperationResult,
  LiquidGlassRenderMode,
  LiquidGlassRuntimePhase,
  LiquidGlassRuntimeReason,
  LiquidGlassCapabilityDegradeReason,
  LiquidGlassRecoveryMode,
  FallbackPolicy,
  GlassPreset,
  SurfaceShape,
  LiquidGlassQuality,
} from '../types';
