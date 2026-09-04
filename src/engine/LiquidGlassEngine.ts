import type {
  LiquidGlassInstance,
  LiquidGlassUpdateOptions,
  NormalizedLiquidGlassOptions,
} from '../types';
import { SvgRendererWrapper } from './svg/SvgRendererWrapper';

/** DOM-native Liquid Glass engine. SVG filters are an internal implementation detail. */
export class LiquidGlassEngine implements LiquidGlassInstance {
  public readonly renderer = 'dom' as const;
  private readonly delegate: SvgRendererWrapper;
  private _isDestroyed = false;

  public get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  constructor(element: HTMLElement, options: NormalizedLiquidGlassOptions) {
    this.delegate = new SvgRendererWrapper(element, options);
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
