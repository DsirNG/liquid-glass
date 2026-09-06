import type { LiquidGlassOptions, SvgFilterResult } from '../../types';
import { ensureGlobalSvgDefs } from '../../utils/dom';
import { DEFAULT_DISPLACEMENT_MAP_URL } from './displacementMap';

let filterCounter = 0;

/**
 * Creates or updates an SVG filter element in the document global SVG defs
 * with full RGB chromatic aberration displacement and center preservation mask.
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

  /**
   * Rebuilds filter for given dimensions and options
   */
  public update(
    _width: number,
    _height: number,
    options: LiquidGlassOptions
  ): SvgFilterResult | null {
    if (this.isDestroyed) return null;
    const defs = this.ensureDefs();
    if (!defs) return null;

    const dispUrl = DEFAULT_DISPLACEMENT_MAP_URL;
    const refractionScale = options.refraction ?? 1.0;
    const scale = refractionScale * 64;
    const dispersion = options.dispersion ?? 2.0;

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

    this.filterElement.innerHTML = `
      <feImage
        href="${dispUrl}"
        x="0"
        y="0"
        width="100%"
        height="100%"
        result="DISPLACEMENT_MAP"
        preserveAspectRatio="none"
      />
      <feColorMatrix
        in="DISPLACEMENT_MAP"
        type="matrix"
        values="0.3 0.3 0.3 0 0
                0.3 0.3 0.3 0 0
                0.3 0.3 0.3 0 0
                0   0   0   1 0"
        result="EDGE_INTENSITY"
      />
      <feComponentTransfer in="EDGE_INTENSITY" result="EDGE_MASK">
        <feFuncA type="discrete" tableValues="0 ${dispersion * 0.05} 1" />
      </feComponentTransfer>
      <feOffset in="SourceGraphic" dx="0" dy="0" result="CENTER_ORIGINAL" />
      <feDisplacementMap
        in="SourceGraphic"
        in2="DISPLACEMENT_MAP"
        scale="${-scale}"
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
      <feDisplacementMap
        in="SourceGraphic"
        in2="DISPLACEMENT_MAP"
        scale="${-scale * (1 - dispersion * 0.05)}"
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
      <feDisplacementMap
        in="SourceGraphic"
        in2="DISPLACEMENT_MAP"
        scale="${-scale * (1 - dispersion * 0.1)}"
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
      <feBlend in="RED_CHANNEL" in2="GREEN_CHANNEL" mode="screen" result="RG" />
      <feBlend in="RG" in2="BLUE_CHANNEL" mode="screen" result="RGB_COMBINED" />
      <feComposite in="RGB_COMBINED" in2="EDGE_MASK" operator="in" result="EDGE_ABERRATION" />
      <feColorMatrix
        in="EDGE_MASK"
        type="matrix"
        values="0 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 -1 1"
        result="INVERTED_MASK"
      />
      <feComposite in="CENTER_ORIGINAL" in2="INVERTED_MASK" operator="in" result="CENTER_CLEAN" />
      <feComposite in="EDGE_ABERRATION" in2="CENTER_CLEAN" operator="over" />
    `;

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
