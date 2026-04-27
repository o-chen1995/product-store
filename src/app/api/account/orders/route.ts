import { NextResponse } from "next/server";
import { getCurrentUserOrders } from "@/lib/account-orders";

export async function GET(request: Request) {
  try {
    const orders = await getCurrentUserOrders(request.headers.get("authorization"));

    return NextResponse.json({ orders });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load account orders.";
    const status = message === "Authentication required." ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
