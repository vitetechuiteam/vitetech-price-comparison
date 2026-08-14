import type { Product, MerchantOffer } from "@/types/product";
import type { MerchantAdapter, AdapterOffer } from "@/types/adapter";
import { serpApiAdapter } from "./adapters/serpApiAdapter";
import { setCachedProducts, cachePageToken, setRecentSearchResults } from "./productCache";

/* ── Registered adapters ────────────────────────────────────────────────────── */

const ADAPTERS: MerchantAdapter[] = [serpApiAdapter];

// SerpAPI for India can take 5–10 s; give it a generous budget
const ADAPTER_TIMEOUT_MS = 20000;

/* ── URL query normalizer ────────────────────────────────────────────────────── */

interface ParsedQuery {
  searchQuery:     string;       // clean keyword string to send to SerpAPI
  boostIdentifier: string | null; // ASIN / item-id to boost the exact product to #1
}

function parseQueryUrl(raw: string): ParsedQuery {
  try {
    const url  = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    // Amazon: amazon.in/product-slug/dp/ASIN/...
    if (host.includes("amazon.")) {
      const asinMatch = url.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
      const slugMatch = url.pathname.match(/^\/([^/]+)\/dp\//);
      if (asinMatch) {
        const asin = asinMatch[1].toUpperCase();
        const slug = slugMatch ? slugMatch[1].replace(/-/g, " ") : asin;
        return { searchQuery: slug, boostIdentifier: asin };
      }
    }

    // Flipkart: flipkart.com/product-slug/p/itemid
    if (host.includes("flipkart.")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[1] === "p" && parts[0]) {
        return {
          searchQuery:     parts[0].replace(/-/g, " "),
          boostIdentifier: parts[2] ?? null,
        };
      }
    }
  } catch {
    // not a URL — fall through
  }
  return { searchQuery: raw, boostIdentifier: null };
}

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

  const { searchQuery, boostIdentifier } = parseQueryUrl(q);

  const settled = await Promise.allSettled(
    ADAPTERS.map((adapter) => withTimeout(adapter.fetchOffers(searchQuery, start), ADAPTER_TIMEOUT_MS))
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

    // Cache the immersive page token so the detail page can fetch all sellers on demand
    const pageToken = deduped.find((o) => o.pageToken)?.pageToken;
    if (pageToken) cachePageToken(meta.productId, pageToken);

    // Collect unique thumbnails from all merchant offers — different merchants
    // often have different product angles, giving us a free multi-image gallery.
    const galleryImages = [...new Set(
      deduped.map((o) => o.productImageUrl).filter(Boolean),
    )];

    products.push({
      id:           meta.productId,
      title:        meta.productTitle,
      category:     meta.productCategory,
      imageUrl:     meta.productImageUrl,
      images:       galleryImages.length > 1 ? galleryImages : undefined,
      sku:          meta.productSku,
      priceHistory: meta.priceHistory,
      offers:       sorted,
      lowestPrice:  sorted[0].price,
      highestPrice: sorted[sorted.length - 1].price,
      rating:       meta.productRating,
      reviews:      meta.productReviews,
    });
  }

  // If the original query was a store URL, boost the exact product match to #1
  if (boostIdentifier) {
    const matchIdx = products.findIndex((p) =>
      p.offers.some((o) => o.productUrl.includes(boostIdentifier))
    );
    if (matchIdx > 0) {
      const [match] = products.splice(matchIdx, 1);
      products.unshift(match);
    }
  }

  // Cache for product detail page lookups (preserve API relevance order)
  setCachedProducts(products);
  setRecentSearchResults(products);

  return products;
}
