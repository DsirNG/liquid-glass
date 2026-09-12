import { describe, expect, it } from 'vitest';
import { runResizeTransitionBurst } from './helpers';

describe('Phase 6E resize contracts', () => {
  it('keeps the last-good backend visible until the latest resize commits', async () => {
    const result = await runResizeTransitionBurst(20);

    expect(result.activeBeforeRelease).toBe('initial');
    expect(result.committedCount).toBe(1);
    expect(result.staleCount).toBe(19);
    expect(result.disposedCandidateCount).toBe(19);
    expect(result.disposedBackendCount).toBe(19);
    expect(result.previousActiveDisposed).toBe(true);
    expect(result.activeLabel).toBe('resize-19');
  });
});
