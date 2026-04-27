import type { Product } from "@/types";

export const products: Product[] = [
  {
    id: "prd-001",
    slug: "terra-carry-tote",
    name: "Terra Carry Tote",
    category: "Bags",
    priceCents: 12800,
    shortDescription: "A structured everyday tote with weather-resistant canvas.",
    description:
      "Built for daily errands, commutes, and weekend runs, the Terra Carry Tote keeps essentials organized without feeling bulky.",
    highlights: [
      "Recycled waxed canvas shell",
      "Padded 13-inch laptop sleeve",
      "Interior bottle loop and key clip",
      "Ships in plastic-free packaging",
    ],
    badge: "Best Seller",
    imageAlt: "Minimal canvas tote bag in warm earth tones",
    accent: {
      from: "#d7a86e",
      to: "#415f4a",
    },
    inventory: 18,
    featured: true,
  },
  {
    id: "prd-002",
    slug: "linen-desk-mat",
    name: "Linen Desk Mat",
    category: "Workspace",
    priceCents: 6400,
    shortDescription: "A soft-touch desk surface for focused workspaces.",
    description:
      "The Linen Desk Mat adds a tactile, durable surface to your desk while keeping the visual profile calm and uncluttered.",
    highlights: [
      "Natural linen blend top layer",
      "Non-slip cork backing",
      "Fits keyboard, mouse, and notebook",
      "Easy roll storage",
    ],
    imageAlt: "Neutral linen desk mat on a clean workspace",
    accent: {
      from: "#c8d2d1",
      to: "#677b8a",
    },
    inventory: 32,
    featured: true,
  },
  {
    id: "prd-003",
    slug: "daily-ceramic-cup",
    name: "Daily Ceramic Cup",
    category: "Home",
    priceCents: 3800,
    shortDescription: "A hand-finished ceramic cup made for daily rituals.",
    description:
      "Designed with a comfortable hold and balanced weight, this cup works for morning coffee, evening tea, or a quiet desk companion.",
    highlights: [
      "Dishwasher-safe glazed ceramic",
      "Stackable low-profile form",
      "Holds 320 ml",
      "Subtle hand-finished variation",
    ],
    badge: "New",
    imageAlt: "Hand-finished ceramic cup with a matte glaze",
    accent: {
      from: "#e6ded1",
      to: "#9a644b",
    },
    inventory: 25,
    featured: true,
  },
  {
    id: "prd-004",
    slug: "modular-travel-pouch",
    name: "Modular Travel Pouch",
    category: "Travel",
    priceCents: 5600,
    shortDescription: "Compact storage for cables, cards, and small tools.",
    description:
      "A low-profile pouch with flexible dividers, made to keep tech accessories and travel essentials easy to reach.",
    highlights: [
      "Two removable mesh dividers",
      "Water-resistant recycled nylon",
      "Flat base for easy packing",
      "Durable YKK zipper",
    ],
    imageAlt: "Compact travel pouch with organized internal pockets",
    accent: {
      from: "#9fb3c8",
      to: "#313f59",
    },
    inventory: 14,
    featured: false,
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(priceCents / 100);
}
