import Link from "next/link";
import { formatPrice } from "@/lib/products";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className="relative flex aspect-[4/3] items-end overflow-hidden bg-slate-100 p-5"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.imageAlt}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${product.accent.from}, ${product.accent.to})`,
            }}
          />
        )}
        <div className="absolute inset-4 rounded-full border border-white/30" />
        {!product.imageUrl ? (
          <div className="relative h-24 w-24 rounded-[1.25rem] bg-white/80 shadow-xl backdrop-blur sm:h-28 sm:w-28" />
        ) : null}
        {product.badge ? (
          <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-950">
            {product.badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {product.category}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              {product.name}
            </h2>
          </div>
          <p className="shrink-0 text-sm font-semibold text-slate-950">
            {formatPrice(product.priceCents)}
          </p>
        </div>
        <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
          {product.shortDescription}
        </p>
        <span className="mt-5 text-sm font-semibold text-slate-950 group-hover:underline">
          View details
        </span>
      </div>
    </Link>
  );
}
