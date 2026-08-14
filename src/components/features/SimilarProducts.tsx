import type { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";

export function SimilarProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="mb-4 text-2xl font-bold text-gray-900">Similar Products</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
