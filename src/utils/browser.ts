/**
 * Checks whether WebGL (WebGL 1 or experimental-webgl) is supported by the current environment.
 */
export function supportsWebGLRenderer(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!(window.WebGLRenderingContext && gl);
  } catch {
    return false;
  }
}

/**
 * Checks whether SVG Filters (feDisplacementMap, backdrop-filter) are supported.
 */
export function supportsSvgRenderer(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  try {
    return (
      typeof SVGFEDisplacementMapElement !== 'undefined' ||
      document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#Filter', '1.1') ||
      !!document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap')
    );
  } catch {
    return false;
  }
}

/**
 * Checks whether user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
