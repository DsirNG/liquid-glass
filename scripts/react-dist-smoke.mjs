import { act, createElement, createRef } from 'react';
import { createRoot } from 'react-dom/client';
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
  IS_REACT_ACT_ENVIRONMENT: true,
};

for (const [name, value] of Object.entries(browserGlobals)) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
}

const { LiquidGlass } = await import('../dist/react/index.js');
const host = document.createElement('div');
document.body.appendChild(host);
const ref = createRef();
const root = createRoot(host);

await act(async () => {
  root.render(
    createElement(
      LiquidGlass,
      {
        ref,
        capability: 'material',
        fallbackPolicy: 'preserve',
        interactive: false,
        refraction: 0.8,
      },
      createElement('button', { type: 'button' }, 'Continue')
    )
  );
});

if (!ref.current?.instance) throw new Error('React dist adapter did not expose its instance');
if (ref.current.getStatus()?.targetMode !== 'material') {
  throw new Error('React dist adapter reported an unexpected target mode');
}

ref.current.update({ capability: 'material', refraction: 0.6 });
ref.current.resize();

await act(async () => root.unmount());
if (host.firstElementChild) throw new Error('React dist adapter left DOM residue after unmount');

dom.window.close();
console.log('React dist runtime smoke passed.');
