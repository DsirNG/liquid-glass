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

  it('completely excludes Three.js and WebGL from the package', () => {
    const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
    expect(pkg.exports['./webgl']).toBeUndefined();
    expect(pkg.exports['./vue-webgl']).toBeUndefined();
    expect(pkg.peerDependencies?.three).toBeUndefined();
    expect(pkg.devDependencies?.three).toBeUndefined();
  });

  it('exports only DOM core, Vue, and style entries', () => {
    const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
    expect(pkg.exports['.']).toBeDefined();
    expect(pkg.exports['./vue']).toBeDefined();
    expect(pkg.exports['./style.css']).toBeDefined();
  });
});
