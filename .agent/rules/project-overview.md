---
description: Core project context for karasplitter-web
activation: always_on
---

# Karasplitter Web — Project Overview

## What This Is

A web-based karaoke timing tool for `.ass` (Advanced Substation Alpha) subtitle files. Two modes:

- **Splitter**: Splits karaoke lines by syllable/word/character and inserts `{\k}` timing tags
- **Kanji Timer**: Transfers romaji timing to kanji lines

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: TailwindCSS 4 + shadcn/ui (Radix primitives)
- **Formatting**: Biome (tabs, double quotes)
- **Testing**: Vitest
- **Linting**: ESLint (via eslint-config-next)

## Project Structure

```
src/
├── app/           # Next.js App Router pages (page.tsx, layout.tsx, how-to-use/)
├── components/    # React components (SplitOptions, TextInput, ResultPreview, ThemeToggle)
│   └── ui/        # shadcn/ui primitives (button, card, label, select, switch, radio-group)
├── hooks/         # Custom React hooks
├── lib/           # Core logic — pure TypeScript, no React
│   ├── ksplitter.ts      # Syllable/word/char splitting engine
│   ├── kanjitimer.ts     # Romaji→Kanji timing transfer
│   ├── constants.ts
│   ├── types.ts
│   └── utils.ts
└── utils/         # General utilities
```

## Key Conventions

- **Bun is the default runtime** — always use `bun` instead of `npm`, `yarn`, or `node`
  - `bun install`, `bun run dev`, `bun run build`, `bun run test`, `bun run format`
  - Use `bunx` instead of `npx` for one-off package execution
- Biome for formatting: **tabs**, **double quotes**
- Path alias: `@/` → `src/`
- Components use `"use client"` directive when needed
- Core logic in `src/lib/` is framework-agnostic (pure TS, no React imports)
- Tests co-located in `src/lib/` as `*.test.ts`
- Core logic API in `src/lib/` — pure TS (ksplitter, kanjitimer)
- Static export supported via `NEXT_STATIC_EXPORT=true`
