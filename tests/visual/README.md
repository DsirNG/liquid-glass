# Visual regression fixture

This fixture is intentionally independent from the Playground layout. It uses the real Vue
`LiquidGlass` component with deterministic CSS-only backgrounds, fixed element sizes, disabled
interaction, and disabled animation/transition styles.

Start the local server with:

```bash
pnpm run visual:fixture
```

Then open one of these URLs at a fixed browser viewport and DPR:

```text
/tests/visual/fixtures/index.html?scene=pure-dark-button
/tests/visual/fixtures/index.html?scene=pure-light-button
/tests/visual/fixtures/index.html?scene=ios-image-card
/tests/visual/fixtures/index.html?scene=small-pill
/tests/visual/fixtures/index.html?scene=material-fallback
/tests/visual/fixtures/index.html?scene=static-fallback
```

The root element exposes stable selectors for browser automation:

```text
[data-fixture-scene]
[data-fixture-mode]
[data-fixture-ready="true"]
[data-fixture-status]
```

`static-fallback` uses a fixture-only capability simulation that makes `backdrop-filter` report as
unsupported. It does not modify the library capability probe or runtime code.
