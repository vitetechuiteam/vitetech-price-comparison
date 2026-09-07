import type { MerchantAdapter, AdapterOffer } from "@/types/adapter";

const SERPAPI_BASE = "https://serpapi.com/search";

// Only show results from these supported platforms
const TRUSTED_MERCHANTS: RegExp[] = [
  /amazon/i,
  /flipkart/i,
  /jiomart/i,
];

export function isTrustedMerchant(source: string, productUrl: string): boolean {
  const text = `${source} ${productUrl}`.toLowerCase();
  return TRUSTED_MERCHANTS.some((pattern) => pattern.test(text));
}

interface SerpApiShoppingResult {
  title?: string;
  link?: string;
  product_link?: string;
  source?: string;
  price?: string;
  extracted_price?: number | string;
  original_price?: string;
  extracted_original_price?: number | string;
  old_price?: string;
  extracted_old_price?: number | string;
  thumbnail?: string;
  product_id?: string;
  second_hand_condition?: string;
  multiple_sources?: boolean;
  immersive_product_page_token?: string;
  rating?: number;
  reviews?: number;
}

interface SerpApiResponse {
  shopping_results?: SerpApiShoppingResult[];
  error?: string;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parsePrice(extracted?: number | string, raw?: string): number | null {
  if (typeof extracted === "number" && extracted > 0) return extracted;
  const extractedText = typeof extracted === "string" ? extracted : raw;
  if (extractedText) {
    const n = parseFloat(extractedText.replace(/[^\d.]/g, ""));
    if (!isNaN(n) && n > 0) return n;
  }
  return null;
}

function normalizeMerchantName(source: string): string {
  if (source.toLowerCase().includes("flipkart")) return "Flipkart";
  return source.trim();
}

export function isGoogleUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname === "google.com" || hostname.endsWith(".google.com");
  } catch {
    return false;
  }
}

function pickBestUrl(link?: string, productLink?: string): string | undefined {
  // `link` is the direct store URL; `product_link` is the Google Shopping page.
  // Prefer `link` if it's not a Google URL, otherwise fall back to `product_link`.
  if (link && !isGoogleUrl(link)) return link;
  if (productLink && !isGoogleUrl(productLink)) return productLink;
  return link ?? productLink; // last resort — both are Google URLs
}

function toAdapterOffer(r: SerpApiShoppingResult, query: string): AdapterOffer | null {
  if (!r.source || !r.title) return null;

  // Skip used / refurbished / pre-owned listings
  if (r.second_hand_condition) return null;

  const productUrl = pickBestUrl(r.link, r.product_link);
  if (!productUrl) return null;

  // Only keep offers from supported platforms (Amazon, Flipkart)
  if (!isTrustedMerchant(r.source, productUrl)) return null;

  const price = parsePrice(r.extracted_price, r.price);
  if (price === null) return null;

  const originalPrice = parsePrice(
    r.extracted_original_price ?? r.extracted_old_price,
    r.original_price ?? r.old_price,
  );
  const productId     = r.product_id ?? slugify(r.title);

  return {
    merchantName:    normalizeMerchantName(r.source),
    price,
    originalPrice:   originalPrice !== null ? originalPrice : undefined,
    inStock:         true,
    productUrl,
    productId,
    productTitle:    r.title,
    productCategory: query,
    productImageUrl: r.thumbnail ?? "",
    productSku:      r.product_id ?? productId,
    pageToken:        r.immersive_product_page_token,
    productRating:    r.rating,
    productReviews:   r.reviews,
  };
}

export const serpApiAdapter: MerchantAdapter = {
  async fetchOffers(query: string, start = 0): Promise<AdapterOffer[]> {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      console.warn("[serpApiAdapter] SERPAPI_API_KEY not set — skipping live fetch");
      return [];
    }

    const url = new URL(SERPAPI_BASE);
    url.searchParams.set("engine", "google_shopping");
    url.searchParams.set("q", query);
    url.searchParams.set("gl", "in");
    url.searchParams.set("hl", "en");
    url.searchParams.set("num", "20");
    if (start > 0) url.searchParams.set("start", String(start));
    url.searchParams.set("api_key", apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });

    if (!res.ok) {
      throw new Error(`SerpApi request failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as SerpApiResponse;

    if (data.error) {
      throw new Error(`SerpApi error: ${data.error}`);
    }

    const mapped = (data.shopping_results ?? [])
      .map((r) => toAdapterOffer(r, query))
      .filter((o): o is AdapterOffer => o !== null);

    console.log(`[serpApiAdapter] total: ${data.shopping_results?.length ?? 0}, mapped: ${mapped.length}`);
    return mapped;
  },
};
