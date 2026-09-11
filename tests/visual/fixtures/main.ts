import './styles.css';
import { resolveVisualFixtureScene } from './scenarios';

function installStaticCapabilitySimulation(sceneMode: string): () => void {
  if (sceneMode !== 'static' || typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    return () => undefined;
  }

  const cssApi = CSS;
  const descriptor = Object.getOwnPropertyDescriptor(cssApi, 'supports');
  const originalSupports = cssApi.supports.bind(cssApi);

  Object.defineProperty(cssApi, 'supports', {
    configurable: true,
    value: (property: string, value: string) => {
      if (property === 'backdrop-filter' || property === '-webkit-backdrop-filter') return false;
      return originalSupports(property, value);
    },
  });

  return () => {
    if (descriptor) Object.defineProperty(cssApi, 'supports', descriptor);
  };
}

const scene = resolveVisualFixtureScene(window.location.search);
const restoreCapabilitySimulation = installStaticCapabilitySimulation(scene.mode);

const [{ createApp }, { default: VisualFixtureApp }] = await Promise.all([
  import('vue'),
  import('./VisualFixtureApp.vue'),
]);

createApp(VisualFixtureApp).mount('#app');

if (import.meta.hot) {
  import.meta.hot.dispose(() => restoreCapabilitySimulation());
}
