// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { GlassCard } from '../../src/vue';
import * as coreModule from '../../src/core';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Vue GlassCard SSR contract', () => {
  it('renders slots and attrs without creating Core or requiring browser globals', async () => {
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass');
    const app = createSSRApp({
      render: () =>
        h(
          GlassCard,
          {
            size: 'md',
            interactive: true,
            fallbackPolicy: 'preserve',
            id: 'ssr-card',
            'aria-label': 'SSR card',
          },
          {
            header: () => h('h2', 'Header'),
            default: () => h('p', 'Body'),
            footer: () => h('small', 'Footer'),
          }
        ),
    });

    const html = await renderToString(app);

    expect(html).toContain('ssr-card');
    expect(html).toContain('aria-label="SSR card"');
    expect(html).toContain('glass-card__header');
    expect(html).toContain('glass-card__body');
    expect(html).toContain('glass-card__footer');
    expect(html).toContain('Header');
    expect(html).toContain('Body');
    expect(html).toContain('Footer');
    expect(createSpy).not.toHaveBeenCalled();
  });
});
