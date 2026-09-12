import { bench } from 'vitest';
import { runStaleTransitionBurst } from './helpers';

bench('discard 19 stale candidates from 20 rapid transitions', async () => {
  const result = await runStaleTransitionBurst(20);
  if (result.committedCount !== 1 || result.staleCount !== 19) {
    throw new Error('Stale candidate contract failed during benchmark.');
  }
});
