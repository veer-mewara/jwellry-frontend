"use client";

import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { useStore } from "@/components/store-provider";
import type { Product } from "@/types/commerce";

export function WishlistView({ products }: { products: Product[] }) {
  const { wishlist } = useStore();
  const saved = products.filter((product) => wishlist.includes(product.id));

  if (!saved.length) {
    return (
      <div className="emptyState cartEmpty">
        <span className="emptyIcon">♡</span>
        <h2>No saved pieces yet.</h2>
        <p>Tap the heart on any product to keep it here for later.</p>
        <Link className="button buttonDark" href="/shop">Discover jewellery</Link>
      </div>
    );
  }

  return <div className="productGrid">{saved.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}
