# Contributing to Liquid Glass

Thank you for your interest in contributing to Liquid Glass!

## Architectural Guidelines

Liquid Glass strictly maintains a single-directional, framework-agnostic layered architecture:

```text
Vue Adapter (src/vue) ──► Core Facade (src/core) ──► Engine (src/engine) ──► Utils / Constants / Types
```

- **0% Framework in Core/Engine**: The `engine/`, `core/`, `utils/`, `constants/`, and `types/` layers must **never** import Vue or any UI framework. This is strictly enforced by ESLint `no-restricted-imports`.
- **Public API Isolation**: External users should consume the library exclusively via `@scope/liquid-glass` (Core) or `@scope/liquid-glass/vue` (Vue Adapter). Never expose private internal classes.

## Development Workflow

```bash
# Install dependencies
pnpm install

# Start Playground dev server
pnpm dev

# Type check
pnpm run type-check

# Run Linter & Stylelint
pnpm run lint
pnpm run lint:style

# Run Unit & Lifecycle Tests
pnpm run test

# Build Library
pnpm run build

# Run Package Smoke Test
pnpm run test:smoke
```

## Commit Message Convention

This repository strictly enforces [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools
