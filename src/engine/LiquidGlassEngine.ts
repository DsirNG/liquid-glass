import type {
  LiquidGlassInstance,
  LiquidGlassUpdateOptions,
  NormalizedLiquidGlassOptions,
} from '../types';
import type { LiquidGlassStatus } from '../types/status';
import { SvgRendererWrapper } from './svg/SvgRendererWrapper';
import {
  canonicalizeOptions,
  normalizeOptionPatch,
  normalizeOptions,
  type CanonicalGlassOptions,
} from './options';

/** DOM-native Liquid Glass engine. SVG filters are an internal implementation detail. */
export class LiquidGlassEngine implements LiquidGlassInstance {
  public readonly renderer = 'dom' as const;
  private readonly delegate: SvgRendererWrapper;
  private requestedOptions: CanonicalGlassOptions;
  private _isDestroyed = false;

  public get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  public get status(): Readonly<LiquidGlassStatus> {
    return this.delegate.status;
  }

  constructor(element: HTMLElement, options: NormalizedLiquidGlassOptions) {
    this.requestedOptions = canonicalizeOptions(options);
    this.delegate = new SvgRendererWrapper(element, options);
  }

  public update(options: LiquidGlassUpdateOptions): void {
    this.assertNotDestroyed('update');

    const canonicalPatch = normalizeOptionPatch(options);
    const nextOptions = normalizeOptions({
      ...this.requestedOptions,
      ...canonicalPatch,
    });

    this.requestedOptions = canonicalizeOptions(nextOptions);
    this.delegate.update(nextOptions);
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
