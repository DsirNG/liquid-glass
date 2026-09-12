import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, h, nextTick, reactive } from 'vue';
import { GlassCard } from '../../src/vue';
import * as coreModule from '../../src/core';
import type { LiquidGlassInstance } from '../../src/types';

const roots: HTMLElement[] = [];

function createMockInstance(): LiquidGlassInstance {
  return {
    renderer: 'dom',
    isDestroyed: false,
    status: { targetMode: null, activeMode: null, phase: 'initializing', degraded: false },
    update: vi.fn(),
    resize: vi.fn(),
    destroy: vi.fn(),
  };
}

function mountCard(render: () => ReturnType<typeof h>): ReturnType<typeof createApp> {
  const root = document.createElement('div');
  document.body.appendChild(root);
  roots.push(root);
  const app = createApp({ render });
  app.mount(root);
  return app;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  roots.splice(0).forEach((root) => root.remove());
});

describe('Vue GlassCard contract', () => {
  it('exports the public component and renders the three slot regions', async () => {
    const instance = createMockInstance();
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const click = vi.fn();
    const app = mountCard(() =>
      h(
        GlassCard,
        {
          size: 'lg',
          interactive: true,
          disabled: true,
          fallbackPolicy: 'auto',
          capability: 'material',
          options: { radius: 18, blur: 1, opacity: 0.2 },
          radius: 28,
          blur: 4,
          class: 'custom-card',
          style: { color: 'red' },
          id: 'project-card',
          role: 'region',
          'aria-label': 'Project details',
          'data-testid': 'project-card',
          onClick: click,
        },
        {
          header: () => h('h2', 'Project'),
          default: () => h('button', { type: 'button' }, 'Open'),
          footer: () => h('span', 'Updated today'),
        }
      )
    );

    await nextTick();

    const root = roots[0].querySelector('.lg-root');
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        radius: 28,
        blur: 4,
        opacity: 0.2,
        capability: 'material',
        fallbackPolicy: 'auto',
        interactive: false,
      })
    );
    expect(root).not.toBeNull();
    expect(root?.classList.contains('glass-card')).toBe(true);
    expect(root?.classList.contains('glass-card--lg')).toBe(true);
    expect(root?.classList.contains('glass-card--interactive')).toBe(true);
    expect(root?.classList.contains('glass-card--disabled')).toBe(true);
    expect(root?.getAttribute('id')).toBe('project-card');
    expect(root?.getAttribute('role')).toBe('region');
    expect(root?.getAttribute('aria-label')).toBe('Project details');
    expect(root?.getAttribute('aria-disabled')).toBe('true');
    expect(root?.getAttribute('data-testid')).toBe('project-card');
    expect(root?.getAttribute('style')).toContain('color: red');
    expect(root?.querySelector('.glass-card__header h2')?.textContent).toBe('Project');
    expect(root?.querySelector('.glass-card__body button')?.textContent).toBe('Open');
    expect(root?.querySelector('.glass-card__footer')?.textContent).toBe('Updated today');
    expect(root?.querySelector('button')?.disabled).toBe(false);

    root?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(click).toHaveBeenCalledTimes(1);

    for (const attribute of [
      'material-preset',
      'fallback-policy',
      'capability',
      'options',
      'size',
      'disabled',
      'interactive',
    ]) {
      expect(root?.hasAttribute(attribute)).toBe(false);
    }

    app.unmount();
    expect(instance.destroy).toHaveBeenCalledTimes(1);
  });

  it('omits empty header/footer wrappers and applies size radius defaults', async () => {
    const createSpy = vi
      .spyOn(coreModule, 'createLiquidGlass')
      .mockReturnValueOnce(createMockInstance())
      .mockReturnValueOnce(createMockInstance())
      .mockReturnValueOnce(createMockInstance());

    const app = mountCard(() =>
      h('section', [
        h(GlassCard, { size: 'sm' }, { default: () => 'Small' }),
        h(GlassCard, { size: 'md', options: { radius: 30 } }, { default: () => 'Medium' }),
        h(
          GlassCard,
          { size: 'lg', options: { radius: 30 }, radius: 42 },
          { default: () => 'Large' }
        ),
      ])
    );

    await nextTick();

    const cards = [...roots[0].querySelectorAll<HTMLElement>('.glass-card')];
    expect(createSpy).toHaveBeenCalledTimes(3);
    expect(createSpy.mock.calls[0][1]).toEqual(expect.objectContaining({ radius: 16 }));
    expect(createSpy.mock.calls[1][1]).toEqual(expect.objectContaining({ radius: 30 }));
    expect(createSpy.mock.calls[2][1]).toEqual(expect.objectContaining({ radius: 42 }));
    expect(cards.map((card) => card.className)).toEqual([
      expect.stringContaining('glass-card--sm'),
      expect.stringContaining('glass-card--md'),
      expect.stringContaining('glass-card--lg'),
    ]);
    expect(cards.every((card) => card.querySelector('.glass-card__body'))).toBe(true);
    expect(cards.every((card) => !card.querySelector('.glass-card__header'))).toBe(true);
    expect(cards.every((card) => !card.querySelector('.glass-card__footer'))).toBe(true);

    app.unmount();
  });

  it('defaults interactive to false and preserves changed-patch and creation-only boundaries', async () => {
    const instance = createMockInstance();
    const createSpy = vi.spyOn(coreModule, 'createLiquidGlass').mockReturnValue(instance);
    const props = reactive({
      refraction: 0.6,
      capability: 'auto' as const,
      fallbackPolicy: 'auto' as const,
      interactive: false,
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const app = mountCard(() => h(GlassCard, props, () => 'Content'));

    await nextTick();
    expect(createSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ refraction: 0.6, interactive: false })
    );

    instance.update.mockClear();
    props.refraction = 0.8;
    await nextTick();
    await nextTick();
    expect(instance.update).toHaveBeenCalledTimes(1);
    expect(instance.update).toHaveBeenCalledWith({ refraction: 0.8 });

    props.capability = 'material';
    await nextTick();
    await nextTick();
    expect(instance.update).toHaveBeenLastCalledWith({ capability: 'material' });

    instance.update.mockClear();
    props.fallbackPolicy = 'preserve';
    props.interactive = true;
    await nextTick();
    await nextTick();
    expect(instance.update).not.toHaveBeenCalled();
    expect(warnSpy.mock.calls.flat().join(' ')).toContain('creation-only');
    expect(createSpy).toHaveBeenCalledTimes(1);

    app.unmount();
    expect(instance.destroy).toHaveBeenCalledTimes(1);
  });
});
