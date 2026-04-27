import { randomUUID } from "crypto";
import {
  getProductImageContentType,
  parseAdminProductImageUrl,
  sanitizeProductImageFolderName,
  sanitizeProductImageFileName,
  validateAdminProductImage,
} from "@/lib/product-image-validation";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const PRODUCT_IMAGES_BUCKET = "product-images";

export async function uploadAdminProductImage(file: File, folderName: string) {
  validateAdminProductImage(file);

  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase storage upload is not configured.");
  }

  const safeFileName = sanitizeProductImageFileName(file.name);
  const contentType = getProductImageContentType(file.name, file.type);
  const safeFolderName = sanitizeProductImageFolderName(folderName);
  const filePath = `${safeFolderName}/${Date.now()}-${randomUUID()}-${safeFileName}`;
  const uploadBody = new Blob([await file.arrayBuffer()], { type: contentType });
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filePath, uploadBody, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(
      error.message.includes("Bucket not found")
        ? "Image upload failed. Bucket product-images was not found."
        : "Image upload failed. Please try another file.",
    );
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
