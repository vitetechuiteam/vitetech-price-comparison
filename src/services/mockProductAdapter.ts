import type { PriceHistoryPoint, Product } from "@/types/product";

/* ── Internal raw type — lowestPrice / highestPrice are derived, not stored ── */

type RawProduct = Omit<Product, "lowestPrice" | "highestPrice">;

function buildProduct(raw: RawProduct): Product {
  const sorted = [...raw.offers].sort((a, b) => a.price - b.price);
  return {
    ...raw,
    offers: sorted,
    lowestPrice: sorted[0]?.price ?? 0,
    highestPrice: sorted[sorted.length - 1]?.price ?? 0,
  };
}

/* ── Mock dataset ─────────────────────────────────────────────────────────── */

const MOCK_PRODUCTS: RawProduct[] = [
  {
    id: "prod-001",
    sku: "APPLE-IP15-128-BLK",
    title: "Apple iPhone 15 (128GB, Black)",
    category: "Mobiles",
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484429be?w=400",
    priceHistory: [
      { date: "2024-10-01", price: 79999 },
      { date: "2024-11-01", price: 77999 },
      { date: "2024-12-01", price: 75999 },
      { date: "2025-01-01", price: 74999 },
    ] satisfies PriceHistoryPoint[],
    offers: [
      {
        merchantName: "Amazon",
        price: 74999,
        originalPrice: 79900,
        inStock: true,
        productUrl: "https://www.amazon.in/dp/B0CHX2FTVL",
        logoUrl: "/logos/amazon.svg",
      },
      {
        merchantName: "Flipkart",
        price: 75499,
        originalPrice: 79900,
        inStock: true,
        productUrl: "https://www.flipkart.com/apple-iphone-15",
        logoUrl: "/logos/flipkart.svg",
      },
      {
        merchantName: "Croma",
        price: 76990,
        originalPrice: 79900,
        inStock: true,
        productUrl: "https://www.croma.com/apple-iphone-15",
        logoUrl: "/logos/croma.svg",
      },
      {
        merchantName: "Reliance Digital",
        price: 75999,
        originalPrice: 79900,
        inStock: false,
        productUrl: "https://www.reliancedigital.in/apple-iphone-15",
        logoUrl: "/logos/reliance-digital.svg",
      },
    ],
  },
  {
    id: "prod-002",
    sku: "SAMSUNG-S24-256-VIO",
    title: "Samsung Galaxy S24 (256GB, Violet)",
    category: "Mobiles",
    imageUrl: "https://images.unsplash.com/photo-1706741561249-a51bd1e04c6a?w=400",
    priceHistory: [
      { date: "2024-10-01", price: 74999 },
      { date: "2024-11-01", price: 71999 },
      { date: "2024-12-01", price: 69999 },
      { date: "2025-01-01", price: 66999 },
    ] satisfies PriceHistoryPoint[],
    offers: [
      {
        merchantName: "Amazon",
        price: 66999,
        originalPrice: 74999,
        inStock: true,
        productUrl: "https://www.amazon.in/dp/samsung-s24",
        logoUrl: "/logos/amazon.svg",
      },
      {
        merchantName: "Flipkart",
        price: 67499,
        originalPrice: 74999,
        inStock: true,
        productUrl: "https://www.flipkart.com/samsung-galaxy-s24",
        logoUrl: "/logos/flipkart.svg",
      },
      {
        merchantName: "Samsung Shop",
        price: 68999,
        originalPrice: 74999,
        inStock: true,
        productUrl: "https://www.samsung.com/in/smartphones/galaxy-s24",
        logoUrl: "/logos/samsung.svg",
      },
    ],
  },
  {
    id: "prod-003",
    sku: "SONY-WH1000XM5-BLK",
    title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    category: "Audio",
    imageUrl: "https://images.unsplash.com/photo-1657223136769-c84f3f96ec3f?w=400",
    priceHistory: [
      { date: "2024-10-01", price: 29990 },
      { date: "2024-11-01", price: 27990 },
      { date: "2024-12-01", price: 24990 },
      { date: "2025-01-01", price: 22990 },
    ] satisfies PriceHistoryPoint[],
    offers: [
      {
        merchantName: "Amazon",
        price: 22990,
        originalPrice: 29990,
        inStock: true,
        productUrl: "https://www.amazon.in/dp/sony-wh1000xm5",
        logoUrl: "/logos/amazon.svg",
      },
      {
        merchantName: "Croma",
        price: 24490,
        originalPrice: 29990,
        inStock: true,
        productUrl: "https://www.croma.com/sony-wh-1000xm5",
        logoUrl: "/logos/croma.svg",
      },
      // Edge case: not listed on Flipkart and Reliance Digital for this product
    ],
  },
  {
    id: "prod-004",
    sku: "LG-C3-55-OLED",
    title: "LG C3 55-inch 4K OLED Smart TV",
    category: "TVs",
    imageUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400",
    priceHistory: [
      { date: "2024-10-01", price: 159990 },
      { date: "2024-11-01", price: 149990 },
      { date: "2024-12-01", price: 139990 },
      { date: "2025-01-01", price: 129990 },
    ] satisfies PriceHistoryPoint[],
    offers: [
      {
        merchantName: "Amazon",
        price: 129990,
        originalPrice: 159990,
        inStock: true,
        productUrl: "https://www.amazon.in/dp/lg-c3-oled",
        logoUrl: "/logos/amazon.svg",
      },
      {
        merchantName: "Flipkart",
        price: 131490,
        originalPrice: 159990,
        inStock: true,
        productUrl: "https://www.flipkart.com/lg-c3-oled-55",
        logoUrl: "/logos/flipkart.svg",
      },
      {
        merchantName: "Croma",
        price: 134990,
        originalPrice: 159990,
        inStock: false,
        productUrl: "https://www.croma.com/lg-c3-oled-55",
        logoUrl: "/logos/croma.svg",
      },
      {
        merchantName: "Reliance Digital",
        price: 132990,
        originalPrice: 159990,
        inStock: true,
        productUrl: "https://www.reliancedigital.in/lg-c3-oled",
        logoUrl: "/logos/reliance-digital.svg",
      },
      {
        merchantName: "Vijay Sales",
        price: 133490,
        originalPrice: 159990,
        inStock: true,
        productUrl: "https://www.vijaysales.com/lg-c3-55-oled",
        logoUrl: "/logos/vijay-sales.svg",
      },
    ],
  },
  {
    id: "prod-005",
    sku: "DELL-XPS15-I7-512",
    title: "Dell XPS 15 (Intel Core i7, 16GB RAM, 512GB SSD)",
    category: "Laptops",
    imageUrl: "https://images.unsplash.com/photo-1593642702909-dec73df255d7?w=400",
    priceHistory: [
      { date: "2024-10-01", price: 189990 },
      { date: "2024-11-01", price: 179990 },
      { date: "2024-12-01", price: 169990 },
      { date: "2025-01-01", price: 164990 },
    ] satisfies PriceHistoryPoint[],
    offers: [
      {
        merchantName: "Amazon",
        price: 164990,
        originalPrice: 189990,
        inStock: true,
        productUrl: "https://www.amazon.in/dp/dell-xps15",
        logoUrl: "/logos/amazon.svg",
      },
      {
        merchantName: "Flipkart",
        price: 166490,
        originalPrice: 189990,
        inStock: false,
        productUrl: "https://www.flipkart.com/dell-xps-15",
        logoUrl: "/logos/flipkart.svg",
      },
      {
        merchantName: "Croma",
        price: 167990,
        originalPrice: 189990,
        inStock: true,
        productUrl: "https://www.croma.com/dell-xps-15",
        logoUrl: "/logos/croma.svg",
      },
    ],
  },
];

/* ── Simulated network delay ──────────────────────────────────────────────── */

const SIMULATED_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ── Public API ───────────────────────────────────────────────────────────── */

/**
 * Simulates parallel fetching from multiple merchant adapters,
 * then returns fully-hydrated Product objects with sorted offers
 * and derived lowestPrice / highestPrice.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  await delay(SIMULATED_DELAY_MS);

  const normalised = query.trim().toLowerCase();
  if (!normalised) return [];

  const results = MOCK_PRODUCTS.filter((p) =>
    p.title.toLowerCase().includes(normalised) ||
    p.category.toLowerCase().includes(normalised) ||
    p.sku.toLowerCase().includes(normalised)
  );

  return results.map(buildProduct);
}

export async function getAllProducts(): Promise<Product[]> {
  await delay(SIMULATED_DELAY_MS);
  return MOCK_PRODUCTS.map(buildProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  await delay(SIMULATED_DELAY_MS);
  const raw = MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
  return raw ? buildProduct(raw) : null;
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  await delay(SIMULATED_DELAY_MS);
  return MOCK_PRODUCTS
    .filter((p) => p.category.toLowerCase() === category.toLowerCase())
    .map(buildProduct);
}
