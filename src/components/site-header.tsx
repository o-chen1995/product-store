import Link from "next/link";
import { AuthNav } from "@/components/auth/auth-nav";
import { CartLink } from "@/components/cart/cart-link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:flex-nowrap lg:px-8">
        <Link href="/" className="shrink-0 text-base font-semibold tracking-wide text-slate-950">
          Northline Goods
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <nav className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <AuthNav />
          <CartLink />
        </div>
      </div>
    </header>
  );
}
