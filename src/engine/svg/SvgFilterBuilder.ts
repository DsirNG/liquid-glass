import type { ResolvedMaterial } from './MaterialResolver';
import type { OpticalFieldAssets } from './OpticalFieldAssets';
import { ensureGlobalSvgDefs } from '../../utils/dom';

export interface DispersionScales {
  r: number;
  g: number;
  b: number;
}

export interface FilterViewport {
  width: number;
  height: number;
}

const MIN_FILTER_SAMPLING_MARGIN = 24;
const MAX_FILTER_SAMPLING_MARGIN = 192;

const ADAPTIVE_VISIBILITY_FEASIBILITY = Object.freeze({
  minMorphologyRadius: 1,
  maxMorphologyRadius: 16,
  defaultMorphologyRadius: 4,
  visibilityTable: '1 1 0.8 0.4 0.1 0',
});

function resolveFilterSamplingMargin(material: ResolvedMaterial): number {
  const requestedMargin = Number.isFinite(material.samplingMargin)
    ? Math.ceil(material.samplingMargin)
    : MIN_FILTER_SAMPLING_MARGIN;

  // The optical field already includes the actual refraction amplitude and
  // blur budget. Never expand the filter by the whole host size: on a large
  // viewport that turns a small glass surface into an enormous compositor
  // surface and causes long Commit phases.
  return Math.max(
    MIN_FILTER_SAMPLING_MARGIN,
    Math.min(MAX_FILTER_SAMPLING_MARGIN, requestedMargin)
  );
}

export const DISPERSION_PROFILES = {
  subtle: { red: 0, green: 0.025, blue: 0.05 },
  ios: { red: 0, green: 0.05, blue: 0.1 },
  strong: { red: 0, green: 0.08, blue: 0.16 },
} as const;

export type DispersionProfileName = keyof typeof DISPERSION_PROFILES;

export function resolveDispersionScales(
  scale: number,
  dispersion = 1.5,
  profile: DispersionProfileName = 'ios'
): DispersionScales {
  const p = DISPERSION_PROFILES[profile] || DISPERSION_PROFILES.ios;
  const spread = Math.max(0, p.blue * dispersion);
  return {
    r: -scale * (1 + spread * 0.5),
    g: -scale,
    b: -scale * (1 - spread * 0.5),
  };
}

function resolveSafeRefractionScale(
  material: ResolvedMaterial,
  physicalAmplitude: number,
  userRefraction: number,
  width: number,
  height: number
): number {
  const gain = material.calibration?.optics?.refractionGain ?? 1;
  const requested = physicalAmplitude * material.lensingGain * userRefraction * gain;
  // A displacement larger than the control's curved cross section folds the
  // sampled backdrop over itself and exposes straight filter boundaries.
  const budget = Math.max(22, Math.min(56, Math.min(width, height) * 0.28));
  return budget * Math.tanh(requested / budget);
}

/**
 * Builds high-fidelity SVG Filter Graph implementing the differential optical pipeline:
 * - Dynamic userSpaceOnUse filter region to avoid clipping wide refractions and scattering blur.
 * - Normalized optical vector field driven by physical amplitude * lensingGain.
 * - Continuous partition-of-unity basis: Body scattering, Inner lensing/dispersion, Coverage clipping.
 */
export class SvgFilterBuilder {
  public static resolveDispersionScales = resolveDispersionScales;

  /**
   * Builds an intentionally unwired graph for Phase 8D-0A feasibility checks.
   *
   * The fragment is kept pure so feasibility tests and the production adaptive
   * branch use the same signal path. The 8D-0A probe can consume it without
   * changing the active visual path; 8D-1 wires it only for adaptive borders.
   */
  public static buildAdaptiveVisibilityFeasibilityGraph(
    morphologyRadius = ADAPTIVE_VISIBILITY_FEASIBILITY.defaultMorphologyRadius
  ): string {
    const requestedRadius = Number.isFinite(morphologyRadius)
      ? morphologyRadius
      : ADAPTIVE_VISIBILITY_FEASIBILITY.defaultMorphologyRadius;
    const radius = Math.max(
      ADAPTIVE_VISIBILITY_FEASIBILITY.minMorphologyRadius,
      Math.min(ADAPTIVE_VISIBILITY_FEASIBILITY.maxMorphologyRadius, Math.round(requestedRadius))
    );
    const visibilityTable = ADAPTIVE_VISIBILITY_FEASIBILITY.visibilityTable;

    return `
      <!-- Phase 8D-0A feasibility graph: intentionally not wired into build(). -->
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="0.2126 0.7152 0.0722 0 0
                0.2126 0.7152 0.0722 0 0
                0.2126 0.7152 0.0722 0 0
                0 0 0 0 1"
        result="ADAPTIVE_LUMA"
      />
      <feMorphology
        in="ADAPTIVE_LUMA"
        operator="dilate"
        radius="${radius}"
        result="ADAPTIVE_LUMA_MAX"
      />
      <feMorphology
        in="ADAPTIVE_LUMA"
        operator="erode"
        radius="${radius}"
        result="ADAPTIVE_LUMA_MIN"
      />
      <feBlend
        in="ADAPTIVE_LUMA_MAX"
        in2="ADAPTIVE_LUMA_MIN"
        mode="difference"
        result="ADAPTIVE_LOCAL_RANGE"
      />
      <feComponentTransfer in="ADAPTIVE_LOCAL_RANGE" result="ADAPTIVE_VISIBILITY_NEED">
        <feFuncR type="table" tableValues="${visibilityTable}" />
        <feFuncG type="table" tableValues="${visibilityTable}" />
        <feFuncB type="table" tableValues="${visibilityTable}" />
        <feFuncA type="table" tableValues="1" />
      </feComponentTransfer>
      <feComponentTransfer in="ADAPTIVE_LUMA" result="ADAPTIVE_DARK_POLARITY">
        <feFuncR type="table" tableValues="1 0" />
        <feFuncG type="table" tableValues="1 0" />
        <feFuncB type="table" tableValues="1 0" />
        <feFuncA type="table" tableValues="1" />
      </feComponentTransfer>
      <feComponentTransfer in="ADAPTIVE_LUMA" result="ADAPTIVE_LIGHT_POLARITY">
        <feFuncR type="table" tableValues="0 1" />
        <feFuncG type="table" tableValues="0 1" />
        <feFuncB type="table" tableValues="0 1" />
        <feFuncA type="table" tableValues="1" />
      </feComponentTransfer>
      <feComposite
        in="ADAPTIVE_VISIBILITY_NEED"
        in2="ADAPTIVE_DARK_POLARITY"
        operator="arithmetic"
        k1="1"
        k2="0"
        k3="0"
        k4="0"
        result="ADAPTIVE_DARK_NEED"
      />
      <feComposite
        in="ADAPTIVE_VISIBILITY_NEED"
        in2="ADAPTIVE_LIGHT_POLARITY"
        operator="arithmetic"
        k1="1"
        k2="0"
        k3="0"
        k4="0"
        result="ADAPTIVE_LIGHT_NEED"
      />
      <feComposite
        in="ADAPTIVE_DARK_NEED"
        in2="OUTER_MASK"
        operator="in"
        result="ADAPTIVE_OUTER_RESPONSE"
      />
      <feComposite
        in="ADAPTIVE_LIGHT_NEED"
        in2="EDGE_MASK"
        operator="in"
        result="ADAPTIVE_INNER_RESPONSE"
      />
      <feBlend
        in="ADAPTIVE_OUTER_RESPONSE"
        in2="ADAPTIVE_INNER_RESPONSE"
        mode="screen"
        result="ADAPTIVE_BOUNDARY_RESPONSE"
      />
      <feComposite
        in="ADAPTIVE_BOUNDARY_RESPONSE"
        in2="COVERAGE_MASK"
        operator="in"
        result="ADAPTIVE_COVERAGE_RESPONSE"
      />
    `;
  }

  public static build(
    material: ResolvedMaterial,
    assets?: OpticalFieldAssets | null,
    userRefraction = 1.0,
    viewport?: FilterViewport
  ): string {
    const { bodyBlur, dispersionGain, colorBleed = 0.6, refractionCoverage = 'full' } = material;
    const isFullCoverage = refractionCoverage !== 'rim';
    const width = viewport?.width ?? assets?.width ?? 300;
    const height = viewport?.height ?? assets?.height ?? 80;
    const physicalAmplitude = assets?.physicalAmplitude ?? 32;
    const baseScale = resolveSafeRefractionScale(
      material,
      physicalAmplitude,
      userRefraction,
      width,
      height
    );
    const scales = resolveDispersionScales(baseScale, dispersionGain);
    const vectorHref = assets?.vectorUrl || '';
    const basisHref = assets?.basisUrl || '';
    const mask = (result: string, channel: string) =>
      `<feColorMatrix in="BASIS_FIELD" type="matrix" values="${channel} ${channel} ${channel} ${channel}" result="${result}" />`;
    const debugOutputs: Record<string, string> = {
      vector: 'DISPLACEMENT_TEXTURE',
      outer: 'OUTER_MASK',
      inner: 'EDGE_MASK',
      body: 'BODY_MASK',
      coverage: 'COVERAGE_MASK',
      refraction: 'RGB_COMBINED',
    };
    return `
      <feImage href="${vectorHref}" xlink:href="${vectorHref}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none" result="DISPLACEMENT_TEXTURE" />
      <feImage href="${basisHref}" xlink:href="${basisHref}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="none" result="BASIS_FIELD" />
      ${mask('OUTER_MASK', '1 0 0 0 0')}
      ${mask('EDGE_MASK', '0 1 0 0 0')}
      ${mask('BODY_MASK', '0 0 1 0 0')}
      ${mask('COVERAGE_MASK', '0 0 0 1 0')}
      ${mask('REFRACTION_MASK', isFullCoverage ? '0 0 0 1 0' : '1 1 0 0 0')}
      <!-- Scatter before lensing: blur must still work with full coverage. -->
      <feGaussianBlur in="SourceGraphic" stdDeviation="${bodyBlur}" result="BODY_BLURRED" />
      <feOffset in="BODY_BLURRED" dx="0" dy="0" result="BODY_MATERIAL" />
      <feGaussianBlur in="BODY_MATERIAL" stdDeviation="${colorBleed * 3.5}" result="SOURCE_BLEED" />
      <!-- Chromatic scatter belongs to the curved transition. Keep the
           transmitted body crisp even when colorBleed is nonzero. -->
      <feComposite in="SOURCE_BLEED" in2="EDGE_MASK" operator="in" result="EDGE_BLEED" />
      <feComposite in="BODY_MATERIAL" in2="EDGE_MASK" operator="out" result="CLEAR_BODY" />
      <feComposite in="EDGE_BLEED" in2="CLEAR_BODY" operator="over" result="CHROMATIC_SOURCE" />
      ${['RED', 'GREEN', 'BLUE']
        .map(
          (name, i) => `
        <feDisplacementMap in="CHROMATIC_SOURCE" in2="DISPLACEMENT_TEXTURE" scale="${[scales.r, scales.g, scales.b][i]}" xChannelSelector="R" yChannelSelector="G" result="${name}_DISPLACED" />
      `
        )
        .join('')}
      <feComposite in="RED_DISPLACED" in2="GREEN_DISPLACED" operator="arithmetic" k2="0.2" k3="0.8" result="RG_COMBINED" />
      <feComposite in="RG_COMBINED" in2="BLUE_DISPLACED" operator="arithmetic" k2="0.8" k3="0.2" result="RGB_COMBINED" />
      <!-- Mix full-color samples. Isolating R/G/B into opaque black planes
           creates a rectangular dark artifact in Chromium's backdrop filter. -->
      <feComposite in="${debugOutputs[material.debug] || 'RGB_COMBINED'}" in2="COVERAGE_MASK" operator="in" result="FINAL_GLASS" />
    `;
  }
}

let filterCounter = 0;

/**
 * Manages the SVG <filter> DOM node in the global SVG defs container.
 */
export class SvgGlassEngine {
  private defsContainer: SVGDefsElement | null = null;
  private filterElement: SVGFilterElement | null = null;
  private isDestroyed = false;
  private graphSignature = '';
  public readonly filterId: string;

  constructor(idPrefix = 'lg-svg-filter') {
    this.filterId = `${idPrefix}-${++filterCounter}`;
    this.initFilterElement();
  }

  private ensureDefs(): SVGDefsElement | null {
    if (this.defsContainer && this.defsContainer.isConnected) {
      return this.defsContainer;
    }
    const defs = ensureGlobalSvgDefs();
    this.defsContainer = defs;
    return defs;
  }

  private initFilterElement(): void {
    const defs = this.ensureDefs();
    if (!defs) return;

    if (!this.filterElement) {
      this.filterElement = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      this.filterElement.id = this.filterId;
      this.filterElement.setAttribute('color-interpolation-filters', 'sRGB');
      this.filterElement.setAttribute('filterUnits', 'userSpaceOnUse');
      this.filterElement.setAttribute('primitiveUnits', 'userSpaceOnUse');
      this.filterElement.setAttribute('x', '-20%');
      this.filterElement.setAttribute('y', '-20%');
      this.filterElement.setAttribute('width', '140%');
      this.filterElement.setAttribute('height', '140%');
      defs.appendChild(this.filterElement);
    }
  }

  private getGraphSignature(
    material: ResolvedMaterial,
    assets?: OpticalFieldAssets | null
  ): string {
    return [
      assets?.vectorUrl ?? '',
      assets?.basisUrl ?? '',
      material.debug,
      material.refractionCoverage,
    ].join('|');
  }

  private patchDynamicNodes(
    material: ResolvedMaterial,
    assets: OpticalFieldAssets | null | undefined,
    userRefraction: number,
    width: number,
    height: number
  ): void {
    if (!this.filterElement) return;

    const images = this.filterElement.querySelectorAll('feImage');
    images.forEach((image) => {
      image.setAttribute('width', `${width}`);
      image.setAttribute('height', `${height}`);
    });

    this.filterElement
      .querySelector('[result="BODY_BLURRED"]')
      ?.setAttribute('stdDeviation', String(material.bodyBlur));
    this.filterElement
      .querySelector('[result="SOURCE_BLEED"]')
      ?.setAttribute('stdDeviation', String(material.colorBleed * 3.5));

    const physicalAmplitude = assets?.physicalAmplitude ?? 32;
    const baseScale = resolveSafeRefractionScale(
      material,
      physicalAmplitude,
      userRefraction,
      width,
      height
    );
    const scales = SvgFilterBuilder.resolveDispersionScales(baseScale, material.dispersionGain);
    const displacementMaps = this.filterElement.querySelectorAll('feDisplacementMap');
    [scales.r, scales.g, scales.b].forEach((scale, index) => {
      displacementMaps[index]?.setAttribute('scale', `${scale}`);
    });
  }

  public update(
    material: ResolvedMaterial,
    assets?: OpticalFieldAssets | null,
    userRefraction = 1.0,
    viewport?: FilterViewport
  ): void {
    if (this.isDestroyed) return;
    this.initFilterElement();
    if (!this.filterElement) return;

    const width = viewport?.width ?? assets?.width ?? 300;
    const height = viewport?.height ?? assets?.height ?? 80;
    // The backdrop-filter implementation may expose the user-space filter
    // region as a visible surface boundary while the host is resizing. Keep
    // that boundary well outside the card so it can never become an inner seam.
    const samplingMargin = resolveFilterSamplingMargin(material);
    const x = -samplingMargin;
    const y = -samplingMargin;
    const w = width + 2 * samplingMargin;
    const h = height + 2 * samplingMargin;

    // Exact userSpaceOnUse dimensions to avoid clipping
    this.filterElement.setAttribute('filterUnits', 'userSpaceOnUse');
    this.filterElement.setAttribute('primitiveUnits', 'userSpaceOnUse');
    this.filterElement.setAttribute('x', `${x}`);
    this.filterElement.setAttribute('y', `${y}`);
    this.filterElement.setAttribute('width', `${w}`);
    this.filterElement.setAttribute('height', `${h}`);

    const nextGraphSignature = this.getGraphSignature(material, assets);
    if (nextGraphSignature !== this.graphSignature) {
      this.filterElement.innerHTML = SvgFilterBuilder.build(
        material,
        assets,
        userRefraction,
        viewport
      );
      this.graphSignature = nextGraphSignature;
      return;
    }

    // Scalar material changes stay synchronous, but patch existing nodes
    // instead of replacing the entire SVG graph on every slider event.
    this.patchDynamicNodes(material, assets, userRefraction, width, height);
  }

  /** Update only the sampling viewport while reusing the current optical field. */
  public resizeViewport(viewport: FilterViewport, samplingMargin = 24): void {
    if (this.isDestroyed) return;
    this.initFilterElement();
    if (!this.filterElement) return;

    const width = Math.max(16, viewport.width);
    const height = Math.max(16, viewport.height);
    const effectiveSamplingMargin = Math.max(
      MIN_FILTER_SAMPLING_MARGIN,
      Math.min(MAX_FILTER_SAMPLING_MARGIN, Math.ceil(samplingMargin))
    );
    const x = -effectiveSamplingMargin;
    const y = -effectiveSamplingMargin;

    this.filterElement.setAttribute('x', `${x}`);
    this.filterElement.setAttribute('y', `${y}`);
    this.filterElement.setAttribute('width', `${width + 2 * effectiveSamplingMargin}`);
    this.filterElement.setAttribute('height', `${height + 2 * effectiveSamplingMargin}`);

    this.filterElement.querySelectorAll('feImage').forEach((image) => {
      image.setAttribute('width', `${width}`);
      image.setAttribute('height', `${height}`);
    });
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.filterElement && this.filterElement.parentNode) {
      this.filterElement.parentNode.removeChild(this.filterElement);
    }
    this.filterElement = null;
    this.defsContainer = null;
    this.graphSignature = '';
  }
}
