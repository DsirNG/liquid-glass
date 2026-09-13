# GlassDock v1 Contract

`GlassDock` is a data-driven, multi-item interactive glass container. It owns dock layout and
item interaction semantics, but it does not implement a second optical or runtime engine.

The dependency path is fixed:

```text
GlassDock → LiquidGlass / component primitive → Vue Adapter → Frozen Core
```

GlassDock may use the public Vue `LiquidGlass` primitive and public Core types. It must not import
`BackendManager`, `RuntimeController`, `CapabilityProbe`, `OpticalBackend`, `SvgSyncCoordinator`,
or any other `src/engine` module.

## Item and props

The v1 item model is intentionally data-only:

```ts
interface GlassDockItem {
  value: string | number;
  label: string;
  disabled?: boolean;
}
```

The component-specific props are:

```ts
interface GlassDockProps {
  items: readonly GlassDockItem[];
  modelValue?: string | number;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  interactive?: boolean;
  fallbackPolicy?: FallbackPolicy;
  options?: LiquidGlassMaterialOptions;
}
```

All other glass props retain their Frozen Core names. `options` is material-only, and precedence is:

```text
direct material props > options > component defaults > Core defaults
```

`interactive` defaults to `false` and is creation-only through the Core boundary. `fallbackPolicy`
is also creation-only. Neither is sent through `glass.update()` when changed after mount.

The first version does not expose `badge`, `tooltip`, `href`, `route`, `command`, `shortcut`,
`notification`, or tunable magnification physics.

## Selection, hover, and focus

`modelValue` is the controlled business selection state. The component emits only:

```text
update:modelValue(value)
```

Hover and focus are transient component states and never change `modelValue` by themselves:

```text
active   = modelValue
hovered  = pointer state
focused  = keyboard/focus state
```

When `modelValue` is absent, unknown, or points to a disabled item, no item is business-active. The
first enabled item still receives the initial roving tab stop so the dock remains keyboard
reachable; the component does not emit a corrective `modelValue` value.

The default semantic container is `role="toolbar"`. Items use button semantics and a roving tab
stop. Horizontal docks use `ArrowLeft`/`ArrowRight`; vertical docks use `ArrowUp`/`ArrowDown`.
`Home`, `End`, `Enter`, and `Space` are supported. Disabled items are skipped by focus navigation
and cannot be selected.

`interactive` means visual pointer feedback, not that the dock becomes a link or another business
control. The dock itself does not add a custom click API in v1.

## Slots

The only component-specific slot is `item`:

```vue
<template #item="{ item, index, active, hovered, focused, disabled }">...</template>
```

The built-in renderer remains available when the slot is omitted. No structural slots for lenses,
indicators, or background layers are exposed.

## Glass and performance boundary

The base glass surface and any interaction lens are implementation details. The contract only
requires that the base container remains stable, active state remains stable, and pointer feedback
follows the hovered item.

Pointer movement, hover magnification, focus navigation, and active-item changes are component
fast paths. They must not trigger optical-field rebuilds, backend switches, or new Core instances.
The dynamic item transform belongs to the component interaction layer.

## Attributes, SSR, and lifecycle

Normal `class`, `style`, `id`, `aria-*`, and `data-*` attributes fall through to the semantic dock
root. Core props and component props (`items`, `modelValue`, `size`, `orientation`, `disabled`,
`interactive`, `fallbackPolicy`, and `options`) do not leak as HTML attributes.

The component is SSR-safe: server rendering does not create a Core instance or access pointer,
`window`, `document`, or `ResizeObserver`. Client mount creates one stable Core instance. Material
changes send only the changed `LiquidGlassUpdateOptions` patch; `capability` remains updateable.
Unmount and repeated imperative cleanup are safe and destroy the Core instance at most once.
