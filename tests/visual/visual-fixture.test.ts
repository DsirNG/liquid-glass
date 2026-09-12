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
  'glass-card-default',
  'glass-card-rich-content',
  'glass-card-interactive',
  'glass-card-disabled',
];

describe('visual fixture scenarios', () => {
  it('keeps the minimum baseline matrix explicit and deterministic', () => {
    expect(Object.keys(VISUAL_FIXTURE_SCENARIOS)).toEqual(expectedSceneIds);

    for (const sceneId of expectedSceneIds) {
      const scene = VISUAL_FIXTURE_SCENARIOS[sceneId];
      expect(scene.baseline).toBe(`${scene.fixtureKey}.png`);
      expect(scene.width).toBeGreaterThan(0);
      expect(scene.height).toBeGreaterThan(0);
      expect(scene.options.interactive).toBe(false);
      expect(scene.options.fallbackPolicy).toBe('auto');
      expect(scene.component).toBe(
        sceneId.startsWith('glass-card-') ? 'glass-card' : 'liquid-glass'
      );
    }
  });

  it('keeps GlassCard visual scenes explicit and deterministic', () => {
    const cardSceneIds: VisualFixtureSceneId[] = [
      'glass-card-default',
      'glass-card-rich-content',
      'glass-card-interactive',
      'glass-card-disabled',
    ];

    expect(cardSceneIds.map((sceneId) => VISUAL_FIXTURE_SCENARIOS[sceneId].card?.variant)).toEqual([
      'default',
      'rich-content',
      'interactive',
      'disabled',
    ]);
    expect(VISUAL_FIXTURE_SCENARIOS['glass-card-default'].card).toEqual({
      size: 'md',
      variant: 'default',
      interactive: false,
      disabled: false,
    });
    expect(VISUAL_FIXTURE_SCENARIOS['glass-card-interactive'].card?.interactive).toBe(true);
    expect(VISUAL_FIXTURE_SCENARIOS['glass-card-disabled'].card).toEqual({
      size: 'md',
      variant: 'disabled',
      interactive: true,
      disabled: true,
    });
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
