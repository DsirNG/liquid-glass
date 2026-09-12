// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { GlassButton, GlassTabBar, LiquidGlass } from '../../src/vue';
import * as coreModule from '../../src/core';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('component foundation SSR contract', () => {
  it('renders all current Vue components without creating Core instances', async () => {
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass');
    const app = createSSRApp({
      render: () =>
        h('main', [
          h(LiquidGlass, null, { default: () => h('span', 'Surface') }),
          h(GlassButton, null, { default: () => 'Continue' }),
          h(GlassTabBar, {
            items: [
              { value: 'home', label: 'Home', active: true },
              { value: 'settings', label: 'Settings' },
            ],
          }),
        ]),
    });

    const html = await renderToString(app);

    expect(html).toContain('Surface');
    expect(html).toContain('Continue');
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(createSpy).not.toHaveBeenCalled();
  });
});
