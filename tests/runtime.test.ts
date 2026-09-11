import { describe, expect, it } from 'vitest';
import { canonicalizeOptions, normalizeOptions } from '../src/engine/options';
import { resolveRenderPlan, type RenderPlan, type RenderMode } from '../src/engine/planning';
import { BackendManager } from '../src/engine/runtime/BackendManager';
import type {
  BackendPrepareContext,
  EffectBackend,
  PreparedBackendCommit,
} from '../src/engine/runtime/backend';
import { RuntimeController } from '../src/engine/runtime/RuntimeController';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createPlan(mode: 'full-optical' | 'material' | 'static'): RenderPlan {
  const requested = canonicalizeOptions(normalizeOptions());
  return resolveRenderPlan({
    requested,
    capabilities:
      mode === 'full-optical'
        ? {
            opticalField: true,
            refraction: true,
            dispersion: true,
            backdropBlur: true,
            saturation: true,
            tint: true,
            shadow: true,
            specular: true,
          }
        : mode === 'material'
          ? {
              opticalField: false,
              refraction: false,
              dispersion: false,
              backdropBlur: true,
              saturation: true,
              tint: true,
              shadow: true,
              specular: true,
            }
          : {
              opticalField: false,
              refraction: false,
              dispersion: false,
              backdropBlur: false,
              saturation: true,
              tint: true,
              shadow: true,
              specular: true,
            },
  });
}

class FakeBackend implements EffectBackend<void> {
  public readonly mode: RenderMode;
  public prepareCount = 0;
  public commitCount = 0;
  public candidateDisposeCount = 0;
  public backendDisposeCount = 0;
  public gate: Promise<void> | null = null;
  public prepareError: unknown = null;

  constructor(mode: RenderMode) {
    this.mode = mode;
  }

  public updateSync(): void {}

  public async prepare(
    _plan: RenderPlan,
    _context: BackendPrepareContext
  ): Promise<PreparedBackendCommit> {
    this.prepareCount += 1;
    if (this.gate) await this.gate;
    if (this.prepareError) throw this.prepareError;

    let ownsCandidate = true;
    return {
      commit: () => {
        if (!ownsCandidate) return;
        ownsCandidate = false;
        this.commitCount += 1;
      },
      dispose: () => {
        if (!ownsCandidate) return;
        ownsCandidate = false;
        this.candidateDisposeCount += 1;
      },
    };
  }

  public dispose(): void {
    this.backendDisposeCount += 1;
  }
}

describe('BackendManager', () => {
  it('disposes stale candidates and never lets them replace newer work', async () => {
    const manager = new BackendManager<void>();
    const fullPlan = createPlan('full-optical');
    const firstGate = deferred<void>();
    const first = new FakeBackend('full-optical');
    first.gate = firstGate.promise;
    const second = new FakeBackend('full-optical');

    const firstSwitch = manager.switchTo(first, fullPlan);
    const secondSwitch = manager.switchTo(second, fullPlan);
    expect(await secondSwitch).toEqual({ status: 'committed', mode: 'full-optical' });

    firstGate.resolve();
    expect(await firstSwitch).toEqual({ status: 'stale' });
    expect(manager.activeMode).toBe('full-optical');
    expect(first.candidateDisposeCount).toBe(1);
    expect(first.backendDisposeCount).toBe(1);
    expect(second.commitCount).toBe(1);
  });

  it('preserves the active backend when a candidate fails', async () => {
    const manager = new BackendManager<void>();
    const fullPlan = createPlan('full-optical');
    const active = new FakeBackend('full-optical');
    await manager.switchTo(active, fullPlan);

    const candidate = new FakeBackend('full-optical');
    candidate.prepareError = new Error('candidate failed');
    const result = await manager.switchTo(candidate, fullPlan);

    expect(result.status).toBe('candidate-failed');
    if (result.status !== 'candidate-failed') throw new Error('Expected candidate failure');
    expect(result.activeMode).toBe('full-optical');
    expect(manager.active).toBe(active);
    expect(active.backendDisposeCount).toBe(0);
    expect(candidate.backendDisposeCount).toBe(1);
  });

  it('clears the active backend only when it reports an active failure', async () => {
    const manager = new BackendManager<void>();
    const active = new FakeBackend('full-optical');
    await manager.switchTo(active, createPlan('full-optical'));

    const result = manager.reportActiveFailure(new Error('active failed'));

    expect(result).toEqual({
      status: 'active-failed',
      error: expect.any(Error),
      activeMode: null,
    });
    expect(manager.activeMode).toBeNull();
    expect(active.backendDisposeCount).toBe(1);
  });
});

describe('RuntimeController', () => {
  it('recovers the first optical failure without changing the target mode', async () => {
    const manager = new BackendManager<void>();
    const fullPlan = createPlan('full-optical');
    const materialPlan = createPlan('material');
    const optical = new FakeBackend('full-optical');
    optical.prepareError = new Error('optical field failed');
    const material = new FakeBackend('material');

    const controller = new RuntimeController<void>({
      manager,
      createBackend: () => optical,
      recover: () => ({ plan: materialPlan, backend: material }),
    });

    const result = await controller.transition(fullPlan, 'initializing-optical-field');

    expect(result.status).toBe('candidate-failed');
    expect(controller.currentState).toMatchObject({
      phase: 'ready',
      targetMode: 'full-optical',
      activeMode: 'material',
      runtimeDegraded: true,
      runtimeReason: 'optical-field-failed',
      recoveryMode: 'material',
    });
    expect(controller.status.lastOperation).toEqual({
      status: 'candidate-failed',
      reason: 'optical-field-failed',
    });
  });

  it('keeps last-good optical active after a later candidate failure', async () => {
    const manager = new BackendManager<void>();
    const fullPlan = createPlan('full-optical');
    const first = new FakeBackend('full-optical');
    const second = new FakeBackend('full-optical');
    second.prepareError = new Error('resize candidate failed');
    const candidates = [first, second];

    const controller = new RuntimeController<void>({
      manager,
      createBackend: () => candidates.shift() ?? new FakeBackend('full-optical'),
    });

    await controller.transition(fullPlan, 'initializing-optical-field');
    const result = await controller.transition(fullPlan, 'resizing');

    expect(result.status).toBe('candidate-failed');
    expect(controller.currentState).toMatchObject({
      phase: 'ready',
      targetMode: 'full-optical',
      activeMode: 'full-optical',
      runtimeDegraded: false,
    });
    expect(controller.status.lastOperation).toEqual({
      status: 'candidate-failed',
      reason: 'optical-field-failed',
    });
    expect(manager.active).toBe(first);
  });

  it('walks the ordered material-to-static recovery chain', async () => {
    const manager = new BackendManager<void>();
    const fullPlan = createPlan('full-optical');
    const materialPlan = createPlan('material');
    const staticPlan = createPlan('static');
    const optical = new FakeBackend('full-optical');
    optical.prepareError = new Error('optical field failed');
    const material = new FakeBackend('material');
    material.prepareError = new Error('material fallback failed');
    const staticBackend = new FakeBackend('static');

    const controller = new RuntimeController<void>({
      manager,
      createBackend: () => optical,
      getRecoveryChain: () => [
        { plan: materialPlan, backend: material },
        { plan: staticPlan, backend: staticBackend },
      ],
    });

    const result = await controller.transition(fullPlan, 'initializing-optical-field');

    expect(result.status).toBe('candidate-failed');
    expect(controller.status).toMatchObject({
      targetMode: 'full-optical',
      activeMode: 'static',
      phase: 'ready',
      degraded: true,
      recoveryMode: 'static',
      lastOperation: {
        status: 'candidate-failed',
        reason: 'optical-field-failed',
      },
    });
    expect(material.backendDisposeCount).toBe(1);
    expect(staticBackend.commitCount).toBe(1);
  });

  it('enters failed only when there is no active backend and recovery fails', async () => {
    const manager = new BackendManager<void>();
    const fullPlan = createPlan('full-optical');
    const optical = new FakeBackend('full-optical');
    optical.prepareError = new Error('optical field failed');
    const material = new FakeBackend('material');
    material.prepareError = new Error('material recovery failed');

    const controller = new RuntimeController<void>({
      manager,
      createBackend: (plan) => (plan.targetMode === 'full-optical' ? optical : material),
      recover: () => ({ plan: createPlan('material'), backend: material }),
    });

    await controller.transition(fullPlan, 'initializing-optical-field');

    expect(controller.currentState).toMatchObject({
      phase: 'failed',
      activeMode: null,
      runtimeDegraded: true,
      runtimeReason: 'recovery-failed',
    });
  });
});
