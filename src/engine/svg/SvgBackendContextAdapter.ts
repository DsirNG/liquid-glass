import type { OpticalFieldAssets } from './OpticalFieldAssets';
import type { SvgGlassEngine } from './SvgFilterBuilder';
import type {
  SvgBackendContext,
  SvgBackendSyncOptions,
  SvgBackendVisualState,
  SvgBackendViewport,
} from './BackendContext';
import { GlassHost, MaterialStyler, type MaterialStyleOverrides } from './host';

/**
 * Translates backend effect intent into host-owned DOM primitives.
 *
 * Backends remain responsible for preparing and committing effect state, while
 * this adapter is the only layer that combines those effects with the SVG DOM.
 */
export class SvgBackendContextAdapter implements SvgBackendContext {
  private readonly host: GlassHost;
  private readonly materialStyler: MaterialStyler;
  private readonly getPhysicalAmplitude: () => number;

  constructor(host: GlassHost, materialStyler: MaterialStyler, getPhysicalAmplitude: () => number) {
    this.host = host;
    this.materialStyler = materialStyler;
    this.getPhysicalAmplitude = getPhysicalAmplitude;
  }

  public getViewport(): SvgBackendViewport {
    return this.host.getViewport();
  }

  public getActivePhysicalAmplitude(): number {
    return this.getPhysicalAmplitude();
  }

  public captureVisualState(): SvgBackendVisualState {
    return this.host.captureVisualState();
  }

  public restoreVisualState(state: SvgBackendVisualState): void {
    this.host.restoreVisualState(state);
  }

  public commitOptical(
    engine: SvgGlassEngine,
    assets: OpticalFieldAssets,
    options: SvgBackendSyncOptions
  ): void {
    this.applyOptical(engine, assets, options);
  }

  public syncOptical(
    engine: SvgGlassEngine,
    assets: OpticalFieldAssets,
    options: SvgBackendSyncOptions
  ): void {
    this.applyOptical(engine, assets, options);
  }

  public commitMaterial(options: SvgBackendSyncOptions): void {
    this.applyMaterial(options);
  }

  public syncMaterial(options: SvgBackendSyncOptions): void {
    this.applyMaterial(options);
  }

  public commitStatic(options: SvgBackendSyncOptions): void {
    this.applyStatic(options);
  }

  public syncStatic(options: SvgBackendSyncOptions): void {
    this.applyStatic(options);
  }

  private applyOptical(
    engine: SvgGlassEngine,
    assets: OpticalFieldAssets,
    options: SvgBackendSyncOptions
  ): void {
    this.materialStyler.apply(options.material);
    this.host.setFresnelMask(assets.fresnelMaskUrl ?? null);
    this.host.applyOpticalBackdrop(
      `url(#${engine.filterId})`,
      this.resolveSaturationPercent(options)
    );
  }

  private applyMaterial(options: SvgBackendSyncOptions): void {
    this.materialStyler.apply(options.material);
    this.host.clearFresnelMask();

    const blurPx = Math.max(0, Math.round(options.material.bodyBlur));
    const filterCss = `${blurPx > 0 ? `blur(${blurPx}px) ` : ''}saturate(100%)`;
    this.host.applyMaterialBackdrop(filterCss, this.resolveSaturationPercent(options));
  }

  private applyStatic(options: SvgBackendSyncOptions): void {
    const overrides: MaterialStyleOverrides | undefined =
      options.fillOpacity === undefined ? undefined : { tintOpacity: options.fillOpacity };
    this.materialStyler.apply(options.material, overrides);
    this.host.clearFresnelMask();
    this.host.clearBackdrop();
  }

  private resolveSaturationPercent(options: SvgBackendSyncOptions): number {
    return Math.max(0, Math.round(options.material.saturation * 100));
  }
}
