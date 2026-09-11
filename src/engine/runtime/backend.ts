import type { RenderMode, RenderPlan } from '../planning';

/** Context shared by every asynchronous backend preparation. */
export interface BackendPrepareContext {
  readonly revision: number;
  isCurrent(): boolean;
}

/** Transaction returned by prepare; it owns candidate resources until commit or dispose. */
export interface PreparedBackendCommit {
  commit(): void;
  dispose(): void;
}

/** Backend contract. updateSync must never create or replace asynchronous resources. */
export interface EffectBackend<TSyncOptions = unknown> {
  readonly mode: RenderMode;

  updateSync(options: TSyncOptions): void;

  prepare(plan: RenderPlan, context: BackendPrepareContext): Promise<PreparedBackendCommit>;

  resize?(width: number, height: number): void;

  dispose(): void;
}

export type BackendOperationResult =
  | {
      status: 'committed';
      mode: RenderMode;
    }
  | {
      status: 'stale';
    }
  | {
      status: 'candidate-failed';
      error: unknown;
      activeMode: RenderMode | null;
    }
  | {
      status: 'active-failed';
      error: unknown;
      activeMode: null;
    };
