"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartProduct } from "@/store/cart-store";

export function ProductActions({ product }: { product: CartProduct }) {
  const router = useRouter();
  const addProduct = useCartStore((state) => state.addProduct);

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <Button
        type="button"
        className="h-12 w-full sm:w-auto"
        onClick={() => addProduct(product)}
      >
        Add to cart
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full sm:w-auto"
        onClick={() => {
          addProduct(product);
          router.push("/cart");
        }}
      >
        Buy now
      </Button>
    </div>
  );
}
