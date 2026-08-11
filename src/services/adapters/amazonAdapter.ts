import type { MerchantAdapter, AdapterOffer } from "@/types/adapter";
import { MOCK_CATALOG, matchesCatalog } from "./mockCatalog";

const DELAY_MS = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* Amazon-specific price / stock data keyed by product id */
const AMAZON_LISTINGS: Record<
  string,
  Pick<AdapterOffer, "price" | "originalPrice" | "inStock" | "productUrl">
> = {
  "prod-001": {
    price: 74999,
    originalPrice: 79900,
    inStock: true,
    productUrl: "https://www.amazon.in/dp/B0CHX2FTVL",
  },
  "prod-002": {
    price: 66999,
    originalPrice: 74999,
    inStock: true,
    productUrl: "https://www.amazon.in/dp/samsung-s24",
  },
  "prod-003": {
    price: 22990,
    originalPrice: 29990,
    inStock: true,
    productUrl: "https://www.amazon.in/dp/sony-wh1000xm5",
  },
  "prod-004": {
    price: 129990,
    originalPrice: 159990,
    inStock: true,
    productUrl: "https://www.amazon.in/dp/lg-c3-oled",
  },
  "prod-005": {
    price: 164990,
    originalPrice: 189990,
    inStock: true,
    productUrl: "https://www.amazon.in/dp/dell-xps15",
  },
};

export const amazonAdapter: MerchantAdapter = {
  async fetchOffers(query: string): Promise<AdapterOffer[]> {
    await delay(DELAY_MS);

    const q = query.trim().toLowerCase();
    if (!q) return [];

    return MOCK_CATALOG
      .filter((entry) => matchesCatalog(entry, q) && entry.id in AMAZON_LISTINGS)
      .map((entry) => ({
        ...AMAZON_LISTINGS[entry.id],
        merchantName: "Amazon",
        logoUrl: "/logos/amazon.svg",
        productId: entry.id,
        productTitle: entry.title,
        productCategory: entry.category,
        productImageUrl: entry.imageUrl,
        productSku: entry.sku,
        priceHistory: entry.priceHistory,
      }));
  },
};
