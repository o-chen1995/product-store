import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createAdminProductWithImage,
  type AdminProductFormPayload,
} from "@/lib/admin-data";
import { requireAdminFromRequest } from "@/lib/admin";
import {
  parseAdminProductImageUrl,
  validateAdminProductImage,
} from "@/lib/product-image-validation";

type ProductErrorField = "uploadedImage" | "imageUrl" | "slug" | "unknown";

function toNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

function productError(
  error: string,
  field: ProductErrorField = "unknown",
  status = 400,
) {
  return NextResponse.json({ error, field }, { status });
}

function getProductErrorField(message: string): ProductErrorField {
  if (
    message.includes("Image upload failed") ||
    message.includes("image save failed") ||
    message.includes("Image must be") ||
    message.includes("Image must be 5MB")
  ) {
    return "uploadedImage";
  }

  if (message.includes("https image URL")) {
    return "imageUrl";
  }

  if (message.includes("Slug")) {
    return "slug";
  }

  return "unknown";
}

export async function POST(request: Request) {
  try {
    await requireAdminFromRequest(request);
    const formData = await request.formData();
    const imageFile = formData.get("image_file");
    const file = imageFile instanceof File && imageFile.size > 0 ? imageFile : null;

    validateAdminProductImage(file);

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
      return productError("Name is required.");
    }

    if (!input.slug) {
      return productError("Slug is required.", "slug");
    }

    if (!input.description) {
      return productError("Description is required.");
    }

    if (input.price < 0) {
      return productError("Price must be 0 or greater.");
    }

    if (input.compare_at_price != null && input.compare_at_price < input.price) {
      return productError("Compare at price must be greater than or equal to price.");
    }

    if (input.stock < 0) {
      return productError("Stock must be 0 or greater.");
    }

    if (!input.category_id) {
      return productError("Category is required.");
    }

    const productId = await createAdminProductWithImage(input);

    return NextResponse.json({ productId }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return productError("Invalid product data.");
    }

    const message = error instanceof Error ? error.message : "Unable to create product.";
    const status = message.includes("required") ? 401 : message.includes("Admin") ? 403 : 400;

    return productError(message, getProductErrorField(message), status);
  }
}
