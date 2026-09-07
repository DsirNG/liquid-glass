# Liquid Glass

DOM-native liquid glass optics for Vanilla JavaScript and Vue 3, with an optional Three.js WebGL implementation.

## Architecture

The default package is the lightweight path:

```text
liquid-glass / liquid-glass/vue
  -> DOM-native LiquidGlassEngine
  -> SVG backdrop optics + CSS material layers
  -> real DOM content
```

WebGL is an explicit extension and is never imported by the default core:

```text
liquid-glass/webgl / liquid-glass/vue-webgl
  -> WebGLEnhancement
  -> Three.js
```

## Installation

```bash
pnpm add liquid-glass
```

Vue users install Vue alongside the package. WebGL users also install Three.js:

```bash
pnpm add liquid-glass vue
pnpm add liquid-glass three
```

Both `vue` and `three` are optional peer dependencies.

## DOM-native API

```ts
import { createLiquidGlass } from 'liquid-glass';
import 'liquid-glass/style.css';

const glass = createLiquidGlass(document.querySelector('#card')!, {
  thickness: 45,
  ior: 2.2,
  dispersion: 1.5,
});

glass.update({ thickness: 52 });
glass.resize();
glass.destroy();
```

`createLiquidGlass()` has no renderer switch or WebGL background option. SVG filters are an internal detail of the DOM backdrop engine.

## Vue API

```vue
<script setup lang="ts">
import { LiquidGlass, GlassButton } from 'liquid-glass/vue';
import 'liquid-glass/style.css';
</script>

<template>
  <LiquidGlass :options="{ thickness: 45, ior: 2.2, dispersion: 1.5 }">
    <div>Liquid Glass Container</div>
  </LiquidGlass>

  <!-- Ready-to-use Liquid Glass Button -->
  <GlassButton variant="primary" size="md" @click="handleClick"> Action Button </GlassButton>
</template>
```

## Optional WebGL API

```ts
import { createWebGLLiquidGlass } from 'liquid-glass/webgl';

const glass = createWebGLLiquidGlass(document.querySelector('#card')!, {
  backgroundUrl: '/background.jpg',
  thickness: 45,
});
```

```vue
<script setup lang="ts">
import { WebGLLiquidGlass } from 'liquid-glass/vue-webgl';
</script>

<template>
  <WebGLLiquidGlass background-url="/background.jpg">
    <button>WebGL glass</button>
  </WebGLLiquidGlass>
</template>
```

## Development

```bash
pnpm dev
pnpm run type-check
pnpm run test
pnpm run build
pnpm run test:smoke
```

## License

MIT
