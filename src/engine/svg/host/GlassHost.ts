import { getElementRect } from '../../../utils/dom';
import type { SvgBackendViewport, SvgBackendVisualState } from '../BackendContext';

export type GlassHostResizeHandler = (viewport: SvgBackendViewport) => void;

/** Owns the glass host element, its render layers, and host-level DOM lifecycle. */
export class GlassHost {
  public readonly element: HTMLElement;
  public readonly refractionLayer: HTMLDivElement;
  public readonly tintLayer: HTMLDivElement;
  public readonly borderScreenLayer: HTMLDivElement;
  public readonly borderOverlayLayer: HTMLDivElement;

  private contentContainer: HTMLDivElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private isDestroyed = false;

  constructor(element: HTMLElement) {
    this.element = element;

    if (!this.element.classList.contains('lg-root')) {
      this.element.classList.add('lg-root');
    }
    if (!this.element.classList.contains('lg-svg-container')) {
      this.element.classList.add('lg-svg-container');
    }

    this.refractionLayer = this.createLayer('lg-backdrop lg-svg-refraction', {
      overflow: 'hidden',
      zIndex: '1',
    });
    this.tintLayer = this.createLayer('lg-material lg-svg-tint', { zIndex: '1' });
    this.borderScreenLayer = this.createLayer('lg-border lg-border-screen', { zIndex: '2' });
    this.borderOverlayLayer = this.createLayer('lg-border lg-border-overlay', { zIndex: '2' });

    this.element.insertBefore(this.borderOverlayLayer, this.element.firstChild);
    this.element.insertBefore(this.borderScreenLayer, this.borderOverlayLayer);
    this.element.insertBefore(this.tintLayer, this.borderScreenLayer);
    this.element.insertBefore(this.refractionLayer, this.tintLayer);

    this.protectContent();
  }

  public getViewport(): SvgBackendViewport {
    const rect = getElementRect(this.element);
    return {
      width: Math.max(16, Math.round(rect.width || this.element.offsetWidth || 300)),
      height: Math.max(16, Math.round(rect.height || this.element.offsetHeight || 80)),
    };
  }

  public observeResize(handler: GlassHostResizeHandler): void {
    if (this.isDestroyed || typeof ResizeObserver === 'undefined') return;

    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      handler(this.getViewport());
    });
    this.resizeObserver.observe(this.element);
  }

  public captureVisualState(): SvgBackendVisualState {
    return {
      elementStyle: this.element.style.cssText,
      refractionStyle: this.refractionLayer.style.cssText,
      tintStyle: this.tintLayer.style.cssText,
      borderScreenStyle: this.borderScreenLayer.style.cssText,
      borderOverlayStyle: this.borderOverlayLayer.style.cssText,
      borderScreenClassName: this.borderScreenLayer.className,
      borderOverlayClassName: this.borderOverlayLayer.className,
    };
  }

  public restoreVisualState(state: SvgBackendVisualState): void {
    if (this.isDestroyed) return;

    this.element.style.cssText = state.elementStyle;
    this.refractionLayer.style.cssText = state.refractionStyle;
    this.tintLayer.style.cssText = state.tintStyle;
    this.borderScreenLayer.style.cssText = state.borderScreenStyle;
    this.borderOverlayLayer.style.cssText = state.borderOverlayStyle;
    this.borderScreenLayer.className = state.borderScreenClassName;
    this.borderOverlayLayer.className = state.borderOverlayClassName;
  }

  /** Binds the optical Fresnel mask to the host-owned border layers. */
  public setFresnelMask(maskUrl: string | null): void {
    if (this.isDestroyed) return;

    const hasMask = Boolean(maskUrl);
    for (const layer of [this.borderScreenLayer, this.borderOverlayLayer]) {
      layer.classList.toggle('lg-border-geometry', hasMask);
    }
    if (hasMask) {
      this.element.style.setProperty('--lg-fresnel-mask-image', `url("${maskUrl}")`);
    } else {
      this.element.style.removeProperty('--lg-fresnel-mask-image');
    }
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (this.refractionLayer.parentNode) {
      this.refractionLayer.parentNode.removeChild(this.refractionLayer);
    }
    if (this.tintLayer.parentNode) {
      this.tintLayer.parentNode.removeChild(this.tintLayer);
    }
    if (this.borderScreenLayer.parentNode) {
      this.borderScreenLayer.parentNode.removeChild(this.borderScreenLayer);
    }
    if (this.borderOverlayLayer.parentNode) {
      this.borderOverlayLayer.parentNode.removeChild(this.borderOverlayLayer);
    }
    if (this.contentContainer?.parentNode) {
      while (this.contentContainer.firstChild) {
        this.element.appendChild(this.contentContainer.firstChild);
      }
      this.contentContainer.parentNode.removeChild(this.contentContainer);
    }

    this.element.classList.remove('lg-root', 'lg-svg-container');
  }

  private createLayer(
    className: string,
    extraStyles: { overflow?: string; zIndex: string }
  ): HTMLDivElement {
    const layer = document.createElement('div');
    layer.className = className;
    layer.style.position = 'absolute';
    layer.style.inset = '0';
    layer.style.borderRadius = 'inherit';
    layer.style.pointerEvents = 'none';
    layer.style.zIndex = extraStyles.zIndex;
    if (extraStyles.overflow) layer.style.overflow = extraStyles.overflow;
    return layer;
  }

  private protectContent(): void {
    const existingContent = this.element.querySelector(':scope > .lg-content');
    if (existingContent) return;

    const reserved = new Set<Node>([
      this.refractionLayer,
      this.tintLayer,
      this.borderScreenLayer,
      this.borderOverlayLayer,
    ]);
    const childrenToWrap: Node[] = [];
    this.element.childNodes.forEach((node) => {
      if (!reserved.has(node)) childrenToWrap.push(node);
    });

    if (childrenToWrap.length === 0) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'lg-content';
    wrapper.style.position = 'relative';
    wrapper.style.zIndex = '3';
    childrenToWrap.forEach((child) => wrapper.appendChild(child));
    this.element.appendChild(wrapper);
    this.contentContainer = wrapper;
  }
}
