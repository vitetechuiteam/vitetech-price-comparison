import type { MerchantAdapter, AdapterOffer } from "@/types/adapter";
import { MOCK_CATALOG, matchesCatalog } from "./mockCatalog";

const DELAY_MS = 450;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* Flipkart-specific price / stock data keyed by product id */
const FLIPKART_LISTINGS: Record<
  string,
  Pick<AdapterOffer, "price" | "originalPrice" | "inStock" | "productUrl">
> = {
  "prod-001": {
    price: 75499,
    originalPrice: 79900,
    inStock: true,
    productUrl: "https://www.flipkart.com/apple-iphone-15",
  },
  "prod-002": {
    price: 67499,
    originalPrice: 74999,
    inStock: true,
    productUrl: "https://www.flipkart.com/samsung-galaxy-s24",
  },
  "prod-004": {
    price: 131490,
    originalPrice: 159990,
    inStock: true,
    productUrl: "https://www.flipkart.com/lg-c3-oled-55",
  },
  "prod-005": {
    price: 166490,
    originalPrice: 189990,
    inStock: false,
    productUrl: "https://www.flipkart.com/dell-xps-15",
  },
};

export const flipkartAdapter: MerchantAdapter = {
  async fetchOffers(query: string): Promise<AdapterOffer[]> {
    await delay(DELAY_MS);

    const q = query.trim().toLowerCase();
    if (!q) return [];

    return MOCK_CATALOG
      .filter((entry) => matchesCatalog(entry, q) && entry.id in FLIPKART_LISTINGS)
      .map((entry) => ({
        ...FLIPKART_LISTINGS[entry.id],
        merchantName: "Flipkart",
        logoUrl: "/logos/flipkart.svg",
        productId: entry.id,
        productTitle: entry.title,
        productCategory: entry.category,
        productImageUrl: entry.imageUrl,
        productSku: entry.sku,
        priceHistory: entry.priceHistory,
      }));
  },
};
