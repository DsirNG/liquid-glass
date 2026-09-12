# Release checklist

This checklist is the publication gate for the next npm beta. The checked items describe
repository contracts already present on `master`; the final publish remains a manual release
action.

## Engineering gates

- [x] Public API contract tests
- [x] Unit and lifecycle tests
- [x] Browser Runtime Matrix: Chromium, Firefox, and Playwright WebKit
- [x] Canonical Chromium visual regression
- [x] Performance behavior contracts and micro-benchmarks
- [x] Type check
- [x] ESLint and Stylelint
- [x] Library build and declaration generation
- [x] Package smoke test
- [x] Playground production build

## Release polish

- [x] README documents the public API and real runtime behavior
- [x] Browser and fallback support matrix documented
- [x] Full / Approximate / Unsupported parameter semantics documented
- [x] Playground runtime observability documented
- [x] CHANGELOG added
- [x] Package repository, homepage, issue tracker, keywords, and license metadata added
- [ ] Confirm final version and changelog heading
- [ ] Run `pnpm pack` and inspect the tarball contents
- [ ] Publish the npm beta with an explicit release command
- [ ] Create the GitHub release and attach release notes

## Verification commands

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run lint:style
pnpm run type-check
pnpm run test
pnpm run test:performance
pnpm run runtime:matrix
pnpm run visual:test:canonical
pnpm run build
pnpm run test:smoke
pnpm run build:playground
pnpm pack
```

Official visual baselines must be generated with the pinned Playwright
`mcr.microsoft.com/playwright:v1.55.0-noble` environment. Do not replace the visual threshold
with a large diff allowance to accommodate host-specific rendering.
