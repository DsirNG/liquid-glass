import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, reactive, nextTick, createApp, h } from 'vue';
import { useLiquidGlass, LiquidGlass } from '../src/vue';
import * as coreModule from '../src/core';
import type { LiquidGlassInstance, LiquidGlassOptions } from '../src/types';

describe('vue/useLiquidGlass and Vue Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('updates material options without recreating the DOM engine', async () => {
    const mockUpdate = vi.fn();
    const mockInstance: LiquidGlassInstance = {
      renderer: 'dom',
      isDestroyed: false,
      update: mockUpdate,
      destroy: vi.fn(),
      resize: vi.fn(),
    };
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(mockInstance);
    const target = ref<HTMLElement>(document.createElement('div'));
    const options = reactive<LiquidGlassOptions>({ blur: 10 });
    const { instance } = useLiquidGlass(target, options);

    expect(instance.value).toBe(mockInstance);
    options.blur = 20;
    await nextTick();
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ blur: 20 }));
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('mounts LiquidGlass component and initializes DOM engine via template ref', async () => {
    const mockInstance: LiquidGlassInstance = {
      renderer: 'dom',
      isDestroyed: false,
      update: vi.fn(),
      destroy: vi.fn(),
      resize: vi.fn(),
    };
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(mockInstance);

    const root = document.createElement('div');
    document.body.appendChild(root);

    const compRef = ref<InstanceType<typeof LiquidGlass> | null>(null);
    const app = createApp({
      render() {
        return h(LiquidGlass, { ref: compRef, blur: 15 });
      },
    });

    app.mount(root);
    await nextTick();

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ blur: 15 })
    );
    expect(compRef.value?.instance).toBe(mockInstance);

    app.unmount();
    root.remove();
  });

  it('forwards changes from a reactive options object to the existing engine', async () => {
    const mockInstance: LiquidGlassInstance = {
      renderer: 'dom',
      isDestroyed: false,
      update: vi.fn(),
      destroy: vi.fn(),
      resize: vi.fn(),
    };
    vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(mockInstance);

    const options = reactive<LiquidGlassOptions>({ blur: 1, opacity: 0.1 });
    const root = document.createElement('div');
    document.body.appendChild(root);
    const app = createApp({
      render() {
        return h(LiquidGlass, { options });
      },
    });

    app.mount(root);
    await nextTick();
    options.blur = 9;
    await nextTick();

    expect(mockInstance.update).toHaveBeenCalledWith(expect.objectContaining({ blur: 9 }));

    app.unmount();
    root.remove();
  });
});
