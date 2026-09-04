import type {
  LiquidGlassUpdateOptions,
  RendererDelegate,
  ResolvedLiquidGlassOptions,
} from '../../types';
import { hexToRgb } from '../../utils/color';
import { getElementRect } from '../../utils/dom';
import { SvgGlassEngine } from './SvgFilterBuilder';

/**
 * SVG DOM Wrapper implementing the internal RendererDelegate protocol.
 * Framework-agnostic: operates exclusively via DOM APIs and SVG Filters.
 */
export class SvgRendererWrapper implements RendererDelegate {
  private element: HTMLElement;
  private options: ResolvedLiquidGlassOptions;
  private svgEngine: SvgGlassEngine;
  private refractionLayer: HTMLDivElement;
  private tintLayer: HTMLDivElement;
  private resizeObserver: ResizeObserver | null = null;
  private isDestroyed = false;
  private updateTimer: number | null = null;

  constructor(element: HTMLElement, options: ResolvedLiquidGlassOptions) {
    this.element = element;
    this.options = { ...options };
    this.svgEngine = new SvgGlassEngine();

    // Setup host classes
    if (!this.element.classList.contains('lg-svg-container')) {
      this.element.classList.add('lg-svg-container');
    }

    // Create refraction layer
    this.refractionLayer = document.createElement('div');
    this.refractionLayer.className = 'lg-svg-refraction';
    this.refractionLayer.style.position = 'absolute';
    this.refractionLayer.style.inset = '0';
    this.refractionLayer.style.borderRadius = 'inherit';
    this.refractionLayer.style.zIndex = '1';
    this.refractionLayer.style.pointerEvents = 'none';
    this.refractionLayer.style.overflow = 'hidden';
    this.refractionLayer.style.backdropFilter = `url(#${this.svgEngine.filterId})`;
    (this.refractionLayer.style as unknown as Record<string, string>).webkitBackdropFilter =
      `url(#${this.svgEngine.filterId})`;

    // Create tint & specular layer
    this.tintLayer = document.createElement('div');
    this.tintLayer.className = 'lg-svg-tint';
    this.tintLayer.style.position = 'absolute';
    this.tintLayer.style.inset = '0';
    this.tintLayer.style.borderRadius = 'inherit';
    this.tintLayer.style.zIndex = '2';
    this.tintLayer.style.pointerEvents = 'none';

    // Insert layers before existing children so slots / content remain on top (z-index: 3)
    this.element.insertBefore(this.tintLayer, this.element.firstChild);
    this.element.insertBefore(this.refractionLayer, this.tintLayer);

    this.applyStyles();
    this.updateFilter();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.scheduleUpdate();
      });
      this.resizeObserver.observe(this.element);
    }
  }

  private applyStyles(): void {
    if (this.isDestroyed) return;
    const opts = this.options;
    const rgbTint = hexToRgb(opts.tint);
    const radiusPx = typeof opts.radius === 'number' ? `${opts.radius}px` : '40px';
    const shadowSpread = Math.max(-10, Math.min(10, (opts.shadow - 0.5) * 15));
    const shadowBlur = Math.round(opts.shadow * 30);
    const outerShadowBlur = Math.round(opts.shadow * 40);

    const s = this.element.style;
    s.borderRadius = radiusPx;
    s.setProperty('--lg-tint-rgb', rgbTint);
    s.setProperty('--lg-tint-alpha', String(opts.opacity));
    s.setProperty('--lg-radius', radiusPx);
    s.setProperty('--lg-shadow-blur', `${shadowBlur}px`);
    s.setProperty('--lg-shadow-spread', `${shadowSpread}px`);
    s.setProperty('--lg-shadow-color', opts.shadowColor);
    s.setProperty('--lg-outer-shadow-blur', `${outerShadowBlur}px`);
  }

  private updateFilter(): void {
    if (this.isDestroyed) return;
    const rect = getElementRect(this.element);
    this.svgEngine.update(rect.width, rect.height, this.options);
  }

  private scheduleUpdate(): void {
    if (this.isDestroyed) return;
    if (this.updateTimer != null) {
      clearTimeout(this.updateTimer);
    }
    this.updateTimer = window.setTimeout(() => {
      this.updateFilter();
      this.updateTimer = null;
    }, 20);
  }

  public update(newOptions: LiquidGlassUpdateOptions): void {
    if (this.isDestroyed) return;
    Object.assign(this.options, newOptions);
    this.applyStyles();
    this.scheduleUpdate();
  }

  public resize(): void {
    if (this.isDestroyed) return;
    this.updateFilter();
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.updateTimer != null) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.svgEngine.destroy();

    if (this.refractionLayer && this.refractionLayer.parentNode) {
      this.refractionLayer.parentNode.removeChild(this.refractionLayer);
    }
    if (this.tintLayer && this.tintLayer.parentNode) {
      this.tintLayer.parentNode.removeChild(this.tintLayer);
    }

    this.element.classList.remove('lg-svg-container');
  }
}
