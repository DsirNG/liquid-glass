import {
  hasBlockingRestriction,
  PARAMETER_META,
  type CapabilityKey,
  type CapabilityReport,
  type ParameterKey,
  type ParameterMeta,
} from '../../src/engine';
import type { LiquidGlassRenderMode, LiquidGlassStatus } from '../../src/types';

export type SupportLevel = 'full' | 'approximate' | 'unsupported';

export interface ParameterSupportRow {
  readonly key: ParameterSupportKey;
  readonly label: string;
  readonly level: SupportLevel;
  readonly detail: string;
  readonly meta: ParameterMeta;
}

export const PARAMETER_SUPPORT_KEYS = [
  'shape',
  'surfaceProfile',
  'materialPreset',
  'radius',
  'bezel',
  'thickness',
  'ior',
  'refraction',
  'dispersion',
  'colorBleed',
  'blur',
  'saturation',
  'tint',
  'opacity',
  'shadow',
  'specular',
  'borderMode',
  'ambientLuma',
] as const satisfies readonly ParameterKey[];

export type ParameterSupportKey = (typeof PARAMETER_SUPPORT_KEYS)[number];

const PARAMETER_LABELS: Record<ParameterSupportKey, string> = {
  shape: 'Shape',
  surfaceProfile: 'Surface profile',
  materialPreset: 'Material preset',
  radius: 'Radius',
  bezel: 'Bezel',
  thickness: 'Thickness',
  ior: 'IOR',
  refraction: 'Refraction',
  dispersion: 'Dispersion',
  colorBleed: 'Color bleed',
  blur: 'Blur',
  saturation: 'Saturation',
  tint: 'Tint',
  opacity: 'Opacity',
  shadow: 'Shadow',
  specular: 'Specular',
  borderMode: 'Border mode',
  ambientLuma: 'Ambient luma',
};

function hasOpticalFieldSupport(report: CapabilityReport): boolean {
  return report.svgBackdropDisplacement && !hasBlockingRestriction(report);
}

function hasCapabilitySupport(
  capability: CapabilityKey | undefined,
  report: CapabilityReport
): boolean {
  switch (capability) {
    case 'opticalField':
      return hasOpticalFieldSupport(report);
    case 'refraction':
      return report.svgDisplacementMap && report.svgBackdropDisplacement;
    case 'dispersion':
      return report.svgDisplacementMap && report.svgBackdropDisplacement;
    case 'backdropBlur':
      return report.backdropFilter;
    case 'saturation':
      return report.cssFilter;
    case 'tint':
    case 'shadow':
    case 'specular':
      return true;
    default:
      return true;
  }
}

function getMaterialSupportLevel(
  key: ParameterSupportKey,
  meta: ParameterMeta,
  report: CapabilityReport
): SupportLevel {
  if (meta.impact === 'filter') {
    return 'unsupported';
  }

  if (meta.capability === 'opticalField') {
    if (key === 'shape' || key === 'surfaceProfile' || key === 'bezel' || key === 'thickness') {
      return 'approximate';
    }
    if (key === 'radius' || key === 'materialPreset') {
      return 'full';
    }
    return 'unsupported';
  }

  if (meta.capability === 'specular') return 'approximate';
  return hasCapabilitySupport(meta.capability, report) ? 'full' : 'unsupported';
}

function getStaticSupportLevel(
  key: ParameterSupportKey,
  meta: ParameterMeta,
  report: CapabilityReport
): SupportLevel {
  if (meta.impact === 'filter') {
    return 'unsupported';
  }

  if (meta.capability === 'opticalField') {
    return key === 'radius' ? 'full' : 'unsupported';
  }

  if (meta.capability === 'backdropBlur' || meta.capability === 'saturation') {
    return 'unsupported';
  }

  if (meta.capability === 'specular') return 'approximate';
  return hasCapabilitySupport(meta.capability, report) ? 'full' : 'unsupported';
}

function resolveSupportLevel(
  key: ParameterSupportKey,
  activeMode: LiquidGlassRenderMode | null,
  report: CapabilityReport
): SupportLevel {
  const meta = PARAMETER_META[key];
  if (!activeMode) return 'unsupported';

  if (activeMode === 'full-optical') {
    return hasCapabilitySupport(meta.capability, report) ? 'full' : 'unsupported';
  }
  if (activeMode === 'material') return getMaterialSupportLevel(key, meta, report);
  return getStaticSupportLevel(key, meta, report);
}

function getSupportDetail(level: SupportLevel, activeMode: LiquidGlassRenderMode | null): string {
  if (!activeMode) return 'Waiting for an active backend';
  if (level === 'full') return 'Implemented by the active backend';
  if (level === 'approximate') return 'Implemented with a visual approximation';
  return 'Not implemented by the active backend';
}

export function getParameterSupportRows(
  status: Pick<LiquidGlassStatus, 'activeMode'>,
  report: CapabilityReport
): readonly ParameterSupportRow[] {
  return PARAMETER_SUPPORT_KEYS.map((key) => {
    const meta = PARAMETER_META[key];
    const level = resolveSupportLevel(key, status.activeMode, report);
    return {
      key,
      label: PARAMETER_LABELS[key],
      level,
      detail: getSupportDetail(level, status.activeMode),
      meta,
    };
  });
}
