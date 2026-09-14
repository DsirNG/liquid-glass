# Chromium backdrop feasibility

This fixture is the Phase 8D-0B proof that the existing SVG filter path receives a live backdrop
signal in Chromium. It creates one real public `LiquidGlass` instance, clones its generated filter,
appends the unconnected Phase 8D-0A diagnostic graph, and applies the diagnostic output to that same
host element.

The three scenes verify:

- `split-background`: local response appears at the dark/light boundary;
- `dynamic-background`: filter output follows a dark-to-light backdrop change;
- `moving-background`: the local response follows a moved split boundary.

The runner also asserts that the runtime remains a single full-optical instance, its generated field
count and filter signature stay unchanged, the original filter receives no mutations, and the public
status remains `full-optical`/`ready`. Background updates are CSS-only; the runtime does not sample
pixels, call `requestAnimationFrame`, or rebuild the optical field.

Run with the host browser for development:

```bash
pnpm run backdrop:feasibility
```

Run in the canonical Playwright 1.55.0 Noble environment:

```bash
pnpm run backdrop:feasibility:canonical
```

The screenshots and JSON report are diagnostic artifacts under
`tests/visual/artifacts/backdrop-feasibility/`; they are ignored and are not baselines.
