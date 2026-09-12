import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createApp, h, nextTick, reactive, ref } from 'vue';
import { LiquidGlass as ReactLiquidGlass, type LiquidGlassHandle } from '../../src/react';
import { LiquidGlass as VueLiquidGlass } from '../../src/vue';
import * as coreModule from '../../src/core';
import type { LiquidGlassInstance } from '../../src/types';

const hosts: HTMLElement[] = [];

const canonicalOptions = {
  materialPreset: 'pure' as const,
  fallbackPolicy: 'auto' as const,
  capability: 'auto' as const,
  refraction: 0.8,
  blur: 4,
  interactive: false,
};

type MutableAdapterProps = {
  materialPreset: 'pure';
  fallbackPolicy: 'auto' | 'preserve';
  capability: 'auto' | 'material';
  refraction: number;
  blur: number;
  interactive: boolean;
};

function createHost(): HTMLDivElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  hosts.push(host);
  return host;
}

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

function createCoreSpy(instances: LiquidGlassInstance[]) {
  let instanceIndex = 0;
  return vi.spyOn(coreModule, 'createLiquidGlass').mockImplementation(() => {
    const instance = instances[instanceIndex];
    instanceIndex += 1;
    if (!instance) throw new Error('Cross-adapter test created an unexpected Core instance.');
    return instance;
  });
}

function mountVue(initialProps: MutableAdapterProps) {
  const host = createHost();
  const props = reactive({ ...initialProps });
  const componentRef = ref<InstanceType<typeof VueLiquidGlass> | null>(null);
  const app = createApp({
    render: () =>
      h(VueLiquidGlass, { ...props, ref: componentRef }, () =>
        h('button', { type: 'button' }, 'Continue')
      ),
  });

  app.mount(host);
  return { app, componentRef, props };
}

async function mountReact(initialProps: MutableAdapterProps) {
  const host = createHost();
  const root = createRoot(host);
  const componentRef = createRef<LiquidGlassHandle>();

  await act(async () => {
    root.render(
      createElement(
        ReactLiquidGlass,
        { ...initialProps, ref: componentRef },
        createElement('button', { type: 'button' }, 'Continue')
      )
    );
  });

  return { host, root, componentRef };
}

function createVanilla() {
  const host = createHost();
  return coreModule.createLiquidGlass(host, canonicalOptions);
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.restoreAllMocks();
});

afterEach(() => {
  hosts.splice(0).forEach((host) => host.remove());
  vi.unstubAllGlobals();
});

describe('cross-adapter contract', () => {
  it('resolves the same canonical creation options through Vanilla, Vue, and React', async () => {
    const instances = [createMockInstance(), createMockInstance(), createMockInstance()];
    const createSpy = createCoreSpy(instances);
    const vanilla = createVanilla();
    const vue = mountVue(canonicalOptions);
    await nextTick();
    const react = await mountReact(canonicalOptions);

    expect(createSpy).toHaveBeenCalledTimes(3);
    const resolvedOptions = createSpy.mock.calls.map(([, options]) => options);
    expect(resolvedOptions).toEqual([canonicalOptions, canonicalOptions, canonicalOptions]);
    expect(vanilla.isDestroyed).toBe(false);
    expect(vue.componentRef.value?.instance).toBe(instances[1]);
    expect(react.componentRef.current?.instance).toBe(instances[2]);

    vue.app.unmount();
    await act(async () => react.root.unmount());
  });

  it('sends the same changed patch and excludes creation-only options', async () => {
    const instances = [createMockInstance(), createMockInstance(), createMockInstance()];
    const createSpy = createCoreSpy(instances);
    const vanilla = createVanilla();
    const vue = mountVue(canonicalOptions);
    await nextTick();
    const react = await mountReact(canonicalOptions);

    const updatePatch = { refraction: 0.9, capability: 'material' as const };
    vanilla.update(updatePatch);

    vue.props.refraction = updatePatch.refraction;
    vue.props.capability = updatePatch.capability;
    await nextTick();

    await act(async () => {
      react.root.render(
        createElement(
          ReactLiquidGlass,
          { ...canonicalOptions, ...updatePatch, ref: react.componentRef },
          createElement('button', { type: 'button' }, 'Continue')
        )
      );
    });

    vue.props.fallbackPolicy = 'preserve';
    vue.props.interactive = true;
    await nextTick();

    await act(async () => {
      react.root.render(
        createElement(
          ReactLiquidGlass,
          {
            ...canonicalOptions,
            ...updatePatch,
            fallbackPolicy: 'preserve',
            interactive: true,
            ref: react.componentRef,
          },
          createElement('button', { type: 'button' }, 'Continue')
        )
      );
    });

    expect(createSpy).toHaveBeenCalledTimes(3);
    expect(instances.map((instance) => vi.mocked(instance.update).mock.calls)).toEqual([
      [[updatePatch]],
      [[updatePatch]],
      [[updatePatch]],
    ]);

    vue.app.unmount();
    await act(async () => react.root.unmount());
  });

  it('keeps status and resize semantics aligned across all public entries', async () => {
    const instances = [createMockInstance(), createMockInstance(), createMockInstance()];
    createCoreSpy(instances);
    const vanilla = createVanilla();
    const vue = mountVue(canonicalOptions);
    await nextTick();
    const react = await mountReact(canonicalOptions);

    const statuses = [
      vanilla.status,
      vue.componentRef.value?.getStatus(),
      react.componentRef.current?.getStatus(),
    ];
    expect(statuses[1]).toEqual(statuses[0]);
    expect(statuses[2]).toEqual(statuses[0]);

    vanilla.resize();
    vue.componentRef.value?.resize();
    react.componentRef.current?.resize();
    expect(instances.map((instance) => vi.mocked(instance.resize).mock.calls.length)).toEqual([
      1, 1, 1,
    ]);

    vue.app.unmount();
    await act(async () => react.root.unmount());
  });

  it('creates once, never recreates on update, and cleans up framework instances once', async () => {
    const instances = [createMockInstance(), createMockInstance(), createMockInstance()];
    const createSpy = createCoreSpy(instances);
    const vanilla = createVanilla();
    const vue = mountVue(canonicalOptions);
    await nextTick();
    const react = await mountReact(canonicalOptions);

    vanilla.update({ blur: 5 });
    vue.props.blur = 5;
    await nextTick();
    await act(async () => {
      react.root.render(
        createElement(
          ReactLiquidGlass,
          { ...canonicalOptions, blur: 5, ref: react.componentRef },
          createElement('button', { type: 'button' }, 'Continue')
        )
      );
    });

    expect(createSpy).toHaveBeenCalledTimes(3);

    vanilla.destroy();
    vue.componentRef.value?.destroy();
    vue.componentRef.value?.destroy();
    react.componentRef.current?.destroy();
    react.componentRef.current?.destroy();

    expect(vi.mocked(instances[0].destroy)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(instances[1].destroy)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(instances[2].destroy)).toHaveBeenCalledTimes(1);

    vue.app.unmount();
    await act(async () => react.root.unmount());
  });
});
