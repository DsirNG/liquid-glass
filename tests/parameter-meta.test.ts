import { describe, expect, it } from 'vitest';
import { normalizeOptionPatch, normalizeOptions } from '../src/engine/options';
import {
  PARAMETER_META,
  UnknownParameterError,
  resolveUpdateImpact,
} from '../src/engine/parameters';
import type { LiquidGlassUpdateOptions } from '../src/types';

describe('ParameterMeta update impact', () => {
  it('registers the real field, filter, material, and style boundaries', () => {
    expect(PARAMETER_META.radius.impact).toBe('field');
    expect(PARAMETER_META.surfaceProfile.impact).toBe('field');
    expect(PARAMETER_META.ior.impact).toBe('field');
    expect(PARAMETER_META.refraction.impact).toBe('filter');
    expect(PARAMETER_META.blur.impact).toBe('material');
    expect(PARAMETER_META.tint.impact).toBe('style');
    expect(PARAMETER_META.materialPreset.impact).toBe('field');
    expect(PARAMETER_META.debug.impact).toBe('filter');
  });

  it('exhaustively registers every material option that can be updated', () => {
    const normalizedOptionKeys = Object.keys(normalizeOptions())
      .filter((key) => key !== 'interactive' && key !== 'fallbackPolicy')
      .sort();

    expect(Object.keys(PARAMETER_META).sort()).toEqual(normalizedOptionKeys);
  });

  it('uses the highest impact for a combined update', () => {
    expect(resolveUpdateImpact({ tint: '#fff', radius: 24 })).toBe('field');
    expect(resolveUpdateImpact({ blur: 8, dispersion: 2 })).toBe('filter');
    expect(resolveUpdateImpact({ tint: '#fff', opacity: 0.2 })).toBe('style');
  });

  it('canonicalizes the surfaceShape alias before resolving impact', () => {
    const patch = normalizeOptionPatch({ surfaceShape: 'fluid_dome' });

    expect(patch).toEqual({ surfaceProfile: 'fluid_dome' });
    expect(resolveUpdateImpact({ surfaceShape: 'fluid_dome' })).toBe('field');
    expect(PARAMETER_META.surfaceShape.aliasOf).toBe('surfaceProfile');
  });

  it('fails loudly when a runtime update key is not registered', () => {
    expect(() =>
      resolveUpdateImpact({ futureOption: true } as unknown as LiquidGlassUpdateOptions)
    ).toThrow(UnknownParameterError);
  });
});
