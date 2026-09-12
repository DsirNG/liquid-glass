import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});

const browserGlobals = {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  SVGElement: dom.window.SVGElement,
  SVGSVGElement: dom.window.SVGSVGElement,
  requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
  cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
};

for (const [name, value] of Object.entries(browserGlobals)) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
}

const { createLiquidGlass, DEFAULT_GLASS_OPTIONS, GLASS_PRESETS } =
  await import('../dist/core/index.js');

if (typeof createLiquidGlass !== 'function') {
  throw new Error('dist/core/index.js does not export createLiquidGlass');
}
if (!DEFAULT_GLASS_OPTIONS || !GLASS_PRESETS) {
  throw new Error('dist/core/index.js is missing public constants');
}

const host = document.createElement('div');
document.body.appendChild(host);
const glass = createLiquidGlass(host, {
  capability: 'material',
  materialPreset: 'pure',
  fallbackPolicy: 'preserve',
});

if (glass.status.targetMode !== 'material') {
  throw new Error(`Unexpected dist runtime target mode: ${glass.status.targetMode}`);
}

glass.update({ blur: 4, capability: 'material' });
glass.resize();
if (glass.isDestroyed) throw new Error('Dist runtime was destroyed too early');

glass.destroy();
glass.destroy();
if (!glass.isDestroyed) throw new Error('Dist runtime did not destroy cleanly');
if (host.classList.contains('lg-root') || host.querySelector('.lg-svg-container')) {
  throw new Error('Dist runtime left DOM residue after destroy');
}

dom.window.close();
console.log('Vanilla dist runtime smoke passed.');
