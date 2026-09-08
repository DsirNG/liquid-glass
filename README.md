# Liquid Glass

DOM-native liquid glass optics for Vanilla JavaScript and Vue 3.

## Architecture

The default package is the lightweight path:

```text
@dinqorai/liquid-glass / @dinqorai/liquid-glass/vue
  -> DOM-native LiquidGlassEngine
  -> SVG backdrop optics + CSS material layers
  -> real DOM content
```

The current package exposes only the DOM-native SVG/CSS renderer. There is no WebGL or Three.js API in this release.

## Installation

```bash
pnpm add @dinqorai/liquid-glass
```

Vue users install Vue alongside the package:

```bash
pnpm add @dinqorai/liquid-glass vue
```

## DOM-native API

```ts
import { createLiquidGlass } from '@dinqorai/liquid-glass';
import '@dinqorai/liquid-glass/style.css';

const glass = createLiquidGlass(document.querySelector('#card')!, {
  thickness: 45,
  ior: 2.2,
  dispersion: 1.5,
});

glass.update({ thickness: 52 });
glass.resize();
glass.destroy();
```

`createLiquidGlass()` uses the DOM-native SVG backdrop engine. SVG filters are an internal implementation detail.

## Vue API

```vue
<script setup lang="ts">
import { LiquidGlass, GlassButton } from '@dinqorai/liquid-glass/vue';
import '@dinqorai/liquid-glass/style.css';
</script>

<template>
  <LiquidGlass :options="{ thickness: 45, ior: 2.2, dispersion: 1.5 }">
    <div>Liquid Glass Container</div>
  </LiquidGlass>

  <!-- Ready-to-use Liquid Glass Button -->
  <GlassButton variant="primary" size="md" @click="handleClick"> Action Button </GlassButton>
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
