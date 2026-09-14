import { describe, expect, it } from 'vitest';
import { MaterialResolver } from '../src/engine/svg/MaterialResolver';
import { SvgFilterBuilder, SvgGlassEngine } from '../src/engine/svg/SvgFilterBuilder';

function parseFilterGraph(graph: string): SVGFilterElement {
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.innerHTML = graph;
  return filter;
}

describe('Phase 8D-1 adaptive boundary ownership', () => {
  it('wires adaptive visibility after refraction and before body recombination', () => {
    const material = MaterialResolver.resolve({ borderMode: 'adaptive' }, 300, 120);
    const filter = parseFilterGraph(SvgFilterBuilder.build(material));
    const nodes = Array.from(filter.children);
    const bevelIndex = nodes.findIndex((node) => node.getAttribute('result') === 'BEVEL_REFRACTED');
    const adaptiveIndex = nodes.findIndex(
      (node) => node.getAttribute('result') === 'ADAPTIVE_COVERAGE_RESPONSE'
    );
    const boundaryIndex = nodes.findIndex(
      (node) => node.getAttribute('result') === 'BOUNDARY_AWARE_REFRACTED'
    );
    const opticalIndex = nodes.findIndex(
      (node) => node.getAttribute('result') === 'OPTICAL_COMBINED'
    );

    expect(filter.querySelector('feMorphology')).not.toBeNull();
    expect(bevelIndex).toBeGreaterThanOrEqual(0);
    expect(adaptiveIndex).toBeGreaterThan(bevelIndex);
    expect(boundaryIndex).toBeGreaterThan(adaptiveIndex);
    expect(opticalIndex).toBeGreaterThan(boundaryIndex);

    const opticalComposite = filter.querySelector('[result="OPTICAL_COMBINED"]');
    expect(opticalComposite?.getAttribute('in')).toBe('BOUNDARY_AWARE_REFRACTED');
    expect(opticalComposite?.getAttribute('in2')).toBe('BODY_CLEAN');
  });

  it('keeps adaptive nodes out of BODY_MASK and leaves directional output unchanged', () => {
    const adaptiveGraph = SvgFilterBuilder.build(
      MaterialResolver.resolve({ borderMode: 'adaptive' }, 300, 120)
    );
    const directionalGraph = SvgFilterBuilder.build(
      MaterialResolver.resolve({ borderMode: 'directional' }, 300, 120)
    );
    const adaptiveFilter = parseFilterGraph(adaptiveGraph);

    expect(adaptiveFilter.querySelector('[result="BODY_MASK"]')).not.toBeNull();
    expect(adaptiveFilter.querySelector('[result="BODY_CLEAN"]')).not.toBeNull();
    adaptiveFilter.querySelectorAll('[result^="ADAPTIVE_"]').forEach((node) => {
      expect(node.getAttribute('in')).not.toBe('BODY_MASK');
      expect(node.getAttribute('in2')).not.toBe('BODY_MASK');
    });
    expect(directionalGraph).not.toContain('ADAPTIVE_LUMA');
    expect(directionalGraph).not.toContain('BOUNDARY_AWARE_REFRACTED');
  });

  it('rebuilds only the filter graph when border ownership changes', () => {
    const engine = new SvgGlassEngine('adaptive-ownership-test');
    const directional = MaterialResolver.resolve({ borderMode: 'directional' }, 300, 120);
    const adaptive = MaterialResolver.resolve({ borderMode: 'adaptive' }, 300, 120);

    engine.update(directional);
    const filter = document.getElementById(engine.filterId);
    expect(filter).not.toBeNull();
    expect(filter?.innerHTML).not.toContain('ADAPTIVE_LUMA');

    engine.update(adaptive);
    expect(filter?.innerHTML).toContain('ADAPTIVE_LUMA');
    expect(filter?.innerHTML).toContain('BOUNDARY_AWARE_REFRACTED');

    engine.destroy();
  });
});
