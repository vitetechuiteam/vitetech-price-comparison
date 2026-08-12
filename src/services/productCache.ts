import type { Product } from "@/types/product";

// Use global to survive Next.js Turbopack module isolation in dev mode.
// Module-level Maps are NOT shared across route workers; global IS.
// This is the same pattern Next.js recommends for database clients.

declare global {
  // eslint-disable-next-line no-var
  var __productCache: Map<string, { data: Product; exp: number }> | undefined;
  // eslint-disable-next-line no-var
  var __pageTokenCache: Map<string, { token: string; exp: number }> | undefined;
}

if (!global.__productCache)  global.__productCache  = new Map();
if (!global.__pageTokenCache) global.__pageTokenCache = new Map();

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function setCachedProducts(products: Product[]): void {
  const exp = Date.now() + TTL_MS;
  for (const p of products) {
    global.__productCache!.set(p.id, { data: p, exp });
  }
}

export function getCachedProduct(id: string): Product | undefined {
  const entry = global.__productCache!.get(id);
  if (!entry) return undefined;
  if (Date.now() > entry.exp) {
    global.__productCache!.delete(id);
    return undefined;
  }
  return entry.data;
}

export function cachePageToken(productId: string, token: string): void {
  global.__pageTokenCache!.set(productId, { token, exp: Date.now() + TTL_MS });
}

export function getCachedPageToken(productId: string): string | undefined {
  const entry = global.__pageTokenCache!.get(productId);
  if (!entry) return undefined;
  if (Date.now() > entry.exp) {
    global.__pageTokenCache!.delete(productId);
    return undefined;
  }
  return entry.token;
}
