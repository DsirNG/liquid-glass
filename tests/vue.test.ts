import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, reactive, nextTick, createApp, h } from 'vue';
import { useLiquidGlass, LiquidGlass } from '../src/vue';
import { WebGLLiquidGlass } from '../src/vue-webgl';
import * as coreModule from '../src/core';
import * as webglModule from '../src/webgl';
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
    expect(createSpy).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ blur: 15 }));
    expect(compRef.value?.instance).toBe(mockInstance);

    app.unmount();
    root.remove();
  });

  it('mounts WebGLLiquidGlass component and initializes WebGL engine via template ref', async () => {
    const mockWebglInstance: LiquidGlassInstance = {
      renderer: 'webgl',
      isDestroyed: false,
      update: vi.fn(),
      destroy: vi.fn(),
      resize: vi.fn(),
    };
    const createWebglSpy = vi
      .spyOn(webglModule, 'createWebGLLiquidGlass')
      .mockReturnValue(mockWebglInstance);

    const root = document.createElement('div');
    document.body.appendChild(root);

    const compRef = ref<InstanceType<typeof WebGLLiquidGlass> | null>(null);
    const app = createApp({
      render() {
        return h(WebGLLiquidGlass, { ref: compRef, backgroundUrl: '/test.jpg' });
      },
    });

    app.mount(root);
    await nextTick();

    expect(createWebglSpy).toHaveBeenCalledTimes(1);
    expect(createWebglSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ backgroundUrl: '/test.jpg' })
    );
    expect(compRef.value?.instance).toBe(mockWebglInstance);

    app.unmount();
    root.remove();
  });
});



