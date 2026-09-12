# Liquid Glass

DOM-native liquid glass optics for Vanilla JavaScript and Vue 3.

Liquid Glass exposes one public creation API and a capability-driven runtime. The same options
can resolve to a full optical backend, a CSS material backend, or a static fallback without
changing the application code.

## Installation

```bash
pnpm add @dinqorai/liquid-glass
```

Vue users also install Vue:

```bash
pnpm add @dinqorai/liquid-glass vue
```

React users also install React:

```bash
pnpm add @dinqorai/liquid-glass react
```

## Public API

The DOM-native entry point is `createLiquidGlass`. Import the stylesheet once in the application
entry point, then keep the returned instance as the lifecycle boundary for the element.

```ts
import { createLiquidGlass } from '@dinqorai/liquid-glass';
import '@dinqorai/liquid-glass/style.css';

const element = document.querySelector<HTMLElement>('#card');
if (!element) throw new Error('Missing #card element');

const glass = createLiquidGlass(element, {
  materialPreset: 'pure',
  fallbackPolicy: 'auto',
});

glass.update({ refraction: 0.8 });
console.log(glass.status);

glass.resize();
glass.destroy();
```

`glass.status` is a stable public snapshot with these fields:

```ts
{
  targetMode: 'full-optical' | 'material' | 'static' | null,
  activeMode: 'full-optical' | 'material' | 'static' | null,
  phase: 'initializing' | 'transitioning' | 'ready' | 'failed',
  degraded: boolean,
  degradationReason?: string,
  runtimeReason?: string,
  recoveryMode?: 'material' | 'static',
  lastOperation?: object,
}
```

Call `update()` for material parameter changes, `resize()` after an externally controlled size
change, and `destroy()` when the element leaves the DOM. The runtime owns its generated SVG and
observers and releases them during `destroy()`.

### Options and presets

`materialPreset` is a material calibration option with the values `pure` and `ios`. The
`GLASS_PRESETS` export provides the `GlassPreset` values `ios-like`, `clear`, `vivid`, and `heavy`.

The most frequently tuned material fields are:

| Field                 | Purpose                           |
| --------------------- | --------------------------------- |
| `blur`                | Backdrop softness                 |
| `opacity`             | Tint transparency from `0` to `1` |
| `thickness`           | Perceived lens thickness          |
| `ior`                 | Index of refraction               |
| `refraction`          | Distortion strength               |
| `dispersion`          | Chromatic separation              |
| `saturation`          | Backdrop saturation multiplier    |
| `tint`                | Glass tint color                  |
| `radius` / `bezel`    | Footprint radius and optical rim  |
| `specular` / `shadow` | Highlight and shadow strength     |
| `surfaceShape`        | Optical surface profile           |
| `quality`             | Optical field quality tier        |

All material fields are exported through the `LiquidGlassMaterialOptions` TypeScript type.

## Runtime architecture

The public API stays small while the runtime makes the rendering decision from probed capabilities
and the requested options:

```text
createLiquidGlass
      ↓
Canonical Options
      ↓
CapabilityProbe
      ↓
RenderPlanner
      ↓
RuntimeController
      ↓
BackendManager
   ↙       ↓        ↘
Optical  Material  Static
```

The implementation is DOM-native SVG and CSS. WebGL and Three.js are not part of this release.

## Browser and fallback support

The runtime does not select a backend from the browser name alone. It probes the capabilities and
known restrictions of the current engine, then exposes the decision through `status`.

| Runtime                              | Expected behavior                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| Chromium                             | Full Optical when the required SVG and backdrop capabilities are available            |
| Firefox                              | Capability-driven runtime selection; the best available optical plan is used          |
| Playwright WebKit                    | Known restrictions are respected; Material fallback is used when required             |
| Safari / iOS Safari                  | Real-device validation is optional; the same capability-driven fallback model applies |
| Any runtime without backdrop effects | Static is the final fallback                                                          |

### Fallback policy

Use `fallbackPolicy` to choose how much the planner may change when a requested tier is unavailable:

- `auto` (default): degrade automatically and increase minimum opacity, specular, blur, or
  saturation where needed to keep the fallback visibly present.
- `preserve`: degrade automatically but preserve the requested visual parameters.
- `strict`: do not silently cross the requested capability tier; an unsupported strict request is
  reported instead of producing a degraded plan.

## Parameter support levels

The Playground reports every parameter against the active backend and the probed runtime facts.
The labels mean:

- **Full**: implemented by the active backend.
- **Approximate**: represented with a visual approximation in that backend.
- **Unsupported**: not implemented by the active backend.

In Full Optical mode, optical field parameters such as `ior`, `refraction`, `dispersion`,
`surfaceShape`, and `thickness` can be applied when the runtime reports the required capabilities.
Material mode keeps common visual styling and backdrop effects, while optical field geometry is
approximate or unsupported. Static mode keeps the basic surface styling and radius but cannot
provide backdrop blur or optical refraction. Support is therefore a runtime property, not a
browser-name promise.

## Vue API

```vue
<script setup lang="ts">
import { LiquidGlass, GlassButton } from '@dinqorai/liquid-glass/vue';
import '@dinqorai/liquid-glass/style.css';

function handleClick() {
  console.log('clicked');
}
</script>

<template>
  <LiquidGlass :options="{ materialPreset: 'pure', refraction: 0.8 }">
    <div>Liquid Glass Container</div>
  </LiquidGlass>

  <GlassButton variant="primary" size="md" @click="handleClick"> Action Button </GlassButton>
</template>
```

### GlassTabBar

`GlassTabBar` is presentational: describe the tabs with `items`, mark the active item from your
own route or view state, and handle navigation through `@click`. It does not use `v-model` or
mutate selection state.

```vue
<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { GlassTabBar, type GlassTabBarItem } from '@dinqorai/liquid-glass/vue';

const currentPage = shallowRef('home');
const items = computed<GlassTabBarItem[]>(() => [
  { value: 'home', label: 'Home', active: currentPage.value === 'home' },
  { value: 'search', label: 'Search', active: currentPage.value === 'search' },
  { value: 'about', label: 'About', active: currentPage.value === 'about' },
]);

function navigate(item: GlassTabBarItem) {
  currentPage.value = item.value;
}
</script>

<template>
  <GlassTabBar :items="items" @click="navigate" />
</template>
```

## React API

The React adapter maps the same frozen Core contract to React lifecycle and props. Import the
stylesheet once in the application entry point:

```tsx
import { LiquidGlass } from '@dinqorai/liquid-glass/react';
import '@dinqorai/liquid-glass/style.css';

export function Example() {
  return (
    <LiquidGlass materialPreset="pure" fallbackPolicy="auto" refraction={0.8}>
      <button type="button">Continue</button>
    </LiquidGlass>
  );
}
```

React material props are diffed into `glass.update()` patches. `fallbackPolicy` and `interactive`
are creation-only options; changing them does not enter `update()` and emits a development warning.
An imperative ref exposes `instance`, `getStatus()`, `update()`, `resize()`, and `destroy()`.

## Playground and runtime observability

Run the local Playground to inspect the optical surface and the runtime decision chain:

```bash
pnpm dev
```

Open `http://localhost:5173/`. The right-side observability panel exposes the same concepts as the
public runtime status:

```text
Renderer status
  Target       full-optical | material | static
  Active       currently committed backend
  Phase        initializing | transitioning | ready | failed
  Fallback     auto | preserve | strict
  Degraded     yes | no
  Recovery     material | static | disabled

Runtime facts
  backdrop filter, SVG filter, displacement map, optical combination, CSS filter

Support level
  Full | Approx. | Unsupported
```

Use the Playground's `Copy runtime info` action when reporting a browser-specific issue. The
browser test hook also exposes a read-only snapshot as `window.__LIQUID_GLASS_PLAYGROUND__` in
development and browser-test builds.

## Verification and release readiness

The repository protects the runtime with browser, visual, and behavioral checks:

```bash
pnpm run type-check
pnpm run lint
pnpm run test
pnpm run test:performance
pnpm run runtime:matrix
pnpm run visual:test:canonical
pnpm run build
pnpm run test:smoke
```

Visual baselines are generated and compared in the pinned Playwright `v1.55.0-noble` Linux
environment. Performance CI fails on behavioral contract violations and reports, rather than
hard-failing on, hosted-runner timing noise. See [the release checklist](docs/release-checklist.md)
for the current publication gate and [the changelog](CHANGELOG.md) for the unreleased work.

## License

MIT
