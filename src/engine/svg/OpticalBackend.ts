import type { NormalizedLiquidGlassOptions } from '../../types';
import type {
  BackendPrepareContext,
  EffectBackend,
  PreparedBackendCommit,
} from '../runtime/backend';
import type { FullOpticalRenderPlan, RenderPlan } from '../planning';
import { resolveOpticalFieldDimension } from './OpticalFieldDimensions';
import { OpticalFieldGenerator } from './OpticalFieldGenerator';
import type { OpticalFieldAssets } from './OpticalFieldAssets';
import { SvgGlassEngine } from './SvgFilterBuilder';
import { MaterialResolver, type ResolvedMaterial } from './MaterialResolver';
import type { SurfaceProfile } from './geometry/surfaceProfiles';
import type {
  SvgBackendContext,
  SvgBackendSyncOptions,
  SvgBackendViewport,
} from './BackendContext';

/** Adapter that moves optical resource ownership behind the transactional runtime. */
export class OpticalBackend implements EffectBackend<SvgBackendSyncOptions> {
  public readonly mode = 'full-optical' as const;
  private readonly context: SvgBackendContext;
  private readonly requestedOptions: NormalizedLiquidGlassOptions;
  private readonly svgEngine: SvgGlassEngine;
  private committedAssets: OpticalFieldAssets | null = null;
  private committedOptions: SvgBackendSyncOptions | null = null;
  private latestSyncOptions: SvgBackendSyncOptions | null = null;
  private disposed = false;

  constructor(context: SvgBackendContext, requestedOptions: NormalizedLiquidGlassOptions) {
    this.context = context;
    this.requestedOptions = { ...requestedOptions };
    this.svgEngine = new SvgGlassEngine();

    const viewport = context.getViewport();
    const material = MaterialResolver.resolve(
      this.requestedOptions,
      viewport.width,
      viewport.height,
      context.getActivePhysicalAmplitude()
    );
    this.latestSyncOptions = {
      material,
      viewport,
      userRefraction: this.requestedOptions.refraction,
    };
    // Preserve the existing synchronous SVG graph contract while the field is
    // being prepared asynchronously. The graph is still not active until commit.
    this.svgEngine.update(material, null, this.requestedOptions.refraction, viewport);
  }

  public get physicalAmplitude(): number {
    return this.committedAssets?.physicalAmplitude ?? 0;
  }

  public get assets(): OpticalFieldAssets | null {
    return this.committedAssets;
  }

  public updateSync(options: SvgBackendSyncOptions): void {
    if (this.disposed) return;
    this.latestSyncOptions = options;
    this.committedOptions = options;
    this.svgEngine.update(
      options.material,
      this.committedAssets,
      options.userRefraction,
      options.viewport
    );
    if (!this.committedAssets) return;
    this.context.syncOptical(this.svgEngine, this.committedAssets, options);
  }

  public async prepare(
    plan: RenderPlan,
    context: BackendPrepareContext
  ): Promise<PreparedBackendCommit> {
    if (plan.targetMode !== 'full-optical') {
      throw new Error(`OpticalBackend cannot prepare ${plan.targetMode} plan.`);
    }

    const opticalPlan = plan as FullOpticalRenderPlan;
    const viewport = this.context.getViewport();
    const material = MaterialResolver.resolve(
      opticalPlan.requestedOptions,
      viewport.width,
      viewport.height,
      this.context.getActivePhysicalAmplitude()
    );
    const generatedAssets = await this.generateAssets(opticalPlan, material, viewport, context);
    let ownsAssets = true;

    return {
      commit: () => {
        if (!ownsAssets || this.disposed) return;
        ownsAssets = false;
        this.committedAssets = generatedAssets;
        const committedOptions = this.latestSyncOptions ?? {
          material,
          viewport,
          userRefraction: opticalPlan.requestedOptions.refraction,
        };
        this.committedOptions = committedOptions;
        this.svgEngine.update(
          committedOptions.material,
          generatedAssets,
          committedOptions.userRefraction,
          committedOptions.viewport
        );
        this.context.commitOptical(this.svgEngine, generatedAssets, committedOptions);
      },
      dispose: () => {
        if (!ownsAssets) return;
        ownsAssets = false;
        generatedAssets.dispose();
      },
    };
  }

  public resize(width: number, height: number): void {
    if (this.disposed || !this.committedAssets) return;
    const previous = this.committedOptions;
    if (!previous) return;
    this.updateSync({
      ...previous,
      viewport: { width, height },
    });
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.committedAssets?.dispose();
    this.committedAssets = null;
    this.committedOptions = null;
    this.svgEngine.destroy();
  }

  private async generateAssets(
    plan: FullOpticalRenderPlan,
    material: ResolvedMaterial,
    viewport: SvgBackendViewport,
    context: BackendPrepareContext
  ): Promise<OpticalFieldAssets> {
    if (!context.isCurrent()) {
      throw new Error('Optical field preparation was superseded before generation started.');
    }

    const options = plan.effective.optical;
    const assets = await OpticalFieldGenerator.generate({
      geometry: {
        shape: options.shape,
        width: viewport.width,
        height: viewport.height,
        radius: plan.requestedOptions.radius,
      },
      bezel: options.bezel,
      thickness: material.perceivedThickness,
      ior: options.ior,
      surfaceProfile: options.surfaceProfile as SurfaceProfile,
      basis: material.calibration.geometry,
      revision: context.revision,
      maxFieldDimension: resolveOpticalFieldDimension(options.quality),
      refractionCoverage: material.refractionCoverage,
    });

    return assets;
  }
}
