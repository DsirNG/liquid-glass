
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
