import type {
  LiquidGlassInstance,
  LiquidGlassUpdateOptions,
  NormalizedWebGLOptions,
} from '../types';
import { WebGLRendererWrapper } from '../engine/webgl/WebGLRendererWrapper';

/** Optional Three.js-backed Liquid Glass instance. */
export class WebGLEnhancement implements LiquidGlassInstance {
  public readonly renderer = 'webgl' as const;
  private readonly delegate: WebGLRendererWrapper;
  private _isDestroyed = false;

  public get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  constructor(element: HTMLElement, options: NormalizedWebGLOptions) {
    this.delegate = new WebGLRendererWrapper(element, options);
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
      throw new Error(`[LiquidGlass/WebGL] Cannot call ${action}() on a destroyed instance.`);
    }
  }
}
