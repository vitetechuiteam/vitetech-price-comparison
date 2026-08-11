import type { PriceHistoryPoint } from "@/types/product";

export interface CatalogEntry {
  id: string;
  sku: string;
  title: string;
  category: string;
  imageUrl: string;
  priceHistory: PriceHistoryPoint[];
}

/** Shared product catalogue — store-agnostic metadata only. */
export const MOCK_CATALOG: CatalogEntry[] = [
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
    ],
  },
];

/** Case-insensitive match against title, category, and SKU. */
export function matchesCatalog(entry: CatalogEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  return (
    entry.title.toLowerCase().includes(q) ||
    entry.category.toLowerCase().includes(q) ||
    entry.sku.toLowerCase().includes(q)
  );
}
