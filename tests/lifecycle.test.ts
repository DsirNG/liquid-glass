import { describe, it, expect } from 'vitest';
import { createLiquidGlass } from '../src/core';

describe('DOM engine lifecycle', () => {
  it('creates a DOM-native instance and mounts it', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const glass = createLiquidGlass(element, { blur: 15 });

    expect(glass.renderer).toBe('dom');
    expect(glass.isDestroyed).toBe(false);
    expect(element.classList.contains('lg-svg-container')).toBe(true);
    expect(() => glass.update({ blur: 25 })).not.toThrow();
    expect(() => glass.resize()).not.toThrow();

    glass.destroy();
    expect(glass.isDestroyed).toBe(true);
  });

  it('destroys idempotently and rejects later mutations', () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    const glass = createLiquidGlass(element);
    glass.destroy();
    expect(() => glass.destroy()).not.toThrow();
    expect(() => glass.update({ blur: 20 })).toThrowError(/destroyed/);
    expect(() => glass.resize()).toThrowError(/destroyed/);
  });

  it('requires an HTMLElement', () => {
    expect(() => createLiquidGlass(null as unknown as HTMLElement)).toThrowError(/HTMLElement/);
  });
});
