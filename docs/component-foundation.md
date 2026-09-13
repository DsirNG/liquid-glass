# Component Foundation

Phase 8 components share the Core vocabulary and the same consumer-facing behavior. The
foundation is intentionally a convention document, not a base component class.

## Public naming

- Glass options keep the Frozen Core names: `materialPreset`, `fallbackPolicy`, `capability`,
  `refraction`, `blur`, `tint`, `specular`, and the remaining material fields.
- Component behavior uses component names such as `size`, `variant`, `disabled`, and `active`.
- Component-specific names must not introduce parallel meanings such as `glassStrength` or
  `frostLevel`.
- `options` is a material-options compatibility entry point. When both sources provide a field,
  direct component props win over `options`, which wins over component defaults.

## Shared behavior

- `class`, `style`, `aria-*`, `data-*`, and other ordinary HTML attributes fall through to the
  component's public host element.
- Slots remain compositional: `LiquidGlass` and `GlassButton` expose a default slot; `GlassTabBar`
  exposes `prefix`, `item`, and `suffix` slots.
- Events use DOM/component names (`click`) and emit the native event or the documented item
  payload. Components do not own application navigation state.
- Native disabled controls remain keyboard-inert and do not emit activation events.
- `fallbackPolicy` controls runtime degradation and is creation-only. It must not be sent through
  `update()` after mount.
- Components are SSR-safe: Core creation and browser-only work start in the client lifecycle.
- `radius` stays a Core numeric option. A component may provide sensible defaults, and an explicit
  Core value overrides them. Size presets must not rename or reinterpret `radius`.

## Current Vue components

| Component     | Component-specific contract                                  | Glass contract                                                                                             |
| ------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `LiquidGlass` | Container with a default slot                                | Direct Core material props, `options`, `interactive`, `fallbackPolicy`                                     |
| `GlassButton` | `size: sm \| md \| lg`, `variant`, `disabled`, native `type` | Same Core material names, `options`, `interactive`, `fallbackPolicy`                                       |
| `GlassTabBar` | Items, responsive dimensions, active/disabled item state     | `baseOptions` and `lensOptions` use `LiquidGlassMaterialOptions`; nested surfaces own `interactive: false` |
| `GlassDock`   | Items, controlled `modelValue`, orientation, roving focus    | Same Core material names, material-only `options`, `interactive`, `fallbackPolicy`                         |

`GlassTabBar` uses the ARIA `tablist`/`tab` pattern, exposes a roving tab stop, and supports arrow,
Home, and End key navigation while leaving selection state controlled by the caller.

## Export convention

The Vue entry uses the component names directly:

```ts
import { GlassButton, GlassTabBar, LiquidGlass } from '@dinqorai/liquid-glass/vue';
```

Future React component ports use the same names. React does not currently claim `GlassButton` or
`GlassTabBar` until their React contracts are implemented and tested; no alternate names are
introduced as placeholders.
