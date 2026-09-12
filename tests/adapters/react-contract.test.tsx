import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { LiquidGlass, type LiquidGlassHandle, type LiquidGlassProps } from '../../src/react';
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

function createMount(): { host: HTMLElement; root: Root } {
  const host = document.createElement('div');
  document.body.appendChild(host);
  roots.push(host);
  return { host, root: createRoot(host) };
}

async function renderGlass(root: Root, props: LiquidGlassProps): Promise<void> {
  await act(async () => {
    root.render(
      createElement(LiquidGlass, props, createElement('button', { type: 'button' }, 'Continue'))
    );
  });
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.restoreAllMocks();
});

afterEach(() => {
  roots.splice(0).forEach((host) => host.remove());
  vi.unstubAllGlobals();
});

describe('React LiquidGlass adapter contract', () => {
  it('consumes Core props and preserves normal HTML attribute fallthrough', async () => {
    const instance = createMockInstance();
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const { host, root } = createMount();

    await renderGlass(root, {
      fallbackPolicy: 'auto',
      capability: 'material',
      interactive: false,
      className: 'custom-glass',
      style: { color: 'red' },
      id: 'glass-card',
      role: 'img',
      'aria-label': 'Liquid Glass card',
      'data-contract': 'react',
    });

    const glassRoot = host.querySelector('.lg-root');
    expect(createSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        fallbackPolicy: 'auto',
        capability: 'material',
        interactive: false,
      })
    );
    expect(glassRoot).not.toBeNull();
    expect(glassRoot?.classList.contains('custom-glass')).toBe(true);
    expect(glassRoot?.id).toBe('glass-card');
    expect(glassRoot?.getAttribute('role')).toBe('img');
    expect(glassRoot?.getAttribute('aria-label')).toBe('Liquid Glass card');
    expect(glassRoot?.getAttribute('data-contract')).toBe('react');
    expect(glassRoot?.hasAttribute('fallbackPolicy')).toBe(false);
    expect(glassRoot?.hasAttribute('capability')).toBe(false);
    expect(glassRoot?.hasAttribute('interactive')).toBe(false);
    expect(glassRoot?.querySelector('button')?.textContent).toBe('Continue');

    await act(async () => root.unmount());
  });

  it('merges options with direct props and sends only changed updateable fields', async () => {
    const instance = createMockInstance();
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const { root } = createMount();
    const initialProps: LiquidGlassProps = {
      options: { blur: 1, opacity: 0.2, capability: 'material' },
      blur: 4,
      capability: 'auto',
      fallbackPolicy: 'auto',
      interactive: true,
    };

    await renderGlass(root, initialProps);
    expect(createSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ blur: 4, opacity: 0.2, capability: 'auto' })
    );

    await renderGlass(root, {
      ...initialProps,
      options: { ...initialProps.options, blur: 8 },
    });
    expect(instance.update).not.toHaveBeenCalled();

    const opacityProps: LiquidGlassProps = {
      ...initialProps,
      options: { ...initialProps.options, opacity: 0.4 },
    };
    await renderGlass(root, opacityProps);
    expect(instance.update).toHaveBeenLastCalledWith({ opacity: 0.4 });

    await renderGlass(root, { ...opacityProps, capability: 'material' });
    expect(instance.update).toHaveBeenLastCalledWith({ capability: 'material' });

    await act(async () => root.unmount());
  });

  it('does not send creation-only prop changes through Core update', async () => {
    const instance = createMockInstance();
    vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { root } = createMount();
    const initialProps: LiquidGlassProps = {
      fallbackPolicy: 'auto',
      interactive: true,
    };

    await renderGlass(root, initialProps);
    await renderGlass(root, {
      ...initialProps,
      fallbackPolicy: 'preserve',
      interactive: false,
    });

    expect(instance.update).not.toHaveBeenCalled();
    expect(warnSpy.mock.calls.flat().join(' ')).toContain('creation-only');

    await act(async () => root.unmount());
  });

  it('exposes the Core instance, status snapshot, update, resize, and destroy', async () => {
    const instance = createMockInstance();
    vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const componentRef = createRef<LiquidGlassHandle>();
    const { root } = createMount();

    await renderGlass(root, { ref: componentRef });
    expect(componentRef.current?.instance).toBe(instance);
    expect(componentRef.current?.getStatus()).toBe(instance.status);

    componentRef.current?.update({ blur: 3 });
    componentRef.current?.resize();
    expect(instance.update).toHaveBeenCalledWith({ blur: 3 });
    expect(instance.resize).toHaveBeenCalledTimes(1);

    await act(async () => root.unmount());
    expect(instance.destroy).toHaveBeenCalledTimes(1);
  });
});
