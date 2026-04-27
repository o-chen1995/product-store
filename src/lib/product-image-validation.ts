const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function getProductImageExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  return ALLOWED_IMAGE_EXTENSIONS.has(extension) ? extension : null;
}

export function sanitizeProductImageFileName(fileName: string) {
  const extension = getProductImageExtension(fileName) ?? "jpg";
  const baseName = fileName
    .slice(0, -(extension.length + 1))
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${baseName || "product-image"}.${extension}`;
}

export function parseAdminProductImageUrl(value: string | null | undefined) {
  const imageUrl = value?.trim() ?? "";

  if (!imageUrl) {
    return null;
  }

  try {
    const url = new URL(imageUrl);

    if (url.protocol !== "https:") {
      throw new Error("Invalid protocol.");
    }

    return url.toString();
  } catch {
    throw new Error("Please enter a valid https image URL");
  }
}

export function validateAdminProductImage(file: File | null) {
  if (!file || file.size === 0) {
    return;
  }

  const extension = getProductImageExtension(file.name);

  if (!extension || (file.type && !ALLOWED_IMAGE_TYPES.has(file.type))) {
    throw new Error("Image must be JPG, JPEG, PNG, or WEBP.");
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }
}
