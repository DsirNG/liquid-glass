import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as publicApi from '../src/core';
import { CapabilityProbe } from '../src/engine';

function wait(milliseconds = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

describe('public API contract', () => {
  beforeEach(() => {
    CapabilityProbe.resetForTests();
  });

  afterEach(() => {
    CapabilityProbe.resetForTests();
  });

  it('keeps the package root limited to the supported public runtime exports', () => {
    const runtimeApi = publicApi as unknown as Record<string, unknown>;

    expect(runtimeApi.createLiquidGlass).toBeTypeOf('function');
    expect(runtimeApi.DEFAULT_GLASS_OPTIONS).toBeDefined();
    expect(runtimeApi.GLASS_PRESETS).toBeDefined();

    expect(runtimeApi.LiquidGlassEngine).toBeUndefined();
    expect(runtimeApi.RuntimeController).toBeUndefined();
    expect(runtimeApi.BackendManager).toBeUndefined();
    expect(runtimeApi.CapabilityProbe).toBeUndefined();
    expect(runtimeApi.PARAMETER_META).toBeUndefined();
  });

  it('supports creation, canonical option aliases, resize, and safe repeated destruction', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const glass = publicApi.createLiquidGlass(host, {
      materialPreset: 'pure',
      fallbackPolicy: 'preserve',
      surfaceShape: 'convex_squircle',
      capability: 'material',
    });

    expect(glass.status.targetMode).toBe('material');
    expect(() => glass.update({ surfaceShape: 'fluid_dome' })).not.toThrow();
    expect(() => glass.update({ surfaceProfile: 'convex_circle' })).not.toThrow();
    expect(() => glass.resize()).not.toThrow();

    glass.destroy();
    expect(() => glass.destroy()).not.toThrow();
    expect(() => glass.update({ tint: '#00ffcc' })).toThrow(/destroyed/);

    host.remove();
  });

  it('exposes the stable runtime status contract for an optical request', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const glass = publicApi.createLiquidGlass(host, {
      materialPreset: 'pure',
      fallbackPolicy: 'auto',
      capability: 'full',
    });

    expect(glass.status).toMatchObject({
      targetMode: 'full-optical',
      phase: 'transitioning',
      degraded: false,
    });

    await wait(60);

    expect(glass.status).toMatchObject({
      targetMode: 'full-optical',
      activeMode: 'full-optical',
      phase: 'ready',
      degraded: false,
      lastOperation: { status: 'committed', mode: 'full-optical' },
    });

    glass.destroy();
    host.remove();
  });

  it('accepts auto, preserve, and strict as creation policies', () => {
    for (const fallbackPolicy of ['auto', 'preserve', 'strict'] as const) {
      const host = document.createElement('div');
      document.body.appendChild(host);

      const glass = publicApi.createLiquidGlass(host, {
        materialPreset: 'pure',
        fallbackPolicy,
        capability: 'material',
      });

      expect(glass.status.targetMode).toBe('material');
      glass.destroy();
      host.remove();
    }
  });

  it('does not silently recover a strict optical request when capability is unavailable', () => {
    const globalWithCss = globalThis as typeof globalThis & {
      CSS?: { supports: (property: string, value: string) => boolean };
    };
    const hadCss = Object.prototype.hasOwnProperty.call(globalWithCss, 'CSS');
    const originalCss = globalWithCss.CSS;
    Object.defineProperty(globalWithCss, 'CSS', {
      configurable: true,
      value: { supports: () => false },
    });
    const host = document.createElement('div');

    try {
      expect(() =>
        publicApi.createLiquidGlass(host, {
          materialPreset: 'pure',
          fallbackPolicy: 'strict',
          capability: 'full',
        })
      ).toThrow(/strict full-optical/);
      expect(host.classList.contains('lg-root')).toBe(false);
    } finally {
      if (hadCss) {
        Object.defineProperty(globalWithCss, 'CSS', {
          configurable: true,
          value: originalCss,
        });
      } else {
        delete globalWithCss.CSS;
      }
      CapabilityProbe.resetForTests();
    }
  });
});
