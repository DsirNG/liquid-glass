import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, nextTick, reactive, ref } from 'vue';
import { LiquidGlass } from '../../src/vue';
import * as coreModule from '../../src/core';
import type { LiquidGlassInstance } from '../../src/types';

const roots: HTMLElement[] = [];

function createMockInstance(): LiquidGlassInstance {
  return {
    renderer: 'dom',
    isDestroyed: false,
    status: {
      targetMode: 'material',
      activeMode: 'material',
      phase: 'ready',
      degraded: true,
    },
    update: vi.fn(),
    resize: vi.fn(),
    destroy: vi.fn(),
  };
}

function mountApp(render: () => ReturnType<typeof h>): ReturnType<typeof createApp> {
  const root = document.createElement('div');
  document.body.appendChild(root);
  roots.push(root);
  const app = createApp({ render });
  app.mount(root);
  return app;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  roots.splice(0).forEach((root) => root.remove());
});

describe('Vue LiquidGlass adapter contract', () => {
  it('consumes Core props and preserves normal HTML attribute fallthrough', async () => {
    const instance = createMockInstance();
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const app = mountApp(() =>
      h(
        LiquidGlass,
        {
          fallbackPolicy: 'auto',
          capability: 'material',
          interactive: false,
          class: 'custom-glass',
          style: { color: 'red' },
          id: 'glass-card',
          role: 'img',
          'aria-label': 'Liquid Glass card',
          'data-contract': 'vue',
        },
        () => h('button', { type: 'button' }, 'Continue')
      )
    );

    await nextTick();

    const root = roots[0].querySelector('.lg-root');
    expect(createSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        fallbackPolicy: 'auto',
        capability: 'material',
        interactive: false,
      })
    );
    expect(root).not.toBeNull();
    expect(root?.classList.contains('custom-glass')).toBe(true);
    expect(root?.id).toBe('glass-card');
    expect(root?.getAttribute('role')).toBe('img');
    expect(root?.getAttribute('aria-label')).toBe('Liquid Glass card');
    expect(root?.getAttribute('data-contract')).toBe('vue');
    expect(root?.hasAttribute('fallback-policy')).toBe(false);
    expect(root?.hasAttribute('capability')).toBe(false);
    expect(root?.hasAttribute('interactive')).toBe(false);
    expect(root?.querySelector('button')?.textContent).toBe('Continue');

    app.unmount();
  });

  it('merges options with direct props and sends only changed updateable fields', async () => {
    const instance = createMockInstance();
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const props = reactive({
      options: { blur: 1, opacity: 0.2 },
      blur: 4,
      capability: 'auto' as const,
      fallbackPolicy: 'auto' as const,
      interactive: true,
    });
    const app = mountApp(() => h(LiquidGlass, props, () => 'Content'));

    await nextTick();
    expect(createSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ blur: 4, opacity: 0.2, capability: 'auto' })
    );

    props.options.blur = 8;
    await nextTick();
    expect(instance.update).not.toHaveBeenCalled();

    props.options.opacity = 0.4;
    await nextTick();
    expect(instance.update).toHaveBeenLastCalledWith({ opacity: 0.4 });

    props.capability = 'material';
    await nextTick();
    expect(instance.update).toHaveBeenLastCalledWith({ capability: 'material' });
    expect(instance.update).not.toHaveBeenLastCalledWith(
      expect.objectContaining({ fallbackPolicy: expect.anything(), interactive: expect.anything() })
    );

    app.unmount();
  });

  it('does not send creation-only prop changes through Core update', async () => {
    const instance = createMockInstance();
    vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const props = reactive({
      fallbackPolicy: 'auto' as const,
      interactive: true,
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const app = mountApp(() => h(LiquidGlass, props, () => 'Content'));

    await nextTick();
    props.fallbackPolicy = 'preserve';
    props.interactive = false;
    await nextTick();

    expect(instance.update).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls.flat().join(' ')).toContain('creation-only');

    app.unmount();
  });

  it('exposes the Core instance, status snapshot, update, resize, and destroy', async () => {
    const instance = createMockInstance();
    vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const componentRef = ref<InstanceType<typeof LiquidGlass> | null>(null);
    const app = mountApp(() => h(LiquidGlass, { ref: componentRef }, () => 'Content'));

    await nextTick();
    expect(componentRef.value?.instance).toBe(instance);
    expect(componentRef.value?.getStatus()).toBe(instance.status);

    componentRef.value?.update({ blur: 3 });
    componentRef.value?.resize();
    expect(instance.update).toHaveBeenCalledWith({ blur: 3 });
    expect(instance.resize).toHaveBeenCalledTimes(1);

    app.unmount();
    expect(instance.destroy).toHaveBeenCalledTimes(1);
  });
});
