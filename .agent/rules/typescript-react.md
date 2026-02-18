---
description: TypeScript and React component standards
activation: glob
glob: "**/*.{ts,tsx}"
---

# TypeScript & React Standards

## TypeScript
- Strict mode, use explicit types — avoid `any`
- Use `type` imports: `import type { Foo } from "..."`
- Prefer `interface` for object shapes, `type` for unions/aliases
- Export types from `src/lib/types.ts` when shared across modules

## React Components
- Use function components with named exports (`export default function ComponentName()`)
- Props interfaces named `{ComponentName}Props`
- Use `"use client"` only when the component uses hooks, event handlers, or browser APIs
- shadcn/ui components live in `src/components/ui/` — do not modify them directly
- Custom components live in `src/components/`

## Styling
- TailwindCSS 4 utility classes with CSS variable theming: `hsl(var(--primary))`
- No inline `style` attributes unless absolutely necessary
- Use shadcn/ui `cn()` utility from `src/utils/` for conditional class merging

## Core Logic API (`src/lib/`)
All processing logic lives in `src/lib/` as pure TypeScript — no React, no framework dependencies.

### ksplitter (`ksplitter.ts`)
- Stateless functions: input string → output string
- Key exports: `processAssFile()`, `extractActorsAndStyles()`, `deKtime()`, `str_TOkara_array()`
- Use pre-computed `Set` for O(1) lookups (character sets, vowels, consonants)
- Return `{ content: string; error: string | null }` for results with error handling
- New split modes or parsers should follow the existing pattern of small composable functions

### kanjitimer (`kanjitimer.ts`)
- Immutable state pattern: functions take `KanjiTimerState` → return new `KanjiTimerState`
- Key exports: `createKanjiTimerState()`, `acceptMatch()`, `undoMatch()`, `getOutputLine()`
- State transitions return `null` on invalid operations
- JSDoc comments on all public functions with `@param` and `@returns`
- Uses grapheme-aware segmentation for proper Unicode/CJK handling

### Adding New Logic
- Keep functions pure and framework-agnostic
- Define interfaces/types at the top of the file with section headers (`// === Types ===`)
- Export public API explicitly — re-export from `ksplitter.ts` if cross-module (e.g., `export * from "./kanjitimer"`)
- Co-locate tests as `*.test.ts` in the same directory

## Runtime
- **Bun** is the default runtime — use `bun` for all commands
- Never use `npm` or `yarn` — always `bun install`, `bun run dev`, `bun run build`, etc.
- Use `Bun.file()`, `Bun.write()` for file operations when writing server-side scripts
- Prefer Bun-native APIs over Node.js equivalents where available

## Formatting
- Biome handles formatting — tabs, double quotes
- Run `bun run format` before committing
