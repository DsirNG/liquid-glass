import { describe, it, expect } from 'vitest';
import { createApp, h } from 'vue';
import { LiquidGlassReactButton } from '../src/vue';

describe('vue/LiquidGlassReactButton', () => {
  it('mounts LiquidGlassReactButton and renders SVG filter and button elements', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    const app = createApp({
      render() {
        return h(
          LiquidGlassReactButton,
          {
            width: 200,
            height: 60,
            borderRadius: 30,
          },
          () => 'Test Button'
        );
      },
    });

    app.mount(root);

    const button = root.querySelector('.lg-react-button-wrapper');
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain('Test Button');

    const svgFilter = root.querySelector('svg filter');
    expect(svgFilter).not.toBeNull();
    expect(svgFilter?.querySelectorAll('feDisplacementMap').length).toBe(3);

    app.unmount();
    root.remove();
  });
});
