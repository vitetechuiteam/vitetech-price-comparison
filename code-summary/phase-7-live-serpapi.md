# Phase 7 — Live SerpAPI Integration

## Goal
Replace all mock data with real product data from SerpAPI's Google Shopping engine, showing live prices from multiple Indian stores (Amazon, Flipkart, Croma, Reliance Digital, etc.) — similar to BuyHatke.

---

## What Was Built / Changed

### Architecture Change: 3 Adapters → 1 Unified Adapter

**Before:** Three separate adapters (`amazonAdapter`, `flipkartAdapter`, `cromaAdapter`) each made identical `google_shopping` API calls, wasting 3× the credits and all timing out at the 3-second threshold.

**After:** One `serpApiAdapter.ts` makes a single `google_shopping` call. SerpAPI returns up to 40 results from all stores simultaneously. The `productService` groups them by `product_id` to show multiple stores per product.

---

## New / Modified Files

### `src/services/adapters/serpApiAdapter.ts` *(new)*
- Single unified adapter replacing the 3 store-specific adapters
- Calls `google_shopping` engine with `gl=in` (India), `hl=en`
- Handles SerpAPI's Indian response format:
  - Uses `r.link ?? r.product_link` (SerpAPI India now returns `product_link` instead of `link`)
  - Filters out `second_hand_condition` listings (pre-owned/refurbished)
  - `parsePrice()` handles both `extracted_price` (number) and raw `price` string fallback
- Maps each result to `AdapterOffer` with `product_id` as the grouping key
- Results are cached by Next.js for 5 minutes (`next: { revalidate: 300 }`)

### `src/services/productService.ts` *(updated)*
- Registers only `serpApiAdapter` (1 API call per search vs 3 before)
- Adapter timeout increased: `3000ms → 20000ms` (SerpAPI India takes 4–8s)
- Deduplication: per product group, keeps the lowest price per merchant name
- After building the product list, calls `setCachedProducts()` to populate the product cache

### `src/services/productCache.ts` *(new)*
- Module-level TTL cache (5-minute expiry) mapping `product.id → Product`
- Populated by `productService` after every search
- Read by the product detail page for instant, zero-credit lookups
- Falls back transparently: cache miss triggers `getProductByIdFromSerpApi()`

### `src/services/serpApiProductService.ts` *(new)*
- `getProductByIdFromSerpApi(id)`: calls SerpAPI `google_product` engine for per-store prices
- Only attempted for numeric IDs (Google's catalog IDs are 16–19 digit numbers)
- Response cached for 1 hour (`next: { revalidate: 3600 }`) to minimise credit usage
- Used as fallback when cache misses (e.g., direct URL access, serverless cold start)

### `src/app/api/search/route.ts` *(updated)*
- Added `export const maxDuration = 60` — prevents Vercel from killing the request before SerpAPI responds

### `src/app/product/[id]/page.tsx` *(updated)*
- Removed dependency on `mockProductAdapter.getProductById()`
- Now resolves product via: `getCachedProduct(id) ?? getProductByIdFromSerpApi(id)`
  - Cache hit (normal flow after search): zero extra API credits
  - Cache miss (direct URL / serverless): 1 additional credit via `google_product`
- Added `export const maxDuration = 60` for Vercel timeout

### `src/components/features/ProductCard.tsx` *(updated)*
- Fixed broken stretched-link pattern
  - **Before:** `<Link>` was an absolute-positioned sibling — clicks on image/text did NOT bubble to it
  - **After:** `<Link>` is inside `<h3>` with `after:absolute after:inset-0 after:content-['']` — the `::after` pseudo-element covers the entire card (positioned relative to the `article` container)
- Merchant buy links wrapped in `relative z-10` list to sit above the `::after` overlay
- Removed `relative` from the image container (not needed)

---

## API Credit Usage

| Action | Credits Used |
|--------|-------------|
| Search | 1 (single `google_shopping` call) |
| Product detail (after search) | 0 (served from cache) |
| Product detail (direct URL / cold start) | 1 (`google_product` call, cached 1hr) |

---

## Key Debugging Notes

### SerpAPI India Response Format Change
Google Shopping results for `gl=in` now return `product_link` (Google's internal URL) instead of `link` (direct store URL). The old code checked `!r.link` which rejected all 40 results → "No products found". Fixed by using `r.link ?? r.product_link`.

### Why 3-Adapter Timeout Was the Root Cause
Each of the 3 adapters had a 3-second timeout racing against SerpAPI's 4–8 second response time for India. All 3 timed out → `allOffers` was always empty → search always returned `[]`.

---

---

## Bug Fixes Applied After Initial Phase 7

### Fix: Product detail page always showed "Product not found"
**Root cause:** Next.js Turbopack runs the API route (`/api/search`) and server components (`/product/[id]`) in separate worker processes. Module-level `Map` in `productCache.ts` was not shared across workers — each worker had its own empty instance.

**Two-layer fix applied:**

1. **`productCache.ts`** — switched from module-level `Map` to `global.__productCache`. Node.js `global` IS shared across Turbopack workers (it's a runtime primitive, not a module reference). Same pattern Next.js recommends for database clients in dev mode.

2. **`ProductCard.tsx`** — encodes the full product snapshot into the URL as `?d=<JSON>`. When navigating to the product detail page, the page decodes this param first (zero API calls, works on Vercel serverless and across all environments). Global cache and `google_product` API serve as fallbacks for direct URL access.

**Product detail resolution priority:**
1. URL `?d=` param (fastest — from ProductCard click)
2. `global.__productCache` (fast — within same server process)
3. `getProductByIdFromSerpApi()` (1 API credit — for direct URL access)
4. Show "Product not found"

### Fix: Stretched-link card clicks not working on image
**Root cause:** The original `<Link className="absolute inset-0 z-0">` was a DOM sibling of the image div. Click events on the image bubble up to `<article>`, not to a sibling `<Link>`.

**Fix:** Moved the `<Link>` inside the title `<h3>` and used `after:absolute after:inset-0 after:content-['']`. The `::after` pseudo-element (absolute-positioned within the Link, containing block = the `position:relative` article) correctly overlays the entire card. Merchant buy links stay above it via `relative z-10`.

---

### Fix: Back button losing search results
**Root cause:** Search state (`query`, `results`) lived only in React state. Navigating to the product detail page and pressing browser back remounted the home page with empty state.

**Fix in `src/app/page.tsx`:**
- Added `useSearchParams()` and `useRouter()` (requires `<Suspense>` wrapper — `Home` now wraps `SearchContent` in `<Suspense>`)
- On search: `router.push('/?q=<query>')` updates the URL — browser back/forward now restores the URL
- On mount: `useEffect` reads `?q=` from URL and auto-runs the search — results are restored after browser back
- `didInitialSearch` ref prevents double-searching on mount

### Fix: Buy Now → Google Shopping page (not direct store link)
**Root cause:** The product detail page was showing URL-param data (1 store with `product_link` = Google URL). `getProductByIdFromSerpApi` was never being called because URL param data succeeded first.

**Fix in `src/app/product/[id]/page.tsx`:**
- Changed resolution order: **always call `getProductByIdFromSerpApi` first** (google_product engine returns direct store URLs like amazon.in, flipkart.com, etc.)
- URL param data kept as `fallback` only — used if google_product fails
- `liveProduct ?? fallback` — live multi-store data with direct links takes priority

### Fix: Multi-store comparison showing only 1 store
**Root cause:** google_shopping returns `multiple_sources: true` with only the cheapest store per product. All 40 results had 1 store each. URL param data was 1 store. google_product was never called.

**Fix:** `getProductByIdFromSerpApi` calls SerpAPI `google_product` engine which returns all sellers (Amazon, Flipkart, Croma, Reliance Digital, etc.) with their prices and direct store links. This is now always called on the product detail page.

**Updated `src/services/serpApiProductService.ts`:**
- `extractPriceList()` handles multiple response key names: `prices`, `buying_options`, `online_sellers`, `sellers`
- `cache: "no-store"` instead of `revalidate: 3600` — prevents dev mode from caching null responses
- Added complete logging: response keys, product_results keys, price list count, first entry
- Error handling wrapped in try/catch with detailed warnings

---

---

### Fix: Multi-store comparison — switched to `google_immersive_product` engine

**Root cause:** `google_product` engine returns HTTP 400 for all catalog IDs returned by `google_shopping` for India (`gl=in`). These IDs (18–20 digit numbers like `12118150274234285622`) are Google Shopping catalog IDs, not Google Product IDs. `google_product` does not accept them.

**Correct engine:** `google_immersive_product` with `page_token` (the `immersive_product_page_token` field present in every `shopping_results` entry). This is the same engine Google's own product comparison page uses internally.

**Changes made:**

1. **`src/types/adapter.ts`** — Added `pageToken?: string` to `AdapterOffer`

2. **`src/services/adapters/serpApiAdapter.ts`** — Added `immersive_product_page_token` to `SerpApiShoppingResult` interface; `toAdapterOffer()` now extracts it into `pageToken`

3. **`src/services/productCache.ts`** — Added `global.__pageTokenCache` (same Turbopack-safe global pattern). Exports `cachePageToken(productId, token)` and `getCachedPageToken(productId)`

4. **`src/services/productService.ts`** — After deduplication, finds any offer with a `pageToken` and calls `cachePageToken(meta.productId, pageToken)` — token stored for the product detail page to consume

5. **`src/services/serpApiProductService.ts`** — Added `getProductByPageToken(pageToken, productId, fallbackTitle, fallbackImage)`:
   - Calls `engine=google_immersive_product&page_token=<token>&gl=in&hl=en`
   - Collects sellers from `sellers`, `online_sellers`, `buying_options`, `prices` response fields
   - Deduplicates by merchant name (lowest price wins)
   - Maps to `MerchantOffer[]` with direct store links and out-of-stock detection
   - `getProductByIdFromSerpApi` kept as a last-resort fallback (numeric IDs only — rarely succeeds for India)

6. **`src/app/product/[id]/page.tsx`** — Updated resolution priority:
   1. `getCachedPageToken(id)` → `getProductByPageToken()` — all sellers, direct links (**primary path**)
   2. `getProductByIdFromSerpApi(id)` — fallback for direct URL access (numeric ID only)
   3. URL `?d=` param data — fallback if both API calls fail
   4. Global product cache — fallback for direct URL access without token

**Result:** Product detail page now shows all stores (Amazon, Flipkart, Zepto, Croma, etc.) with their actual prices and direct "Buy Now" links to each store.

---

## Phase 8+ Readiness
- Add `unstable_cache` from Next.js for cross-invocation caching on Vercel
- Add Redis/Upstash for persistent product cache across serverless instances
- Add price alert feature (track price history via scheduled SerpAPI calls)
- Add pagination for search results (SerpAPI supports `start` parameter)
