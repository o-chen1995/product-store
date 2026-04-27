const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const IMAGE_CONTENT_TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

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

export function sanitizeProductImageFolderName(folderName: string) {
  return (
    folderName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "product-image"
  );
}

export function getProductImageContentType(fileName: string, contentType: string) {
  const extension = getProductImageExtension(fileName);

  if (!extension) {
    return contentType;
  }

  return IMAGE_CONTENT_TYPES_BY_EXTENSION[extension] ?? contentType;
}

export function validateAdminProductImageMetadata({
  contentType,
  fileName,
  size,
}: {
  contentType: string;
  fileName: string;
  size: number;
}) {
  const extension = getProductImageExtension(fileName);
  const normalizedContentType = getProductImageContentType(fileName, contentType);

  if (!extension || !ALLOWED_IMAGE_TYPES.has(normalizedContentType)) {
    throw new Error("Only JPG, PNG, and WEBP images are supported.");
  }

  if (size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    throw new Error("Image must be under 5MB.");
  }
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
    throw new Error("Only JPG, PNG, and WEBP images are supported.");
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    throw new Error("Image must be under 5MB.");
  }
}
