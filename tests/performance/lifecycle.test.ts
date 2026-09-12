import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLiquidGlass } from '../../src/core';
import { CapabilityProbe } from '../../src/engine';
import {
  ManagedOpticalFieldAssets,
  OpticalBackend,
  OpticalFieldGenerator,
} from '../../src/engine/svg';
import { createMaterialHost, waitForReady } from './helpers';

class CountingResizeObserver {
  public static active = 0;
  public static disconnects = 0;
  private connected = false;

  public constructor(_callback: ResizeObserverCallback) {}

  public observe(): void {
    if (this.connected) return;
    this.connected = true;
    CountingResizeObserver.active += 1;
  }

  public disconnect(): void {
    if (!this.connected) return;
    this.connected = false;
    CountingResizeObserver.active -= 1;
    CountingResizeObserver.disconnects += 1;
  }
}

afterEach(() => {
  CapabilityProbe.resetForTests();
  document.body.replaceChildren();
  CountingResizeObserver.active = 0;
  CountingResizeObserver.disconnects = 0;
  vi.restoreAllMocks();
});

describe('Phase 6E lifecycle contracts', () => {
  it('balances listeners, observers, optical assets, and DOM across 20 recreate cycles', async () => {
    const originalResizeObserver = (
      globalThis as typeof globalThis & {
        ResizeObserver?: typeof ResizeObserver;
      }
    ).ResizeObserver;
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: CountingResizeObserver,
    });

    const eventAdds = new Map<string, number>();
    const eventRemoves = new Map<string, number>();
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
    const addSpy = vi.spyOn(EventTarget.prototype, 'addEventListener');
    const removeSpy = vi.spyOn(EventTarget.prototype, 'removeEventListener');
    addSpy.mockImplementation(function (type, listener, options) {
      if (type.startsWith('pointer')) eventAdds.set(type, (eventAdds.get(type) ?? 0) + 1);
      originalAddEventListener.call(this, type, listener, options);
    });
    removeSpy.mockImplementation(function (type, listener, options) {
      if (type.startsWith('pointer')) eventRemoves.set(type, (eventRemoves.get(type) ?? 0) + 1);
      originalRemoveEventListener.call(this, type, listener, options);
    });

    const assetsDisposeSpy = vi.spyOn(ManagedOpticalFieldAssets.prototype, 'dispose');
    vi.spyOn(OpticalFieldGenerator, 'generate').mockImplementation(
      async (options) =>
        new ManagedOpticalFieldAssets({
          vectorUrl: `blob:vector-${options.revision ?? 0}`,
          basisUrl: `blob:basis-${options.revision ?? 0}`,
          fresnelMaskUrl: `blob:fresnel-${options.revision ?? 0}`,
          physicalAmplitude: 1,
          width: options.geometry.width,
          height: options.geometry.height,
          fieldScale: 1,
          revision: options.revision ?? 0,
        })
    );
    const prepareSpy = vi.spyOn(OpticalBackend.prototype, 'prepare');

    try {
      for (let index = 0; index < 20; index += 1) {
        const host = createMaterialHost(index);
        const instance = createLiquidGlass(host, {
          capability: 'full',
          interactive: true,
        });
        await waitForReady(instance);
        instance.destroy();
      }

      expect(prepareSpy).toHaveBeenCalledTimes(20);
      expect(assetsDisposeSpy).toHaveBeenCalledTimes(20);
      expect(CountingResizeObserver.active).toBe(0);
      expect(CountingResizeObserver.disconnects).toBe(20);
      expect([...eventAdds.entries()]).toEqual(expect.arrayContaining([...eventRemoves.entries()]));
      expect([...eventRemoves.entries()]).toEqual(expect.arrayContaining([...eventAdds.entries()]));
      expect(
        document.querySelectorAll('.lg-root, .lg-backdrop, .lg-material, .lg-border').length
      ).toBe(0);
      expect(document.querySelectorAll('#liquid-glass-svg-root filter').length).toBe(0);
    } finally {
      Object.defineProperty(globalThis, 'ResizeObserver', {
        configurable: true,
        value: originalResizeObserver,
      });
    }
  });
});
