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
  return {
    r: -scale,
    g: -scale * (1 - p.green * dispersion),
    b: -scale * (1 - p.blue * dispersion),
  };
}

/**
 * Builds high-fidelity SVG Filter Graph implementing the differential optical pipeline:
 * - Dynamic userSpaceOnUse filter region to avoid clipping wide refractions and scattering blur.
 * - Normalized optical vector field driven by physical amplitude * lensingGain.
 * - Continuous partition-of-unity basis: Body scattering, Inner lensing/dispersion, Coverage clipping.
 */
export class SvgFilterBuilder {
  public static resolveDispersionScales = resolveDispersionScales;

  public static build(
    material: ResolvedMaterial,
    assets?: OpticalFieldAssets | null,
    userRefraction = 1.0,
    viewport?: FilterViewport
  ): string {
    const {
      bodyBlur,
      dispersionGain,
      lensingGain,
      colorBleed = 0.6,
      refractionCoverage = 'full',
    } = material;
    const isFullCoverage = refractionCoverage !== 'rim';
    const width = viewport?.width ?? assets?.width ?? 300;
    const height = viewport?.height ?? assets?.height ?? 80;
    const physicalAmplitude = assets?.physicalAmplitude ?? 32;
    const refractionGain = material.calibration?.optics?.refractionGain ?? 1.0;
    const baseScale = physicalAmplitude * lensingGain * userRefraction * refractionGain;
    const scales = resolveDispersionScales(baseScale, dispersionGain);

    const vectorHref = assets?.vectorUrl || '';
    const basisHref = assets?.basisUrl || '';

    const satMatrix = (s: number) => {
      const inv = 1 - s;
      const r = 0.2126 * inv;
      const g = 0.7152 * inv;
      const b = 0.0722 * inv;
      return `${r + s} ${g} ${b} 0 0
              ${r} ${g + s} ${b} 0 0
              ${r} ${g} ${b + s} 0 0
              0 0 0 1 0`;
    };

    return `
      <!-- 1. Load Dynamic Mathematical Assets -->
      <feImage
        href="${vectorHref}"
        xlink:href="${vectorHref}"
        x="0"
        y="0"
        width="${width}"
        height="${height}"
        preserveAspectRatio="none"
        result="DISPLACEMENT_TEXTURE"
      />
      <feImage
        href="${basisHref}"
        xlink:href="${basisHref}"
        x="0"
        y="0"
        width="${width}"
        height="${height}"
        preserveAspectRatio="none"
        result="BASIS_FIELD"
      />

      <!-- 2. Decompose Continuous Basis Channels -->
      <!-- Red Channel -> Outer Rim Basis (OUTER_MASK) -->
      <feColorMatrix
        in="BASIS_FIELD"
        type="matrix"
        values="1 0 0 0 0
                1 0 0 0 0
                1 0 0 0 0
                1 0 0 0 0"
        result="OUTER_MASK"
      />
      <!-- Green Channel -> Inner Lensing Basis (EDGE_MASK) -->
      <feColorMatrix
        in="BASIS_FIELD"
        type="matrix"
        values="0 1 0 0 0
                0 1 0 0 0
                0 1 0 0 0
                0 1 0 0 0"
        result="EDGE_MASK"
      />
      <!-- Blue Channel -> Body Transmission Basis (BODY_MASK) -->
      <feColorMatrix
        in="BASIS_FIELD"
        type="matrix"
        values="0 0 1 0 0
                0 0 1 0 0
                0 0 1 0 0
                0 0 1 0 0"
        result="BODY_MASK"
      />
      <!-- Alpha Channel -> Exact AA Coverage Mask -->
      <feColorMatrix
        in="BASIS_FIELD"
        type="matrix"
        values="0 0 0 1 0
                0 0 0 1 0
                0 0 0 1 0
                0 0 0 1 0"
        result="COVERAGE_MASK"
      />
      <!-- Refraction mask: covers full element in 'full' mode, or outer + inner in 'rim' mode -->
      <feColorMatrix
        in="BASIS_FIELD"
        type="matrix"
        values="${
          isFullCoverage
            ? `0 0 0 1 0
                0 0 0 1 0
                0 0 0 1 0
                0 0 0 1 0`
            : `1 1 0 0 0
                1 1 0 0 0
                1 1 0 0 0
                1 1 0 0 0`
        }"
        result="REFRACTION_MASK"
      />

      <!-- 3. Body Material Pass (Mild scattering blur & saturation, zero displacement) -->
      ${bodyBlur > 0.01 ? `<feGaussianBlur in="SourceGraphic" stdDeviation="${bodyBlur}" result="BODY_BLURRED" />` : `<feOffset in="SourceGraphic" dx="0" dy="0" result="BODY_BLURRED" />`}
      <feColorMatrix
        in="BODY_BLURRED"
        type="matrix"
        // Saturation is applied once on the final glass host so it covers the
        // complete card, including pixels outside the optical field footprint.
        values="${satMatrix(1)}"
        result="BODY_MATERIAL"
      />
      <!-- Glass base layer covers entire coverage area so perimeter never drops out -->
      <feComposite in="BODY_MATERIAL" in2="COVERAGE_MASK" operator="in" result="BODY_CLEAN" />

      <!-- 4. Liquid Color Bleed & Chromatic Lensing Pass -->
      <!-- Diffuses and blooms backdrop colors along refraction gradients ("把颜色晕出去") -->
      ${
        colorBleed > 0.05
          ? `
      <feGaussianBlur in="SourceGraphic" stdDeviation="${Math.max(0.6, colorBleed * 3.5).toFixed(2)}" result="SOURCE_BLEED" />
      ${
        colorBleed > 0.25
          ? `<feGaussianBlur in="SourceGraphic" stdDeviation="${Math.max(0.2, (colorBleed - 0.25) * 1.5).toFixed(2)}" result="SOURCE_CORE" />`
          : `<feOffset in="SourceGraphic" dx="0" dy="0" result="SOURCE_CORE" />`
      }
      <feDisplacementMap
        in="SOURCE_BLEED"
        in2="DISPLACEMENT_TEXTURE"
        scale="${scales.r}"
        xChannelSelector="R"
        yChannelSelector="G"
        result="RED_DISPLACED"
      />
      <feColorMatrix
        in="RED_DISPLACED"
        type="matrix"
        values="1 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 1 0"
        result="RED_CHANNEL"
      />

      <feDisplacementMap
        in="SOURCE_CORE"
        in2="DISPLACEMENT_TEXTURE"
        scale="${scales.g}"
        xChannelSelector="R"
        yChannelSelector="G"
        result="GREEN_DISPLACED"
      />
      <feColorMatrix
        in="GREEN_DISPLACED"
        type="matrix"
        values="0 0 0 0 0
                0 1 0 0 0
                0 0 0 0 0
                0 0 0 1 0"
        result="GREEN_CHANNEL"
      />

      <feDisplacementMap
        in="SOURCE_BLEED"
        in2="DISPLACEMENT_TEXTURE"
        scale="${scales.b}"
        xChannelSelector="R"
        yChannelSelector="G"
        result="BLUE_DISPLACED"
      />
      <feColorMatrix
        in="BLUE_DISPLACED"
        type="matrix"
        values="0 0 0 0 0
                0 0 0 0 0
                0 0 1 0 0
                0 0 0 1 0"
        result="BLUE_CHANNEL"
      />
      `
          : `
      <feDisplacementMap
        in="SourceGraphic"
        in2="DISPLACEMENT_TEXTURE"
        scale="${scales.r}"
        xChannelSelector="R"
        yChannelSelector="G"
        result="RED_DISPLACED"
      />
      <feColorMatrix
        in="RED_DISPLACED"
        type="matrix"
        values="1 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 1 0"
        result="RED_CHANNEL"
      />

      <feDisplacementMap
        in="SourceGraphic"
        in2="DISPLACEMENT_TEXTURE"
        scale="${scales.g}"
        xChannelSelector="R"
        yChannelSelector="G"
        result="GREEN_DISPLACED"
      />
      <feColorMatrix
        in="GREEN_DISPLACED"
        type="matrix"
        values="0 0 0 0 0
                0 1 0 0 0
                0 0 0 0 0
                0 0 0 1 0"
        result="GREEN_CHANNEL"
      />

      <feDisplacementMap
        in="SourceGraphic"
        in2="DISPLACEMENT_TEXTURE"
        scale="${scales.b}"
        xChannelSelector="R"
        yChannelSelector="G"
        result="BLUE_DISPLACED"
      />
      <feColorMatrix
        in="BLUE_DISPLACED"
        type="matrix"
        values="0 0 0 0 0
                0 0 0 0 0
                0 0 1 0 0
                0 0 0 1 0"
        result="BLUE_CHANNEL"
      />
      `
      }

      <feBlend in="RED_CHANNEL" in2="GREEN_CHANNEL" mode="screen" result="RG_COMBINED" />
      <feBlend in="RG_COMBINED" in2="BLUE_CHANNEL" mode="screen" result="RGB_COMBINED" />
      <!-- Alpha clamping to SourceGraphic to eliminate anti-aliasing white halos -->
      <feComposite in="RGB_COMBINED" in2="SourceGraphic" operator="in" result="RGB_ALPHA_PRESERVED" />
      <feComposite in="RGB_ALPHA_PRESERVED" in2="REFRACTION_MASK" operator="in" result="BEVEL_REFRACTED" />

      <!-- 5. Optical Recombination or Debug Mode Inspection Output -->
      ${
        material.debug === 'vector'
          ? `<feOffset in="DISPLACEMENT_TEXTURE" dx="0" dy="0" result="FINAL_GLASS" />`
          : material.debug === 'outer'
            ? `<feColorMatrix in="BASIS_FIELD" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 1 0" result="FINAL_GLASS" />`
            : material.debug === 'inner'
              ? `<feColorMatrix in="BASIS_FIELD" type="matrix" values="0 1 0 0 0  0 1 0 0 0  0 1 0 0 0  0 0 0 1 0" result="FINAL_GLASS" />`
              : material.debug === 'body'
                ? `<feColorMatrix in="BASIS_FIELD" type="matrix" values="0 0 1 0 0  0 0 1 0 0  0 0 1 0 0  0 0 0 1 0" result="FINAL_GLASS" />`
                : material.debug === 'coverage'
                  ? `<feColorMatrix in="BASIS_FIELD" type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 1 0" result="FINAL_GLASS" />`
                  : material.debug === 'refraction'
                    ? `<feComposite in="RGB_ALPHA_PRESERVED" in2="REFRACTION_MASK" operator="in" result="FINAL_GLASS" />`
                    : `<!-- Standard Material Composite: Outer + Inner + Body = Coverage -->
                       <feComposite in="BEVEL_REFRACTED" in2="BODY_CLEAN" operator="over" result="OPTICAL_COMBINED" />
                       <feComposite in="OPTICAL_COMBINED" in2="COVERAGE_MASK" operator="in" result="FINAL_GLASS" />`
      }

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
    const bodyMode = material.bodyBlur > 0.01 ? 'blur' : 'offset';
    const colorBleedMode =
      material.colorBleed > 0.25 ? 'bleed-core' : material.colorBleed > 0.05 ? 'bleed' : 'none';

    return [
      assets?.vectorUrl ?? '',
      assets?.basisUrl ?? '',
      material.debug,
      material.refractionCoverage,
      bodyMode,
      colorBleedMode,
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

    const blurNodes = this.filterElement.querySelectorAll('feGaussianBlur');
    let blurIndex = 0;
    if (material.bodyBlur > 0.01) {
      blurNodes[blurIndex]?.setAttribute('stdDeviation', `${material.bodyBlur}`);
      blurIndex += 1;
    }

    if (material.colorBleed > 0.05) {
      blurNodes[blurIndex]?.setAttribute(
        'stdDeviation',
        Math.max(0.6, material.colorBleed * 3.5).toFixed(2)
      );
      blurIndex += 1;

      if (material.colorBleed > 0.25) {
        blurNodes[blurIndex]?.setAttribute(
          'stdDeviation',
          Math.max(0.2, (material.colorBleed - 0.25) * 1.5).toFixed(2)
        );
      }
    }

    const physicalAmplitude = assets?.physicalAmplitude ?? 32;
    const refractionGain = material.calibration?.optics?.refractionGain ?? 1.0;
    const baseScale = physicalAmplitude * material.lensingGain * userRefraction * refractionGain;
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
    const effectiveSamplingMargin = Math.max(samplingMargin, width, height);
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
