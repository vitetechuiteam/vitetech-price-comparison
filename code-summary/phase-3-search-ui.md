# Phase 3 — Search, Filtering, Deal Discovery UI & Product Detail Page

## Created / Modified files

| File | Action |
|---|---|
| `src/components/features/ProductCard.tsx` | Created — product card with deal badges; updated with stretched-link navigation and shared formatter |
| `src/components/features/ProductGrid.tsx` | Created — responsive grid wrapper |
| `src/components/features/PriceComparisonTable.tsx` | Created — multi-store price comparison table |
| `src/components/features/PriceHistoryChart.tsx` | Created — SVG price history chart with interactive time-range tabs |
| `src/app/product/[id]/page.tsx` | Created — dynamic server component product detail page |
| `src/app/page.tsx` | Updated — wired search state, mock adapter, sort toolbar, results section |
| `src/app/globals.css` | Updated — subtle diagonal gradient on body background |
| `src/lib/format.ts` | Created — shared `formatINR` utility |

---

## Search & Results (`page.tsx`)

All state lives in the single `Home` client component — the page was already `"use client"`.

| State | Type | Purpose |
|---|---|---|
| `query` | `string` | Controlled input value |
| `results` | `Product[]` | Raw results from adapter |
| `loading` | `boolean` | Prevents double-submit; shows spinner |
| `searched` | `boolean` | Guards the results section (hidden until first search) |
| `sortBy` | `SortKey` | Active sort selection |

`sortedResults` is derived via `useMemo` — no extra state, sort is computed on read.

### `handleSearch(overrideQuery?)`

Accepts an optional override to support Quick Browse category pills, which call `handleSearch(label)` before the controlled `query` state has updated.

Triggers: search button click, `Enter` key on the input, Quick Browse pill click.

### Sorting

| Value | Behaviour |
|---|---|
| `price-asc` | Sort by `lowestPrice` ascending (default) |
| `price-desc` | Sort by `lowestPrice` descending |
| `name-asc` | Sort by `title` alphabetically |

### Hero height behaviour

- **No search run yet:** hero section has `flex-1` → fills the full viewport between Navbar and Footer.
- **After a search:** `flex-1` is removed from the hero; it collapses to its natural padding height and the results section expands below it.

---

## `ProductCard`

**Props:** `{ product: Product }`

- **Best Deal badge** (green) — offer row whose `price === product.lowestPrice`.
- **Highest price** (muted red) — offer row whose `price === product.highestPrice`, only when a price spread exists.
- **Out of Stock** — row at 50 % opacity with `PackageX` icon.
- **Buy link** — `ExternalLink` icon; hidden for out-of-stock items.
- **Navigation** — stretched-link pattern: a `<Link>` with `absolute inset-0 z-0` covers the card; buy `<a>` tags use `relative z-10` to sit above it. Clicking the card body navigates to `/product/[id]`.
- Uses `<img>` (not `next/image`) to avoid changes to `next.config.ts`.

## `ProductGrid`

**Props:** `{ products: Product[] }`

**Breakpoints:** `grid-cols-1` → `sm:grid-cols-2` → `lg:grid-cols-3` → `xl:grid-cols-4`

---

## Dynamic Product Detail Page (`/product/[id]`)

`src/app/product/[id]/page.tsx` is a **Next.js App Router async server component**.

```
URL: /product/prod-001  →  Apple iPhone 15 detail page
URL: /product/bad-id    →  "Product not found" state
```

- `params` typed as `Promise<{ id: string }>` (Next.js 15+ convention); awaited at the top of the component.
- Calls `getProductById(id)` from the mock adapter (500 ms simulated delay).
- No `generateStaticParams` → route is **dynamic (SSR on demand)**, shown as `ƒ` in the build output.
- Not-found state: `Package` icon + message + `Link` back to home.
- Detail page layout: back link → product hero (image + info) → `PriceComparisonTable` → `PriceHistoryChart`.

---

## `PriceComparisonTable`

**Props:** `{ product: Product }`

| Column | Visible on |
|---|---|
| Store (rank + name + Best Deal badge) | All breakpoints |
| Price (current + struck-through original) | All breakpoints |
| Discount % | sm+ |
| Availability | md+ |
| Action (Buy Now / Unavailable) | All breakpoints |

- Rank badge (1, 2, 3…) from offer position — adapter returns offers pre-sorted by price.
- Best-deal row: `bg-success/5` highlight + filled green "Buy Now" button.
- Highest-price row: price in `text-error/75`.
- Discount % badge uses amber token (`text-secondary-dark / bg-secondary/15`).
- Buy buttons carry `rel="nofollow sponsored noopener noreferrer"`.
- Table wrapped in `overflow-x-auto` — horizontal scroll on narrow viewports.

---

## `PriceHistoryChart`

**Props:** `{ history: PriceHistoryPoint[]; currentLowestPrice: number }`

Built with **plain SVG** — no chart library or new npm packages. Marked `"use client"` for interactive time-range tabs.

**SVG layout (viewBox `0 0 480 180`):**

| Token | Value |
|---|---|
| `plotW` | 440 |
| `plotH` | 100 |
| `mt / mb` | 36 / 44 |

**Visual elements:**
- Area fill: teal-to-transparent linear gradient via `--brand-primary` CSS var.
- Line stroke in brand teal.
- Dots: green for lowest price, red for highest (with halo ring), teal otherwise.
- Price labels above each dot; `Oct '24`-format date labels below the x-axis.
- Min/Max colour legend below the chart.

### Time-range tabs

The tab group is embedded **inline in the header row**, right-aligned via `flex items-center justify-between`. Labels are compact (`1M / 3M / 6M / MAX`).

**Header layout:**
```
Row 1 (flex justify-between):  "Price History"  ·····  [1M] [3M] [6M] [MAX]
Row 2 (mt-2 flex-wrap):        "Showing N months…"  ·  All-Time Low badge  ·  Trend badge
```

**Pill toggle styling:**
- Wrapper: `bg-surface-muted p-1 rounded-full` — subtle slate tray.
- Active pill: `bg-surface text-primary shadow-sm rounded-full` — white background, brand-teal text.
- Inactive enabled: transparent, `text-foreground-muted hover:text-foreground`.
- Insufficient-data: `opacity-40 cursor-default` — click ignored via guard in `onClick`.

| Tab | Points shown | Enabled when |
|---|---|---|
| 1M  | last 1 point  | always |
| 3M  | last 3 points | history ≥ 3 points |
| 6M  | last 6 points | history ≥ 6 points |
| MAX | all points    | always |

- Default: **MAX**.
- "All-Time Low!" badge always compares against the full history minimum, not the visible window.
- Trend badge compares first vs. last point of the *visible* window.

---

## Shared utility

`src/lib/format.ts` exports `formatINR(price: number): string` using `Intl.NumberFormat("en-IN", { currency: "INR" })`.
Used by: `ProductCard`, `PriceComparisonTable`, `PriceHistoryChart`, and the detail page.

---

## Global background gradient

`src/app/globals.css` — body background updated from flat white to a fixed diagonal gradient:

```css
background: linear-gradient(160deg, var(--surface-subtle) 0%, var(--surface-muted) 100%);
background-attachment: fixed;
```

Uses existing tokens (`--surface-subtle: #F8FAFC`, `--surface-muted: #F1F5F9`). The colour delta is ~3 % lightness — subtle depth behind white `bg-surface` panels without eye strain.

---

## Testing the UI in the browser

```bash
npm run dev
# → http://localhost:3000
```

### Search & results (home page)

| Test | Steps | Expected |
|---|---|---|
| Text search | Type `iphone` → Enter | Spinner, then 1 card with Amazon as Best Deal |
| Category browse | Click **Mobiles** pill | 2 cards (iPhone 15 + Samsung S24) |
| Sorting | Search `audio`, change Sort by dropdown | Grid re-orders without a network call |
| Empty state | Search `zzzzz` | PackageSearch icon + "No products found" |
| Out of stock | Search `iphone`, check Reliance Digital row | 50 % opacity, "Out of Stock" label, no buy link |

### Product detail page

**Direct URLs:**

| Product | URL |
|---|---|
| Apple iPhone 15 | `http://localhost:3000/product/prod-001` |
| Samsung Galaxy S24 | `http://localhost:3000/product/prod-002` |
| Sony WH-1000XM5 | `http://localhost:3000/product/prod-003` |
| LG C3 OLED TV | `http://localhost:3000/product/prod-004` |
| Dell XPS 15 | `http://localhost:3000/product/prod-005` |
| Not found | `http://localhost:3000/product/bad-id` |

**Via search flow:** search `iphone` → click the card body (not the buy icon) → navigates to `/product/prod-001`.

**What to verify:**
- Hero: image, title, SKU, category, price range, green "Buy at Best Price" CTA.
- Comparison table: Amazon row highlighted green; discount % and availability columns; Buy Now / Unavailable buttons.
- Price history chart: 4 data points; "All-Time Low!" badge; "Price dropping" trend pill.
- Time-range tabs: "6M" dimmed (only 4 data points); "3M" → chart redraws with 3 points; "1M" → single centred dot, "Stable" trend; "MAX" restores all 4.
- Not found: visit `/product/bad-id` → Package icon + back link.

### Responsive check

| Viewport | Expected |
|---|---|
| Mobile (<640px) | Single-column card grid; table hides Discount column; hero stacks vertically |
| Tablet (640–1024px) | 2-column grid; Discount column visible; Availability hidden below md |
| Desktop (≥1024px) | 3–4 column grid; full table; image panel 40% / info 60% |
