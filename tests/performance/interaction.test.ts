import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLiquidGlass } from '../../src/core';
import { CapabilityProbe } from '../../src/engine';
import { OpticalBackend, OpticalFieldGenerator } from '../../src/engine/svg';
import { createMaterialHost, waitForReady } from './helpers';

function createPointerMove(index: number): Event {
  const event = new Event('pointermove', { bubbles: true });
  Object.defineProperties(event, {
    clientX: { value: 40 + (index % 280) },
    clientY: { value: 20 + (index % 140) },
  });
  return event;
}

afterEach(() => {
  CapabilityProbe.resetForTests();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('Phase 6E interaction fast-path contracts', () => {
  it('handles 1000 pointer moves without field rebuild or backend prepare', async () => {
    const host = createMaterialHost();
    const generateSpy = vi.spyOn(OpticalFieldGenerator, 'generate');
    const prepareSpy = vi.spyOn(OpticalBackend.prototype, 'prepare');
    const instance = createLiquidGlass(host, {
      capability: 'full',
      interactive: true,
    });

    try {
      await waitForReady(instance);
      const generateCountBefore = generateSpy.mock.calls.length;
      const prepareCountBefore = prepareSpy.mock.calls.length;

      for (let index = 0; index < 1000; index += 1) {
        host.dispatchEvent(createPointerMove(index));
      }

      expect(generateSpy.mock.calls.length - generateCountBefore).toBe(0);
      expect(prepareSpy.mock.calls.length - prepareCountBefore).toBe(0);
      expect(instance.status.activeMode).toBe('full-optical');
    } finally {
      instance.destroy();
    }
  });
});
