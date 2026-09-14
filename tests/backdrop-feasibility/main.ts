import { createLiquidGlass } from '../../src/core';
import { OpticalFieldGenerator } from '../../src/engine/svg/OpticalFieldGenerator';
import { SvgFilterBuilder } from '../../src/engine/svg/SvgFilterBuilder';
import './styles.css';

type FeasibilityScene = 'split-background' | 'dynamic-background' | 'moving-background';

interface RuntimeStatusSnapshot {
  targetMode: string | null;
  activeMode: string | null;
  phase: string;
  degraded: boolean;
  degradationReason?: string;
  runtimeReason?: string;
  recoveryMode?: string;
}

interface FeasibilityState {
  ready: boolean;
  scene: FeasibilityScene;
  runtimeInstanceCount: number;
  fieldGenerationCount: number;
  runtimeFilterId: string;
  runtimeFilterSignature: string;
  runtimeFilterMutationCount: number;
  status: RuntimeStatusSnapshot;
  setDynamicBackground: (mode: 'dark' | 'light') => void;
  setMovingPosition: (position: number) => void;
}

declare global {
  interface Window {
    __backdropFeasibility?: FeasibilityState;
  }
}

const scene = (new URLSearchParams(window.location.search).get('scene') ??
  'split-background') as FeasibilityScene;
const supportedScenes = new Set<FeasibilityScene>([
  'split-background',
  'dynamic-background',
  'moving-background',
]);
const selectedScene = supportedScenes.has(scene) ? scene : 'split-background';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Adaptive backdrop feasibility app root is missing.');

app.innerHTML = `
  <main class="feasibility-fixture" data-scene="${selectedScene}" data-ready="false">
    <div class="feasibility-backdrop" data-feasibility-backdrop></div>
    <div
      class="feasibility-signal"
      data-feasibility-signal
      aria-label="Adaptive backdrop signal"
    ></div>
  </main>
  <svg width="0" height="0" aria-hidden="true">
    <defs data-feasibility-probe-defs></defs>
  </svg>
`;

const fixture = app.querySelector<HTMLElement>('.feasibility-fixture');
const backdrop = app.querySelector<HTMLElement>('[data-feasibility-backdrop]');
const signal = app.querySelector<HTMLElement>('[data-feasibility-signal]');
if (!fixture || !backdrop || !signal) {
  throw new Error('Adaptive backdrop feasibility fixture elements are missing.');
}

const originalGenerate = OpticalFieldGenerator.generate;
let fieldGenerationCount = 0;
OpticalFieldGenerator.generate = async (...args: Parameters<typeof originalGenerate>) => {
  fieldGenerationCount += 1;
  return originalGenerate(...args);
};

const glass = createLiquidGlass(signal, {
  materialPreset: 'pure',
  capability: 'full',
  fallbackPolicy: 'strict',
  interactive: false,
  blur: 0,
  opacity: 0,
  tint: 'rgba(0, 0, 0, 0)',
  radius: 28,
  bezel: 28,
  refraction: 0.8,
  dispersion: 1.2,
  thickness: 40,
  ior: 2.2,
  shadow: 0,
  specular: 0,
  colorBleed: 0,
});

function pickStatus(): RuntimeStatusSnapshot {
  const status = glass.status;
  return {
    targetMode: status.targetMode,
    activeMode: status.activeMode,
    phase: status.phase,
    degraded: status.degraded,
    degradationReason: status.degradationReason,
    runtimeReason: status.runtimeReason,
    recoveryMode: status.recoveryMode,
  };
}

function waitForReady(): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 15000;
    const check = () => {
      const status = pickStatus();
      if (status.phase === 'failed') {
        reject(new Error(`Full optical feasibility probe failed: ${JSON.stringify(status)}`));
        return;
      }
      if (status.phase === 'ready' && status.activeMode === 'full-optical') {
        resolve();
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error(`Timed out waiting for full optical runtime: ${JSON.stringify(status)}`));
        return;
      }
      window.setTimeout(check, 25);
    };
    check();
  });
}

function resolveFilterId(value: string): string | null {
  const match = value.match(/url\(["']?#?([^)'"\s]+)["']?\)/);
  return match?.[1] ?? null;
}

function hashText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function installDiagnosticFilter(runtimeFilter: SVGFilterElement, output: 'luma' | 'range') {
  const probeFilter = runtimeFilter.cloneNode(true) as SVGFilterElement;
  const probeFilterId = `${runtimeFilter.id}-adaptive-${output}`;
  probeFilter.id = probeFilterId;

  const outputResult = output === 'luma' ? 'ADAPTIVE_LUMA' : 'ADAPTIVE_LOCAL_RANGE';
  probeFilter.insertAdjacentHTML(
    'beforeend',
    `${SvgFilterBuilder.buildAdaptiveVisibilityFeasibilityGraph()}
      <feColorMatrix
        in="${outputResult}"
        type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 1 0"
        result="ADAPTIVE_DIAGNOSTIC_OUTPUT"
      />`
  );

  runtimeFilter.parentNode?.appendChild(probeFilter);
  signal.style.backdropFilter = `url("#${probeFilterId}")`;
  (signal.style as unknown as Record<string, string>).webkitBackdropFilter =
    `url("#${probeFilterId}")`;
  return probeFilterId;
}

await waitForReady();

const runtimeFilterId = resolveFilterId(signal.style.backdropFilter);
if (!runtimeFilterId) throw new Error('Full optical runtime filter id is missing.');

const runtimeFilter = document.getElementById(runtimeFilterId);
if (!(runtimeFilter instanceof SVGFilterElement)) {
  throw new Error(`Full optical runtime filter ${runtimeFilterId} is missing.`);
}

const output = selectedScene === 'dynamic-background' ? 'luma' : 'range';
const probeFilterId = installDiagnosticFilter(runtimeFilter, output);
const runtimeFilterSignature = hashText(runtimeFilter.innerHTML);
let runtimeFilterMutationCount = 0;
const runtimeFilterObserver = new MutationObserver(() => {
  runtimeFilterMutationCount += 1;
});
runtimeFilterObserver.observe(runtimeFilter, {
  attributes: true,
  childList: true,
  characterData: true,
  subtree: true,
});

if (selectedScene === 'dynamic-background') {
  backdrop.style.background = '#151a2d';
} else if (selectedScene === 'moving-background') {
  fixture.style.setProperty('--split-position', '35%');
}

fixture.dataset.ready = 'true';

function currentState(): FeasibilityState {
  return {
    ready: fixture.dataset.ready === 'true',
    scene: selectedScene,
    runtimeInstanceCount: 1,
    fieldGenerationCount,
    runtimeFilterId,
    runtimeFilterSignature,
    runtimeFilterMutationCount,
    status: pickStatus(),
    setDynamicBackground: (mode) => {
      backdrop.style.background = mode === 'light' ? '#f7fbff' : '#151a2d';
    },
    setMovingPosition: (position) => {
      fixture.style.setProperty('--split-position', `${Math.max(10, Math.min(90, position))}%`);
    },
  };
}

window.__backdropFeasibility = currentState();
window.__backdropFeasibility.setDynamicBackground = (mode) => {
  backdrop.style.background = mode === 'light' ? '#f7fbff' : '#151a2d';
};
window.__backdropFeasibility.setMovingPosition = (position) => {
  fixture.style.setProperty('--split-position', `${Math.max(10, Math.min(90, position))}%`);
};

// Keep the state object live without introducing any sampling or runtime work.
window.setInterval(() => {
  const state = window.__backdropFeasibility;
  if (!state) return;
  state.ready = fixture.dataset.ready === 'true';
  state.fieldGenerationCount = fieldGenerationCount;
  state.runtimeFilterMutationCount = runtimeFilterMutationCount;
  state.status = pickStatus();
}, 25);

void probeFilterId;
