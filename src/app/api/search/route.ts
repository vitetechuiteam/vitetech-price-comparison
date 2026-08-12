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

  if (!query.trim()) {
    return NextResponse.json({ products: [], query: "" });
  }

  const products = await aggregateProductData(query);
  return NextResponse.json({ products, query });
}
