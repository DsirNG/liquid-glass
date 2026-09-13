import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, nextTick, reactive, ref } from 'vue';
import { GlassDock } from '../../src/vue';
import * as coreModule from '../../src/core';
import type { LiquidGlassInstance } from '../../src/types';

const hosts: HTMLElement[] = [];

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

function createHost(): HTMLDivElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  hosts.push(host);
  return host;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  hosts.splice(0).forEach((host) => host.remove());
});

describe('GlassDock runtime and edge-case contract', () => {
  it('reuses one Core instance across active, hover, focus, orientation, and item changes', async () => {
    const instance = createMockInstance();
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const dockRef = ref<{ getStatus?: () => unknown; destroy?: () => void } | null>(null);
    const props = reactive({
      items: [
        { value: 'home', label: 'Home' },
        { value: 'search', label: 'Search' },
        { value: 'profile', label: 'Profile' },
      ],
      modelValue: 'home',
      orientation: 'horizontal' as const,
      size: 'md' as const,
      interactive: true,
      capability: 'auto' as const,
      refraction: 0.6,
    });
    const host = createHost();
    const app = createApp({
      render: () => h(GlassDock, { ...props, ref: dockRef }),
    });

    app.mount(host);
    await nextTick();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(dockRef.value?.getStatus?.()).toBe(instance.status);

    const items = () => [...host.querySelectorAll<HTMLButtonElement>('.glass-dock__item')];
    items()[0].dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    await nextTick();
    expect(items()[0].style.getPropertyValue('--glass-dock-item-scale')).toBe('1.12');
    expect(items()[1].style.getPropertyValue('--glass-dock-item-scale')).toBe('1.05');
    instance.update.mockClear();

    for (let index = 0; index < 1000; index += 1) {
      items()[0].dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: index }));
    }
    items()[1].dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    items()[2].dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    expect(instance.update).not.toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledTimes(1);

    props.modelValue = 'search';
    await nextTick();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(instance.update).not.toHaveBeenCalled();

    props.orientation = 'vertical';
    props.items = [
      { value: 'profile', label: 'Profile' },
      { value: 'search', label: 'Search' },
    ];
    await nextTick();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(host.querySelector('[aria-orientation="vertical"]')).not.toBeNull();
    expect(host.querySelector('.glass-dock__item.is-active')?.textContent).toContain('Search');

    props.size = 'lg';
    await nextTick();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(instance.update).toHaveBeenCalledWith({ radius: 24 });

    dockRef.value?.destroy?.();
    dockRef.value?.destroy?.();
    app.unmount();
    expect(instance.destroy).toHaveBeenCalledTimes(1);
  });

  it('keeps empty, invalid, disabled, and dynamically changing item states safe', async () => {
    const instance = createMockInstance();
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const props = reactive({
      items: [] as Array<{ value: string; label: string; disabled?: boolean }>,
      modelValue: 'missing',
    });
    const host = createHost();
    const app = createApp({ render: () => h(GlassDock, props) });

    app.mount(host);
    await nextTick();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(host.querySelectorAll('.glass-dock__item')).toHaveLength(0);

    props.items = [
      { value: 'disabled', label: 'Disabled', disabled: true },
      { value: 'available', label: 'Available' },
    ];
    await nextTick();
    let items = [...host.querySelectorAll<HTMLButtonElement>('.glass-dock__item')];
    expect(items[0].getAttribute('aria-selected')).toBe('false');
    expect(items[1].getAttribute('aria-selected')).toBe('false');
    expect(items[0].tabIndex).toBe(-1);
    expect(items[1].tabIndex).toBe(0);

    props.modelValue = 'available';
    await nextTick();
    items = [...host.querySelectorAll<HTMLButtonElement>('.glass-dock__item')];
    expect(items[1].getAttribute('aria-selected')).toBe('true');
    expect(items[1].tabIndex).toBe(0);

    props.items = [{ value: 'available', label: 'Available', disabled: true }];
    await nextTick();
    items = [...host.querySelectorAll<HTMLButtonElement>('.glass-dock__item')];
    expect(items[0].getAttribute('aria-selected')).toBe('false');
    expect(items[0].getAttribute('aria-disabled')).toBe('true');
    expect(items[0].tabIndex).toBe(-1);

    props.items = [{ value: 'only', label: 'Only' }];
    props.modelValue = 'only';
    await nextTick();
    items = [...host.querySelectorAll<HTMLButtonElement>('.glass-dock__item')];
    expect(items).toHaveLength(1);
    expect(items[0].getAttribute('aria-selected')).toBe('true');
    expect(items[0].tabIndex).toBe(0);
    expect(createSpy).toHaveBeenCalledTimes(1);

    app.unmount();
    expect(instance.destroy).toHaveBeenCalledTimes(1);
  });

  it('disables dock-owned selection without applying pointer-events none to slot content', async () => {
    const instance = createMockInstance();
    vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const updateModelValue = vi.fn();
    const host = createHost();
    const app = createApp({
      render: () =>
        h(
          GlassDock,
          {
            items: [{ value: 'home', label: 'Home' }],
            modelValue: 'home',
            interactive: true,
            disabled: true,
            'onUpdate:modelValue': updateModelValue,
          },
          {
            item: ({ item }) => h('span', { class: 'slot-content' }, item.label),
          }
        ),
    });

    app.mount(host);
    await nextTick();
    const root = host.querySelector<HTMLElement>('.glass-dock');
    const item = host.querySelector<HTMLButtonElement>('.glass-dock__item');
    expect(root?.getAttribute('aria-disabled')).toBe('true');
    expect(item?.getAttribute('aria-disabled')).toBe('true');
    expect(item?.disabled).toBe(false);
    expect(item?.tabIndex).toBe(-1);
    expect(host.querySelector('.slot-content')?.textContent).toBe('Home');

    item?.click();
    expect(updateModelValue).not.toHaveBeenCalled();
    expect(root?.style.pointerEvents).toBe('');

    app.unmount();
    expect(instance.destroy).toHaveBeenCalledTimes(1);
  });
});
