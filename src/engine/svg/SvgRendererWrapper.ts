import type {
  LiquidGlassUpdateOptions,
  RendererDelegate,
  NormalizedLiquidGlassOptions,
} from '../../types';
import { getElementRect } from '../../utils/dom';
import { SvgGlassEngine } from './SvgFilterBuilder';
import { OpticalFieldGenerator } from './OpticalFieldGenerator';
import type { OpticalFieldAssets } from './OpticalFieldAssets';
import { CapabilityResolver, type OpticalCapability } from './CapabilityResolver';
import { MaterialResolver, type ResolvedMaterial } from './MaterialResolver';
import { InteractionController } from './InteractionController';
import type { SurfaceProfile } from './geometry/surfaceProfiles';

export type ExtendedEngineOptions = NormalizedLiquidGlassOptions;

/**
 * High-level SVG DOM Wrapper implementing RendererDelegate.
 * Orchestrates:
 * 1. CapabilityResolver (Full Optical vs Live Material fallback)
 * 2. OpticalFieldGenerator (Slow Path: async PNG Blobs with revision race guard)
 * 3. MaterialResolver (Size adaptation & parameter resolution)
 * 4. InteractionController (Fast Path: pointer/touch/specular light vector)
 * 5. 5-Layer DOM stacking context with explicit content protection
 */
export class SvgRendererWrapper implements RendererDelegate {
  private element: HTMLElement;
  private options: ExtendedEngineOptions;
  private capability: OpticalCapability;
  private svgEngine: SvgGlassEngine | null = null;
  private interactionController: InteractionController | null = null;

  private refractionLayer: HTMLDivElement;
  private tintLayer: HTMLDivElement;
  private borderScreenLayer: HTMLDivElement;
  private borderOverlayLayer: HTMLDivElement;
  private contentContainer: HTMLDivElement | null = null;

  private resizeObserver: ResizeObserver | null = null;
  private isDestroyed = false;
  private fieldRevision = 0;
  private currentAssets: OpticalFieldAssets | null = null;
  private updateScheduled = false;


  constructor(element: HTMLElement, options: NormalizedLiquidGlassOptions) {
    this.element = element;
    this.options = { ...options };
    this.capability = CapabilityResolver.resolve({ override: this.options.capability });

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

    if (this.capability === 'full') {
      this.svgEngine = new SvgGlassEngine();
      const rect = getElementRect(this.element);
      const w = Math.max(16, Math.round(rect.width || this.element.offsetWidth || 300));
      const h = Math.max(16, Math.round(rect.height || this.element.offsetHeight || 80));
      const initialMat = this.resolveCurrentMaterial(w, h);
      this.svgEngine.update(initialMat, null, this.options.refraction ?? 1.0);
    }


    // Fast-path interaction controller
    if (this.options.interactive !== false) {
      this.interactionController = new InteractionController(this.element, {
        onUpdate: () => {
          this.updateSpecularGradients();
        },
      });
    }

    this.applyStyles();
    this.scheduleGeometryUpdate();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.scheduleGeometryUpdate();
      });
      this.resizeObserver.observe(this.element);
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
    return MaterialResolver.resolve(
      this.options,
      width,
      height,
      this.currentAssets?.physicalAmplitude ?? 0
    );
  }

  private applyStyles(): void {
    if (this.isDestroyed) return;
    const rect = getElementRect(this.element);
    const width = rect.width || this.element.offsetWidth || 300;
    const height = rect.height || this.element.offsetHeight || 80;

    const mat = this.resolveCurrentMaterial(width, height);
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

    this.updateBackdropStyle(mat);
    this.updateSpecularGradients(mat);

    const isDebugChannel = mat.debug !== 'none' && mat.debug !== 'final';
    this.tintLayer.style.display = isDebugChannel ? 'none' : '';
    if (isDebugChannel) {
      this.borderScreenLayer.style.display = 'none';
      this.borderOverlayLayer.style.display = 'none';
    }
  }

  private updateBackdropStyle(mat: ResolvedMaterial): void {
    if (this.capability === 'full' && this.svgEngine && this.currentAssets) {
      // Full Optical: pure url(#filter) with zero duplicate CSS saturation
      const filterCss = `url(#${this.svgEngine.filterId})`;
      this.refractionLayer.style.backdropFilter = filterCss;
      (this.refractionLayer.style as unknown as Record<string, string>).webkitBackdropFilter = filterCss;
    } else {
      // Live Material Fallback (Safari WebKit Bug 245510 or initial mount before assets ready)
      const blurPx = Math.max(1, Math.round(mat.bodyBlur || 8));
      const sat = Math.round(mat.saturation > 10 ? mat.saturation : mat.saturation * 100);
      const filterCss = `blur(${blurPx}px) saturate(${sat}%)`;
      this.refractionLayer.style.backdropFilter = filterCss;
      (this.refractionLayer.style as unknown as Record<string, string>).webkitBackdropFilter = filterCss;
    }
  }


  private updateSpecularGradients(mat?: ResolvedMaterial): void {
    if (this.isDestroyed) return;
    const isDebugChannel = Boolean(
      this.options.debug && this.options.debug !== 'none' && this.options.debug !== 'final'
    );
    const specular = mat ? mat.specular : (this.options.specular ?? 0.65);
    if (isDebugChannel || specular <= 0) {
      this.borderScreenLayer.style.display = 'none';
      this.borderOverlayLayer.style.display = 'none';
      return;
    }

    this.borderScreenLayer.style.display = '';
    this.borderOverlayLayer.style.display = '';

    const sState = this.interactionController?.getState();
    const angle = sState ? sState.lightAngle : 135;
    const gain = mat ? mat.specularGain : 1.0;
    const effSpec = Math.min(1, specular * gain);

    const s1 = (0.85 * effSpec).toFixed(3);
    const s2 = (0.2 * effSpec).toFixed(3);
    const s3 = (0.55 * effSpec).toFixed(3);
    const o1 = (0.95 * effSpec).toFixed(3);
    const o2 = (0.05 * effSpec).toFixed(3);
    const o3 = (0.4 * effSpec).toFixed(3);

    const s = this.element.style;
    s.setProperty(
      '--lg-border-screen-bg',
      `linear-gradient(${angle}deg, rgba(255,255,255,${s1}) 0%, rgba(255,255,255,${s2}) 50%, rgba(255,255,255,${s3}) 100%)`
    );
    s.setProperty(
      '--lg-border-overlay-bg',
      `linear-gradient(${angle}deg, rgba(255,255,255,${o1}) 0%, rgba(255,255,255,${o2}) 60%, rgba(255,255,255,${o3}) 100%)`
    );
  }

  /**
   * Slow Path: Asynchronous optical field generation with revision race guard and transactional swap.
   */
  private scheduleGeometryUpdate(): void {
    if (this.isDestroyed || this.updateScheduled) return;
    this.updateScheduled = true;

    requestAnimationFrame(async () => {
      this.updateScheduled = false;
      if (this.isDestroyed) return;

      const rect = getElementRect(this.element);
      const width = Math.max(16, Math.round(rect.width || this.element.offsetWidth || 300));
      const height = Math.max(16, Math.round(rect.height || this.element.offsetHeight || 80));

      this.applyStyles();


      if (this.capability !== 'full' || !this.svgEngine) {
        return; // Fallback does not need SVG displacement texture
      }

      const revision = ++this.fieldRevision;
      const opts = this.options;
      const radius = opts.radius ?? 40;
      const bezel = opts.bezel ?? 36;
      const ior = opts.ior ?? 2.2;
      const surfaceProfile: SurfaceProfile = opts.surfaceProfile ?? 'convex_squircle';
      const resolvedMat = this.resolveCurrentMaterial(width, height);

      try {
        const nextAssets = await OpticalFieldGenerator.generate({
          geometry: {
            shape: opts.shape || 'roundedRect',
            width,
            height,
            radius,
          },
          bezel,
          thickness: resolvedMat.perceivedThickness,
          ior,
          surfaceProfile,
          basis: resolvedMat.calibration.geometry,
          revision,
        });

        // Revision race guard: discard if superseded or destroyed
        if (revision !== this.fieldRevision || this.isDestroyed) {
          nextAssets.dispose();
          return;
        }

        // Transactional swap: install new assets, update SVG filter graph, then switch backdrop style
        const previousAssets = this.currentAssets;
        this.currentAssets = nextAssets;

        this.svgEngine.update(resolvedMat, nextAssets, opts.refraction ?? 1.0);
        this.updateBackdropStyle(resolvedMat);

        requestAnimationFrame(() => {
          previousAssets?.dispose();
        });
      } catch (err) {
        // Fallback silently if offscreen rendering is constrained
        console.warn('[LiquidGlass] Failed to generate optical field:', err);
      }
    });
  }


  public update(newOptions: LiquidGlassUpdateOptions): void {
    if (this.isDestroyed) return;
    Object.assign(this.options, newOptions);
    this.applyStyles();
    this.scheduleGeometryUpdate();
  }

  public resize(): void {
    if (this.isDestroyed) return;
    this.scheduleGeometryUpdate();
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.interactionController) {
      this.interactionController.destroy();
      this.interactionController = null;
    }

    if (this.svgEngine) {
      this.svgEngine.destroy();
      this.svgEngine = null;
    }

    if (this.currentAssets) {
      this.currentAssets.dispose();
      this.currentAssets = null;
    }

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
