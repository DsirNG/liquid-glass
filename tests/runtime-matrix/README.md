# Browser runtime matrix

This check validates the runtime decision chain in real browser engines. It is intentionally not a
screenshot test:

```text
CapabilityProbe → CapabilityReport → resolveRenderPlan → RuntimeController → active backend
```

Run both supported engines with:

```bash
pnpm run runtime:matrix
```

Run one engine while debugging with:

```bash
pnpm run runtime:matrix -- --browser=firefox
pnpm run runtime:matrix -- --browser=webkit
```

The CI job uses `mcr.microsoft.com/playwright:v1.55.0-noble`, with the browser binaries provided by
that image. Firefox is expected to use the best available optical plan without a known restriction;
WebKit is expected to report the SVG backdrop displacement restriction and select the material
fallback. The assertions also allow a browser to select the static fallback when its raw CSS
capabilities are unavailable.
