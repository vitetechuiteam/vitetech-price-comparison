"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { PriceHistoryPoint } from "@/types/product";
import { formatINR } from "@/lib/format";

/* ── Constants ──────────────────────────────────────────────────────────────── */

const MONTH_ABBR = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  return `${MONTH_ABBR[parseInt(month, 10) - 1]} '${year.slice(2)}`;
}

/* Compact label for Y-axis ticks: ₹74K, ₹1.2L, 0 */
function fmtAxisLabel(v: number): string {
  if (v === 0) return "0";
  if (v >= 100000) {
    const l = v / 100000;
    return `₹${Number.isInteger(l) ? l : l.toFixed(1)}L`;
  }
  const k = v / 1000;
  return `₹${Number.isInteger(k) ? k : k.toFixed(1)}K`;
}

/* Return evenly-spaced nice round Y-axis ticks covering [minPrice, maxPrice] */
function computeYAxis(minPrice: number, maxPrice: number, tickCount = 4): number[] {
  let lo = minPrice, hi = maxPrice;
  if (lo === hi) {
    const pad = Math.round(lo * 0.05 / 1000) * 1000 || 1000;
    lo -= pad * 2;
    hi += pad * 2;
  }
  const rawStep = (hi - lo) / tickCount;
  const mag     = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step    = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rawStep) ?? mag * 10;
  const axisMin = Math.floor(lo / step) * step;
  const axisMax = Math.ceil(hi  / step) * step;
  const ticks: number[] = [];
  for (let t = axisMin; t <= axisMax + step * 0.01; t += step) {
    ticks.push(Math.round(t));
  }
  return ticks;
}

type TabKey = "1M" | "3M" | "6M" | "MAX";

const TABS: { key: TabKey; label: string; months: number }[] = [
  { key: "1M",  label: "1M",  months: 1        },
  { key: "3M",  label: "3M",  months: 3        },
  { key: "6M",  label: "6M",  months: 6        },
  { key: "MAX", label: "MAX", months: Infinity },
];

/* ── SVG layout constants ────────────────────────────────────────────────────── */

const W  = 480, H  = 180;
const ml = 52,  mr = 16, mt = 16, mb = 36;
const plotW  = W  - ml - mr;   // 412
const plotH  = H  - mt - mb;   // 128
const bottom = mt + plotH;     // 144

/* ── Path builder ────────────────────────────────────────────────────────────── */

function buildPaths(pts: { x: number; y: number }[]) {
  const area = [
    `M ${pts[0].x} ${bottom}`,
    ...pts.map((p) => `L ${p.x} ${p.y}`),
    `L ${pts[pts.length - 1].x} ${bottom}`,
    "Z",
  ].join(" ");

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return { area, line };
}

/* ── Component ──────────────────────────────────────────────────────────────── */

interface Props {
  history: PriceHistoryPoint[];
  currentLowestPrice: number;
}

export function PriceHistoryChart({ history, currentLowestPrice }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("MAX");

  if (!history || history.length === 0) return null;

  /* Slice to the active window */
  const tab     = TABS.find((t) => t.key === activeTab)!;
  const visible = tab.months >= history.length
    ? history
    : history.slice(-tab.months);

  /* All-Time Low always checks the full history */
  const allTimeLow   = Math.min(...history.map((p) => p.price));
  const isAllTimeLow = currentLowestPrice <= allTimeLow;

  /* Stats for the visible window */
  const prices = visible.map((p) => p.price);
  const minP   = Math.min(...prices);
  const maxP   = Math.max(...prices);
  const n      = visible.length;
  const trend  = visible[n - 1].price - visible[0].price;

  /* Y-axis ticks + scale */
  const yTicks  = computeYAxis(minP, maxP);
  const axisMin = yTicks[0];
  const axisMax = yTicks[yTicks.length - 1];
  const yRange  = axisMax - axisMin || 1;

  function svgX(i: number): number {
    return ml + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  }

  function svgY(price: number): number {
    return bottom - ((price - axisMin) / yRange) * plotH;
  }

  const pts = visible.map((p, i) => ({ ...p, x: svgX(i), y: svgY(p.price) }));
  const { area: areaPath, line: linePath } = buildPaths(pts);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">

      {/* ── Header ── */}
      <div className="border-b border-border px-6 py-4">

        {/* Primary row: heading + pill tab group */}
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">Price History</h2>

          {/* Pill / capsule toggle */}
          <div className="flex items-center gap-1 rounded-full bg-surface-muted p-1">
            {TABS.map((t) => {
              const isActive  = t.key === activeTab;
              const hasEnough = t.months <= history.length || t.key === "MAX";

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => hasEnough && setActiveTab(t.key)}
                  aria-pressed={isActive}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium transition-all",
                    isActive
                      ? "bg-surface text-primary shadow-sm"
                      : hasEnough
                      ? "text-foreground-muted hover:text-foreground"
                      : "cursor-default text-foreground-subtle opacity-40",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary row: subtitle + status badges */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-sm text-foreground-muted">
            Showing {n} {n === 1 ? "month" : "months"} of price data
          </p>

          {isAllTimeLow && (
            <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
              <TrendingDown className="h-3 w-3" aria-hidden="true" />
              All-Time Low!
            </span>
          )}

          <span
            className={[
              "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
              trend < 0 ? "bg-success/10 text-success" :
              trend > 0 ? "bg-error/10 text-error"     :
                          "bg-surface-muted text-foreground-muted",
            ].join(" ")}
          >
            {trend < 0
              ? <TrendingDown className="h-3 w-3" aria-hidden="true" />
              : trend > 0
              ? <TrendingUp   className="h-3 w-3" aria-hidden="true" />
              : <Minus        className="h-3 w-3" aria-hidden="true" />
            }
            {trend < 0 ? "Price dropping" : trend > 0 ? "Price rising" : "Stable"}
          </span>
        </div>
      </div>

      {/* ── Chart ── */}
      <div className="px-2 py-6 sm:px-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          aria-label="Price history line chart"
          role="img"
        >
          <defs>
            <linearGradient id="phAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   style={{ stopColor: "var(--brand-primary)", stopOpacity: 0.22 }} />
              <stop offset="100%" style={{ stopColor: "var(--brand-primary)", stopOpacity: 0    }} />
            </linearGradient>
          </defs>

          {/* ── Y-axis: gridlines + left-side labels ── */}
          {yTicks.map((tick) => {
            const y = svgY(tick);
            return (
              <g key={tick}>
                {/* Horizontal gridline */}
                <line
                  x1={ml} y1={y} x2={W - mr} y2={y}
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                {/* Price label — right-aligned, vertically centred on the line */}
                <text
                  x={ml - 6} y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize="5"
                  style={{ fill: "var(--fg-muted)" }}
                >
                  {fmtAxisLabel(tick)}
                </text>
              </g>
            );
          })}

          {/* X-axis baseline */}
          <line
            x1={ml} y1={bottom} x2={W - mr} y2={bottom}
            stroke="var(--border-strong)"
            strokeWidth="1"
          />

          {/* Area fill */}
          <path d={areaPath} fill="url(#phAreaGrad)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            style={{ stroke: "var(--brand-primary)" }}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* ── Data points + X-axis date labels ── */}
          {pts.map((p) => {
            const isLow  = p.price === minP;
            const isHigh = p.price === maxP && minP !== maxP;

            return (
              <g key={p.date}>
                {/* Halo ring on notable points */}
                {(isLow || isHigh) && (
                  <circle
                    cx={p.x} cy={p.y} r={5}
                    style={{
                      fill: isLow ? "var(--color-success)" : "var(--color-error)",
                      fillOpacity: 0.18,
                    }}
                  />
                )}

                {/* Dot */}
                <circle
                  cx={p.x} cy={p.y} r={2.5}
                  stroke="white" strokeWidth="1"
                  style={{
                    fill: isLow
                      ? "var(--color-success)"
                      : isHigh
                      ? "var(--color-error)"
                      : "var(--brand-primary)",
                  }}
                />

                {/* X-axis date label */}
                <text
                  x={p.x} y={bottom + 14}
                  textAnchor="middle"
                  dominantBaseline="hanging"
                  fontSize="5"
                  style={{ fill: "var(--fg-muted)" }}
                >
                  {formatDate(p.date)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Min / Max legend */}
        <div className="mt-1 flex items-center justify-between pl-14 text-xs text-foreground-muted">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success" />
            Lowest: {formatINR(minP)}
          </div>
          {minP !== maxP && (
            <div className="flex items-center gap-1.5">
              Highest: {formatINR(maxP)}
              <span className="h-2 w-2 rounded-full bg-error" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
