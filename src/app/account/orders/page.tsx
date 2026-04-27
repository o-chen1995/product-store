"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { formatPrice } from "@/lib/products";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AccountOrder = {
  id: string;
  status: "pending" | "paid" | "cancelled" | "fulfilled";
  total: number;
  currency: string;
  created_at: string;
};

function getStatusLabel(status: AccountOrder["status"]) {
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

function OrderList() {
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      const supabase = createBrowserSupabaseClient();

      if (!supabase) {
        setError("Supabase auth is not configured.");
        setIsLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setError("Account session was not found.");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/account/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = (await response.json()) as {
        orders?: AccountOrder[];
        error?: string;
      };

      if (!response.ok) {
        setError(result.error ?? "Unable to load orders.");
        setIsLoading(false);
        return;
      }

      setOrders(result.orders ?? []);
      setIsLoading(false);
    }

    loadOrders();
  }, []);

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading orders...</p>;
  }

  if (error) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No orders yet</CardTitle>
          <CardDescription>Orders created while logged in will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/products">Browse products</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
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
                <span className="font-medium text-slate-950">Total: </span>
                {formatPrice(order.total)}
              </div>
              <div>
                <span className="font-medium text-slate-950">Created: </span>
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(order.created_at))}
              </div>
            </div>
            {order.status === "pending" ? (
              <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Waiting for payment confirmation.
              </p>
            ) : null}
            <div className="mt-5">
              <Button asChild variant="outline" className="w-full sm:w-fit">
                <Link href={`/account/orders/${order.id}`}>View details</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AccountOrdersPage() {
  return (
    <ProtectedAccount>
      {() => (
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Account
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              My orders
            </h1>
          </div>
          <div className="mt-9">
            <OrderList />
          </div>
        </div>
      )}
    </ProtectedAccount>
  );
}
