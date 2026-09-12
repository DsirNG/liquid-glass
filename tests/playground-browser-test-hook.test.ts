import { afterEach, describe, expect, it } from 'vitest';
import type { CapabilityReport } from '../src/engine';
import type { FallbackPolicy, LiquidGlassStatus } from '../src/types';
import {
  installPlaygroundTestHook,
  type PlaygroundRuntimeSnapshot,
} from '../playground/debug/browser-test-hook';

const capabilityReport: CapabilityReport = {
  backdropFilter: true,
  svgFilter: true,
  svgDisplacementMap: true,
  svgBackdropDisplacement: true,
  cssFilter: true,
  knownRestrictions: [],
};

const status: LiquidGlassStatus = {
  targetMode: 'full-optical',
  activeMode: 'full-optical',
  phase: 'ready',
  degraded: false,
  lastOperation: { status: 'committed', mode: 'full-optical' },
};

const snapshot: PlaygroundRuntimeSnapshot = {
  fallbackPolicy: 'auto' satisfies FallbackPolicy,
  capabilityReport,
  status,
};

afterEach(() => {
  delete window.__LIQUID_GLASS_PLAYGROUND__;
});

describe('playground browser test hook', () => {
  it('exposes a cloned runtime snapshot when enabled', () => {
    const dispose = installPlaygroundTestHook(() => snapshot, true);

    expect(window.__LIQUID_GLASS_PLAYGROUND__).toBeDefined();
    const exposed = window.__LIQUID_GLASS_PLAYGROUND__?.getRuntimeSnapshot();

    expect(exposed).toEqual(snapshot);
    expect(exposed).not.toBe(snapshot);
    expect(exposed?.status).not.toBe(status);
    expect(exposed?.capabilityReport).not.toBe(capabilityReport);
    expect(exposed?.capabilityReport.knownRestrictions).not.toBe(
      capabilityReport.knownRestrictions
    );

    dispose();
    expect(window.__LIQUID_GLASS_PLAYGROUND__).toBeUndefined();
  });

  it('restores an existing hook when the owner is disposed', () => {
    const existingHook = {
      getRuntimeSnapshot: () => snapshot,
    };
    window.__LIQUID_GLASS_PLAYGROUND__ = existingHook;

    const dispose = installPlaygroundTestHook(() => snapshot, true);
    expect(window.__LIQUID_GLASS_PLAYGROUND__).not.toBe(existingHook);

    dispose();
    expect(window.__LIQUID_GLASS_PLAYGROUND__).toBe(existingHook);
  });

  it('does not install outside an enabled development surface', () => {
    const dispose = installPlaygroundTestHook(() => snapshot, false);

    expect(window.__LIQUID_GLASS_PLAYGROUND__).toBeUndefined();
    dispose();
  });
});
