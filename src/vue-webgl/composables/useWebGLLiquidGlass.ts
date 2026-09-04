import {
  shallowRef,
  watch,
  onUnmounted,
  toValue,
  type Ref,
  type ShallowRef,
  type MaybeRefOrGetter,
} from 'vue';
import type { LiquidGlassInstance, LiquidGlassUpdateOptions, WebGLCreateOptions } from '../../types';
import { createWebGLLiquidGlass } from '../../webgl';


export interface UseWebGLLiquidGlassReturn {
  instance: ShallowRef<LiquidGlassInstance | null>;
  update: (options: LiquidGlassUpdateOptions) => void;
  resize: () => void;
  destroy: () => void;
}

/** Binds the optional WebGL implementation to a Vue element ref. */
export function useWebGLLiquidGlass(
  target: Ref<HTMLElement | null | undefined>,
  options?: MaybeRefOrGetter<WebGLCreateOptions | undefined>
): UseWebGLLiquidGlassReturn {
  const instance = shallowRef<LiquidGlassInstance | null>(null);
  let currentBackgroundUrl = toValue(options)?.backgroundUrl;

  function initInstance(): void {
    const element = target.value;
    if (!element || instance.value) return;
    try {
      const resolvedOptions = toValue(options);
      currentBackgroundUrl = resolvedOptions?.backgroundUrl;
      instance.value = createWebGLLiquidGlass(element, resolvedOptions);
    } catch (error) {
      console.error('[LiquidGlass/Vue-WebGL] Failed to initialize instance:', error);
    }
  }

  function cleanupInstance(): void {
    instance.value?.destroy();
    instance.value = null;
  }

  watch(
    () => target.value,
    (element) => {
      if (element) initInstance();
      else cleanupInstance();
    },
    { immediate: true }
  );

  if (options != null) {
    watch(
      () => toValue(options),
      (newOptions) => {
        if (!instance.value) {
          initInstance();
          return;
        }
        if (newOptions?.backgroundUrl !== currentBackgroundUrl) {
          cleanupInstance();
          initInstance();
          return;
        }
        if (newOptions) instance.value.update(newOptions);
      },
      { deep: true }
    );
  }

  onUnmounted(cleanupInstance);

  return {
    instance,
    update: (newOptions) => instance.value?.update(newOptions),
    resize: () => instance.value?.resize(),
    destroy: cleanupInstance,
  };
}
