# Liquid Glass 🍸

> High-performance, framework-agnostic Liquid Glass optical distortion & refraction engine with native Vue 3 adapter.

[![CI](https://github.com/your-org/liquid-glass/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/liquid-glass/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/badge/npm-v0.1.0-emerald.svg)](https://www.npmjs.com/package/liquid-glass)

Liquid Glass replicates iOS-inspired fluid glass materials on the web using physics-based Snell's Law refraction, chromatic aberration (dispersion), dynamic specular highlights, and organic micro-frost dithering.

---

## ✨ Features

- 💎 **Dual Rendering Pipeline**:
  - **WebGL Shader Engine**: 16-sample Poisson disk bokeh blur, Snell's law refraction, chromatic aberration dispersion, and Fresnel reflection.
  - **SVG Filter Engine**: Zero WebGL context, pure CSS `feDisplacementMap` and `backdrop-filter` vector squircle optics.
- 🧩 **100% Framework-Agnostic Core**: Core engine runs cleanly in Vanilla JS with 0% framework dependencies.
- ⚡ **Native Vue 3 Adapter**: First-class `<LiquidGlass />` component and `useLiquidGlass` composable.
- 🛡️ **Zero Silent Fallback**: Predictable rendering strategy with robust browser capability detection.
- 📦 **Modern ESM & TypeScript**: Complete `.d.ts` declaration generation, dual-entry exports, and Package Smoke Test verified.

---

## 🏗️ Architecture

```text
                               npm users
                                   │
                  ┌────────────────┴────────────────┐
                  │                                 │
                  ▼                                 ▼
        liquid-glass (Core)                liquid-glass/vue
        (src/core/index.ts)                (src/vue/index.ts)
                  │                                 │
                  │                        LiquidGlass.vue
                  │                                 │
                  │                        useLiquidGlass()
                  │                                 │
                  └────────────────┬────────────────┘
                                   ▼
                        createLiquidGlass(el, opts)
                                   │
                        ┌──────────┴──────────┐
                        ▼                     ▼
                normalizeOptions()    resolveRenderer()
                        │                     │
                        └──────────┬──────────┘
                                   ▼
                            RendererManager
                             ╱           ╲
                            ▼             ▼
                    WebGLRenderer     SVGRenderer
                          │               │
                    Three.js (内部)    SVG Filter
```

---

## 📦 Installation

```bash
# Core only (Vanilla JS / Other Frameworks)
pnpm add liquid-glass

# With Vue 3
pnpm add liquid-glass vue
```

> **Note**: `vue` is declared as an optional peer dependency. Pure Vanilla JS users can install and use `liquid-glass` without installing Vue!

---

## 🚀 Quick Start

### 1. Vanilla JavaScript / TypeScript

```ts
import { createLiquidGlass } from 'liquid-glass';
import 'liquid-glass/style.css';

const cardElement = document.getElementById('my-card')!;

const glass = createLiquidGlass(cardElement, {
  blur: 2.0,
  thickness: 45,
  ior: 2.2,
  dispersion: 0.02,
  tint: '#ffffff',
});

// Dynamic configuration updates (renderer is immutable after creation)
glass.update({ blur: 4.0 });

// Resize handling
window.addEventListener('resize', () => glass.resize());

// Safe cleanup (idempotent)
glass.destroy();
```

### 2. Vue 3 (Component)

```vue
<script setup lang="ts">
import { LiquidGlass } from 'liquid-glass/vue';
import 'liquid-glass/style.css';
</script>

<template>
  <LiquidGlass renderer="auto" :blur="2.0" :thickness="45" :ior="2.2" tint="#ffffff">
    <div class="card-content">
      <h2>Liquid Glass Card</h2>
      <p>High-fidelity optical distortion</p>
    </div>
  </LiquidGlass>
</template>
```

### 3. Vue 3 (Composable)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useLiquidGlass } from 'liquid-glass/vue';
import 'liquid-glass/style.css';

const boxRef = ref<HTMLElement | null>(null);
const { renderer, update, destroy } = useLiquidGlass(boxRef, {
  blur: 15,
  thickness: 50,
});
</script>

<template>
  <div ref="boxRef">Active Renderer: {{ renderer }}</div>
</template>
```

---

## 🎛️ Options & Presets

| Option          | Type                         | Default                       | Description                                         |
| :-------------- | :--------------------------- | :---------------------------- | :-------------------------------------------------- |
| `renderer`      | `'auto' \| 'webgl' \| 'svg'` | `'auto'`                      | Target rendering pipeline                           |
| `blur`          | `number`                     | `2.0`                         | Background blur radius (pixels)                     |
| `opacity`       | `number`                     | `0.06`                        | Base tint opacity (0 ~ 1)                           |
| `thickness`     | `number`                     | `45`                          | Physical thickness affecting Snell's law refraction |
| `ior`           | `number`                     | `2.2`                         | Index of Refraction (1.0 ~ 3.5)                     |
| `refraction`    | `number`                     | `1.0`                         | Refraction scaling multiplier                       |
| `dispersion`    | `number`                     | `0.018`                       | Chromatic aberration prism intensity (WebGL only)   |
| `saturation`    | `number`                     | `1.3`                         | Saturation enhancement multiplier                   |
| `tint`          | `string`                     | `'#ffffff'`                   | Color tint (HEX / RGB)                              |
| `radius`        | `number`                     | `40`                          | Corner border-radius in pixels                      |
| `bezel`         | `number`                     | `36`                          | Bezel border curve width in pixels                  |
| `specular`      | `number`                     | `0.65`                        | Specular rim highlight intensity (0 ~ 2)            |
| `shadow`        | `number`                     | `0.4`                         | Outer and inner shadow depth                        |
| `shadowColor`   | `string`                     | `'rgba(255, 255, 255, 0.45)'` | Inner shadow color                                  |
| `interactive`   | `boolean`                    | `true`                        | Dynamic specular reaction to cursor position        |
| `backgroundUrl` | `string?`                    | `undefined`                   | Custom scene wallpaper URL for WebGL sampling       |

### Built-in Standard Presets

```ts
import { GLASS_PRESETS } from 'liquid-glass';

// Available presets: 'ios-like' | 'clear' | 'vivid' | 'heavy'
const preset = GLASS_PRESETS['ios-like'];
```

---

## 🛠️ Development & Engineering

```bash
# Start full-featured Playground
pnpm dev

# Run TypeScript type check
pnpm run type-check

# Run Linter with Architecture Boundary checking
pnpm run lint

# Run CSS Stylelint
pnpm run lint:style

# Run Vitest unit & lifecycle tests
pnpm run test

# Build Library (ESM + types + style.css)
pnpm run build

# Run real package smoke test (pnpm pack + dual fixture validation)
pnpm run test:smoke

# Build Playground website
pnpm run build:playground
```

---

## 📄 License

[MIT](LICENSE) © 2026 Liquid Glass Contributors
