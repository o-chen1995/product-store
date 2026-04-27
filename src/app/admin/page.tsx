import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin";
import {
  getAdminDashboardStats,
  getAdminOrderCustomerEmail,
} from "@/lib/admin-data";
import { formatPrice } from "@/lib/products";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default async function AdminDashboardPage() {
  await requireAdmin("/admin");
  const stats = await getAdminDashboardStats();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Admin
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Dashboard
          </h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Back to storefront</Link>
        </Button>
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Products", stats.totalProducts],
          ["Orders", stats.totalOrders],
          ["Pending", stats.pendingOrders],
          ["Paid", stats.paidOrders],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle>{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Latest 5 orders across the store.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-slate-600">No orders yet.</p>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 rounded-md border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="break-all font-mono text-sm font-semibold text-slate-950">
                        {order.id}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {getAdminOrderCustomerEmail(order)} · {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {order.status}
                      </Badge>
                      <span className="text-sm font-semibold">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Manage products and orders.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild>
              <Link href="/admin/products">Product management</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/orders">Order management</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
