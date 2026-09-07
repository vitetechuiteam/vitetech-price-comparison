# Phase 9 — UI Enhancements, Similar Products, Reviews & Layout Polish

## Goal
Improve the product detail page design, add similar products and customer reviews sections, fix image gallery thumbnails, reduce SerpAPI credit usage, add max-width layout, and apply various UX fixes across all pages.

---

## What Was Built / Changed

### 1. SerpAPI Credit Optimisation
**Problem:** Each search consumed 40+ credits due to parallel `google_immersive_product` enrichment calls during search.

**Fix:** Removed all enrichment from `aggregateProductData`. Now 1 search = 1 credit. The immersive API is called only when the user opens a product detail page (lazy, on demand).

**Files changed:**
- `src/services/productService.ts` — removed enrichment loop; kept `cachePageToken` for detail-page lazy fetch
- `src/services/adapters/serpApiAdapter.ts` — reduced `num` from `"100"` to `"20"`

---

### 2. Product Detail Page Redesign
Redesigned the hero section to a single white card with image on the left and info on the right.

**New elements:**
- Single card wrapper (`rounded-2xl border bg-surface shadow-sm`) for image + info panels
- Rating shown as a green pill badge below the title
- "Price Range Across Stores" box (`bg-orange-50 ring-orange-100`) with tag icon, large lowest price, strikethrough highest, and "Save ₹X (Y%)" green chip
- Full-width green "Buy at Best Price" CTA button

**Files changed:**
- `src/app/product/[id]/page.tsx` — new hero layout, rating display, price range box, savings chip

---

### 3. Product Image Gallery Fixes
**Problems:**
- Gallery thumbnails never appeared (API rarely returns multiple images for Indian products)
- `onError` event handler caused a Server Component error

**Fixes:**
- `productService.ts` — collects unique thumbnails from all merchant offers (Amazon/Flipkart/Croma each supply their own image) and stores as `images[]` on the product — zero extra credits
- `ProductCard.tsx` — added `images` and `rating`/`reviews` to the URL snap so the detail page snap always carries gallery data
- `serpApiProductService.ts` — seeds `allImages` with `fallbackImage`; checks `thumbnails`, `images`, `product_images`, and `media` fields; limit raised from 5 to 8
- `product/[id]/page.tsx` — merges `liveProduct.images`, `fallback.images`, and `cachedProduct.images` (deduped) to maximise gallery entries
- `ProductImageGallery.tsx` — removed `onError` JS handler (incompatible with Server Components); replaced with CSS-only fallback (initial letter behind icon)

---

### 4. Rating Fix on Detail Page
**Problem:** Rating showed on search cards but not on the detail page because:
1. The URL snap did not carry `rating`/`reviews`
2. The live product API does not return rating

**Fix:**
- `ProductCard.tsx` — added `rating` and `reviews` to the snap
- `product/[id]/page.tsx` — merges `liveProduct.rating ?? cachedProduct.rating ?? fallback.rating` so the search-result rating always propagates

---

### 5. Store URL Search (Amazon / Flipkart)
When the user pastes a full product URL into the search bar, the matching product is boosted to position #1.

**Files changed:**
- `src/services/productService.ts` — `parseQueryUrl()` extracts ASIN from Amazon URLs and item ID from Flipkart URLs; clean keyword sent to SerpAPI; exact match sorted to top

---

### 6. Similar Products Section
Shows the other results from the same search below the price comparison table on the detail page.

**Implementation:**
- `src/services/productCache.ts` — added `setRecentSearchResults` / `getRecentSearchResults` (5-minute TTL, same global-cache pattern)
- `src/services/productService.ts` — calls `setRecentSearchResults(products)` after every search
- `src/components/features/SimilarProducts.tsx` — new component; renders up to 8 products (excluding current) in a responsive grid using `ProductCard`
- `src/app/product/[id]/page.tsx` — fetches from cache and renders `<SimilarProducts>` below price history

Navigating to a similar product also shows its own similar products (the cache remains valid for 5 minutes).

---

### 7. Customer Reviews Section (Option A — no extra credits)
Parses review data from the `google_immersive_product` API response (same call already made for sellers).

**Files changed:**
- `src/types/product.ts` — added `ReviewItem` interface; added `reviewsList?: ReviewItem[]` to `Product`
- `src/services/serpApiProductService.ts` — extended `ImmersiveProductResult` with `reviews`, `customer_reviews`, `top_reviews` fields; parses up to 6 reviews per product
- `src/components/features/ProductReviews.tsx` — new component; shows overall rating badge, then individual cards (stars, date, source, title, content, author)
- `src/app/product/[id]/page.tsx` — renders `<ProductReviews>` between price history and similar products when review data is available

---

### 8. Layout & Max-Width
**Problem:** On wide monitors (1440px+) content stretched too wide.

**Fix:** Applied `max-w-screen-2xl mx-auto` (1536px cap) to both:
- `src/app/layout.tsx` — `<main>` element
- `src/components/layout/Navbar.tsx` — inner header container

Logo and page content now stay aligned at all zoom levels.

---

### 9. Navbar & Logo Improvements
- Logo size increased: normal `200×45px`, scrolled `150×34px`
- Search bar visible on both `/search` and `/product/` routes
- Navbar inner container uses `max-w-screen-2xl` to align with body content

---

### 10. Back Button Fix
`BackButton.tsx` colour changed from `text-foreground-muted` (CSS variable, potentially transparent) to explicit `text-gray-500 hover:text-gray-800` so the "← Back to results" link is always visible.

---

### 11. Logo & Favicon SVG Alignment
- `public/logo.svg` — added `preserveAspectRatio="xMinYMid meet"` to fix the ~32px transparent left gap that was causing the logo to appear indented vs. body content
- `public/fav-icon.svg` — replaced with the new BuyDaash icon (orange flame/B mark)

---

### 12. Whole-Card Click on Search Results
`ProductCard.tsx` — removed `after:pointer-events-none` from the overlay Link so the entire card is clickable, not just the title. The buy icon inside `relative z-10` remains independently clickable.

---

### 13. Search Page Padding Alignment
`src/app/search/page.tsx` — container padding updated to `px-6 sm:px-10` to match the header, aligning content left edge with the logo.

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Added `max-w-screen-2xl mx-auto` to `<main>` |
| `src/app/product/[id]/page.tsx` | Full hero redesign, rating merge, images merge, reviews, similar products |
| `src/app/search/page.tsx` | Padding alignment |
| `src/components/features/BackButton.tsx` | Explicit gray colour |
| `src/components/features/ProductCard.tsx` | Whole-card click; `images`, `rating`, `reviews` in snap |
| `src/components/features/ProductImageGallery.tsx` | Removed `onError`; CSS-only fallback |
| `src/components/features/ProductReviews.tsx` | **New** — customer reviews section |
| `src/components/features/SimilarProducts.tsx` | **New** — similar products grid |
| `src/components/layout/Navbar.tsx` | Max-width, logo size, search bar on detail page |
| `src/services/adapters/serpApiAdapter.ts` | `num` reduced to 20 |
| `src/services/productCache.ts` | Added recent-search-results cache |
| `src/services/productService.ts` | Removed enrichment, URL parsing, multi-thumbnail gallery, recent results cache |
| `src/services/serpApiProductService.ts` | Broader image field detection, review parsing, fallbackImage seeding |
| `src/types/product.ts` | Added `ReviewItem`, `reviewsList`, `images` to `Product` |
| `public/fav-icon.svg` | Replaced with new BuyDaash icon |
| `public/logo.svg` | Added `preserveAspectRatio="xMinYMid meet"` |
