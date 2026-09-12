import { createElement } from 'react';
import {
  LiquidGlass,
  type LiquidGlassHandle,
  type LiquidGlassProps,
} from '../../dist/react/index.js';

const props: LiquidGlassProps = {
  materialPreset: 'pure',
  fallbackPolicy: 'auto',
  capability: 'material',
  refraction: 0.8,
  interactive: true,
};
const handle = null as unknown as LiquidGlassHandle;

createElement(LiquidGlass, props, 'Continue');
handle.getStatus();
handle.update({ capability: 'auto', refraction: 0.6 });
handle.resize();
handle.destroy();

// @ts-expect-error `preset` is not part of the frozen React prop contract.
createElement(LiquidGlass, { preset: 'pure' });

// @ts-expect-error `fallbackPolicy` is creation-only and not an update option.
handle.update({ fallbackPolicy: 'auto' });

// @ts-expect-error `interactive` is creation-only and not an update option.
handle.update({ interactive: false });
