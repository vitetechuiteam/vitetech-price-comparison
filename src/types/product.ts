export interface MerchantOffer {
  merchantName: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  productUrl: string;
  logoUrl?: string;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export interface ReviewItem {
  rating?: number;
  date?: string;
  title?: string;
  content?: string;
  source?: string;
  author?: string;
}

export interface Product {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  images?: string[];
  sku: string;
  lowestPrice: number;
  highestPrice: number;
  offers: MerchantOffer[];
  priceHistory?: PriceHistoryPoint[];
  rating?: number;
  reviews?: number;
  reviewsList?: ReviewItem[];
}
