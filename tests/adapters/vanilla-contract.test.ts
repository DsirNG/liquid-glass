import { afterEach, describe, expect, it } from 'vitest';
import { createLiquidGlass } from '../../src/core';
import type { LiquidGlassStatus } from '../../src/core';

const hosts: HTMLElement[] = [];

function createHost(): HTMLDivElement {
  const host = document.createElement('div');
  document.body.appendChild(host);
  hosts.push(host);
  return host;
}

afterEach(() => {
  hosts.splice(0).forEach((host) => host.remove());
});

describe('Vanilla consumer contract', () => {
  it('uses only the source public entry and exposes the complete lifecycle', () => {
    const host = createHost();
    const glass = createLiquidGlass(host, {
      materialPreset: 'pure',
      fallbackPolicy: 'preserve',
      capability: 'material',
    });

    const status: Readonly<LiquidGlassStatus> = glass.status;
    expect(status.targetMode).toBe('material');
    expect(glass.isDestroyed).toBe(false);

    expect(() => glass.update({ refraction: 0.8, capability: 'material' })).not.toThrow();
    expect(() => glass.resize()).not.toThrow();

    glass.destroy();
    expect(glass.isDestroyed).toBe(true);
    expect(() => glass.destroy()).not.toThrow();
    expect(() => glass.update({ blur: 4 })).toThrowError(/destroyed/);

    void status;
  });
});
