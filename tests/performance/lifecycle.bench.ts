import { bench } from 'vitest';
import { runMaterialInstances } from './helpers';

bench('run 100 material create/destroy lifecycle cycles', async () => {
  const result = await runMaterialInstances(100);
  if (result.lingeringRoots !== 0 || result.lingeringLayers !== 0) {
    throw new Error('Lifecycle cleanup contract failed during benchmark.');
  }
});
