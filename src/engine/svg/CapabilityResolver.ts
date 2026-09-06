export type OpticalCapability = 'full' | 'material';

export interface CapabilityOptions {
  override?: 'auto' | 'full' | 'material';
}

/**
 * Determines whether the current browser runtime supports full SVG backdrop displacement
 * or requires the Live Material fallback.
 *
 * - Chromium / Edge: Full Optical Reference (live backdrop + SVG feDisplacementMap + dynamic field)
 * - Firefox: Capability controlled Full Optical
 * - WebKit / Safari: Live Material Fallback (live backdrop blur + tint + shadow + specular; no displacement)
 */
export class CapabilityResolver {
  public static resolve(options?: CapabilityOptions): OpticalCapability {
    if (options?.override && options.override !== 'auto') {
      return options.override;
    }

    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'material'; // Safe fallback in SSR
    }

    const ua = navigator.userAgent;

    // Detect iOS devices (iPhone, iPad, iPod, or iPadOS desktop UA)
    const isIOS =
      /iPhone|iPad|iPod/i.test(ua) ||
      (typeof navigator.platform === 'string' &&
        navigator.platform === 'MacIntel' &&
        (navigator.maxTouchPoints ?? 0) > 1);

    if (isIOS) {
      // All iOS browsers use WebKit and suffer from WebKit Bug 245510
      return 'material';
    }

    // Detect WebKit / Safari (excluding Chromium-based browsers like Chrome, Edge, Brave, Opera)
    const isWebKit = /AppleWebKit/i.test(ua);
    const isChrome = /Chrome|CriOS|Edg|OPR/i.test(ua);
    const isSafari = isWebKit && !isChrome && /Safari/i.test(ua);

    if (isSafari) {
      // Due to WebKit Bug 245510, backdrop-filter: url(#svg-filter) does not apply feDisplacementMap
      return 'material';
    }

    // Check basic CSS backdrop-filter support
    if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
      const supportsBackdrop =
        CSS.supports('backdrop-filter', 'blur(1px)') ||
        CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
      if (!supportsBackdrop) {
        return 'material';
      }
    }

    return 'full';
  }
}
