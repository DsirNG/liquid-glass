// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { LiquidGlass } from '../../src/react';
import * as coreModule from '../../src/core';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('React LiquidGlass SSR contract', () => {
  it('renders without creating a Core instance or requiring browser globals', async () => {
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass');
    const html = renderToString(
      createElement(
        LiquidGlass,
        {
          fallbackPolicy: 'preserve',
          interactive: false,
        },
        createElement('button', { type: 'button' }, 'Continue')
      )
    );

    expect(html).toContain('Continue');
    expect(createSpy).not.toHaveBeenCalled();
  });
});
