"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { maxQuantityFor, useStore } from "@/components/store-provider";
import { formatINR } from "@/lib/pricing";
import { useCouponPreview } from "@/lib/coupon-preview";
import { CouponTotals, couponTotal } from "@/components/coupon-totals";

export function CartView() {
  const { cart, subtotal, couponCode, setCouponCode, setQuantity, removeFromCart } = useStore();
  const [coupon, setCoupon] = useState(couponCode);
  const { preview, error, checking } = useCouponPreview(cart, couponCode);

  if (!cart.length) {
    return (
      <div className="emptyState cartEmpty">
        <span className="emptyIcon">Bag</span>
        <h2>Your shopping bag is empty.</h2>
        <p>Explore the collection and save the pieces that speak to you.</p>
        <Link className="button buttonDark" href="/shop">Continue shopping</Link>
      </div>
    );
  }

  const pieces = cart.reduce((count, line) => count + line.quantity, 0);

  return (
    <div className="cartGrid">
      <section className="cartLines" aria-label="Pieces in your bag">
        <header className="cartLinesHead">
          <span>{pieces} {pieces === 1 ? "piece" : "pieces"}</span>
          <Link href="/shop">Continue shopping</Link>
        </header>
        {cart.map((line) => (
          <article className="cartLine" key={line.productId}>
            <Link className="cartImage" href={`/products/${line.slug}`}>
              <Image src={line.image} alt={line.name} fill sizes="140px" />
            </Link>
            <div className="cartLineMain">
              <div className="cartLineTop">
                <div>
                  <span className="cartPurity">{line.purity}</span>
                  <h2><Link href={`/products/${line.slug}`}>{line.name}</Link></h2>
                  {line.quantity > 1 && <p className="cartUnitPrice">{formatINR(line.price)} each</p>}
                </div>
                <strong className="cartLineTotal">{formatINR(line.price * line.quantity)}</strong>
              </div>
              {line.stock === 0 && <p className="soldOutNote" role="status">Sold out — remove this piece to check out.</p>}
              <div className="cartLineActions">
                <div className="stepper">
                  <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(line.productId, line.quantity - 1)}>−</button>
                  <span>{line.quantity}</span>
                  <button type="button" aria-label="Increase quantity" disabled={line.quantity >= maxQuantityFor(line.stock)} onClick={() => setQuantity(line.productId, line.quantity + 1)}>+</button>
                </div>
                <button type="button" className="removeButton" onClick={() => removeFromCart(line.productId)}>Remove</button>
              </div>
            </div>
          </article>
        ))}
      </section>
      <aside className="orderSummary">
        <h2>Order summary</h2>
        <CouponTotals subtotal={subtotal} preview={preview} checking={checking} />
        <div><span>Insured shipping</span><b>Free</b></div>
        <div className="summaryTotal"><span>Estimated total</span><b>{checking ? "Checking coupon…" : formatINR(couponTotal(subtotal, preview))}</b></div>
        <p className="summaryTaxNote">Prices include GST.</p>
        <form className="couponForm" onSubmit={(event) => {
          event.preventDefault();
          setCouponCode(coupon.trim().toUpperCase());
        }}>
          <label htmlFor="coupon">Coupon code</label>
          <div><input id="coupon" value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Enter code" /><button type="submit">Apply</button></div>
          {couponCode && <small className="couponStatus" role="status">
            {checking && !error ? "Checking coupon…" : null}
            {preview?.valid && <><strong>{couponCode}</strong> applied.</>}
            {preview && !preview.valid && (preview.message || "This coupon is invalid, expired or not applicable to this order.")}
            {error}
            {" "}
            <button type="button" className="couponRemove" onClick={() => { setCouponCode(""); setCoupon(""); }}>Remove code</button>
          </small>}
        </form>
        <Link className="button buttonDark checkoutButton" href="/checkout">Proceed to secure checkout</Link>
        <p className="secureNote">Sign in or create an account to check out. Choose cash on delivery or an available online payment method at checkout.</p>
      </aside>
    </div>
  );
}
