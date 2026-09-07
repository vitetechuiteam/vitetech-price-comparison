# Phase 8 — Direct Store URLs, Image Gallery, Auth UI & UX Polish

## Goal
Resolve the Google Shopping redirect link problem by fetching direct store URLs at search time, add a multi-image gallery on the detail page, introduce a sign-in / create account auth modal in the navbar, and apply a series of UX improvements to the search and detail pages.

---

## What Was Built / Changed

### 1. Direct Store URLs via Immersive Product API (search-time enrichment)

**Problem:** SerpAPI's `google_shopping` engine returns only Google Shopping page URLs (`product_link` with `ibp=oshop`) for Indian results — the `link` field is `undefined` for every result. Clicking the buy icon was sending users to `google.com` instead of the actual store.

**Root cause discovery:** Added temporary `[URL-DEBUG]` logging and confirmed:
- `link` = `undefined` for all Indian shopping results
- `product_link` = Google Shopping page URL (not a direct store link)

**Fix:** After building the product list from the search results, `productService.ts` now calls `getProductByPageToken()` (the same `google_immersive_product` endpoint the detail page uses) in parallel for every product that has a `pageToken`. This replaces Google Shopping URLs with real store links.

**Files changed:**
- `src/services/productService.ts` — added parallel enrichment loop using `Promise.allSettled`; also updates `imageUrl` and `images` from the enriched product
- `src/services/adapters/serpApiAdapter.ts` — added `pickBestUrl()` helper that prefers non-Google domains; removed temporary debug logging

```typescript
// productService.ts — enrichment added after product list is built
await Promise.allSettled(
  products.map(async (product) => {
    const token = pageTokenMap.get(product.id);
    if (!token) return;
    const enriched = await getProductByPageToken(token, product.id, product.title, product.imageUrl);
    if (enriched && enriched.offers.length > 0) {
      product.offers       = enriched.offers;
      product.lowestPrice  = enriched.lowestPrice;
      product.highestPrice = enriched.highestPrice;
      if (enriched.images)   product.images   = enriched.images;
      if (enriched.imageUrl) product.imageUrl = enriched.imageUrl;
    }
  })
);
```

**Trade-off:** Each search now costs 1 (shopping) + N (immersive, one per unique product) SerpAPI credits. The `maxDuration = 60` on the API route accommodates the extra parallel calls.

---

### 2. Multi-Image Gallery on Product Detail Page

**What changed:**
- `src/types/product.ts` — added `images?: string[]` field to `Product`
- `src/services/serpApiProductService.ts` — `getProductByPageToken` now collects up to 5 images from `pr.thumbnails` + `pr.images`, deduplicates, and stores them in `product.images`; same done in `getProductByIdFromSerpApi` fallback
- `src/components/features/ProductImageGallery.tsx` *(new)* — `"use client"` component with:
  - Large selected image at top
  - Horizontal thumbnail strip below (only shown when 2+ images)
  - Orange border on active thumbnail
  - `useState` tracks selected index
- `src/app/product/[id]/page.tsx` — replaced single `<img>` with `<ProductImageGallery images={...} alt={...} />`

```typescript
// serpApiProductService.ts — collecting multiple images
const allImages = [...(pr.thumbnails ?? []), ...(pr.images ?? [])]
  .filter((u, i, arr) => u && arr.indexOf(u) === i) // deduplicate
  .slice(0, 5);
```

---

### 3. Search Page: Best Deal Store Only on Cards

Each product card in the search results now shows only the single best-deal (lowest price) store row instead of all available stores. Full store comparison remains on the detail page.

**File:** `src/components/features/ProductCard.tsx`

```typescript
// Show only the first (cheapest) offer on the search card
{product.offers.slice(0, 1).map((offer) => { ... })}
```

---

### 4. Price Range Slider Filter

Replaced the two number input fields (Min/Max) with a dual-handle range slider.

**Implementation:** Two overlapping `<input type="range">` elements with `pointer-events-none` on the track and `pointer-events-auto` on the thumbs via Tailwind's arbitrary pseudo-element selectors. Active range fill is a positioned `<div>` calculated from current min/max percentages.

**File:** `src/app/search/page.tsx`

```tsx
// Thumb styling via Tailwind arbitrary pseudo-element values
const THUMB =
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 ..." +
  "[&::-moz-range-thumb]:pointer-events-auto ...";
```

- Slider only renders when `priceStats.max > priceStats.min` (requires loaded products)
- Step size auto-calculated: `Math.max(100, Math.round(span / 100) * 10)`
- Setting slider to extreme (min or max) resets filter to `null` (no filter)

---

### 5. Auth Modal in Navbar

**File:** `src/components/layout/Navbar.tsx`

Added a full Sign In / Create Account modal and user session state (UI-only, no backend).

**Guest state:**
- "Sign In" button with `UserCircle` icon replaces bare icon

**Auth modal features:**
- Two tabs: Sign In / Create Account (toggle)
- Fields: Name (signup only), Email, Password with show/hide toggle (`Eye`/`EyeOff`)
- Client-side validation: valid email format, min 6-char password, name required for signup
- Error message shown in a red pill
- Tab switch link at bottom

**Signed-in state:**
- Orange avatar circle showing user's first initial
- Username truncated next to avatar
- `ChevronDown` indicator
- Click → dropdown showing full name, email, and Sign Out button
- Dropdown closes on outside click (via `useRef` + `mousedown` listener)

```typescript
interface AuthUser { name: string; email: string }
// State lives in Navbar — no backend yet
const [user, setUser] = useState<AuthUser | null>(null);
```

---

### 6. UX Cleanup

| Change | File |
|---|---|
| Removed category label from product cards (was showing raw search query) | `ProductCard.tsx` |
| Removed SKU line from product detail page | `product/[id]/page.tsx` |
| Title text on detail page changed from `text-foreground` to `text-gray-900` for better contrast | `product/[id]/page.tsx` |
| Renamed all BuyDash references to BuyDaash across layout and pages | `layout.tsx`, `page.tsx`, `Navbar.tsx` |
| Updated logo (`/public/logo.svg`) and favicon (`/public/fav-icon.svg`) to BuyDaash branding | `public/` |

---

## Files Added
| File | Purpose |
|---|---|
| `src/app/search/page.tsx` | Search results page (moved from inline route) |
| `src/components/features/ProductImageGallery.tsx` | Interactive multi-image gallery for detail page |
| `code-summary/phase-8-ux-polish.md` | This document |

## Files Modified
| File | Key changes |
|---|---|
| `src/types/product.ts` | Added `images?: string[]` to `Product` |
| `src/services/productService.ts` | Parallel immersive enrichment for direct store URLs + images |
| `src/services/adapters/serpApiAdapter.ts` | `pickBestUrl()` smart URL selection; removed debug logging |
| `src/services/serpApiProductService.ts` | Collects up to 5 images from immersive API response |
| `src/components/features/ProductCard.tsx` | Best-deal-only store row; removed category label |
| `src/components/layout/Navbar.tsx` | Full auth modal, avatar, signed-in dropdown |
| `src/app/product/[id]/page.tsx` | Image gallery; removed SKU; better title color |
| `src/app/search/page.tsx` | Dual-handle price range slider; price filter logic |
| `public/logo.svg` | BuyDaash logo |
| `public/fav-icon.svg` | BuyDaash favicon |

---

## Known Limitations / Future Work
- Auth is UI-only (state lives in component memory, lost on page refresh). Wire to Supabase Auth or similar for persistence.
- Some products may not have a `pageToken` (no immersive product page in Google's index) — those retain Google Shopping page links as fallback.
- Image count depends on what SerpAPI's immersive endpoint returns; some products may only have 1 image.
