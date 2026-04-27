import { z } from "zod";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

const orderItemSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  name: z.string().min(1).optional(),
  quantity: z.number().int().min(1).max(99),
});

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(1),
    email: z.email(),
    phone: z.string().trim().min(1),
  }),
  address: z.object({
    line1: z.string().trim().min(1),
    line2: z.string().trim().optional(),
    city: z.string().trim().min(1),
    state: z.string().trim().optional(),
    postalCode: z.string().trim().min(1),
    country: z.string().trim().min(2).default("US"),
  }),
  items: z.array(orderItemSchema).min(1),
  totalCents: z.number().int().min(0),
  notes: z.string().trim().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

type ProductSnapshot = {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
};

type OrderItemSnapshot = {
  productId: string;
  productSlug: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

function groupItems(items: CreateOrderInput["items"]) {
  return items.reduce<Map<string, number>>((groupedItems, item) => {
    groupedItems.set(item.slug, (groupedItems.get(item.slug) ?? 0) + item.quantity);
    return groupedItems;
  }, new Map());
}

export async function createPendingOrder(
  input: CreateOrderInput,
  options: { userId?: string | null } = {},
) {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase order creation is not configured.");
  }

  const groupedItems = groupItems(input.items);
  const slugs = Array.from(groupedItems.keys());

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, slug, name, price, stock")
    .eq("status", "active")
    .in("slug", slugs);

  if (productsError) {
    throw new Error("Unable to validate products for this order.");
  }

  const productsBySlug = new Map(
    ((products ?? []) as ProductSnapshot[]).map((product) => [product.slug, product]),
  );
  const missingSlug = slugs.find((slug) => !productsBySlug.has(slug));

  if (missingSlug) {
    throw new Error(`Product is no longer available: ${missingSlug}`);
  }

  const orderItems: OrderItemSnapshot[] = slugs.map((slug) => {
    const product = productsBySlug.get(slug);
    const quantity = groupedItems.get(slug) ?? 0;

    if (!product) {
      throw new Error(`Product is no longer available: ${slug}`);
    }

    if (product.stock < quantity) {
      throw new Error(`Not enough stock for ${product.name}.`);
    }

    return {
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity,
    };
  });

  const subtotal = orderItems.reduce((total, item) => total + item.lineTotal, 0);
  const total = subtotal;

  if (input.totalCents !== total) {
    throw new Error("Cart total changed. Please review your cart and try again.");
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      email: input.customer.email,
      name: input.customer.name,
      phone: input.customer.phone,
    })
    .select("id")
    .single();

  if (customerError || !customer) {
    throw new Error("Unable to create customer for this order.");
  }

  const { data: address, error: addressError } = await supabase
    .from("addresses")
    .insert({
      customer_id: customer.id,
      recipient_name: input.customer.name,
      phone: input.customer.phone,
      line1: input.address.line1,
      line2: input.address.line2 || null,
      city: input.address.city,
      state: input.address.state || null,
      postal_code: input.address.postalCode,
      country: input.address.country,
    })
    .select("id")
    .single();

  if (addressError || !address) {
    throw new Error("Unable to create shipping address for this order.");
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: options.userId ?? null,
      customer_id: customer.id,
      shipping_address_id: address.id,
      status: "pending",
      subtotal,
      shipping_total: 0,
      tax_total: 0,
      total,
      currency: "USD",
      notes: input.notes || null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error("Unable to create order.");
  }

  const { error: orderItemsError } = await supabase.from("order_items").insert(
    orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_slug: item.productSlug,
      product_name: item.productName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_total: item.lineTotal,
    })),
  );

  if (orderItemsError) {
    throw new Error("Unable to create order items.");
  }

  return {
    orderId: order.id as string,
    orderNumber: order.id as string,
    status: "pending" as const,
    totalCents: total,
  };
}

export type CheckoutOrder = {
  id: string;
  status: "pending" | "paid" | "cancelled" | "fulfilled";
  total: number;
  currency: string;
  stripe_checkout_session_id: string | null;
};

export type CheckoutOrderItem = {
  id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export async function getCheckoutOrder(orderId: string) {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase order lookup is not configured.");
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, total, currency, stripe_checkout_session_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error("Order was not found.");
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("id, product_name, unit_price, quantity, line_total")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (itemsError || !items?.length) {
    throw new Error("Order items were not found.");
  }

  return {
    order: order as CheckoutOrder,
    items: items as CheckoutOrderItem[],
  };
}

export async function attachStripeCheckoutSession(
  orderId: string,
  checkoutSessionId: string,
) {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase order update is not configured.");
  }

  const { error } = await supabase
    .from("orders")
    .update({ stripe_checkout_session_id: checkoutSessionId })
    .eq("id", orderId);

  if (error) {
    throw new Error("Unable to attach Stripe Checkout Session to order.");
  }
}

export async function markOrderPaid({
  orderId,
  checkoutSessionId,
  paymentIntentId,
}: {
  orderId: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
}) {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase order update is not configured.");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      stripe_checkout_session_id: checkoutSessionId,
      stripe_payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    throw new Error("Unable to mark order as paid.");
  }
}
