import { describe, it, expect } from 'vitest';
import { canonicalizeOptions, normalizeOptionPatch, normalizeOptions } from '../src/engine/options';
import { DEFAULT_GLASS_OPTIONS, GLASS_PRESETS } from '../src/constants';
import { RenderPlanUnsupportedError, resolveRenderPlan } from '../src/engine/planning';

describe('engine/options', () => {
  it('populates DOM material defaults', () => {
    const opts = normalizeOptions();
    expect(opts.blur).toBe(DEFAULT_GLASS_OPTIONS.blur);
    expect(opts.ior).toBe(DEFAULT_GLASS_OPTIONS.ior);
    expect(opts.quality).toBe(DEFAULT_GLASS_OPTIONS.quality);
    expect(opts.refractionCoverage).toBe('full');
    expect(opts.surfaceProfile).toBe('concave');
    expect(opts.surfaceShape).toBe('concave');
    expect(opts).not.toHaveProperty('renderer');
    expect(opts).not.toHaveProperty('backgroundUrl');
  });

  it('preserves valid material overrides', () => {
    const opts = normalizeOptions({ blur: 10, ior: 2.5, quality: 'ultra' });
    expect(opts.blur).toBe(10);
    expect(opts.ior).toBe(2.5);
    expect(opts.quality).toBe('ultra');
  });

  it('normalizes the public fallback policy with auto as the default', () => {
    expect(normalizeOptions().fallbackPolicy).toBe('auto');
    expect(normalizeOptions({ fallbackPolicy: 'preserve' }).fallbackPolicy).toBe('preserve');
    expect(normalizeOptions({ fallbackPolicy: 'strict' }).fallbackPolicy).toBe('strict');
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

  it('normalizes the surfaceShape compatibility alias into one canonical profile', () => {
    const normalized = normalizeOptions({ surfaceShape: 'fluid_dome' });
    expect(normalized.surfaceShape).toBe('fluid_dome');
    expect(normalized.surfaceProfile).toBe('fluid_dome');

    const canonicalField = normalizeOptions({ surfaceProfile: 'concave' });
    expect(canonicalField.surfaceShape).toBe('concave');
    expect(canonicalField.surfaceProfile).toBe('concave');
    expect(normalizeOptions({ surfaceShape: 'convex_squircle' }).surfaceProfile).toBe(
      'convex_squircle'
    );

    expect(normalizeOptionPatch({ surfaceShape: 'viscous_meniscus' })).toEqual({
      surfaceProfile: 'viscous_meniscus',
    });

    expect(
      normalizeOptionPatch({ surfaceShape: 'fluid_dome', surfaceProfile: 'cylindrical_rod' })
    ).toEqual({ surfaceProfile: 'cylindrical_rod' });
  });

  it('keeps fallback intent separate from requested optical options', () => {
    const requested = canonicalizeOptions(
      normalizeOptions({ blur: 0, opacity: 0, refraction: 1, dispersion: 2 })
    );
    const plan = resolveRenderPlan({
      requested,
      capabilities: {
        opticalField: false,
        refraction: false,
        dispersion: false,
        backdropBlur: true,
        saturation: true,
        tint: true,
        shadow: true,
        specular: true,
      },
    });

    expect(plan.targetMode).toBe('material');
    if (plan.targetMode !== 'material') throw new Error('Expected material render plan');

    expect(plan.requestedOptions.blur).toBe(0);
    expect(plan.requestedOptions.opacity).toBe(0);
    expect(plan.effective.backdrop.blur).toBe(0);
    expect(plan.effective.common.opacity).toBe(0.025);
    expect(plan.degraded).toBe(true);
    expect(plan.degradationReason).toBe('optical-unsupported');
  });

  it('preserves explicit material values when the fallback policy requests preservation', () => {
    const requested = canonicalizeOptions(normalizeOptions({ blur: 0, opacity: 0 }));
    const plan = resolveRenderPlan({
      requested,
      fallbackPolicy: 'preserve',
      capabilities: {
        opticalField: false,
        refraction: false,
        dispersion: false,
        backdropBlur: true,
        saturation: true,
        tint: true,
        shadow: true,
        specular: true,
      },
    });

    expect(plan.targetMode).toBe('material');
    if (plan.targetMode !== 'material') throw new Error('Expected material render plan');

    expect(plan.effective.backdrop.blur).toBe(0);
    expect(plan.effective.common.opacity).toBe(0);
    expect(plan.fallbackPolicy).toBe('preserve');
  });

  it('reports unsupported instead of silently degrading under strict policy', () => {
    const requested = canonicalizeOptions(normalizeOptions());

    expect(() =>
      resolveRenderPlan({
        requested,
        fallbackPolicy: 'strict',
        capabilities: {
          opticalField: false,
          refraction: false,
          dispersion: false,
          backdropBlur: true,
          saturation: true,
          tint: true,
          shadow: true,
          specular: true,
        },
      })
    ).toThrow(RenderPlanUnsupportedError);
  });

  it('selects the static backend when backdrop filtering is unavailable', () => {
    const requested = canonicalizeOptions(normalizeOptions({ opacity: 0 }));
    const plan = resolveRenderPlan({
      requested,
      capabilities: {
        opticalField: false,
        refraction: false,
        dispersion: false,
        backdropBlur: false,
        saturation: true,
        tint: true,
        shadow: true,
        specular: true,
      },
    });

    expect(plan.targetMode).toBe('static');
    if (plan.targetMode !== 'static') throw new Error('Expected static render plan');

    expect(plan.requestedOptions.opacity).toBe(0);
    expect(plan.effective.static.fillOpacity).toBe(0.08);
    expect(plan.degradationReason).toBe('backdrop-filter-unsupported');
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
