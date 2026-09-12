# GlassCard v1 Contract

`GlassCard` is a content-container component built on the existing `LiquidGlass` primitive.
Its dependency path is fixed:

```text
GlassCard → LiquidGlass → Vue Adapter → Frozen Core
```

It owns layout and container semantics. It does not access engine/runtime internals or introduce
new optical terminology.

## Props

`GlassCard` accepts the existing `LiquidGlassMaterialOptions` names plus:

```ts
type GlassCardSize = 'sm' | 'md' | 'lg';

interface GlassCardProps {
  size?: GlassCardSize;
  disabled?: boolean;
  interactive?: boolean;
  fallbackPolicy?: FallbackPolicy;
  options?: LiquidGlassMaterialOptions;
}
```

`size` controls layout density only. It may provide default padding, spacing, min-height, and
radius; an explicit Core `radius` always wins. `interactive` defaults to `false` and means visual
pointer feedback, not button semantics. `disabled` disables the card's own visual interaction but
does not apply `pointer-events: none` to slot content. `fallbackPolicy` remains a creation-only Core
option.

Material precedence is:

```text
direct Core props > options object > component defaults > Core defaults
```

Forbidden parallel names include `glassStrength`, `frostLevel`, `glassIntensity`, `frosted`, and
`opticalPower`.

## Slots and DOM

The component exposes only `header`, `default`, and `footer`. Empty `header` and `footer` slots do
not create wrapper elements; the default slot always renders inside `.glass-card__body`.

The semantic root is a `div` supplied by the `LiquidGlass` primitive. Ordinary `class`, `style`,
`id`, `role`, `aria-*`, and `data-*` attributes fall through to that root. Core props and component
props do not leak as HTML attributes.

`GlassCard` does not emit a custom click event and does not automatically become a button when
`interactive` is enabled. Native events and interactive controls inside the slots retain their
normal semantics.

When `interactive && disabled`, the root exposes `aria-disabled="true"`; a non-interactive card does
not claim disabled form-control semantics. The component remains SSR-safe: Core creation and
browser-only interaction start only in the client lifecycle.
