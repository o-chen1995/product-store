import { getUserIdFromAuthorizationHeader } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type AccountOrderSummary = {
  id: string;
  status: "pending" | "paid" | "cancelled" | "fulfilled";
  total: number;
  currency: string;
  created_at: string;
};

export type AccountOrderDetail = AccountOrderSummary & {
  notes: string | null;
  customer: {
    name: string;
    email: string;
    phone: string | null;
  } | null;
  address: {
    recipient_name: string;
    phone: string | null;
    line1: string;
    line2: string | null;
    city: string;
    state: string | null;
    postal_code: string;
    country: string;
  } | null;
  items: Array<{
    id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }>;
};

async function getCurrentUserId(authorization: string | null) {
  const userId = await getUserIdFromAuthorizationHeader(authorization);

  if (!userId) {
    throw new Error("Authentication required.");
  }

  return userId;
}

export async function getCurrentUserOrders(authorization: string | null) {
  const userId = await getCurrentUserId(authorization);
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase order lookup is not configured.");
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id, status, total, currency, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load account orders.");
  }

  return (data ?? []) as AccountOrderSummary[];
}

export async function getCurrentUserOrderById(
  orderId: string,
  authorization: string | null,
) {
  const userId = await getCurrentUserId(authorization);
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase order lookup is not configured.");
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
        id,
        status,
        total,
        currency,
        created_at,
        notes,
        customer_id,
        shipping_address_id
      `,
    )
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (orderError) {
    throw new Error("Unable to load account order.");
  }

  if (!order) {
    return null;
  }

  const [{ data: customer, error: customerError }, { data: address, error: addressError }, { data: items, error: itemsError }] =
    await Promise.all([
      order.customer_id
        ? supabase
            .from("customers")
            .select("name, email, phone")
            .eq("id", order.customer_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      order.shipping_address_id
        ? supabase
            .from("addresses")
            .select(
              "recipient_name, phone, line1, line2, city, state, postal_code, country",
            )
            .eq("id", order.shipping_address_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("order_items")
        .select("id, product_name, unit_price, quantity, line_total")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true }),
    ]);

  if (customerError || addressError || itemsError) {
    throw new Error("Unable to load order details.");
  }

  return {
    id: order.id,
    status: order.status,
    total: order.total,
    currency: order.currency,
    created_at: order.created_at,
    notes: order.notes,
    customer,
    address,
    items: items ?? [],
  } as AccountOrderDetail;
}
