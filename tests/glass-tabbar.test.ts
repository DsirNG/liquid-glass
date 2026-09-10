import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import { GlassTabBar } from '../src/vue';
import * as coreModule from '../src/core';
import type { LiquidGlassInstance } from '../src/types';

function createMockInstance(): LiquidGlassInstance {
  return {
    renderer: 'dom',
    isDestroyed: false,
    update: vi.fn(),
    destroy: vi.fn(),
    resize: vi.fn(),
  };
}

describe('vue/GlassTabBar', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
        expect.objectContaining({ radius: 36, interactive: false }),
        expect.objectContaining({ radius: 30, interactive: false }),
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
    expect(click).toHaveBeenCalledWith(expect.objectContaining({ label: 'Home' }), 0, expect.any(MouseEvent));
    expect(createSpy).toHaveBeenCalledTimes(2);

    app.unmount();
    root.remove();
  });
});
