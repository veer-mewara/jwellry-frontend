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
    <div className="genz-purchase-block">
      <style>{`
        .genz-purchase-block {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .genz-action-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .genz-quantity {
          display: flex;
          align-items: center;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
          background: #fafafa;
          height: 48px;
        }
        .genz-quantity button {
          width: 40px;
          height: 100%;
          border: none;
          background: transparent;
          font-size: 1.2rem;
          cursor: pointer;
          color: #333;
        }
        .genz-quantity span {
          width: 30px;
          text-align: center;
          font-weight: 500;
        }
        .genz-add-btn {
          flex: 1;
          height: 48px;
          background: #111;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .genz-add-btn:hover {
          background: #333;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .genz-add-btn:active {
          transform: translateY(0);
        }
        .genz-add-btn:disabled {
          background: #aaa;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .genz-wishlist-btn {
          width: 48px;
          height: 48px;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.2s ease;
        }
        .genz-wishlist-btn:hover {
          border-color: #111;
          color: #ff4d4d;
        }
        .genz-wishlist-active {
          color: #ff4d4d;
          border-color: #ff4d4d;
        }
      `}</style>

      <div className="genz-action-row">
        <div className="genz-quantity">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
          <span>{quantity}</span>
          <button type="button" onClick={() => setQuantity((value) => value + 1)}>+</button>
        </div>
        
        <button
          className="genz-add-btn"
          type="button"
          onClick={add}
          disabled={product.stock === 0}
        >
          {product.stock ? (
            <>Add to Bag <i className="ri-shopping-bag-line"></i></>
          ) : (
            "Sold Out"
          )}
        </button>

        <button
          className={`genz-wishlist-btn ${wished ? 'genz-wishlist-active' : ''}`}
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label="Toggle wishlist"
          title={wished ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <i className={wished ? "ri-heart-3-fill" : "ri-heart-3-line"}></i>
        </button>
      </div>
      {message && <p className="successMessage" style={{ fontSize: '0.9rem', color: '#16a34a', margin: 0 }} role="status">{message}</p>}
    </div>
  );
}
