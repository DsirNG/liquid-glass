import { canonicalizeOptions, normalizeOptions } from '../../src/engine/options';
import { resolveRenderPlan, type RenderPlan, type RenderMode } from '../../src/engine/planning';
import { BackendManager } from '../../src/engine/runtime/BackendManager';
import type {
  BackendPrepareContext,
  EffectBackend,
  PreparedBackendCommit,
} from '../../src/engine/runtime/backend';
import { RuntimeController } from '../../src/engine/runtime/RuntimeController';
import type { RuntimeTransitionReason } from '../../src/engine/runtime/types';
import type { LiquidGlassInstance } from '../../src/types';
import { createLiquidGlass } from '../../src/core';

export const FULL_CAPABILITIES = {
  opticalField: true,
  refraction: true,
  dispersion: true,
  backdropBlur: true,
  saturation: true,
  tint: true,
  shadow: true,
  specular: true,
} as const;

export function createFullPlan(): RenderPlan {
  const requested = normalizeOptions({ capability: 'auto', fallbackPolicy: 'auto' });
  return resolveRenderPlan({
    requested: canonicalizeOptions(requested),
    capabilities: FULL_CAPABILITIES,
    fallbackPolicy: 'auto',
  });
}

export function createMaterialHost(index = 0): HTMLDivElement {
  const host = document.createElement('div');
  host.dataset.performanceInstance = String(index);
  host.style.width = '320px';
  host.style.height = '180px';
  document.body.appendChild(host);
  return host;
}

export async function waitForReady(instance: LiquidGlassInstance, timeoutMs = 1000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (instance.status.phase !== 'ready') {
    if (Date.now() >= deadline) {
      throw new Error(`LiquidGlass did not reach ready phase: ${instance.status.phase}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

export async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

export class CountingBackend implements EffectBackend<void> {
  public readonly mode: RenderMode;
  public readonly label: string;
  public gate: Promise<void> | null = null;
  public prepareCount = 0;
  public commitCount = 0;
  public candidateDisposeCount = 0;
  public backendDisposeCount = 0;

  constructor(mode: RenderMode, label: string) {
    this.mode = mode;
    this.label = label;
  }

  public updateSync(): void {}

  public async prepare(
    _plan: RenderPlan,
    _context: BackendPrepareContext
  ): Promise<PreparedBackendCommit> {
    this.prepareCount += 1;
    if (this.gate) await this.gate;

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

  public get cleanupCount(): number {
    return this.candidateDisposeCount + this.backendDisposeCount;
  }
}

export function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolvePromise!: () => void;
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

export interface TransitionBurstResult {
  readonly results: readonly string[];
  readonly committedCount: number;
  readonly staleCount: number;
  readonly disposedCandidateCount: number;
  readonly activeLabel: string | null;
}

export async function runStaleTransitionBurst(
  count = 20,
  reason: RuntimeTransitionReason = 'resizing'
): Promise<TransitionBurstResult> {
  const manager = new BackendManager<void>();
  const plan = createFullPlan();
  const gate = deferred();
  const candidates = Array.from({ length: count }, (_, index) => {
    const candidate = new CountingBackend('full-optical', `candidate-${index}`);
    candidate.gate = gate.promise;
    return candidate;
  });
  const allCandidates = [...candidates];
  const controller = new RuntimeController<void>({
    manager,
    createBackend: () => {
      const candidate = candidates.shift();
      if (!candidate) throw new Error('No transition candidate available.');
      return candidate;
    },
  });

  const transitions = allCandidates.map(() => controller.transition(plan, reason));
  gate.resolve();
  const results = await Promise.all(transitions);
  const committedCount = results.filter((result) => result.status === 'committed').length;
  const staleCount = results.filter((result) => result.status === 'stale').length;

  return {
    results: results.map((result) => result.status),
    committedCount,
    staleCount,
    disposedCandidateCount: allCandidates.reduce(
      (countValue, candidate) => countValue + candidate.cleanupCount,
      0
    ),
    activeLabel: (manager.active as CountingBackend | null)?.label ?? null,
  };
}

export interface ResizeBurstResult extends TransitionBurstResult {
  readonly activeBeforeRelease: string | null;
  readonly previousActiveDisposed: boolean;
}

export async function runResizeTransitionBurst(count = 20): Promise<ResizeBurstResult> {
  const manager = new BackendManager<void>();
  const plan = createFullPlan();
  const initial = new CountingBackend('full-optical', 'initial');
  await manager.switchTo(initial, plan);

  const gate = deferred();
  const candidates = Array.from({ length: count }, (_, index) => {
    const candidate = new CountingBackend('full-optical', `resize-${index}`);
    candidate.gate = gate.promise;
    return candidate;
  });
  const allCandidates = [...candidates];
  const controller = new RuntimeController<void>({
    manager,
    createBackend: () => {
      const candidate = candidates.shift();
      if (!candidate) throw new Error('No resize candidate available.');
      return candidate;
    },
  });

  const transitions = allCandidates.map(() => controller.transition(plan, 'resizing'));
  const activeBeforeRelease = (manager.active as CountingBackend | null)?.label ?? null;
  gate.resolve();
  const results = await Promise.all(transitions);
  const committedCount = results.filter((result) => result.status === 'committed').length;
  const staleCount = results.filter((result) => result.status === 'stale').length;

  return {
    results: results.map((result) => result.status),
    committedCount,
    staleCount,
    disposedCandidateCount: allCandidates.reduce(
      (countValue, candidate) => countValue + candidate.cleanupCount,
      0
    ),
    activeLabel: (manager.active as CountingBackend | null)?.label ?? null,
    activeBeforeRelease,
    previousActiveDisposed: initial.backendDisposeCount === 1,
  };
}

export async function runMaterialInstances(count: number): Promise<{
  readonly count: number;
  readonly lingeringRoots: number;
  readonly lingeringLayers: number;
}> {
  const hosts: HTMLDivElement[] = [];
  const instances: LiquidGlassInstance[] = [];

  for (let index = 0; index < count; index += 1) {
    const host = createMaterialHost(index);
    hosts.push(host);
    const instance = createLiquidGlass(host, {
      capability: 'material',
      interactive: true,
    });
    instances.push(instance);
    instance.update({
      tint: index % 2 === 0 ? '#ffffff' : '#dbeafe',
      opacity: 0.25 + (index % 4) * 0.05,
    });
    instance.resize();
  }

  instances.forEach((instance) => instance.destroy());
  await flushMicrotasks();
  await new Promise((resolve) => setTimeout(resolve, 0));

  const lingeringRoots = hosts.filter((host) => host.classList.contains('lg-root')).length;
  const lingeringLayers = hosts.reduce(
    (countValue, host) =>
      countValue + host.querySelectorAll('.lg-backdrop, .lg-material, .lg-border').length,
    0
  );
  hosts.forEach((host) => host.remove());

  return { count, lingeringRoots, lingeringLayers };
}
