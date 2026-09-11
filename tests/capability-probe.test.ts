import { describe, expect, it } from 'vitest';
import { normalizeOptions, canonicalizeOptions } from '../src/engine/options';
import { resolveRenderPlan } from '../src/engine/planning';
import {
  CapabilityProbe,
  hasBlockingRestriction,
  type CapabilityReport,
} from '../src/engine/capabilities';

const fullCapabilities = {
  opticalField: true,
  refraction: true,
  dispersion: true,
  backdropBlur: true,
  saturation: true,
  tint: true,
  shadow: true,
  specular: true,
};

describe('CapabilityProbe', () => {
  it('reports runtime facts and caches one immutable report', () => {
    CapabilityProbe.resetForTests();

    const first = CapabilityProbe.probe();
    const second = CapabilityProbe.probe();

    expect(second).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.knownRestrictions)).toBe(true);
    expect(first.svgBackdropDisplacement).toBe(
      first.backdropFilter && first.svgFilter && first.svgDisplacementMap
    );
    expect(hasBlockingRestriction(first)).toBe(first.knownRestrictions.length > 0);

    CapabilityProbe.resetForTests();
    expect(CapabilityProbe.probe()).not.toBe(first);
  });

  it('reports iOS WebKit as a restriction without changing raw feature facts', () => {
    const originalUa = navigator.userAgent;
    const iosUa =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/122.0.6261.89 Mobile/15E148 Safari/604.1';

    try {
      Object.defineProperty(navigator, 'userAgent', {
        value: iosUa,
        configurable: true,
      });
      CapabilityProbe.resetForTests();

      const report = CapabilityProbe.probe();

      expect(report.knownRestrictions).toEqual(['ios-svg-backdrop-displacement']);
      expect(report.svgBackdropDisplacement).toBe(
        report.backdropFilter && report.svgFilter && report.svgDisplacementMap
      );
      expect(hasBlockingRestriction(report)).toBe(true);
    } finally {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUa,
        configurable: true,
      });
      CapabilityProbe.resetForTests();
    }
  });

  it('lets the planner apply policy after consuming probe facts', () => {
    const report: CapabilityReport = Object.freeze({
      backdropFilter: true,
      svgFilter: true,
      svgDisplacementMap: true,
      svgBackdropDisplacement: true,
      cssFilter: true,
      knownRestrictions: Object.freeze(['webkit-svg-backdrop-displacement']),
    });

    const plan = resolveRenderPlan({
      requested: canonicalizeOptions(normalizeOptions()),
      capabilities: fullCapabilities,
      capabilityReport: report,
    });

    expect(plan.targetMode).toBe('material');
    expect(plan.degraded).toBe(true);
  });
});
