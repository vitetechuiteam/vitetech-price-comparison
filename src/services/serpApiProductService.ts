import type { Product, MerchantOffer } from "@/types/product";

const SERPAPI_BASE = "https://serpapi.com/search";

/* ── google_immersive_product response types ─────────────────────────────────── */

interface ImmersiveSeller {
  // google_immersive_product uses these field names in the `stores` array
  name?: string;
  link?: string;
  direct_link?: string;
  product_link?: string;
  price?: string;
  base_price?: string;
  extracted_price?: number;
  original_price?: string;
  extracted_original_price?: number;
  delivery?: string;
  tag?: string;
  status?: string;
  rating?: number;
  reviews?: number;
  // Catch-all for unknown fields
  [key: string]: unknown;
}

interface ImmersiveProductResult {
  title?: string;
  description?: string;
  images?: string[];
  thumbnails?: string[];
  stores?: ImmersiveSeller[];
  sellers?: ImmersiveSeller[];
  online_sellers?: ImmersiveSeller[];
  buying_options?: ImmersiveSeller[];
  prices?: ImmersiveSeller[];
}

interface ImmersiveProductResponse {
  product_results?: ImmersiveProductResult;
  error?: string;
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

function parsePrice(extracted?: number, raw?: string): number | null {
  if (typeof extracted === "number" && extracted > 0) return extracted;
  if (raw) {
    const n = parseFloat(raw.replace(/[^\d.]/g, ""));
    if (!isNaN(n) && n > 0) return n;
  }
  return null;
}

function collectSellers(pr: ImmersiveProductResult): ImmersiveSeller[] {
  // Log first store entry to confirm field names (remove after debugging)
  if (pr.stores?.[0]) {
    console.log(`[immersiveProduct] first store entry:`, JSON.stringify(pr.stores[0]));
  }

  const lists: ImmersiveSeller[][] = [
    pr.stores          ?? [],   // google_immersive_product primary field
    pr.sellers         ?? [],
    pr.online_sellers  ?? [],
    pr.buying_options  ?? [],
    pr.prices          ?? [],
  ];

  const byName = new Map<string, ImmersiveSeller>();
  for (const list of lists) {
    for (const s of list) {
      const name = (s.name ?? "").trim();
      if (!name) continue;
      const price = parsePrice(s.extracted_price, s.base_price ?? s.price);
      if (price === null) continue;
      const key = name.toLowerCase();
      const existing = byName.get(key);
      const existingPrice = existing
        ? (parsePrice(existing.extracted_price, existing.base_price ?? existing.price) ?? Infinity)
        : Infinity;
      if (price < existingPrice) byName.set(key, s);
    }
  }

  return Array.from(byName.values());
}

/* ── google_immersive_product (primary path) ─────────────────────────────────── */

export async function getProductByPageToken(
  pageToken: string,
  productId: string,
  fallbackTitle: string,
  fallbackImage: string,
): Promise<Product | null> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return null;

  const url = new URL(SERPAPI_BASE);
  url.searchParams.set("engine", "google_immersive_product");
  url.searchParams.set("page_token", pageToken);
  url.searchParams.set("gl", "in");
  url.searchParams.set("hl", "en");
  url.searchParams.set("api_key", apiKey);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      console.warn(`[immersiveProduct] HTTP ${res.status} for token ${pageToken.slice(0, 20)}…`);
      return null;
    }

    const data = (await res.json()) as ImmersiveProductResponse;

    console.log(`[immersiveProduct] top-level keys:`, Object.keys(data));
    if (data.error) { console.warn(`[immersiveProduct] error:`, data.error); return null; }
    if (!data.product_results) { console.warn(`[immersiveProduct] no product_results`); return null; }

    const pr = data.product_results;
    console.log(`[immersiveProduct] product_results keys:`, Object.keys(pr));
    console.log(`[immersiveProduct] stores:`, (pr.stores ?? []).length,
      `| sellers:`, (pr.sellers ?? []).length,
      `| online_sellers:`, (pr.online_sellers ?? []).length,
      `| buying_options:`, (pr.buying_options ?? []).length,
      `| prices:`, (pr.prices ?? []).length);

    const allSellers = collectSellers(pr);
    console.log(`[immersiveProduct] unique sellers:`, allSellers.length,
      allSellers.map((s) => `${s.name}:₹${parsePrice(s.extracted_price, s.base_price)}`));

    const offers: MerchantOffer[] = allSellers
      .map((s): MerchantOffer | null => {
        const name = (s.name ?? "").trim();
        // Accept any direct store link field; skip if only a Google redirect
        const link = (s.direct_link ?? s.link ?? s.product_link ?? "") as string;
        if (!name || !link) return null;
        // Skip Google intermediate URLs — we want actual store links
        if (link.includes("google.com/search") || link.includes("google.com/url")) return null;
        const price = parsePrice(s.extracted_price, s.base_price ?? s.price);
        if (price === null) return null;
        const originalPrice = parsePrice(s.extracted_original_price, s.original_price);
        const outOfStock = (s.tag ?? s.status ?? "").toString().toLowerCase().includes("out of stock");
        return {
          merchantName:  name,
          price,
          originalPrice: originalPrice !== null ? originalPrice : undefined,
          inStock:       !outOfStock,
          productUrl:    link,
        };
      })
      .filter((o): o is MerchantOffer => o !== null)
      .sort((a, b) => a.price - b.price);

    console.log(`[immersiveProduct] valid offers:`, offers.length,
      offers.map((o) => `${o.merchantName}:₹${o.price}`));

    if (offers.length === 0) return null;

    return {
      id:           productId,
      title:        pr.title ?? fallbackTitle,
      category:     "Electronics",
      imageUrl:     pr.thumbnails?.[0] ?? pr.images?.[0] ?? fallbackImage,
      sku:          productId,
      offers,
      lowestPrice:  offers[0].price,
      highestPrice: offers[offers.length - 1].price,
    };
  } catch (err) {
    console.error(`[immersiveProduct] fetch failed:`, err);
    return null;
  }
}

/* ── google_product fallback (kept for direct-URL access, numeric IDs only) ──── */

interface SerpApiSeller {
  name?: string;
  source?: string;
  link?: string;
  price?: string;
  base_price?: string;
  extracted_price?: number;
  original_price?: string;
  extracted_original_price?: number;
  tag?: string;
}

interface SerpApiSellersResults {
  online_sellers?: SerpApiSeller[];
  in_store_sellers?: SerpApiSeller[];
}

interface SerpApiProductResult {
  title?: string;
  images?: string[];
  prices?: SerpApiSeller[];
  buying_options?: SerpApiSeller[];
  sellers?: SerpApiSeller[];
  online_sellers?: SerpApiSeller[];
  sellers_results?: SerpApiSellersResults;
}

interface SerpApiProductResponse {
  product_results?: SerpApiProductResult;
  error?: string;
}

function collectAllSellers(pr: SerpApiProductResult): SerpApiSeller[] {
  const lists: SerpApiSeller[][] = [
    pr.prices              ?? [],
    pr.buying_options      ?? [],
    pr.online_sellers      ?? [],
    pr.sellers             ?? [],
    pr.sellers_results?.online_sellers   ?? [],
    pr.sellers_results?.in_store_sellers ?? [],
  ];

  const byName = new Map<string, SerpApiSeller>();
  for (const list of lists) {
    for (const s of list) {
      const name = (s.source ?? s.name ?? "").trim();
      if (!name) continue;
      const price = parsePrice(s.extracted_price, s.base_price ?? s.price);
      if (price === null) continue;
      const key = name.toLowerCase();
      const existing = byName.get(key);
      const existingPrice = existing
        ? (parsePrice(existing.extracted_price, existing.base_price ?? existing.price) ?? Infinity)
        : Infinity;
      if (price < existingPrice) byName.set(key, s);
    }
  }

  return Array.from(byName.values());
}

export async function getProductByIdFromSerpApi(productId: string): Promise<Product | null> {
  if (!/^\d+$/.test(productId)) return null;

  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return null;

  const url = new URL(SERPAPI_BASE);
  url.searchParams.set("engine", "google_product");
  url.searchParams.set("product_id", productId);
  url.searchParams.set("gl", "in");
  url.searchParams.set("hl", "en");
  url.searchParams.set("api_key", apiKey);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      console.warn(`[serpApiProduct] HTTP ${res.status} for ${productId}`);
      return null;
    }

    const data = (await res.json()) as SerpApiProductResponse;

    if (data.error) { console.warn(`[serpApiProduct] error:`, data.error); return null; }
    if (!data.product_results) return null;

    const pr = data.product_results;
    const allSellers = collectAllSellers(pr);

    const offers: MerchantOffer[] = allSellers
      .map((s): MerchantOffer | null => {
        const name = (s.source ?? s.name ?? "").trim();
        const link = s.link;
        if (!name || !link) return null;
        const price = parsePrice(s.extracted_price, s.base_price ?? s.price);
        if (price === null) return null;
        const originalPrice = parsePrice(s.extracted_original_price, s.original_price);
        return {
          merchantName:  name,
          price,
          originalPrice: originalPrice !== null ? originalPrice : undefined,
          inStock:       !(s.tag?.toLowerCase().includes("out of stock")),
          productUrl:    link,
        };
      })
      .filter((o): o is MerchantOffer => o !== null)
      .sort((a, b) => a.price - b.price);

    if (offers.length === 0) return null;

    return {
      id:           productId,
      title:        pr.title ?? "Product",
      category:     "Electronics",
      imageUrl:     pr.images?.[0] ?? "",
      sku:          productId,
      offers,
      lowestPrice:  offers[0].price,
      highestPrice: offers[offers.length - 1].price,
    };
  } catch (err) {
    console.error(`[serpApiProduct] fetch failed:`, err);
    return null;
  }
}
