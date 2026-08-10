import Link from "next/link";
import { TrendingDown } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="flex h-14 items-center">
          <Link
            href="/"
            className="flex items-center gap-2 no-underline hover:no-underline"
          >
            <TrendingDown className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <span className="text-lg font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              PriceCompare
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
