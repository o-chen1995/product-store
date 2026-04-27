import { randomUUID } from "crypto";
import {
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
  const filePath = `${productId}/${randomUUID()}-${safeFileName}`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error("Image upload failed");
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error("Image upload failed");
  }

  return data.publicUrl;
}
