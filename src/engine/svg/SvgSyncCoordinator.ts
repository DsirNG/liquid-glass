import type { NormalizedLiquidGlassOptions } from '../../types';
import { MaterialResolver } from './MaterialResolver';
import type { ResolvedMaterial } from './MaterialResolver';
import type { BackendManager } from '../runtime';
import type { GlassHost, MaterialStyler } from './host';
import type { SvgBackendContextAdapter } from './SvgBackendContextAdapter';
import type { SvgBackendSyncOptions, SvgBackendViewport } from './BackendContext';

/**
 * Resolves the current material frame and coordinates synchronous backend
 * updates without knowing about RuntimeController transitions.
 */
export class SvgSyncCoordinator {
  private readonly host: GlassHost;
  private readonly styler: MaterialStyler;
  private readonly backendManager: BackendManager<SvgBackendSyncOptions>;
  private readonly contextAdapter: SvgBackendContextAdapter;
  private readonly getOptions: () => NormalizedLiquidGlassOptions;

  constructor(
    host: GlassHost,
    styler: MaterialStyler,
    backendManager: BackendManager<SvgBackendSyncOptions>,
    contextAdapter: SvgBackendContextAdapter,
    getOptions: () => NormalizedLiquidGlassOptions
  ) {
    this.host = host;
    this.styler = styler;
    this.backendManager = backendManager;
    this.contextAdapter = contextAdapter;
    this.getOptions = getOptions;
  }

  public resolveCurrentMaterial(viewport = this.host.getViewport()): ResolvedMaterial {
    return MaterialResolver.resolve(
      this.getOptions(),
      viewport.width,
      viewport.height,
      this.contextAdapter.getActivePhysicalAmplitude()
    );
  }

  public createSyncOptions(): SvgBackendSyncOptions {
    const viewport: SvgBackendViewport = this.host.getViewport();
    return {
      material: this.resolveCurrentMaterial(viewport),
      viewport,
      userRefraction: this.getOptions().refraction,
    };
  }

  /** Applies the current material and updates committed/pending backends. */
  public syncCurrentFrame(updateBackend = true): void {
    const options = this.createSyncOptions();
    this.styler.apply(options.material);

    if (!updateBackend) return;

    if (this.backendManager.active) {
      this.backendManager.updateSync(options);
      return;
    }

    // Before the first backend commits, keep the material preview visible while
    // still forwarding the latest scalar options to any pending candidate.
    this.contextAdapter.syncMaterial(options);
    this.backendManager.updateSync(options);
  }

  /** Fast-path resize preview; expensive resource rebuilds remain elsewhere. */
  public previewResize(): void {
    this.syncCurrentFrame();
  }
}
