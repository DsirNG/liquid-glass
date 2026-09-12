import { bench } from 'vitest';
import { runResizeTransitionBurst } from './helpers';

bench('resolve 20 rapid resize candidates', async () => {
  const result = await runResizeTransitionBurst(20);
  if (
    result.activeBeforeRelease !== 'initial' ||
    result.activeLabel !== 'resize-19' ||
    result.staleCount !== 19
  ) {
    throw new Error('Resize candidate contract failed during benchmark.');
  }
});
