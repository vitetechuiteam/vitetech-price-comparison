"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, PackageSearch, SlidersHorizontal, X, Star, ChevronDown, ChevronUp, ListFilter, ArrowUpDown, Check } from "lucide-react";
import type { Product } from "@/types/product";
import { ProductCard } from "@/components/features/ProductCard";
import { formatINR } from "@/lib/format";

const PAGE_SIZE = 8;
const SHOW_LIMIT = 5;

type SortKey = "popularity" | "price-asc" | "price-desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popularity",  label: "Popularity" },
  { value: "price-asc",   label: "Price: Low to High" },
  { value: "price-desc",  label: "Price: High to Low" },
];

const RATING_OPTIONS = [
  { value: 4, label: "4★ & above" },
  { value: 3, label: "3★ & above" },
  { value: 2, label: "2★ & above" },
];

/* ── Skeleton card ───────────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-border bg-white shadow-md">
      <div className="h-48 bg-gray-200" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-3 w-1/3 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-8 rounded bg-gray-200" />
        <div className="h-8 rounded bg-gray-200" />
      </div>
    </div>
  );
}

/* ── Filter section wrapper ──────────────────────────────────────────────────── */

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 pb-4 last:border-0">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">{title}</p>
      {children}
    </div>
  );
}

/* ── Star display ────────────────────────────────────────────────────────────── */

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= value ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </span>
  );
}

/* ── Dual-handle price range slider ─────────────────────────────────────────── */

const THUMB =
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-orange-500 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-orange-500 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none";

function PriceRangeSlider({
  absMin, absMax, valueMin, valueMax,
  onChange,
}: {
  absMin: number; absMax: number;
  valueMin: number; valueMax: number;
  onChange: (min: number, max: number) => void;
}) {
  const span    = absMax - absMin || 1;
  const leftPct  = ((valueMin - absMin) / span) * 100;
  const rightPct = ((valueMax - absMin) / span) * 100;
  const step     = Math.max(100, Math.round(span / 100) * 10);

  return (
    <div className="px-1">
      <div className="relative h-6 w-full">
        <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-gray-200" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-orange-500"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        <input
          type="range" min={absMin} max={absMax} step={step} value={valueMin}
          onChange={(e) => onChange(Math.min(Number(e.target.value), valueMax - step), valueMax)}
          className={`pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent ${THUMB}`}
        />
        <input
          type="range" min={absMin} max={absMax} step={step} value={valueMax}
          onChange={(e) => onChange(valueMin, Math.max(Number(e.target.value), valueMin + step))}
          className={`pointer-events-none absolute inset-0 h-full w-full appearance-none bg-transparent ${THUMB}`}
        />
      </div>
      <div className="mt-3 flex justify-between text-xs font-medium text-gray-600">
        <span>{formatINR(valueMin)}</span>
        <span>{formatINR(valueMax)}</span>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────────── */

function SearchResults() {
  const searchParams = useSearchParams();
  const urlQuery     = searchParams.get("q") ?? "";

  const [allProducts,  setAllProducts]  = useState<Product[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading,      setLoading]      = useState(false);

  // Filter state
  const [priceMin,          setPriceMin]           = useState<number | null>(null);
  const [priceMax,          setPriceMax]           = useState<number | null>(null);
  const [selectedBrands,    setSelectedBrands]     = useState<Set<string>>(new Set());
  const [selectedPlatforms, setSelectedPlatforms]  = useState<Set<string>>(new Set());
  const [minRating,         setMinRating]          = useState<number | null>(null);
  const [sortBy,            setSortBy]             = useState<SortKey>("popularity");

  // UI state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortSheetOpen,    setSortSheetOpen]    = useState(false);
  const [showAllBrands,    setShowAllBrands]    = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  const sentinelRef      = useRef<HTMLDivElement>(null);
  const lastFetchedQuery = useRef("");

  /* ── Derived filter options from loaded products ─────────────────────────────── */

  const { brands, platforms, priceStats } = useMemo(() => {
    const brandCount   = new Map<string, number>();
    const platformSet  = new Set<string>();
    const prices: number[] = [];

    allProducts.forEach((p) => {
      prices.push(p.lowestPrice);
      const brand = p.title.split(" ")[0];
      if (brand) brandCount.set(brand, (brandCount.get(brand) ?? 0) + 1);
      p.offers.forEach((o) => platformSet.add(o.merchantName));
    });

    const brands = [...brandCount.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([brand]) => brand);

    return {
      brands,
      platforms: [...platformSet].sort(),
      priceStats: {
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 0,
      },
    };
  }, [allProducts]);

  /* ── Filtered + sorted products ──────────────────────────────────────────────── */

  const processedProducts = useMemo(() => {
    let result = allProducts.filter((p) => {
      if (priceMin !== null && p.lowestPrice < priceMin) return false;
      if (priceMax !== null && p.lowestPrice > priceMax) return false;
      if (selectedBrands.size > 0 && !selectedBrands.has(p.title.split(" ")[0])) return false;
      if (selectedPlatforms.size > 0 && !p.offers.some((o) => selectedPlatforms.has(o.merchantName))) return false;
      if (minRating !== null && (p.rating ?? 0) < minRating) return false;
      return true;
    });

    if (sortBy === "price-asc")  result = [...result].sort((a, b) => a.lowestPrice - b.lowestPrice);
    if (sortBy === "price-desc") result = [...result].sort((a, b) => b.lowestPrice - a.lowestPrice);
    return result;
  }, [allProducts, priceMin, priceMax, selectedBrands, selectedPlatforms, minRating, sortBy]);

  const visibleProducts = processedProducts.slice(0, visibleCount);
  const hasMore         = visibleCount < processedProducts.length;

  const activeFilterCount =
    (priceMin !== null ? 1 : 0) +
    (priceMax !== null ? 1 : 0) +
    selectedBrands.size +
    selectedPlatforms.size +
    (minRating !== null ? 1 : 0);

  /* ── Reset visible count when filters/sort change ────────────────────────────── */

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [priceMin, priceMax, selectedBrands, selectedPlatforms, minRating, sortBy]);

  /* ── Fetch ───────────────────────────────────────────────────────────────────── */

  async function fetchProducts(q: string) {
    setLoading(true);
    setAllProducts([]);
    setVisibleCount(PAGE_SIZE);
    setPriceMin(null);
    setPriceMax(null);
    setSelectedBrands(new Set());
    setSelectedPlatforms(new Set());
    setMinRating(null);
    setSortBy("popularity");
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const json = await res.json() as { products: Product[] };
      setAllProducts(json.products);
    } catch {
      setAllProducts([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (urlQuery && urlQuery !== lastFetchedQuery.current) {
      lastFetchedQuery.current = urlQuery;
      fetchProducts(urlQuery);
    }
  }, [urlQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Infinite scroll ─────────────────────────────────────────────────────────── */

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount((prev) => prev + PAGE_SIZE); },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, visibleProducts.length]);

  /* ── Helpers ─────────────────────────────────────────────────────────────────── */

  function toggleSet<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    return next;
  }

  function resetFilters() {
    setPriceMin(null);
    setPriceMax(null);
    setSelectedBrands(new Set());
    setSelectedPlatforms(new Set());
    setMinRating(null);
  }

  /* ── Filter sidebar content ──────────────────────────────────────────────────── */

  const filterSidebar = (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </span>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex cursor-pointer items-center gap-1 text-xs text-orange-500 hover:text-orange-600"
          >
            <X className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {/* Price Range */}
      {priceStats.max > priceStats.min && (
        <FilterSection title="Price Range">
          <PriceRangeSlider
            absMin={priceStats.min}
            absMax={priceStats.max}
            valueMin={priceMin ?? priceStats.min}
            valueMax={priceMax ?? priceStats.max}
            onChange={(lo, hi) => {
              setPriceMin(lo <= priceStats.min ? null : lo);
              setPriceMax(hi >= priceStats.max ? null : hi);
            }}
          />
        </FilterSection>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <FilterSection title="Brands">
          <div className="flex flex-col gap-2">
            {(showAllBrands ? brands : brands.slice(0, SHOW_LIMIT)).map((brand) => (
              <label key={brand} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedBrands.has(brand)}
                  onChange={() => setSelectedBrands(toggleSet(selectedBrands, brand))}
                  className="accent-orange-500"
                />
                {brand}
              </label>
            ))}
          </div>
          {brands.length > SHOW_LIMIT && (
            <button
              onClick={() => setShowAllBrands(!showAllBrands)}
              className="mt-2 flex cursor-pointer items-center gap-1 text-xs text-orange-500 hover:text-orange-600"
            >
              {showAllBrands ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Show {brands.length - SHOW_LIMIT} more</>}
            </button>
          )}
        </FilterSection>
      )}

      {/* Platforms */}
      {platforms.length > 0 && (
        <FilterSection title="Platforms">
          <div className="flex flex-col gap-2">
            {(showAllPlatforms ? platforms : platforms.slice(0, SHOW_LIMIT)).map((platform) => (
              <label key={platform} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedPlatforms.has(platform)}
                  onChange={() => setSelectedPlatforms(toggleSet(selectedPlatforms, platform))}
                  className="accent-orange-500"
                />
                <span className="truncate">{platform}</span>
              </label>
            ))}
          </div>
          {platforms.length > SHOW_LIMIT && (
            <button
              onClick={() => setShowAllPlatforms(!showAllPlatforms)}
              className="mt-2 flex cursor-pointer items-center gap-1 text-xs text-orange-500 hover:text-orange-600"
            >
              {showAllPlatforms ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Show {platforms.length - SHOW_LIMIT} more</>}
            </button>
          )}
        </FilterSection>
      )}

      {/* Customer Ratings */}
      <FilterSection title="Customer Ratings">
        <div className="flex flex-col gap-2">
          {RATING_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="rating"
                checked={minRating === opt.value}
                onChange={() => setMinRating(minRating === opt.value ? null : opt.value)}
                className="accent-orange-500"
              />
              <Stars value={opt.value} />
              <span className="text-xs text-gray-600">{opt.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

    </div>
  );

  /* ── Render ──────────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Mobile: Sort bottom sheet ────────────────────────────────────────────── */}
      {sortSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSortSheetOpen(false)}
          />
          {/* Sheet */}
          <div className="relative rounded-t-2xl bg-white px-4 pb-8 pt-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-bold text-gray-800">Sort By</span>
              <button
                onClick={() => setSortSheetOpen(false)}
                className="cursor-pointer rounded-full p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col divide-y divide-gray-100">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setSortSheetOpen(false); }}
                  className="flex cursor-pointer items-center justify-between py-3.5 text-sm font-medium text-gray-700"
                >
                  {opt.label}
                  {sortBy === opt.value && <Check className="h-4 w-4 text-orange-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile: Filter full-screen drawer ───────────────────────────────────── */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFilterDrawerOpen(false)}
          />
          {/* Drawer — slides up, scrollable */}
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[90vh] flex-col rounded-t-2xl bg-white shadow-xl">
            {/* Drawer header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-base font-bold text-gray-800">
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="cursor-pointer text-xs font-medium text-orange-500"
                  >
                    Reset all
                  </button>
                )}
                <button
                  onClick={() => setFilterDrawerOpen(false)}
                  className="cursor-pointer rounded-full p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {filterSidebar}
            </div>
            {/* Done button */}
            <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3">
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="w-full cursor-pointer rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-6">
        <div className="flex gap-6">

          {/* Desktop filter sidebar */}
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-20 rounded-2xl border border-border bg-white p-4 shadow-sm">
              {filterSidebar}
            </div>
          </aside>

          {/* Results column */}
          <div className="min-w-0 flex-1">

            {/* Desktop sort bar */}
            <div className="mb-5 hidden items-center justify-end gap-3 lg:flex">
              <span className="text-sm text-gray-500">Sort by:</span>
              <div className="flex overflow-hidden rounded-lg border border-border bg-white text-sm font-medium shadow-sm">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`px-4 py-2 transition-colors ${
                      sortBy === opt.value
                        ? "cursor-default bg-orange-500 text-white"
                        : "cursor-pointer text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Empty state */}
            {!loading && processedProducts.length === 0 && urlQuery && (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <PackageSearch className="h-12 w-12 text-foreground-subtle" aria-hidden="true" />
                <p className="text-lg font-semibold text-foreground">
                  {allProducts.length > 0 ? "No products match your filters" : "No products found"}
                </p>
                <p className="max-w-xs text-sm text-foreground-muted">
                  {allProducts.length > 0
                    ? "Try adjusting or resetting your filters."
                    : "Try a different search term or check your spelling."}
                </p>
                {allProducts.length > 0 && (
                  <button
                    onClick={resetFilters}
                    className="cursor-pointer rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}

            {/* Product grid */}
            {!loading && visibleProducts.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <div ref={sentinelRef} className="flex justify-center py-10">
                  {hasMore && (
                    <div className="flex items-center gap-2 text-sm text-foreground-muted">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                      Loading more…
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* ── Mobile: Fixed bottom Sort | Filter bar ───────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-gray-200 bg-white lg:hidden">
        <button
          onClick={() => setSortSheetOpen(true)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 border-r border-gray-200 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100"
        >
          <ArrowUpDown className="h-4 w-4" />
          Sort
          {sortBy !== "popularity" && (
            <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">1</span>
          )}
        </button>
        <button
          onClick={() => setFilterDrawerOpen(true)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100"
        >
          <ListFilter className="h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

    </div>
  );
}

/* ── Page export ─────────────────────────────────────────────────────────────── */

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
