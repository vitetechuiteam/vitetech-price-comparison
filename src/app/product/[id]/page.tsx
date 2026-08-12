import Link from "next/link";
import { Package } from "lucide-react";
import { BackButton } from "@/components/features/BackButton";
import type { Product } from "@/types/product";
import { getCachedProduct, getCachedPageToken } from "@/services/productCache";
import { getProductByPageToken, getProductByIdFromSerpApi } from "@/services/serpApiProductService";
import { PriceComparisonTable } from "@/components/features/PriceComparisonTable";
import { PriceHistoryChart } from "@/components/features/PriceHistoryChart";
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

  // Prefer live multi-store data; fall back to single-store URL param data.
  const product: Product | null = liveProduct ?? fallback;

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
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  // Use fallback title/image when live data doesn't have them
  const title    = product.title    || fallback?.title    || "Product";
  const imageUrl = product.imageUrl || fallback?.imageUrl || "";
  const category = product.category || fallback?.category || "";

  const hasSpread = product.lowestPrice !== product.highestPrice;
  const bestOffer = product.offers.find((o) => o.inStock && o.price === product.lowestPrice);

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">

      {/* Back link — uses browser history so it restores the previous search results */}
      <BackButton />

      {/* ── Product hero ── */}
      <div className="mb-8 flex flex-col gap-8 lg:flex-row">

        {/* Image panel */}
        <div className="flex items-center justify-center rounded-2xl border border-border bg-surface-subtle p-8 lg:w-2/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="max-h-72 w-full object-contain"
          />
        </div>

        {/* Info panel */}
        <div className="flex flex-col justify-center gap-5 lg:w-3/5">

          <div>
            <span className="text-caption text-foreground-subtle">{category}</span>
            <h1 className="mt-1 text-2xl font-bold leading-snug text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-xs text-foreground-subtle">SKU: {product.sku}</p>
          </div>

          {/* Price range */}
          <div className="flex items-baseline gap-3">
            <span className="text-price text-success">{formatINR(product.lowestPrice)}</span>
            {hasSpread && (
              <>
                <span className="text-foreground-subtle">–</span>
                <span className="text-lg font-semibold text-error/75">
                  {formatINR(product.highestPrice)}
                </span>
              </>
            )}
          </div>

          <p className="text-sm text-foreground-muted">
            Available across{" "}
            <span className="font-semibold text-foreground">{product.offers.length}</span>{" "}
            {product.offers.length === 1 ? "store" : "stores"}
          </p>

          {/* Best-price CTA — direct store link from google_product */}
          {bestOffer && (
            <a
              href={bestOffer.productUrl}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-success px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-success/90"
            >
              Buy at Best Price — {formatINR(product.lowestPrice)}
            </a>
          )}
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
    </div>
  );
}
