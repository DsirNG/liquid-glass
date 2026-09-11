import { describe, expect, it } from 'vitest';
import {
  resolveVisualFixtureScene,
  VISUAL_FIXTURE_SCENARIOS,
  type VisualFixtureSceneId,
} from './fixtures/scenarios';

const expectedSceneIds: VisualFixtureSceneId[] = [
  'pure-dark-button',
  'pure-light-button',
  'ios-image-card',
  'small-pill',
  'material-fallback',
  'static-fallback',
];

describe('visual fixture scenarios', () => {
  it('keeps the minimum baseline matrix explicit and deterministic', () => {
    expect(Object.keys(VISUAL_FIXTURE_SCENARIOS)).toEqual(expectedSceneIds);

    for (const sceneId of expectedSceneIds) {
      const scene = VISUAL_FIXTURE_SCENARIOS[sceneId];
      expect(scene.width).toBeGreaterThan(0);
      expect(scene.height).toBeGreaterThan(0);
      expect(scene.options.interactive).toBe(false);
      expect(scene.options.fallbackPolicy).toBe('auto');
    }
  });

  it('maps forced fallback scenes to the intended planner inputs', () => {
    expect(VISUAL_FIXTURE_SCENARIOS['material-fallback'].options.capability).toBe('material');
    expect(VISUAL_FIXTURE_SCENARIOS['static-fallback'].options.capability).toBeUndefined();
    expect(VISUAL_FIXTURE_SCENARIOS['static-fallback'].mode).toBe('static');
  });

  it('falls back to the first scene for an unknown URL scene', () => {
    expect(resolveVisualFixtureScene('?scene=unknown').id).toBe('pure-dark-button');
    expect(resolveVisualFixtureScene('').id).toBe('pure-dark-button');
  });
});
