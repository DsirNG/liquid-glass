import { afterAll, bench } from 'vitest';
import { InteractionController } from '../../src/engine/svg';

const element = document.createElement('div');
document.body.appendChild(element);
const controller = new InteractionController(element);
const pointerMove = new Event('pointermove', { bubbles: true });
Object.defineProperties(pointerMove, {
  clientX: { value: 160 },
  clientY: { value: 90 },
});

bench('dispatch 1000 pointer moves on the interaction fast path', () => {
  for (let index = 0; index < 1000; index += 1) {
    element.dispatchEvent(pointerMove);
  }
});

afterAll(() => {
  controller.destroy();
  element.remove();
});
