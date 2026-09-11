import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick, createApp, h } from 'vue';
import { GlassButton } from '../src/vue';
import * as coreModule from '../src/core';
import type { LiquidGlassInstance } from '../src/types';

describe('vue/GlassButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('mounts GlassButton and initializes DOM engine with variant and size defaults', async () => {
    const mockInstance: LiquidGlassInstance = {
      renderer: 'dom',
      isDestroyed: false,
      status: { targetMode: null, activeMode: null, phase: 'initializing', degraded: false },
      update: vi.fn(),
      destroy: vi.fn(),
      resize: vi.fn(),
    };
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(mockInstance);

    const root = document.createElement('div');
    document.body.appendChild(root);

    const btnRef = ref<InstanceType<typeof GlassButton> | null>(null);
    const app = createApp({
      render() {
        return h(
          GlassButton,
          {
            ref: btnRef,
            variant: 'primary',
            size: 'lg',
          },
          () => 'Action'
        );
      },
    });

    app.mount(root);
    await nextTick();

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(
      expect.any(HTMLButtonElement),
      expect.objectContaining({
        radius: 24, // lg radius
        bezel: 20, // lg bezel
        tint: '#8b7cf7', // primary tint
      })
    );
    expect(btnRef.value?.instance).toBe(mockInstance);

    const btnEl = root.querySelector('button');
    expect(btnEl).not.toBeNull();
    expect(btnEl?.classList.contains('lg-glass-button')).toBe(true);
    expect(btnEl?.classList.contains('lg-btn-size-lg')).toBe(true);
    expect(btnEl?.classList.contains('lg-btn-variant-primary')).toBe(true);
    expect(btnEl?.textContent).toContain('Action');

    app.unmount();
    root.remove();
  });

  it('emits click event on user click', async () => {
    const mockInstance: LiquidGlassInstance = {
      renderer: 'dom',
      isDestroyed: false,
      status: { targetMode: null, activeMode: null, phase: 'initializing', degraded: false },
      update: vi.fn(),
      destroy: vi.fn(),
      resize: vi.fn(),
    };
    vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(mockInstance);

    const root = document.createElement('div');
    document.body.appendChild(root);

    const handleClick = vi.fn();
    const app = createApp({
      render() {
        return h(GlassButton, { onClick: handleClick }, () => 'Click Me');
      },
    });

    app.mount(root);
    await nextTick();

    const btnEl = root.querySelector('button');
    btnEl?.click();

    expect(handleClick).toHaveBeenCalledTimes(1);

    app.unmount();
    root.remove();
  });

  it('prevents click emission when disabled', async () => {
    const mockInstance: LiquidGlassInstance = {
      renderer: 'dom',
      isDestroyed: false,
      status: { targetMode: null, activeMode: null, phase: 'initializing', degraded: false },
      update: vi.fn(),
      destroy: vi.fn(),
      resize: vi.fn(),
    };
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(mockInstance);

    const root = document.createElement('div');
    document.body.appendChild(root);

    const handleClick = vi.fn();
    const app = createApp({
      render() {
        return h(GlassButton, { disabled: true, onClick: handleClick }, () => 'Disabled');
      },
    });

    app.mount(root);
    await nextTick();

    expect(createSpy).toHaveBeenCalledWith(
      expect.any(HTMLButtonElement),
      expect.objectContaining({
        interactive: false,
      })
    );

    const btnEl = root.querySelector('button');
    expect(btnEl?.disabled).toBe(true);
    expect(btnEl?.classList.contains('is-disabled')).toBe(true);

    btnEl?.click();
    expect(handleClick).not.toHaveBeenCalled();

    app.unmount();
    root.remove();
  });
});
