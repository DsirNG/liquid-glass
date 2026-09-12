import { bench } from 'vitest';
import { resolveUpdateImpact } from '../../src/engine';

bench('classify 700 scalar/filter/material updates', () => {
  for (let index = 0; index < 100; index += 1) {
    resolveUpdateImpact({ tint: index % 2 === 0 ? '#ffffff' : '#dbeafe' });
    resolveUpdateImpact({ opacity: 0.2 + (index % 80) / 1000 });
    resolveUpdateImpact({ shadow: 0.2 + (index % 60) / 100 });
    resolveUpdateImpact({ specular: 0.2 + (index % 50) / 100 });
    resolveUpdateImpact({ blur: 4 + (index % 20) });
    resolveUpdateImpact({ refraction: 0.5 + (index % 40) / 100 });
    resolveUpdateImpact({ dispersion: 0.5 + (index % 40) / 100 });
  }
});
