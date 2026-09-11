import type {
  BackdropBackendOptions,
  CommonMaterialOptions,
  FullOpticalRenderPlan,
  MaterialRenderPlan,
  RenderPlan,
  RenderPlanningInput,
  StaticRenderPlan,
  StrictRequestedMode,
} from './types';

/** Raised when strict policy cannot satisfy the requested capability level. */
export class RenderPlanUnsupportedError extends Error {
  public readonly code = 'unsupported-render-plan' as const;
  public readonly requestedMode: StrictRequestedMode;
  public readonly capabilities: RenderPlanningInput['capabilities'];

  constructor(
    requestedMode: StrictRequestedMode,
    capabilities: RenderPlanningInput['capabilities']
  ) {
    super(`LiquidGlass cannot satisfy strict ${requestedMode} rendering in this runtime.`);
    this.name = 'RenderPlanUnsupportedError';
    this.requestedMode = requestedMode;
    this.capabilities = capabilities;
  }
}

function resolveCommonOptions(
  requested: RenderPlanningInput['requested'],
  policy: RenderPlanningInput['fallbackPolicy'],
  degraded: boolean
): CommonMaterialOptions {
  const ensureVisibleFallback = degraded && policy !== 'preserve' && policy !== 'strict';

  return {
    tint: requested.tint,
    opacity: ensureVisibleFallback ? Math.max(requested.opacity, 0.08) : requested.opacity,
    shadow: requested.shadow,
    shadowColor: requested.shadowColor,
    specular: ensureVisibleFallback ? Math.max(requested.specular, 0.15) : requested.specular,
    borderMode: requested.borderMode,
    radius: requested.radius,
    ambientLuma: requested.ambientLuma,
    interactive: requested.interactive,
  };
}

function resolveBackdropOptions(
  requested: RenderPlanningInput['requested'],
  policy: RenderPlanningInput['fallbackPolicy']
): BackdropBackendOptions {
  const ensureVisibleFallback = policy !== 'preserve' && policy !== 'strict';

  return {
    blur: ensureVisibleFallback ? Math.max(requested.blur, 8) : requested.blur,
    saturation: ensureVisibleFallback ? Math.max(requested.saturation, 1.05) : requested.saturation,
  };
}

function resolveOpticalOptions(
  requested: RenderPlanningInput['requested']
): FullOpticalRenderPlan['effective']['optical'] {
  return {
    blur: requested.blur,
    saturation: requested.saturation,
    thickness: requested.thickness,
    ior: requested.ior,
    refraction: requested.refraction,
    dispersion: requested.dispersion,
    bezel: requested.bezel,
    surfaceProfile: requested.surfaceProfile,
    materialPreset: requested.materialPreset,
    quality: requested.quality,
    shape: requested.shape,
    debug: requested.debug,
    colorBleed: requested.colorBleed,
    refractionCoverage: requested.refractionCoverage,
  };
}

function resolveDegradationReason(input: RenderPlanningInput, targetMode: 'material' | 'static') {
  if (input.requested.capability === 'material') return 'forced-material' as const;
  if (input.requested.capability === 'full') return 'optical-unsupported' as const;
  if (targetMode === 'static') return 'backdrop-filter-unsupported' as const;
  return 'optical-unsupported' as const;
}

/** Pure capability + options planner. It does not touch the DOM or create backends. */
export function resolveRenderPlan(input: RenderPlanningInput): RenderPlan {
  const { requested, capabilities, fallbackPolicy = 'auto' } = input;
  const canUseOptical = capabilities.opticalField && capabilities.refraction;
  const canUseBackdrop = capabilities.backdropBlur;
  const strictRequestedMode: StrictRequestedMode =
    requested.capability === 'material' ? 'material' : 'full-optical';
  const canSatisfyStrictRequest =
    strictRequestedMode === 'full-optical' ? canUseOptical : canUseBackdrop;

  if (fallbackPolicy === 'strict' && !canSatisfyStrictRequest) {
    throw new RenderPlanUnsupportedError(strictRequestedMode, capabilities);
  }

  if (canUseOptical && requested.capability !== 'material') {
    return {
      targetMode: 'full-optical',
      requestedOptions: requested,
      effective: {
        common: resolveCommonOptions(requested, fallbackPolicy, false),
        optical: resolveOpticalOptions(requested),
      },
      capabilities,
      degraded: false,
    } satisfies FullOpticalRenderPlan;
  }

  if (canUseBackdrop) {
    return {
      targetMode: 'material',
      requestedOptions: requested,
      effective: {
        common: resolveCommonOptions(requested, fallbackPolicy, true),
        backdrop: resolveBackdropOptions(requested, fallbackPolicy),
      },
      capabilities,
      degraded: true,
      degradationReason: resolveDegradationReason(input, 'material'),
    } satisfies MaterialRenderPlan;
  }

  return {
    targetMode: 'static',
    requestedOptions: requested,
    effective: {
      common: resolveCommonOptions(requested, fallbackPolicy, true),
      static: {
        fillOpacity:
          fallbackPolicy === 'auto' ? Math.max(requested.opacity, 0.08) : requested.opacity,
      },
    },
    capabilities,
    degraded: true,
    degradationReason: resolveDegradationReason(input, 'static'),
  } satisfies StaticRenderPlan;
}
