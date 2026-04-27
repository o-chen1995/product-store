import { NextResponse } from "next/server";
import {
  type AdminProductFormPayload,
  updateAdminProductWithImage,
} from "@/lib/admin-data";
import { requireAdminFromRequest } from "@/lib/admin";
import {
  parseAdminProductImageUrl,
  validateAdminProductImage,
} from "@/lib/product-image-validation";

type AdminProductRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: AdminProductRouteContext) {
  try {
    await requireAdminFromRequest(request);
    const { id } = await params;
    const formData = await request.formData();
    const imageFile = formData.get("image_file");
    const file = imageFile instanceof File && imageFile.size > 0 ? imageFile : null;

    validateAdminProductImage(file);

    const toNumber = (value: FormDataEntryValue | null) => {
      const parsed = Number(value ?? 0);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const input: AdminProductFormPayload = {
      name: String(formData.get("name") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
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
      image_url: file
        ? null
        : parseAdminProductImageUrl(String(formData.get("image_url") ?? "")),
      image_file: file,
    };

    if (!input.name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!input.slug) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }

    if (!input.description) {
      return NextResponse.json({ error: "Description is required." }, { status: 400 });
    }

    if (input.price < 0) {
      return NextResponse.json({ error: "Price must be 0 or greater." }, { status: 400 });
    }

    if (input.compare_at_price != null && input.compare_at_price < input.price) {
      return NextResponse.json(
        { error: "Compare at price must be greater than or equal to price." },
        { status: 400 },
      );
    }

    if (input.stock < 0) {
      return NextResponse.json({ error: "Stock must be 0 or greater." }, { status: 400 });
    }

    if (!input.category_id) {
      return NextResponse.json({ error: "Category is required." }, { status: 400 });
    }

    await updateAdminProductWithImage(id, input);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update product.";
    const status = message.includes("required") ? 401 : message.includes("Admin") ? 403 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
