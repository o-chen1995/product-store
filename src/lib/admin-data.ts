import { z } from "zod";
import { uploadAdminProductImage } from "@/lib/product-images";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export const productStatusSchema = z.enum(["draft", "active", "archived"]);

export const adminProductSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().trim().min(1),
  price: z.number().min(0),
  compare_at_price: z.number().min(0).nullable().optional(),
  stock: z.number().int().min(0),
  status: productStatusSchema,
  category_id: z.string().uuid(),
  image_url: z.string().trim().optional(),
});

export type AdminProductInput = z.infer<typeof adminProductSchema>;

export type AdminCategory = {
  id: string;
  name: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  status: "draft" | "active" | "archived";
  category_id: string | null;
  created_at: string;
  product_images?: Array<{ image_url: string; sort_order: number }>;
};

export type AdminProductFormPayload = {
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  status: "draft" | "active" | "archived";
  category_id: string;
  image_url: string | null;
  image_file: File | null;
};

export type AdminOrder = {
  id: string;
  status: "pending" | "paid" | "cancelled" | "fulfilled";
  total: number;
  created_at: string;
  notes: string | null;
  admin_note: string | null;
  paid_at: string | null;
  customers: { name: string; email: string; phone: string | null } | null;
  addresses: {
    recipient_name: string;
    phone: string | null;
    line1: string;
    line2: string | null;
    city: string;
    state: string | null;
    postal_code: string;
    country: string;
  } | null;
  order_items?: Array<{
    id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }>;
  admin_note_supported?: boolean;
};

export type AdminOrderSummary = {
  id: string;
  status: "pending" | "paid" | "cancelled" | "fulfilled";
  total: number;
  created_at: string;
  customers: { email: string } | { email: string }[] | null;
};

export function getAdminOrderCustomerEmail(order: AdminOrderSummary) {
  if (Array.isArray(order.customers)) {
    return order.customers[0]?.email ?? "Guest";
  }

  return order.customers?.email ?? "Guest";
}

function getSupabase() {
  const supabase = createServiceRoleSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase admin data access is not configured.");
  }

  return supabase;
}

function throwProductSaveError(
  error: { code?: string; message?: string } | null,
): never {
  if (error?.code === "23505" && error.message?.includes("products_slug_key")) {
    throw new Error("Slug already exists.");
  }

  if (error?.code === "23514" && error.message?.includes("compare_at_price")) {
    throw new Error("Compare at price must be greater than or equal to price.");
  }

  throw new Error("Unable to save product.");
}

export async function getAdminDashboardStats() {
  const supabase = getSupabase();
  const [
    products,
    orders,
    pendingOrders,
    paidOrders,
    recentOrders,
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid"),
    supabase
      .from("orders")
      .select("id, status, total, created_at, customers ( email )")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (
    products.error ||
    orders.error ||
    pendingOrders.error ||
    paidOrders.error ||
    recentOrders.error
  ) {
    throw new Error("Unable to load admin dashboard.");
  }

  return {
    totalProducts: products.count ?? 0,
    totalOrders: orders.count ?? 0,
    pendingOrders: pendingOrders.count ?? 0,
    paidOrders: paidOrders.count ?? 0,
    recentOrders: (recentOrders.data ?? []) as unknown as AdminOrderSummary[],
  };
}

export async function getAdminCategories() {
  const { data, error } = await getSupabase()
    .from("categories")
    .select("id, name")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error("Unable to load categories.");
  }

  return (data ?? []) as AdminCategory[];
}

export async function getAdminProducts() {
  const { data, error } = await getSupabase()
    .from("products")
    .select("id, name, slug, description, price, compare_at_price, stock, status, category_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load products.");
  }

  return (data ?? []) as AdminProduct[];
}

export async function getAdminProductById(productId: string) {
  const { data, error } = await getSupabase()
    .from("products")
    .select(
      "id, name, slug, description, price, compare_at_price, stock, status, category_id, created_at, product_images ( image_url, sort_order )",
    )
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load product.");
  }

  return data as AdminProduct | null;
}

export async function createAdminProduct(input: AdminProductInput) {
  const supabase = getSupabase();
  const { image_url, ...productInput } = input;
  const { data, error } = await supabase
    .from("products")
    .insert({
      ...productInput,
      short_description: input.description.slice(0, 160),
      image_alt: input.name,
      featured: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    throwProductSaveError(error);
  }

  if (image_url) {
    const { error: imageError } = await supabase.from("product_images").insert({
      product_id: data.id,
      image_url,
      alt_text: input.name,
      sort_order: 10,
    });

    if (imageError) {
      throw new Error("Image upload failed");
    }
  }

  return data.id as string;
}

export async function createAdminProductWithImage(
  input: AdminProductFormPayload,
) {
  const supabase = getSupabase();
  const { image_file, image_url, ...productInput } = input;
  const { data, error } = await supabase
    .from("products")
    .insert({
      ...productInput,
      short_description: input.description.slice(0, 160),
      image_alt: input.name,
      featured: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    throwProductSaveError(error);
  }

  const publicUrl = image_file
    ? await uploadAdminProductImage(image_file, data.id)
    : image_url;

  if (publicUrl) {
    const { error: imageError } = await supabase.from("product_images").insert({
      product_id: data.id,
      image_url: publicUrl,
      alt_text: input.name,
      sort_order: 10,
    });

    if (imageError) {
      throw new Error("Image upload failed");
    }
  }

  return data.id as string;
}

export async function updateAdminProduct(productId: string, input: AdminProductInput) {
  const supabase = getSupabase();
  const { image_url, ...productInput } = input;
  const { error } = await supabase
    .from("products")
    .update({
      ...productInput,
      short_description: input.description.slice(0, 160),
      image_alt: input.name,
    })
    .eq("id", productId);

  if (error) {
    throwProductSaveError(error);
  }

  if (image_url) {
    const { error: imageError } = await supabase
      .from("product_images")
      .upsert(
        {
          product_id: productId,
          image_url,
          alt_text: input.name,
          sort_order: 10,
        },
        { onConflict: "product_id,sort_order" },
      );

    if (imageError) {
      throw new Error("Image upload failed");
    }
  }
}

export async function updateAdminProductWithImage(
  productId: string,
  input: AdminProductFormPayload,
) {
  const supabase = getSupabase();
  const { image_file, image_url, ...productInput } = input;
  const { error } = await supabase
    .from("products")
    .update({
      ...productInput,
      short_description: input.description.slice(0, 160),
      image_alt: input.name,
    })
    .eq("id", productId);

  if (error) {
    throwProductSaveError(error);
  }

  const publicUrl = image_file
    ? await uploadAdminProductImage(image_file, productId)
    : image_url;

  if (publicUrl) {
    const { error: imageError } = await supabase
      .from("product_images")
      .upsert(
        {
          product_id: productId,
          image_url: publicUrl,
          alt_text: input.name,
          sort_order: 10,
        },
        { onConflict: "product_id,sort_order" },
      );

    if (imageError) {
      throw new Error("Image upload failed");
    }
  }
}

export async function getAdminOrders() {
  const { data, error } = await getSupabase()
    .from("orders")
    .select("id, status, total, created_at, customers ( email )")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load orders.");
  }

  return (data ?? []) as unknown as AdminOrderSummary[];
}

export async function getAdminOrderById(orderId: string) {
  const supabase = getSupabase();
  const selectOrderDetail = `
    id,
    status,
    total,
    created_at,
    notes,
    admin_note,
    paid_at,
    customers ( name, email, phone ),
    addresses ( recipient_name, phone, line1, line2, city, state, postal_code, country ),
    order_items ( id, product_name, unit_price, quantity, line_total )
  `;
  const selectOrderDetailWithoutAdminNote = `
    id,
    status,
    total,
    created_at,
    notes,
    paid_at,
    customers ( name, email, phone ),
    addresses ( recipient_name, phone, line1, line2, city, state, postal_code, country ),
    order_items ( id, product_name, unit_price, quantity, line_total )
  `;
  const { data, error } = await supabase
    .from("orders")
    .select(selectOrderDetail)
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    if (error.code === "42703" && error.message.includes("admin_note")) {
      const fallbackResult = await supabase
        .from("orders")
        .select(selectOrderDetailWithoutAdminNote)
        .eq("id", orderId)
        .maybeSingle();

      if (fallbackResult.error) {
        throw new Error("Unable to load order.");
      }

      return fallbackResult.data
        ? (({
            ...fallbackResult.data,
            admin_note: null,
            admin_note_supported: false,
          } as unknown) as AdminOrder)
        : null;
    }

    throw new Error("Unable to load order.");
  }

  return data
    ? (({
        ...data,
        admin_note_supported: true,
      } as unknown) as AdminOrder)
    : null;
}

export async function updateAdminOrderStatus(
  orderId: string,
  input: {
    status: AdminOrder["status"];
    adminNote?: string | null;
  },
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("orders")
    .update({
      status: input.status,
      admin_note: input.adminNote ?? null,
    })
    .eq("id", orderId);

  if (error) {
    if (error.code === "42703" && error.message.includes("admin_note")) {
      const fallbackResult = await supabase
        .from("orders")
        .update({ status: input.status })
        .eq("id", orderId);

      if (!fallbackResult.error) {
        return;
      }
    }

    throw new Error("Unable to update order status.");
  }
}
