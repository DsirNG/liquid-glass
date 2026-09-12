import { describe, expect, it } from 'vitest';
import { runStaleTransitionBurst } from './helpers';

describe('Phase 6E stale candidate contracts', () => {
  it('commits only the latest of 20 rapid field transitions', async () => {
    const result = await runStaleTransitionBurst(20);

    expect(result.committedCount).toBe(1);
    expect(result.staleCount).toBe(19);
    expect(result.disposedCandidateCount).toBe(19);
    expect(result.disposedBackendCount).toBe(19);
    expect(result.activeLabel).toBe('candidate-19');
  });
});
