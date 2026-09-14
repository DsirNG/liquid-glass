import { describe, expect, it } from 'vitest';
import { MaterialResolver } from '../src/engine/svg/MaterialResolver';
import { SvgFilterBuilder } from '../src/engine/svg/SvgFilterBuilder';

function parseFilterGraph(graph: string): SVGFilterElement {
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.innerHTML = graph;
  return filter;
}

describe('Phase 8D-0A adaptive visibility graph feasibility', () => {
  it('expresses luminance, local range, visibility need, polarity, and basis wiring', () => {
    const filter = parseFilterGraph(SvgFilterBuilder.buildAdaptiveVisibilityFeasibilityGraph());

    expect(
      filter.querySelector('feColorMatrix[in="SourceGraphic"][result="ADAPTIVE_LUMA"]')
    ).not.toBeNull();
    expect(filter.querySelectorAll('feMorphology')).toHaveLength(2);
    expect(
      filter.querySelector('feMorphology[operator="dilate"][result="ADAPTIVE_LUMA_MAX"]')
    ).not.toBeNull();
    expect(
      filter.querySelector('feMorphology[operator="erode"][result="ADAPTIVE_LUMA_MIN"]')
    ).not.toBeNull();
    expect(
      filter.querySelector('feBlend[mode="difference"][result="ADAPTIVE_LOCAL_RANGE"]')
    ).not.toBeNull();
    expect(filter.querySelector('feComponentTransfer[in="ADAPTIVE_LOCAL_RANGE"]')).not.toBeNull();
    expect(filter.querySelector('[result="ADAPTIVE_DARK_POLARITY"]')).not.toBeNull();
    expect(filter.querySelector('[result="ADAPTIVE_LIGHT_POLARITY"]')).not.toBeNull();
    expect(
      filter.querySelector('[result="ADAPTIVE_OUTER_RESPONSE"][in2="OUTER_MASK"]')
    ).not.toBeNull();
    expect(
      filter.querySelector('[result="ADAPTIVE_INNER_RESPONSE"][in2="EDGE_MASK"]')
    ).not.toBeNull();
    expect(
      filter.querySelector('[result="ADAPTIVE_COVERAGE_RESPONSE"][in2="COVERAGE_MASK"]')
    ).not.toBeNull();
  });

  it('keeps the candidate response out of the body channel and clamps morphology radius', () => {
    const filter = parseFilterGraph(SvgFilterBuilder.buildAdaptiveVisibilityFeasibilityGraph(100));

    expect(filter.querySelector('[in2="BODY_MASK"]')).toBeNull();
    expect(filter.querySelectorAll('feMorphology[radius="16"]')).toHaveLength(2);

    const minimumRadiusFilter = parseFilterGraph(
      SvgFilterBuilder.buildAdaptiveVisibilityFeasibilityGraph(0)
    );
    expect(minimumRadiusFilter.querySelectorAll('feMorphology[radius="1"]')).toHaveLength(2);
  });

  it('does not change the active production graph before feasibility passes', () => {
    const material = MaterialResolver.resolve({ materialPreset: 'pure' }, 300, 80);
    const activeGraph = SvgFilterBuilder.build(material);

    expect(activeGraph).not.toContain('ADAPTIVE_LUMA');
    expect(activeGraph).not.toContain('feMorphology');
  });

  it('uses only filter-time primitives and does not require an optical field asset', () => {
    const graph = SvgFilterBuilder.buildAdaptiveVisibilityFeasibilityGraph();

    expect(graph).toContain('in="SourceGraphic"');
    expect(graph).toContain('feMorphology');
    expect(graph).toContain('feComponentTransfer');
    expect(graph).not.toContain('feImage');
    expect(graph).not.toContain('requestAnimationFrame');
    expect(graph).not.toContain('canvas');
  });
});
