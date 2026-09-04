import { createLiquidGlass, DEFAULT_GLASS_OPTIONS } from 'liquid-glass';
import 'liquid-glass/style.css';

const el = document.getElementById('glass-card');
if (el) {
  const glass = createLiquidGlass(el, {
    blur: DEFAULT_GLASS_OPTIONS.blur,
    opacity: 0.1,
  });

  console.log('Renderer:', glass.renderer);
  glass.update({ blur: 25 });
  glass.resize();
  glass.destroy();
}
