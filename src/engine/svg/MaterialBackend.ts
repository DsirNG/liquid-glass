import type { NormalizedLiquidGlassOptions } from '../../types';
import type {
  BackendPrepareContext,
  EffectBackend,
  PreparedBackendCommit,
} from '../runtime/backend';
import type { MaterialRenderPlan, RenderPlan } from '../planning';
import { MaterialResolver } from './MaterialResolver';
import type { SvgBackendContext, SvgBackendSyncOptions } from './BackendContext';

/** Lightweight adapter for the existing CSS material preview/fallback path. */
export class MaterialBackend implements EffectBackend<SvgBackendSyncOptions> {
  public readonly mode = 'material' as const;
  private readonly context: SvgBackendContext;
  private readonly requestedOptions: NormalizedLiquidGlassOptions;
  private currentOptions: SvgBackendSyncOptions | null = null;
  private disposed = false;

  constructor(context: SvgBackendContext, requestedOptions: NormalizedLiquidGlassOptions) {
    this.context = context;
    this.requestedOptions = { ...requestedOptions };
  }

  public updateSync(options: SvgBackendSyncOptions): void {
    if (this.disposed) return;
    this.currentOptions = options;
    this.context.syncMaterial(options);
  }

  public prepare(
    plan: RenderPlan,
    _context: BackendPrepareContext
  ): Promise<PreparedBackendCommit> {
    if (plan.targetMode !== 'material') {
      return Promise.reject(new Error(`MaterialBackend cannot prepare ${plan.targetMode} plan.`));
    }

    const materialPlan = plan as MaterialRenderPlan;
    const viewport = this.context.getViewport();
    const material = MaterialResolver.resolve(
      {
        ...this.requestedOptions,
        ...materialPlan.effective.common,
        ...materialPlan.effective.backdrop,
      },
      viewport.width,
      viewport.height
    );
    const options = {
      material,
      viewport,
      userRefraction: materialPlan.requestedOptions.refraction,
    };
    this.currentOptions = options;

    return Promise.resolve({
      commit: () => {
        if (!this.disposed) this.context.commitMaterial(options);
      },
      dispose: () => undefined,
    });
  }

  public resize(width: number, height: number): void {
    if (this.disposed) return;
    if (this.currentOptions) {
      this.updateSync({
        ...this.currentOptions,
        viewport: { width, height },
      });
      return;
    }

    const viewport = { width, height };
    const material = MaterialResolver.resolve(this.requestedOptions, width, height);
    this.updateSync({
      material,
      viewport,
      userRefraction: this.requestedOptions.refraction,
    });
  }

  public dispose(): void {
    this.disposed = true;
  }
}
