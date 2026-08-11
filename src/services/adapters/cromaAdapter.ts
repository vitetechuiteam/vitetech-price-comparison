import type { MerchantAdapter, AdapterOffer } from "@/types/adapter";
import { MOCK_CATALOG, matchesCatalog } from "./mockCatalog";

const DELAY_MS = 400;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* Croma-specific price / stock data keyed by product id */
const CROMA_LISTINGS: Record<
  string,
  Pick<AdapterOffer, "price" | "originalPrice" | "inStock" | "productUrl">
> = {
  "prod-001": {
    price: 76990,
    originalPrice: 79900,
    inStock: true,
    productUrl: "https://www.croma.com/apple-iphone-15",
  },
  "prod-003": {
    price: 24490,
    originalPrice: 29990,
    inStock: true,
    productUrl: "https://www.croma.com/sony-wh-1000xm5",
  },
  "prod-004": {
    price: 134990,
    originalPrice: 159990,
    inStock: false,
    productUrl: "https://www.croma.com/lg-c3-oled-55",
  },
  "prod-005": {
    price: 167990,
    originalPrice: 189990,
    inStock: true,
    productUrl: "https://www.croma.com/dell-xps-15",
  },
};

export const cromaAdapter: MerchantAdapter = {
  async fetchOffers(query: string): Promise<AdapterOffer[]> {
    await delay(DELAY_MS);

    const q = query.trim().toLowerCase();
    if (!q) return [];

    return MOCK_CATALOG
      .filter((entry) => matchesCatalog(entry, q) && entry.id in CROMA_LISTINGS)
      .map((entry) => ({
        ...CROMA_LISTINGS[entry.id],
        merchantName: "Croma",
        logoUrl: "/logos/croma.svg",
        productId: entry.id,
        productTitle: entry.title,
        productCategory: entry.category,
        productImageUrl: entry.imageUrl,
        productSku: entry.sku,
        priceHistory: entry.priceHistory,
      }));
  },
};
