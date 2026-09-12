# Phase 7 — Framework Adapters

Phase 1–6 established the Core Runtime, public API, browser matrix, canonical visual
regression, performance contracts, and release polish. Phase 7 makes those contracts consumable
from framework adapters without reopening the Core API.

## Core Public API Hard Freeze

Framework adapters may map, expose, and compose existing Core public contracts, but may not rename,
reinterpret, or bypass them.

Frozen public surface:

```text
Functions:  createLiquidGlass(), glass.update(), glass.resize(), glass.status, glass.destroy()
Constants: DEFAULT_GLASS_OPTIONS, GLASS_PRESETS
Types:     LiquidGlassMaterialOptions, LiquidGlassCreateOptions,
           LiquidGlassUpdateOptions, LiquidGlassStatus, LiquidGlassInstance, FallbackPolicy
Options:   all public LiquidGlassMaterialOptions fields, fallbackPolicy, interactive
```

Adapter-only aliases such as `preset`, `glassStyle`, `fallback`, `engineMode`, and `opticalMode`
are not allowed. Vue kebab-case attributes such as `fallback-policy` and `material-preset` are
only the framework's normal mapping to the frozen camelCase names.

## Execution order

```text
7A     Vanilla Consumer Contract
7B-0   Vue Adapter Contract Tests
7B-1   Vue Adapter Repair
7B-2   getStatus / SSR / lifecycle contract
7C     React Adapter (not started until Vue is stable)
7D     Cross-Adapter Contract
7E     Playground Migration
```

## Phase 7A — Vanilla Consumer Contract

The source consumer boundary imports only from `src/core`; it must not import `src/engine` or any
framework or Playground module. The built consumer boundary is `dist/core/index.js`.

7A has three independent proofs:

```text
Source contract
  create, update, resize, status, destroy, repeated destroy

Dist runtime smoke
  createLiquidGlass, DEFAULT_GLASS_OPTIONS, GLASS_PRESETS, lifecycle

Dist type contract
  public .d.ts imports, valid options, invalid creation/update options rejected
```

Runtime exports and declaration types are tested separately because TypeScript types do not exist
at runtime.

## Phase 7B — Vue Adapter v1

The Vue adapter maps to `createLiquidGlass()` and never imports internal runtime classes.

`options?: LiquidGlassMaterialOptions` remains a compatibility entry point with fixed precedence:

```text
Core defaults
  ↓
options object
  ↓
direct material props
```

Direct props win over the material-only `options` object. The object is not expanded to
`LiquidGlassCreateOptions`, so `fallbackPolicy` and `interactive` have no competing second source.

The current Core classification is:

```text
Runtime-updateable:
  capability, materialPreset, surfaceProfile, surfaceShape,
  and all other LiquidGlassMaterialOptions fields

Creation-only:
  fallbackPolicy, interactive
```

Material changes are diffed into a `LiquidGlassUpdateOptions` patch. Creation-only changes do not
enter `glass.update()`; v1 may warn in development and requires a remount for the new creation
options to take effect.

The adapter must preserve normal HTML attribute fallthrough (`class`, `style`, `id`, `role`,
`aria-*`, and `data-*`) while consuming all Core props. It exposes `instance`, `getStatus()`,
`update(patch: LiquidGlassUpdateOptions)`, `resize()`, and `destroy()`.

`getStatus()` returns the current Core snapshot. No Core subscription or polling API is added in
this phase.

## Adapter dependency boundary

```text
Consumer tests:   src/core or dist/core only; no src/engine imports
Vue adapter:      Core public entry and public Core types only; no src/engine imports
Core internals:   may continue to use src/engine and Runtime internals
```

## Release gate

React and Playground work remain blocked until Vue covers mount, material patch updates, resize,
status snapshot, slots, unmount cleanup, attrs, and SSR without changing Core public behavior.
