import { describe, it, expect } from 'vitest';
import { normalizeOptions } from '../src/engine/options';
import { DEFAULT_GLASS_OPTIONS, GLASS_PRESETS } from '../src/constants';

describe('engine/options', () => {
  it('populates defaults when no options provided', () => {
    const opts = normalizeOptions();
    expect(opts.blur).toBe(DEFAULT_GLASS_OPTIONS.blur);
    expect(opts.ior).toBe(DEFAULT_GLASS_OPTIONS.ior);
    expect(opts.renderer).toBe('auto');
  });

  it('preserves valid user overrides', () => {
    const opts = normalizeOptions({ blur: 10, ior: 2.5, renderer: 'svg' });
    expect(opts.blur).toBe(10);
    expect(opts.ior).toBe(2.5);
    expect(opts.renderer).toBe('svg');
  });

  it('safely clamps and sanitizes NaN, Infinity and out-of-bound numbers', () => {
    const opts = normalizeOptions({
      blur: NaN,
      opacity: 999,
      thickness: -50,
      ior: Infinity,
      dispersion: -1,
    });

    expect(opts.blur).toBe(DEFAULT_GLASS_OPTIONS.blur);
    expect(opts.opacity).toBe(1); // clamped to max 1
    expect(opts.thickness).toBe(0); // clamped to min 0
    expect(opts.ior).toBe(DEFAULT_GLASS_OPTIONS.ior);
    expect(opts.dispersion).toBe(0); // clamped to min 0
  });

  it('ensures constants and presets are deeply frozen', () => {
    expect(Object.isFrozen(DEFAULT_GLASS_OPTIONS)).toBe(true);
    expect(Object.isFrozen(GLASS_PRESETS)).toBe(true);
    expect(Object.isFrozen(GLASS_PRESETS['ios-like'])).toBe(true);
  });
});
