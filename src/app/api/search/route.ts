import { NextRequest, NextResponse } from "next/server";
import { aggregateProductData } from "@/services/productService";

export const maxDuration = 60;

/**
 * GET /api/search?q=<query>
 *
 * Fans out to all registered merchant adapters in parallel and returns
 * a consistent JSON envelope.  Swap the underlying adapters in
 * src/services/productService.ts to point at live APIs without touching
 * this route.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const start = parseInt(request.nextUrl.searchParams.get("start") ?? "0", 10);

  if (!query.trim()) {
    return NextResponse.json({ products: [], query: "" });
  }

  const products = await aggregateProductData(query, start);
  return NextResponse.json({ products, query, start });
}
