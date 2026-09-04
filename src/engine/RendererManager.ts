import type {
  LiquidGlassInstance,
  LiquidGlassUpdateOptions,
  RendererDelegate,
  ResolvedLiquidGlassOptions,
  ResolvedRendererType,
} from '../types';
import { WebGLRendererWrapper } from './webgl/WebGLRendererWrapper';
import { SvgRendererWrapper } from './svg/SvgRendererWrapper';

/**
 * Public instance controller delegating rendering implementation to an internal protocol.
 * Completely framework-agnostic.
 */
export class RendererManager implements LiquidGlassInstance {
  public readonly renderer: ResolvedRendererType;
  private _isDestroyed = false;
  private delegate: RendererDelegate;

  public get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  constructor(
    element: HTMLElement,
    rendererType: ResolvedRendererType,
    options: ResolvedLiquidGlassOptions
  ) {
    this.renderer = rendererType;
    if (this.renderer === 'webgl') {
      this.delegate = new WebGLRendererWrapper(element, options);
    } else {
      this.delegate = new SvgRendererWrapper(element, options);
    }
  }

  public update(options: LiquidGlassUpdateOptions): void {
    this.assertNotDestroyed('update');
    this.delegate.update(options);
  }

  public resize(): void {
    this.assertNotDestroyed('resize');
    this.delegate.resize();
  }

  public destroy(): void {
    if (this._isDestroyed) return;
    this.delegate.destroy();
    this._isDestroyed = true;
  }

  private assertNotDestroyed(action: string): void {
    if (this._isDestroyed) {
      throw new Error(`[LiquidGlass] Cannot call ${action}() on a destroyed LiquidGlassInstance.`);
    }
  }
}
