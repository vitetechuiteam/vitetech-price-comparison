# Phase 5 — Modular Backend Architecture (Mock-Based Transition)

## Created / Modified files

| File | Action |
|---|---|
| `src/types/adapter.ts` | Created — `AdapterOffer` type + `MerchantAdapter` interface |
| `src/services/adapters/mockCatalog.ts` | Created — shared product metadata catalogue |
| `src/services/adapters/amazonAdapter.ts` | Created — Amazon store adapter (mock) |
| `src/services/adapters/flipkartAdapter.ts` | Created — Flipkart store adapter (mock) |
| `src/services/adapters/cromaAdapter.ts` | Created — Croma store adapter (mock) |
| `src/services/productService.ts` | Created — orchestration layer (`aggregateProductData`) |
| `src/app/api/search/route.ts` | Created — `GET /api/search?q=` Next.js route handler |
| `src/app/page.tsx` | Updated — removed direct adapter import; search now calls `/api/search` |

---

## Architecture overview

```
Browser (page.tsx)
    │  GET /api/search?q=iphone
    ▼
app/api/search/route.ts          ← thin route handler, no business logic
    │  aggregateProductData(query)
    ▼
src/services/productService.ts   ← orchestration layer
    │  Promise.allSettled + 3 s timeout per adapter
    ├─▶ amazonAdapter.fetchOffers(query)
    ├─▶ flipkartAdapter.fetchOffers(query)
    └─▶ cromaAdapter.fetchOffers(query)
         │
         │ AdapterOffer[] (extends MerchantOffer + product context)
         ▼
    group by productId → strip adapter fields → sort offers → return Product[]
```

---

## Type definitions (`src/types/adapter.ts`)

```ts
// Extends MerchantOffer with product-context fields needed for aggregation
interface AdapterOffer extends MerchantOffer {
  productId: string;
  productTitle: string;
  productCategory: string;
  productImageUrl: string;
  productSku: string;
  priceHistory?: PriceHistoryPoint[];
}

// Contract every store adapter must satisfy
interface MerchantAdapter {
  fetchOffers(query: string): Promise<AdapterOffer[]>;
}
```

`AdapterOffer` extends `MerchantOffer` so the service layer can strip the extra fields and produce plain `MerchantOffer` objects for the `Product.offers` array.

---

## Store adapters (`src/services/adapters/`)

### Shared catalogue (`mockCatalog.ts`)

Product metadata (id, title, category, imageUrl, sku, priceHistory) lives in one place. Each adapter imports `MOCK_CATALOG` and `matchesCatalog` — no product data is duplicated across adapters.

### Adapter pattern

Each adapter:
1. Defines a `STORE_LISTINGS` record mapping `productId → { price, originalPrice?, inStock, productUrl }`.
2. In `fetchOffers(query)`, filters `MOCK_CATALOG` by `matchesCatalog` then cross-references with its own listings.
3. Simulates a realistic async delay (Amazon 300 ms, Flipkart 450 ms, Croma 400 ms).
4. Returns `AdapterOffer[]` with all product context embedded.

**To add a new store** (e.g. Reliance Digital):
```ts
// src/services/adapters/relianceDigitalAdapter.ts
export const relianceDigitalAdapter: MerchantAdapter = {
  async fetchOffers(query) {
    // filter MOCK_CATALOG, return AdapterOffer[]
    // or call a live REST API and map the response
  },
};
```

Then register it in `productService.ts`:
```ts
const ADAPTERS: MerchantAdapter[] = [
  amazonAdapter,
  flipkartAdapter,
  cromaAdapter,
  relianceDigitalAdapter,  // ← just add here
];
```

---

## Orchestration layer (`src/services/productService.ts`)

### `aggregateProductData(query)`

1. **Fan-out** — wraps each adapter call in `withTimeout(3000 ms)` then runs all via `Promise.allSettled`.
2. **Failure isolation** — rejected adapters (crash or timeout) are filtered out; remaining results still return.
3. **Grouping** — `AdapterOffer[]` are grouped into a `Map<productId, AdapterOffer[]>`.
4. **Hydration** — for each group, product metadata is taken from the first offer, offers are stripped to `MerchantOffer` shape, sorted by price ascending, then a `Product` is built with derived `lowestPrice` / `highestPrice`.
5. **Output** — `Product[]` sorted by `lowestPrice` ascending.

### Swapping mock adapters for live APIs

The only change needed is inside the adapter file:

```ts
// Before (mock)
async fetchOffers(query) {
  await delay(300);
  return MOCK_CATALOG.filter(...).map(...);
}

// After (live)
async fetchOffers(query) {
  const res = await fetch(`https://api.amazon.in/search?q=${query}`, {
    headers: { "x-api-key": process.env.AMAZON_API_KEY! },
  });
  const data = await res.json();
  return data.items.map(toAdapterOffer);  // map to AdapterOffer shape
}
```

`productService.ts`, the API route, and the frontend all remain unchanged.

---

## API route (`GET /api/search?q=`)

```
GET /api/search?q=iphone
→ { products: Product[], query: "iphone" }

GET /api/search?q=
→ { products: [], query: "" }
```

- The route handler contains no business logic — it delegates entirely to `aggregateProductData`.
- Returns a consistent `{ products, query }` envelope.

---

## Frontend change (`page.tsx`)

**Removed:** `import { searchProducts } from "@/services/mockProductAdapter"`

**Updated `handleSearch`:**
```ts
const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
const json = await res.json() as { products: Product[] };
setResults(json.products);
```

- `try/catch` around the fetch — if the API route throws, results fall back to `[]` and the "No products found" empty state is shown.
- No other UI changes — the existing sort, loading spinner, and grid all work as before.

---

## Offers coverage per store (Phase 5)

| Product | Amazon | Flipkart | Croma |
|---|---|---|---|
| Apple iPhone 15 | ✓ ₹74,999 | ✓ ₹75,499 | ✓ ₹76,990 |
| Samsung Galaxy S24 | ✓ ₹66,999 | ✓ ₹67,499 | — |
| Sony WH-1000XM5 | ✓ ₹22,990 | — | ✓ ₹24,490 |
| LG C3 55" OLED TV | ✓ ₹1,29,990 | ✓ ₹1,31,490 | ✓ ₹1,34,990 OOS |
| Dell XPS 15 | ✓ ₹1,64,990 | ✓ ₹1,66,490 OOS | ✓ ₹1,67,990 |

Stores not yet registered as adapters (Samsung Shop, Reliance Digital, Vijay Sales) will appear once their adapter files are created and added to `ADAPTERS` in `productService.ts`.

---

## Testing

```bash
npm run dev
```

**Search via UI:** open `http://localhost:3000`, search `iphone` — network tab should show `GET /api/search?q=iphone` returning JSON.

**Direct API test:**
```bash
curl "http://localhost:3000/api/search?q=iphone"
curl "http://localhost:3000/api/search?q=tv"
curl "http://localhost:3000/api/search?q="        # → { products: [] }
curl "http://localhost:3000/api/search?q=zzz"     # → { products: [] }
```

**Adapter failure simulation:** temporarily throw inside `amazonAdapter.fetchOffers` — Flipkart and Croma results still appear.

**Detail page:** `/product/prod-001` still works — it calls `getProductById` from the original `mockProductAdapter.ts` which is untouched.
