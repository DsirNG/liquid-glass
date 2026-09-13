import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, nextTick, reactive } from 'vue';
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

function mountDock(
  initialProps: Record<string, unknown>,
  slots: Record<string, () => unknown> = {},
  onUpdateModelValue = vi.fn()
) {
  const host = createHost();
  const props = reactive(initialProps);
  const app = createApp({
    render: () =>
      h(
        GlassDock,
        {
          ...props,
          'onUpdate:modelValue': onUpdateModelValue,
        },
        slots
      ),
  });

  app.mount(host);
  return { app, host, props, onUpdateModelValue };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  hosts.splice(0).forEach((host) => host.remove());
});

describe('Vue GlassDock contract', () => {
  it('uses the public item model, toolbar semantics, slots, attrs, and option precedence', async () => {
    const instance = createMockInstance();
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const slotCalls: Array<Record<string, unknown>> = [];
    const { app, host } = mountDock(
      {
        items: [
          { value: 'home', label: 'Home' },
          { value: 'settings', label: 'Settings', disabled: true },
          { value: 'profile', label: 'Profile' },
        ],
        modelValue: 'home',
        size: 'lg',
        orientation: 'horizontal',
        interactive: true,
        disabled: false,
        fallbackPolicy: 'auto',
        capability: 'auto',
        options: { blur: 1, radius: 18, opacity: 0.2 },
        blur: 4,
        radius: 28,
        class: 'custom-dock',
        style: { color: 'red' },
        id: 'dock',
        'aria-label': 'Application dock',
        'data-testid': 'glass-dock',
      },
      {
        item: (context) => {
          slotCalls.push({ ...context });
          return h('span', { class: 'custom-item' }, context.item.label);
        },
      }
    );

    await nextTick();

    const root = host.querySelector<HTMLElement>('.glass-dock');
    const toolbar = host.querySelector<HTMLElement>('[role="toolbar"]');
    const items = [...host.querySelectorAll<HTMLButtonElement>('.glass-dock__item')];

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        blur: 4,
        radius: 28,
        opacity: 0.2,
        capability: 'auto',
        fallbackPolicy: 'auto',
        interactive: true,
      })
    );
    expect(root).not.toBeNull();
    expect(root?.classList.contains('custom-dock')).toBe(true);
    expect(root?.id).toBe('dock');
    expect(root?.getAttribute('aria-label')).toBe('Application dock');
    expect(root?.dataset.testid).toBe('glass-dock');
    expect(root?.getAttribute('style')).toContain('color: red');
    expect(toolbar?.getAttribute('aria-orientation')).toBe('horizontal');
    expect(items).toHaveLength(3);
    expect(items.map((item) => item.textContent?.trim())).toEqual(['Home', 'Settings', 'Profile']);
    expect(items[0].getAttribute('aria-pressed')).toBe('true');
    expect(items[0].getAttribute('aria-selected')).toBe('true');
    expect(items[1].getAttribute('aria-disabled')).toBe('true');
    expect(items[1].getAttribute('aria-selected')).toBe('false');
    expect(items[1].disabled).toBe(true);
    expect(items[0].tabIndex).toBe(0);
    expect(items[1].tabIndex).toBe(-1);
    expect(items[2].tabIndex).toBe(-1);
    expect(slotCalls[0]).toEqual(
      expect.objectContaining({
        item: expect.objectContaining({ value: 'home' }),
        index: 0,
        active: true,
        hovered: false,
        focused: false,
        disabled: false,
      })
    );

    for (const attribute of [
      'items',
      'model-value',
      'size',
      'orientation',
      'disabled',
      'interactive',
      'fallback-policy',
      'capability',
      'options',
    ]) {
      expect(root?.hasAttribute(attribute)).toBe(false);
    }

    app.unmount();
    expect(instance.destroy).toHaveBeenCalledTimes(1);
  });

  it('keeps active, hover, and focus state separate and emits only modelValue updates', async () => {
    const instance = createMockInstance();
    vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const onUpdateModelValue = vi.fn();
    const { app, host } = mountDock(
      {
        items: [
          { value: 'home', label: 'Home' },
          { value: 'profile', label: 'Profile' },
        ],
        modelValue: 'home',
        interactive: true,
      },
      {},
      onUpdateModelValue
    );

    await nextTick();
    const items = [...host.querySelectorAll<HTMLButtonElement>('.glass-dock__item')];
    items[1].dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    await nextTick();

    expect(items[0].getAttribute('aria-pressed')).toBe('true');
    expect(items[1].getAttribute('aria-pressed')).toBe('false');
    expect(items[1].classList.contains('is-hovered')).toBe(true);

    items[1].focus();
    await nextTick();
    expect(document.activeElement).toBe(items[1]);
    expect(items[0].getAttribute('aria-pressed')).toBe('true');
    expect(items[1].getAttribute('aria-pressed')).toBe('false');

    items[1].click();
    expect(onUpdateModelValue).toHaveBeenCalledTimes(1);
    expect(onUpdateModelValue).toHaveBeenCalledWith('profile');

    app.unmount();
  });

  it('supports roving keyboard navigation, orientation, and disabled-item skipping', async () => {
    const instance = createMockInstance();
    vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const onUpdateModelValue = vi.fn();
    const { app, host } = mountDock(
      {
        items: [
          { value: 'home', label: 'Home' },
          { value: 'settings', label: 'Settings', disabled: true },
          { value: 'profile', label: 'Profile' },
        ],
        modelValue: 'home',
        orientation: 'horizontal',
      },
      {},
      onUpdateModelValue
    );

    await nextTick();
    const items = [...host.querySelectorAll<HTMLButtonElement>('.glass-dock__item')];
    items[0].focus();
    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(items[2]);

    items[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(items[0]);

    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(items[2]);
    items[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(items[0]);

    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(onUpdateModelValue).toHaveBeenNthCalledWith(1, 'home');
    expect(onUpdateModelValue).toHaveBeenNthCalledWith(2, 'home');

    app.unmount();

    const verticalInstance = createMockInstance();
    vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(verticalInstance);
    const vertical = mountDock({
      items: [
        { value: 'one', label: 'One' },
        { value: 'two', label: 'Two', disabled: true },
        { value: 'three', label: 'Three' },
      ],
      modelValue: 'one',
      orientation: 'vertical',
    });
    await nextTick();
    const verticalItems = [
      ...vertical.host.querySelectorAll<HTMLButtonElement>('.glass-dock__item'),
    ];
    verticalItems[0].focus();
    verticalItems[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
    );
    expect(document.activeElement).toBe(verticalItems[2]);
    vertical.app.unmount();
  });

  it('keeps model and material updates on the existing instance and preserves creation-only boundaries', async () => {
    const instance = createMockInstance();
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { app, props, host } = mountDock({
      items: [
        { value: 'home', label: 'Home' },
        { value: 'profile', label: 'Profile' },
      ],
      modelValue: 'home',
      capability: 'auto',
      refraction: 0.6,
      fallbackPolicy: 'auto',
      interactive: true,
    });

    await nextTick();
    instance.update.mockClear();

    props.modelValue = 'profile';
    await nextTick();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(instance.update).not.toHaveBeenCalled();

    props.refraction = 0.8;
    await nextTick();
    expect(instance.update).toHaveBeenLastCalledWith({ refraction: 0.8 });

    props.capability = 'material';
    await nextTick();
    expect(instance.update).toHaveBeenLastCalledWith({ capability: 'material' });

    instance.update.mockClear();
    props.fallbackPolicy = 'preserve';
    props.interactive = false;
    await nextTick();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(instance.update).not.toHaveBeenCalled();
    expect(warnSpy.mock.calls.flat().join(' ')).toContain('creation-only');

    const item = host.querySelector<HTMLElement>('.glass-dock__item');
    for (let index = 0; index < 1000; index += 1) {
      item?.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: index }));
    }
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(instance.update).not.toHaveBeenCalled();

    app.unmount();
    expect(instance.destroy).toHaveBeenCalledTimes(1);
  });
});
