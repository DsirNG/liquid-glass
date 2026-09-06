import type { LiquidGlassOptions, SvgFilterResult } from '../../types';
import { ensureGlobalSvgDefs } from '../../utils/dom';
import { DEFAULT_DISPLACEMENT_MAP_URL } from './displacementMap';

export interface DispersionScales {
  r: number;
  g: number;
  b: number;
}

export interface DispersionProfile {
  red: number;
  green: number;
  blue: number;
}

export const DISPERSION_PROFILES = {
  subtle: { red: 0, green: 0.025, blue: 0.05 },
  ios: { red: 0, green: 0.05, blue: 0.1 },
  strong: { red: 0, green: 0.08, blue: 0.16 },
} as const;

export type DispersionProfileName = keyof typeof DISPERSION_PROFILES;

export function resolveDispersionScales(
  scale: number,
  dispersion = 2.0,
  profile: DispersionProfileName | DispersionProfile = 'ios'
): DispersionScales {
  const p = typeof profile === 'string' ? (DISPERSION_PROFILES[profile] ?? DISPERSION_PROFILES.ios) : profile;
  return {
    r: -scale * (1 - p.red * dispersion),
    g: -scale * (1 - p.green * dispersion),
    b: -scale * (1 - p.blue * dispersion),
  };
}

/**
 * Modular builder for the Liquid Glass SVG optical filter graph.
 * Separates displacement, RGB channel isolation, Alpha preservation, and center body masking.
 */
export class SvgFilterBuilder {
  public static resolveDispersionScales = resolveDispersionScales;

  public static build(options: LiquidGlassOptions): string {
    const refractionScale = options.refraction ?? 1.0;
    const baseScale = refractionScale * 64;
    const dispersion = options.dispersion ?? 2.0;
    const dispProfile = (options as { dispersionProfile?: DispersionProfileName | DispersionProfile }).dispersionProfile ?? 'ios';
    const scales = resolveDispersionScales(baseScale, dispersion, dispProfile);
    const dispUrl = DEFAULT_DISPLACEMENT_MAP_URL;

    return [
      this.buildDisplacementSource(dispUrl),
      this.buildMaskHierarchy(dispersion),
      this.buildRedDispersion(scales.r),
      this.buildGreenDispersion(scales.g),
      this.buildBlueDispersion(scales.b),
      this.buildRgbComposite(),
      this.buildCenterPreservation(),
    ].join('\n');
  }

  private static buildDisplacementSource(dispUrl: string): string {
    return `<feImage href="${dispUrl}" x="0" y="0" width="100%" height="100%" result="DISPLACEMENT_TEXTURE" preserveAspectRatio="none" />`;
  }

  private static buildMaskHierarchy(dispersion: number): string {
    return `
      <!-- Geometry Bezel Mask: extract edge luminance from displacement texture -->
      <feColorMatrix
        in="DISPLACEMENT_TEXTURE"
        type="matrix"
        values="0.33 0.33 0.33 0 0
                0.33 0.33 0.33 0 0
                0.33 0.33 0.33 0 0
                0    0    0    1 0"
        result="EDGE_LUMINANCE"
      />
      <!-- outer/inner thresholded edge mask -->
      <feComponentTransfer in="EDGE_LUMINANCE" result="EDGE_MASK">
        <feFuncA type="discrete" tableValues="0 ${dispersion * 0.05} 1" />
      </feComponentTransfer>
      <!-- body mask: center plateau complementary to the edge mask -->
      <feColorMatrix
        in="EDGE_MASK"
        type="matrix"
        values="0 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 -1 1"
        result="BODY_MASK"
      />
    `;
  }

  private static buildRedDispersion(scale: number): string {
    return `
      <feDisplacementMap
        in="SourceGraphic"
        in2="DISPLACEMENT_TEXTURE"
        scale="${scale}"
        xChannelSelector="R"
        yChannelSelector="B"
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
    `;
  }

  private static buildGreenDispersion(scale: number): string {
    return `
      <feDisplacementMap
        in="SourceGraphic"
        in2="DISPLACEMENT_TEXTURE"
        scale="${scale}"
        xChannelSelector="R"
        yChannelSelector="B"
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
    `;
  }

  private static buildBlueDispersion(scale: number): string {
    return `
      <feDisplacementMap
        in="SourceGraphic"
        in2="DISPLACEMENT_TEXTURE"
        scale="${scale}"
        xChannelSelector="R"
        yChannelSelector="B"
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
    `;
  }

  private static buildRgbComposite(): string {
    return `
      <feBlend in="RED_CHANNEL" in2="GREEN_CHANNEL" mode="screen" result="RG_COMBINED" />
      <feBlend in="RG_COMBINED" in2="BLUE_CHANNEL" mode="screen" result="RGB_COMBINED" />
      <!-- Alpha preservation: clamp to original SourceGraphic Alpha to eliminate white fringe -->
      <feComposite in="RGB_COMBINED" in2="SourceGraphic" operator="in" result="RGB_ALPHA_PRESERVED" />
    `;
  }

  private static buildCenterPreservation(): string {
    return `
      <!-- Refracted Edge: RGB displaced backdrop masked by EDGE_MASK -->
      <feComposite in="RGB_ALPHA_PRESERVED" in2="EDGE_MASK" operator="in" result="EDGE_REFRACTED" />
      <!-- Clean Center: Source backdrop masked by BODY_MASK (center plateau) -->
      <feOffset in="SourceGraphic" dx="0" dy="0" result="SOURCE_ORIGINAL" />
      <feComposite in="SOURCE_ORIGINAL" in2="BODY_MASK" operator="in" result="BODY_CLEAN" />
      <!-- Final Optical Result: Edge Refraction + Body Original -->
      <feComposite in="EDGE_REFRACTED" in2="BODY_CLEAN" operator="over" result="FINAL_GLASS" />
    `;
  }
}

let filterCounter = 0;

/**
 * Creates or updates an SVG filter element in the document global SVG defs.
 */
export class SvgGlassEngine {
  private defsContainer: SVGDefsElement | null = null;
  private filterElement: SVGFilterElement | null = null;
  private isDestroyed = false;
  public readonly filterId: string;

  constructor(idPrefix = 'lg-svg-filter') {
    this.filterId = `${idPrefix}-${++filterCounter}`;
  }

  private ensureDefs(): SVGDefsElement | null {
    if (this.defsContainer && this.defsContainer.isConnected) {
      return this.defsContainer;
    }
    const defs = ensureGlobalSvgDefs();
    this.defsContainer = defs;
    return defs;
  }

  public update(
    _width: number,
    _height: number,
    options: LiquidGlassOptions
  ): SvgFilterResult | null {
    if (this.isDestroyed) return null;
    const defs = this.ensureDefs();
    if (!defs) return null;

    if (!this.filterElement) {
      this.filterElement = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      this.filterElement.id = this.filterId;
      this.filterElement.setAttribute('x', '-20%');
      this.filterElement.setAttribute('y', '-20%');
      this.filterElement.setAttribute('width', '140%');
      this.filterElement.setAttribute('height', '140%');
      this.filterElement.setAttribute('color-interpolation-filters', 'sRGB');
      defs.appendChild(this.filterElement);
    }

    this.filterElement.innerHTML = SvgFilterBuilder.build(options);

    const refractionScale = options.refraction ?? 1.0;
    const scale = refractionScale * 64;

    return {
      filterId: this.filterId,
      backdropFilterCss: `url(#${this.filterId})`,
      scale,
    };
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    if (this.filterElement && this.filterElement.parentNode) {
      this.filterElement.parentNode.removeChild(this.filterElement);
      this.filterElement = null;
    }
  }
}

