import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import { GlassTabBar } from '../src/vue';
import * as coreModule from '../src/core';
import type { LiquidGlassInstance } from '../src/types';

function createMockInstance(): LiquidGlassInstance {
  return {
    renderer: 'dom',
    isDestroyed: false,
    status: { targetMode: null, activeMode: null, phase: 'initializing', degraded: false },
    update: vi.fn(),
    destroy: vi.fn(),
    resize: vi.fn(),
  };
}

describe('vue/GlassTabBar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves the oversized hover lens and press bounce', async () => {
    vi.spyOn(coreModule, 'createLiquidGlass').mockImplementation(() => createMockInstance());
    const root = document.createElement('div');
    document.body.appendChild(root);
    const app = createApp({
      render: () =>
        h(GlassTabBar, {
          height: 72,
          itemWidth: 100,
          items: [
            { value: 'home', label: 'Home', active: true },
            { value: 'search', label: 'Search' },
          ],
        }),
    });
    app.mount(root);
    await nextTick();
    const shell = root.querySelector<HTMLElement>('.glass-tabbar-shell')!;
    expect(parseFloat(shell.style.getPropertyValue('--lens-hover-height'))).toBe(82);
    expect(parseFloat(shell.style.getPropertyValue('--lens-hover-width'))).toBeGreaterThan(100);
    const button = root.querySelectorAll('button')[1];
    button.dispatchEvent(new MouseEvent('pointerenter', { clientX: 100 }));
    await nextTick();
    expect(root.querySelector('.glass-tabbar__lens')?.classList.contains('is-hovering')).toBe(true);
    button.click();
    await nextTick();
    expect(root.querySelector('.glass-tabbar__lens')?.classList.contains('is-bouncing')).toBe(true);
    shell.dispatchEvent(new MouseEvent('pointerleave'));
    await nextTick();
    expect(root.querySelector('.glass-tabbar__lens')?.classList.contains('is-hovering')).toBe(
      false
    );
    app.unmount();
    root.remove();
  });

  it('creates an outer glass surface and a separate active lens', async () => {
    const createSpy = vi
      .spyOn(coreModule, 'createLiquidGlass')
      .mockReturnValueOnce(createMockInstance())
      .mockReturnValueOnce(createMockInstance());
    const root = document.createElement('div');
    document.body.appendChild(root);

    const app = createApp({
      render() {
        return h(GlassTabBar, {
          items: [
            { value: 'home', label: 'Home' },
            { value: 'settings', label: 'Settings', active: true },
          ],
          height: 72,
          itemWidth: 100,
        });
      },
    });

    app.mount(root);
    await nextTick();

    expect(createSpy).toHaveBeenCalledTimes(2);
    const createOptions = createSpy.mock.calls.map((call) => call[1]);
    expect(createOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ radius: 36, interactive: false, refractionCoverage: 'full' }),
        expect.objectContaining({ radius: 30, interactive: false, refractionCoverage: 'full' }),
      ])
    );
    expect(root.querySelector('.glass-tabbar')).not.toBeNull();
    expect(root.querySelector('.glass-tabbar__lens')).not.toBeNull();
    expect(root.querySelectorAll('.glass-tabbar__item')[1].classList.contains('is-selected')).toBe(
      true
    );

    app.unmount();
    root.remove();
  });

  it('emits clicks without owning navigation state and keeps disabled items inert', async () => {
    const createSpy = vi
      .spyOn(coreModule, 'createLiquidGlass')
      .mockReturnValueOnce(createMockInstance())
      .mockReturnValueOnce(createMockInstance());
    const root = document.createElement('div');
    document.body.appendChild(root);
    const click = vi.fn();

    const app = createApp({
      render() {
        return h(GlassTabBar, {
          items: [
            { value: 'home', label: 'Home', active: true },
            { value: 'settings', label: 'Settings', disabled: true },
          ],
          onClick: click,
        });
      },
    });

    app.mount(root);
    await nextTick();
    const buttons = root.querySelectorAll('button');
    buttons[1].click();
    expect(click).not.toHaveBeenCalled();

    buttons[0].click();
    expect(click).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Home' }),
      0,
      expect.any(MouseEvent)
    );
    expect(createSpy).toHaveBeenCalledTimes(2);

    app.unmount();
    root.remove();
  });
});
