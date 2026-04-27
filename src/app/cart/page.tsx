"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/data/products";
import { useCartStore } from "@/store/cart-store";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalCents = items.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0,
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Cart
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Shopping cart
          </h1>
        </div>
        {items.length > 0 ? (
          <Button type="button" variant="ghost" onClick={clearCart}>
            Clear cart
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <Card className="mt-9">
          <CardHeader>
            <CardTitle>Your cart is empty</CardTitle>
            <CardDescription>
              Add products from the catalog before starting checkout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/products">Browse products</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-9 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="grid gap-5 p-5 sm:grid-cols-[96px_1fr_auto] sm:items-center">
                  <div
                    className="aspect-square rounded-lg border border-slate-200"
                    style={{
                      background: `linear-gradient(135deg, ${item.accent.from}, ${item.accent.to})`,
                    }}
                    aria-label={item.imageAlt}
                  />
                  <div>
                    <Link
                      href={`/products/${item.slug}`}
                      className="text-lg font-semibold text-slate-950 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">
                      Unit price: {formatPrice(item.priceCents)}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      Subtotal: {formatPrice(item.priceCents * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="flex items-center rounded-md border border-slate-200">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-r-none"
                        onClick={() => decrementItem(item.id)}
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="min-w-10 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-l-none"
                        onClick={() => incrementItem(item.id)}
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
              <CardDescription>Review totals before checkout.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Items</span>
                <span className="font-medium text-slate-950">
                  {items.reduce((total, item) => total + item.quantity, 0)}
                </span>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(totalCents)}</span>
              </div>
              <Button asChild className="mt-6 w-full">
                <Link href="/checkout">Proceed to checkout</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
