import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/products";

export default async function Home() {
  const products = await getProducts();
  const featuredProducts = products.filter((product) => product.featured);

  return (
    <div>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Independent product store
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Everyday goods with a quiet, durable point of view.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              A custom storefront with uploaded product images, cart checkout,
              pending orders, account history, and manual payment confirmation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Shop products
              </Link>
              <Link
                href="/products/terra-carry-tote"
                className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-50"
              >
                View best seller
              </Link>
            </div>
          </div>
          <div className="grid min-h-80 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
            <div className="grid grid-cols-2 gap-px bg-slate-200">
              {featuredProducts.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className="flex min-h-40 items-end p-5"
                  style={{
                    background: `linear-gradient(135deg, ${product.accent.from}, ${product.accent.to})`,
                  }}
                >
                  <div className="h-20 w-20 rounded-[1.25rem] bg-white/80 shadow-xl backdrop-blur" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Featured
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Start with the essentials
            </h2>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-slate-950 hover:underline"
          >
            Browse all products
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
