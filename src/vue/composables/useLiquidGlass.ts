import {
  shallowRef,
  watch,
  onUnmounted,
  toValue,
  type Ref,
  type ShallowRef,
  type MaybeRefOrGetter,
} from 'vue';
import type {
  LiquidGlassCreateOptions,
  LiquidGlassInstance,
  LiquidGlassUpdateOptions,
} from '../../types';
import { createLiquidGlass } from '../../core';


export interface UseLiquidGlassReturn {
  instance: ShallowRef<LiquidGlassInstance | null>;
  update: (options: LiquidGlassUpdateOptions) => void;
  resize: () => void;
  destroy: () => void;
}

/** Binds the DOM-native Liquid Glass engine to a Vue element ref. */
export function useLiquidGlass(
  target: Ref<HTMLElement | null | undefined>,
  options?: MaybeRefOrGetter<LiquidGlassCreateOptions | undefined>
): UseLiquidGlassReturn {
  const instance = shallowRef<LiquidGlassInstance | null>(null);

  function initInstance(): void {
    const element = target.value;
    if (!element || instance.value) return;

    try {
      instance.value = createLiquidGlass(element, toValue(options));
    } catch (error) {
      console.error('[LiquidGlass/Vue] Failed to initialize instance:', error);
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
