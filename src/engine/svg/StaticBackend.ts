import type { NormalizedLiquidGlassOptions } from '../../types';
import type {
  BackendPrepareContext,
  EffectBackend,
  PreparedBackendCommit,
} from '../runtime/backend';
import type { RenderPlan, StaticRenderPlan } from '../planning';
import { MaterialResolver } from './MaterialResolver';
import type { SvgBackendContext, SvgBackendSyncOptions } from './BackendContext';

/** Final CSS-only surface fallback; it never creates blur or optical resources. */
export class StaticBackend implements EffectBackend<SvgBackendSyncOptions> {
  public readonly mode = 'static' as const;
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
    this.context.syncStatic(options);
  }

  public prepare(
    plan: RenderPlan,
    _context: BackendPrepareContext
  ): Promise<PreparedBackendCommit> {
    if (plan.targetMode !== 'static') {
      return Promise.reject(new Error(`StaticBackend cannot prepare ${plan.targetMode} plan.`));
    }

    const staticPlan = plan as StaticRenderPlan;
    const viewport = this.context.getViewport();
    const material = MaterialResolver.resolve(
      {
        ...this.requestedOptions,
        ...staticPlan.effective.common,
      },
      viewport.width,
      viewport.height
    );
    const options: SvgBackendSyncOptions = {
      material,
      viewport,
      userRefraction: staticPlan.requestedOptions.refraction,
      fillOpacity: staticPlan.effective.static.fillOpacity,
    };
    this.currentOptions = options;

    return Promise.resolve({
      commit: () => {
        if (!this.disposed) this.context.commitStatic(options);
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
      fillOpacity: material.tintOpacity,
    });
  }

  public dispose(): void {
    this.disposed = true;
  }
}
