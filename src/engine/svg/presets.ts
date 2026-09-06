export interface CalibrationPreset {
  geometry: {
    outerEnd: number;
    bodyStart: number;
  };
  optics: {
    lensingGain: number;
    refractionGain: number;
    dispersionGain: number;
  };
  body: {
    blurGain: number;
    saturationGain: number;
    tintGain: number;
  };
  lighting: {
    fresnelGain: number;
    specularGain: number;
  };
  interaction: {
    hoverResponse: number;
    pressScale: number;
    springStiffness: number;
  };
  shadow: {
    blurGain: number;
    opacityGain: number;
  };
}

/**
 * Standard perceptual tuning preset for iOS Liquid Glass (WWDC25).
 * Calibrated against real iOS material behavior:
 * - Crisp outer boundary definition with high-luminance Fresnel rim.
 * - Progressive lensing curvature along inner bevel.
 * - Very clean body center transmission with selective mild scattering.
 * - Subtle perceptual chromatic separation (not harsh rainbow gaming prism).
 */
export const IOS_MATERIAL_PRESET: CalibrationPreset = Object.freeze({
  geometry: {
    outerEnd: 0.18,
    bodyStart: 0.72,
  },
  optics: {
    lensingGain: 1.0,
    refractionGain: 1.0,
    dispersionGain: 0.12,
  },
  body: {
    blurGain: 1.0,
    saturationGain: 1.0,
    tintGain: 1.0,
  },

  lighting: {
    fresnelGain: 1.0,
    specularGain: 1.0,
  },
  interaction: {
    hoverResponse: 1.0,
    pressScale: 0.98,
    springStiffness: 0.15,
  },
  shadow: {
    blurGain: 1.0,
    opacityGain: 1.0,
  },
});

export const PURE_MATERIAL_PRESET: CalibrationPreset = Object.freeze({
  geometry: {
    outerEnd: 0.15,
    bodyStart: 0.8,
  },
  optics: {
    lensingGain: 1.0,
    refractionGain: 1.0,
    dispersionGain: 0.2,
  },
  body: {
    blurGain: 1.0,
    saturationGain: 1.0,
    tintGain: 1.0,
  },
  lighting: {
    fresnelGain: 1.0,
    specularGain: 1.0,
  },
  interaction: {
    hoverResponse: 1.0,
    pressScale: 1.0,
    springStiffness: 0.2,
  },
  shadow: {
    blurGain: 1.0,
    opacityGain: 1.0,
  },
});
