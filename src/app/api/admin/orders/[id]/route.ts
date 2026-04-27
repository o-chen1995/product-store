import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { requireAdminFromRequest } from "@/lib/admin";
import { updateAdminOrderStatus } from "@/lib/admin-data";

const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "paid", "cancelled", "fulfilled"]),
  adminNote: z.string().trim().optional().nullable(),
});

type AdminOrderRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: AdminOrderRouteContext) {
  try {
    await requireAdminFromRequest(request);
    const { id } = await params;
    const { status, adminNote } = updateOrderStatusSchema.parse(await request.json());

    await updateAdminOrderStatus(id, {
      status,
      adminNote: adminNote && adminNote.length > 0 ? adminNote : null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    }

    const message =
      error instanceof Error ? error.message : "Unable to update order status.";
    const status = message.includes("required") ? 401 : message.includes("Admin") ? 403 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
