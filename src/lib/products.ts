import { products as mockProducts } from "@/data/products";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Product } from "@/types";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  price: number;
  stock: number;
  highlights: string[] | null;
  badge: string | null;
  image_alt: string | null;
  accent_from: string | null;
  accent_to: string | null;
  featured: boolean | null;
  product_images: Array<{ image_url: string; sort_order: number }> | null;
  categories: { name: string } | { name: string }[] | null;
};

function getPrimaryImageUrl(productImages: ProductRow["product_images"]) {
  return productImages?.sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url ?? null;
}

function getCategoryName(categories: ProductRow["categories"]) {
  if (Array.isArray(categories)) {
    return categories[0]?.name ?? "Uncategorized";
  }

  return categories?.name ?? "Uncategorized";
}

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: getCategoryName(row.categories),
    priceCents: row.price,
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    highlights: row.highlights ?? [],
    badge: row.badge ?? undefined,
    imageAlt: row.image_alt ?? row.name,
    accent: {
      from: row.accent_from ?? "#d7a86e",
      to: row.accent_to ?? "#415f4a",
    },
    imageUrl: getPrimaryImageUrl(row.product_images),
    inventory: row.stock,
    featured: row.featured ?? false,
  };
}

export async function getProducts(): Promise<Product[]> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return mockProducts;
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      `
        id,
        slug,
        name,
        short_description,
        description,
        price,
        stock,
        highlights,
        badge,
        image_alt,
        accent_from,
        accent_to,
        featured,
        product_images (
          image_url,
          sort_order
        ),
        categories (
          name
        )
      `,
    )
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error || !data) {
    return mockProducts;
  }

  return data.map((row) => mapProductRow(row as ProductRow));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return mockProducts.find((product) => product.slug === slug);
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      `
        id,
        slug,
        name,
        short_description,
        description,
        price,
        stock,
        highlights,
        badge,
        image_alt,
        accent_from,
        accent_to,
        featured,
        product_images (
          image_url,
          sort_order
        ),
        categories (
          name
        )
      `,
    )
    .eq("status", "active")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return mockProducts.find((product) => product.slug === slug);
  }

  if (!data) {
    return undefined;
  }

  return mapProductRow(data as ProductRow);
}

export function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(priceCents / 100);
}
