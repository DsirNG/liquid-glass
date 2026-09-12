import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import { GlassButton, GlassTabBar, LiquidGlass } from '../../src/vue';
import * as coreModule from '../../src/core';
import type { LiquidGlassInstance } from '../../src/types';

function createMockInstance(): LiquidGlassInstance {
  return {
    renderer: 'dom',
    isDestroyed: false,
    status: { targetMode: null, activeMode: null, phase: 'initializing', degraded: false },
    update: vi.fn(),
    resize: vi.fn(),
    destroy: vi.fn(),
  };
}

describe('component foundation contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exports the canonical Vue component names', () => {
    expect(LiquidGlass).toBeDefined();
    expect(GlassButton).toBeDefined();
    expect(GlassTabBar).toBeDefined();
  });

  it('keeps GlassButton common props, attrs, slot content, and status access aligned', async () => {
    const instance = createMockInstance();
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const root = document.createElement('div');
    document.body.appendChild(root);

    const app = createApp({
      render() {
        return h(
          GlassButton,
          {
            options: { blur: 1, tint: '#ffffff' },
            blur: 4,
            fallbackPolicy: 'preserve',
            class: 'custom-button',
            id: 'foundation-button',
            'aria-label': 'Continue',
            'data-contract': 'component-foundation',
          },
          () => 'Continue'
        );
      },
    });

    app.mount(root);
    await nextTick();

    const button = root.querySelector('button');
    expect(createSpy).toHaveBeenCalledWith(
      expect.any(HTMLButtonElement),
      expect.objectContaining({ blur: 4, tint: '#ffffff', fallbackPolicy: 'preserve' })
    );
    expect(button?.classList.contains('custom-button')).toBe(true);
    expect(button?.id).toBe('foundation-button');
    expect(button?.getAttribute('aria-label')).toBe('Continue');
    expect(button?.dataset.contract).toBe('component-foundation');
    expect(button?.textContent).toContain('Continue');

    app.unmount();
    root.remove();
  });

  it('gives GlassTabBar explicit tab semantics and keyboard navigation', async () => {
    const createSpy = vi
      .spyOn(coreModule, 'createLiquidGlass')
      .mockReturnValueOnce(createMockInstance())
      .mockReturnValueOnce(createMockInstance());
    const root = document.createElement('div');
    document.body.appendChild(root);

    const app = createApp({
      render() {
        return h(
          GlassTabBar,
          {
            items: [
              { value: 'home', label: 'Home', active: true },
              { value: 'settings', label: 'Settings', disabled: true },
              { value: 'profile', label: 'Profile' },
            ],
          },
          {
            prefix: () => h('span', { class: 'prefix' }, 'Brand'),
            item: ({ item }) => h('span', { class: 'custom-item' }, item.label),
            suffix: () => h('span', { class: 'suffix' }, 'Actions'),
          }
        );
      },
    });

    app.mount(root);
    await nextTick();

    const tablist = root.querySelector('[role="tablist"]');
    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(tablist).not.toBeNull();
    expect(tabs).toHaveLength(3);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].tabIndex).toBe(0);
    expect(tabs[1].getAttribute('aria-disabled')).toBe('true');
    expect(tabs[1].disabled).toBe(true);
    expect(tabs[1].tabIndex).toBe(-1);
    expect(tabs[2].tabIndex).toBe(-1);
    expect(root.querySelector('.prefix')?.textContent).toBe('Brand');
    expect(root.querySelector('.custom-item')?.textContent).toBe('Home');
    expect(root.querySelector('.suffix')?.textContent).toBe('Actions');

    tabs[0].focus();
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(tabs[2]);

    app.unmount();
    root.remove();
  });
});
