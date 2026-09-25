import { describe, expect, it } from 'vitest';
import { MaterialResolver } from '../src/engine/svg/MaterialResolver';
import { SvgFilterBuilder, SvgGlassEngine } from '../src/engine/svg/SvgFilterBuilder';
import { GlassHost } from '../src/engine/svg/host';

function parseGraph(options: Parameters<typeof MaterialResolver.resolve>[0]) {
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.innerHTML = SvgFilterBuilder.build(MaterialResolver.resolve(options, 120, 40));
  return filter;
}

describe('Glass transmission and boundary regression', () => {
  it('never turns an adaptive boundary into a luminance frame over the image', () => {
    const filter = parseGraph({ borderMode: 'adaptive' });
    expect(filter.querySelector('feMorphology')).toBeNull();
    expect(filter.querySelector('[result="ADAPTIVE_COVERAGE_RESPONSE"]')).toBeNull();
    expect(filter.querySelector('[result="FINAL_GLASS"]')?.getAttribute('in')).toBe(
      'RGB_COMBINED'
    );
  });

  it.each(['rim', 'full'] as const)(
    'scatters all refraction channels in %s mode',
    (refractionCoverage) => {
      const filter = parseGraph({ blur: 12, colorBleed: 0, refractionCoverage });
      expect(
        Number(filter.querySelector('[result="BODY_BLURRED"]')?.getAttribute('stdDeviation'))
      ).toBeGreaterThan(0);
      expect(filter.querySelector('[result="BODY_MATERIAL"]')?.getAttribute('in')).toBe(
        'BODY_BLURRED'
      );
      expect(filter.querySelector('[result="SOURCE_BLEED"]')?.getAttribute('in')).toBe(
        'BODY_MATERIAL'
      );
      expect(filter.querySelector('[result="EDGE_BLEED"]')?.getAttribute('in2')).toBe('EDGE_MASK');
      expect(filter.querySelector('[result="CLEAR_BODY"]')?.getAttribute('operator')).toBe('out');
      expect(filter.querySelector('[result="CHROMATIC_SOURCE"]')?.getAttribute('in2')).toBe(
        'CLEAR_BODY'
      );
      for (const map of filter.querySelectorAll('feDisplacementMap')) {
        expect(map.getAttribute('in')).toBe('CHROMATIC_SOURCE');
      }
    }
  );

  it('blends full-color samples with weights summing to one', () => {
    const filter = parseGraph({ refractionCoverage: 'rim' });
    for (const result of ['RG_COMBINED', 'RGB_COMBINED']) {
      const composite = filter.querySelector(`[result="${result}"]`);
      expect(composite?.getAttribute('operator')).toBe('arithmetic');
      expect(Number(composite?.getAttribute('k2')) + Number(composite?.getAttribute('k3'))).toBe(1);
    }
    expect(filter.querySelector('[result="RED_CHANNEL"]')).toBeNull();
  });

  it('honors an explicitly requested rim on compact controls', () => {
    for (const [width, height] of [
      [100, 40],
      [320, 64],
      [400, 240],
    ]) {
      expect(
        MaterialResolver.resolve({ refractionCoverage: 'rim' }, width, height).refractionCoverage
      ).toBe('rim');
    }
  });

  it('updates blur continuously without replacing the graph or its assets', () => {
    const engine = new SvgGlassEngine('blur-regression');
    engine.update(MaterialResolver.resolve({ blur: 0, refractionCoverage: 'full' }, 120, 40));
    const filter = document.getElementById(engine.filterId)!;
    const firstImage = filter.querySelector('feImage');
    const blur = filter.querySelector('[result="BODY_BLURRED"]');
    engine.update(MaterialResolver.resolve({ blur: 16, refractionCoverage: 'full' }, 120, 40));
    expect(filter.querySelector('feImage')).toBe(firstImage);
    expect(filter.querySelector('[result="BODY_BLURRED"]')).toBe(blur);
    expect(Number(blur?.getAttribute('stdDeviation'))).toBeGreaterThan(0);
    engine.destroy();
  });

  it('filters one backdrop layer and preserves consumer foreground/background styles', () => {
    const element = document.createElement('div');
    element.style.backgroundColor = 'red';
    element.style.filter = 'contrast(110%)';
    const host = new GlassHost(element);
    host.applyOpticalBackdrop('url(#glass)', 150);
    expect(element.style.filter).toBe('contrast(110%)');
    expect(element.style.backgroundColor).toBe('red');
    expect(element.style.backdropFilter).toBe('');
    expect(host.refractionLayer.style.backdropFilter).toContain('saturate(150%)');
    host.applyMaterialBackdrop('blur(8px)', 120);
    expect(host.refractionLayer.style.backdropFilter).toContain('blur(8px)');
    expect(element.style.backdropFilter).toBe('');
    host.destroy();
  });
});
