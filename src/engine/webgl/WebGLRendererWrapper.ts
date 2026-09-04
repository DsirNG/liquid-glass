import type {
  LiquidGlassUpdateOptions,
  RendererDelegate,
  NormalizedWebGLOptions,
} from '../../types';
import { getElementRect } from '../../utils/dom';
import { WebGLGlassRenderer } from './GlassRenderer';

/**
 * WebGL DOM Wrapper implementing the internal RendererDelegate protocol.
 * Framework-agnostic: operates exclusively via DOM APIs and WebGL.
 */
export class WebGLRendererWrapper implements RendererDelegate {
  private element: HTMLElement;
  private canvas: HTMLCanvasElement;
  private renderer: WebGLGlassRenderer;
  private options: NormalizedWebGLOptions;
  private resizeObserver: ResizeObserver | null = null;
  private isDestroyed = false;
  private boundHandleMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundHandleWindowResize: (() => void) | null = null;

  constructor(element: HTMLElement, options: NormalizedWebGLOptions) {
    this.element = element;
    this.options = { ...options };

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'lg-webgl-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.inset = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.zIndex = '1';
    this.canvas.style.pointerEvents = 'none';

    document.body.appendChild(this.canvas);
    this.renderer = new WebGLGlassRenderer(this.canvas);

    if (this.options.backgroundUrl) {
      this.renderer.setBackground(this.options.backgroundUrl);
    }

    this.setupListeners();
    this.renderCurrentState();
  }

  private setupListeners(): void {
    this.boundHandleWindowResize = () => {
      if (this.isDestroyed) return;
      this.renderer.handleResize();
      this.renderCurrentState();
    };
    window.addEventListener('resize', this.boundHandleWindowResize);

    if (this.options.interactive) {
      this.boundHandleMouseMove = (e: MouseEvent) => {
        if (this.isDestroyed || !this.options.interactive) return;
        const rect = getElementRect(this.element);
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const angle = Math.atan2(-dy, dx);

        this.renderer.update({
          x: centerX,
          y: centerY,
          width: rect.width,
          height: rect.height,
          options: this.options,
          lightAngle: angle,
          backgroundUrl: this.options.backgroundUrl,
        });
      };
      window.addEventListener('mousemove', this.boundHandleMouseMove);
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.isDestroyed) {
          this.renderCurrentState();
        }
      });
      this.resizeObserver.observe(this.element);
    }
  }

  private renderCurrentState(): void {
    if (this.isDestroyed) return;
    const rect = getElementRect(this.element);
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    this.renderer.update({
      x: centerX,
      y: centerY,
      width: rect.width,
      height: rect.height,
      options: this.options,
      backgroundUrl: this.options.backgroundUrl,
    });
  }

  public update(newOptions: LiquidGlassUpdateOptions): void {
    if (this.isDestroyed) return;
    Object.assign(this.options, newOptions);
    this.renderCurrentState();
  }

  public resize(): void {
    if (this.isDestroyed) return;
    this.renderer.handleResize();
    this.renderCurrentState();
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.boundHandleWindowResize) {
      window.removeEventListener('resize', this.boundHandleWindowResize);
      this.boundHandleWindowResize = null;
    }

    if (this.boundHandleMouseMove) {
      window.removeEventListener('mousemove', this.boundHandleMouseMove);
      this.boundHandleMouseMove = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.renderer.destroy();

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
