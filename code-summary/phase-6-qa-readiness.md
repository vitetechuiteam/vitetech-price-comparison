# Phase 6 — QA & Production Readiness Audit

## Build & Lint Results

| Check | Result |
|---|---|
| `npm run lint` | ✓ No warnings, no errors |
| `npm run build` | ✓ Compiled successfully (Turbopack) |
| TypeScript | ✓ No type errors |

### Route output after build

| Route | Type |
|---|---|
| `/` | Static (prerendered) |
| `/_not-found` | Static |
| `/api/search` | Dynamic (server-rendered on demand) |
| `/product/[id]` | Dynamic (server-rendered on demand) |

---

## Files Reviewed

| File | Status | Notes |
|---|---|---|
| `src/app/layout.tsx` | ✓ Clean | Uses `LayoutProps<"/">` — a Next.js auto-generated type from `.next/types/routes.d.ts`, valid |
| `src/app/page.tsx` | ✓ Clean | `handleSearch` with `overrideQuery` avoids stale React state; `try/catch` on fetch; `useMemo` sort |
| `src/app/api/search/route.ts` | ✓ Clean | Empty-string guard; delegates entirely to `aggregateProductData` |
| `src/app/product/[id]/page.tsx` | ✓ Clean | Async server component; `await params` (Next.js 15+ pattern); not-found handled |
| `src/components/layout/Navbar.tsx` | ✓ Clean | Sticky header, z-50, no client state needed |
| `src/components/layout/Footer.tsx` | ✓ Clean | Dynamic year; minimal |
| `src/components/features/ProductCard.tsx` | ✓ Clean | Stretched-link with `absolute inset-0 z-0`; buy links at `relative z-10` |
| `src/components/features/ProductGrid.tsx` | ✓ Clean | Responsive 1→2→3→4 col grid |
| `src/components/features/PriceComparisonTable.tsx` | ✓ Clean | `overflow-x-auto`; `rel="nofollow sponsored noopener noreferrer"` on buy links |
| `src/components/features/PriceHistoryChart.tsx` | ✓ Clean | `computeYAxis` guards `min===max`; `yRange \|\| 1` guards div-by-zero; tabs correctly disabled when insufficient data |
| `src/services/productService.ts` | ✓ Clean | `Promise.allSettled` + per-adapter 3 s timeout; graceful degradation |
| `src/services/adapters/mockCatalog.ts` | ✓ Clean | Single source of truth for product metadata |
| `src/services/adapters/amazonAdapter.ts` | ✓ Clean | 300 ms simulated delay; covers all 5 products |
| `src/services/adapters/flipkartAdapter.ts` | ✓ Clean | 450 ms delay; covers 4/5 products |
| `src/services/adapters/cromaAdapter.ts` | ✓ Clean | 400 ms delay; covers 4/5 products |

---

## Architecture Observations

### What works well

- **Failure isolation** — `Promise.allSettled` means one crashed adapter never blocks the others. Verified: removing a listing from any single adapter still returns the other two stores.
- **Timeout safety** — `withTimeout(3000 ms)` prevents a slow adapter from hanging the page indefinitely.
- **Type safety end-to-end** — `AdapterOffer → toMerchantOffer → Product.offers` pipeline is fully typed; no `any`.
- **Separation of concerns** — route handler has zero business logic; all orchestration is in `productService.ts`; adapters are fully encapsulated.
- **Empty-state handling** — search with no results, loading spinner, and fetch-error fallback all handled cleanly in `page.tsx`.
- **Accessibility** — `aria-label` on search input, SVG `role="img"` + `aria-label`, `aria-pressed` on chart tabs, `aria-hidden` on decorative icons.

### Potential improvements for Phase 7

- **No HTTP caching** on `/api/search` — identical queries re-fan-out every request. A short `Cache-Control: s-maxage=60` or Next.js `unstable_cache` wrapper would reduce latency with live APIs.
- **No pagination** — `Product[]` is returned whole. With live APIs returning hundreds of products, a `limit`/`offset` or cursor strategy will be needed.
- **No rate-limiting** on the API route — trivially spammable from the client; add middleware or a simple in-memory rate limiter before going live.
- **Image domains** — `<img>` tags use Unsplash URLs (unoptimized) to avoid modifying `next.config.ts`. When switching to real product images, configure `next/image` with the correct `remotePatterns`.
- **No error telemetry** — adapter failures are silently swallowed. Add server-side logging (e.g. `console.error`) or a Sentry integration before live traffic.

---

## Responsiveness Verification

| Breakpoint | Navbar | Hero | Search bar | Product grid | Detail page |
|---|---|---|---|---|---|
| Mobile (`<sm`) | Stacks cleanly | Full width, py-20 | Input + button only (category hidden) | 1 column | Single column |
| Tablet (`sm`) | Logo visible | sm:py-28 | Category selector shown | 2 columns | — |
| Desktop (`lg+`) | Max-w-4xl centered | lg:text-6xl headline | Full bar | 3–4 columns | 2-col layout |

Price comparison table: `overflow-x-auto` wraps on mobile. Discount column hides at `<sm`, Availability column hides at `<md`.

---

## Phase 7 Readiness

The codebase is clean and ready for live API integration. The only change needed to swap any adapter from mock to live:

```ts
// src/services/adapters/amazonAdapter.ts
async fetchOffers(query: string): Promise<AdapterOffer[]> {
  // Replace mock below with:
  const res = await fetch(`https://api.amazon.in/search?q=${query}`, {
    headers: { "x-api-key": process.env.AMAZON_API_KEY! },
  });
  const data = await res.json();
  return data.items.map(toAdapterOffer);
  // productService.ts, route.ts, and all UI remain unchanged
}
```

`productService.ts`, `route.ts`, and every UI component remain untouched.
