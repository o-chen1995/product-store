import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin";
import { getAdminCategories, getAdminProductById } from "@/lib/admin-data";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAdminProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  await requireAdmin(`/admin/products/${id}/edit`);
  const [categories, product] = await Promise.all([
    getAdminCategories(),
    getAdminProductById(id),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <Button asChild variant="ghost" className="mb-6 px-0">
        <Link href="/admin/products">Back to products</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Edit product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm categories={categories} product={product} />
        </CardContent>
      </Card>
    </div>
  );
}
