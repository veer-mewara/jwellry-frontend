"use client";

import type { Product } from "@/types/commerce";
import { Index2ProductTile } from "@/components/index2-home";

/** Keeps product grids on shop and related-product pages in the index-2 style. */
export function ProductCard({ product }: { product: Product }) {
  return <Index2ProductTile product={product} />;
}
