const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export type KnownRestriction =
  | 'webkit-svg-backdrop-displacement'
  | 'ios-svg-backdrop-displacement'
  | 'gecko-svg-backdrop-displacement';

export interface CapabilityReport {
  readonly backdropFilter: boolean;
  readonly svgFilter: boolean;
  readonly svgDisplacementMap: boolean;
  /** Raw feature combination. Known browser restrictions are reported separately. */
  readonly svgBackdropDisplacement: boolean;
  readonly cssFilter: boolean;
  readonly knownRestrictions: readonly KnownRestriction[];
}

function isDomRuntime(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof navigator !== 'undefined'
  );
}

function supportsCssFeature(property: string, value: string): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    // Keep the existing compatibility behavior for test/runtime environments
    // that do not expose CSS.supports. The real browser probe remains factual.
    return true;
  }

  return CSS.supports(property, value);
}

function supportsSvgFilter(): boolean {
  if (typeof document.createElementNS !== 'function') return false;

  const filter = document.createElementNS(SVG_NAMESPACE, 'filter');
  return typeof filter.setAttribute === 'function';
}

function supportsSvgDisplacementMap(): boolean {
  if (typeof document.createElementNS !== 'function') return false;

  const displacementMap = document.createElementNS(SVG_NAMESPACE, 'feDisplacementMap');
  return typeof displacementMap.setAttribute === 'function';
}

function detectKnownRestrictions(): readonly KnownRestriction[] {
  const userAgent = navigator.userAgent;
  const isIOS =
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (typeof navigator.platform === 'string' &&
      navigator.platform === 'MacIntel' &&
      (navigator.maxTouchPoints ?? 0) > 1);

  if (isIOS) {
    return ['ios-svg-backdrop-displacement'];
  }

  if (/Firefox\//i.test(userAgent)) return ['gecko-svg-backdrop-displacement'];

  const isWebKit = /AppleWebKit/i.test(userAgent);
  const isChromium = /Chrome|CriOS|Edg|OPR/i.test(userAgent);
  const isSafari = isWebKit && !isChromium && /Safari/i.test(userAgent);

  return isSafari ? ['webkit-svg-backdrop-displacement'] : [];
}

export function hasBlockingRestriction(
  report: Pick<CapabilityReport, 'knownRestrictions'>
): boolean {
  return report.knownRestrictions.length > 0;
}

/** Reports runtime facts without selecting a render backend. */
export class CapabilityProbe {
  private static cached: CapabilityReport | null = null;

  public static probe(): CapabilityReport {
    if (this.cached) return this.cached;

    this.cached = this.runProbe();
    return this.cached;
  }

  /** Clears the process-level probe cache for isolated tests. */
  public static resetForTests(): void {
    this.cached = null;
  }

  private static runProbe(): CapabilityReport {
    if (!isDomRuntime()) {
      return Object.freeze({
        backdropFilter: false,
        svgFilter: false,
        svgDisplacementMap: false,
        svgBackdropDisplacement: false,
        cssFilter: false,
        knownRestrictions: Object.freeze([]),
      });
    }

    const backdropFilter =
      supportsCssFeature('backdrop-filter', 'blur(1px)') ||
      supportsCssFeature('-webkit-backdrop-filter', 'blur(1px)');
    const svgFilter = supportsSvgFilter();
    const svgDisplacementMap = supportsSvgDisplacementMap();
    const knownRestrictions = Object.freeze([...detectKnownRestrictions()]);

    return Object.freeze({
      backdropFilter,
      svgFilter,
      svgDisplacementMap,
      svgBackdropDisplacement: backdropFilter && svgFilter && svgDisplacementMap,
      cssFilter: supportsCssFeature('filter', 'blur(1px)'),
      knownRestrictions,
    });
  }
}
