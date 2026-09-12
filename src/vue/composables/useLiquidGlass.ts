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
  LiquidGlassStatus,
  LiquidGlassUpdateOptions,
} from '../../types';
import { createLiquidGlass } from '../../core';

export interface UseLiquidGlassReturn {
  instance: ShallowRef<LiquidGlassInstance | null>;
  update: (options: LiquidGlassUpdateOptions) => void;
  resize: () => void;
  destroy: () => void;
  getStatus: () => Readonly<LiquidGlassStatus> | undefined;
}

type CreationOnlySnapshot = Pick<LiquidGlassCreateOptions, 'fallbackPolicy' | 'interactive'>;

const CREATION_ONLY_KEYS = new Set<keyof CreationOnlySnapshot>(['fallbackPolicy', 'interactive']);

function extractUpdateOptions(
  options: LiquidGlassCreateOptions | undefined
): LiquidGlassUpdateOptions {
  if (!options) return {};

  const updateOptions: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (!CREATION_ONLY_KEYS.has(key as keyof CreationOnlySnapshot)) {
      updateOptions[key] = value;
    }
  }
  return updateOptions as LiquidGlassUpdateOptions;
}

function diffUpdateOptions(
  previous: LiquidGlassUpdateOptions,
  next: LiquidGlassUpdateOptions
): LiquidGlassUpdateOptions {
  const patch: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);

  for (const key of keys) {
    const previousValue = (previous as Record<string, unknown>)[key];
    const nextValue = (next as Record<string, unknown>)[key];
    if (!Object.is(previousValue, nextValue)) patch[key] = nextValue;
  }

  return patch as LiquidGlassUpdateOptions;
}

function extractCreationOnlyOptions(
  options: LiquidGlassCreateOptions | undefined
): CreationOnlySnapshot {
  return {
    fallbackPolicy: options?.fallbackPolicy,
    interactive: options?.interactive,
  };
}

function warnForCreationOnlyChanges(
  previous: CreationOnlySnapshot,
  next: CreationOnlySnapshot
): void {
  if (!import.meta.env?.DEV) return;

  for (const key of CREATION_ONLY_KEYS) {
    if (!Object.is(previous[key], next[key])) {
      console.warn(
        `[LiquidGlass/Vue] "${key}" is a creation-only option; remount LiquidGlass to apply the new value.`
      );
    }
  }
}

/** Binds the DOM-native Liquid Glass engine to a Vue element ref. */
export function useLiquidGlass(
  target: Ref<HTMLElement | null | undefined>,
  options?: MaybeRefOrGetter<LiquidGlassCreateOptions | undefined>
): UseLiquidGlassReturn {
  const instance = shallowRef<LiquidGlassInstance | null>(null);
  let previousUpdateOptions: LiquidGlassUpdateOptions = {};
  let previousCreationOnlyOptions: CreationOnlySnapshot = {};

  function initInstance(): void {
    const element = target.value;
    if (!element || instance.value) return;

    try {
      const currentOptions = toValue(options);
      instance.value = createLiquidGlass(element, currentOptions);
      previousUpdateOptions = extractUpdateOptions(currentOptions);
      previousCreationOnlyOptions = extractCreationOnlyOptions(currentOptions);
    } catch (error) {
      console.error('[LiquidGlass/Vue] Failed to initialize instance:', error);
    }
  }

  function cleanupInstance(): void {
    instance.value?.destroy();
    instance.value = null;
    previousUpdateOptions = {};
    previousCreationOnlyOptions = {};
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

        const nextUpdateOptions = extractUpdateOptions(newOptions);
        const nextCreationOnlyOptions = extractCreationOnlyOptions(newOptions);
        warnForCreationOnlyChanges(previousCreationOnlyOptions, nextCreationOnlyOptions);

        const patch = diffUpdateOptions(previousUpdateOptions, nextUpdateOptions);
        if (Object.keys(patch).length > 0) instance.value.update(patch);

        previousUpdateOptions = nextUpdateOptions;
        previousCreationOnlyOptions = nextCreationOnlyOptions;
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
    getStatus: () => instance.value?.status,
  };
}
