import type { RenderMode, RenderPlan } from '../planning';
import type {
  BackendOperationResult,
  BackendPrepareContext,
  EffectBackend,
  PreparedBackendCommit,
} from './backend';

export interface BackendSwitchOptions<TSyncOptions = unknown> {
  /** Keeps a primary candidate pending while a temporary preview is committed. */
  preservePending?: EffectBackend<TSyncOptions>;
}

/**
 * Owns backend transactions and the single revision source for asynchronous work.
 * Recovery decisions intentionally stay outside this class.
 */
export class BackendManager<TSyncOptions = unknown> {
  private revision = 0;
  private activeBackend: EffectBackend<TSyncOptions> | null = null;
  private pendingBackend: EffectBackend<TSyncOptions> | null = null;
  private readonly disposedBackends = new WeakSet<EffectBackend<TSyncOptions>>();

  public get currentRevision(): number {
    return this.revision;
  }

  public get activeMode(): RenderMode | null {
    return this.activeBackend?.mode ?? null;
  }

  public get active(): EffectBackend<TSyncOptions> | null {
    return this.activeBackend;
  }

  public get pending(): EffectBackend<TSyncOptions> | null {
    return this.pendingBackend;
  }

  /** Registers a candidate before a temporary preview transition begins. */
  public registerPending(candidate: EffectBackend<TSyncOptions>): void {
    if (this.pendingBackend === candidate) return;

    this.disposePending();
    this.pendingBackend = candidate;
  }

  /** Invalidates work without tearing down the still-visible pending preview. */
  public invalidate(): number {
    this.revision += 1;
    return this.revision;
  }

  public updateSync(options: TSyncOptions): void {
    this.activeBackend?.updateSync(options);
    if (this.pendingBackend && this.pendingBackend !== this.activeBackend) {
      this.pendingBackend.updateSync(options);
    }
  }

  public resize(width: number, height: number): void {
    this.activeBackend?.resize?.(width, height);
  }

  public async switchTo(
    candidate: EffectBackend<TSyncOptions>,
    plan: RenderPlan,
    options: BackendSwitchOptions<TSyncOptions> = {}
  ): Promise<BackendOperationResult> {
    const revision = ++this.revision;
    const preservesPending = this.pendingBackend === options.preservePending;
    if (!preservesPending && this.pendingBackend !== candidate) {
      this.disposePending();
    }
    if (!preservesPending) {
      this.pendingBackend = candidate;
    }
    const context: BackendPrepareContext = {
      revision,
      isCurrent: () => revision === this.revision,
    };

    let prepared: PreparedBackendCommit;
    try {
      prepared = await candidate.prepare(plan, context);
    } catch (error) {
      this.clearPending(candidate);
      this.disposeBackend(candidate);
      if (!context.isCurrent()) return { status: 'stale' };

      return {
        status: 'candidate-failed',
        error,
        activeMode: this.activeMode,
      };
    }

    if (!context.isCurrent()) {
      prepared.dispose();
      this.clearPending(candidate);
      this.disposeBackend(candidate);
      return { status: 'stale' };
    }

    try {
      // commit() is synchronous by contract, so the revision cannot change in
      // the middle of this transaction.
      prepared.commit();
    } catch (error) {
      try {
        prepared.rollback?.();
      } catch {
        // Rollback is best-effort; the candidate is still discarded below.
      }
      prepared.dispose();
      this.clearPending(candidate);
      this.disposeBackend(candidate);
      if (!context.isCurrent()) return { status: 'stale' };

      return {
        status: 'candidate-failed',
        error,
        activeMode: this.activeMode,
      };
    }

    const previous = this.activeBackend;
    this.clearPending(candidate);
    this.activeBackend = candidate;
    if (previous && previous !== candidate) {
      this.disposeBackend(previous);
    }

    return {
      status: 'committed',
      mode: candidate.mode,
    };
  }

  /** Called only when the active backend itself is known to be unusable. */
  public reportActiveFailure(error: unknown): BackendOperationResult {
    this.invalidate();
    this.disposePending();
    if (this.activeBackend) {
      this.disposeBackend(this.activeBackend);
    }
    this.activeBackend = null;

    return {
      status: 'active-failed',
      error,
      activeMode: null,
    };
  }

  public dispose(): void {
    this.invalidate();
    this.disposePending();
    if (this.activeBackend) {
      this.disposeBackend(this.activeBackend);
    }
    this.activeBackend = null;
  }

  private clearPending(candidate: EffectBackend<TSyncOptions>): void {
    if (this.pendingBackend === candidate) {
      this.pendingBackend = null;
    }
  }

  private disposePending(): void {
    if (!this.pendingBackend) return;

    const pending = this.pendingBackend;
    this.pendingBackend = null;
    if (pending !== this.activeBackend) {
      this.disposeBackend(pending);
    }
  }

  private disposeBackend(backend: EffectBackend<TSyncOptions>): void {
    if (this.disposedBackends.has(backend)) return;

    this.disposedBackends.add(backend);
    backend.dispose();
  }
}
