import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLiquidGlass } from '../src/core';
import * as browserUtils from '../src/utils/browser';

describe('engine/lifecycle', () => {
  beforeEach(() => {
    // Force SVG renderer in jsdom environment
    vi.spyOn(browserUtils, 'supportsWebGLRenderer').mockReturnValue(false);
    vi.spyOn(browserUtils, 'supportsSvgRenderer').mockReturnValue(true);
  });

  it('creates an instance and mounts onto element', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const glass = createLiquidGlass(el, { blur: 15 });
    expect(glass.renderer).toBe('svg');
    expect(glass.isDestroyed).toBe(false);

    // Verify update
    expect(() => glass.update({ blur: 25 })).not.toThrow();

    // Verify resize
    expect(() => glass.resize()).not.toThrow();

    glass.destroy();
    expect(glass.isDestroyed).toBe(true);
  });

  it('guarantees idempotent destroy calls', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const glass = createLiquidGlass(el);
    expect(() => {
      glass.destroy();
      glass.destroy();
      glass.destroy();
    }).not.toThrow();
    expect(glass.isDestroyed).toBe(true);
  });

  it('throws defensive errors when calling update or resize on destroyed instance', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const glass = createLiquidGlass(el);
    glass.destroy();

    expect(() => glass.update({ blur: 20 })).toThrowError(/Cannot call update\(\) on a destroyed/);
    expect(() => glass.resize()).toThrowError(/Cannot call resize\(\) on a destroyed/);
  });

  it('throws error if element is not a valid HTMLElement', () => {
    expect(() => createLiquidGlass(null as unknown as HTMLElement)).toThrowError(/requires a valid HTMLElement/);
  });
});
