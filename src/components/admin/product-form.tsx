"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminCategory, AdminProduct } from "@/lib/admin-data";
import {
  parseAdminProductImageUrl,
  validateAdminProductImage,
} from "@/lib/product-image-validation";

const fieldClassName = "mt-2 block text-sm font-medium leading-6 text-slate-700";
const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const textareaClassName =
  "flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function centsToDollars(cents: number | null | undefined) {
  if (cents == null) {
    return "";
  }

  return (cents / 100).toFixed(2);
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
          : "Invalid image file.",
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
      setError("Uploaded image: Image upload failed. Please try another file.");
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

    try {
      imageUrl = selectedFile
        ? null
        : parseAdminProductImageUrl(String(formData.get("image_url") ?? ""));

      const payload = new FormData();
      payload.set("name", String(formData.get("name") ?? ""));
      payload.set("slug", String(formData.get("slug") ?? ""));
      payload.set("description", String(formData.get("description") ?? ""));
      payload.set("price", String(price));
      payload.set(
        "compare_at_price",
        compareAtPrice == null ? "" : String(compareAtPrice),
      );
      payload.set("stock", String(Number(formData.get("stock") ?? 0)));
      payload.set("status", String(formData.get("status") ?? "draft"));
      payload.set("category_id", String(formData.get("category_id") ?? ""));
      if (imageUrl) {
        payload.set("image_url", imageUrl);
      }

      if (selectedFile) {
        payload.set("image_file", selectedFile);
      }

      console.debug("admin product submit", {
        fields: Array.from(payload.keys()),
        imageMode: selectedFile ? "upload" : imageUrl ? "fallback-url" : "none",
        sendsFallbackImageUrl: payload.has("image_url"),
        sendsUploadedImage: payload.has("image_file"),
      });

      const response = await fetch(
        product ? `/api/admin/products/${product.id}` : "/api/admin/products",
        {
          method: product ? "PUT" : "POST",
          body: payload,
        },
      );
      const result = (await response.json()) as {
        error?: string;
        field?: "uploadedImage" | "imageUrl" | "slug" | "unknown";
      };

      if (!response.ok) {
        const fieldLabel =
          result.field === "uploadedImage"
            ? "Uploaded image"
            : result.field === "imageUrl"
              ? "Image URL"
              : result.field === "slug"
                ? "Slug"
                : null;
        const message = result.error ?? "Unable to save product.";

        throw new Error(fieldLabel ? `${fieldLabel}: ${message}` : message);
      }

      router.push("/admin/products");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to save product.",
      );
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
