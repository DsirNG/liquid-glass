import { bench } from 'vitest';
import { runMaterialInstances } from './helpers';

bench('create/update/resize/destroy 10 material instances', async () => {
  const result = await runMaterialInstances(10);
  if (result.lingeringRoots !== 0 || result.lingeringLayers !== 0) {
    throw new Error('Multi-instance cleanup contract failed during benchmark.');
  }
});

bench('create/update/resize/destroy 50 material instances', async () => {
  const result = await runMaterialInstances(50);
  if (result.lingeringRoots !== 0 || result.lingeringLayers !== 0) {
    throw new Error('Multi-instance cleanup contract failed during benchmark.');
  }
});
