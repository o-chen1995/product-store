const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function validateAdminProductImage(file: File | null) {
  if (!file || file.size === 0) {
    return;
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Image must be JPG, JPEG, PNG, or WEBP.");
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }
}
