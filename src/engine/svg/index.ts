export { SvgGlassEngine, SvgFilterBuilder } from './SvgFilterBuilder';
export {
  SvgRendererWrapper,
  OPTICAL_FIELD_DIMENSIONS,
  resolveOpticalFieldDimension,
} from './SvgRendererWrapper';
export { OpticalFieldGenerator, evaluatePartitionOfUnityBasis } from './OpticalFieldGenerator';

export type { OpticalFieldParams } from './OpticalFieldGenerator';
export type { OpticalFieldAssets } from './OpticalFieldAssets';
export { ManagedOpticalFieldAssets } from './OpticalFieldAssets';
export { CapabilityResolver } from './CapabilityResolver';
export type { OpticalCapability, CapabilityOptions } from './CapabilityResolver';
export { MaterialResolver, resolveGlassSizeFactor } from './MaterialResolver';
export type { ResolvedMaterial, MaterialPreset } from './MaterialResolver';
export { IOS_MATERIAL_PRESET, PURE_MATERIAL_PRESET } from './presets';
export type { CalibrationPreset } from './presets';
export { InteractionController } from './InteractionController';
export { MaterialBackend } from './MaterialBackend';
export { OpticalBackend } from './OpticalBackend';
export { StaticBackend } from './StaticBackend';
export { GlassHost } from './host';
export type { GlassHostResizeHandler } from './host';
export type {
  SvgBackendContext,
  SvgBackendSyncOptions,
  SvgBackendVisualState,
  SvgBackendViewport,
} from './BackendContext';

export type { GlassInteractionState, InteractionControllerOptions } from './InteractionController';

// Geometry & Profiles
export {
  evaluateFootprintSdf,
  calculateCoverage,
  roundedRectSdf,
  capsuleSdf,
  circleSdf,
} from './geometry/sdf';
export type { FootprintGeometry, FootprintShape } from './geometry/sdf';
export { evaluateFootprintNormal } from './geometry/normals';
export type { Vec2 } from './geometry/normals';
export {
  calculateRefractionProfile,
  calculateMaxAbsRefraction,
  sampleRefractionProfile,
  SURFACE_PROFILES,
  SURFACE_FNS,
} from './geometry/surfaceProfiles';
export type { SurfaceProfile } from './geometry/surfaceProfiles';

// Legacy references kept for backward compatibility
export {
  LEGACY_REFERENCE_DISPLACEMENT_MAP,
  DEFAULT_DISPLACEMENT_MAP_URL,
  buildNineSliceDisplacementMap,
  buildBodyMaskUri,
  buildEdgeMaskUri,
} from './legacy/displacementMap';
