import type { RenderMode } from '../planning';

export type RuntimePhase = 'initializing' | 'transitioning' | 'ready' | 'failed';

export type RuntimeFailureSeverity = 'candidate-failed' | 'active-backend-failed';

export type RuntimeReason =
  | 'initializing-optical-field'
  | 'resizing'
  | 'backend-switch'
  | 'optical-field-failed'
  | 'backend-prepare-failed'
  | 'recovery-failed';

export type RuntimeTransitionReason = 'initializing-optical-field' | 'resizing' | 'backend-switch';

export interface InitializingRuntimeState {
  phase: 'initializing';
  targetMode: RenderMode | null;
  activeMode: null;
  runtimeDegraded: false;
}

export interface TransitioningRuntimeState {
  phase: 'transitioning';
  targetMode: RenderMode;
  activeMode: RenderMode | null;
  runtimeDegraded: false;
  runtimeReason: RuntimeTransitionReason;
}

export interface ReadyRuntimeState {
  phase: 'ready';
  targetMode: RenderMode;
  activeMode: RenderMode;
  runtimeDegraded: boolean;
  runtimeReason?: RuntimeReason;
  recoveryMode?: Exclude<RenderMode, 'full-optical'>;
  failureSeverity?: RuntimeFailureSeverity;
}

export interface FailedRuntimeState {
  phase: 'failed';
  targetMode: RenderMode | null;
  activeMode: null;
  runtimeDegraded: true;
  runtimeReason: 'backend-prepare-failed' | 'recovery-failed';
  error?: unknown;
}

export type RuntimeState =
  InitializingRuntimeState | TransitioningRuntimeState | ReadyRuntimeState | FailedRuntimeState;
