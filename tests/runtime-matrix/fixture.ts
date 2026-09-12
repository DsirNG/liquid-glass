import {
  CapabilityProbe,
  canonicalizeOptions,
  createLiquidGlass,
  normalizeOptions,
  resolveRenderPlan,
  type CapabilityReport,
  type GlassCapabilities,
  type RenderPlan,
} from '../../src/engine';
import type { LiquidGlassStatus } from '../../src/types';

const root = document.querySelector<HTMLElement>('#runtime-matrix-root');
if (!root) throw new Error('Runtime matrix root element was not found.');

const host = document.createElement('div');
host.dataset.runtimeMatrixHost = 'true';
host.style.width = '360px';
host.style.height = '180px';
host.style.margin = '80px auto';
host.style.background = 'rgba(255, 255, 255, 0.08)';
host.innerHTML = '<span>Runtime matrix fixture</span>';
root.append(host);

const requestedOptions = normalizeOptions({
  interactive: false,
  fallbackPolicy: 'auto',
});
const capabilityReport = CapabilityProbe.probe();
const capabilities: GlassCapabilities = {
  opticalField: capabilityReport.svgFilter && capabilityReport.svgDisplacementMap,
  refraction: capabilityReport.svgDisplacementMap,
  dispersion: capabilityReport.svgDisplacementMap,
  backdropBlur: capabilityReport.backdropFilter,
  saturation: capabilityReport.cssFilter,
  tint: true,
  shadow: true,
  specular: true,
};
const plan = resolveRenderPlan({
  requested: canonicalizeOptions(requestedOptions),
  capabilities,
  capabilityReport,
  fallbackPolicy: requestedOptions.fallbackPolicy,
});
const instance = createLiquidGlass(host, requestedOptions);

export interface RuntimeMatrixSnapshot {
  readonly capabilityReport: CapabilityReport;
  readonly plan: Pick<RenderPlan, 'targetMode' | 'degraded' | 'degradationReason'>;
  readonly status: Readonly<LiquidGlassStatus>;
  readonly viewport: {
    readonly width: number;
    readonly height: number;
    readonly devicePixelRatio: number;
  };
}

export interface RuntimeMatrixTestHook {
  readonly getSnapshot: () => RuntimeMatrixSnapshot;
}

declare global {
  interface Window {
    __LIQUID_GLASS_RUNTIME_MATRIX__?: RuntimeMatrixTestHook;
  }
}

function cloneSnapshot(): RuntimeMatrixSnapshot {
  const status = instance.status;
  return {
    capabilityReport: {
      ...capabilityReport,
      knownRestrictions: [...capabilityReport.knownRestrictions],
    },
    plan: {
      targetMode: plan.targetMode,
      degraded: plan.degraded,
      ...(plan.degraded ? { degradationReason: plan.degradationReason } : {}),
    },
    status: {
      ...status,
      ...(status.lastOperation ? { lastOperation: { ...status.lastOperation } } : {}),
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    },
  };
}

window.__LIQUID_GLASS_RUNTIME_MATRIX__ = {
  getSnapshot: cloneSnapshot,
};

window.addEventListener('beforeunload', () => {
  instance.destroy();
  delete window.__LIQUID_GLASS_RUNTIME_MATRIX__;
});
