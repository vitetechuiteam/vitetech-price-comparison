# CLAUDE.md — AI Session Guidelines for vitetech-price-comparison

This file governs how Claude (or any AI coding assistant) must behave in this repository.

## Core Rules

### 1. Language & Styling
- All code must be written in **TypeScript**. No plain `.js` files inside `src/`.
- Styling must use **Tailwind CSS** utility classes. Do not introduce CSS-in-JS libraries, styled-components, or raw CSS modules unless explicitly approved.

### 2. Inspect Before Modifying
- **Always read the target file(s) before making any changes.** Never overwrite blindly.
- Understand the existing structure, imports, and conventions before editing.

### 3. Scope Discipline
- Only touch files that are **directly relevant** to the current task.
- Do not refactor, reformat, rename, or "clean up" unrelated files.
- Do not implement features belonging to a future phase unless explicitly instructed.
- If in doubt about scope, ask before acting.

### 4. Build Verification
- After completing any implementation task, run `npm run build` to confirm the project compiles with zero errors.
- Do not mark a task as done if the build fails.

### 5. File & Folder Conventions
- App routes live under `src/app/` following Next.js App Router conventions.
- Shared components go in `src/components/`.
- Utility functions go in `src/lib/`.
- Types and interfaces go in `src/types/`.
- Phase documentation goes in `code-summary/`.

### 6. No Untracked Side Effects
- Do not install new npm packages without explicit user approval.
- Do not modify `next.config.ts`, `tsconfig.json`, or `tailwind.config.ts` without explicit instruction.
- Do not commit, push, or create pull requests unless explicitly asked.

## Phase Awareness
Each development phase is documented in `code-summary/`. Read the relevant phase summary before starting work to understand what has already been built.
