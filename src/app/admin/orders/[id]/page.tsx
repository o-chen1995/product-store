import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin/order-status-form";
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
import { requireAdmin } from "@/lib/admin";
import { getAdminOrderById } from "@/lib/admin-data";
import { formatPrice } from "@/lib/products";

type AdminOrderPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(date: string | null) {
  if (!date) {
    return "Not set";
  }

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

export default async function AdminOrderDetailPage({ params }: AdminOrderPageProps) {
  const { id } = await params;
  await requireAdmin(`/admin/orders/${id}`);
  const order = await getAdminOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <Button asChild variant="ghost" className="mb-6 px-0">
        <Link href="/admin/orders">Back to orders</Link>
      </Button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Admin
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Order details
          </h1>
          <p className="mt-3 break-all font-mono text-sm text-slate-500">{order.id}</p>
        </div>
        <Badge variant="outline" className="w-fit capitalize">
          {getStatusLabel(order.status)}
        </Badge>
      </div>

      <div className="mt-9 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardDescription>Contact and shipping details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-950">Name: </span>
                {order.customers?.name ?? "Guest"}
              </p>
              <p>
                <span className="font-medium text-slate-950">Email: </span>
                {order.customers?.email ?? "Unavailable"}
              </p>
              <p>
                <span className="font-medium text-slate-950">Phone: </span>
                {order.customers?.phone ?? order.addresses?.phone ?? "Unavailable"}
              </p>
              <p className="whitespace-pre-line leading-6">
                <span className="font-medium text-slate-950">Address: </span>
                {order.addresses
                  ? [
                      order.addresses.line1,
                      order.addresses.line2,
                      [order.addresses.city, order.addresses.state, order.addresses.postal_code].filter(Boolean).join(", "),
                      order.addresses.country,
                  ].filter(Boolean).join("\n")
                  : "Unavailable"}
              </p>
              <p>
                <span className="font-medium text-slate-950">Notes: </span>
                {order.notes || "No notes."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>Purchased item snapshots.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(order.order_items ?? []).map((item) => (
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
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Update order fulfillment state and internal note.</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderStatusForm
                orderId={order.id}
                status={order.status}
                adminNote={order.admin_note}
                adminNoteSupported={order.admin_note_supported}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Manual payment</CardTitle>
              <CardDescription>Current payment state for this order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-950">Status: </span>
                {getStatusLabel(order.status)}
              </p>
              <p>
                <span className="font-medium text-slate-950">Paid at: </span>
                {formatDate(order.paid_at)}
              </p>
              <p>
                <span className="font-medium text-slate-950">Internal note: </span>
                {order.admin_note || "No internal note."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
