import type {
  LiquidGlassUpdateOptions,
  RendererDelegate,
  NormalizedLiquidGlassOptions,
} from '../../types';
import type { LiquidGlassStatus } from '../../types/status';
import { CapabilityProbe, type CapabilityReport } from '../capabilities';
import { InteractionController } from './InteractionController';
import { GlassHost, MaterialStyler } from './host';
import { SvgBackendContextAdapter } from './SvgBackendContextAdapter';
import { SvgSyncCoordinator } from './SvgSyncCoordinator';
import { canonicalizeOptions } from '../options';
import { resolveRenderPlan } from '../planning';
import type { GlassCapabilities, RenderPlan } from '../planning';
import { BackendManager, RuntimeController } from '../runtime';
import type { RuntimePreview, RuntimeTransitionReason } from '../runtime';
import { MaterialBackend } from './MaterialBackend';
import { OpticalBackend } from './OpticalBackend';
import { StaticBackend } from './StaticBackend';
import type { SvgBackendSyncOptions } from './BackendContext';
import type { ParameterImpact } from '../parameters';

export { OPTICAL_FIELD_DIMENSIONS, resolveOpticalFieldDimension } from './OpticalFieldDimensions';

export type ExtendedEngineOptions = NormalizedLiquidGlassOptions;

/**
 * High-level SVG DOM Wrapper implementing RendererDelegate.
 * Orchestrates:
 * 1. CapabilityProbe + RenderPlan (reports facts, then selects the requested backend tier)
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
  private readonly capabilityReport: CapabilityReport;
  private interactionController: InteractionController | null = null;
  private readonly capabilities: GlassCapabilities;
  private readonly backendContext: SvgBackendContextAdapter;
  private readonly syncCoordinator: SvgSyncCoordinator;
  private readonly backendManager: BackendManager<SvgBackendSyncOptions>;
  private readonly runtimeController: RuntimeController<SvgBackendSyncOptions>;

  private isDestroyed = false;
  private updateScheduled = false;
  private geometryDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(element: HTMLElement, options: NormalizedLiquidGlassOptions) {
    this.options = { ...options };
    this.capabilityReport = CapabilityProbe.probe();
    this.capabilities = this.resolveCapabilities();
    // Resolve before creating any owned DOM so strict capability failures are
    // synchronous and leave no partially initialized host behind.
    const initialPlan = this.resolvePlan();
    this.host = new GlassHost(element);
    this.materialStyler = new MaterialStyler(this.host);
    this.backendManager = new BackendManager<SvgBackendSyncOptions>();
    this.backendContext = new SvgBackendContextAdapter(this.host, this.materialStyler, () => {
      const activeBackend = this.backendManager.active;
      return activeBackend instanceof OpticalBackend ? activeBackend.physicalAmplitude : 0;
    });
    this.syncCoordinator = new SvgSyncCoordinator(
      this.host,
      this.materialStyler,
      this.backendManager,
      this.backendContext,
      () => this.options
    );
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
    this.syncCoordinator.syncCurrentFrame();
    void this.initializeRuntime(initialPlan);

    this.host.observeResize(() => {
      this.syncCoordinator.previewResize();
      // Width/height CSS transitions emit one resize per frame. Optical field
      // generation is asynchronous and expensive, so wait until the size has
      // settled instead of starting a doomed generation for every frame.
      this.scheduleRuntimeTransition(64, 'resizing');
    });
  }

  private resolveCapabilities(): GlassCapabilities {
    const opticalField =
      this.capabilityReport.svgFilter && this.capabilityReport.svgDisplacementMap;
    return {
      opticalField,
      refraction: this.capabilityReport.svgDisplacementMap,
      dispersion: this.capabilityReport.svgDisplacementMap,
      backdropBlur: this.capabilityReport.backdropFilter,
      saturation: this.capabilityReport.cssFilter,
      tint: true,
      shadow: true,
      specular: true,
    };
  }

  private resolvePlan(): RenderPlan {
    return resolveRenderPlan({
      requested: canonicalizeOptions(this.options),
      capabilities: this.capabilities,
      capabilityReport: this.capabilityReport,
      fallbackPolicy: this.options.fallbackPolicy,
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
      capabilityReport: this.capabilityReport,
      fallbackPolicy: this.options.fallbackPolicy,
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
      capabilityReport: this.capabilityReport,
      fallbackPolicy: this.options.fallbackPolicy,
    });
  }

  private createBackend(plan: RenderPlan): OpticalBackend | MaterialBackend | StaticBackend {
    if (plan.targetMode === 'full-optical') {
      return new OpticalBackend(this.backendContext, this.options);
    }
    if (plan.targetMode === 'material') {
      return new MaterialBackend(this.backendContext, this.options);
    }
    return new StaticBackend(this.backendContext, this.options);
  }

  private createRecoveryChain(plan: RenderPlan): RuntimePreview<SvgBackendSyncOptions>[] {
    const candidates: RuntimePreview<SvgBackendSyncOptions>[] = [];

    if (plan.targetMode === 'static' || plan.fallbackPolicy === 'strict') return candidates;

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

  private async initializeRuntime(plan: RenderPlan): Promise<void> {
    const previewPlan =
      plan.targetMode === 'full-optical' && plan.fallbackPolicy !== 'strict'
        ? this.resolveMaterialPreviewPlan()
        : null;
    const preview = previewPlan
      ? {
          plan: previewPlan,
          backend: this.createBackend(previewPlan),
        }
      : undefined;

    await this.runtimeController.transition(
      plan,
      plan.targetMode === 'full-optical' ? 'initializing-optical-field' : 'backend-switch',
      preview
    );
  }

  /** Schedules an asynchronous backend transition through RuntimeController. */
  private scheduleRuntimeTransition(
    debounceMs = 0,
    reason: RuntimeTransitionReason = 'backend-switch'
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
        this.scheduleRuntimeTransition(0, reason);
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

  public update(newOptions: LiquidGlassUpdateOptions, impact?: ParameterImpact): void {
    if (this.isDestroyed) return;

    Object.assign(this.options, newOptions);
    this.syncCoordinator.syncCurrentFrame();
    // LiquidGlassEngine always supplies the resolved impact. Keep a field
    // fallback for direct legacy wrapper callers so correctness wins over
    // update granularity when they bypass the engine boundary.
    if ((impact ?? 'field') === 'field') {
      this.scheduleRuntimeTransition(0, 'backend-switch');
    }
  }

  public resize(): void {
    if (this.isDestroyed) return;
    this.syncCoordinator.previewResize();
    this.scheduleRuntimeTransition(0, 'resizing');
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
    this.host.destroy();
  }
}
