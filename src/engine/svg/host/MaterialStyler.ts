import type { ResolvedMaterial } from '../MaterialResolver';
import type { GlassHost } from './GlassHost';

/** Applies shared material variables and specular gradients to a GlassHost. */
export class MaterialStyler {
  private readonly host: GlassHost;

  constructor(host: GlassHost) {
    this.host = host;
  }

  public apply(material: ResolvedMaterial): void {
    const styles = this.host.element.style;

    styles.borderRadius = material.radiusPx;
    styles.setProperty('--lg-tint-rgb', material.tintRgb);
    styles.setProperty('--lg-tint-alpha', String(material.tintOpacity));
    styles.setProperty('--lg-radius', material.radiusPx);
    styles.setProperty('--lg-shadow-blur', `${material.shadowBlur}px`);
    styles.setProperty('--lg-shadow-spread', `${material.shadowSpread}px`);
    styles.setProperty('--lg-shadow-color', material.shadowColor);
    styles.setProperty('--lg-outer-shadow-blur', `${Math.round(material.shadowBlur * 1.3)}px`);
    styles.setProperty('--lg-shadow-opacity', String(material.shadowOpacity));
    styles.setProperty('--lg-press-scale', String(material.calibration.interaction.pressScale));
    styles.setProperty('--lg-fresnel-gain', String(material.calibration.lighting.fresnelGain));

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

    if (material.borderMode === 'adaptive') {
      // Luma-adaptive dual rim: dark environments keep a bright rim while
      // light backgrounds transition toward a cool, precise dark edge.
      const luma = material.ambientLuma;
      const isLight = luma >= 0.6;
      const factor = Math.max(0, Math.min(1, (luma - 0.45) / 0.4));

      const r = Math.round(255 * (1 - factor) + 15 * factor);
      const g = Math.round(255 * (1 - factor) + 23 * factor);
      const b = Math.round(255 * (1 - factor) + 42 * factor);

      const a1 = isLight
        ? (0.28 * effectiveSpecular).toFixed(3)
        : (0.85 * effectiveSpecular).toFixed(3);
      const a2 = isLight
        ? (0.08 * effectiveSpecular).toFixed(3)
        : (0.2 * effectiveSpecular).toFixed(3);
      const a3 = isLight
        ? (0.18 * effectiveSpecular).toFixed(3)
        : (0.55 * effectiveSpecular).toFixed(3);

      const o1 = isLight
        ? (0.35 * effectiveSpecular).toFixed(3)
        : (0.95 * effectiveSpecular).toFixed(3);
      const o2 = (0.05 * effectiveSpecular).toFixed(3);
      const o3 = isLight
        ? (0.24 * effectiveSpecular).toFixed(3)
        : (0.4 * effectiveSpecular).toFixed(3);

      const screenStops = [
        `rgba(${r},${g},${b},${a1})`,
        `rgba(${r},${g},${b},${a2})`,
        `rgba(${r},${g},${b},${a3})`,
      ];
      const overlayStops = [
        `rgba(${r},${g},${b},${o1})`,
        `rgba(${r},${g},${b},${o2})`,
        `rgba(${r},${g},${b},${o3})`,
      ];

      this.setGradientVariables(styles, screenStops, overlayStops);
      styles.setProperty(
        '--lg-border-screen-bg',
        `linear-gradient(135deg, ${screenStops[0]} 0%, ${screenStops[1]} 50%, ${screenStops[2]} 100%)`
      );
      styles.setProperty(
        '--lg-border-overlay-bg',
        `linear-gradient(135deg, ${overlayStops[0]} 0%, ${overlayStops[1]} 60%, ${overlayStops[2]} 100%)`
      );
      return;
    }

    // Directional contrast rim: a bright leading edge and a restrained dark
    // trailing edge give the material a stable physical silhouette.
    const s1 = (0.92 * effectiveSpecular).toFixed(3);
    const s2 = (0.15 * effectiveSpecular).toFixed(3);
    const s3 = (0.18 * effectiveSpecular).toFixed(3);
    const o1 = (0.95 * effectiveSpecular).toFixed(3);
    const o2 = (0.05 * effectiveSpecular).toFixed(3);
    const o3 = (0.24 * effectiveSpecular).toFixed(3);

    const screenStops = [
      `rgba(255,255,255,${s1})`,
      `rgba(255,255,255,${s2})`,
      `rgba(15,23,42,${s3})`,
    ];
    const overlayStops = [
      `rgba(255,255,255,${o1})`,
      `rgba(255,255,255,${o2})`,
      `rgba(15,23,42,${o3})`,
    ];

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
