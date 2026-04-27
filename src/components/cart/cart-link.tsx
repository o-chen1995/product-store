"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart-store";

export function CartLink() {
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );

  return (
    <Link
      href="/cart"
      className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:text-slate-950"
      aria-label={`Cart with ${hasHydrated ? itemCount : 0} items`}
    >
      <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Cart</span>
      <Badge className="min-w-6 justify-center px-2">
        {hasHydrated ? itemCount : 0}
      </Badge>
    </Link>
  );
}
