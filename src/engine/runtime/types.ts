import type {
  LiquidGlassCapabilityDegradeReason,
  LiquidGlassOperationResult,
  LiquidGlassRuntimePhase,
  LiquidGlassRuntimeReason,
  LiquidGlassStatus,
} from '../../types/status';
import type { RenderMode } from '../planning';

export type RuntimePhase = LiquidGlassRuntimePhase;

/** @deprecated Failure severity now belongs to `lastOperation`, not stable runtime state. */
export type RuntimeFailureSeverity = 'candidate-failed' | 'active-backend-failed';

export type RuntimeReason = LiquidGlassRuntimeReason;

export type RuntimeTransitionReason = Extract<
  RuntimeReason,
  'initializing-optical-field' | 'resizing' | 'backend-switch'
>;

export type RuntimeOperationResult = LiquidGlassOperationResult;

export type RuntimeStatus = LiquidGlassStatus;

export interface InitializingRuntimeState {
  phase: 'initializing';
  targetMode: RenderMode | null;
  activeMode: null;
  runtimeDegraded: false;
  degradationReason?: LiquidGlassCapabilityDegradeReason;
  runtimeReason?: RuntimeReason;
}

export interface TransitioningRuntimeState {
  phase: 'transitioning';
  targetMode: RenderMode;
  activeMode: RenderMode | null;
  runtimeDegraded: false;
  runtimeReason: RuntimeTransitionReason;
  degradationReason?: LiquidGlassCapabilityDegradeReason;
}

export interface ReadyRuntimeState {
  phase: 'ready';
  targetMode: RenderMode;
  activeMode: RenderMode;
  runtimeDegraded: boolean;
  runtimeReason?: RuntimeReason;
  degradationReason?: LiquidGlassCapabilityDegradeReason;
  recoveryMode?: Exclude<RenderMode, 'full-optical'>;
}

export interface FailedRuntimeState {
  phase: 'failed';
  targetMode: RenderMode | null;
  activeMode: null;
  runtimeDegraded: true;
  runtimeReason: 'backend-prepare-failed' | 'recovery-failed';
  degradationReason?: LiquidGlassCapabilityDegradeReason;
  error?: unknown;
}

export type RuntimeState =
  InitializingRuntimeState | TransitioningRuntimeState | ReadyRuntimeState | FailedRuntimeState;
