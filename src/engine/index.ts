import type { LiquidGlassCreateOptions, LiquidGlassInstance } from '../types';
import { normalizeOptions } from './options';
import { LiquidGlassEngine } from './LiquidGlassEngine';

export { LiquidGlassEngine } from './LiquidGlassEngine';
export { canonicalizeOptions, normalizeOptionPatch, normalizeOptions } from './options';
export type { CanonicalGlassOptions, CanonicalGlassUpdateOptions } from './options';
export { RenderPlanUnsupportedError, resolveRenderPlan } from './planning';
export { BackendManager, RuntimeController } from './runtime';
export type {
  BackdropBackendOptions,
  CapabilityDegradeReason,
  CommonMaterialOptions,
  FallbackPolicy,
  FullOpticalRenderPlan,
  GlassCapabilities,
  MaterialRenderPlan,
  OpticalBackendOptions,
  RenderMode,
  RenderPlan,
  RenderPlanningInput,
  StaticBackendOptions,
  StaticRenderPlan,
  StrictRequestedMode,
} from './planning';
export type {
  BackendOperationResult,
  BackendPrepareContext,
  BackendSwitchOptions,
  EffectBackend,
  FailedRuntimeState,
  InitializingRuntimeState,
  PreparedBackendCommit,
  ReadyRuntimeState,
  RecoveryCandidate,
  RuntimeControllerOptions,
  RuntimeFailureSeverity,
  RuntimeOperationResult,
  RuntimePhase,
  RuntimePreview,
  RuntimeReason,
  RuntimeState,
  RuntimeStatus,
  RuntimeTransitionReason,
  TransitioningRuntimeState,
} from './runtime';

/** Creates the DOM-native Liquid Glass engine. */
export function createLiquidGlass(
  element: HTMLElement,
  options?: LiquidGlassCreateOptions
): LiquidGlassInstance {
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error('[LiquidGlass] createLiquidGlass requires a valid HTMLElement.');
  }
  return new LiquidGlassEngine(element, normalizeOptions(options));
}
