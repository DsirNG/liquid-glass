import type {
  LiquidGlassUpdateOptions,
  RendererDelegate,
  NormalizedLiquidGlassOptions,
} from '../../types';
import type { LiquidGlassStatus } from '../../types/status';
import { getElementRect } from '../../utils/dom';
import { SvgGlassEngine } from './SvgFilterBuilder';
import type { OpticalFieldAssets } from './OpticalFieldAssets';
import { CapabilityResolver, type OpticalCapability } from './CapabilityResolver';
import { MaterialResolver, type ResolvedMaterial } from './MaterialResolver';
import { InteractionController } from './InteractionController';
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
  private element: HTMLElement;
  private options: ExtendedEngineOptions;
  private capability: OpticalCapability;
  private interactionController: InteractionController | null = null;
  private readonly capabilities: GlassCapabilities;
  private readonly backendContext: SvgBackendContext;
  private readonly backendManager: BackendManager<SvgBackendSyncOptions>;
  private readonly runtimeController: RuntimeController<SvgBackendSyncOptions>;
  private pendingOpticalBackend: OpticalBackend | null = null;

  private refractionLayer: HTMLDivElement;
  private tintLayer: HTMLDivElement;
  private borderScreenLayer: HTMLDivElement;
  private borderOverlayLayer: HTMLDivElement;
  private contentContainer: HTMLDivElement | null = null;

  private resizeObserver: ResizeObserver | null = null;
  private isDestroyed = false;
  private updateScheduled = false;
  private geometryDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(element: HTMLElement, options: NormalizedLiquidGlassOptions) {
    this.element = element;
    this.options = { ...options };
    this.capability = CapabilityResolver.resolve({ override: this.options.capability });
    this.capabilities = this.resolveCapabilities();
    this.backendManager = new BackendManager<SvgBackendSyncOptions>();
    this.backendContext = {
      getViewport: () => this.getViewport(),
      getActivePhysicalAmplitude: () => this.getActivePhysicalAmplitude(),
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

    // Ensure root host classes
    if (!this.element.classList.contains('lg-root')) {
      this.element.classList.add('lg-root');
    }
    if (!this.element.classList.contains('lg-svg-container')) {
      this.element.classList.add('lg-svg-container');
    }

    // 1. Optical Backdrop Layer (receives SVG optical filter or fallback blur)
    this.refractionLayer = document.createElement('div');
    this.refractionLayer.className = 'lg-backdrop lg-svg-refraction';
    this.refractionLayer.style.position = 'absolute';
    this.refractionLayer.style.inset = '0';
    this.refractionLayer.style.borderRadius = 'inherit';
    this.refractionLayer.style.zIndex = '1';
    this.refractionLayer.style.pointerEvents = 'none';
    this.refractionLayer.style.overflow = 'hidden';

    // 2. Physical Material Tint / Glass Fill Layer
    this.tintLayer = document.createElement('div');
    this.tintLayer.className = 'lg-material lg-svg-tint';
    this.tintLayer.style.position = 'absolute';
    this.tintLayer.style.inset = '0';
    this.tintLayer.style.borderRadius = 'inherit';
    this.tintLayer.style.zIndex = '1';
    this.tintLayer.style.pointerEvents = 'none';

    // 3. Specular Highlight Border 1 (Ambient environmental light rim)
    this.borderScreenLayer = document.createElement('div');
    this.borderScreenLayer.className = 'lg-border lg-border-screen';
    this.borderScreenLayer.style.position = 'absolute';
    this.borderScreenLayer.style.inset = '0';
    this.borderScreenLayer.style.borderRadius = 'inherit';
    this.borderScreenLayer.style.zIndex = '2';
    this.borderScreenLayer.style.pointerEvents = 'none';

    // 4. Specular Highlight Border 2 (Directional glint line)
    this.borderOverlayLayer = document.createElement('div');
    this.borderOverlayLayer.className = 'lg-border lg-border-overlay';
    this.borderOverlayLayer.style.position = 'absolute';
    this.borderOverlayLayer.style.inset = '0';
    this.borderOverlayLayer.style.borderRadius = 'inherit';
    this.borderOverlayLayer.style.zIndex = '2';
    this.borderOverlayLayer.style.pointerEvents = 'none';

    // Mount optical layers below content
    this.element.insertBefore(this.borderOverlayLayer, this.element.firstChild);
    this.element.insertBefore(this.borderScreenLayer, this.borderOverlayLayer);
    this.element.insertBefore(this.tintLayer, this.borderScreenLayer);
    this.element.insertBefore(this.refractionLayer, this.tintLayer);

    // If host element does not have .lg-content, check if there are raw child nodes to protect
    this.protectContent();

    // Fast-path interaction controller
    if (this.options.interactive !== false) {
      this.interactionController = new InteractionController(this.element, {
        onUpdate: () => {
          this.updateSpecularGradients();
        },
      });
    }

    // The initial filter graph is already installed above. CSS styles still
    // apply synchronously, while the first optical field is generated below.
    this.applyStyles(false);
    void this.initializeRuntime();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.previewGeometryAtCurrentSize();
        // Width/height CSS transitions emit one resize per frame. Optical field
        // generation is asynchronous and expensive, so wait until the size has
        // settled instead of starting a doomed generation for every frame.
        this.scheduleGeometryUpdate(64, 'resizing');
      });
      this.resizeObserver.observe(this.element);
    }
  }

  /**
   * Fast path for animated resizes. Reuses the current field but maps it to the
   * current viewport immediately, so the backdrop never exposes a stale-size seam
   * while the matching high-quality field is generated on the slow path.
   */
  private previewGeometryAtCurrentSize(): void {
    if (this.isDestroyed) return;

    const { width, height } = this.getViewport();
    const mat = this.resolveCurrentMaterial(width, height);
    const syncOptions = this.createSyncOptions(mat, { width, height });

    this.applyMaterialStyles(mat);
    if (this.backendManager.active) {
      this.backendManager.updateSync(syncOptions);
    } else {
      this.commitMaterialFrame(syncOptions);
    }
  }

  private protectContent(): void {
    const existingContent = this.element.querySelector(':scope > .lg-content');
    if (!existingContent) {
      // Any child node that is not one of our layers should remain on top
      const reserved = new Set<Node>([
        this.refractionLayer,
        this.tintLayer,
        this.borderScreenLayer,
        this.borderOverlayLayer,
      ]);
      const childrenToWrap: Node[] = [];
      this.element.childNodes.forEach((node) => {
        if (!reserved.has(node)) {
          childrenToWrap.push(node);
        }
      });

      if (childrenToWrap.length > 0) {
        const wrapper = document.createElement('div');
        wrapper.className = 'lg-content';
        wrapper.style.position = 'relative';
        wrapper.style.zIndex = '3';
        childrenToWrap.forEach((child) => wrapper.appendChild(child));
        this.element.appendChild(wrapper);
        this.contentContainer = wrapper;
      }
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
    const { width, height } = this.getViewport();

    const mat = this.resolveCurrentMaterial(width, height);
    this.applyMaterialStyles(mat);

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

  private applyMaterialStyles(mat: ResolvedMaterial): void {
    const s = this.element.style;

    s.borderRadius = mat.radiusPx;
    s.setProperty('--lg-tint-rgb', mat.tintRgb);
    s.setProperty('--lg-tint-alpha', String(mat.tintOpacity));
    s.setProperty('--lg-radius', mat.radiusPx);
    s.setProperty('--lg-shadow-blur', `${mat.shadowBlur}px`);
    s.setProperty('--lg-shadow-spread', `${mat.shadowSpread}px`);
    s.setProperty('--lg-shadow-color', mat.shadowColor);
    s.setProperty('--lg-outer-shadow-blur', `${Math.round(mat.shadowBlur * 1.3)}px`);
    s.setProperty('--lg-shadow-opacity', String(mat.shadowOpacity));
    s.setProperty('--lg-press-scale', String(mat.calibration.interaction.pressScale));
    s.setProperty('--lg-fresnel-gain', String(mat.calibration.lighting.fresnelGain));

    const isDebugChannel = mat.debug !== 'none' && mat.debug !== 'final';
    this.tintLayer.style.display = isDebugChannel ? 'none' : '';
    // Specular display state is owned exclusively by updateSpecularGradients().
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

  private getViewport(): { width: number; height: number } {
    const rect = getElementRect(this.element);
    return {
      width: Math.max(16, Math.round(rect.width || this.element.offsetWidth || 300)),
      height: Math.max(16, Math.round(rect.height || this.element.offsetHeight || 80)),
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
    this.applyMaterialStyles(options.material);
    this.updateSpecularMask(assets);
    this.updateBackdropStyle(options.material, { engine, assets });
    this.updateSpecularGradients(options.material);
  }

  private syncOpticalFrame(
    engine: SvgGlassEngine,
    assets: OpticalFieldAssets,
    options: SvgBackendSyncOptions
  ): void {
    this.commitOpticalFrame(engine, assets, options);
  }

  private commitMaterialFrame(options: SvgBackendSyncOptions): void {
    this.applyMaterialStyles(options.material);
    this.updateSpecularMask(null);
    this.updateBackdropStyle(options.material);
    this.updateSpecularGradients(options.material);
  }

  private syncMaterialFrame(options: SvgBackendSyncOptions): void {
    this.commitMaterialFrame(options);
  }

  private commitStaticFrame(options: SvgBackendSyncOptions): void {
    this.applyMaterialStyles(options.material);
    if (options.fillOpacity !== undefined) {
      this.element.style.setProperty('--lg-tint-alpha', String(options.fillOpacity));
    }
    this.updateSpecularMask(null);
    this.updateStaticStyle();
    this.updateSpecularGradients(options.material);
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
    this.element.style.filter = '';
    this.element.style.backgroundImage = '';
    this.element.style.backgroundColor = '';
    this.refractionLayer.style.filter = '';
    this.refractionLayer.style.backgroundImage = '';
    this.refractionLayer.style.backgroundColor = '';
    this.refractionLayer.style.backdropFilter = '';
    (this.refractionLayer.style as unknown as Record<string, string>).webkitBackdropFilter = '';
    this.refractionLayer.style.opacity = '';
    this.refractionLayer.style.display = '';
    const saturationPercent = Math.max(0, Math.round(mat.saturation * 100));
    this.element.style.filter = `saturate(${saturationPercent}%)`;
    if (optical) {
      const filterCss = `url(#${optical.engine.filterId})`;
      this.element.style.backdropFilter = filterCss;
      (this.element.style as unknown as Record<string, string>).webkitBackdropFilter = filterCss;
      // Preserve the public layer-level filter contract without compositing the
      // same optical result twice; the root host is the visible filter surface.
      this.refractionLayer.style.backdropFilter = filterCss;
      (this.refractionLayer.style as unknown as Record<string, string>).webkitBackdropFilter =
        filterCss;
      this.refractionLayer.style.opacity = '0';
    } else {
      // Live Material Fallback (Safari WebKit Bug 245510 or initial mount before assets ready)
      const blurPx = Math.max(0, Math.round(mat.bodyBlur));
      const filterCss = `${blurPx > 0 ? `blur(${blurPx}px) ` : ''}saturate(100%)`;
      this.element.style.backdropFilter = filterCss;
      (this.element.style as unknown as Record<string, string>).webkitBackdropFilter = filterCss;
      // Keep the layer-level fallback for browsers that do not support the
      // root-level backdrop filter contract used by the optical path.
      this.refractionLayer.style.backdropFilter = filterCss;
      (this.refractionLayer.style as unknown as Record<string, string>).webkitBackdropFilter =
        filterCss;
      this.refractionLayer.style.opacity = '1';
    }
  }

  private updateStaticStyle(): void {
    this.element.style.filter = '';
    this.element.style.backgroundImage = '';
    this.element.style.backgroundColor = '';
    (this.element.style as unknown as Record<string, string>).backdropFilter = '';
    (this.element.style as unknown as Record<string, string>).webkitBackdropFilter = '';

    this.refractionLayer.style.filter = '';
    this.refractionLayer.style.backgroundImage = '';
    this.refractionLayer.style.backgroundColor = '';
    this.refractionLayer.style.backdropFilter = '';
    (this.refractionLayer.style as unknown as Record<string, string>).webkitBackdropFilter = '';
    this.refractionLayer.style.opacity = '0';
    this.refractionLayer.style.display = 'none';
  }

  private updateSpecularGradients(mat?: ResolvedMaterial): void {
    if (this.isDestroyed) return;
    // InteractionController updates --lg-light-angle directly. Material
    // changes call this method with a resolved material, while interaction
    // frames do not need to touch gradient declarations at all.
    if (!mat) return;

    const specular = mat.specular;
    if (specular <= 0) {
      this.borderScreenLayer.style.display = 'none';
      this.borderOverlayLayer.style.display = 'none';
      return;
    }

    this.borderScreenLayer.style.display = '';
    this.borderOverlayLayer.style.display = '';

    const gain = mat.specularGain;
    const effSpec = Math.min(1, specular * gain);
    const borderMode = mat.borderMode;

    const s = this.element.style;

    if (borderMode === 'adaptive') {
      // 方案二：环境亮度自适应轮廓 (Luma-Adaptive Dual Rim)
      // 根据环境明度 (ambientLuma)，在纯白/浅色底时平滑过渡为深冷灰精细墨线，暗底保持晶亮白高光
      const luma = mat?.ambientLuma ?? this.options.ambientLuma ?? 0.5;
      const isLight = luma >= 0.6;
      const factor = Math.max(0, Math.min(1, (luma - 0.45) / 0.4));

      // 在亮白底使用深灰墨线 (15, 23, 42)，暗底使用纯白 (255, 255, 255)
      const r = Math.round(255 * (1 - factor) + 15 * factor);
      const g = Math.round(255 * (1 - factor) + 23 * factor);
      const b = Math.round(255 * (1 - factor) + 42 * factor);

      const a1 = isLight ? (0.28 * effSpec).toFixed(3) : (0.85 * effSpec).toFixed(3);
      const a2 = isLight ? (0.08 * effSpec).toFixed(3) : (0.2 * effSpec).toFixed(3);
      const a3 = isLight ? (0.18 * effSpec).toFixed(3) : (0.55 * effSpec).toFixed(3);

      const o1 = isLight ? (0.35 * effSpec).toFixed(3) : (0.95 * effSpec).toFixed(3);
      const o2 = isLight ? (0.05 * effSpec).toFixed(3) : (0.05 * effSpec).toFixed(3);
      const o3 = isLight ? (0.24 * effSpec).toFixed(3) : (0.4 * effSpec).toFixed(3);

      const screenStops = [
        `rgba(${r},${g},${b},${a1})`,
        `rgba(${r},${g},${b},${a2})`,
        `rgba(${r},${g},${b},${a3})`,
      ];
      const overlayStops = [
        `rgba(${r},${g},${b},${o1})`,
        `rgba(${r},${g},${b},${o2})`,
        `rgba(${r},${g},${b},${o3})`,
      ];

      s.setProperty('--lg-border-screen-stop-1', screenStops[0]);
      s.setProperty('--lg-border-screen-stop-2', screenStops[1]);
      s.setProperty('--lg-border-screen-stop-3', screenStops[2]);
      s.setProperty('--lg-border-overlay-stop-1', overlayStops[0]);
      s.setProperty('--lg-border-overlay-stop-2', overlayStops[1]);
      s.setProperty('--lg-border-overlay-stop-3', overlayStops[2]);

      s.setProperty(
        '--lg-border-screen-bg',
        `linear-gradient(135deg, ${screenStops[0]} 0%, ${screenStops[1]} 50%, ${screenStops[2]} 100%)`
      );
      s.setProperty(
        '--lg-border-overlay-bg',
        `linear-gradient(135deg, ${overlayStops[0]} 0%, ${overlayStops[1]} 60%, ${overlayStops[2]} 100%)`
      );
    } else {
      // 方案一：明暗双向流动光影边 (Directional Contrast Rim)
      // 迎光面保持通透镜面白高光，背光面自然沉降为真实物理折射的微弱暗影线 (rgba(15,23,42,0.18))
      // 在深底白光璀璨，在纯白底背光暗切角立即突显立体几何边缘
      const s1 = (0.92 * effSpec).toFixed(3);
      const s2 = (0.15 * effSpec).toFixed(3);
      const s3 = (0.18 * effSpec).toFixed(3);
      const o1 = (0.95 * effSpec).toFixed(3);
      const o2 = (0.05 * effSpec).toFixed(3);
      const o3 = (0.24 * effSpec).toFixed(3);

      const screenStops = [
        `rgba(255,255,255,${s1})`,
        `rgba(255,255,255,${s2})`,
        `rgba(15,23,42,${s3})`,
      ];
      const overlayStops = [
        `rgba(255,255,255,${o1})`,
        `rgba(255,255,255,${o2})`,
        `rgba(15,23,42,${o3})`,
      ];

      s.setProperty('--lg-border-screen-stop-1', screenStops[0]);
      s.setProperty('--lg-border-screen-stop-2', screenStops[1]);
      s.setProperty('--lg-border-screen-stop-3', screenStops[2]);
      s.setProperty('--lg-border-overlay-stop-1', overlayStops[0]);
      s.setProperty('--lg-border-overlay-stop-2', overlayStops[1]);
      s.setProperty('--lg-border-overlay-stop-3', overlayStops[2]);

      s.setProperty(
        '--lg-border-screen-bg',
        `linear-gradient(135deg, ${screenStops[0]} 0%, ${screenStops[1]} 50%, ${screenStops[2]} 100%)`
      );
      s.setProperty(
        '--lg-border-overlay-bg',
        `linear-gradient(135deg, ${overlayStops[0]} 0%, ${overlayStops[1]} 60%, ${overlayStops[2]} 100%)`
      );
    }
  }

  private updateSpecularMask(assets: OpticalFieldAssets | null): void {
    const hasMask = Boolean(assets?.fresnelMaskUrl);
    for (const layer of [this.borderScreenLayer, this.borderOverlayLayer]) {
      layer.classList.toggle('lg-border-geometry', hasMask);
    }
    if (hasMask) {
      this.element.style.setProperty('--lg-fresnel-mask-image', `url("${assets?.fresnelMaskUrl}")`);
    } else {
      this.element.style.removeProperty('--lg-fresnel-mask-image');
    }
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
    if (plan.targetMode === 'full-optical') {
      const backend = new OpticalBackend(this.backendContext, this.options);
      this.pendingOpticalBackend = backend;
      return backend;
    }
    if (plan.targetMode === 'material') {
      this.pendingOpticalBackend = null;
      return new MaterialBackend(this.backendContext, this.options);
    }
    this.pendingOpticalBackend = null;
    return new StaticBackend(this.backendContext, this.options);
  }

  private createRecoveryChain(plan: RenderPlan): RuntimePreview<SvgBackendSyncOptions>[] {
    const candidates: RuntimePreview<SvgBackendSyncOptions>[] = [];

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
    const preview =
      plan.targetMode === 'full-optical'
        ? {
            plan: this.resolveMaterialPreviewPlan(),
            backend: new MaterialBackend(this.backendContext, this.options),
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

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.interactionController) {
      this.interactionController.destroy();
      this.interactionController = null;
    }

    this.backendManager.dispose();
    this.pendingOpticalBackend?.dispose();
    this.pendingOpticalBackend = null;

    if (this.refractionLayer?.parentNode) {
      this.refractionLayer.parentNode.removeChild(this.refractionLayer);
    }
    if (this.tintLayer?.parentNode) {
      this.tintLayer.parentNode.removeChild(this.tintLayer);
    }
    if (this.borderScreenLayer?.parentNode) {
      this.borderScreenLayer.parentNode.removeChild(this.borderScreenLayer);
    }
    if (this.borderOverlayLayer?.parentNode) {
      this.borderOverlayLayer.parentNode.removeChild(this.borderOverlayLayer);
    }
    if (this.contentContainer?.parentNode) {
      // Unwrap children safely
      while (this.contentContainer.firstChild) {
        this.element.appendChild(this.contentContainer.firstChild);
      }
      this.contentContainer.parentNode.removeChild(this.contentContainer);
    }

    this.element.classList.remove('lg-root', 'lg-svg-container');
  }
}
