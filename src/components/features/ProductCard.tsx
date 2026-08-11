import Link from "next/link";
import { ExternalLink, Tag, PackageX } from "lucide-react";
import type { Product } from "@/types/product";
import { formatINR } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const hasSpread = product.lowestPrice !== product.highestPrice;

  return (
    /*
     * Stretched-link pattern: the <Link> covers the card with position:absolute,
     * and each buy <a> is position:relative z-10 so it sits above the overlay.
     */
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-md transition-shadow hover:shadow-lg">

      {/* Card-level navigation overlay */}
      <Link
        href={`/product/${product.id}`}
        className="absolute inset-0 z-0 rounded-2xl"
        aria-label={`View details for ${product.title}`}
      />

      {/* Product image */}
      <div className="relative flex h-48 w-full items-center justify-center bg-surface-subtle p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.title}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">

        {/* Category + title */}
        <div>
          <span className="text-caption mb-1 block text-foreground-subtle">
            {product.category}
          </span>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {product.title}
          </h3>
        </div>

        {/* Price range summary */}
        <div className="flex items-baseline gap-2">
          <span className="text-price-sm text-success">{formatINR(product.lowestPrice)}</span>
          {hasSpread && (
            <>
              <span className="text-xs text-foreground-subtle">–</span>
              <span className="text-sm font-medium text-error">
                {formatINR(product.highestPrice)}
              </span>
            </>
          )}
        </div>

        {/* Merchant offer rows */}
        <ul className="flex flex-col gap-1.5">
          {product.offers.map((offer) => {
            const isBest    = offer.price === product.lowestPrice;
            const isHighest = hasSpread && offer.price === product.highestPrice;

            return (
              <li
                key={offer.merchantName}
                className={[
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-opacity",
                  isBest ? "border border-success/20 bg-success/10" : "bg-surface-subtle",
                  !offer.inStock ? "opacity-50" : "",
                ].join(" ")}
              >
                {/* Left: merchant name + badges */}
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-medium text-foreground">
                    {offer.merchantName}
                  </span>

                  {isBest && (
                    <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                      <Tag className="h-2.5 w-2.5" aria-hidden="true" />
                      Best Deal
                    </span>
                  )}

                  {!offer.inStock && (
                    <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-foreground-subtle">
                      <PackageX className="h-2.5 w-2.5" aria-hidden="true" />
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Right: price + buy link (relative z-10 to sit above card overlay) */}
                <div className="relative z-10 ml-2 flex shrink-0 items-center gap-2">
                  <span
                    className={[
                      "tabular-nums font-bold",
                      isBest    ? "text-success"  :
                      isHighest ? "text-error/75" :
                                  "text-foreground",
                    ].join(" ")}
                  >
                    {formatINR(offer.price)}
                  </span>

                  {offer.inStock && (
                    <a
                      href={offer.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Buy from ${offer.merchantName}`}
                      className="text-primary hover:text-primary-dark"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

      </div>
    </article>
  );
}
