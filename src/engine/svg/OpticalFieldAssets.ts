/**
 * Container holding dynamic optical assets for a specific glass geometry and revision.
 * Manages URL lifecycle and memory disposal for generated PNG Blobs.
 */
export interface OpticalFieldAssets {
  readonly vectorUrl: string;
  readonly basisUrl: string;
  /** Alpha mask for the geometry-defined bevel/Fresnel highlight region. */
  readonly fresnelMaskUrl: string;
  readonly physicalAmplitude: number;
  readonly width: number;
  readonly height: number;
  readonly fieldScale: number;
  readonly revision: number;
  dispose(): void;
}

export class ManagedOpticalFieldAssets implements OpticalFieldAssets {
  public readonly vectorUrl: string;
  public readonly basisUrl: string;
  public readonly fresnelMaskUrl: string;
  public readonly physicalAmplitude: number;
  public readonly width: number;
  public readonly height: number;
  public readonly fieldScale: number;
  public readonly revision: number;

  private isDisposed = false;

  constructor(params: {
    vectorUrl: string;
    basisUrl: string;
    fresnelMaskUrl: string;
    physicalAmplitude: number;
    width: number;
    height: number;
    fieldScale: number;
    revision: number;
  }) {
    this.vectorUrl = params.vectorUrl;
    this.basisUrl = params.basisUrl;
    this.fresnelMaskUrl = params.fresnelMaskUrl;
    this.physicalAmplitude = params.physicalAmplitude;
    this.width = params.width;
    this.height = params.height;
    this.fieldScale = params.fieldScale;
    this.revision = params.revision;
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    if (this.vectorUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(this.vectorUrl);
      } catch {
        // Ignore in non-browser environments
      }
    }
    if (this.basisUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(this.basisUrl);
      } catch {
        // Ignore in non-browser environments
      }
    }
    if (this.fresnelMaskUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(this.fresnelMaskUrl);
      } catch {
        // Ignore in non-browser environments
      }
    }
  }
}
