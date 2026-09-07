import type { FootprintGeometry } from './geometry/sdf';
import { evaluateFootprintSdf, calculateCoverage } from './geometry/sdf';
import { evaluateFootprintNormal } from './geometry/normals';
import type { SurfaceProfile } from './geometry/surfaceProfiles';
import {
  SURFACE_PROFILES,
  calculateRefractionProfile,
  calculateMaxAbsRefraction,
  sampleRefractionProfile,
} from './geometry/surfaceProfiles';
import type { OpticalFieldAssets } from './OpticalFieldAssets';
import { ManagedOpticalFieldAssets } from './OpticalFieldAssets';

export interface BasisConfig {
  outerEnd: number;
  bodyStart: number;
}

export const DEFAULT_BASIS_CONFIG: BasisConfig = {
  outerEnd: 0.18,
  bodyStart: 0.72,
};

export interface OpticalFieldParams {
  geometry: FootprintGeometry;
  bezel: number;
  thickness: number;
  ior: number;
  surfaceProfile?: SurfaceProfile;
  basis?: BasisConfig;
  revision?: number;
  maxFieldDimension?: number;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Analytical partition-of-unity basis calculator satisfying:
 * outer + inner + body == coverage at every coordinate.
 */
export function evaluatePartitionOfUnityBasis(
  inwardDist: number,
  bezel: number,
  coverage: number,
  config: BasisConfig = DEFAULT_BASIS_CONFIG
): { outer: number; inner: number; body: number; coverage: number } {
  if (coverage <= 0.001) {
    return { outer: 0, inner: 0, body: 0, coverage: 0 };
  }
  const effectiveBezel = Math.max(1, bezel);
  const dNorm = Math.max(0, Math.min(1, inwardDist / effectiveBezel));
  const outerEnd = Math.max(0.01, Math.min(0.98, config.outerEnd));
  const bodyStart = Math.max(outerEnd + 0.01, Math.min(0.99, config.bodyStart));

  const outerVal = 1 - smoothstep(0.0, outerEnd, dNorm);
  const bodyVal = smoothstep(bodyStart, 1.0, dNorm);
  const innerVal = Math.max(0, 1 - outerVal - bodyVal);

  return {
    outer: outerVal * coverage,
    inner: innerVal * coverage,
    body: bodyVal * coverage,
    coverage,
  };
}

// 1x1 transparent PNG fallback for non-browser/jsdom environments
const FALLBACK_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function blobToDataUrl(blob: Blob): Promise<string | null> {
  if (typeof FileReader === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

async function canvasToBlobUrl(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<string> {
  if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
    if (typeof canvas.convertToBlob === 'function') {
      try {
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        const dataUrl = await blobToDataUrl(blob);
        if (dataUrl) return dataUrl;
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          return URL.createObjectURL(blob);
        }
      } catch {
        // Continue to fallback
      }
    }
  }

  if (typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement) {
    const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
    if (!isJsdom && typeof canvas.toDataURL === 'function') {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        if (dataUrl && dataUrl.startsWith('data:image/png')) {
          return dataUrl;
        }
      } catch {
        // Continue to blob fallback
      }
    }
    if (
      !isJsdom &&
      typeof canvas.toBlob === 'function' &&
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL === 'function'
    ) {
      try {
        const blobPromise = new Promise<string | null>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 100);
          canvas.toBlob((blob) => {
            clearTimeout(timeout);
            if (blob) {
              try {
                resolve(URL.createObjectURL(blob));
              } catch {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          }, 'image/png');
        });
        const url = await blobPromise;
        if (url) return url;
      } catch {
        // Continue to toDataURL
      }
    }
    if (typeof canvas.toDataURL === 'function') {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        if (dataUrl && dataUrl.startsWith('data:image/png')) {
          return dataUrl;
        }
      } catch {
        // Fallback below
      }
    }
  }

  return FALLBACK_PNG_DATA_URL;
}

class Memory2DContext {
  public canvas: any;
  constructor(canvas: any) {
    this.canvas = canvas;
  }
  createImageData(w: number, h: number): ImageData {
    return {
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4),
      colorSpace: 'srgb',
    };
  }
  putImageData(_imgData: any, _x: number, _y: number) {}
}

function createOffscreenBuffer(
  w: number,
  h: number
): {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | Memory2DContext;
} {
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      const off = new OffscreenCanvas(w, h);
      const ctx = off.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
      if (ctx) return { canvas: off, ctx };
    } catch {
      // Fallback below
    }
  }

  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = c.getContext('2d');
    } catch {
      // jsdom without canvas package
    }
    if (ctx) return { canvas: c, ctx };
    return { canvas: c, ctx: new Memory2DContext(c) };
  }

  // Pure memory fallback
  const mockCanvas: any = { width: w, height: h };
  return { canvas: mockCanvas, ctx: new Memory2DContext(mockCanvas) };
}

/**
 * Mathematical dynamic optical field generator.
 * Computes:
 * 1. Normalized optical vector field (R=dx, G=dy, B=128, A=255)
 * 2. Continuous partition-of-unity basis field (R=outer, G=inner, B=body, A=coverage)
 */
export class OpticalFieldGenerator {
  public static async generate(params: OpticalFieldParams): Promise<OpticalFieldAssets> {
    const { geometry, bezel, thickness, ior } = params;
    const revision = params.revision ?? 0;
    const maxDim = params.maxFieldDimension ?? 512;
    const shape = geometry.shape || 'roundedRect';

    const cssW = Math.max(8, geometry.width);
    const cssH = Math.max(8, geometry.height);

    // Compute field resolution while maintaining CSS geometry coordinate space
    const fieldScale = Math.min(1.0, maxDim / Math.max(cssW, cssH));
    const fieldW = Math.max(4, Math.round(cssW * fieldScale));
    const fieldH = Math.max(4, Math.round(cssH * fieldScale));

    const profileName = params.surfaceProfile || 'convex_squircle';
    const profileFn = SURFACE_PROFILES[profileName] || SURFACE_PROFILES.convex_squircle;
    const isRod = profileName === 'cylindrical_rod';
    const isCapsuleRod = isRod && shape === 'capsule';
    const maxHalfDim = Math.min(cssW, cssH) * 0.5;
    // 区域控制：胶囊管透镜充满截面，而卡片/普通容器严格限定在四周边缘 Bezel 区域，防止折射侵占中心产生对角三角裂区
    const effectiveBezel = Math.max(
      4,
      isCapsuleRod ? maxHalfDim : Math.min(bezel, maxHalfDim * 0.8)
    );

    const profile = calculateRefractionProfile(thickness, effectiveBezel, profileFn, ior);
    const maxAbs = calculateMaxAbsRefraction(profile);

    const vectorBuf = createOffscreenBuffer(fieldW, fieldH);
    const basisBuf = createOffscreenBuffer(fieldW, fieldH);
    const fresnelMaskBuf = createOffscreenBuffer(fieldW, fieldH);

    const vectorImg = vectorBuf.ctx.createImageData(fieldW, fieldH);
    const basisImg = basisBuf.ctx.createImageData(fieldW, fieldH);
    const fresnelMaskImg = fresnelMaskBuf.ctx.createImageData(fieldW, fieldH);
    const vecData = vectorImg.data;
    const basData = basisImg.data;
    const fresnelData = fresnelMaskImg.data;

    const cssGeom = {
      shape,
      width: cssW,
      height: cssH,
      radius: geometry.radius,
    };

    const rimWidthPx = Math.max(1.25, Math.min(3.0, effectiveBezel * 0.06));

    for (let fy = 0; fy < fieldH; fy++) {
      const cssY = (fy + 0.5) / fieldScale;
      for (let fx = 0; fx < fieldW; fx++) {
        const cssX = (fx + 0.5) / fieldScale;

        const sdf = evaluateFootprintSdf(cssX, cssY, cssGeom);
        const coverage = calculateCoverage(sdf, 1.0 / fieldScale);
        const inwardDist = -sdf;

        const idx = (fy * fieldW + fx) * 4;

        if (coverage <= 0.001) {
          // Outside glass
          vecData[idx] = 128;
          vecData[idx + 1] = 128;
          vecData[idx + 2] = 128;
          vecData[idx + 3] = 255;

          basData[idx] = 0;
          basData[idx + 1] = 0;
          basData[idx + 2] = 0;
          basData[idx + 3] = 0;
          fresnelData[idx] = 255;
          fresnelData[idx + 1] = 255;
          fresnelData[idx + 2] = 255;
          fresnelData[idx + 3] = 0;
          continue;
        }

        const basisConfig = params.basis || DEFAULT_BASIS_CONFIG;
        const basis = evaluatePartitionOfUnityBasis(
          inwardDist,
          effectiveBezel,
          coverage,
          basisConfig
        );

        basData[idx] = Math.round(basis.outer * 255);
        basData[idx + 1] = Math.round(basis.inner * 255);
        basData[idx + 2] = Math.round(basis.body * 255);
        basData[idx + 3] = Math.round(basis.coverage * 255);

        // The highlight mask shares the same SDF geometry as refraction, but
        // remains a thin physical rim instead of illuminating the whole bevel.
        // The gradient direction remains a CSS fast path driven by interaction.
        const rim = 1 - smoothstep(0, rimWidthPx, inwardDist);
        const fresnel = rim * coverage;
        fresnelData[idx] = 255;
        fresnelData[idx + 1] = 255;
        fresnelData[idx + 2] = 255;
        fresnelData[idx + 3] = Math.round(fresnel * 255);

        // Vector Field: Deflect along surface normal scaled by continuous profile
        const dNorm = Math.max(0, Math.min(1, inwardDist / effectiveBezel));
        const canRefract = dNorm < 1.0;
        if (canRefract) {
          const normal = evaluateFootprintNormal(cssX, cssY, cssGeom);
          const rawRefractionPx = sampleRefractionProfile(profile, dNorm);

          const maxRenderableShiftPx = isCapsuleRod
            ? Math.max(12, Math.min(45, effectiveBezel * 0.75))
            : Math.max(8, Math.min(28, effectiveBezel * 0.5));
          const boundedRefractionPx = Math.max(
            -maxRenderableShiftPx,
            Math.min(maxRenderableShiftPx, rawRefractionPx)
          );

          // 四周往中间自然渐变平滑归零：外边缘平滑进入，内侧边界（dNorm -> 1.0）使用 Hermite 曲线平滑收口为 0
          const inwardFalloff = isCapsuleRod
            ? 1 - Math.pow(dNorm, 2) * 0.05
            : 1 - smoothstep(0.65, 1.0, dNorm);
          const transmissionGate = smoothstep(0.0, 0.1, coverage) * inwardFalloff;
          const normalizedMag = maxAbs > 0 ? boundedRefractionPx / maxAbs : 0;
          const deflectionWeight = coverage * transmissionGate;
          const normDx = normal.x * normalizedMag * deflectionWeight;
          const normDy = normal.y * normalizedMag * deflectionWeight;

          vecData[idx] = Math.round(128 + Math.max(-1, Math.min(1, normDx)) * 127);
          vecData[idx + 1] = Math.round(128 + Math.max(-1, Math.min(1, normDy)) * 127);
          vecData[idx + 2] = 128;
          vecData[idx + 3] = 255;
        } else {
          vecData[idx] = 128;
          vecData[idx + 1] = 128;
          vecData[idx + 2] = 128;
          vecData[idx + 3] = 255;
        }
      }
    }

    vectorBuf.ctx.putImageData(vectorImg, 0, 0);
    basisBuf.ctx.putImageData(basisImg, 0, 0);
    fresnelMaskBuf.ctx.putImageData(fresnelMaskImg, 0, 0);

    const [vectorUrl, basisUrl, fresnelMaskUrl] = await Promise.all([
      canvasToBlobUrl(vectorBuf.canvas),
      canvasToBlobUrl(basisBuf.canvas),
      canvasToBlobUrl(fresnelMaskBuf.canvas),
    ]);

    return new ManagedOpticalFieldAssets({
      vectorUrl,
      basisUrl,
      fresnelMaskUrl,
      physicalAmplitude: maxAbs,
      width: cssW,
      height: cssH,
      fieldScale,
      revision,
    });
  }
}
