import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/products";

export const metadata = {
  title: "Products",
  description: "Browse the Northline Goods product catalog.",
};

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Catalog
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Products
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Browse available products with current pricing, inventory, uploaded
          imagery, and merchandisable highlights.
        </p>
      </div>

      <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
