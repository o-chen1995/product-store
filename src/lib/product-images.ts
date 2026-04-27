import { randomUUID } from "crypto";
import {
  getProductImageContentType,
  parseAdminProductImageUrl,
  sanitizeProductImageFolderName,
  sanitizeProductImageFileName,
  validateAdminProductImageMetadata,
} from "@/lib/product-image-validation";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const PRODUCT_IMAGES_BUCKET = "product-images";

export async function createAdminProductImageUploadTarget({
  contentType,
  fileName,
  folderName,
  size,
}: {
  contentType: string;
  fileName: string;
  folderName: string;
  size: number;
}) {
  const normalizedContentType = getProductImageContentType(fileName, contentType);

  validateAdminProductImageMetadata({
    contentType: normalizedContentType,
    fileName,
    size,
  });
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Could not prepare image upload.");
  }

  const { error: bucketError } = await supabase.storage.getBucket(PRODUCT_IMAGES_BUCKET);

  if (bucketError) {
    throw new Error("Product image bucket is not configured.");
  }

  const safeFileName = sanitizeProductImageFileName(fileName);
  const safeFolderName = sanitizeProductImageFolderName(folderName);
  const filePath = `${safeFolderName}/${Date.now()}-${randomUUID()}-${safeFileName}`;
  const { data: signedUpload, error: signedUploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .createSignedUploadUrl(filePath, { upsert: false });

  if (signedUploadError || !signedUpload?.token) {
    throw new Error("Could not prepare image upload.");
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error("Could not prepare image upload.");
  }

  try {
    return {
      path: signedUpload.path,
      publicUrl: parseAdminProductImageUrl(data.publicUrl),
      signedUrl: signedUpload.signedUrl,
      token: signedUpload.token,
      contentType: normalizedContentType,
    };
  } catch {
    throw new Error("Could not prepare image upload.");
  }
}
