import { describe, it, expect } from 'vitest';
import { createLiquidGlass } from '../src/core';

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
    expect(filter?.querySelector('feComponentTransfer')).not.toBeNull();

    instance.destroy();
    expect(el.classList.contains('lg-svg-container')).toBe(false);
    expect(el.querySelector('.lg-border-screen')).toBeNull();
    expect(el.querySelector('.lg-border-overlay')).toBeNull();

    el.remove();
  });
});
