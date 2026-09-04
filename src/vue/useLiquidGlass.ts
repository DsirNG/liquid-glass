import {
  shallowRef,
  ref,
  watch,
  onMounted,
  onUnmounted,
  toValue,
  type Ref,
  type ShallowRef,
  type MaybeRefOrGetter,
} from 'vue';
import type {
  LiquidGlassInstance,
  LiquidGlassCreateOptions,
  LiquidGlassUpdateOptions,
  ResolvedRendererType,
} from '../types';
import { createLiquidGlass } from '../core';

export interface UseLiquidGlassReturn {
  /** 物理渲染器实例 */
  instance: ShallowRef<LiquidGlassInstance | null>;
  /** 实际生效的物理渲染器 (真实运行事实) */
  renderer: Ref<ResolvedRendererType | null>;
  /** 手动更新配置 */
  update: (options: LiquidGlassUpdateOptions) => void;
  /** 手动触发重绘 */
  resize: () => void;
  /** 手动销毁 */
  destroy: () => void;
}

/**
 * Vue 3 Composable for binding a Liquid Glass instance to an element ref.
 *
 * @example
 * ```ts
 * const containerRef = ref<HTMLDivElement>();
 * const { renderer } = useLiquidGlass(containerRef, { blur: 20 });
 * ```
 */
export function useLiquidGlass(
  target: Ref<HTMLElement | null | undefined>,
  options?: MaybeRefOrGetter<LiquidGlassCreateOptions | undefined>
): UseLiquidGlassReturn {
  const instance = shallowRef<LiquidGlassInstance | null>(null);
  const renderer = ref<ResolvedRendererType | null>(null);
  let currentRequestedRenderer = toValue(options)?.renderer ?? 'auto';
  let currentBackgroundUrl = toValue(options)?.backgroundUrl;

  function initInstance(): void {
    const el = target.value;
    if (!el || instance.value) return;

    try {
      const opts = toValue(options);
      currentRequestedRenderer = opts?.renderer ?? 'auto';
      currentBackgroundUrl = opts?.backgroundUrl;
      const inst = createLiquidGlass(el, opts);
      instance.value = inst;
      renderer.value = inst.renderer;
    } catch (err) {
      console.error('[LiquidGlass/Vue] Failed to initialize instance:', err);
    }
  }

  function cleanupInstance(): void {
    if (instance.value) {
      instance.value.destroy();
      instance.value = null;
      renderer.value = null;
    }
  }

  onMounted(() => {
    initInstance();
  });

  // Watch for target element dynamic changes
  watch(
    () => target.value,
    (newEl) => {
      if (newEl && !instance.value) {
        initInstance();
      } else if (!newEl && instance.value) {
        cleanupInstance();
      }
    },
    { immediate: true }
  );

  // Watch options reactively
  if (options != null) {
    watch(
      () => toValue(options),
      (newOpts) => {
        if (!newOpts) return;

        if (!instance.value) {
          initInstance();
          return;
        }

        const newRequestedRenderer = newOpts.renderer ?? 'auto';
        const newBackgroundUrl = newOpts.backgroundUrl;
        // Control plane or environment input changed: cleanly destroy & recreate via Core
        if (
          newRequestedRenderer !== currentRequestedRenderer ||
          newBackgroundUrl !== currentBackgroundUrl
        ) {
          currentRequestedRenderer = newRequestedRenderer;
          currentBackgroundUrl = newBackgroundUrl;
          cleanupInstance();
          initInstance();
          return;
        }

        // Material-only incremental update (60 FPS)
        instance.value.update(newOpts as LiquidGlassUpdateOptions);
      },
      { deep: true }
    );
  }

  onUnmounted(() => {
    cleanupInstance();
  });

  return {
    instance,
    renderer,
    update: (opts: LiquidGlassUpdateOptions) => instance.value?.update(opts),
    resize: () => instance.value?.resize(),
    destroy: () => cleanupInstance(),
  };
}
