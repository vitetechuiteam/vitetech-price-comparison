import { Star } from "lucide-react";
import type { ReviewItem } from "@/types/product";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export function ProductReviews({
  reviews,
  overallRating,
  totalReviews,
}: {
  reviews: ReviewItem[];
  overallRating?: number;
  totalReviews?: number;
}) {
  if (reviews.length === 0) return null;

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900">Customer Reviews</h2>
          {overallRating && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-0.5 text-sm font-bold text-white">
                {overallRating.toFixed(1)} ★
              </span>
              {totalReviews && (
                <span className="text-sm text-foreground-muted">
                  {totalReviews.toLocaleString()} ratings
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review cards */}
      <div className="divide-y divide-border">
        {reviews.map((review, idx) => (
          <div key={idx} className="px-6 py-4">
            {/* Top row: stars + date */}
            <div className="mb-2 flex flex-wrap items-center gap-3">
              {review.rating && <Stars rating={review.rating} />}
              {review.date && (
                <span className="text-xs text-foreground-subtle">{review.date}</span>
              )}
              {review.source && (
                <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold text-foreground-muted">
                  {review.source}
                </span>
              )}
            </div>

            {/* Title */}
            {review.title && (
              <p className="mb-1 text-sm font-semibold text-gray-900">{review.title}</p>
            )}

            {/* Content */}
            {review.content && (
              <p className="text-sm leading-relaxed text-foreground-muted">{review.content}</p>
            )}

            {/* Author */}
            {review.author && (
              <p className="mt-2 text-xs font-medium text-foreground-subtle">— {review.author}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
