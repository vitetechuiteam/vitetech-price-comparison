# Phase 0.1 — Design Tokens, Theme Architecture, Typography & Icon Setup

**Date**: 2026-08-10  
**Status**: Complete

---

## 1. Icon Library

| Package | Version | Purpose |
|---------|---------|---------|
| `lucide-react` | ^1.31.0 | Standard UI icons (search, chevrons, star, tag, etc.) |

Usage example:
```tsx
import { Search, ChevronDown, Star } from "lucide-react";
<Search className="w-5 h-5 text-primary" />
```

---

## 2. Tailwind CSS Version Note

> **This project uses Tailwind CSS v4.**  
> Tailwind v4 has **no `tailwind.config.ts`** file. All theme customization is done via `@theme` blocks inside `src/app/globals.css`. Do not create or reference a `tailwind.config.ts`.

---

## 3. Color Design Tokens

### Brand Palette

| Token Name | CSS Variable | Hex Value | Tailwind Utility |
|---|---|---|---|
| Primary (Teal) | `--brand-primary` | `#00bdcd` | `bg-primary`, `text-primary`, `border-primary` |
| Primary Dark | `--brand-primary-dark` | `#009aaa` | `bg-primary-dark`, `text-primary-dark` |
| Primary Light | `--brand-primary-light` | `#33cad7` | `bg-primary-light`, `text-primary-light` |
| Primary Subtle | `--brand-primary-subtle` | `#e6f9fb` | `bg-primary-subtle` |
| Secondary (Gold) | `--brand-secondary` | `#edb960` | `bg-secondary`, `text-secondary`, `border-secondary` |
| Secondary Dark | `--brand-secondary-dark` | `#c9963a` | `bg-secondary-dark`, `text-secondary-dark` |
| Secondary Light | `--brand-secondary-light` | `#f4cf8e` | `bg-secondary-light`, `text-secondary-light` |
| Secondary Subtle | `--brand-secondary-subtle` | `#fdf6e8` | `bg-secondary-subtle` |

> **Note on Secondary color:** The original spec listed `#ed960` (5 hex digits, invalid). This was interpreted as `#edb960` (warm golden yellow). Confirm and update `--brand-secondary` in `globals.css` if a different value was intended.

### Semantic Tokens (Light Theme Baseline)

| Token | CSS Variable | Hex | Tailwind Utility |
|---|---|---|---|
| Surface | `--surface` | `#ffffff` | `bg-surface` |
| Surface Subtle | `--surface-subtle` | `#f8fafc` | `bg-surface-subtle` |
| Surface Muted | `--surface-muted` | `#f1f5f9` | `bg-surface-muted` |
| Surface Inverse | `--surface-inverse` | `#0f172a` | `bg-surface-inverse` |
| Border | `--border` | `#e2e8f0` | `border-border` |
| Border Strong | `--border-strong` | `#cbd5e1` | `border-border-strong` |
| Foreground | `--fg` | `#0f172a` | `text-foreground` |
| Foreground Muted | `--fg-muted` | `#475569` | `text-foreground-muted` |
| Foreground Subtle | `--fg-subtle` | `#94a3b8` | `text-foreground-subtle` |

### Feedback State Tokens

| Token | Hex | Utility |
|---|---|---|
| Success | `#16a34a` | `text-success`, `bg-success` |
| Warning | `#d97706` | `text-warning`, `bg-warning` |
| Error | `#dc2626` | `text-error`, `bg-error` |
| Info | `#0284c7` | `text-info`, `bg-info` |

---

## 4. Typography System

All typography classes are defined in `globals.css` under `@layer utilities`. Apply them as Tailwind class names.

### Display & Headings

| Class | Tailwind Equivalent | Usage |
|---|---|---|
| `.text-display` | `text-5xl font-extrabold tracking-tighter` | Hero sections |
| `.text-heading-1` | `text-4xl font-bold tracking-tight` | Page titles |
| `.text-heading-2` | `text-3xl font-bold tracking-tight` | Section headers |
| `.text-heading-3` | `text-2xl font-semibold` | Sub-section headers |
| `.text-heading-4` | `text-xl font-semibold` | Card titles |

### Body Copy

| Class | Tailwind Equivalent | Usage |
|---|---|---|
| `.text-body-lg` | `text-lg leading-relaxed` | Lead paragraphs |
| `.text-body` | `text-base leading-relaxed` | Default body text |
| `.text-body-sm` | `text-sm leading-relaxed` | Captions, sidebars |

### Supporting

| Class | Tailwind Equivalent | Usage |
|---|---|---|
| `.text-caption` | `text-xs font-medium tracking-widest uppercase` | Labels, tags |
| `.text-label` | `text-sm font-semibold tracking-wide` | Form labels |
| `.text-overline` | `text-xs font-bold tracking-widest uppercase` | Category tags |

### Price Display (tabular-nums for alignment)

| Class | Tailwind Equivalent | Usage |
|---|---|---|
| `.text-price-lg` | `text-4xl font-extrabold tabular-nums` | Featured product price |
| `.text-price` | `text-2xl font-bold tabular-nums` | Card price |
| `.text-price-sm` | `text-lg font-semibold tabular-nums` | Compact price |

### Convenience Shorthands
- `.text-muted` → `color: var(--fg-muted)` (#475569)
- `.text-subtle` → `color: var(--fg-subtle)` (#94a3b8)

---

## 5. Component Structure

An empty directory `src/components/ui/` has been created to house future atomic components:

```
src/
  components/
    ui/           ← atomic: Button, Card, Badge, Input, etc. (Phase 1+)
```

Convention:
- One component per file, named with PascalCase.
- Export from `src/components/ui/index.ts` barrel once components exist.
- All styling via Tailwind utility classes only — no inline styles.

---

## 6. How to Extend for Dark Mode

Dark mode can be enabled later by scoping overrides to a `[data-theme="dark"]` selector or Tailwind's `dark:` variant:

```css
[data-theme="dark"] {
  --surface:   #0f172a;
  --fg:        #f8fafc;
  --border:    #1e293b;
  /* override only the semantic variables — brand primitives stay unchanged */
}
```

---

## Files Changed

| File | Action |
|---|---|
| `package.json` | Added `lucide-react` dependency |
| `src/app/globals.css` | Full rewrite — brand CSS vars, `@theme` registration, base styles, typography utilities |
| `src/components/ui/.gitkeep` | Created — placeholder for future atomic components |
| `code-summary/phase-0.1-theme-setup.md` | Created — this file |

## Build Verified
`npm run build` passes with zero errors.
