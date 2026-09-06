import type {
  LiquidGlassUpdateOptions,
  RendererDelegate,
  NormalizedLiquidGlassOptions,
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
  private options: NormalizedLiquidGlassOptions;
  private svgEngine: SvgGlassEngine;
  private refractionLayer: HTMLDivElement;
  private tintLayer: HTMLDivElement;
  private borderScreenLayer: HTMLDivElement;
  private borderOverlayLayer: HTMLDivElement;
  private resizeObserver: ResizeObserver | null = null;
  private isDestroyed = false;
  private updateTimer: number | null = null;

  constructor(element: HTMLElement, options: NormalizedLiquidGlassOptions) {
    this.element = element;
    this.options = { ...options };
    this.svgEngine = new SvgGlassEngine();

    // Setup host classes: standardized .lg-root and backward-compatible .lg-svg-container
    if (!this.element.classList.contains('lg-root')) {
      this.element.classList.add('lg-root');
    }
    if (!this.element.classList.contains('lg-svg-container')) {
      this.element.classList.add('lg-svg-container');
    }

    // 1. Optical Refraction Layer (backdrop only)
    this.refractionLayer = document.createElement('div');
    this.refractionLayer.className = 'lg-backdrop lg-svg-refraction';
    this.refractionLayer.style.position = 'absolute';
    this.refractionLayer.style.inset = '0';
    this.refractionLayer.style.borderRadius = 'inherit';
    this.refractionLayer.style.zIndex = '1';
    this.refractionLayer.style.pointerEvents = 'none';
    this.refractionLayer.style.overflow = 'hidden';

    // 2. Physical Material Tint / Glass Fill Layer
    this.tintLayer = document.createElement('div');
    this.tintLayer.className = 'lg-material lg-svg-tint';
    this.tintLayer.style.position = 'absolute';
    this.tintLayer.style.inset = '0';
    this.tintLayer.style.borderRadius = 'inherit';
    this.tintLayer.style.zIndex = '1';
    this.tintLayer.style.pointerEvents = 'none';

    // 3. Specular Highlight Border 1 (Ambient environmental light rim)
    this.borderScreenLayer = document.createElement('div');
    this.borderScreenLayer.className = 'lg-border lg-border-screen';
    this.borderScreenLayer.style.position = 'absolute';
    this.borderScreenLayer.style.inset = '0';
    this.borderScreenLayer.style.borderRadius = 'inherit';
    this.borderScreenLayer.style.zIndex = '2';
    this.borderScreenLayer.style.pointerEvents = 'none';

    // 4. Specular Highlight Border 2 (Intense reflection line)
    this.borderOverlayLayer = document.createElement('div');
    this.borderOverlayLayer.className = 'lg-border lg-border-overlay';
    this.borderOverlayLayer.style.position = 'absolute';
    this.borderOverlayLayer.style.inset = '0';
    this.borderOverlayLayer.style.borderRadius = 'inherit';
    this.borderOverlayLayer.style.zIndex = '2';
    this.borderOverlayLayer.style.pointerEvents = 'none';

    // Insert layers in standard stacking order:
    // backdrop (1) -> material (1) -> borderScreen (2) -> borderOverlay (2) -> real DOM content (3)
    this.element.insertBefore(this.borderOverlayLayer, this.element.firstChild);
    this.element.insertBefore(this.borderScreenLayer, this.borderOverlayLayer);
    this.element.insertBefore(this.tintLayer, this.borderScreenLayer);
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

    const blurVal = typeof opts.blur === 'number' ? opts.blur : 0.1;
    const satVal = typeof opts.saturation === 'number' ? opts.saturation : 130;
    const filterCss = `url(#${this.svgEngine.filterId}) blur(${blurVal}px) saturate(${satVal}%)`;
    this.refractionLayer.style.backdropFilter = filterCss;
    (this.refractionLayer.style as unknown as Record<string, string>).webkitBackdropFilter =
      filterCss;

    const specular = opts.specular ?? 0.6;
    if (specular <= 0) {
      this.borderScreenLayer.style.display = 'none';
      this.borderOverlayLayer.style.display = 'none';
    } else {
      this.borderScreenLayer.style.display = '';
      this.borderOverlayLayer.style.display = '';
      this.borderScreenLayer.style.opacity = String(Math.min(1, specular * 1.2));
      this.borderOverlayLayer.style.opacity = String(Math.min(1, specular * 1.5));
    }
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
    if (this.borderScreenLayer && this.borderScreenLayer.parentNode) {
      this.borderScreenLayer.parentNode.removeChild(this.borderScreenLayer);
    }
    if (this.borderOverlayLayer && this.borderOverlayLayer.parentNode) {
      this.borderOverlayLayer.parentNode.removeChild(this.borderOverlayLayer);
    }

    this.element.classList.remove('lg-root', 'lg-svg-container');
  }
}
