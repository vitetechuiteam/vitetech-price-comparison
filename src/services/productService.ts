import type { Product, MerchantOffer } from "@/types/product";
import type { MerchantAdapter, AdapterOffer } from "@/types/adapter";
import { amazonAdapter }  from "./adapters/amazonAdapter";
import { flipkartAdapter } from "./adapters/flipkartAdapter";
import { cromaAdapter }   from "./adapters/cromaAdapter";

/* ── Registered adapters ────────────────────────────────────────────────────── */

const ADAPTERS: MerchantAdapter[] = [
  amazonAdapter,
  flipkartAdapter,
  cromaAdapter,
];

const ADAPTER_TIMEOUT_MS = 3000;

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Adapter timed out after ${ms} ms`)), ms)
    ),
  ]);
}

/* Strip the adapter-only context fields to produce a plain MerchantOffer. */
function toMerchantOffer(a: AdapterOffer): MerchantOffer {
  const offer: MerchantOffer = {
    merchantName: a.merchantName,
    price:        a.price,
    inStock:      a.inStock,
    productUrl:   a.productUrl,
  };
  if (a.originalPrice !== undefined) offer.originalPrice = a.originalPrice;
  if (a.logoUrl        !== undefined) offer.logoUrl       = a.logoUrl;
  return offer;
}

/* ── Public API ─────────────────────────────────────────────────────────────── */

/**
 * Calls every registered adapter in parallel with a per-adapter timeout.
 * Individual adapter failures are swallowed — the search still returns
 * results from the adapters that succeeded.
 * Offers are grouped by productId, sorted by price, then hydrated into
 * fully-typed Product objects with derived lowestPrice / highestPrice.
 */
export async function aggregateProductData(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  /* Fan out — all adapters run concurrently */
  const settled = await Promise.allSettled(
    ADAPTERS.map((adapter) => withTimeout(adapter.fetchOffers(q), ADAPTER_TIMEOUT_MS))
  );

  /* Collect offers from fulfilled adapters only */
  const allOffers: AdapterOffer[] = settled
    .filter(
      (r): r is PromiseFulfilledResult<AdapterOffer[]> => r.status === "fulfilled"
    )
    .flatMap((r) => r.value);

  if (allOffers.length === 0) return [];

  /* Group by productId */
  const byProduct = new Map<string, AdapterOffer[]>();
  for (const offer of allOffers) {
    const group = byProduct.get(offer.productId) ?? [];
    group.push(offer);
    byProduct.set(offer.productId, group);
  }

  /* Build hydrated Product objects */
  const products: Product[] = [];
  for (const [, offers] of byProduct) {
    const meta   = offers[0];
    const sorted = offers
      .map(toMerchantOffer)
      .sort((a, b) => a.price - b.price);

    products.push({
      id:          meta.productId,
      title:       meta.productTitle,
      category:    meta.productCategory,
      imageUrl:    meta.productImageUrl,
      sku:         meta.productSku,
      priceHistory: meta.priceHistory,
      offers:       sorted,
      lowestPrice:  sorted[0].price,
      highestPrice: sorted[sorted.length - 1].price,
    });
  }

  /* Return sorted by lowestPrice ascending (default view order) */
  return products.sort((a, b) => a.lowestPrice - b.lowestPrice);
}
