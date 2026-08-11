"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Shield,
  ChevronDown,
  Smartphone,
  Laptop,
  Tv,
  Headphones,
  Camera,
  Loader2,
  SlidersHorizontal,
  PackageSearch,
} from "lucide-react";
import type { Product } from "@/types/product";
import { ProductGrid } from "@/components/features/ProductGrid";

/* ── Static data ────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { icon: Smartphone, label: "Mobiles"  },
  { icon: Laptop,     label: "Laptops"  },
  { icon: Tv,         label: "TVs"      },
  { icon: Headphones, label: "Audio"    },
  { icon: Camera,     label: "Cameras"  },
] as const;

type SortKey = "price-asc" | "price-desc" | "name-asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "price-asc",  label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc",   label: "Name: A – Z"        },
];

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function Home() {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sortBy,  setSortBy]  = useState<SortKey>("price-asc");

  async function handleSearch(overrideQuery?: string) {
    const q = (overrideQuery ?? query).trim();
    if (!q || loading) return;
    setLoading(true);
    setSearched(true);
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const json = await res.json() as { products: Product[] };
      setResults(json.products);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }

  const sortedResults = useMemo((): Product[] => {
    const copy = [...results];
    switch (sortBy) {
      case "price-asc":  return copy.sort((a, b) => a.lowestPrice - b.lowestPrice);
      case "price-desc": return copy.sort((a, b) => b.lowestPrice - a.lowestPrice);
      case "name-asc":   return copy.sort((a, b) => a.title.localeCompare(b.title));
      default:           return copy;
    }
  }, [results, sortBy]);

  return (
    <>
      {/* ── Hero ── fills full viewport height only when no search has been run */}
      <section
        className={[
          "relative flex flex-col items-center justify-center overflow-hidden",
          "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 py-20 sm:py-28",
          searched ? "" : "flex-1",
        ].join(" ")}
      >

        {/* ── Decorative ambient blobs ─────────────────────────────────────── */}
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-white opacity-[0.04]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white opacity-[0.04]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/4 top-1/3 h-40 w-40 rounded-full bg-indigo-400 opacity-10 blur-2xl"
          aria-hidden="true"
        />

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="relative z-10 mx-auto w-full max-w-3xl text-center">

          {/* ── Trust badge (glassmorphism pill) ──────────────────────────── */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Shield className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
            <span className="text-xs font-semibold text-white">
              Trusted by Indian Shoppers
            </span>
          </div>

          {/* ── Headline ──────────────────────────────────────────────────── */}
          <h1 className="mb-5 text-4xl font-extrabold tracking-tighter leading-tight text-white sm:text-5xl lg:text-6xl">
            Shop Smarter.{" "}
            <span className="text-secondary">Pay Less.</span>
          </h1>

          {/* ── Sub-headline ──────────────────────────────────────────────── */}
          <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Compare prices across Amazon, Flipkart, Croma &amp; more —
            find the best deal in seconds, every time.
          </p>

          {/* ── Search bar ────────────────────────────────────────────────── */}
          <div className="mb-7 flex items-stretch overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Category selector — desktop only */}
            <div
              className="hidden sm:flex flex-shrink-0 cursor-default select-none items-center gap-1.5 border-r border-border bg-surface-subtle px-4 text-sm font-medium text-foreground-muted"
              aria-label="Category filter (coming soon)"
            >
              All Categories
              <ChevronDown className="h-3.5 w-3.5 text-foreground-subtle" aria-hidden="true" />
            </div>

            {/* Text input */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for iPhone 15, Samsung TV, Nike shoes…"
              className="min-w-0 flex-1 bg-transparent px-5 py-4 text-sm text-foreground placeholder:text-foreground-subtle outline-none"
              aria-label="Search products"
            />

            {/* Search button */}
            <button
              type="button"
              onClick={() => handleSearch()}
              aria-label="Search"
              className="flex flex-shrink-0 items-center gap-2 bg-orange-500 px-5 py-4 text-sm font-bold text-white transition-colors hover:bg-orange-600 sm:px-7"
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                : <Search  className="h-4 w-4"              aria-hidden="true" />
              }
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          {/* ── Quick Browse category pills (glassmorphism) ───────────────── */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="mb-1 w-full text-xs text-white/45">
              Quick Browse:
            </span>
            {CATEGORIES.map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => { setQuery(label); handleSearch(label); }}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ── Results section ─────────────────────────────────────────────────── */}
      {searched && (
        <section
          className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8"
          aria-label="Search results"
        >
          {loading ? (
            /* Loading spinner */
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-foreground-muted">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm font-medium">Fetching best prices…</p>
            </div>

          ) : results.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <PackageSearch className="h-12 w-12 text-foreground-subtle" aria-hidden="true" />
              <p className="text-lg font-semibold text-foreground">No products found</p>
              <p className="max-w-xs text-sm text-foreground-muted">
                Try a different search term or browse a category above.
              </p>
            </div>

          ) : (
            <>
              {/* Sort toolbar */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-foreground-muted">
                  <span className="font-semibold text-foreground">{results.length}</span>
                  {" "}{results.length === 1 ? "result" : "results"} found
                </p>

                <label className="flex items-center gap-2 text-sm text-foreground-muted">
                  <SlidersHorizontal className="h-4 w-4 text-foreground-subtle" aria-hidden="true" />
                  Sort by:
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground outline-none focus:border-primary"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Product grid */}
              <ProductGrid products={sortedResults} />
            </>
          )}
        </section>
      )}
    </>
  );
}
