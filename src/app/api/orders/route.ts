import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getUserIdFromAuthorizationHeader } from "@/lib/auth";
import { createOrderSchema, createPendingOrder } from "@/lib/orders";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = createOrderSchema.parse(body);
    const userId = await getUserIdFromAuthorizationHeader(
      request.headers.get("authorization"),
    );
    const order = await createPendingOrder(input, { userId });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid order data.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unable to create order.";
    const status =
      message === "Supabase order creation is not configured." ? 503 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
