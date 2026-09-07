import { describe, it, expect } from 'vitest';
import { normalizeOptions } from '../src/engine/options';
import { DEFAULT_GLASS_OPTIONS, GLASS_PRESETS } from '../src/constants';

describe('engine/options', () => {
  it('populates DOM material defaults', () => {
    const opts = normalizeOptions();
    expect(opts.blur).toBe(DEFAULT_GLASS_OPTIONS.blur);
    expect(opts.ior).toBe(DEFAULT_GLASS_OPTIONS.ior);
    expect(opts.quality).toBe(DEFAULT_GLASS_OPTIONS.quality);
    expect(opts).not.toHaveProperty('renderer');
    expect(opts).not.toHaveProperty('backgroundUrl');
  });

  it('preserves valid material overrides', () => {
    const opts = normalizeOptions({ blur: 10, ior: 2.5, quality: 'ultra' });
    expect(opts.blur).toBe(10);
    expect(opts.ior).toBe(2.5);
    expect(opts.quality).toBe('ultra');
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

  it('defines every standard preset as an independent adjustable material snapshot', () => {
    const adjustableKeys = [
      'blur',
      'opacity',
      'thickness',
      'ior',
      'refraction',
      'dispersion',
      'saturation',
      'tint',
      'radius',
      'bezel',
      'specular',
      'shadow',
      'debug',
    ] as const;

    for (const preset of Object.values(GLASS_PRESETS)) {
      for (const key of adjustableKeys) {
        expect(preset).toHaveProperty(key);
      }
      expect(preset.debug).toBe('none');
      expect(preset.refraction).toBeGreaterThan(0);
      expect(preset.dispersion).toBeGreaterThanOrEqual(0);
      expect(preset.dispersion).toBeLessThanOrEqual(4);
    }
  });
});
