import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, reactive, nextTick } from 'vue';
import { useLiquidGlass } from '../src/vue/useLiquidGlass';
import * as coreModule from '../src/core';
import * as browserUtils from '../src/utils/browser';
import type { LiquidGlassInstance, LiquidGlassOptions } from '../src/types';

describe('vue/useLiquidGlass', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(browserUtils, 'supportsWebGLRenderer').mockReturnValue(true);
    vi.spyOn(browserUtils, 'supportsSvgRenderer').mockReturnValue(true);
  });

  it('updates instance when regular options change, without recreating', async () => {
    const mockUpdate = vi.fn();
    const mockDestroy = vi.fn();
    const mockResize = vi.fn();

    const mockInstance: LiquidGlassInstance = {
      renderer: 'svg',
      isDestroyed: false,
      update: mockUpdate,
      destroy: mockDestroy,
      resize: mockResize,
    };

    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(mockInstance);

    const el = document.createElement('div');
    const targetRef = ref<HTMLElement>(el);
    const options = reactive<LiquidGlassOptions>({
      renderer: 'svg',
      blur: 10,
    });

    const { renderer, instance } = useLiquidGlass(targetRef, options);

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(renderer.value).toBe('svg');
    expect(instance.value).toBe(mockInstance);

    // Update normal property
    options.blur = 20;
    await nextTick();

    // Should call update, NOT recreate
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ blur: 20 }));
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(mockDestroy).not.toHaveBeenCalled();
  });

  it('destroys and recreates instance when physical renderer engine changes', async () => {
    const mockSvgDestroy = vi.fn();
    const mockSvgInstance: LiquidGlassInstance = {
      renderer: 'svg',
      isDestroyed: false,
      update: vi.fn(),
      destroy: mockSvgDestroy,
      resize: vi.fn(),
    };

    const mockWebGLDestroy = vi.fn();
    const mockWebGLInstance: LiquidGlassInstance = {
      renderer: 'webgl',
      isDestroyed: false,
      update: vi.fn(),
      destroy: mockWebGLDestroy,
      resize: vi.fn(),
    };

    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockImplementation((_, opts) => {
      if (opts?.renderer === 'webgl') {
        return mockWebGLInstance;
      }
      return mockSvgInstance;
    });

    const el = document.createElement('div');
    const targetRef = ref<HTMLElement>(el);
    const options = reactive<LiquidGlassOptions>({
      renderer: 'svg',
      blur: 10,
    });

    const { renderer, instance } = useLiquidGlass(targetRef, options);

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(renderer.value).toBe('svg');
    expect(instance.value).toBe(mockSvgInstance);

    // Switch engine to webgl
    options.renderer = 'webgl';
    await nextTick();

    // Old instance destroyed, new instance created!
    expect(mockSvgDestroy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(renderer.value).toBe('webgl');
    expect(instance.value).toBe(mockWebGLInstance);
  });
});
