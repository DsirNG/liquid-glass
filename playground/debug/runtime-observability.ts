import { hasBlockingRestriction, PARAMETER_META } from '../../src/engine';
import type { CapabilityKey, CapabilityReport, ParameterKey, ParameterMeta } from './types';
import type {
  LiquidGlassMaterialOptions,
  LiquidGlassRenderMode,
  LiquidGlassStatus,
} from '@dinqorai/liquid-glass';

export type SupportLevel = 'full' | 'approximate' | 'unsupported';

export interface ParameterSupportRow {
  readonly key: ParameterSupportKey;
  readonly label: string;
  readonly level: SupportLevel;
  readonly detail: string;
  readonly meta: ParameterMeta;
  readonly visualNote?: string;
  readonly visualState?: 'inactive' | 'context';
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
  return hasCapabilitySupport('capability' in meta ? meta.capability : undefined, report)
    ? 'full'
    : 'unsupported';
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
  return hasCapabilitySupport('capability' in meta ? meta.capability : undefined, report)
    ? 'full'
    : 'unsupported';
}

function resolveSupportLevel(
  key: ParameterSupportKey,
  activeMode: LiquidGlassRenderMode | null,
  report: CapabilityReport
): SupportLevel {
  const meta = PARAMETER_META[key];
  if (!activeMode) return 'unsupported';

  if (activeMode === 'full-optical') {
    if (key === 'dispersion') return 'approximate';
    return hasCapabilitySupport('capability' in meta ? meta.capability : undefined, report)
      ? 'full'
      : 'unsupported';
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

function getVisualNote(
  key: ParameterSupportKey,
  options: LiquidGlassMaterialOptions | undefined
): string | undefined {
  if (!options) return undefined;

  if (key === 'bezel' && options.refractionCoverage === 'full')
    return '全域透镜以半径为曲面宽度；切换 rim 后由 Bezel 控制边缘宽度';

  if (key === 'blur' && options.blur === 0) return '模糊当前为 0';
  if (key === 'opacity' && options.opacity === 0) return '材质填充当前为 0';
  if (key === 'tint' && options.opacity === 0) return '填充透明度为 0，底色不会显示';
  if (key === 'shadow' && options.shadow === 0) return '阴影当前为 0';
  if (key === 'specular' && options.specular === 0) return '高光当前为 0';

  const opticalKeys: readonly ParameterSupportKey[] = [
    'ior',
    'refraction',
    'dispersion',
    'colorBleed',
  ];
  if (opticalKeys.includes(key)) {
    if (options.refraction === 0) return '折射强度为 0，光学变化不会显示';
  }
  if (key === 'dispersion' && options.dispersion === 0) return '色散当前为 0';
  if (key === 'colorBleed' && options.colorBleed === 0) return '色彩晕染当前为 0';
  return undefined;
}

function getContextNote(key: ParameterSupportKey, isSolidBackground: boolean): string | undefined {
  if (!isSolidBackground) return undefined;
  if (key === 'ior' || key === 'refraction' || key === 'dispersion' || key === 'colorBleed') {
    return '纯色区域无纹理；穿过文字或图案时才能观察折射变化';
  }
  return undefined;
}

export function getParameterSupportRows(
  status: Pick<LiquidGlassStatus, 'activeMode'>,
  report: CapabilityReport,
  options?: LiquidGlassMaterialOptions,
  isSolidBackground = false
): readonly ParameterSupportRow[] {
  return PARAMETER_SUPPORT_KEYS.map((key) => {
    const meta = PARAMETER_META[key];
    const level = resolveSupportLevel(key, status.activeMode, report);
    const inactiveNote = level === 'unsupported' ? undefined : getVisualNote(key, options);
    const contextNote =
      level === 'unsupported' || inactiveNote ? undefined : getContextNote(key, isSolidBackground);
    return {
      key,
      label: PARAMETER_LABELS[key],
      level,
      detail: getSupportDetail(level, status.activeMode),
      meta,
      visualNote: inactiveNote ?? contextNote,
      visualState: inactiveNote ? 'inactive' : contextNote ? 'context' : undefined,
    };
  });
}
