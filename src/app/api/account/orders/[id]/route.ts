import { NextResponse } from "next/server";
import { getCurrentUserOrderById } from "@/lib/account-orders";

type AccountOrderRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: AccountOrderRouteContext) {
  try {
    const { id } = await params;
    const order = await getCurrentUserOrderById(
      id,
      request.headers.get("authorization"),
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load account order.";
    const status = message === "Authentication required." ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
