import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin";
import { getAdminCategories } from "@/lib/admin-data";

export default async function NewAdminProductPage() {
  await requireAdmin("/admin/products/new");
  const categories = await getAdminCategories();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <Button asChild variant="ghost" className="mb-6 px-0">
        <Link href="/admin/products">Back to products</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>New product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
