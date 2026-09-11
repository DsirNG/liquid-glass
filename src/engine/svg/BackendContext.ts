import type { OpticalFieldAssets } from './OpticalFieldAssets';
import type { ResolvedMaterial } from './MaterialResolver';
import type { SvgGlassEngine } from './SvgFilterBuilder';

export interface SvgBackendViewport {
  width: number;
  height: number;
}

export interface SvgBackendSyncOptions {
  material: ResolvedMaterial;
  viewport: SvgBackendViewport;
  userRefraction: number;
  /** StaticBackend can override the resolved tint opacity without optical work. */
  fillOpacity?: number;
}

/** DOM operations kept outside backend lifecycle and transaction ownership. */
export interface SvgBackendContext {
  getViewport(): SvgBackendViewport;
  getActivePhysicalAmplitude(): number;

  commitOptical(
    engine: SvgGlassEngine,
    assets: OpticalFieldAssets,
    options: SvgBackendSyncOptions
  ): void;
  syncOptical(
    engine: SvgGlassEngine,
    assets: OpticalFieldAssets,
    options: SvgBackendSyncOptions
  ): void;
  commitMaterial(options: SvgBackendSyncOptions): void;
  syncMaterial(options: SvgBackendSyncOptions): void;
  commitStatic(options: SvgBackendSyncOptions): void;
  syncStatic(options: SvgBackendSyncOptions): void;
}
