# Phase 2 — Core Domain Models & Mock Data Adapter

**Date**: 2026-08-10  
**Status**: Complete  
**Build**: ✅ `npm run build` — zero TypeScript errors

---

## Files Created

### `src/types/product.ts`

All domain interfaces live here. No runtime logic — pure type definitions.

| Interface | Purpose |
|---|---|
| `MerchantOffer` | A single store's listing for a product (price, stock, URL) |
| `PriceHistoryPoint` | One data point in a product's price timeline |
| `Product` | Fully-hydrated product aggregate with sorted offers and derived prices |

```ts
interface MerchantOffer {
  merchantName: string;
  price: number;
  originalPrice?: number;    // undefined = no listed RRP
  inStock: boolean;
  productUrl: string;
  logoUrl?: string;          // undefined = fall back to text label
}

interface PriceHistoryPoint {
  date: string;   // ISO date string "YYYY-MM-DD"
  price: number;  // INR
}

interface Product {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  sku: string;
  lowestPrice: number;   // derived — never stored in raw data
  highestPrice: number;  // derived — never stored in raw data
  offers: MerchantOffer[];
  priceHistory?: PriceHistoryPoint[];
}
```

---

### `src/services/mockProductAdapter.ts`

Simulates the Adapter Pattern: each real integration would be a separate merchant adapter; here a single mock dataset stands in for all of them.

#### Key Design Decisions

**`RawProduct` internal type**

```ts
type RawProduct = Omit<Product, "lowestPrice" | "highestPrice">;
```

Raw mock entries never carry `lowestPrice`/`highestPrice` — those would go stale if offers changed. `buildProduct()` always derives them fresh.

**`buildProduct()` helper**

```ts
function buildProduct(raw: RawProduct): Product {
  const sorted = [...raw.offers].sort((a, b) => a.price - b.price);
  return {
    ...raw,
    offers: sorted,
    lowestPrice: sorted[0]?.price ?? 0,
    highestPrice: sorted[sorted.length - 1]?.price ?? 0,
  };
}
```

- Spread `[...raw.offers]` avoids mutating the source constant.
- Optional chaining + nullish coalescing handles the (impossible in production but valid TypeScript) zero-offer edge case.

**Simulated delay**

```ts
const SIMULATED_DELAY_MS = 500;
await delay(SIMULATED_DELAY_MS);
```

Makes loading states and skeleton UIs testable from day one.

#### Public API

| Export | Signature | Description |
|---|---|---|
| `searchProducts` | `(query: string) => Promise<Product[]>` | Matches title, category, or SKU (case-insensitive) |
| `getAllProducts` | `() => Promise<Product[]>` | Returns all 5 products |
| `getProductById` | `(id: string) => Promise<Product \| null>` | Exact ID lookup |
| `getProductsByCategory` | `(category: string) => Promise<Product[]>` | Case-insensitive category filter |

---

## Mock Dataset

| ID | Title | Category | Merchants | Edge Cases |
|---|---|---|---|---|
| prod-001 | Apple iPhone 15 (128GB) | Mobiles | Amazon, Flipkart, Croma, Reliance Digital | Reliance Digital: `inStock: false` |
| prod-002 | Samsung Galaxy S24 (256GB) | Mobiles | Amazon, Flipkart, Samsung Shop | 3 merchants only |
| prod-003 | Sony WH-1000XM5 Headphones | Audio | Amazon, Croma | **2 merchants only** — not on Flipkart or Reliance Digital |
| prod-004 | LG C3 55-inch OLED TV | TVs | Amazon, Flipkart, Croma, Reliance Digital, Vijay Sales | Croma: `inStock: false`; 5 merchants |
| prod-005 | Dell XPS 15 (i7, 512GB) | Laptops | Amazon, Flipkart, Croma | Flipkart: `inStock: false` |

All products include a 4-point `priceHistory` array covering Oct 2024–Jan 2025.

---

## Testing Instructions

```bash
# Confirm zero build errors
npm run build
```

### Manual test via browser DevTools / Node REPL

```ts
// In a browser console or a .ts script (ts-node / tsx):
import { searchProducts, getAllProducts, getProductById, getProductsByCategory } from "@/services/mockProductAdapter";

// 1. Basic search — should return iPhone 15 and Galaxy S24
const mobiles = await searchProducts("iphone");
console.log(mobiles.length);                 // 1
console.log(mobiles[0].lowestPrice);         // 74999 (Amazon)
console.log(mobiles[0].offers[0].merchantName); // "Amazon" (sorted ascending)

// 2. Category search
const tvs = await getProductsByCategory("TVs");
console.log(tvs[0].offers.length);           // 5 (LG C3 has 5 merchants)

// 3. Edge case — Sony headphones: only 2 merchants
const headphones = await searchProducts("sony");
console.log(headphones[0].offers.length);    // 2

// 4. Out-of-stock check on product with partial availability
const laptop = await getProductById("prod-005");
const flipkartOffer = laptop?.offers.find(o => o.merchantName === "Flipkart");
console.log(flipkartOffer?.inStock);         // false

// 5. Empty query → empty result
const empty = await searchProducts("");
console.log(empty.length);                   // 0

// 6. No match → empty result
const none = await searchProducts("zzznomatch");
console.log(none.length);                    // 0
```

### Checklist

- [ ] `searchProducts("iphone")` resolves after ~500 ms and returns 1 product
- [ ] `offers` array is sorted price-ascending (cheapest first)
- [ ] `lowestPrice` matches `offers[0].price`
- [ ] `highestPrice` matches `offers[offers.length - 1].price`
- [ ] Sony headphones returns only 2 offers (not on Flipkart / Reliance Digital)
- [ ] At least one offer per product has `inStock: false`
- [ ] Empty string query returns `[]` immediately (no crash)
- [ ] `getProductById("prod-999")` returns `null` (not undefined, not throw)
