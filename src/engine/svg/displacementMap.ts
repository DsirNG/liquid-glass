import type { SurfaceShape } from '../../types';

export const DEFAULT_DISPLACEMENT_MAP_URL =
  'data:image/jpeg;base64,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iomgGgkoxZGgxZFQFQlYnQHRdPfj/10KCSCKESCNiVkViPSLpD0h6I0Q0I0A2IoBWBIJIBKBIJoJIJ2R2J0JWBUJ0JUB0XTv479dFZDYiglYigkhEgjZFQjRFQjRFQjQigFYigHYigmgEgmglYlYnQlQlYlQHQlQnQ9P/kf1yVkNiNCNkNiVENiNiViNEViNkVCVgKCViViViSCViSCVgdCViVCViVCdgVCVCdD1D+U/XBWQ2I0I2Q2JUQ2I0JWQ0I2JUQ2JUI2JUI2J0JWJWJWA2R0BWJ0I2JUJ2BUJUJ0P//EABkQAQEBAQEBAAAAAAAAAAAAAAECABEDEP/aAAgBAQABAgB1atWrVq1atWrVq1atWrVq1atWrVq1atWrVq+OrVq1atWrVq1atWrVq1atWrVq1atWrVq1atXxVppppppdWrVq1atWrVq1NNNNNNNNNNNPVWmmmmms6tWrVq1atWpppppppppppppp6q0000uc51atWrVq1ammmmmmmmmmmmmt1Vpppc5znVq1atWrVqaaaaaaaaaaaaaeqtNLnOc51atWrVq1ammmmmmmmmmmmmnqrS5znOc6tWrVq16222mmmmmmlVppp6tKuc5znOrVq1a9TbbbbTTTTTSq000qtLnOc5zq1atWrW0222200000qqqtKqrnOc5zq1atTbbbbbbbbTTTSqqqqqq5znOc6tTTTbbbbbbbbTTTSqqqqrlVznOctNNNtttttttttNNNNKqqqrqznKqrTTTTbbbbbbbbbTTTSqqqqrqznOc5aaaabbbbbbbbbaaaaVVVVVdWc5znVq1NNttttttttttNNKqqqqudWc5znVq16tbbbbbbbbbbTTSqqqq5XVnOc6tWrVrb1tttttttttNNKqqqqrWrK5VWmmm2230bbbbbbaaaXOc5zlVa1KuVVppptttt9G22222mmlzlVznK6tWVVWmmmm2222222222mlznOc5znLWppVVWmmm22222229bTWrOc5znOcq1qaaVpWmm222222229erVqznOc5znKtatStK0rTbTTbbbberXr1as5znOc5aVpppppWlabaabbbb1ta9WrVnOc5znU0rTTTTTTTTTbTTbbbTWvVq1as5znOdTTStNNNNNNNNNtNNtttN6tWvVq1ZznOrU00rTTTTTTTTTTTTTbTWvVq1atWrOc6tTTTStNNNNNNNNNtNNtNa9WrVq1Z1Z1NNNNNK1q1NNNNNNNNNNNtNatWrVq1atWrU00000rWrVq1atWrVq1alaaa1atWrVq1NNNammmmla1atWrVq1aterVq16tWrVnVqa1NK1qaaaVX/xAAWEAADAAAAAAAAAAAAAAAAAAAhgJD/2gAIAQEAAz8AaExf/8QAGhEBAQEBAQEBAAAAAAAAAAAAAQISEQADEP/aAAgBAgEBAgDx48ePHjx48ePHjx48ePHjx48ePHjx48ePHj86IiIiIiInjx48ePHjx48IiIiIj0oooooooooRERER73ve60UUUUUUVrWiiiiiihERERER73ve97ooooorRWiiiiihKERERER73ve973RRRRWtFFFFFFCIiIiIiPe973ve60UUVrRRRRRRQiIlCIiI973ve973pRRWiiiiiiiiiiiiiiihEe973ve973RRWtFFFFFFFFFFFFFFFFFFa13ve973WitaKKKKKKKKKKKKKKKKKK1rWtd1rutFa1oooooooooooosssooorWta1rWta1rRRRRRRRRZZZZZZZZZWta1rWta1rRRRRRRRRZZZZZZZZZZZZe9a1rWta1rWitaKLLLLLLLLLLLLLLLLL3rWta1rWtFbLLLLLLLLLLLLLLLLLLLL3vWta1rWita1ssssssss+hZZZZZZZZe961rWta0Vre97LLLLLLLLLLLPoWWWWWXrWta1oorWta3ssss+hZZZZ9Cyyyyyyyyiita1orWta1ve9llllllllllllllllFFa0VorWta1ve9llllllllllllllllllFFFaK1rWta1rWiyyyyyyyyyyyyiiiiiiitFFa1rWta1oosoosssssoooosoooorRRRWta1rWta0UUUUUWUUUUUUUUUUUVoooorWta1rWtaKKKKKKmiiiiiiiiiiiiiiitd73ve61oSiiipoqaKKKKKKKKKK0UUUVrve973vREREZoSihEooooorRRRRWtd73ve9EREREREoSiiiiitFllllla73ve9ERERERESiiiiiitH0PoWWWWVrXe96IiIiMoiJRRRRRRWjwlFFllllFFd6IiIiIlCUUUUUUUUUePHjx48ePCIiIiIiIiUUUUUUUUUUUePHjx48ePHjx48ePHjx48IiUUUUUUJRRRX//xAAWEQADAAAAAAAAAAAAAAAAAAABYJD/2gAIAQIBAz8AtEV7/8QAFxEBAQEBAAAAAAAAAAAAAAAAAAECEP/aAAgBAwEBAgCtNNNNNNNNNNNNNNNNNNNNNNNNNNNNNcrTTTTTTTTTTTTTTTTTTTTTTTTTTTTTXKrTTTTTTTU000000000000000000001FVpppppqampqaaaaaaaaaaaaaaaaaaaa5Vaaaaampqampqammmmmmmmmmmlaaaaaaiq0001NTU1NTU1NTTTTTTTTTTSqqtNNNcqtNNSyzU1LNTU1NTTTTTTTTTSqqq001ytNLLLLNTU1NTU1NTbbbTTTTTSqqq001ytNLLLLLNTU1NTU3NttttNNNNNKqq001KrSyyyyyzU1NTU3Nzc02220000qqqqrSqqyyyyyzU1NTU3Nzc3NttttNNNKqqqqqqssssss1NTU3Nzc3NzbbbbTTTSqqqqqqrLLLLLNTU1Nzc3Nzc22220000qqqqqqqqssss1NTU3Nzc3NzbbbbbTTSqqqqqqqqqqzU1NTc3Nzc3Nzbc22000qqqqqqqqqqqtTU3Nzc3Nzc3NtzbTTSqqqqrKqqqqqtNNzc23Nzc3Nzc3NTU1KqqqrKqqqqqtNNNNttzc3Nzc3NzU1NLLLLLKqqqqqqqq0022223Nzc3NzU1NSyyyyyyqqqqqqqrTTbbbbc3Nzc3NTU1LLLLLLKsqqqqqqrTTTTbbbc3Nzc1NTUsssssssqqqqqqrTTTTTbbbTc3NTU1NTUsssssqqqqqqqq0000222023NTU1NTUsssssqqqqqqqq000000003NTU1NTU1LLLLLNKrTSqqqqtNNNNNNtNNTU1NSzUssss00qq0qqqqrTTTTTTTTTU1NTUs1LLLNNNKrTTTSqqq00000000001NTU1LNTU0000qtNNNKqqqtNNNNNNNNTU1NTUs1NNNNNKss1NNNK00qtK0000001NNTU0s000000qq000001NKrStNNNNK1NNNNStNNNNNKqtNNNNNNNK0000000rU0000rTTTTTSq00000rTTTTTTTTTTTTTTTTStNNNNKr/xAAUEQEAAAAAAAAAAAAAAAAAAACg/9oACAEDAQM/AAAf/9k=';

export const SURFACE_FNS: Record<SurfaceShape, (x: number) => number> = {
  convex_squircle: (x: number) => Math.pow(Math.max(0, 1 - Math.pow(1 - x, 4)), 0.25),
  convex_circle: (x: number) => Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x))),
  concave: (x: number) => 1 - Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x))),
  lip: (x: number) => {
    const convex = Math.pow(Math.max(0, 1 - Math.pow(1 - Math.min(x * 2, 1), 4)), 0.25);
    const concave = 1 - Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x))) + 0.1;
    const t = 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
    return convex * (1 - t) + concave * t;
  },
};

/**
 * Calculates Snell's Law refraction displacement profile across bezel cross-section.
 * Pure mathematical raytracing without DOM/Canvas dependencies.
 */
export function calculateRefractionProfile(
  glassThickness: number,
  bezelWidth: number,
  heightFn: (x: number) => number,
  ior: number,
  samples = 128
): Float64Array {
  const eta = 1 / Math.max(1.0001, ior);
  function refract(nx: number, ny: number): [number, number] | null {
    const dot = ny;
    const k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) return null; // Total internal reflection
    const sq = Math.sqrt(k);
    return [-(eta * dot + sq) * nx, eta - (eta * dot + sq) * ny];
  }

  const profile = new Float64Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = i / samples;
    const y = heightFn(x);
    const dx = x < 1 ? 0.0001 : -0.0001;
    const y2 = heightFn(x + dx);
    const deriv = (y2 - y) / dx;
    const mag = Math.sqrt(deriv * deriv + 1);
    const ref = refract(-deriv / mag, -1 / mag);
    if (!ref || Math.abs(ref[1]) < 1e-6) {
      profile[i] = 0;
      continue;
    }
    profile[i] = ref[0] * ((y * bezelWidth + glassThickness) / ref[1]);
  }
  return profile;
}

/**
 * Computes peak optical displacement magnitude from refraction profile.
 */
export function calculateMaxDisplacement(profile: Float64Array): number {
  let max = 0;
  for (let i = 0; i < profile.length; i++) {
    const abs = Math.abs(profile[i]);
    if (abs > max) max = abs;
  }
  return max;
}

/**
 * Constructs a dynamic 9-slice SVG displacement vector field.
 *
 * Slices the pre-baked reference displacement map into:
 * - 4 corners: 1:1 isometric scale, strictly preserving curvature & normal vectors.
 * - 4 edges: stretched strictly along the tangent (horizontal for top/bottom, vertical for left/right).
 * - Center: neutral vector (128, 128, 128) -> exactly 0 displacement.
 *
 * Pure SVG Data URI, zero Canvas, runs anywhere (browser, Node, SSR).
 */
export function buildNineSliceDisplacementMap(
  w: number,
  h: number,
  radius: number,
  bezelWidth: number,
  baseMapUrl = DEFAULT_DISPLACEMENT_MAP_URL
): string {
  const width = Math.max(16, Math.round(w));
  const height = Math.max(16, Math.round(h));
  const S = 256;
  const C_src = 64; // Source corner margin (64x64 out of 256x256)
  const mid_src = S - 2 * C_src; // 128

  // Destination corner dimensions (clamped to at most half the element size)
  const C_dst = Math.max(4, Math.min(Math.round(radius + bezelWidth), Math.floor(width / 2), Math.floor(height / 2)));
  const midW_dst = Math.max(0, width - 2 * C_dst);
  const midH_dst = Math.max(0, height - 2 * C_dst);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="rgb(128,128,128)"/>
  <!-- Top-Left Corner (isometric, no distortion) -->
  <svg x="0" y="0" width="${C_dst}" height="${C_dst}" viewBox="0 0 ${C_src} ${C_src}" preserveAspectRatio="none">
    <image href="${baseMapUrl}" x="0" y="0" width="${S}" height="${S}"/>
  </svg>
  <!-- Top-Right Corner (isometric, no distortion) -->
  <svg x="${width - C_dst}" y="0" width="${C_dst}" height="${C_dst}" viewBox="${S - C_src} 0 ${C_src} ${C_src}" preserveAspectRatio="none">
    <image href="${baseMapUrl}" x="0" y="0" width="${S}" height="${S}"/>
  </svg>
  <!-- Bottom-Left Corner (isometric, no distortion) -->
  <svg x="0" y="${height - C_dst}" width="${C_dst}" height="${C_dst}" viewBox="0 ${S - C_src} ${C_src} ${C_src}" preserveAspectRatio="none">
    <image href="${baseMapUrl}" x="0" y="0" width="${S}" height="${S}"/>
  </svg>
  <!-- Bottom-Right Corner (isometric, no distortion) -->
  <svg x="${width - C_dst}" y="${height - C_dst}" width="${C_dst}" height="${C_dst}" viewBox="${S - C_src} ${S - C_src} ${C_src} ${C_src}" preserveAspectRatio="none">
    <image href="${baseMapUrl}" x="0" y="0" width="${S}" height="${S}"/>
  </svg>
  <!-- Top Edge (tangent horizontal stretch only) -->
  <svg x="${C_dst}" y="0" width="${midW_dst}" height="${C_dst}" viewBox="${C_src} 0 ${mid_src} ${C_src}" preserveAspectRatio="none">
    <image href="${baseMapUrl}" x="0" y="0" width="${S}" height="${S}"/>
  </svg>
  <!-- Bottom Edge (tangent horizontal stretch only) -->
  <svg x="${C_dst}" y="${height - C_dst}" width="${midW_dst}" height="${C_dst}" viewBox="${C_src} ${S - C_src} ${mid_src} ${C_src}" preserveAspectRatio="none">
    <image href="${baseMapUrl}" x="0" y="0" width="${S}" height="${S}"/>
  </svg>
  <!-- Left Edge (tangent vertical stretch only) -->
  <svg x="0" y="${C_dst}" width="${C_dst}" height="${midH_dst}" viewBox="0 ${C_src} ${C_src} ${mid_src}" preserveAspectRatio="none">
    <image href="${baseMapUrl}" x="0" y="0" width="${S}" height="${S}"/>
  </svg>
  <!-- Right Edge (tangent vertical stretch only) -->
  <svg x="${width - C_dst}" y="${C_dst}" width="${C_dst}" height="${midH_dst}" viewBox="${S - C_src} ${C_src} ${C_src} ${mid_src}" preserveAspectRatio="none">
    <image href="${baseMapUrl}" x="0" y="0" width="${S}" height="${S}"/>
  </svg>
  <!-- Center Plateau (100% neutral vector: 128, 128, 128) -->
  <rect x="${C_dst}" y="${C_dst}" width="${midW_dst}" height="${midH_dst}" fill="rgb(128,128,128)"/>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Builds an analytical SVG body mask (white in center plateau, transparent elsewhere).
 */
export function buildBodyMaskUri(w: number, h: number, radius: number, bezel: number): string {
  const width = Math.max(16, Math.round(w));
  const height = Math.max(16, Math.round(h));
  const b = Math.max(2, Math.min(Math.round(bezel), Math.floor(width / 2) - 1, Math.floor(height / 2) - 1));
  const r = Math.max(0, Math.round(radius) - b);
  const bw = Math.max(1, width - 2 * b);
  const bh = Math.max(1, height - 2 * b);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="${b}" y="${b}" width="${bw}" height="${bh}" rx="${r}" fill="#ffffff"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Builds an analytical SVG edge mask (white along refractive bezel, transparent in center plateau).
 */
export function buildEdgeMaskUri(w: number, h: number, radius: number, bezel: number): string {
  const width = Math.max(16, Math.round(w));
  const height = Math.max(16, Math.round(h));
  const b = Math.max(2, Math.min(Math.round(bezel), Math.floor(width / 2) - 1, Math.floor(height / 2) - 1));
  const r = Math.max(0, Math.round(radius) - b);
  const bw = Math.max(1, width - 2 * b);
  const bh = Math.max(1, height - 2 * b);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <mask id="bodyHole">
    <rect width="${width}" height="${height}" fill="#ffffff"/>
    <rect x="${b}" y="${b}" width="${bw}" height="${bh}" rx="${r}" fill="#000000"/>
  </mask>
  <rect width="${width}" height="${height}" rx="${Math.round(radius)}" fill="#ffffff" mask="url(#bodyHole)"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
