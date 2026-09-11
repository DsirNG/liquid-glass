import { CapabilityProbe, hasBlockingRestriction } from '../capabilities';

export type { CapabilityReport, KnownRestriction } from '../capabilities';

export type OpticalCapability = 'full' | 'material';

export interface CapabilityOptions {
  override?: 'auto' | 'full' | 'material';
}

/**
 * @deprecated Use CapabilityProbe for runtime facts and RenderPlanner for tier selection.
 * This facade remains for source compatibility with older integrations.
 */
export class CapabilityResolver {
  public static resolve(options?: CapabilityOptions): OpticalCapability {
    if (options?.override && options.override !== 'auto') {
      return options.override;
    }

    const report = CapabilityProbe.probe();
    return report.svgBackdropDisplacement && !hasBlockingRestriction(report) ? 'full' : 'material';
  }

  /** @deprecated Use CapabilityProbe.probe().backdropFilter. */
  public static supportsBackdropFilter(): boolean {
    return CapabilityProbe.probe().backdropFilter;
  }
}
