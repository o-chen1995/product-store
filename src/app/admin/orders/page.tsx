import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin";
import { getAdminOrderCustomerEmail, getAdminOrders } from "@/lib/admin-data";
import { formatPrice } from "@/lib/products";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pending payment";
    case "paid":
      return "Paid";
    case "cancelled":
      return "Cancelled";
    case "fulfilled":
      return "Fulfilled";
    default:
      return status;
  }
}

export default async function AdminOrdersPage() {
  await requireAdmin("/admin/orders");
  const orders = await getAdminOrders();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Admin
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Orders
          </h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">Dashboard</Link>
        </Button>
      </div>

      <div className="mt-9 space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.5fr_1fr_110px_120px_auto] lg:items-center">
              <div>
                <p className="break-all font-mono text-sm font-semibold text-slate-950">
                  {order.id}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {getAdminOrderCustomerEmail(order)}
                </p>
              </div>
              <p className="text-sm text-slate-600">{formatDate(order.created_at)}</p>
              <Badge variant="outline" className="w-fit capitalize">
                {getStatusLabel(order.status)}
              </Badge>
              <p className="font-semibold text-slate-950">{formatPrice(order.total)}</p>
              <Button asChild variant="outline" className="w-full lg:w-fit">
                <Link href={`/admin/orders/${order.id}`}>View details</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
