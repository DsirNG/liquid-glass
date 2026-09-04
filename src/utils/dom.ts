/**
 * Returns safe bounding client rect of an element, with fallback dimensions.
 */
export function getElementRect(element: HTMLElement): {
  width: number;
  height: number;
  left: number;
  top: number;
} {
  if (typeof element.getBoundingClientRect === 'function') {
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width || element.offsetWidth || 300,
      height: rect.height || element.offsetHeight || 200,
      left: rect.left || 0,
      top: rect.top || 0,
    };
  }
  return {
    width: element.offsetWidth || 300,
    height: element.offsetHeight || 200,
    left: 0,
    top: 0,
  };
}

/**
 * Ensures a global SVG element with <defs> exists on document.body to house dynamic filters.
 */
export function ensureGlobalSvgDefs(rootId = 'liquid-glass-svg-root'): SVGDefsElement | null {
  if (typeof document === 'undefined') return null;

  let svgRoot = document.getElementById(rootId) as SVGSVGElement | null;
  if (!svgRoot) {
    svgRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgRoot.id = rootId;
    svgRoot.setAttribute('width', '0');
    svgRoot.setAttribute('height', '0');
    svgRoot.style.position = 'absolute';
    svgRoot.style.overflow = 'hidden';
    svgRoot.style.pointerEvents = 'none';
    svgRoot.setAttribute('color-interpolation-filters', 'sRGB');
    document.body.appendChild(svgRoot);
  }

  let defs = svgRoot.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgRoot.appendChild(defs);
  }

  return defs;
}
