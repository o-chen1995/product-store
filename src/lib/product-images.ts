import { randomUUID } from "crypto";
import { validateAdminProductImage } from "@/lib/product-image-validation";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const PRODUCT_IMAGES_BUCKET = "product-images";
function getFileExtension(contentType: string) {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

export async function uploadAdminProductImage(file: File, productId: string) {
  validateAdminProductImage(file);

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase storage upload is not configured.");
  }

  const extension = getFileExtension(file.type);
  const filePath = `${productId}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error("Unable to upload product image.");
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error("Unable to create public image URL.");
  }

  return data.publicUrl;
}
