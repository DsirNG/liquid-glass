import type { CanonicalGlassOptions } from '../options';
import type { CapabilityReport } from '../capabilities';

export type RenderMode = 'full-optical' | 'material' | 'static';

/**
 * Controls what the planner may change when the requested backend is unavailable.
 * `strict` does not produce a degraded plan; the planner reports unsupported instead.
 */
export type FallbackPolicy = 'auto' | 'preserve' | 'strict';

export type StrictRequestedMode = 'full-optical' | 'material';

export type CapabilityDegradeReason =
  'optical-unsupported' | 'backdrop-filter-unsupported' | 'forced-material' | 'forced-static';

export interface GlassCapabilities {
  opticalField: boolean;
  refraction: boolean;
  dispersion: boolean;
  backdropBlur: boolean;
  saturation: boolean;
  tint: boolean;
  shadow: boolean;
  specular: boolean;
}

export type CommonMaterialOptions = Pick<
  CanonicalGlassOptions,
  | 'tint'
  | 'opacity'
  | 'shadow'
  | 'shadowColor'
  | 'specular'
  | 'borderMode'
  | 'radius'
  | 'ambientLuma'
  | 'interactive'
>;

export type OpticalBackendOptions = Pick<
  CanonicalGlassOptions,
  | 'blur'
  | 'saturation'
  | 'thickness'
  | 'ior'
  | 'refraction'
  | 'dispersion'
  | 'bezel'
  | 'surfaceProfile'
  | 'materialPreset'
  | 'quality'
  | 'shape'
  | 'debug'
  | 'colorBleed'
  | 'refractionCoverage'
>;

export type BackdropBackendOptions = Pick<CanonicalGlassOptions, 'blur' | 'saturation'>;

export interface StaticBackendOptions {
  fillOpacity: number;
}

export interface RenderPlanBase {
  requestedOptions: CanonicalGlassOptions;
  capabilities: GlassCapabilities;
}

export interface FullOpticalRenderPlan extends RenderPlanBase {
  targetMode: 'full-optical';
  effective: {
    common: CommonMaterialOptions;
    optical: OpticalBackendOptions;
  };
  degraded: false;
  degradationReason?: never;
}

export interface MaterialRenderPlan extends RenderPlanBase {
  targetMode: 'material';
  effective: {
    common: CommonMaterialOptions;
    backdrop: BackdropBackendOptions;
  };
  degraded: true;
  degradationReason: CapabilityDegradeReason;
}

export interface StaticRenderPlan extends RenderPlanBase {
  targetMode: 'static';
  effective: {
    common: CommonMaterialOptions;
    static: StaticBackendOptions;
  };
  degraded: true;
  degradationReason: CapabilityDegradeReason;
}

export type RenderPlan = FullOpticalRenderPlan | MaterialRenderPlan | StaticRenderPlan;

export interface RenderPlanningInput {
  requested: CanonicalGlassOptions;
  capabilities: GlassCapabilities;
  /** Optional raw probe facts; retained as optional for planner API compatibility. */
  capabilityReport?: CapabilityReport;
  fallbackPolicy?: FallbackPolicy;
}
