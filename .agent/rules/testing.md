---
description: Testing standards and practices
activation: glob
glob: "**/*.test.ts"
---

# Testing Standards

## Framework
- **Vitest** — run with `bun run test` or `vitest run`
- Tests co-located with source in `src/lib/` (e.g., `ksplitter.test.ts`)

## Conventions
- Use `describe`/`it` blocks with clear descriptions
- Test pure functions in `src/lib/` directly — no React rendering needed
- Test edge cases: empty input, malformed `.ass` lines, unicode characters
- Keep tests fast — no network calls, no file I/O

## Running Tests
```bash
bun run test       # Run all tests once
vitest             # Watch mode
vitest run         # CI mode (no watch)
```
