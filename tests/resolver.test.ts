import { describe, it, expect, vi } from 'vitest';
import { resolveRenderer } from '../src/engine/resolver';
import * as browserUtils from '../src/utils/browser';

describe('engine/resolver', () => {
  it('explicit svg requests return svg when supported', () => {
    vi.spyOn(browserUtils, 'supportsSvgRenderer').mockReturnValue(true);
    expect(resolveRenderer('svg')).toBe('svg');
    vi.restoreAllMocks();
  });

  it('explicit svg throws error when svg filter is unsupported (zero silent fallback)', () => {
    vi.spyOn(browserUtils, 'supportsSvgRenderer').mockReturnValue(false);
    expect(() => resolveRenderer('svg')).toThrowError(/SVG renderer was explicitly requested/);
    vi.restoreAllMocks();
  });

  it('explicit webgl requests return webgl when supported', () => {
    vi.spyOn(browserUtils, 'supportsWebGLRenderer').mockReturnValue(true);
    expect(resolveRenderer('webgl')).toBe('webgl');
    vi.restoreAllMocks();
  });

  it('explicit webgl throws error when webgl is unsupported (zero silent fallback)', () => {
    vi.spyOn(browserUtils, 'supportsWebGLRenderer').mockReturnValue(false);
    expect(() => resolveRenderer('webgl')).toThrowError(/WebGL renderer was explicitly requested/);
    vi.restoreAllMocks();
  });

  it('auto gracefully falls back to svg if webgl is unavailable', () => {
    vi.spyOn(browserUtils, 'supportsWebGLRenderer').mockReturnValue(false);
    vi.spyOn(browserUtils, 'supportsSvgRenderer').mockReturnValue(true);
    expect(resolveRenderer('auto')).toBe('svg');
    vi.restoreAllMocks();
  });

  it('auto throws error if neither webgl nor svg is supported', () => {
    vi.spyOn(browserUtils, 'supportsWebGLRenderer').mockReturnValue(false);
    vi.spyOn(browserUtils, 'supportsSvgRenderer').mockReturnValue(false);
    expect(() => resolveRenderer('auto')).toThrowError(/Neither WebGL nor SVG filter/);
    vi.restoreAllMocks();
  });
});
