/** Public rendering modes exposed by the runtime status API. */
export type LiquidGlassRenderMode = 'full-optical' | 'material' | 'static';

export type LiquidGlassRuntimePhase = 'initializing' | 'transitioning' | 'ready' | 'failed';

export type LiquidGlassCapabilityDegradeReason =
  'optical-unsupported' | 'backdrop-filter-unsupported' | 'forced-material' | 'forced-static';

export type LiquidGlassRuntimeReason =
  | 'initializing-optical-field'
  | 'resizing'
  | 'backend-switch'
  | 'optical-field-failed'
  | 'backend-prepare-failed'
  | 'recovery-failed';

export type LiquidGlassRecoveryMode = 'material' | 'static';

export type LiquidGlassOperationResult =
  | {
      status: 'committed';
      mode: LiquidGlassRenderMode;
    }
  | {
      status: 'candidate-failed';
      reason: LiquidGlassRuntimeReason;
    }
  | {
      status: 'stale';
    }
  | {
      status: 'active-failed';
      reason: LiquidGlassRuntimeReason;
    }
  | {
      status: 'recovery-failed';
      reason: LiquidGlassRuntimeReason;
    };

/** Stable public snapshot; backend and transaction internals stay private. */
export interface LiquidGlassStatus {
  targetMode: LiquidGlassRenderMode | null;
  activeMode: LiquidGlassRenderMode | null;
  phase: LiquidGlassRuntimePhase;
  degraded: boolean;
  degradationReason?: LiquidGlassCapabilityDegradeReason;
  runtimeReason?: LiquidGlassRuntimeReason;
  recoveryMode?: LiquidGlassRecoveryMode;
  lastOperation?: LiquidGlassOperationResult;
}
