// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { LiquidGlass } from '../../src/vue';
import * as coreModule from '../../src/core';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Vue LiquidGlass SSR contract', () => {
  it('renders without creating a Core instance or requiring browser globals', async () => {
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass');
    const app = createSSRApp({
      render: () =>
        h(
          LiquidGlass,
          {
            fallbackPolicy: 'preserve',
            interactive: false,
          },
          () => h('button', { type: 'button' }, 'Continue')
        ),
    });

    const html = await renderToString(app);

    expect(html).toContain('Continue');
    expect(createSpy).not.toHaveBeenCalled();
  });
});
