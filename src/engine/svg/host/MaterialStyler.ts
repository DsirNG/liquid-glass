import type { ResolvedMaterial } from '../MaterialResolver';
import type { GlassHost } from './GlassHost';

export interface MaterialStyleOverrides {
  tintOpacity?: number;
}

function readSolidBackdropLuma(element: HTMLElement): number | null {
  if (typeof getComputedStyle !== 'function') return null;
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const color = getComputedStyle(parent).backgroundColor;
    const match = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,/\s]+([\d.]+))?\s*\)$/.exec(color);
    if (!match || (match[4] !== undefined && Number(match[4]) < 0.98)) continue;
    const [, red, green, blue] = match;
    const linear = [red, green, blue].map((channel) => {
      const value = Number(channel) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }
  return null;
}

/** Applies shared material variables and specular gradients to a GlassHost. */
export class MaterialStyler {
  private readonly host: GlassHost;

  constructor(host: GlassHost) {
    this.host = host;
  }

  public apply(material: ResolvedMaterial, overrides?: MaterialStyleOverrides): void {
    const styles = this.host.element.style;
    const tintOpacity = overrides?.tintOpacity ?? material.tintOpacity;

    styles.borderRadius = material.radiusPx;
    styles.setProperty('--lg-tint-rgb', material.tintRgb);
    styles.setProperty('--lg-tint-alpha', String(tintOpacity));
    styles.setProperty('--lg-radius', material.radiusPx);
    styles.setProperty('--lg-shadow-blur', `${material.shadowBlur}px`);
    styles.setProperty('--lg-shadow-spread', `${material.shadowSpread}px`);
    styles.setProperty('--lg-shadow-color', material.shadowColor);
    styles.setProperty('--lg-outer-shadow-blur', `${Math.round(material.shadowBlur * 1.3)}px`);
    styles.setProperty('--lg-shadow-opacity', String(material.shadowOpacity));
    styles.setProperty('--lg-press-scale', String(material.calibration.interaction.pressScale));
    styles.setProperty('--lg-fresnel-gain', String(material.calibration.lighting.fresnelGain));
    styles.setProperty(
      '--lg-specular-strength',
      String(Math.min(1, material.specular * material.specularGain))
    );

    const isDebugChannel = material.debug !== 'none' && material.debug !== 'final';
    this.host.tintLayer.style.display = isDebugChannel ? 'none' : '';
    this.updateSpecular(material);
  }

  public updateSpecular(material: ResolvedMaterial): void {
    const specular = material.specular;
    if (specular <= 0) {
      this.host.borderScreenLayer.style.display = 'none';
      this.host.borderOverlayLayer.style.display = 'none';
      return;
    }

    this.host.borderScreenLayer.style.display = '';
    this.host.borderOverlayLayer.style.display = '';

    const gain = material.specularGain;
    const effectiveSpecular = Math.min(1, specular * gain);
    const styles = this.host.element.style;

    // Both light and dark reflections exist simultaneously, including on flat
    // black/white backgrounds. Ambient luminance only changes their balance.
    const luma =
      material.borderMode === 'adaptive'
        ? material.ambientLuma === 0.5
          ? (readSolidBackdropLuma(this.host.element) ?? material.ambientLuma)
          : material.ambientLuma
        : 0.45;
    const bright = effectiveSpecular * (0.62 - luma * 0.18);
    const dark = effectiveSpecular * (0.16 + luma * 0.18);
    const screenStops = [
      `rgba(255,255,255,${bright.toFixed(3)})`,
      'rgba(255,255,255,0)',
      `rgba(255,255,255,${(bright * 0.65).toFixed(3)})`,
    ];
    const overlayStops = ['rgba(0,0,0,0)', `rgba(0,0,0,${dark.toFixed(3)})`, 'rgba(0,0,0,0)'];

    this.setGradientVariables(styles, screenStops, overlayStops);
    styles.setProperty(
      '--lg-border-screen-bg',
      `linear-gradient(135deg, ${screenStops[0]} 0%, ${screenStops[1]} 50%, ${screenStops[2]} 100%)`
    );
    styles.setProperty(
      '--lg-border-overlay-bg',
      `linear-gradient(135deg, ${overlayStops[0]} 0%, ${overlayStops[1]} 60%, ${overlayStops[2]} 100%)`
    );
  }

  private setGradientVariables(
    styles: CSSStyleDeclaration,
    screenStops: readonly string[],
    overlayStops: readonly string[]
  ): void {
    styles.setProperty('--lg-border-screen-stop-1', screenStops[0]);
    styles.setProperty('--lg-border-screen-stop-2', screenStops[1]);
    styles.setProperty('--lg-border-screen-stop-3', screenStops[2]);
    styles.setProperty('--lg-border-overlay-stop-1', overlayStops[0]);
    styles.setProperty('--lg-border-overlay-stop-2', overlayStops[1]);
    styles.setProperty('--lg-border-overlay-stop-3', overlayStops[2]);
  }
}
