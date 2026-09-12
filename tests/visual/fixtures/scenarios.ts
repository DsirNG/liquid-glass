import type { LiquidGlassCreateOptions, MaterialPreset } from '../../../src/types';
import manifest from '../manifest.json';

export type VisualFixtureSceneId =
  | 'pure-dark-button'
  | 'pure-light-button'
  | 'ios-image-card'
  | 'small-pill'
  | 'material-fallback'
  | 'static-fallback'
  | 'glass-card-default'
  | 'glass-card-rich-content'
  | 'glass-card-interactive'
  | 'glass-card-disabled';

export type VisualFixtureBackground = 'dark' | 'light' | 'image';
export type VisualFixtureMode = 'full-optical' | 'material' | 'static';
export type VisualFixtureComponent = 'liquid-glass' | 'glass-card';
export type VisualFixtureCardVariant = 'default' | 'rich-content' | 'interactive' | 'disabled';

export interface VisualFixtureCardConfig {
  readonly size: 'sm' | 'md' | 'lg';
  readonly variant: VisualFixtureCardVariant;
  readonly interactive: boolean;
  readonly disabled: boolean;
}

export interface VisualFixtureScene {
  readonly id: VisualFixtureSceneId;
  readonly fixtureKey: string;
  readonly component: VisualFixtureComponent;
  readonly label: string;
  readonly mode: VisualFixtureMode;
  readonly background: VisualFixtureBackground;
  readonly preset: MaterialPreset;
  readonly width: number;
  readonly height: number;
  readonly baseline: string;
  readonly options: Readonly<LiquidGlassCreateOptions>;
  readonly card?: VisualFixtureCardConfig;
}

interface VisualFixtureManifestEntry {
  readonly id: VisualFixtureSceneId;
  readonly fixtureKey: string;
  readonly component: VisualFixtureComponent;
  readonly mode: VisualFixtureMode;
  readonly background: VisualFixtureBackground;
  readonly preset: MaterialPreset;
  readonly width: number;
  readonly height: number;
  readonly baseline: string;
}

const fixtureManifest = manifest as VisualFixtureManifestEntry[];
const manifestById = Object.freeze(
  Object.fromEntries(fixtureManifest.map((entry) => [entry.id, entry]))
) as Readonly<Record<VisualFixtureSceneId, VisualFixtureManifestEntry>>;

function sceneMetadata(id: VisualFixtureSceneId): VisualFixtureManifestEntry {
  return manifestById[id];
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
      ...sceneMetadata('pure-dark-button'),
      label: 'Pure / Dark / Button',
      options: Object.freeze({ ...commonOptions, materialPreset: 'pure' }),
    },
    'pure-light-button': {
      ...sceneMetadata('pure-light-button'),
      label: 'Pure / Light / Button',
      options: Object.freeze({
        ...commonOptions,
        materialPreset: 'pure',
        tint: '#f4f8ff',
        ambientLuma: 0.82,
        shadowColor: 'rgba(40, 60, 100, 0.22)',
      }),
    },
    'ios-image-card': {
      ...sceneMetadata('ios-image-card'),
      label: 'iOS / Image / Card',
      options: Object.freeze({
        ...commonOptions,
        materialPreset: 'ios',
        radius: 32,
        bezel: 34,
        shape: 'roundedRect',
      }),
    },
    'small-pill': {
      ...sceneMetadata('small-pill'),
      label: 'Pure / Dark / Small Pill',
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
      ...sceneMetadata('material-fallback'),
      label: 'Material Fallback',
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
      ...sceneMetadata('static-fallback'),
      label: 'Static Fallback',
      options: Object.freeze({
        ...commonOptions,
        materialPreset: 'ios',
        opacity: 0.12,
        radius: 30,
        bezel: 24,
      }),
    },
    'glass-card-default': {
      ...sceneMetadata('glass-card-default'),
      label: 'GlassCard / Default / Pure',
      card: Object.freeze({
        size: 'md',
        variant: 'default',
        interactive: false,
        disabled: false,
      }),
      options: Object.freeze({
        ...commonOptions,
        materialPreset: 'pure',
        radius: 20,
        bezel: 22,
      }),
    },
    'glass-card-rich-content': {
      ...sceneMetadata('glass-card-rich-content'),
      label: 'GlassCard / Rich Content / iOS',
      card: Object.freeze({
        size: 'lg',
        variant: 'rich-content',
        interactive: false,
        disabled: false,
      }),
      options: Object.freeze({
        ...commonOptions,
        materialPreset: 'ios',
        radius: 28,
        bezel: 28,
        tint: '#f4f8ff',
      }),
    },
    'glass-card-interactive': {
      ...sceneMetadata('glass-card-interactive'),
      label: 'GlassCard / Interactive / Pure',
      card: Object.freeze({
        size: 'md',
        variant: 'interactive',
        interactive: true,
        disabled: false,
      }),
      options: Object.freeze({
        ...commonOptions,
        materialPreset: 'pure',
        radius: 20,
        bezel: 22,
      }),
    },
    'glass-card-disabled': {
      ...sceneMetadata('glass-card-disabled'),
      label: 'GlassCard / Disabled / iOS',
      card: Object.freeze({
        size: 'md',
        variant: 'disabled',
        interactive: true,
        disabled: true,
      }),
      options: Object.freeze({
        ...commonOptions,
        materialPreset: 'ios',
        radius: 20,
        bezel: 22,
        opacity: 0.12,
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
