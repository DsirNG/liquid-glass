# Visual regression fixture

This fixture is intentionally independent from the Playground layout. It uses the real Vue
`LiquidGlass` component with deterministic CSS-only backgrounds, fixed element sizes, disabled
interaction, and disabled animation/transition styles.

The six scenes and their expected runtime modes are defined in `manifest.json`. Each fixture root
also exposes `data-visual-fixture` so the screenshot runner can capture only the glass fixture, not
the surrounding page.

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
[data-visual-fixture]
[data-fixture-scene]
[data-fixture-mode]
[data-fixture-ready="true"]
[data-fixture-status]
```

`static-fallback` uses a fixture-only capability simulation that makes `backdrop-filter` report as
unsupported. It does not modify the library capability probe or runtime code.

## Chromium screenshot baselines

6D-2 uses the locally available Chromium and `puppeteer-core` to run deterministic screenshots.
The runner fixes the viewport to `1440 × 1200`, device scale factor to `1`, prefers-reduced-motion,
dark color scheme, and disables animation and interaction in the fixture.

Generate or intentionally update all baselines with:

```bash
pnpm run visual:update
```

Compare against the checked-in baselines without updating them with:

```bash
pnpm run visual:test
```

Screenshots are taken only after the fixture reports `phase=ready` and its `targetMode` and
`activeMode` match the manifest. Baselines live in `baselines/`; generated `actual/`, `diff/`, and
`reports/` files live under `artifacts/` and are ignored by Git.

The GitHub Actions visual job provisions the pinned Chromium version from its workflow and runs
`pnpm run visual:test` only. It never updates baselines. When a visual change is intentional, run
`pnpm run visual:update` locally, review the changed PNGs, and commit them with the related code.
On failure, CI uploads the generated `actual/`, `diff/`, and `reports/` directories.
