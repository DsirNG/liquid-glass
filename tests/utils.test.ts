import { describe, it, expect } from 'vitest';
import { clamp, lerp } from '../src/utils/math';
import { hexToRgb } from '../src/utils/color';
import { supportsWebGLRenderer, supportsSvgRenderer } from '../src/utils/browser';

describe('utils/math', () => {
  it('clamps values within bounds', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('lerps correctly between numbers', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
  });
});

describe('utils/color', () => {
  it('converts 6-digit hex to rgb string', () => {
    expect(hexToRgb('#ffffff')).toBe('255, 255, 255');
    expect(hexToRgb('#000000')).toBe('0, 0, 0');
    expect(hexToRgb('#ff0000')).toBe('255, 0, 0');
  });

  it('converts 3-digit hex to rgb string', () => {
    expect(hexToRgb('#fff')).toBe('255, 255, 255');
    expect(hexToRgb('#000')).toBe('0, 0, 0');
  });

  it('handles invalid hex by returning fallback white rgb', () => {
    expect(hexToRgb('invalid')).toBe('255, 255, 255');
  });
});

describe('utils/browser', () => {
  it('checks browser capabilities safely without crashing in test env', () => {
    expect(typeof supportsWebGLRenderer()).toBe('boolean');
    expect(typeof supportsSvgRenderer()).toBe('boolean');
  });
});
