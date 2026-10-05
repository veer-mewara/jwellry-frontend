"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/components/store-provider";
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

  return (
    <div className="cartGrid">
      <div className="cartLines">
        {cart.map((line) => (
          <article className="cartLine" key={line.productId}>
            <Link className="cartImage" href={`/products/${line.slug}`}>
              <Image src={line.image} alt={line.name} fill sizes="140px" />
            </Link>
            <div className="cartLineMain">
              <span>{line.purity}</span>
              <h2><Link href={`/products/${line.slug}`}>{line.name}</Link></h2>
              <p>{formatINR(line.price)}</p>
              <div className="cartLineActions">
                <div className="stepper">
                  <button type="button" onClick={() => setQuantity(line.productId, line.quantity - 1)}>−</button>
                  <span>{line.quantity}</span>
                  <button type="button" onClick={() => setQuantity(line.productId, line.quantity + 1)}>+</button>
                </div>
                <button type="button" className="removeButton" onClick={() => removeFromCart(line.productId)}>Remove</button>
              </div>
            </div>
            <strong>{formatINR(line.price * line.quantity)}</strong>
          </article>
        ))}
      </div>
      <aside className="orderSummary">
        <h2>Order summary</h2>
        <CouponTotals subtotal={subtotal} preview={preview} checking={checking} />
        <div><span>Shipping</span><b>Calculated at checkout</b></div>
        <div className="summaryTotal"><span>Estimated total</span><b>{checking ? "Checking coupon…" : formatINR(couponTotal(subtotal, preview))}</b></div>
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
        <p className="secureNote">Choose cash on delivery or an available online payment method at checkout.</p>
      </aside>
    </div>
  );
}
