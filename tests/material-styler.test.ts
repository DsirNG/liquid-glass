import { describe, expect, it } from 'vitest';
import { MaterialResolver } from '../src/engine/svg/MaterialResolver';
import { GlassHost, MaterialStyler } from '../src/engine/svg/host';

function createStyler() {
  const element = document.createElement('div');
  document.body.appendChild(element);
  const host = new GlassHost(element);
  return { element, host, styler: new MaterialStyler(host) };
}

describe('MaterialStyler', () => {
  it('writes directional contrast rim variables from resolved material', () => {
    const { element, host, styler } = createStyler();

    styler.apply(
      MaterialResolver.resolve(
        { borderMode: 'directional', specular: 0.8, ambientLuma: 0.2 },
        300,
        200
      )
    );

    expect(element.style.getPropertyValue('--lg-border-screen-stop-1')).toMatch(
      /^rgba\(255,255,255,/
    );
    expect(element.style.getPropertyValue('--lg-border-overlay-stop-2')).toMatch(/^rgba\(0,0,0,/);
    expect(element.style.getPropertyValue('--lg-border-screen-bg')).toContain('linear-gradient');

    host.destroy();
    element.remove();
  });

  it('writes luma-adaptive rim variables from material.ambientLuma', () => {
    const { element, host, styler } = createStyler();

    styler.apply(
      MaterialResolver.resolve(
        { borderMode: 'adaptive', specular: 0.8, ambientLuma: 0.8 },
        300,
        200
      )
    );

    expect(element.style.getPropertyValue('--lg-border-screen-stop-1')).toMatch(
      /^rgba\(255,255,255,/
    );
    expect(element.style.getPropertyValue('--lg-border-overlay-bg')).toContain('linear-gradient');

    host.destroy();
    element.remove();
  });
});
