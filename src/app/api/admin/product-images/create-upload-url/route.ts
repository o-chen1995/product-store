import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { requireAdminFromRequest } from "@/lib/admin";
import { createAdminProductImageUploadTarget } from "@/lib/product-images";

const createUploadUrlSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  filename: z.string().trim().min(1),
  folder: z.string().trim().optional(),
  size: z.number().int().positive(),
});

function uploadUrlError(error: string, status = 400) {
  return NextResponse.json({ error, field: "uploadedImage" }, { status });
}

export async function POST(request: Request) {
  try {
    await requireAdminFromRequest(request);
    const input = createUploadUrlSchema.parse(await request.json());
    const uploadTarget = await createAdminProductImageUploadTarget({
      contentType: input.contentType,
      fileName: input.filename,
      folderName: input.folder ?? "product-image",
      size: input.size,
    });

    return NextResponse.json({
      path: uploadTarget.path,
      publicUrl: uploadTarget.publicUrl,
      token: uploadTarget.token,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return uploadUrlError("Only JPG, PNG, and WEBP images are supported.");
    }

    const message =
      error instanceof Error ? error.message : "Could not prepare image upload.";
    const status = message.includes("required")
      ? 401
      : message.includes("Admin")
        ? 403
        : 400;

    return uploadUrlError(message, status);
  }
}
