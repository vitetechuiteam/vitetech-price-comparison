import type { MerchantAdapter, AdapterOffer } from "@/types/adapter";

const SERPAPI_BASE = "https://serpapi.com/search";

/* ── SerpApi response shape (google_shopping engine) ────────────────────────── */

interface SerpApiShoppingResult {
  title?: string;
  link?: string;
  source?: string;
  extracted_price?: number;
  extracted_original_price?: number;
  thumbnail?: string;
  product_id?: string;
}

interface SerpApiResponse {
  shopping_results?: SerpApiShoppingResult[];
  error?: string;
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function toAdapterOffer(r: SerpApiShoppingResult, query: string): AdapterOffer | null {
  if (
    typeof r.extracted_price !== "number" ||
    !r.source ||
    !r.link ||
    !r.title
  ) return null;

  const productId = r.product_id ?? slugify(r.title);

  return {
    merchantName:    r.source,
    price:           r.extracted_price,
    originalPrice:   typeof r.extracted_original_price === "number"
                       ? r.extracted_original_price
                       : undefined,
    inStock:         true,
    productUrl:      r.link,
    productId,
    productTitle:    r.title,
    productCategory: query,
    productImageUrl: r.thumbnail ?? "",
    productSku:      r.product_id ?? productId,
  };
}

/* ── Adapter ────────────────────────────────────────────────────────────────── */

export const flipkartAdapter: MerchantAdapter = {
  async fetchOffers(query: string): Promise<AdapterOffer[]> {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      console.warn("[flipkartAdapter] SERPAPI_API_KEY is not set — skipping live fetch");
      return [];
    }

    const url = new URL(SERPAPI_BASE);
    url.searchParams.set("engine", "google_shopping");
    url.searchParams.set("q", query);
    url.searchParams.set("gl", "in");
    url.searchParams.set("hl", "en");
    url.searchParams.set("api_key", apiKey);

    const res = await fetch(url.toString(), {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`SerpApi request failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as SerpApiResponse;

    if (data.error) {
      throw new Error(`SerpApi error: ${data.error}`);
    }

    return (data.shopping_results ?? [])
      .filter((r) => r.source?.toLowerCase().includes("flipkart") ?? false)
      .map((r) => toAdapterOffer(r, query))
      .filter((o): o is AdapterOffer => o !== null);
  },
};
