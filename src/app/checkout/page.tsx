"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/products";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart-store";

const fieldClassName =
  "mt-2 block text-sm font-medium leading-6 text-slate-700";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalCents = items.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0,
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.get("canceled") === "true") {
      queueMicrotask(() => {
        setNotice(
          "Checkout was canceled. Your cart is still here so you can try again.",
        );
      });
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data: sessionData } = supabase
        ? await supabase.auth.getSession()
        : { data: { session: null } };
      const accessToken = sessionData.session?.access_token;
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          customer: {
            name: String(formData.get("name") ?? ""),
            email: String(formData.get("email") ?? ""),
            phone: String(formData.get("phone") ?? ""),
          },
          address: {
            line1: String(formData.get("address") ?? ""),
            line2: String(formData.get("address2") ?? ""),
            city: String(formData.get("city") ?? ""),
            state: String(formData.get("state") ?? ""),
            postalCode: String(formData.get("postalCode") ?? ""),
            country: String(formData.get("country") ?? "US"),
          },
          items: items.map((item) => ({
            id: item.id,
            slug: item.slug,
            name: item.name,
            quantity: item.quantity,
          })),
          totalCents,
          notes: String(formData.get("notes") ?? ""),
        }),
      });

      const orderResult = (await response.json()) as {
        orderId?: string;
        orderNumber?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(orderResult.error ?? "Unable to create order.");
      }

      clearCart();
      router.push(
        `/checkout/success?order=${encodeURIComponent(orderResult.orderNumber ?? "")}`,
      );
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create order.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Checkout
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Checkout
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          This checkout creates a pending order and hands it to our manual
          confirmation flow.
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="mt-9">
          <CardHeader>
            <CardTitle>No items to checkout</CardTitle>
            <CardDescription>
              Add products to your cart before filling out shipping details.
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
          <Card>
            <CardHeader>
            <CardTitle>Recipient information</CardTitle>
            <CardDescription>
                Enter shipping details for this order.
            </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5" onSubmit={handleSubmit}>
                {notice ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {notice}
                  </p>
                ) : null}
                <div>
                  <label htmlFor="name" className={fieldClassName}>
                    Name
                  </label>
                  <Input id="name" name="name" required autoComplete="name" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="email" className={fieldClassName}>
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className={fieldClassName}>
                      Phone
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="address" className={fieldClassName}>
                    Address line 1
                  </label>
                  <Input
                    id="address"
                    name="address"
                    required
                    autoComplete="street-address"
                  />
                </div>
                <div>
                  <label htmlFor="address2" className={fieldClassName}>
                    Address line 2
                  </label>
                  <Input
                    id="address2"
                    name="address2"
                    autoComplete="address-line2"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <label htmlFor="city" className={fieldClassName}>
                      City
                    </label>
                    <Input id="city" name="city" required autoComplete="address-level2" />
                  </div>
                  <div>
                    <label htmlFor="state" className={fieldClassName}>
                      State
                    </label>
                    <Input id="state" name="state" autoComplete="address-level1" />
                  </div>
                  <div>
                    <label htmlFor="postalCode" className={fieldClassName}>
                      Postal code
                    </label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      required
                      autoComplete="postal-code"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="country" className={fieldClassName}>
                    Country
                  </label>
                  <Input
                    id="country"
                    name="country"
                    required
                    defaultValue="US"
                    autoComplete="country-name"
                  />
                </div>
                <div>
                  <label htmlFor="notes" className={fieldClassName}>
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    className={cn(
                      "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    )}
                  />
                </div>
                {error ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className="h-11 w-full sm:w-fit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating order..." : "Place order"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Order items</CardTitle>
              <CardDescription>Payment is handled manually after order creation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-950">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.quantity} x {formatPrice(item.priceCents)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-950">
                      {formatPrice(item.priceCents * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(totalCents)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
