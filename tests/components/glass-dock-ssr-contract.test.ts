// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { GlassDock } from '../../src/vue';
import * as coreModule from '../../src/core';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GlassDock SSR contract', () => {
  it('renders the toolbar and item content without creating Core or reading browser globals', async () => {
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass');
    const app = createSSRApp({
      render: () =>
        h(
          GlassDock,
          {
            items: [
              { value: 'home', label: 'Home' },
              { value: 'settings', label: 'Settings', disabled: true },
            ],
            modelValue: 'home',
            orientation: 'vertical',
            fallbackPolicy: 'preserve',
            id: 'ssr-dock',
            'aria-label': 'SSR dock',
          },
          {
            item: ({ item }) => h('span', { class: 'ssr-item' }, item.label),
          }
        ),
    });

    const html = await renderToString(app);

    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-orientation="vertical"');
    expect(html).toContain('ssr-dock');
    expect(html).toContain('aria-label="SSR dock"');
    expect(html).toContain('Home');
    expect(html).toContain('Settings');
    expect(createSpy).not.toHaveBeenCalled();
  });
});
