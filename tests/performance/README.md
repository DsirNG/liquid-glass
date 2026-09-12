# Phase 6E performance contracts

The performance suite has two separate responsibilities:

- `pnpm run test:performance` runs behavioral contracts and fails when the runtime performs an unnecessary field rebuild, commits stale work, or leaves lifecycle resources behind.
- `pnpm run bench` reports micro-benchmark timings for the same runtime paths. It intentionally has no absolute time threshold because hosted CI runners vary.

The contracts cover:

- synchronous, filter, and material updates;
- stale field candidates and resize bursts;
- pointer interaction fast paths;
- 10- and 50-instance create/update/resize/destroy cycles;
- observer, listener, backend, optical asset, SVG filter, and DOM cleanup.

The benchmark files are kept next to the contracts so the measured paths remain aligned with the behavior that CI protects.
