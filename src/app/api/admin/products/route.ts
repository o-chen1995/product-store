import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createAdminProductWithImage,
  type AdminProductFormPayload,
} from "@/lib/admin-data";
import { requireAdminFromRequest } from "@/lib/admin";
import { validateAdminProductImage } from "@/lib/product-image-validation";

function toNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

export async function POST(request: Request) {
  try {
    await requireAdminFromRequest(request);
    const formData = await request.formData();
    const imageFile = formData.get("image_file");
    const file = imageFile instanceof File && imageFile.size > 0 ? imageFile : null;

    validateAdminProductImage(file);

    const input: AdminProductFormPayload = {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      description: String(formData.get("description") ?? ""),
      price: toNumber(formData.get("price")),
      compare_at_price: (() => {
        const raw = String(formData.get("compare_at_price") ?? "").trim();

        return raw ? toNumber(raw) : null;
      })(),
      stock: Math.max(0, Math.trunc(toNumber(formData.get("stock")))),
      status: String(formData.get("status") ?? "draft") as
        | "draft"
        | "active"
        | "archived",
      category_id: String(formData.get("category_id") ?? ""),
      image_url: String(formData.get("image_url") ?? "").trim() || null,
      image_file: file,
    };

    if (!input.name || !input.slug || !input.description || !input.category_id) {
      return NextResponse.json({ error: "Invalid product data." }, { status: 400 });
    }

    const productId = await createAdminProductWithImage(input);

    return NextResponse.json({ productId }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid product data." }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unable to create product.";
    const status = message.includes("required") ? 401 : message.includes("Admin") ? 403 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
