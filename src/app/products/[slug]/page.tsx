import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductActions } from "@/components/cart/product-actions";
import { formatPrice, getProductBySlug } from "@/lib/products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

	  if (!product) {
	    return {
	      title: "Product not found",
	    };
	  }

	  return {
	    title: product.name,
	    description: product.shortDescription,
	    openGraph: {
	      title: product.name,
	      description: product.shortDescription,
	      images: product.imageUrl ? [product.imageUrl] : undefined,
	    },
	  };
	}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <Link
        href="/products"
        className="text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        Back to products
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
        <div
          className="relative flex min-h-96 items-end overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-8 shadow-sm"
          aria-label={product.imageAlt}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.imageAlt}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${product.accent.from}, ${product.accent.to})`,
              }}
            />
          )}
          <div className="absolute inset-6 rounded-full border border-white/30" />
          {!product.imageUrl ? (
            <div className="relative h-44 w-44 rounded-[2rem] bg-white/80 shadow-2xl backdrop-blur sm:h-56 sm:w-56" />
          ) : null}
          {product.badge ? (
            <span className="absolute right-6 top-6 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-950">
              {product.badge}
            </span>
          ) : null}
        </div>

        <section className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            {product.category}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl font-semibold text-slate-950">
            {formatPrice(product.priceCents)}
          </p>
          <p className="mt-5 text-base leading-7 text-slate-600">
            {product.description}
          </p>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-slate-950">Product highlights</p>
              <p className="text-sm text-slate-500">
                {product.inventory} in stock
              </p>
            </div>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
              {product.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          <ProductActions
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.priceCents,
              imageAlt: product.imageAlt,
              accent: product.accent,
            }}
	          />
	          <p className="mt-3 text-xs leading-5 text-slate-500">
	            Checkout creates a pending order for manual payment confirmation.
	          </p>
	        </section>
      </div>
    </div>
  );
}
