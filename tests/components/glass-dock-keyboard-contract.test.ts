import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import { GlassDock } from '../../src/vue';
import * as coreModule from '../../src/core';
import type { LiquidGlassInstance } from '../../src/types';

function createMockInstance(): LiquidGlassInstance {
  return {
    renderer: 'dom',
    isDestroyed: false,
    status: { targetMode: null, activeMode: null, phase: 'initializing', degraded: false },
    update: vi.fn(),
    resize: vi.fn(),
    destroy: vi.fn(),
  };
}

const hosts: HTMLElement[] = [];

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  hosts.splice(0).forEach((host) => host.remove());
});

describe('GlassDock keyboard contract', () => {
  it('does not select on focus or arrow navigation, and selects on Enter/Space', async () => {
    vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(createMockInstance());
    const host = document.createElement('div');
    document.body.appendChild(host);
    hosts.push(host);
    const updateModelValue = vi.fn();
    const app = createApp({
      render: () =>
        h(GlassDock, {
          items: [
            { value: 'one', label: 'One' },
            { value: 'two', label: 'Two' },
            { value: 'three', label: 'Three' },
          ],
          modelValue: 'one',
          'onUpdate:modelValue': updateModelValue,
        }),
    });

    app.mount(host);
    await nextTick();

    const items = [...host.querySelectorAll<HTMLButtonElement>('.glass-dock__item')];
    items[1].focus();
    expect(updateModelValue).not.toHaveBeenCalled();

    items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(items[2]);
    expect(updateModelValue).not.toHaveBeenCalled();

    items[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    items[2].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(updateModelValue).toHaveBeenNthCalledWith(1, 'three');
    expect(updateModelValue).toHaveBeenNthCalledWith(2, 'three');

    app.unmount();
  });
});
