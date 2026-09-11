import { describe, it, expect } from 'vitest';
import { createLiquidGlass } from '../src/core';
import { OpticalFieldGenerator } from '../src/engine/svg';
import { vi } from 'vitest';

describe('DOM engine lifecycle', () => {
  it('creates a DOM-native instance and mounts it', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const glass = createLiquidGlass(element, { blur: 15 });

    expect(glass.renderer).toBe('dom');
    expect(glass.isDestroyed).toBe(false);
    expect(element.classList.contains('lg-svg-container')).toBe(true);
    expect(() => glass.update({ blur: 25 })).not.toThrow();
    expect(() => glass.resize()).not.toThrow();

    glass.destroy();
    expect(glass.isDestroyed).toBe(true);
  });

  it('destroys idempotently and rejects later mutations', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const glass = createLiquidGlass(element);
    glass.destroy();
    expect(() => glass.destroy()).not.toThrow();
    expect(() => glass.update({ blur: 20 })).toThrowError(/destroyed/);
    expect(() => glass.resize()).toThrowError(/destroyed/);
  });

  it('requires an HTMLElement', () => {
    expect(() => createLiquidGlass(null as unknown as HTMLElement)).toThrowError(/HTMLElement/);
  });

  it('canonicalizes surfaceShape updates before the optical field is rebuilt', async () => {
    const element = document.createElement('div');
    element.style.width = '320px';
    element.style.height = '180px';
    document.body.appendChild(element);

    const generateSpy = vi.spyOn(OpticalFieldGenerator, 'generate');
    const glass = createLiquidGlass(element, {
      capability: 'full',
      surfaceProfile: 'convex_squircle',
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    const callsBeforeUpdate = generateSpy.mock.calls.length;

    glass.update({ surfaceShape: 'fluid_dome' });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(
      generateSpy.mock.calls
        .slice(callsBeforeUpdate)
        .some(([options]) => options.surfaceProfile === 'fluid_dome')
    ).toBe(true);

    generateSpy.mockRestore();
    glass.destroy();
    element.remove();
  });

  it('keeps the last-good optical backend when a resize candidate fails', async () => {
    const element = document.createElement('div');
    element.style.width = '320px';
    element.style.height = '180px';
    document.body.appendChild(element);

    const generateSpy = vi.spyOn(OpticalFieldGenerator, 'generate');
    const glass = createLiquidGlass(element, { capability: 'full' });

    await new Promise((resolve) => setTimeout(resolve, 50));
    const lastGoodFilter = element.style.backdropFilter;
    expect(lastGoodFilter).toContain('url("#');

    generateSpy.mockRejectedValueOnce(new Error('resize candidate failed'));
    glass.resize();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(element.style.backdropFilter).toBe(lastGoodFilter);

    generateSpy.mockRestore();
    glass.destroy();
    element.remove();
  });
});
