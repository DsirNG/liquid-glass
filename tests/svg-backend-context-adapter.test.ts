import { describe, expect, it } from 'vitest';
import { MaterialResolver } from '../src/engine/svg/MaterialResolver';
import type { OpticalFieldAssets } from '../src/engine/svg/OpticalFieldAssets';
import type { SvgGlassEngine } from '../src/engine/svg/SvgFilterBuilder';
import { SvgBackendContextAdapter } from '../src/engine/svg/SvgBackendContextAdapter';
import { GlassHost, MaterialStyler } from '../src/engine/svg/host';

function createAdapter() {
  const element = document.createElement('div');
  document.body.appendChild(element);
  const host = new GlassHost(element);
  const materialStyler = new MaterialStyler(host);
  const adapter = new SvgBackendContextAdapter(host, materialStyler, () => 12);
  return { element, host, adapter };
}

function createAssets(): OpticalFieldAssets {
  return {
    vectorUrl: 'vector.png',
    basisUrl: 'basis.png',
    fresnelMaskUrl: 'fresnel.png',
    physicalAmplitude: 12,
    width: 300,
    height: 80,
    fieldScale: 1,
    revision: 1,
    dispose: () => undefined,
  };
}

function createOptions(overrides: Record<string, unknown> = {}) {
  const material = MaterialResolver.resolve(
    { blur: 12, saturation: 1.2, ...overrides },
    300,
    80,
    12
  );
  return {
    material,
    viewport: { width: 300, height: 80 },
    userRefraction: 1,
  };
}

describe('SvgBackendContextAdapter', () => {
  it('binds the Fresnel mask and SVG filter for optical commits', () => {
    const { element, host, adapter } = createAdapter();

    adapter.commitOptical(
      { filterId: 'adapter-optical-filter' } as SvgGlassEngine,
      createAssets(),
      createOptions()
    );

    expect(element.style.backdropFilter).toContain('adapter-optical-filter');
    expect(element.style.getPropertyValue('--lg-fresnel-mask-image')).toContain('fresnel.png');
    expect(host.borderScreenLayer.classList.contains('lg-border-geometry')).toBe(true);

    host.destroy();
    element.remove();
  });

  it('clears optical geometry and applies material blur for material commits', () => {
    const { element, host, adapter } = createAdapter();
    const options = createOptions({ blur: 12 });

    adapter.commitOptical(
      { filterId: 'adapter-optical-filter' } as SvgGlassEngine,
      createAssets(),
      options
    );
    adapter.commitMaterial(options);

    expect(element.style.getPropertyValue('--lg-fresnel-mask-image')).toBe('');
    expect(element.style.backdropFilter).toContain('blur(');
    expect(host.refractionLayer.style.opacity).toBe('1');
    expect(host.borderScreenLayer.classList.contains('lg-border-geometry')).toBe(false);

    host.destroy();
    element.remove();
  });

  it('clears backdrop and preserves static fill opacity for static commits', () => {
    const { element, host, adapter } = createAdapter();
    const options = { ...createOptions(), fillOpacity: 0.08 };

    adapter.commitStatic(options);

    expect(element.style.backdropFilter).toBe('');
    expect(host.refractionLayer.style.display).toBe('none');
    expect(element.style.getPropertyValue('--lg-tint-alpha')).toBe('0.08');

    host.destroy();
    element.remove();
  });

  it('forwards exact visual snapshots to GlassHost', () => {
    const { element, host, adapter } = createAdapter();
    const opticalOptions = createOptions();

    adapter.commitOptical(
      { filterId: 'adapter-optical-filter' } as SvgGlassEngine,
      createAssets(),
      opticalOptions
    );
    const snapshot = adapter.captureVisualState();

    adapter.commitStatic({ ...opticalOptions, fillOpacity: 0.08 });
    adapter.restoreVisualState(snapshot);

    expect(element.style.backdropFilter).toContain('adapter-optical-filter');
    expect(element.style.getPropertyValue('--lg-fresnel-mask-image')).toContain('fresnel.png');
    expect(host.refractionLayer.style.display).toBe('');

    host.destroy();
    element.remove();
  });
});
