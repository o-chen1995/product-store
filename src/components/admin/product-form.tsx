"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminCategory, AdminProduct } from "@/lib/admin-data";
import {
  getProductImageContentType,
  parseAdminProductImageUrl,
  validateAdminProductImage,
} from "@/lib/product-image-validation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const fieldClassName = "mt-2 block text-sm font-medium leading-6 text-slate-700";
const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const textareaClassName =
  "flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const productImagesBucket = "product-images";

type SaveProductStage =
  | "validate-form"
  | "create-upload-url"
  | "upload-to-supabase"
  | "create-product"
  | "update-product"
  | "unknown";

type UploadTarget = {
  path: string;
  publicUrl: string;
  token: string;
};

type ProductSavePayload = {
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  status: "draft" | "active" | "archived";
  category_id: string;
  imageUrl?: string;
};

function centsToDollars(cents: number | null | undefined) {
  if (cents == null) {
    return "";
  }

  return (cents / 100).toFixed(2);
}

function getStageErrorMessage(stage: SaveProductStage, error: unknown) {
  const rawMessage = error instanceof Error ? error.message : "";

  if (stage === "validate-form") {
    if (rawMessage.includes("https image URL")) {
      return "Form validation failed: Image URL fallback must be a valid https URL.";
    }

    if (rawMessage.includes("Image must be under 5MB")) {
      return "Image must be under 5MB.";
    }

    return rawMessage
      ? `Form validation failed: ${rawMessage}`
      : "Form validation failed.";
  }

  if (stage === "create-upload-url") {
    if (rawMessage.includes("Image must be under 5MB")) {
      return "Image must be under 5MB.";
    }

    if (rawMessage.includes("Product image bucket is not configured")) {
      return "Could not prepare image upload: Product image bucket is not configured.";
    }

    return "Could not prepare image upload.";
  }

  if (stage === "upload-to-supabase") {
    return "Image upload failed. Please try again.";
  }

  if (stage === "create-product") {
    return rawMessage && !rawMessage.includes("expected pattern")
      ? `Product creation failed: ${rawMessage}`
      : "Product creation failed.";
  }

  if (stage === "update-product") {
    return rawMessage && !rawMessage.includes("expected pattern")
      ? `Product update failed: ${rawMessage}`
      : "Product update failed.";
  }

  return "Unknown error while saving product.";
}

async function createProductImageUploadTarget(
  file: File,
): Promise<UploadTarget> {
  const contentType = getProductImageContentType(file.name, file.type);

  const response = await fetch("/api/admin/product-images/sign-upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contentType,
      fileName: file.name,
      size: file.size,
    }),
  });
  const result = (await response.json()) as {
    path?: string;
    publicUrl?: string;
    token?: string;
    error?: string;
    field?: "uploadedImage";
  };

  if (!response.ok || !result.path || !result.publicUrl || !result.token) {
    throw new Error(result.error ?? "Could not prepare image upload.");
  }

  return {
    path: result.path,
    publicUrl: parseAdminProductImageUrl(result.publicUrl) ?? "",
    token: result.token,
  };
}

async function uploadProductImageToSupabase(target: UploadTarget, file: File) {
  const supabase = createBrowserSupabaseClient();
  const contentType = getProductImageContentType(file.name, file.type);

  if (!supabase) {
    throw new Error("Image upload failed. Please try again.");
  }

  const { error: uploadError } = await supabase.storage
    .from(productImagesBucket)
    .uploadToSignedUrl(target.path, target.token, file, {
      contentType,
    });

  if (uploadError) {
    throw new Error("Image upload failed. Please try again.");
  }
}

export function ProductForm({
  categories,
  product,
}: {
  categories: AdminCategory[];
  product?: AdminProduct;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.product_images?.sort(
      (a, b) => a.sort_order - b.sort_order,
    )[0]?.image_url ?? null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const primaryImage = product?.product_images?.sort(
    (a, b) => a.sort_order - b.sort_order,
  )[0]?.image_url;

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      setImagePreview(primaryImage ?? null);
      return;
    }

    try {
      validateAdminProductImage(file);
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Image upload failed. Please try again.",
      );
      event.target.value = "";
      setSelectedFile(null);
      setImagePreview(primaryImage ?? null);
      return;
    }

    setError(null);
    setSelectedFile(file);

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    try {
      setImagePreview(URL.createObjectURL(file));
    } catch {
      setError("Image upload failed. Please try again.");
      event.target.value = "";
      setSelectedFile(null);
      setImagePreview(primaryImage ?? null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const price = Math.round(Number(formData.get("price") || 0) * 100);
    const compareAtPriceValue = String(formData.get("compare_at_price") ?? "");
    const compareAtPrice = compareAtPriceValue
      ? Math.round(Number(compareAtPriceValue) * 100)
      : null;
    let imageUrl: string | null = null;
    let stage: SaveProductStage = "validate-form";

    try {
      console.debug("admin product save stage", stage);
      validateAdminProductImage(selectedFile);
      imageUrl = selectedFile
        ? null
        : parseAdminProductImageUrl(String(formData.get("image_url") ?? ""));

      if (selectedFile) {
        stage = "create-upload-url";
        console.debug("admin product save stage", stage);
        const uploadTarget = await createProductImageUploadTarget(selectedFile);
        console.debug("admin product image upload target", {
          hasPath: Boolean(uploadTarget.path),
          hasPublicUrl: Boolean(uploadTarget.publicUrl),
          hasToken: Boolean(uploadTarget.token),
        });

        stage = "upload-to-supabase";
        console.debug("admin product save stage", stage);
        await uploadProductImageToSupabase(uploadTarget, selectedFile);
        imageUrl = uploadTarget.publicUrl;
        console.debug("admin product image uploaded", {
          hasPublicUrl: Boolean(imageUrl),
        });
      }

      const payload: ProductSavePayload = {
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        description: String(formData.get("description") ?? ""),
        price,
        compare_at_price: compareAtPrice,
        stock: Number(formData.get("stock") ?? 0),
        status: String(formData.get("status") ?? "draft") as
          | "draft"
          | "active"
          | "archived",
        category_id: String(formData.get("category_id") ?? ""),
      };

      if (imageUrl) {
        payload.imageUrl = imageUrl;
      }

      console.debug("admin product submit", {
        fields: Object.keys(payload),
        imageMode: selectedFile ? "upload" : imageUrl ? "fallback-url" : "none",
        sendsImageUrl: Boolean(payload.imageUrl),
        sendsUploadedImage: false,
      });

      stage = product ? "update-product" : "create-product";
      console.debug("admin product save stage", stage);
      const response = await fetch(
        product ? `/api/admin/products/${product.id}` : "/api/admin/products",
        {
          method: product ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as {
        error?: string;
        field?: "uploadedImage" | "imageUrl" | "slug" | "unknown";
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save product.");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (submitError) {
      setError(getStageErrorMessage(stage, submitError));
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={fieldClassName}>
            Name
          </label>
          <Input id="name" name="name" required defaultValue={product?.name} />
        </div>
        <div>
          <label htmlFor="slug" className={fieldClassName}>
            Slug
          </label>
          <Input id="slug" name="slug" required defaultValue={product?.slug} />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={fieldClassName}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          defaultValue={product?.description}
          className={textareaClassName}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="price" className={fieldClassName}>
            Price
          </label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={centsToDollars(product?.price)}
          />
        </div>
        <div>
          <label htmlFor="compare_at_price" className={fieldClassName}>
            Compare at price
          </label>
          <Input
            id="compare_at_price"
            name="compare_at_price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={centsToDollars(product?.compare_at_price)}
          />
        </div>
        <div>
          <label htmlFor="stock" className={fieldClassName}>
            Stock
          </label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product?.stock ?? 0}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className={fieldClassName}>
            Status
          </label>
          <select
            id="status"
            name="status"
            required
            defaultValue={product?.status ?? "draft"}
            className={selectClassName}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label htmlFor="category_id" className={fieldClassName}>
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            required
            defaultValue={product?.category_id ?? categories[0]?.id}
            className={selectClassName}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="image_url" className={fieldClassName}>
          Image URL fallback
        </label>
        <Input id="image_url" name="image_url" defaultValue={primaryImage} />
      </div>

      <div>
        <label htmlFor="image_file" className={fieldClassName}>
          Upload image
        </label>
        <Input
          id="image_file"
          name="image_file"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />
        <p className="mt-2 text-xs text-slate-500">
          JPG, JPEG, PNG, or WEBP. Maximum 5MB.
        </p>
      </div>

      {imagePreview ? (
        <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
          <img
            src={imagePreview}
            alt="Product preview"
            className="h-56 w-full object-cover"
          />
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-fit">
        {isSubmitting ? "Saving..." : "Save product"}
      </Button>
    </form>
  );
}
