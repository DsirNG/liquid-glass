import { describe, expect, it } from 'vitest';
import { runMaterialInstances } from './helpers';

describe('Phase 6E multi-instance contracts', () => {
  it('creates, updates, resizes, and destroys 50 instances without residual layers', async () => {
    const result = await runMaterialInstances(50);

    expect(result.count).toBe(50);
    expect(result.lingeringRoots).toBe(0);
    expect(result.lingeringLayers).toBe(0);
  });
});
