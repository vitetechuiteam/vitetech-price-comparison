"use client";

import Link from "next/link";
import Image from "next/image";
import { UserCircle, Search, X, Eye, EyeOff, LogOut, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

/* ── Search bar rendered inside navbar — only on /search ─────────────────────── */

function NavSearchBar() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  function handleSearch() {
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="mx-6 flex flex-1 justify-center">
      <div className="flex w-full max-w-xl items-stretch overflow-hidden rounded-xl border border-border bg-gray-50">
        <div className="flex items-center pl-3 pr-2 text-foreground-subtle" aria-hidden="true">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search for products…"
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-foreground-subtle"
          aria-label="Search products"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="flex cursor-pointer items-center gap-1.5 bg-orange-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-orange-600"
        >
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </div>
  );
}

/* ── Auth modal ──────────────────────────────────────────────────────────────── */

interface AuthUser { name: string; email: string }

function AuthModal({
  onClose,
  onAuth,
}: {
  onClose: () => void;
  onAuth: (user: AuthUser) => void;
}) {
  const [tab, setTab]             = useState<"signin" | "signup">("signin");
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    if (tab === "signup" && !name.trim()) { setError("Please enter your name."); return; }
    onAuth({ name: tab === "signup" ? name.trim() : email.split("@")[0], email });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 cursor-pointer rounded-full p-1 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pb-0 pt-6">
          <Image src="/logo.svg" alt="BuyJet" width={90} height={20} className="mb-4" />
          <h2 className="text-xl font-bold text-gray-900">
            {tab === "signin" ? "Welcome back" : "Create account"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {tab === "signin"
              ? "Sign in to track prices and save products."
              : "Join BuyJet to get the best deals."}
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex border-b border-gray-100 px-6">
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={[
                "cursor-pointer pb-2 pr-6 text-sm font-semibold transition-colors",
                tab === t
                  ? "border-b-2 border-orange-500 text-orange-500"
                  : "text-gray-400 hover:text-gray-600",
              ].join(" ")}
            >
              {t === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          {tab === "signup" && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-10 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
          )}

          <button
            type="submit"
            className="mt-1 w-full cursor-pointer rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600"
          >
            {tab === "signin" ? "Sign In" : "Create Account"}
          </button>

          <p className="text-center text-xs text-gray-400">
            {tab === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => { setTab(tab === "signin" ? "signup" : "signin"); setError(""); }}
              className="cursor-pointer font-semibold text-orange-500 hover:text-orange-600"
            >
              {tab === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

/* ── Navbar ──────────────────────────────────────────────────────────────────── */

export default function Navbar() {
  const [scrolled, setScrolled]       = useState(false);
  const [authOpen, setAuthOpen]       = useState(false);
  const [user, setUser]               = useState<AuthUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef                   = useRef<HTMLDivElement>(null);

  const pathname     = usePathname();
  const isSearchPage = pathname === "/search";

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 10); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleAuth(u: AuthUser) {
    setUser(u);
    setAuthOpen(false);
  }

  function handleSignOut() {
    setUser(null);
    setDropdownOpen(false);
  }

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 w-full border-b border-border bg-white shadow-sm transition-all duration-300">
        <div className="w-full px-6 sm:px-10">
          <div className={`flex items-center transition-all duration-300 ${scrolled ? "h-12" : "h-16"}`}>

            {/* Logo — always left */}
            <Link href="/" className="flex flex-shrink-0 cursor-pointer items-center no-underline hover:no-underline">
              <Image
                src="/logo.svg"
                alt="BuyJet"
                width={160}
                height={36}
                priority
                style={{
                  width:      scrolled ? 120 : 160,
                  height:     scrolled ? 27  : 36,
                  transition: "width 0.3s, height 0.3s",
                }}
              />
            </Link>

            {/* Search bar — center, only on /search page */}
            {isSearchPage && (
              <Suspense fallback={<div className="mx-6 flex-1" />}>
                <NavSearchBar />
              </Suspense>
            )}

            {/* Profile / Auth — always right */}
            <div className="relative ml-auto flex-shrink-0" ref={dropdownRef}>
              {user ? (
                <>
                  {/* Signed-in avatar button */}
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-gray-100"
                    aria-label="Account menu"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden max-w-[100px] truncate text-sm font-medium text-gray-700 sm:block">
                      {user.name}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
                      <div className="border-b border-gray-100 px-4 pb-2">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="truncate text-xs text-gray-400">{user.email}</p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Guest — profile icon opens auth modal */
                <button
                  onClick={() => setAuthOpen(true)}
                  aria-label="Sign in"
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <UserCircle className="h-5 w-5 text-gray-500" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Auth modal */}
      {authOpen && (
        <AuthModal onClose={() => setAuthOpen(false)} onAuth={handleAuth} />
      )}
    </>
  );
}
