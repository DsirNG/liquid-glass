import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('package entry-point boundaries', () => {
  it('keeps Three.js out of the DOM core dependency graph', () => {
    const core = readFileSync(resolve('src/core/index.ts'), 'utf8');
    const engine = readFileSync(resolve('src/engine/index.ts'), 'utf8');
    const domEngine = readFileSync(resolve('src/engine/LiquidGlassEngine.ts'), 'utf8');
    expect(`${core}${engine}${domEngine}`).not.toMatch(/three|webgl/i);
  });

  it('exports WebGL only through explicit package entries', () => {
    const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
    expect(pkg.exports['./webgl']).toBeDefined();
    expect(pkg.exports['./vue-webgl']).toBeDefined();
    expect(pkg.peerDependenciesMeta.three.optional).toBe(true);
  });
});
