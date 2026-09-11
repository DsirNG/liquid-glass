import { createLiquidGlass } from '../src/core';
import type { FallbackPolicy, LiquidGlassStatus } from '../src/core';

declare const element: HTMLElement;

const glass = createLiquidGlass(element, {
  materialPreset: 'pure',
  fallbackPolicy: 'auto',
  surfaceProfile: 'convex_squircle',
});

const status: Readonly<LiquidGlassStatus> = glass.status;
const policies: readonly FallbackPolicy[] = ['auto', 'preserve', 'strict'];

glass.update({
  refraction: 0.8,
  surfaceProfile: 'convex_squircle',
  surfaceShape: 'convex_circle',
});
glass.resize();
glass.destroy();

void status;
void policies;

// @ts-expect-error `preset` is not part of the public options contract.
createLiquidGlass(element, { preset: 'pure' });

// @ts-expect-error `fallbackPolicy` is a creation-only option.
glass.update({ fallbackPolicy: 'auto' });
