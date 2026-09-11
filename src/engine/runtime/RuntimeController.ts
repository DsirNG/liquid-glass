import type { LiquidGlassStatus } from '../../types/status';
import type { RenderMode, RenderPlan } from '../planning';
import { BackendManager } from './BackendManager';
import type { BackendOperationResult, EffectBackend } from './backend';
import type {
  ReadyRuntimeState,
  RuntimeOperationResult,
  RuntimeReason,
  RuntimeState,
  RuntimeTransitionReason,
} from './types';

export interface RecoveryCandidate<TSyncOptions = unknown> {
  plan: RenderPlan;
  backend: EffectBackend<TSyncOptions>;
}

export interface RuntimeControllerOptions<TSyncOptions = unknown> {
  manager: BackendManager<TSyncOptions>;
  createBackend(plan: RenderPlan): EffectBackend<TSyncOptions>;
  /** Returns ordered candidates from the least degraded to the most degraded mode. */
  getRecoveryChain?(plan: RenderPlan, error: unknown): readonly RecoveryCandidate<TSyncOptions>[];
  /** @deprecated Use getRecoveryChain() so recovery remains extensible. */
  recover?(plan: RenderPlan, error: unknown): RecoveryCandidate<TSyncOptions> | null;
  onStateChange?(state: RuntimeState): void;
}

export interface RuntimePreview<TSyncOptions = unknown> {
  plan: RenderPlan;
  backend: EffectBackend<TSyncOptions>;
}

/** Drives RuntimeState while delegating transaction mechanics to BackendManager. */
export class RuntimeController<TSyncOptions = unknown> {
  private readonly manager: BackendManager<TSyncOptions>;
  private readonly createBackend: RuntimeControllerOptions<TSyncOptions>['createBackend'];
  private readonly getRecoveryChain?: RuntimeControllerOptions<TSyncOptions>['getRecoveryChain'];
  private readonly recover?: RuntimeControllerOptions<TSyncOptions>['recover'];
  private readonly onStateChange?: RuntimeControllerOptions<TSyncOptions>['onStateChange'];
  private state: RuntimeState = {
    phase: 'initializing',
    targetMode: null,
    activeMode: null,
    runtimeDegraded: false,
  };
  private lastOperation: RuntimeOperationResult | undefined;

  constructor(options: RuntimeControllerOptions<TSyncOptions>) {
    this.manager = options.manager;
    this.createBackend = options.createBackend;
    this.getRecoveryChain = options.getRecoveryChain;
    this.recover = options.recover;
    this.onStateChange = options.onStateChange;
  }

  public get currentState(): Readonly<RuntimeState> {
    return this.state;
  }

  public get status(): Readonly<LiquidGlassStatus> {
    return {
      targetMode: this.state.targetMode,
      activeMode: this.state.activeMode,
      phase: this.state.phase,
      degraded: this.state.runtimeDegraded || this.state.degradationReason !== undefined,
      degradationReason: this.state.degradationReason,
      runtimeReason: this.state.runtimeReason,
      recoveryMode: this.state.phase === 'ready' ? this.state.recoveryMode : undefined,
      lastOperation: this.lastOperation,
    };
  }

  public beginTransition(plan: RenderPlan, reason: RuntimeTransitionReason): void {
    this.setState({
      phase: 'transitioning',
      targetMode: plan.targetMode,
      activeMode: this.manager.activeMode,
      runtimeDegraded: false,
      runtimeReason: reason,
      degradationReason: plan.degraded ? plan.degradationReason : undefined,
    });
  }

  public async transition(
    plan: RenderPlan,
    reason: RuntimeTransitionReason,
    preview?: RuntimePreview<TSyncOptions>
  ): Promise<BackendOperationResult> {
    this.beginTransition(plan, reason);
    const candidate = this.createBackend(plan);

    if (preview && this.manager.activeMode === null) {
      const previewResult = await this.manager.switchTo(preview.backend, preview.plan);
      if (previewResult.status === 'stale') {
        candidate.dispose();
        return previewResult;
      }
      if (previewResult.status === 'committed') {
        this.setState({
          phase: 'transitioning',
          targetMode: plan.targetMode,
          activeMode: previewResult.mode,
          runtimeDegraded: false,
          runtimeReason: reason,
          degradationReason: plan.degraded ? plan.degradationReason : undefined,
        });
      } else if (previewResult.status === 'active-failed') {
        candidate.dispose();
        this.recordOperation({ status: 'active-failed', reason: 'backend-prepare-failed' });
        this.setFailed(
          'backend-prepare-failed',
          previewResult.error,
          plan.targetMode,
          plan.degraded ? plan.degradationReason : undefined
        );
        return previewResult;
      }
      // A preview failure is not the primary transition failure. Keep the
      // candidate alive and let the requested backend attempt its own prepare.
    }

    const result = await this.manager.switchTo(candidate, plan);
    if (result.status === 'stale') return result;

    const failureReason = this.resolveFailureReason(plan);
    const planDegradationReason = plan.degraded ? plan.degradationReason : undefined;

    if (result.status === 'committed') {
      this.recordOperation({ status: 'committed', mode: result.mode });
      this.setReady({
        targetMode: plan.targetMode,
        activeMode: result.mode,
        runtimeDegraded: false,
        degradationReason: planDegradationReason,
      });
      return result;
    }

    if (result.status === 'active-failed') {
      this.recordOperation({ status: 'active-failed', reason: 'backend-prepare-failed' });
      this.setFailed(
        'backend-prepare-failed',
        result.error,
        this.state.targetMode,
        planDegradationReason
      );
      return result;
    }

    this.recordOperation({ status: 'candidate-failed', reason: failureReason });

    if (result.activeMode !== null) {
      const isRuntimeRecovery = result.activeMode !== plan.targetMode;
      this.setReady({
        targetMode: plan.targetMode,
        activeMode: result.activeMode,
        runtimeDegraded: isRuntimeRecovery,
        runtimeReason: isRuntimeRecovery ? failureReason : undefined,
        recoveryMode: this.toRecoveryMode(result.activeMode),
        degradationReason: planDegradationReason,
      });
      return result;
    }

    return this.recoverFromFailure(
      plan,
      result,
      failureReason,
      result.error,
      planDegradationReason
    );
  }

  /** Clears an unusable active backend, then runs the same ordered recovery chain. */
  public async reportActiveFailure(
    plan: RenderPlan,
    error: unknown
  ): Promise<BackendOperationResult> {
    const result = this.manager.reportActiveFailure(error);
    this.recordOperation({ status: 'active-failed', reason: 'backend-prepare-failed' });
    const planDegradationReason = plan.degraded ? plan.degradationReason : undefined;
    this.setState({
      phase: 'transitioning',
      targetMode: plan.targetMode,
      activeMode: null,
      runtimeDegraded: false,
      runtimeReason: 'backend-switch',
      degradationReason: planDegradationReason,
    });

    return this.recoverFromFailure(
      plan,
      result,
      'backend-prepare-failed',
      error,
      planDegradationReason
    );
  }

  private resolveRecoveryChain(
    plan: RenderPlan,
    error: unknown
  ): readonly RecoveryCandidate<TSyncOptions>[] {
    const candidates = this.getRecoveryChain
      ? (this.getRecoveryChain(plan, error) ?? [])
      : (() => {
          const legacyCandidate = this.recover?.(plan, error);
          return legacyCandidate ? [legacyCandidate] : [];
        })();

    const usableCandidates: RecoveryCandidate<TSyncOptions>[] = [];
    for (const candidate of candidates) {
      if (candidate.plan.targetMode === plan.targetMode) {
        // A recovery candidate at the same mode is a retry, not a degradation.
        candidate.backend.dispose();
        continue;
      }
      usableCandidates.push(candidate);
    }

    return usableCandidates;
  }

  private async recoverFromFailure(
    plan: RenderPlan,
    primaryResult: BackendOperationResult,
    failureReason: RuntimeReason,
    primaryError: unknown,
    planDegradationReason: ReadyRuntimeState['degradationReason']
  ): Promise<BackendOperationResult> {
    let recoveryCandidates: readonly RecoveryCandidate<TSyncOptions>[];
    try {
      recoveryCandidates = this.resolveRecoveryChain(plan, primaryError);
    } catch (error) {
      this.recordOperation({ status: 'recovery-failed', reason: 'recovery-failed' });
      this.setFailed('recovery-failed', error, plan.targetMode, planDegradationReason);
      return primaryResult;
    }

    if (recoveryCandidates.length === 0) {
      this.setFailed(
        'backend-prepare-failed',
        primaryError,
        plan.targetMode,
        planDegradationReason
      );
      return primaryResult;
    }

    let lastRecoveryError: unknown = primaryError;

    for (let index = 0; index < recoveryCandidates.length; index += 1) {
      const recovery = recoveryCandidates[index];
      const recoveryResult = await this.manager.switchTo(recovery.backend, recovery.plan);

      if (recoveryResult.status === 'stale') {
        this.disposeRecoveryCandidates(recoveryCandidates, index + 1);
        return recoveryResult;
      }

      if (recoveryResult.status === 'committed') {
        this.disposeRecoveryCandidates(recoveryCandidates, index + 1);
        this.setReady({
          targetMode: plan.targetMode,
          activeMode: recoveryResult.mode,
          runtimeDegraded: recoveryResult.mode !== plan.targetMode,
          runtimeReason: failureReason,
          recoveryMode: this.toRecoveryMode(recoveryResult.mode),
          degradationReason: planDegradationReason,
        });
        // Preserve the primary failure as the operation result. The status
        // describes both the recovered active mode and what triggered recovery.
        return primaryResult;
      }

      lastRecoveryError = recoveryResult.error;
      if (recoveryResult.status === 'active-failed') {
        this.disposeRecoveryCandidates(recoveryCandidates, index + 1);
        break;
      }
    }

    this.recordOperation({ status: 'recovery-failed', reason: 'recovery-failed' });
    this.setFailed('recovery-failed', lastRecoveryError, plan.targetMode, planDegradationReason);
    return primaryResult;
  }

  private resolveFailureReason(plan: RenderPlan): RuntimeReason {
    return plan.targetMode === 'full-optical' ? 'optical-field-failed' : 'backend-prepare-failed';
  }

  private toRecoveryMode(mode: RenderMode): Exclude<RenderMode, 'full-optical'> | undefined {
    return mode === 'material' || mode === 'static' ? mode : undefined;
  }

  private disposeRecoveryCandidates(
    candidates: readonly RecoveryCandidate<TSyncOptions>[],
    startIndex: number
  ): void {
    for (let index = startIndex; index < candidates.length; index += 1) {
      candidates[index].backend.dispose();
    }
  }

  private setReady(params: {
    targetMode: RenderMode;
    activeMode: RenderMode;
    runtimeDegraded: boolean;
    runtimeReason?: ReadyRuntimeState['runtimeReason'];
    degradationReason?: ReadyRuntimeState['degradationReason'];
    recoveryMode?: ReadyRuntimeState['recoveryMode'];
  }): void {
    this.setState({
      phase: 'ready',
      targetMode: params.targetMode,
      activeMode: params.activeMode,
      runtimeDegraded: params.runtimeDegraded,
      runtimeReason: params.runtimeReason,
      degradationReason: params.degradationReason,
      recoveryMode: params.recoveryMode,
    });
  }

  private setFailed(
    reason: 'backend-prepare-failed' | 'recovery-failed',
    error: unknown,
    targetMode: RenderMode | null = this.state.targetMode,
    degradationReason?: ReadyRuntimeState['degradationReason']
  ): void {
    this.setState({
      phase: 'failed',
      targetMode,
      activeMode: null,
      runtimeDegraded: true,
      runtimeReason: reason,
      degradationReason,
      error,
    });
  }

  private recordOperation(operation: RuntimeOperationResult): void {
    this.lastOperation = operation;
  }

  private setState(state: RuntimeState): void {
    this.state = state;
    this.onStateChange?.(state);
  }
}
