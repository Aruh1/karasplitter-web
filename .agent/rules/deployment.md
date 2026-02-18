---
description: Deployment and build configuration
activation: model_decision
---

# Deployment & Build

## Build
- `bun run build` — formats, runs tests, then builds Next.js
- Static export: set `NEXT_STATIC_EXPORT=true` for `output: "export"` mode
- Git commit hash injected at build time via `next.config.ts`

## GitHub Actions
- Workflows in `.github/workflows/`
- CI should use Bun runtime, not Node.js

## Environment
- `NEXT_STATIC_EXPORT` — toggles static export vs server mode
- `GIT_COMMIT_HASH` — auto-populated from git at build time
