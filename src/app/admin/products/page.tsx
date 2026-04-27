import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin";
import { getAdminProducts } from "@/lib/admin-data";
import { formatPrice } from "@/lib/products";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(date),
  );
}

export default async function AdminProductsPage() {
  await requireAdmin("/admin/products");
  const products = await getAdminProducts();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Admin
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Products
          </h1>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/admin">Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">New product</Link>
          </Button>
        </div>
      </div>

      <div className="mt-9 space-y-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.4fr_1fr_100px_100px_120px_auto] lg:items-center">
              <div>
                <p className="font-semibold text-slate-950">{product.name}</p>
                <p className="mt-1 text-sm text-slate-500">{product.slug}</p>
              </div>
              <p className="text-sm text-slate-600">{formatPrice(product.price)}</p>
              <p className="text-sm text-slate-600">Stock {product.stock}</p>
              <Badge variant="outline" className="w-fit capitalize">
                {product.status}
              </Badge>
              <p className="text-sm text-slate-500">{formatDate(product.created_at)}</p>
              <Button asChild variant="outline" className="w-full lg:w-fit">
                <Link href={`/admin/products/${product.id}/edit`}>Edit</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
