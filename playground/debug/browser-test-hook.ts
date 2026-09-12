import type { FallbackPolicy, LiquidGlassStatus } from '@dinqorai/liquid-glass';
import type { CapabilityReport } from './types';

export interface PlaygroundRuntimeSnapshot {
  readonly fallbackPolicy: FallbackPolicy;
  readonly capabilityReport: CapabilityReport;
  readonly status: Readonly<LiquidGlassStatus>;
}

export interface PlaygroundTestHook {
  readonly getRuntimeSnapshot: () => PlaygroundRuntimeSnapshot;
}

declare global {
  interface Window {
    __LIQUID_GLASS_PLAYGROUND__?: PlaygroundTestHook;
  }
}

function isBrowserTestSurface(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('browserTest') === '1';
}

function cloneSnapshot(snapshot: PlaygroundRuntimeSnapshot): PlaygroundRuntimeSnapshot {
  return {
    fallbackPolicy: snapshot.fallbackPolicy,
    capabilityReport: {
      ...snapshot.capabilityReport,
      knownRestrictions: [...snapshot.capabilityReport.knownRestrictions],
    },
    status: {
      ...snapshot.status,
      ...(snapshot.status.lastOperation
        ? { lastOperation: { ...snapshot.status.lastOperation } }
        : {}),
    },
  };
}

/** Installs a development-only, read-only bridge for browser integration checks. */
export function installPlaygroundTestHook(
  getSnapshot: () => PlaygroundRuntimeSnapshot,
  enabled = import.meta.env.DEV || isBrowserTestSurface()
): () => void {
  if (!enabled || typeof window === 'undefined') return () => undefined;

  const previousHook = window.__LIQUID_GLASS_PLAYGROUND__;
  const hook: PlaygroundTestHook = {
    getRuntimeSnapshot: () => cloneSnapshot(getSnapshot()),
  };

  window.__LIQUID_GLASS_PLAYGROUND__ = hook;

  return () => {
    if (window.__LIQUID_GLASS_PLAYGROUND__ !== hook) return;
    if (previousHook) {
      window.__LIQUID_GLASS_PLAYGROUND__ = previousHook;
    } else {
      delete window.__LIQUID_GLASS_PLAYGROUND__;
    }
  };
}
