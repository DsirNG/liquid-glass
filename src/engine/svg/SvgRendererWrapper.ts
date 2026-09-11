import type {
  LiquidGlassUpdateOptions,
  RendererDelegate,
  NormalizedLiquidGlassOptions,
} from '../../types';
import type { LiquidGlassStatus } from '../../types/status';
import { SvgGlassEngine } from './SvgFilterBuilder';
import type { OpticalFieldAssets } from './OpticalFieldAssets';
import { CapabilityResolver, type OpticalCapability } from './CapabilityResolver';
import { MaterialResolver, type ResolvedMaterial } from './MaterialResolver';
import { InteractionController } from './InteractionController';
import { GlassHost, MaterialStyler } from './host';
import { canonicalizeOptions } from '../options';
import { resolveRenderPlan } from '../planning';
import type { GlassCapabilities, RenderPlan } from '../planning';
import { BackendManager, RuntimeController } from '../runtime';
import type { RuntimePreview } from '../runtime';
import { MaterialBackend } from './MaterialBackend';
import { OpticalBackend } from './OpticalBackend';
import { StaticBackend } from './StaticBackend';
import type { SvgBackendContext, SvgBackendSyncOptions } from './BackendContext';

export { OPTICAL_FIELD_DIMENSIONS, resolveOpticalFieldDimension } from './OpticalFieldDimensions';

const OPTICAL_FIELD_OPTION_KEYS = [
  'radius',
  'bezel',
  'thickness',
  'ior',
  'surfaceShape',
  'surfaceProfile',
  'materialPreset',
  'quality',
  'shape',
  'refractionCoverage',
] as const satisfies readonly (keyof LiquidGlassUpdateOptions)[];

export type ExtendedEngineOptions = NormalizedLiquidGlassOptions;

/**
 * High-level SVG DOM Wrapper implementing RendererDelegate.
 * Orchestrates:
 * 1. CapabilityResolver + RenderPlan (selects the requested backend tier)
 * 2. RuntimeController + BackendManager (transaction, recovery, and last-good state)
 * 3. Optical/Material/Static backends (effect-specific resource ownership)
 * 4. MaterialResolver (size adaptation & parameter resolution)
 * 5. InteractionController (Fast Path: pointer/touch/specular light vector)
 * 6. 5-Layer DOM stacking context with explicit content protection
 */
export class SvgRendererWrapper implements RendererDelegate {
  private readonly host: GlassHost;
  private readonly materialStyler: MaterialStyler;
  private options: ExtendedEngineOptions;
  private capability: OpticalCapability;
  private interactionController: InteractionController | null = null;
  private readonly capabilities: GlassCapabilities;
  private readonly backendContext: SvgBackendContext;
  private readonly backendManager: BackendManager<SvgBackendSyncOptions>;
  private readonly runtimeController: RuntimeController<SvgBackendSyncOptions>;
  private pendingOpticalBackend: OpticalBackend | null = null;

  private isDestroyed = false;
  private updateScheduled = false;
  private geometryDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(element: HTMLElement, options: NormalizedLiquidGlassOptions) {
    this.host = new GlassHost(element);
    this.materialStyler = new MaterialStyler(this.host);
    this.options = { ...options };
    this.capability = CapabilityResolver.resolve({ override: this.options.capability });
    this.capabilities = this.resolveCapabilities();
    this.backendManager = new BackendManager<SvgBackendSyncOptions>();
    this.backendContext = {
      getViewport: () => this.host.getViewport(),
      getActivePhysicalAmplitude: () => this.getActivePhysicalAmplitude(),
      captureVisualState: () => this.host.captureVisualState(),
      restoreVisualState: (state) => this.host.restoreVisualState(state),
      commitOptical: (engine, assets, syncOptions) =>
        this.commitOpticalFrame(engine, assets, syncOptions),
      syncOptical: (engine, assets, syncOptions) =>
        this.syncOpticalFrame(engine, assets, syncOptions),
      commitMaterial: (syncOptions) => this.commitMaterialFrame(syncOptions),
      syncMaterial: (syncOptions) => this.syncMaterialFrame(syncOptions),
      commitStatic: (syncOptions) => this.commitStaticFrame(syncOptions),
      syncStatic: (syncOptions) => this.syncStaticFrame(syncOptions),
    };
    this.runtimeController = new RuntimeController<SvgBackendSyncOptions>({
      manager: this.backendManager,
      createBackend: (plan) => this.createBackend(plan),
      getRecoveryChain: (plan) => this.createRecoveryChain(plan),
    });

    // Fast-path interaction controller
    if (this.options.interactive !== false) {
      this.interactionController = new InteractionController(this.host.element);
    }

    // The initial filter graph is already installed above. CSS styles still
    // apply synchronously, while the first optical field is generated below.
    this.applyStyles(false);
    void this.initializeRuntime();

    this.host.observeResize(() => {
      this.previewGeometryAtCurrentSize();
      // Width/height CSS transitions emit one resize per frame. Optical field
      // generation is asynchronous and expensive, so wait until the size has
      // settled instead of starting a doomed generation for every frame.
      this.scheduleGeometryUpdate(64, 'resizing');
    });
  }

  /**
   * Fast path for animated resizes. Reuses the current field but maps it to the
   * current viewport immediately, so the backdrop never exposes a stale-size seam
   * while the matching high-quality field is generated on the slow path.
   */
  private previewGeometryAtCurrentSize(): void {
    if (this.isDestroyed) return;

    const { width, height } = this.host.getViewport();
    const mat = this.resolveCurrentMaterial(width, height);
    const syncOptions = this.createSyncOptions(mat, { width, height });

    this.materialStyler.apply(mat);
    if (this.backendManager.active) {
      this.backendManager.updateSync(syncOptions);
    } else {
      this.commitMaterialFrame(syncOptions);
    }
  }

  private resolveCurrentMaterial(width: number, height: number): ResolvedMaterial {
    const activeOptical = this.backendManager.active;
    return MaterialResolver.resolve(
      this.options,
      width,
      height,
      activeOptical instanceof OpticalBackend ? activeOptical.physicalAmplitude : 0
    );
  }

  private applyStyles(updateFilter = true): void {
    if (this.isDestroyed) return;
    const { width, height } = this.host.getViewport();

    const mat = this.resolveCurrentMaterial(width, height);
    this.materialStyler.apply(mat);

    const syncOptions = this.createSyncOptions(mat, { width, height });
    const activeBackend = this.backendManager.active;
    if (updateFilter && activeBackend) {
      this.backendManager.updateSync(syncOptions);
      if (this.pendingOpticalBackend && this.pendingOpticalBackend !== activeBackend) {
        this.pendingOpticalBackend.updateSync(syncOptions);
      }
    } else if (updateFilter && this.pendingOpticalBackend) {
      this.pendingOpticalBackend.updateSync(syncOptions);
    } else if (!activeBackend) {
      this.commitMaterialFrame(syncOptions);
    }
  }

  private createSyncOptions(
    material: ResolvedMaterial,
    viewport: { width: number; height: number }
  ): SvgBackendSyncOptions {
    return {
      material,
      viewport,
      userRefraction: this.options.refraction,
    };
  }

  private getActivePhysicalAmplitude(): number {
    const activeOptical = this.backendManager.active;
    return activeOptical instanceof OpticalBackend ? activeOptical.physicalAmplitude : 0;
  }

  private commitOpticalFrame(
    engine: SvgGlassEngine,
    assets: OpticalFieldAssets,
    options: SvgBackendSyncOptions
  ): void {
    this.materialStyler.apply(options.material);
    this.updateSpecularMask(assets);
    this.updateBackdropStyle(options.material, { engine, assets });
  }

  private syncOpticalFrame(
    engine: SvgGlassEngine,
    assets: OpticalFieldAssets,
    options: SvgBackendSyncOptions
  ): void {
    this.commitOpticalFrame(engine, assets, options);
  }

  private commitMaterialFrame(options: SvgBackendSyncOptions): void {
    this.materialStyler.apply(options.material);
    this.updateSpecularMask(null);
    this.updateBackdropStyle(options.material);
  }

  private syncMaterialFrame(options: SvgBackendSyncOptions): void {
    this.commitMaterialFrame(options);
  }

  private commitStaticFrame(options: SvgBackendSyncOptions): void {
    const material =
      options.fillOpacity === undefined
        ? options.material
        : { ...options.material, tintOpacity: options.fillOpacity };
    this.materialStyler.apply(material);
    this.updateSpecularMask(null);
    this.updateStaticStyle();
  }

  private syncStaticFrame(options: SvgBackendSyncOptions): void {
    this.commitStaticFrame(options);
  }

  private updateBackdropStyle(
    mat: ResolvedMaterial,
    optical?: { engine: SvgGlassEngine; assets: OpticalFieldAssets }
  ): void {
    // Apply the backdrop effect to the complete glass host so every resize uses
    // one compositing surface instead of exposing a seam in the inner layer.
    this.host.element.style.filter = '';
    this.host.element.style.backgroundImage = '';
    this.host.element.style.backgroundColor = '';
    this.host.refractionLayer.style.filter = '';
    this.host.refractionLayer.style.backgroundImage = '';
    this.host.refractionLayer.style.backgroundColor = '';
    this.host.refractionLayer.style.backdropFilter = '';
    (this.host.refractionLayer.style as unknown as Record<string, string>).webkitBackdropFilter =
      '';
    this.host.refractionLayer.style.opacity = '';
    this.host.refractionLayer.style.display = '';
    const saturationPercent = Math.max(0, Math.round(mat.saturation * 100));
    this.host.element.style.filter = `saturate(${saturationPercent}%)`;
    if (optical) {
      const filterCss = `url(#${optical.engine.filterId})`;
      this.host.element.style.backdropFilter = filterCss;
      (this.host.element.style as unknown as Record<string, string>).webkitBackdropFilter =
        filterCss;
      // Preserve the public layer-level filter contract without compositing the
      // same optical result twice; the root host is the visible filter surface.
      this.host.refractionLayer.style.backdropFilter = filterCss;
      (this.host.refractionLayer.style as unknown as Record<string, string>).webkitBackdropFilter =
        filterCss;
      this.host.refractionLayer.style.opacity = '0';
    } else {
      // Live Material Fallback (Safari WebKit Bug 245510 or initial mount before assets ready)
      const blurPx = Math.max(0, Math.round(mat.bodyBlur));
      const filterCss = `${blurPx > 0 ? `blur(${blurPx}px) ` : ''}saturate(100%)`;
      this.host.element.style.backdropFilter = filterCss;
      (this.host.element.style as unknown as Record<string, string>).webkitBackdropFilter =
        filterCss;
      // Keep the layer-level fallback for browsers that do not support the
      // root-level backdrop filter contract used by the optical path.
      this.host.refractionLayer.style.backdropFilter = filterCss;
      (this.host.refractionLayer.style as unknown as Record<string, string>).webkitBackdropFilter =
        filterCss;
      this.host.refractionLayer.style.opacity = '1';
    }
  }

  private updateStaticStyle(): void {
    this.host.element.style.filter = '';
    this.host.element.style.backgroundImage = '';
    this.host.element.style.backgroundColor = '';
    (this.host.element.style as unknown as Record<string, string>).backdropFilter = '';
    (this.host.element.style as unknown as Record<string, string>).webkitBackdropFilter = '';

    this.host.refractionLayer.style.filter = '';
    this.host.refractionLayer.style.backgroundImage = '';
    this.host.refractionLayer.style.backgroundColor = '';
    this.host.refractionLayer.style.backdropFilter = '';
    (this.host.refractionLayer.style as unknown as Record<string, string>).webkitBackdropFilter =
      '';
    this.host.refractionLayer.style.opacity = '0';
    this.host.refractionLayer.style.display = 'none';
  }

  private updateSpecularMask(assets: OpticalFieldAssets | null): void {
    this.host.setFresnelMask(assets?.fresnelMaskUrl ?? null);
  }

  private resolveCapabilities(): GlassCapabilities {
    const opticalField = this.capability === 'full';
    return {
      opticalField,
      refraction: opticalField,
      dispersion: opticalField,
      backdropBlur: CapabilityResolver.supportsBackdropFilter(),
      saturation: true,
      tint: true,
      shadow: true,
      specular: true,
    };
  }

  private resolvePlan(): RenderPlan {
    return resolveRenderPlan({
      requested: canonicalizeOptions(this.options),
      capabilities: this.capabilities,
      fallbackPolicy: 'auto',
    });
  }

  private resolveMaterialPreviewPlan(): RenderPlan {
    return resolveRenderPlan({
      requested: canonicalizeOptions(this.options),
      capabilities: {
        ...this.capabilities,
        opticalField: false,
        refraction: false,
        dispersion: false,
      },
      fallbackPolicy: 'auto',
    });
  }

  private resolveStaticPlan(): RenderPlan {
    return resolveRenderPlan({
      requested: canonicalizeOptions(this.options),
      capabilities: {
        ...this.capabilities,
        opticalField: false,
        refraction: false,
        dispersion: false,
        backdropBlur: false,
      },
      fallbackPolicy: 'auto',
    });
  }

  private createBackend(plan: RenderPlan): OpticalBackend | MaterialBackend | StaticBackend {
    return this.createBackendForPlan(plan, true);
  }

  private createBackendForPlan(
    plan: RenderPlan,
    trackPendingOptical = false
  ): OpticalBackend | MaterialBackend | StaticBackend {
    if (plan.targetMode === 'full-optical') {
      const backend = new OpticalBackend(this.backendContext, this.options);
      if (trackPendingOptical) this.pendingOpticalBackend = backend;
      return backend;
    }
    if (plan.targetMode === 'material') {
      if (trackPendingOptical) this.pendingOpticalBackend = null;
      return new MaterialBackend(this.backendContext, this.options);
    }
    if (trackPendingOptical) this.pendingOpticalBackend = null;
    return new StaticBackend(this.backendContext, this.options);
  }

  private createRecoveryChain(plan: RenderPlan): RuntimePreview<SvgBackendSyncOptions>[] {
    const candidates: RuntimePreview<SvgBackendSyncOptions>[] = [];

    if (plan.targetMode === 'static') return candidates;

    if (plan.targetMode === 'full-optical') {
      const materialPlan = this.resolveMaterialPreviewPlan();
      if (materialPlan.targetMode === 'material') {
        candidates.push({
          plan: materialPlan,
          backend: new MaterialBackend(this.backendContext, this.options),
        });
      }
    }

    const staticPlan = this.resolveStaticPlan();
    if (staticPlan.targetMode === 'static') {
      candidates.push({
        plan: staticPlan,
        backend: new StaticBackend(this.backendContext, this.options),
      });
    }

    return candidates;
  }

  public get status(): Readonly<LiquidGlassStatus> {
    return this.runtimeController.status;
  }

  private async initializeRuntime(): Promise<void> {
    const plan = this.resolvePlan();
    const previewPlan =
      plan.targetMode === 'full-optical' ? this.resolveMaterialPreviewPlan() : null;
    const preview = previewPlan
      ? {
          plan: previewPlan,
          backend: this.createBackendForPlan(previewPlan),
        }
      : undefined;

    await this.runtimeController.transition(
      plan,
      plan.targetMode === 'full-optical' ? 'initializing-optical-field' : 'backend-switch',
      preview
    );
  }

  /** Schedules an asynchronous candidate transition through RuntimeController. */
  private scheduleGeometryUpdate(
    debounceMs = 0,
    reason: 'resizing' | 'backend-switch' = 'backend-switch'
  ): void {
    if (this.isDestroyed) return;

    const plan = this.resolvePlan();
    this.backendManager.invalidate();
    this.runtimeController.beginTransition(plan, reason);

    if (debounceMs > 0) {
      if (this.geometryDebounceTimer !== null) {
        clearTimeout(this.geometryDebounceTimer);
      }
      this.geometryDebounceTimer = setTimeout(() => {
        this.geometryDebounceTimer = null;
        this.scheduleGeometryUpdate(0, reason);
      }, debounceMs);
      return;
    }

    if (this.geometryDebounceTimer !== null) {
      clearTimeout(this.geometryDebounceTimer);
      this.geometryDebounceTimer = null;
    }

    if (this.updateScheduled) return;
    this.updateScheduled = true;

    requestAnimationFrame(() => {
      this.updateScheduled = false;
      if (this.isDestroyed) return;

      const latestPlan = this.resolvePlan();
      void this.runtimeController.transition(latestPlan, reason).catch((error: unknown) => {
        if (!this.isDestroyed) {
          console.warn('[LiquidGlass] Runtime transition failed:', error);
        }
      });
    });
  }

  public update(newOptions: LiquidGlassUpdateOptions): void {
    if (this.isDestroyed) return;
    const requiresOpticalFieldUpdate = OPTICAL_FIELD_OPTION_KEYS.some(
      (key) =>
        Object.prototype.hasOwnProperty.call(newOptions, key) &&
        newOptions[key] !== this.options[key]
    );

    Object.assign(this.options, newOptions);
    // CSS-backed values and the active SVG filter update synchronously.
    this.applyStyles(!requiresOpticalFieldUpdate);
    // Only geometry/calibration changes require a new optical field. Scalar material
    // controls such as refraction and blur reuse the committed field and stay stable
    // while the slider is moving.
    if (requiresOpticalFieldUpdate) {
      this.scheduleGeometryUpdate(0, 'backend-switch');
    }
  }

  public resize(): void {
    if (this.isDestroyed) return;
    this.previewGeometryAtCurrentSize();
    this.scheduleGeometryUpdate(0, 'resizing');
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.geometryDebounceTimer !== null) {
      clearTimeout(this.geometryDebounceTimer);
      this.geometryDebounceTimer = null;
    }

    if (this.interactionController) {
      this.interactionController.destroy();
      this.interactionController = null;
    }

    this.backendManager.dispose();
    this.pendingOpticalBackend?.dispose();
    this.pendingOpticalBackend = null;
    this.host.destroy();
  }
}
