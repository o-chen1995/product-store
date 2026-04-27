import { randomUUID } from "crypto";
import {
  getProductImageContentType,
  parseAdminProductImageUrl,
  sanitizeProductImageFileName,
  validateAdminProductImage,
} from "@/lib/product-image-validation";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const PRODUCT_IMAGES_BUCKET = "product-images";

export async function uploadAdminProductImage(file: File, productId: string) {
  validateAdminProductImage(file);

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase storage upload is not configured.");
  }

  const safeFileName = sanitizeProductImageFileName(file.name);
  const contentType = getProductImageContentType(file.name, file.type);
  const filePath = `${productId}/${Date.now()}-${randomUUID()}-${safeFileName}`;
  const uploadBody = new Blob([await file.arrayBuffer()], { type: contentType });
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filePath, uploadBody, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error("Image upload failed. Please try another file.");
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error("Image upload failed. Please try another file.");
  }

  try {
    return parseAdminProductImageUrl(data.publicUrl);
  } catch {
    throw new Error("Image upload failed. Please try another file.");
  }
}
