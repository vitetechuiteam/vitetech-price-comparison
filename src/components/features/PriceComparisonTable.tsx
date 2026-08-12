import { Tag, ExternalLink, PackageCheck, PackageX } from "lucide-react";
import type { Product } from "@/types/product";
import { formatINR } from "@/lib/format";
import { getStoreIconUrl } from "@/lib/storeIcon";

function discountPct(price: number, original: number): number {
  return Math.round(((original - price) / original) * 100);
}

export function PriceComparisonTable({ product }: { product: Product }) {
  const hasSpread = product.lowestPrice !== product.highestPrice;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">

      {/* Section header */}
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">
          Compare Prices Across Stores
        </h2>
        <p className="mt-0.5 text-sm text-foreground-muted">
          {product.offers.length} stores · prices updated daily
        </p>
      </div>

      {/* Scrollable table — horizontal scroll on narrow screens */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-subtle">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                Store
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                Price
              </th>
              <th className="hidden px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-foreground-subtle sm:table-cell">
                Discount
              </th>
              <th className="hidden px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-foreground-subtle md:table-cell">
                Availability
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {product.offers.map((offer, idx) => {
              const isBest    = offer.price === product.lowestPrice;
              const isHighest = hasSpread && offer.price === product.highestPrice;
              const discount  = offer.originalPrice && offer.originalPrice > offer.price
                ? discountPct(offer.price, offer.originalPrice)
                : null;

              return (
                <tr
                  key={offer.merchantName}
                  className={[
                    "transition-colors",
                    isBest ? "bg-success/5" : "hover:bg-surface-subtle",
                  ].join(" ")}
                >
                  {/* Store name + rank + badge */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-foreground-muted">
                        {idx + 1}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getStoreIconUrl(offer.merchantName, offer.productUrl)}
                        alt=""
                        width={18}
                        height={18}
                        className="h-[18px] w-[18px] shrink-0 rounded-sm object-contain"
                        aria-hidden="true"
                      />
                      <span className="font-medium text-foreground">
                        {offer.merchantName}
                      </span>
                      {isBest && (
                        <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                          <Tag className="h-2.5 w-2.5" aria-hidden="true" />
                          Best Deal
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span
                        className={[
                          "tabular-nums font-bold",
                          isBest    ? "text-base text-success" :
                          isHighest ? "text-error/75"          :
                                      "text-foreground",
                        ].join(" ")}
                      >
                        {formatINR(offer.price)}
                      </span>
                      {offer.originalPrice && offer.originalPrice > offer.price && (
                        <span className="tabular-nums text-xs text-foreground-subtle line-through">
                          {formatINR(offer.originalPrice)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Discount % — hidden on mobile */}
                  <td className="hidden px-6 py-4 text-center sm:table-cell">
                    {discount && discount > 0 ? (
                      <span className="rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-bold text-secondary-dark">
                        {discount}% off
                      </span>
                    ) : (
                      <span className="text-foreground-subtle">—</span>
                    )}
                  </td>

                  {/* Availability — hidden on mobile/tablet */}
                  <td className="hidden px-6 py-4 text-center md:table-cell">
                    {offer.inStock ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <PackageCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground-subtle">
                        <PackageX className="h-3.5 w-3.5" aria-hidden="true" />
                        Out of Stock
                      </span>
                    )}
                  </td>

                  {/* Buy button */}
                  <td className="px-6 py-4 text-center">
                    {offer.inStock ? (
                      <a
                        href={offer.productUrl}
                        target="_blank"
                        rel="nofollow sponsored noopener noreferrer"
                        aria-label={`Buy ${product.title} from ${offer.merchantName}`}
                        className={[
                          "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-colors",
                          isBest
                            ? "bg-success text-white hover:bg-success/90"
                            : "border border-border bg-surface text-foreground hover:bg-surface-muted",
                        ].join(" ")}
                      >
                        Buy Now
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="text-xs text-foreground-subtle">Unavailable</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
