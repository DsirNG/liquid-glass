import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLiquidGlass } from '../../src/core';
import { CapabilityProbe } from '../../src/engine';
import { OpticalBackend, OpticalFieldGenerator } from '../../src/engine/svg';
import { createMaterialHost, waitForReady } from './helpers';

const scalarUpdates = [
  (index: number) => ({ tint: index % 2 === 0 ? '#ffffff' : '#dbeafe' }),
  (index: number) => ({ opacity: 0.2 + (index % 80) / 1000 }),
  (index: number) => ({ shadow: 0.2 + (index % 60) / 100 }),
  (index: number) => ({ specular: 0.2 + (index % 50) / 100 }),
  (index: number) => ({ blur: 4 + (index % 20) }),
  (index: number) => ({ refraction: 0.5 + (index % 40) / 100 }),
  (index: number) => ({ dispersion: 0.5 + (index % 40) / 100 }),
] as const;

afterEach(() => {
  CapabilityProbe.resetForTests();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('Phase 6E update impact contracts', () => {
  it('keeps 100 synchronous/filter/material updates off the optical field rebuild path', async () => {
    const host = createMaterialHost();
    const generateSpy = vi.spyOn(OpticalFieldGenerator, 'generate');
    const prepareSpy = vi.spyOn(OpticalBackend.prototype, 'prepare');
    const instance = createLiquidGlass(host, {
      capability: 'full',
      interactive: false,
    });

    try {
      await waitForReady(instance);
      const generateCountBefore = generateSpy.mock.calls.length;
      const prepareCountBefore = prepareSpy.mock.calls.length;

      for (const createUpdate of scalarUpdates) {
        for (let index = 0; index < 100; index += 1) {
          instance.update(createUpdate(index));
        }
      }

      expect(generateSpy.mock.calls.length - generateCountBefore).toBe(0);
      expect(prepareSpy.mock.calls.length - prepareCountBefore).toBe(0);
      expect(instance.status.activeMode).toBe('full-optical');
    } finally {
      instance.destroy();
    }
  });
});
