"use client";

import { useState } from "react";
import type { Product } from "@/types/commerce";
import { useStore } from "@/components/store-provider";

export function ProductPurchase({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const wished = isWishlisted(product.id);

  function add() {
    addToCart(product, quantity);
    setMessage("Added to your shopping bag.");
  }

  return (
    <div className="purchaseBlock">
      <div className="quantityRow">
        <span>Quantity</span>
        <div className="stepper">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
          <span>{quantity}</span>
          <button type="button" onClick={() => setQuantity((value) => value + 1)}>+</button>
        </div>
      </div>
      <button
        className="button buttonDark productAddButton"
        type="button"
        onClick={add}
        disabled={product.stock === 0}
      >
        {product.stock ? "Add to shopping bag" : "Currently unavailable"}
      </button>
      <button
        className="wishlistTextButton"
        type="button"
        onClick={() => toggleWishlist(product.id)}
      >
        {wished ? "♥ Saved to wishlist" : "♡ Save to wishlist"}
      </button>
      {message && <p className="successMessage" role="status">{message}</p>}
    </div>
  );
}
