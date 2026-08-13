import type { Product, MerchantOffer } from "@/types/product";
import type { MerchantAdapter, AdapterOffer } from "@/types/adapter";
import { serpApiAdapter } from "./adapters/serpApiAdapter";
import { setCachedProducts, cachePageToken } from "./productCache";
import { getProductByPageToken } from "./serpApiProductService";

/* ── Registered adapters ────────────────────────────────────────────────────── */

const ADAPTERS: MerchantAdapter[] = [serpApiAdapter];

// SerpAPI for India can take 5–10 s; give it a generous budget
const ADAPTER_TIMEOUT_MS = 20000;

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Adapter timed out after ${ms} ms`)), ms)
    ),
  ]);
}

function toMerchantOffer(a: AdapterOffer): MerchantOffer {
  const offer: MerchantOffer = {
    merchantName: a.merchantName,
    price:        a.price,
    inStock:      a.inStock,
    productUrl:   a.productUrl,
  };
  if (a.originalPrice !== undefined) offer.originalPrice = a.originalPrice;
  if (a.logoUrl       !== undefined) offer.logoUrl       = a.logoUrl;
  return offer;
}

/* ── Public API ─────────────────────────────────────────────────────────────── */

export async function aggregateProductData(query: string, start = 0): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];

  const settled = await Promise.allSettled(
    ADAPTERS.map((adapter) => withTimeout(adapter.fetchOffers(q, start), ADAPTER_TIMEOUT_MS))
  );

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

  const products: Product[] = [];
  const pageTokenMap = new Map<string, string>(); // productId → immersive page token

  for (const [, offers] of byProduct) {
    /* Deduplicate: keep only the lowest-price listing per merchant */
    const byMerchant = new Map<string, AdapterOffer>();
    for (const offer of offers) {
      const key = offer.merchantName.toLowerCase();
      const existing = byMerchant.get(key);
      if (!existing || offer.price < existing.price) {
        byMerchant.set(key, offer);
      }
    }

    const deduped = Array.from(byMerchant.values());
    const meta    = deduped[0];
    const sorted  = deduped
      .map(toMerchantOffer)
      .sort((a, b) => a.price - b.price);

    // Cache the immersive page token so the detail page can fetch all sellers
    const pageToken = deduped.find((o) => o.pageToken)?.pageToken;
    if (pageToken) {
      cachePageToken(meta.productId, pageToken);
      pageTokenMap.set(meta.productId, pageToken);
    }

    products.push({
      id:           meta.productId,
      title:        meta.productTitle,
      category:     meta.productCategory,
      imageUrl:     meta.productImageUrl,
      sku:          meta.productSku,
      priceHistory: meta.priceHistory,
      offers:       sorted,
      lowestPrice:  sorted[0].price,
      highestPrice: sorted[sorted.length - 1].price,
      rating:       meta.productRating,
      reviews:      meta.productReviews,
    });
  }

  // Enrich all products with direct store URLs via the immersive product endpoint.
  // Runs in parallel — falls back to original Google Shopping URLs on failure.
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

  // Cache for product detail page lookups (preserve API relevance order)
  setCachedProducts(products);

  return products;
}
