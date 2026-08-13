import type { MerchantOffer, PriceHistoryPoint } from "./product";

export type { MerchantOffer, PriceHistoryPoint };

/**
 * Extends MerchantOffer with the product-context fields each adapter must
 * supply so the aggregation layer can group offers by product without a
 * separate catalog look-up.
 */
export interface AdapterOffer extends MerchantOffer {
  productId: string;
  productTitle: string;
  productCategory: string;
  productImageUrl: string;
  productSku: string;
  priceHistory?: PriceHistoryPoint[];
  pageToken?: string;
  productRating?: number;
  productReviews?: number;
}

/** Contract every store adapter must satisfy. */
export interface MerchantAdapter {
  fetchOffers(query: string, start?: number): Promise<AdapterOffer[]>;
}
