import type { LiquidGlassUpdateOptions } from '../../types';
import type { ParameterImpact } from '../../types';
import { normalizeOptionPatch } from '../options';

export type ParameterKey = keyof LiquidGlassUpdateOptions;
export type CanonicalOptionKey = Exclude<ParameterKey, 'surfaceShape'>;
export type CapabilityKey =
  | 'opticalField'
  | 'refraction'
  | 'dispersion'
  | 'backdropBlur'
  | 'saturation'
  | 'tint'
  | 'shadow'
  | 'specular';

export interface ParameterMeta {
  readonly impact: ParameterImpact;
  readonly capability?: CapabilityKey;
  readonly aliasOf?: CanonicalOptionKey;
}

/**
 * The single source of truth for update routing. This intentionally contains
 * no labels, ranges, presets, or other Playground presentation metadata.
 */
export const PARAMETER_META = {
  radius: { impact: 'field', capability: 'opticalField' },
  bezel: { impact: 'field', capability: 'opticalField' },
  thickness: { impact: 'field', capability: 'opticalField' },
  ior: { impact: 'field', capability: 'opticalField' },
  surfaceProfile: { impact: 'field', capability: 'opticalField' },
  shape: { impact: 'field', capability: 'opticalField' },
  quality: { impact: 'field', capability: 'opticalField' },
  refractionCoverage: { impact: 'field', capability: 'opticalField' },
  refraction: { impact: 'filter', capability: 'refraction' },
  dispersion: { impact: 'filter', capability: 'dispersion' },
  colorBleed: { impact: 'filter' },
  debug: { impact: 'filter' },
  blur: { impact: 'material', capability: 'backdropBlur' },
  saturation: { impact: 'material', capability: 'saturation' },
  ambientLuma: { impact: 'material' },
  tint: { impact: 'style', capability: 'tint' },
  opacity: { impact: 'style' },
  shadow: { impact: 'style', capability: 'shadow' },
  shadowColor: { impact: 'style' },
  specular: { impact: 'style', capability: 'specular' },
  borderMode: { impact: 'style' },
  materialPreset: { impact: 'field', capability: 'opticalField' },
  capability: { impact: 'field' },
  surfaceShape: { impact: 'field', capability: 'opticalField', aliasOf: 'surfaceProfile' },
} as const satisfies Record<ParameterKey, ParameterMeta>;

const IMPACT_RANK: Record<ParameterImpact, number> = {
  style: 0,
  material: 1,
  filter: 2,
  field: 3,
};

export function maxImpact(left: ParameterImpact, right: ParameterImpact): ParameterImpact {
  return IMPACT_RANK[left] >= IMPACT_RANK[right] ? left : right;
}

export class UnknownParameterError extends Error {
  public readonly key: string;

  constructor(key: string) {
    super(`[LiquidGlass] Unknown update option "${key}". Register it in PARAMETER_META.`);
    this.name = 'UnknownParameterError';
    this.key = key;
  }
}

/** Resolves the highest update impact after public aliases are canonicalized. */
export function resolveUpdateImpact(patch: LiquidGlassUpdateOptions): ParameterImpact {
  const canonicalPatch = normalizeOptionPatch(patch);
  let impact: ParameterImpact = 'style';

  for (const key of Object.keys(canonicalPatch)) {
    const meta = PARAMETER_META[key as ParameterKey];
    if (!meta) {
      throw new UnknownParameterError(key);
    }
    impact = maxImpact(impact, meta.impact);
  }

  return impact;
}
