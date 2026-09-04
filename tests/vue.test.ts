import { describe, it, expect, vi } from 'vitest';
import { ref, reactive, nextTick } from 'vue';
import { useLiquidGlass } from '../src/vue/useLiquidGlass';
import * as coreModule from '../src/core';
import type { LiquidGlassInstance, LiquidGlassOptions } from '../src/types';

describe('vue/useLiquidGlass', () => {
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
});
