import type { LiquidGlassOptions, SvgFilterResult } from '../../types';
import { ensureGlobalSvgDefs } from '../../utils/dom';
import {
  calculateRefractionProfile,
  generateDisplacementMap,
  generateSpecularMap,
  SURFACE_FNS,
} from './displacementMap';

let filterCounter = 0;

/**
 * Creates or updates an SVG filter element in the document global SVG defs
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
    width: number,
    height: number,
    options: LiquidGlassOptions
  ): SvgFilterResult | null {
    if (this.isDestroyed) return null;
    const defs = this.ensureDefs();
    if (!defs) return null;

    const w = Math.max(2, Math.floor(width));
    const h = Math.max(2, Math.floor(height));
    const radius = options.radius ?? 40;
    const bezel = options.bezel ?? 36;
    const thickness = options.thickness ?? 50;
    const ior = options.ior ?? 2.4;
    const refractionScale = options.refraction ?? 1.0;
    const blur = options.blur ?? 1.5;
    const specular = options.specular ?? 0.6;
    const saturation = options.saturation ?? 1.4;
    const shapeKey = options.surfaceShape ?? 'convex_squircle';

    const heightFn = SURFACE_FNS[shapeKey] || SURFACE_FNS.convex_squircle;
    const clampedBezel = Math.min(bezel, radius - 1, Math.min(w, h) / 2 - 1);

    const profile = calculateRefractionProfile(thickness, clampedBezel, heightFn, ior, 128);
    const maxDisp = Math.max(...Array.from(profile).map(Math.abs)) || 1;

    const dispUrl = generateDisplacementMap(w, h, radius, clampedBezel, profile, maxDisp);
    const specUrl = generateSpecularMap(w, h, radius, clampedBezel * 2.5);
    const scale = maxDisp * refractionScale;

    if (!this.filterElement) {
      this.filterElement = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      this.filterElement.id = this.filterId;
      this.filterElement.setAttribute('x', '0%');
      this.filterElement.setAttribute('y', '0%');
      this.filterElement.setAttribute('width', '100%');
      this.filterElement.setAttribute('height', '100%');
      defs.appendChild(this.filterElement);
    }

    this.filterElement.innerHTML = `
      <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="blurred_source" />
      <feImage href="${dispUrl}" x="0" y="0" width="${w}" height="${h}" result="disp_map" />
      <feDisplacementMap in="blurred_source" in2="disp_map"
        scale="${scale}" xChannelSelector="R" yChannelSelector="G"
        result="displaced" />
      <feColorMatrix in="displaced" type="saturate" values="${saturation}" result="displaced_sat" />
      <feImage href="${specUrl}" x="0" y="0" width="${w}" height="${h}" result="spec_layer" />
      <feComposite in="displaced_sat" in2="spec_layer" operator="in" result="spec_masked" />
      <feComponentTransfer in="spec_layer" result="spec_faded">
        <feFuncA type="linear" slope="${specular}" />
      </feComponentTransfer>
      <feBlend in="spec_masked" in2="displaced" mode="normal" result="with_sat" />
      <feBlend in="spec_faded" in2="with_sat" mode="normal" />
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
