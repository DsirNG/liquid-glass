import type { RenderMode, RenderPlan } from '../planning';
import type {
  BackendOperationResult,
  BackendPrepareContext,
  EffectBackend,
  PreparedBackendCommit,
} from './backend';

/**
 * Owns backend transactions and the single revision source for asynchronous work.
 * Recovery decisions intentionally stay outside this class.
 */
export class BackendManager<TSyncOptions = unknown> {
  private revision = 0;
  private activeBackend: EffectBackend<TSyncOptions> | null = null;

  public get currentRevision(): number {
    return this.revision;
  }

  public get activeMode(): RenderMode | null {
    return this.activeBackend?.mode ?? null;
  }

  public get active(): EffectBackend<TSyncOptions> | null {
    return this.activeBackend;
  }

  /** Invalidates work that has not reached commit without changing the active backend. */
  public invalidate(): number {
    this.revision += 1;
    return this.revision;
  }

  public updateSync(options: TSyncOptions): void {
    this.activeBackend?.updateSync(options);
  }

  public resize(width: number, height: number): void {
    this.activeBackend?.resize?.(width, height);
  }

  public async switchTo(
    candidate: EffectBackend<TSyncOptions>,
    plan: RenderPlan
  ): Promise<BackendOperationResult> {
    const revision = ++this.revision;
    const context: BackendPrepareContext = {
      revision,
      isCurrent: () => revision === this.revision,
    };

    let prepared: PreparedBackendCommit;
    try {
      prepared = await candidate.prepare(plan, context);
    } catch (error) {
      candidate.dispose();
      if (!context.isCurrent()) return { status: 'stale' };

      return {
        status: 'candidate-failed',
        error,
        activeMode: this.activeMode,
      };
    }

    if (!context.isCurrent()) {
      prepared.dispose();
      candidate.dispose();
      return { status: 'stale' };
    }

    try {
      // commit() is synchronous by contract, so the revision cannot change in
      // the middle of this transaction.
      prepared.commit();
    } catch (error) {
      prepared.dispose();
      candidate.dispose();
      if (!context.isCurrent()) return { status: 'stale' };

      return {
        status: 'candidate-failed',
        error,
        activeMode: this.activeMode,
      };
    }

    const previous = this.activeBackend;
    this.activeBackend = candidate;
    previous?.dispose();

    return {
      status: 'committed',
      mode: candidate.mode,
    };
  }

  /** Called only when the active backend itself is known to be unusable. */
  public reportActiveFailure(error: unknown): BackendOperationResult {
    this.invalidate();
    this.activeBackend?.dispose();
    this.activeBackend = null;

    return {
      status: 'active-failed',
      error,
      activeMode: null,
    };
  }

  public dispose(): void {
    this.invalidate();
    this.activeBackend?.dispose();
    this.activeBackend = null;
  }
}
