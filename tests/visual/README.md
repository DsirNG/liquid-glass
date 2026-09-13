# Visual regression fixture

This fixture is intentionally independent from the Playground layout. It uses the real Vue
`LiquidGlass` component with deterministic CSS-only backgrounds, fixed element sizes, disabled
interaction, and disabled animation/transition styles.

The fourteen scenes and their expected runtime modes are defined in `manifest.json`. Each fixture root
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
/tests/visual/fixtures/index.html?scene=glass-card-default
/tests/visual/fixtures/index.html?scene=glass-card-rich-content
/tests/visual/fixtures/index.html?scene=glass-card-interactive
/tests/visual/fixtures/index.html?scene=glass-card-disabled
/tests/visual/fixtures/index.html?scene=glass-dock-horizontal
/tests/visual/fixtures/index.html?scene=glass-dock-vertical
/tests/visual/fixtures/index.html?scene=glass-dock-disabled
/tests/visual/fixtures/index.html?scene=glass-dock-custom-slot
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

The four `glass-card-*` scenes render the public `GlassCard` component with deterministic default,
rich-content, interactive, and disabled-interactive states. Their runtime status is checked through
an off-screen `LiquidGlass` probe configured with the same canonical material options; the captured
region contains only the GlassCard itself.

The four `glass-dock-*` scenes render the public `GlassDock` component with horizontal, vertical,
disabled-item, and custom-slot states. Dock interaction is disabled for deterministic screenshots;
the active item and item geometry remain explicit in each scene configuration.

## Canonical Chromium screenshot environment

The official visual baseline environment is the pinned Playwright Docker image
`mcr.microsoft.com/playwright:v1.55.0-noble`. It fixes the Linux distribution, Chromium build,
browser dependencies, and fonts used by both baseline generation and GitHub Actions. The runner
also fixes the viewport to `1440 × 1200`, device scale factor to `1`, prefers-reduced-motion, dark
color scheme, and disables animation and interaction in the fixture.

Do not generate official baselines with the host Windows/macOS browser. Use Docker Desktop locally
so the generated pixels come from the same environment as CI:

Generate or intentionally update all baselines with:

```bash
pnpm run visual:update:canonical
```

Compare against the checked-in baselines without updating them with:

```bash
pnpm run visual:test:canonical
```

The lower-level `visual:update` and `visual:test` commands remain available for debugging with a
locally installed browser, but their pixels are not the official baseline.

Screenshots are taken only after the fixture reports `phase=ready` and its `targetMode` and
`activeMode` match the manifest. Baselines live in `baselines/`; generated `actual/`, `diff/`, and
`reports/` files live under `artifacts/` and are ignored by Git.

The GitHub Actions visual job runs inside the same `v1.55.0-noble` image and uses the Chromium
already provisioned at `/ms-playwright`; it never updates baselines. When a visual change is
intentional, run `pnpm run visual:update:canonical`, review the changed PNGs, and commit them with
the related code. On failure, CI uploads the generated `actual/`, `diff/`, and `reports/`
directories.
