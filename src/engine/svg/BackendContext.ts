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

/**
 * The visual state that backend commits may mutate. It is captured immediately
 * before commit so a defensive rollback can restore the last-good frame if an
 * integration boundary throws after partially applying styles.
 */
export interface SvgBackendVisualState {
  elementStyle: string;
  refractionStyle: string;
  tintStyle: string;
  borderScreenStyle: string;
  borderOverlayStyle: string;
  borderScreenClassName: string;
  borderOverlayClassName: string;
}

/** DOM operations kept outside backend lifecycle and transaction ownership. */
export interface SvgBackendContext {
  getViewport(): SvgBackendViewport;
  getActivePhysicalAmplitude(): number;
  captureVisualState(): SvgBackendVisualState;
  restoreVisualState(state: SvgBackendVisualState): void;

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
