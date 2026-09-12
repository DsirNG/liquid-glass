import { describe, expect, it } from 'vitest';
import type { CapabilityReport } from '../src/engine';
import { getParameterSupportRows } from '../playground/debug/runtime-observability';

const fullReport: CapabilityReport = {
  backdropFilter: true,
  svgFilter: true,
  svgDisplacementMap: true,
  svgBackdropDisplacement: true,
  cssFilter: true,
  knownRestrictions: [],
};

function getLevel(
  activeMode: 'full-optical' | 'material' | 'static' | null,
  key: string,
  report: CapabilityReport = fullReport
) {
  const row = getParameterSupportRows({ activeMode }, report).find((item) => item.key === key);
  if (!row) throw new Error(`Missing support row for ${key}`);
  return row.level;
}

describe('playground runtime observability support levels', () => {
  it('reports full optical parameters as fully supported', () => {
    expect(getLevel('full-optical', 'refraction')).toBe('full');
    expect(getLevel('full-optical', 'dispersion')).toBe('full');
    expect(getLevel('full-optical', 'shape')).toBe('full');
  });

  it('distinguishes material approximations from unsupported optical effects', () => {
    expect(getLevel('material', 'shape')).toBe('approximate');
    expect(getLevel('material', 'specular')).toBe('approximate');
    expect(getLevel('material', 'blur')).toBe('full');
    expect(getLevel('material', 'tint')).toBe('full');
    expect(getLevel('material', 'refraction')).toBe('unsupported');
    expect(getLevel('material', 'dispersion')).toBe('unsupported');
  });

  it('does not claim backdrop effects in the static fallback', () => {
    expect(getLevel('static', 'blur')).toBe('unsupported');
    expect(getLevel('static', 'refraction')).toBe('unsupported');
    expect(getLevel('static', 'tint')).toBe('full');
  });

  it('marks parameters as waiting while no backend is active', () => {
    expect(getLevel(null, 'refraction')).toBe('unsupported');
  });
});
