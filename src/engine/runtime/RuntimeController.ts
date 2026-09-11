import type { RenderPlan, RenderMode } from '../planning';
import { BackendManager } from './BackendManager';
import type { BackendOperationResult, EffectBackend } from './backend';
import type { ReadyRuntimeState, RuntimeState, RuntimeTransitionReason } from './types';

export interface RecoveryCandidate<TSyncOptions = unknown> {
  plan: RenderPlan;
  backend: EffectBackend<TSyncOptions>;
}

export interface RuntimeControllerOptions<TSyncOptions = unknown> {
  manager: BackendManager<TSyncOptions>;
  createBackend(plan: RenderPlan): EffectBackend<TSyncOptions>;
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
  private readonly recover?: RuntimeControllerOptions<TSyncOptions>['recover'];
  private readonly onStateChange?: RuntimeControllerOptions<TSyncOptions>['onStateChange'];
  private state: RuntimeState = {
    phase: 'initializing',
    targetMode: null,
    activeMode: null,
    runtimeDegraded: false,
  };

  constructor(options: RuntimeControllerOptions<TSyncOptions>) {
    this.manager = options.manager;
    this.createBackend = options.createBackend;
    this.recover = options.recover;
    this.onStateChange = options.onStateChange;
  }

  public get currentState(): RuntimeState {
    return this.state;
  }

  public beginTransition(plan: RenderPlan, reason: RuntimeTransitionReason): void {
    this.setState({
      phase: 'transitioning',
      targetMode: plan.targetMode,
      activeMode: this.manager.activeMode,
      runtimeDegraded: false,
      runtimeReason: reason,
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
      if (previewResult.status !== 'committed') {
        candidate.dispose();
        this.setFailed('backend-prepare-failed', previewResult.error);
        return previewResult;
      }

      this.setState({
        phase: 'transitioning',
        targetMode: plan.targetMode,
        activeMode: previewResult.mode,
        runtimeDegraded: false,
        runtimeReason: reason,
      });
    }

    const result = await this.manager.switchTo(candidate, plan);
    if (result.status === 'stale') return result;
    if (result.status === 'committed') {
      this.setReady(plan.targetMode, result.mode, false);
      return result;
    }

    if (result.status === 'active-failed') {
      this.setFailed('backend-prepare-failed', result.error);
      return result;
    }

    if (result.activeMode !== null) {
      this.setReady(
        plan.targetMode,
        result.activeMode,
        result.activeMode !== plan.targetMode,
        plan.targetMode === 'full-optical' ? 'optical-field-failed' : 'backend-prepare-failed',
        'candidate-failed'
      );
      return result;
    }

    const recovery = this.recover?.(plan, result.error) ?? null;
    if (!recovery) {
      this.setFailed('backend-prepare-failed', result.error, plan.targetMode);
      return result;
    }

    const recoveryResult = await this.manager.switchTo(recovery.backend, recovery.plan);
    if (recoveryResult.status === 'stale') return recoveryResult;
    if (recoveryResult.status === 'committed') {
      this.setReady(
        plan.targetMode,
        recoveryResult.mode,
        true,
        'optical-field-failed',
        'candidate-failed',
        recoveryResult.mode === 'full-optical' ? undefined : recoveryResult.mode
      );
      return result;
    }

    this.setFailed('recovery-failed', recoveryResult.error, plan.targetMode);
    return result;
  }

  public reportActiveFailure(error: unknown): BackendOperationResult {
    const result = this.manager.reportActiveFailure(error);
    this.setFailed('backend-prepare-failed', error, this.state.targetMode);
    return result;
  }

  private setReady(
    targetMode: RenderMode,
    activeMode: RenderMode,
    runtimeDegraded: boolean,
    runtimeReason?: ReadyRuntimeState['runtimeReason'],
    failureSeverity?: 'candidate-failed' | 'active-backend-failed',
    recoveryMode?: Exclude<RenderMode, 'full-optical'>
  ): void {
    this.setState({
      phase: 'ready',
      targetMode,
      activeMode,
      runtimeDegraded,
      runtimeReason,
      failureSeverity,
      recoveryMode,
    });
  }

  private setFailed(
    reason: 'backend-prepare-failed' | 'recovery-failed',
    error: unknown,
    targetMode: RenderMode | null = this.state.targetMode
  ): void {
    this.setState({
      phase: 'failed',
      targetMode,
      activeMode: null,
      runtimeDegraded: true,
      runtimeReason: reason,
      error,
    });
  }

  private setState(state: RuntimeState): void {
    this.state = state;
    this.onStateChange?.(state);
  }
}
