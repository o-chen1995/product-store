export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  priceCents: number;
  shortDescription: string;
  description: string;
  highlights: string[];
  badge?: string;
  imageUrl?: string | null;
  imageAlt: string;
  accent: {
    from: string;
    to: string;
  };
  inventory: number;
  featured: boolean;
};
