import type { MerchantAdapter, AdapterOffer } from "@/types/adapter";

const SERPAPI_BASE = "https://serpapi.com/search";

interface SerpApiShoppingResult {
  title?: string;
  link?: string;
  product_link?: string;
  source?: string;
  price?: string;
  extracted_price?: number;
  original_price?: string;
  extracted_original_price?: number;
  thumbnail?: string;
  product_id?: string;
  second_hand_condition?: string;
  multiple_sources?: boolean;
  immersive_product_page_token?: string;
}

interface SerpApiResponse {
  shopping_results?: SerpApiShoppingResult[];
  error?: string;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parsePrice(extracted?: number, raw?: string): number | null {
  if (typeof extracted === "number" && extracted > 0) return extracted;
  if (raw) {
    const n = parseFloat(raw.replace(/[^\d.]/g, ""));
    if (!isNaN(n) && n > 0) return n;
  }
  return null;
}

function toAdapterOffer(r: SerpApiShoppingResult, query: string): AdapterOffer | null {
  if (!r.source || !r.title) return null;

  // Skip used / refurbished / pre-owned listings
  if (r.second_hand_condition) return null;

  // SerpAPI for India now returns product_link instead of link
  const productUrl = r.link ?? r.product_link;
  if (!productUrl) return null;

  const price = parsePrice(r.extracted_price, r.price);
  if (price === null) return null;

  const originalPrice = parsePrice(r.extracted_original_price, r.original_price);
  const productId = r.product_id ?? slugify(r.title);

  return {
    merchantName:    r.source,
    price,
    originalPrice:   originalPrice !== null ? originalPrice : undefined,
    inStock:         true,
    productUrl,
    productId,
    productTitle:    r.title,
    productCategory: query,
    productImageUrl: r.thumbnail ?? "",
    productSku:      r.product_id ?? productId,
    pageToken:       r.immersive_product_page_token,
  };
}

export const serpApiAdapter: MerchantAdapter = {
  async fetchOffers(query: string): Promise<AdapterOffer[]> {
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
    url.searchParams.set("api_key", apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 300 } });

    if (!res.ok) {
      throw new Error(`SerpApi request failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as SerpApiResponse;

    console.log("[serpApiAdapter] response keys:", Object.keys(data));
    console.log("[serpApiAdapter] shopping_results count:", data.shopping_results?.length ?? 0);
    if (data.error) console.error("[serpApiAdapter] error:", data.error);
    if (data.shopping_results?.[0]) {
      console.log("[serpApiAdapter] first result sample:", JSON.stringify(data.shopping_results[0], null, 2));
    }

    if (data.error) {
      throw new Error(`SerpApi error: ${data.error}`);
    }

    const mapped = (data.shopping_results ?? [])
      .map((r) => toAdapterOffer(r, query))
      .filter((o): o is AdapterOffer => o !== null);

    console.log("[serpApiAdapter] mapped offers count:", mapped.length);
    return mapped;
  },
};
