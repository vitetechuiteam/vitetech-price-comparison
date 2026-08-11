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

export interface Product {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  sku: string;
  lowestPrice: number;
  highestPrice: number;
  offers: MerchantOffer[];
  priceHistory?: PriceHistoryPoint[];
}
