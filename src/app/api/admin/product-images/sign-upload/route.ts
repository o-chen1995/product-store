import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { requireAdminFromRequest } from "@/lib/admin";
import { createAdminProductImageUploadTarget } from "@/lib/product-images";

const signUploadSchema = z.object({
  contentType: z.string().trim(),
  fileName: z.string().trim().min(1),
  size: z.number().int().positive(),
});

function uploadUrlError(error: string, status = 400) {
  return NextResponse.json({ error, field: "uploadedImage" }, { status });
}

export async function POST(request: Request) {
  try {
    await requireAdminFromRequest(request);
    const input = signUploadSchema.parse(await request.json());
    const uploadTarget = await createAdminProductImageUploadTarget({
      contentType: input.contentType,
      fileName: input.fileName,
      folderName: "product-image",
      size: input.size,
    });

    return NextResponse.json({
      path: uploadTarget.path,
      publicUrl: uploadTarget.publicUrl,
      signedUrl: uploadTarget.signedUrl,
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
