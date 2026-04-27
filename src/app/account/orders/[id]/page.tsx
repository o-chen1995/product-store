"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { ProtectedAccount } from "@/components/auth/protected-account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AccountOrderDetail } from "@/lib/account-orders";
import { formatPrice } from "@/lib/products";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatAddress(order: AccountOrderDetail) {
  if (!order.address) {
    return "No shipping address saved.";
  }

  return [
    order.address.line1,
    order.address.line2,
    [order.address.city, order.address.state, order.address.postal_code]
      .filter(Boolean)
      .join(", "),
    order.address.country,
  ]
    .filter(Boolean)
    .join("\n");
}

function getStatusLabel(status: AccountOrderDetail["status"]) {
  switch (status) {
    case "pending":
      return "Pending payment";
    case "paid":
      return "Paid";
    case "cancelled":
      return "Cancelled";
    case "fulfilled":
      return "Fulfilled";
  }
}

function OrderDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<AccountOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldNotFound, setShouldNotFound] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      const supabase = createBrowserSupabaseClient();

      if (!supabase) {
        setError("Supabase auth is not configured.");
        setIsLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        router.replace(
          `/login?redirect=${encodeURIComponent(`/account/orders/${params.id}`)}`,
        );
        return;
      }

      const response = await fetch(`/api/account/orders/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = (await response.json()) as {
        order?: AccountOrderDetail;
        error?: string;
      };

      if (response.status === 404) {
        setShouldNotFound(true);
        return;
      }

      if (response.status === 401) {
        router.replace(
          `/login?redirect=${encodeURIComponent(`/account/orders/${params.id}`)}`,
        );
        return;
      }

      if (response.status === 403) {
        router.replace("/account/orders");
        return;
      }

      if (!response.ok || !result.order) {
        setError(result.error ?? "Unable to load order details.");
        setIsLoading(false);
        return;
      }

      setOrder(result.order);
      setIsLoading(false);
    }

    loadOrder();
  }, [params.id, router]);

  if (shouldNotFound) {
    notFound();
  }

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading order details...</p>;
  }

  if (error) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Order number</p>
              <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-950">
                {order.id}
              </p>
            </div>
            <Badge variant="outline" className="w-fit capitalize">
              {getStatusLabel(order.status)}
            </Badge>
          </div>
          <Separator className="my-4" />
          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <span className="font-medium text-slate-950">Created: </span>
              {formatDate(order.created_at)}
            </div>
            <div>
              <span className="font-medium text-slate-950">Total: </span>
              {formatPrice(order.total)}
            </div>
          </div>
          {order.status === "pending" ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Waiting for payment confirmation.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recipient</CardTitle>
            <CardDescription>Contact and shipping information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-950">Name: </span>
              {order.customer?.name ?? order.address?.recipient_name ?? "Unavailable"}
            </p>
            <p>
              <span className="font-medium text-slate-950">Email: </span>
              {order.customer?.email ?? "Unavailable"}
            </p>
            <p>
              <span className="font-medium text-slate-950">Phone: </span>
              {order.customer?.phone ?? order.address?.phone ?? "Unavailable"}
            </p>
            <div>
              <p className="font-medium text-slate-950">Address:</p>
              <p className="mt-1 whitespace-pre-line leading-6">{formatAddress(order)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
            <CardDescription>Manual payment confirmation status.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-slate-600">
              {order.status === "pending"
                ? "This order is waiting for payment confirmation."
                : "Payment confirmation has been recorded."}
            </p>
            <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {order.status === "pending"
                ? "等待付款確認"
                : "Payment confirmed or manually updated by the team."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>Product snapshots captured at purchase time.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-md border border-slate-200 p-4 text-sm sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-semibold text-slate-950">{item.product_name}</p>
                  <p className="mt-1 text-slate-500">
                    {formatPrice(item.unit_price)} x {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-slate-950 sm:text-right">
                  {formatPrice(item.line_total)}
                </p>
              </div>
            ))}
          </div>
          <Separator className="my-5" />
          <div className="flex items-center justify-between text-lg font-semibold text-slate-950">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          {order.notes ? (
            <>
              <Separator className="my-5" />
              <div>
                <p className="text-sm font-semibold text-slate-950">Order notes</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {order.notes}
                </p>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccountOrderDetailPage() {
  return (
    <ProtectedAccount>
      {() => (
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Button asChild variant="ghost" className="mb-6 px-0">
            <Link href="/account/orders">Back to my orders</Link>
          </Button>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Account
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Order details
            </h1>
          </div>
          <div className="mt-9">
            <OrderDetail />
          </div>
        </div>
      )}
    </ProtectedAccount>
  );
}
