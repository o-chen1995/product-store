import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin";
import { uploadAdminProductImage } from "@/lib/product-images";
import { validateAdminProductImage } from "@/lib/product-image-validation";

function uploadError(error: string, status = 400) {
  return NextResponse.json({ error, field: "uploadedImage" }, { status });
}

export async function POST(request: Request) {
  try {
    await requireAdminFromRequest(request);
    const formData = await request.formData();
    const imageFile = formData.get("image_file");
    const file = imageFile instanceof File && imageFile.size > 0 ? imageFile : null;

    if (!file) {
      return uploadError("Image upload failed. Please try another file.");
    }

    validateAdminProductImage(file);

    const folderName = String(formData.get("folder") ?? "product-image");
    const publicUrl = await uploadAdminProductImage(file, folderName);

    return NextResponse.json({ publicUrl });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Image upload failed. Please try another file.";
    const status = message.includes("required")
      ? 401
      : message.includes("Admin")
        ? 403
        : 400;

    return uploadError(
      message.includes("Image")
        ? message
        : "Image upload failed. Please try another file.",
      status,
    );
  }
}
