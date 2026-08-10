# Phase 1 — Minimal Project Layout & Search Banner

**Date**: 2026-08-10  
**Status**: Complete  
**Build**: ✅ `npm run build` — zero TypeScript errors

---

## Files Deleted

| File | Reason |
|---|---|
| `public/file.svg` | Next.js scaffold boilerplate — not used by the app |
| `public/globe.svg` | Next.js scaffold boilerplate — not used by the app |
| `public/next.svg` | Next.js scaffold boilerplate — not used by the app |
| `public/vercel.svg` | Next.js scaffold boilerplate — not used by the app |
| `public/window.svg` | Next.js scaffold boilerplate — not used by the app |

`public/` now contains nothing (the favicon lives at `src/app/favicon.ico`).

---

## Files Created

### `src/components/layout/Navbar.tsx`

- **Type**: Server Component (no state needed)
- **Contents**: Brand link only — `TrendingDown` icon + "PriceCompare" text, both styled with `text-primary` design token
- **Behaviour**: Sticky at the top (`sticky top-0 z-50`), white background, single bottom border
- **Icons**: `TrendingDown` from `lucide-react` — no manual SVGs
- **Intentionally omitted**: nav links, search bar, mobile menu — this phase is layout only

### `src/components/layout/Footer.tsx`

- **Type**: Server Component
- **Contents**: A single centred copyright line using `new Date().getFullYear()`
- **Intentionally omitted**: columns, store links, social icons, newsletter — this phase is layout only

---

## Files Modified

### `src/app/layout.tsx`

Added two imports and restructured `<body>`:

```tsx
<body className="min-h-full flex flex-col">
  <Navbar />
  <main className="flex flex-col flex-1">{children}</main>
  <Footer />
</body>
```

- `flex-col` on `body` stacks Navbar → main → Footer vertically
- `flex-1` on `main` ensures it expands to push Footer to the bottom on short pages

### `src/app/page.tsx`

Completely replaced the Next.js boilerplate. Now renders:

1. **Eyebrow badge** — "Real-time Price Comparison across India" using `primary-subtle` / `primary-light` / `primary` tokens
2. **Headline** — "Find the Best Price" with `text-display` typography class; "Best Price" in `text-primary`
3. **Sub-headline** — single line of body copy
4. **Search bar** — controlled `<input>` (captures typing via `useState`) + amber search button with `Search` icon from `lucide-react`

No category grids, feature cards, stat rows, CTA banners, or store lists — those belong to later phases.

---

## Design Token Usage

All colours come from the Phase 0.1 CSS variables — no hardcoded hex values in components.

| Class used | Token | Resolves to |
|---|---|---|
| `text-primary` | `--brand-primary` | `#00bdcd` |
| `hover:bg-primary-dark` | `--brand-primary-dark` | `#009aaa` |
| `bg-primary-subtle` | `--brand-primary-subtle` | `#e6f9fb` |
| `border-primary-light` | `--brand-primary-light` | `#33cad7` |
| `text-foreground-muted` | `--fg-muted` | `#475569` |
| `bg-surface-subtle` | `--surface-subtle` | `#f8fafc` |
| `border-border` | `--border` | `#e2e8f0` |

---

## Testing Instructions

```bash
# Confirm zero build errors
npm run build

# Start local dev server
npm run dev
# Open http://localhost:3000
```

### Visual checklist

- [ ] Navbar is sticky at the top — "PriceCompare" brand name and icon are teal (`#00bdcd`)
- [ ] Page background is light slate (`#f8fafc`)
- [ ] "Find the **Best Price**" headline is centered; "Best Price" is teal
- [ ] Search input accepts typing
- [ ] Search button is teal, turns darker on hover
- [ ] Footer copyright is pinned to the bottom of the viewport even on a tall screen
- [ ] No boilerplate SVGs in `public/`
- [ ] No Next.js logo or Vercel links anywhere on the page
