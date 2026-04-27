import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import {
  createAdminProductWithImage,
  type AdminProductFormPayload,
} from "@/lib/admin-data";
import { requireAdminFromRequest } from "@/lib/admin";
import { parseAdminProductImageUrl } from "@/lib/product-image-validation";

type ProductErrorField = "uploadedImage" | "imageUrl" | "slug" | "unknown";

type ProductRequestPayload = {
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  price?: unknown;
  compare_at_price?: unknown;
  stock?: unknown;
  status?: unknown;
  category_id?: unknown;
  imageUrl?: unknown;
  image_url?: unknown;
};

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getOptionalImageUrl(payload: ProductRequestPayload) {
  const imageUrl = payload.imageUrl ?? payload.image_url;

  return parseAdminProductImageUrl(typeof imageUrl === "string" ? imageUrl : "");
}

async function getProductJsonPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error("Product API only accepts application/json.");
  }

  return (await request.json()) as ProductRequestPayload;
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
    const payload = await getProductJsonPayload(request);

    const input: AdminProductFormPayload = {
      name: String(payload.name ?? "").trim(),
      slug: String(payload.slug ?? "").trim(),
      description: String(payload.description ?? "").trim(),
      price: toNumber(payload.price),
      compare_at_price: (() => {
        const raw = payload.compare_at_price;

        return raw == null || raw === "" ? null : toNumber(raw);
      })(),
      stock: Math.max(0, Math.trunc(toNumber(payload.stock))),
      status: String(payload.status ?? "draft") as
        | "draft"
        | "active"
        | "archived",
      category_id: String(payload.category_id ?? ""),
      image_url: getOptionalImageUrl(payload),
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
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${input.slug}`);

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
