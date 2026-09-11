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
import { resolveUpdateImpact } from './parameters';

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
    // Validate every incoming key before filtering no-op values. This keeps
    // runtime JavaScript callers from silently bypassing ParameterMeta.
    resolveUpdateImpact(canonicalPatch);
    const nextCanonicalOptions = canonicalizeOptions(nextOptions);
    const changedPatch: Record<string, unknown> = {};
    for (const key of Object.keys(canonicalPatch)) {
      const canonicalKey = key as keyof CanonicalGlassOptions;
      if (nextCanonicalOptions[canonicalKey] !== this.requestedOptions[canonicalKey]) {
        changedPatch[key] = nextCanonicalOptions[canonicalKey];
      }
    }
    const impact = resolveUpdateImpact(changedPatch as LiquidGlassUpdateOptions);

    this.requestedOptions = nextCanonicalOptions;
    this.delegate.update(nextOptions, impact);
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
