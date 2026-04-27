import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-100">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-base font-semibold">Northline Goods</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
            Curated product storefront with manual payment confirmation and
            Supabase-powered orders.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Shop</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-300">
            <Link href="/products" className="hover:text-white">
              All products
            </Link>
            <Link href="/" className="hover:text-white">
              Featured
            </Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Support</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-300">
            <Link href="/shipping" className="hover:text-white">
              Shipping
            </Link>
            <Link href="/returns" className="hover:text-white">
              Returns
            </Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Policies</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-300">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
