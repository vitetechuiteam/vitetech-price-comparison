"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Shield,
  Smartphone,
  Laptop,
  Tv,
  Headphones,
  Camera,
} from "lucide-react";

const CATEGORIES = [
  { icon: Smartphone, label: "Mobiles"  },
  { icon: Laptop,     label: "Laptops"  },
  { icon: Tv,         label: "TVs"      },
  { icon: Headphones, label: "Audio"    },
  { icon: Camera,     label: "Cameras"  },
] as const;

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(overrideQuery?: string) {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 py-20 sm:py-28">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-white opacity-[0.04]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white opacity-[0.04]" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/4 top-1/3 h-40 w-40 rounded-full bg-indigo-400 opacity-10 blur-2xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">

        {/* Trust badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-sm">
          <Shield className="h-3.5 w-3.5 text-secondary" aria-hidden="true" />
          <span className="text-xs font-semibold text-white">Trusted by Indian Shoppers</span>
        </div>

        {/* Headline */}
        <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tighter text-white sm:text-5xl lg:text-6xl">
          Shop Smarter.{" "}
          <span className="text-secondary">Pay Less.</span>
        </h1>

        {/* Sub-headline */}
        <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
          Compare prices across Amazon, Flipkart, Croma &amp; more —
          find the best deal in seconds, every time.
        </p>

        {/* Search bar */}
        <div className="mb-7 flex items-stretch overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex flex-shrink-0 items-center pl-4 pr-2 text-foreground-subtle" aria-hidden="true">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search for iPhone 15, Samsung TV, Nike shoes…"
            className="min-w-0 flex-1 bg-transparent px-3 py-4 text-sm text-foreground placeholder:text-foreground-subtle outline-none"
            aria-label="Search products"
          />
          <button
            type="button"
            onClick={() => handleSearch()}
            aria-label="Search"
            className="flex cursor-pointer flex-shrink-0 items-center gap-2 bg-orange-500 px-5 py-4 text-sm font-bold text-white transition-colors hover:bg-orange-600 sm:px-7"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>

        {/* Quick Browse */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="mb-1 w-full text-xs text-white/45">Quick Browse:</span>
          {CATEGORIES.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleSearch(label)}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
