import Link from "next/link";
import { Package, Tag } from "lucide-react";
import { BackButton } from "@/components/features/BackButton";
import type { Product } from "@/types/product";
import { getCachedProduct, getCachedPageToken, getRecentSearchResults } from "@/services/productCache";
import { getProductByPageToken, getProductByIdFromSerpApi } from "@/services/serpApiProductService";
import { PriceComparisonTable } from "@/components/features/PriceComparisonTable";
import { PriceHistoryChart } from "@/components/features/PriceHistoryChart";
import { ProductImageGallery } from "@/components/features/ProductImageGallery";
import { SimilarProducts } from "@/components/features/SimilarProducts";
import { ProductReviews } from "@/components/features/ProductReviews";
import { formatINR } from "@/lib/format";

export const maxDuration = 60;

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  const { id } = await params;
  const { d }  = await searchParams;

  // Step 1: Decode basic product data from URL param (passed by ProductCard).
  // This gives us immediate fallback data (title, image, 1 store) if the API fails.
  let fallback: Product | null = null;
  if (d) {
    try {
      const parsed = JSON.parse(decodeURIComponent(d)) as Omit<Product, "id">;
      if (parsed.title && Array.isArray(parsed.offers)) {
        fallback = { id, ...parsed };
      }
    } catch { /* ignore malformed param */ }
  }
  if (!fallback) {
    fallback = getCachedProduct(id) ?? null;
  }

  // Step 2: Use the cached immersive page_token (set during search) to call
  // google_immersive_product — this returns ALL sellers with direct store links.
  // Falls back to google_product (numeric IDs only), then URL param data.
  const pageToken = getCachedPageToken(id);
  const liveProduct = pageToken
    ? await getProductByPageToken(
        pageToken,
        id,
        fallback?.title    ?? "Product",
        fallback?.imageUrl ?? "",
      )
    : await getProductByIdFromSerpApi(id);

  // The in-memory cache (set during search) always carries rating/reviews.
  // Use it as a reliable source even when the URL snap predates the rating fix.
  const cachedProduct = getCachedProduct(id);

  // Prefer live multi-store data; fall back to single-store URL param data.
  // Merge: live data has offers/prices; cache/fallback has rating/reviews.
  const product: Product | null = liveProduct
    ? {
        ...liveProduct,
        rating:      liveProduct.rating      ?? cachedProduct?.rating  ?? fallback?.rating,
        reviews:     liveProduct.reviews     ?? cachedProduct?.reviews ?? fallback?.reviews,
        reviewsList: liveProduct.reviewsList ?? cachedProduct?.reviewsList,
        // Merge: API images + search-result gallery thumbnails (from snap/cache)
        images: (() => {
          const merged = [...new Set([
            ...(liveProduct.images     ?? []),
            ...(fallback?.images       ?? []),
            ...(cachedProduct?.images  ?? []),
          ].filter(Boolean))];
          return merged.length > 0 ? merged : undefined;
        })(),
      }
    : fallback;

  /* ── Not found ── */
  if (!product) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <Package className="h-12 w-12 text-foreground-subtle" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-foreground">Product not found</h1>
        <p className="max-w-xs text-sm text-foreground-muted">
          This product doesn&apos;t exist or may have been removed.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  // Use fallback title/image when live data doesn't have them
  const title    = product.title    || fallback?.title    || "Product";
  const imageUrl = product.imageUrl || fallback?.imageUrl || "";

  const hasSpread  = product.lowestPrice !== product.highestPrice;
  const bestOffer  = product.offers.find((o) => o.inStock && o.price === product.lowestPrice);
  const similarProducts = getRecentSearchResults().filter((p) => p.id !== id).slice(0, 8);
  const savingsPct = hasSpread
    ? Math.round(((product.highestPrice - product.lowestPrice) / product.highestPrice) * 100)
    : 0;

  return (
    <div className="w-full flex-1 px-6 py-8 sm:px-10">

      {/* Back link — uses browser history so it restores the previous search results */}
      <BackButton />

      {/* ── Product hero — single card ── */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col lg:flex-row">

          {/* Image panel */}
          <div className="border-b border-border bg-surface-subtle p-6 lg:w-2/5 lg:border-b-0 lg:border-r">
            <ProductImageGallery
              images={product.images && product.images.length > 0 ? product.images : [imageUrl]}
              alt={title}
            />
          </div>

          {/* Info panel */}
          <div className="flex flex-col justify-center gap-5 p-7 lg:w-3/5">

            <h1 className="text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">
              {title}
            </h1>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-0.5 text-sm font-bold text-white">
                  {product.rating.toFixed(1)} ★
                </span>
                {product.reviews && (
                  <span className="text-sm text-foreground-muted">
                    {product.reviews.toLocaleString()} ratings &amp; reviews
                  </span>
                )}
              </div>
            )}

            {/* Price range box */}
            <div className="rounded-xl bg-orange-50 px-5 py-4 ring-1 ring-orange-100">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-orange-700">
                <Tag className="h-3 w-3" aria-hidden="true" />
                Price Range Across Stores
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl font-black text-gray-900">{formatINR(product.lowestPrice)}</span>
                {hasSpread && (
                  <>
                    <span className="text-lg text-gray-400 line-through">{formatINR(product.highestPrice)}</span>
                    <span className="rounded-full bg-green-100 px-3 py-0.5 text-sm font-bold text-green-700">
                      Save {formatINR(product.highestPrice - product.lowestPrice)} ({savingsPct}%)
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1.5 text-xs text-gray-400">
                Compared across {product.offers.length} {product.offers.length === 1 ? "store" : "stores"}
              </p>
            </div>

            {/* Best-price CTA — direct store link from google_product */}
            {bestOffer && (
              <a
                href={bestOffer.productUrl}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-success px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-success/90"
              >
                Buy at Best Price — {formatINR(product.lowestPrice)}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Price comparison table ── */}
      <div className="mb-6">
        <PriceComparisonTable product={product} />
      </div>

      {/* ── Price history chart ── */}
      {product.priceHistory && product.priceHistory.length > 0 && (
        <PriceHistoryChart
          history={product.priceHistory}
          currentLowestPrice={product.lowestPrice}
        />
      )}

      {/* ── Customer reviews ── */}
      {product.reviewsList && product.reviewsList.length > 0 && (
        <ProductReviews
          reviews={product.reviewsList}
          overallRating={product.rating}
          totalReviews={product.reviews}
        />
      )}

      {/* ── Similar products ── */}
      <SimilarProducts products={similarProducts} />
    </div>
  );
}
