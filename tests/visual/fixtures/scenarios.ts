import type { LiquidGlassCreateOptions, MaterialPreset } from '../../../src/types';

export type VisualFixtureSceneId =
  | 'pure-dark-button'
  | 'pure-light-button'
  | 'ios-image-card'
  | 'small-pill'
  | 'material-fallback'
  | 'static-fallback';

export type VisualFixtureBackground = 'dark' | 'light' | 'image';
export type VisualFixtureMode = 'full-optical' | 'material' | 'static';

export interface VisualFixtureScene {
  readonly id: VisualFixtureSceneId;
  readonly label: string;
  readonly mode: VisualFixtureMode;
  readonly background: VisualFixtureBackground;
  readonly preset: MaterialPreset;
  readonly width: number;
  readonly height: number;
  readonly options: Readonly<LiquidGlassCreateOptions>;
}

const commonOptions = {
  blur: 2,
  opacity: 0.06,
  thickness: 45,
  ior: 2.2,
  refraction: 1,
  dispersion: 1.5,
  saturation: 1.3,
  tint: '#ffffff',
  radius: 28,
  bezel: 28,
  specular: 0.65,
  shadow: 0.4,
  shadowColor: 'rgba(255, 255, 255, 0.45)',
  surfaceProfile: 'convex_squircle' as const,
  quality: 'high' as const,
  ambientLuma: 0.5,
  shape: 'roundedRect' as const,
  fallbackPolicy: 'auto' as const,
  interactive: false,
  borderMode: 'directional' as const,
  colorBleed: 0.6,
  refractionCoverage: 'rim' as const,
};

export const VISUAL_FIXTURE_SCENARIOS: Readonly<Record<VisualFixtureSceneId, VisualFixtureScene>> =
  Object.freeze({
    'pure-dark-button': {
      id: 'pure-dark-button',
      label: 'Pure / Dark / Button',
      mode: 'full-optical',
      background: 'dark',
      preset: 'pure',
      width: 240,
      height: 72,
      options: Object.freeze({ ...commonOptions, materialPreset: 'pure' }),
    },
    'pure-light-button': {
      id: 'pure-light-button',
      label: 'Pure / Light / Button',
      mode: 'full-optical',
      background: 'light',
      preset: 'pure',
      width: 240,
      height: 72,
      options: Object.freeze({
        ...commonOptions,
        materialPreset: 'pure',
        tint: '#f4f8ff',
        ambientLuma: 0.82,
        shadowColor: 'rgba(40, 60, 100, 0.22)',
      }),
    },
    'ios-image-card': {
      id: 'ios-image-card',
      label: 'iOS / Image / Card',
      mode: 'full-optical',
      background: 'image',
      preset: 'ios',
      width: 360,
      height: 180,
      options: Object.freeze({
        ...commonOptions,
        materialPreset: 'ios',
        radius: 32,
        bezel: 34,
        shape: 'roundedRect',
      }),
    },
    'small-pill': {
      id: 'small-pill',
      label: 'Pure / Dark / Small Pill',
      mode: 'full-optical',
      background: 'dark',
      preset: 'pure',
      width: 180,
      height: 48,
      options: Object.freeze({
        ...commonOptions,
        materialPreset: 'pure',
        radius: 24,
        bezel: 18,
        shape: 'capsule',
        refractionCoverage: 'full',
      }),
    },
    'material-fallback': {
      id: 'material-fallback',
      label: 'Material Fallback',
      mode: 'material',
      background: 'image',
      preset: 'pure',
      width: 320,
      height: 120,
      options: Object.freeze({
        ...commonOptions,
        materialPreset: 'pure',
        capability: 'material',
        blur: 8,
        opacity: 0.1,
        radius: 30,
        bezel: 24,
      }),
    },
    'static-fallback': {
      id: 'static-fallback',
      label: 'Static Fallback',
      mode: 'static',
      background: 'dark',
      preset: 'ios',
      width: 320,
      height: 120,
      options: Object.freeze({
        ...commonOptions,
        materialPreset: 'ios',
        opacity: 0.12,
        radius: 30,
        bezel: 24,
      }),
    },
  });

const DEFAULT_SCENE_ID: VisualFixtureSceneId = 'pure-dark-button';

export function resolveVisualFixtureScene(search: string): VisualFixtureScene {
  const sceneId = new URLSearchParams(search).get('scene') as VisualFixtureSceneId | null;
  return (
    VISUAL_FIXTURE_SCENARIOS[sceneId ?? DEFAULT_SCENE_ID] ??
    VISUAL_FIXTURE_SCENARIOS[DEFAULT_SCENE_ID]
  );
}
