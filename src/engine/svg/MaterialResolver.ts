import type { LiquidGlassMaterialOptions, OpticalDebugMode } from '../../types';
import { hexToRgb } from '../../utils/color';
import { type CalibrationPreset, IOS_MATERIAL_PRESET, PURE_MATERIAL_PRESET } from './presets';

export type MaterialPreset = 'pure' | 'ios';

export interface ResolvedMaterial {
  bodyBlur: number;
  saturation: number;
  perceivedThickness: number;
  physicalAmplitude: number;
  lensingGain: number;
  tintRgb: string;
  tintOpacity: number;
  shadowBlur: number;
  shadowSpread: number;
  shadowOpacity: number;
  shadowColor: string;
  specular: number;
  specularGain: number;
  dispersionGain: number;
  samplingMargin: number;
  ambientLuma: number;
  radiusPx: string;
  debug: OpticalDebugMode;
  calibration: CalibrationPreset;
  borderMode: 'directional' | 'adaptive';
  colorBleed: number;
  refractionCoverage: 'full' | 'rim';
}

/**
 * Computes size factor [0..1] based on equivalent characteristic dimension sqrt(W * H).
 * - Small elements (buttons, pills ~80px): factor closer to 0 (crisper, clearer).
 * - Large elements (cards, sheets ~400px+): factor closer to 1 (thicker, deeper shadow).
 */
export function resolveGlassSizeFactor(width: number, height: number): number {
  const charDim = Math.sqrt(Math.max(16, width) * Math.max(16, height));
  return Math.max(0, Math.min(1, (charDim - 60) / 340));
}

/**
 * Pure resolver synthesizing user options, geometry dimensions, environment ambient luma,
 * and material preset into an immutable ResolvedMaterial.
 */
export class MaterialResolver {
  public static resolve(
    options: LiquidGlassMaterialOptions & {
      materialPreset?: MaterialPreset;
      ambientLuma?: number;
      lensingGain?: number;
    },
    width: number,
    height: number,
    physicalAmplitude = 0
  ): ResolvedMaterial {
    const presetName = options.materialPreset || 'ios';
    const calibration = presetName === 'ios' ? IOS_MATERIAL_PRESET : PURE_MATERIAL_PRESET;
    const sizeFactor = resolveGlassSizeFactor(width, height);
    const ambientLuma = options.ambientLuma ?? 0.5;

    // Base user parameters
    const userBlur = options.blur ?? 0.1;
    const userOpacity = options.opacity ?? 0.12;
    const userThickness = options.thickness ?? 45;
    const userRefraction = options.refraction ?? 1.0;
    const userDispersion = options.dispersion ?? 1.5;
    const userSaturation = options.saturation ?? 1.3;
    const userSpecular = options.specular ?? 0.65;
    const userShadow = options.shadow ?? 0.3;
    const tintColor = options.tint ?? '#ffffff';
    const shadowColor = options.shadowColor ?? 'rgba(0, 0, 0, 0.22)';
    const debugMode = options.debug || 'none';

    // Calibrated gains
    const lensingGain = (options.lensingGain ?? 1.0) * calibration.optics.lensingGain;
    const dispersionGain = calibration.optics.dispersionGain * userDispersion;
    const bodyBlur = Math.max(0, userBlur * calibration.body.blurGain * (0.6 + 0.6 * sizeFactor));
    const specularGain = calibration.lighting.specularGain * (1.0 + (1 - ambientLuma) * 0.2);
    const tintGain = calibration.body.tintGain * (0.9 + ambientLuma * 0.2);

    const effectiveOpacity = Math.max(0, Math.min(1, userOpacity * tintGain));
    const perceivedThickness = userThickness * (0.8 + 0.4 * sizeFactor);

    // Dynamic physical deflection amplitude
    const effectiveAmp = physicalAmplitude > 0 ? physicalAmplitude : 32;
    const totalRefractionPx = userRefraction * effectiveAmp * lensingGain;

    // Required userSpaceOnUse sampling margin to prevent clipping blur, color bleed & deflection
    const safetyPadding = 12;
    const samplingMargin = Math.ceil(
      totalRefractionPx + bodyBlur * 3 + (options.colorBleed ?? 0.6) * 12 + safetyPadding
    );

    const shadowSpread = Math.max(-10, Math.min(10, (userShadow - 0.5) * 15));
    const shadowBlur = Math.round(
      userShadow * (20 + 20 * sizeFactor) * calibration.shadow.blurGain
    );
    const shadowOpacity = Math.min(
      1,
      userShadow * (0.8 + 0.4 * sizeFactor) * calibration.shadow.opacityGain
    );

    const radiusPx = typeof options.radius === 'number' ? `${options.radius}px` : '40px';
    const requestedCoverage = options.refractionCoverage || 'rim';
    const isCompactSurface = width <= 180 || height <= 70;

    return {
      bodyBlur,
      saturation:
        typeof userSaturation === 'number' ? userSaturation * calibration.body.saturationGain : 1.3,
      perceivedThickness,
      physicalAmplitude: effectiveAmp,
      lensingGain,
      tintRgb: hexToRgb(tintColor),
      tintOpacity: effectiveOpacity,
      shadowBlur,
      shadowSpread,
      shadowOpacity,
      shadowColor,
      specular: userSpecular,
      specularGain,
      dispersionGain,
      samplingMargin,
      ambientLuma,
      radiusPx,
      debug: debugMode,
      calibration,
      borderMode: options.borderMode || 'directional',
      colorBleed: typeof options.colorBleed === 'number' ? options.colorBleed : 0.6,
      // Small buttons and pills need a continuous liquid body. Larger cards
      // keep refraction localized to their soft edge/bezel region.
      refractionCoverage: isCompactSurface ? 'full' : requestedCoverage,
    };
  }
}
