import { describe, it, expect } from 'vitest';
import { normalizeOptions } from '../src/engine/options';
import { DEFAULT_GLASS_OPTIONS, GLASS_PRESETS } from '../src/constants';

describe('engine/options', () => {
  it('populates DOM material defaults', () => {
    const opts = normalizeOptions();
    expect(opts.blur).toBe(DEFAULT_GLASS_OPTIONS.blur);
    expect(opts.ior).toBe(DEFAULT_GLASS_OPTIONS.ior);
    expect(opts).not.toHaveProperty('renderer');
    expect(opts).not.toHaveProperty('backgroundUrl');
  });

  it('preserves valid material overrides', () => {
    const opts = normalizeOptions({ blur: 10, ior: 2.5 });
    expect(opts.blur).toBe(10);
    expect(opts.ior).toBe(2.5);
  });

  it('safely clamps invalid numbers', () => {
    const opts = normalizeOptions({
      blur: NaN,
      opacity: 999,
      thickness: -50,
      ior: Infinity,
      dispersion: -1,
    });
    expect(opts.blur).toBe(DEFAULT_GLASS_OPTIONS.blur);
    expect(opts.opacity).toBe(1);
    expect(opts.thickness).toBe(0);
    expect(opts.ior).toBe(DEFAULT_GLASS_OPTIONS.ior);
    expect(opts.dispersion).toBe(0);
  });

  it('keeps constants and presets frozen', () => {
    expect(Object.isFrozen(DEFAULT_GLASS_OPTIONS)).toBe(true);
    expect(Object.isFrozen(GLASS_PRESETS)).toBe(true);
    expect(Object.isFrozen(GLASS_PRESETS['ios-like'])).toBe(true);
  });
});
