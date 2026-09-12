import { createLiquidGlass } from '../../dist/core/index.js';
import type {
  FallbackPolicy,
  LiquidGlassCreateOptions,
  LiquidGlassInstance,
  LiquidGlassStatus,
  LiquidGlassUpdateOptions,
} from '../../dist/core/index.js';

declare const element: HTMLElement;

const createOptions: LiquidGlassCreateOptions = {
  materialPreset: 'pure',
  fallbackPolicy: 'auto',
  capability: 'material',
  interactive: true,
};
const updateOptions: LiquidGlassUpdateOptions = {
  capability: 'auto',
  materialPreset: 'ios',
  surfaceProfile: 'convex_squircle',
  refraction: 0.8,
};

const glass: LiquidGlassInstance = createLiquidGlass(element, createOptions);
const status: Readonly<LiquidGlassStatus> = glass.status;
const policy: FallbackPolicy = 'preserve';

glass.update(updateOptions);
glass.resize();
glass.destroy();

void status;
void policy;

// @ts-expect-error `preset` is not part of the frozen creation contract.
createLiquidGlass(element, { preset: 'pure' });

// @ts-expect-error `fallbackPolicy` is creation-only and not an update option.
glass.update({ fallbackPolicy: 'auto' });

// @ts-expect-error `interactive` is creation-only and not an update option.
glass.update({ interactive: false });
