import { describe, it, expect } from 'vitest';
import { createLiquidGlass } from '../src/core';
import { CapabilityProbe } from '../src/engine';

describe('unified LiquidGlassEngine native implementation', () => {
  it('creates full optical layers and RGB chromatic aberration SVG filter', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const instance = createLiquidGlass(el, {
      refraction: 1.2,
      dispersion: 2.5,
      specular: 0.8,
      blur: 0.2,
      saturation: 140,
    });

    expect(el.classList.contains('lg-svg-container')).toBe(true);
    expect(el.querySelector('.lg-svg-refraction')).not.toBeNull();
    expect(el.querySelector('.lg-svg-tint')).not.toBeNull();
    expect(el.querySelector('.lg-border-screen')).not.toBeNull();
    expect(el.querySelector('.lg-border-overlay')).not.toBeNull();

    // Check SVG filter
    const filter = document.querySelector('svg filter');
    expect(filter).not.toBeNull();
    expect(filter?.querySelectorAll('feDisplacementMap').length).toBe(3);
    expect(filter?.querySelector('feComposite')).not.toBeNull();

    instance.destroy();
    expect(el.classList.contains('lg-svg-container')).toBe(false);
    expect(el.querySelector('.lg-border-screen')).toBeNull();
    expect(el.querySelector('.lg-border-overlay')).toBeNull();

    el.remove();
  });

  it('exposes the runtime status without leaking backend internals', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const instance = createLiquidGlass(el, { capability: 'full' });

    expect(instance.status).toMatchObject({
      targetMode: 'full-optical',
      phase: 'transitioning',
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(instance.status).toMatchObject({
      targetMode: 'full-optical',
      activeMode: 'full-optical',
      phase: 'ready',
      degraded: false,
      lastOperation: { status: 'committed', mode: 'full-optical' },
    });

    instance.destroy();
    el.remove();
  });

  it('commits the static backend when the runtime has no backdrop-filter support', async () => {
    CapabilityProbe.resetForTests();
    const hadCss = Object.prototype.hasOwnProperty.call(globalThis, 'CSS');
    const originalCss = (globalThis as typeof globalThis & { CSS?: unknown }).CSS;
    Object.defineProperty(globalThis, 'CSS', {
      configurable: true,
      value: { supports: () => false },
    });

    const el = document.createElement('div');
    document.body.appendChild(el);

    try {
      const instance = createLiquidGlass(el, { capability: 'full' });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(instance.status).toMatchObject({
        targetMode: 'static',
        activeMode: 'static',
        phase: 'ready',
        degraded: true,
        degradationReason: 'backdrop-filter-unsupported',
        lastOperation: { status: 'committed', mode: 'static' },
      });
      expect((el.querySelector('.lg-svg-refraction') as HTMLElement).style.display).toBe('none');
      expect(el.style.backdropFilter).toBe('');

      instance.destroy();
      el.remove();
    } finally {
      if (hadCss) {
        Object.defineProperty(globalThis, 'CSS', {
          configurable: true,
          value: originalCss,
        });
      } else {
        delete (globalThis as typeof globalThis & { CSS?: unknown }).CSS;
      }
      CapabilityProbe.resetForTests();
    }
  });

  it('throws strict capability failures synchronously before creating the host', () => {
    CapabilityProbe.resetForTests();
    const hadCss = Object.prototype.hasOwnProperty.call(globalThis, 'CSS');
    const originalCss = (globalThis as typeof globalThis & { CSS?: unknown }).CSS;
    Object.defineProperty(globalThis, 'CSS', {
      configurable: true,
      value: { supports: () => false },
    });
    const el = document.createElement('div');

    try {
      expect(() =>
        createLiquidGlass(el, {
          capability: 'full',
          fallbackPolicy: 'strict',
        })
      ).toThrow(/strict full-optical/);
      expect(el.classList.contains('lg-svg-container')).toBe(false);
    } finally {
      if (hadCss) {
        Object.defineProperty(globalThis, 'CSS', {
          configurable: true,
          value: originalCss,
        });
      } else {
        delete (globalThis as typeof globalThis & { CSS?: unknown }).CSS;
      }
      CapabilityProbe.resetForTests();
    }
  });
});
