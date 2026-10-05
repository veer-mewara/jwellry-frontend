"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useStore } from "@/components/store-provider";
import { formatINR } from "@/lib/pricing";
import { ACCOUNT_TOKEN_KEY } from "@/lib/account";
import { saveOrderEmail } from "@/lib/orders";
import { useCouponPreview } from "@/lib/coupon-preview";
import { CouponTotals, couponTotal } from "@/components/coupon-totals";

interface OrderResult {
  data: {
    uuid: string;
    order_number: string;
    status: string;
    payment_status: string;
    grand_total: number;
  };
  payment: {
    method: "cod" | "razorpay";
    key_id?: string;
    razorpay_order_id?: string;
    amount?: number;
    currency?: string;
  };
  message?: string;
  errors?: Record<string, string[]>;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

interface SavedAddress {
  is_default: boolean;
  first_name: string;
  last_name?: string | null;
  phone: string;
  line_1: string;
  city: string;
  state: string;
  postal_code: string;
}

interface AccountPayload {
  data: {
    name: string;
    email: string;
    addresses: SavedAddress[];
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function apiMessage(result: Partial<OrderResult>) {
  const validationMessage = result.errors
    ? Object.values(result.errors).flat()[0]
    : undefined;
  if (validationMessage?.includes("product_id is invalid")) {
    return "One or more products in your bag are no longer available. Please refresh your bag and add the item again.";
  }
  return validationMessage || result.message || "We could not place the order. Please try again.";
}

export function CheckoutView() {
  const { cart, subtotal, couponCode, clearCart, setCouponCode, removeUnavailableItems } = useStore();
  const [notice, setNotice] = useState("");
  const [pendingOrderUuid, setPendingOrderUuid] = useState("");
  const [couponDraft, setCouponDraft] = useState(couponCode);
  const [syncedCoupon, setSyncedCoupon] = useState(couponCode);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("cod");
  const [razorpayAvailable, setRazorpayAvailable] = useState(false);
  const [needsBagRefresh, setNeedsBagRefresh] = useState(false);
  const router = useRouter();
  const { preview, error: couponError, checking } = useCouponPreview(cart, couponCode);
  if (syncedCoupon !== couponCode) {
    // Keep the draft in step when the code is changed elsewhere (restore, remove).
    setSyncedCoupon(couponCode);
    setCouponDraft(couponCode);
  }
  const checkoutFormRef = useRef<HTMLFormElement>(null);
  const [savedAddressNotice, setSavedAddressNotice] = useState("");

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiBase) return;

    const controller = new AbortController();
    void fetch(`${apiBase}/api/integrations/status`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload: { data: { razorpay: boolean } }) => {
        setRazorpayAvailable(payload.data.razorpay);
        if (payload.data.razorpay) setPaymentMethod("razorpay");
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    const customerToken = window.localStorage.getItem(ACCOUNT_TOKEN_KEY);
    if (!apiBase || !customerToken || !cart.length) return;

    const controller = new AbortController();
    void fetch(`${apiBase}/api/account`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${customerToken}` },
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload: AccountPayload) => {
        const address = payload.data.addresses.find((item) => item.is_default)
          || payload.data.addresses[0];
        const fields: Record<string, string | undefined | null> = {
          email: payload.data.email,
          first_name: address?.first_name,
          last_name: address?.last_name,
          phone: address?.phone,
          address: address?.line_1,
          city: address?.city,
          state: address?.state,
          postcode: address?.postal_code,
        };

        Object.entries(fields).forEach(([name, value]) => {
          const field = checkoutFormRef.current?.elements.namedItem(name);
          if (field instanceof HTMLInputElement && !field.value && value) {
            field.value = value;
          }
        });
        if (address) setSavedAddressNotice("Your saved default address has been added below.");
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [cart.length]);

  function applyCoupon() {
    const code = couponDraft.trim().toUpperCase();
    setCouponDraft(code);
    if (code !== couponCode) setCouponCode(code);
  }

  async function verifyPayment(
    apiBase: string,
    order: OrderResult,
    email: string,
    payment: RazorpayResponse,
  ) {
    const response = await fetch(`${apiBase}/api/payments/razorpay/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        order_uuid: order.data.uuid,
        ...payment,
      }),
    });
    const result = (await response.json()) as Partial<OrderResult>;
    if (!response.ok) throw new Error(apiMessage(result));

    finishOrder(order.data.uuid, email);
  }

  function finishOrder(uuid: string, email: string) {
    saveOrderEmail(uuid, email);
    clearCart();
    router.push(`/orders/${encodeURIComponent(uuid)}?placed=1`);
  }

  async function removeUnavailable() {
    const removed = await removeUnavailableItems();
    if (removed === null) {
      setNotice("We couldn’t check your bag right now. Please try again in a moment.");
      return;
    }
    setNeedsBagRefresh(false);
    setNotice(removed
      ? `${removed} unavailable ${removed === 1 ? "item was" : "items were"} removed from your bag. You can now place your order.`
      : "We couldn’t find any unavailable items. Please try placing your order again.");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setPendingOrderUuid("");
    setLoading(true);

    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiBase) {
      setNotice("Checkout API URL is not configured. Add NEXT_PUBLIC_API_URL before launch.");
      setLoading(false);
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      shipping: {
        first_name: String(form.get("first_name") || ""),
        last_name: String(form.get("last_name") || ""),
        line_1: String(form.get("address") || ""),
        city: String(form.get("city") || ""),
        state: String(form.get("state") || ""),
        postal_code: String(form.get("postcode") || ""),
        country: "IN",
      },
      payment_method: paymentMethod,
      coupon_code: couponCode,
      items: cart.map((line) => ({
        product_id: line.productId,
        quantity: line.quantity,
      })),
    };

    try {
      const customerToken = window.localStorage.getItem(ACCOUNT_TOKEN_KEY);
      const response = await fetch(`${apiBase}/api/checkout/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as OrderResult;
      if (!response.ok) {
        const message = apiMessage(result);
        if (message.includes("no longer available") || message.includes("refresh your bag")) {
          setNeedsBagRefresh(true);
        }
        throw new Error(message);
      }

      if (result.payment.method === "cod") {
        finishOrder(result.data.uuid, payload.email);
        return;
      }

      // Remember the email now so the order stays reachable if payment verification fails.
      saveOrderEmail(result.data.uuid, payload.email);
      setPendingOrderUuid(result.data.uuid);

      if (!(await loadRazorpay()) || !window.Razorpay) {
        throw new Error("Secure payment window could not load. Please check your connection.");
      }

      const checkout = new window.Razorpay({
        key: result.payment.key_id,
        amount: result.payment.amount,
        currency: result.payment.currency || "INR",
        name: process.env.NEXT_PUBLIC_BRAND_NAME || "Sonaro",
        description: `Order ${result.data.order_number}`,
        order_id: result.payment.razorpay_order_id,
        prefill: { email: payload.email, contact: payload.phone },
        theme: { color: "#201611" },
        handler: (payment: RazorpayResponse) => {
          void verifyPayment(apiBase, result, payload.email, payment).catch((error: unknown) => {
            setNotice(error instanceof Error ? error.message : "Payment verification failed.");
            setLoading(false);
          });
        },
        modal: {
          ondismiss: () => {
            setNotice("Payment window closed. Your card or UPI account was not charged here.");
            setLoading(false);
          },
        },
      });
      checkout.open();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "We could not place the order.");
      setLoading(false);
    }
  }

  if (!cart.length) {
    return <div className="emptyState cartEmpty"><h2>Your bag is empty.</h2>{notice && <p className="integrationNotice" role="status">{notice}</p>}{pendingOrderUuid && <p className="integrationNotice"><Link href={`/orders/${encodeURIComponent(pendingOrderUuid)}`}>View your order</Link></p>}<Link href="/shop" className="button buttonDark">Return to shop</Link></div>;
  }

  return (
    <form className="checkoutGrid" onSubmit={submit} ref={checkoutFormRef}>
      <div className="checkoutForm">
        <section className="formSection">
          <div className="formSectionHead"><span>01</span><div><h2>Contact</h2><p>We’ll send order updates here.</p></div></div>
          <div className="formGrid">
            <label className="fullField">Email address<input required type="email" name="email" autoComplete="email" /></label>
            <label>First name<input required name="first_name" autoComplete="given-name" /></label>
            <label>Last name<input name="last_name" autoComplete="family-name" /></label>
            <label className="fullField">Mobile number<input required type="tel" name="phone" minLength={8} maxLength={20} autoComplete="tel" /></label>
          </div>
          {savedAddressNotice && <p className="formHint" role="status">{savedAddressNotice}</p>}
        </section>
        <section className="formSection">
          <div className="formSectionHead"><span>02</span><div><h2>Delivery address</h2><p>We’ll confirm delivery availability before dispatch.</p></div></div>
          <div className="formGrid">
            <label className="fullField">Address<input required name="address" autoComplete="street-address" /></label>
            <label>City<input required name="city" autoComplete="address-level2" /></label>
            <label>State<input required name="state" autoComplete="address-level1" /></label>
            <label>PIN code<input required name="postcode" pattern="[1-9][0-9]{5}" inputMode="numeric" autoComplete="postal-code" /></label>
            <label>Country<input value="India" readOnly name="country" /></label>
          </div>
        </section>
        <section className="formSection">
          <div className="formSectionHead"><span>03</span><div><h2>Payment</h2><p>{razorpayAvailable ? "Secure payment powered by Razorpay." : "Cash on delivery is currently available."}</p></div></div>
          <div className="formGrid"><label className="fullField">Coupon code <span className="mutedLabel">(optional)</span><span className="couponDraftRow"><input name="coupon_code" value={couponDraft} onChange={(event) => setCouponDraft(event.target.value)} onBlur={applyCoupon} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyCoupon(); } }} placeholder="Enter offer code" autoCapitalize="characters" /><button type="button" className="button buttonOutline" onClick={applyCoupon}>Apply</button></span></label>
            {couponCode && <p className="fullField couponStatus" role="status">
              {checking && !couponError ? "Checking coupon…" : null}
              {preview?.valid && <><strong>{couponCode}</strong> applied.</>}
              {preview && !preview.valid && (preview.message || "This coupon is invalid, expired or not applicable to this order.")}
              {couponError}
              {" "}
              <button type="button" className="couponRemove" onClick={() => setCouponCode("")}>Remove code</button>
            </p>}
          </div>
          <label className="paymentOption"><input type="radio" disabled={!razorpayAvailable} checked={paymentMethod === "razorpay"} onChange={() => setPaymentMethod("razorpay")} name="payment" value="razorpay" /><span><b>Cards, UPI, netbanking & wallets</b><small>{razorpayAvailable ? "Razorpay secure checkout" : "Available after merchant credentials are configured"}</small></span></label>
          <label className="paymentOption"><input type="radio" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} name="payment" value="cod" /><span><b>Cash on delivery</b><small>Subject to serviceability and order value rules</small></span></label>
        </section>
      </div>
      <aside className="checkoutSummary">
        <h2>Your order</h2>
        <div className="checkoutItems">
          {cart.map((line) => (
            <div className="checkoutItem" key={line.productId}>
              <span className="checkoutThumb"><Image src={line.image} alt={line.name} fill sizes="72px" /><b>{line.quantity}</b></span>
              <div><h3>{line.name}</h3><p>{line.purity}</p></div>
              <strong>{formatINR(line.price * line.quantity)}</strong>
            </div>
          ))}
        </div>
        <div className="checkoutTotals"><CouponTotals subtotal={subtotal} preview={preview} checking={checking} /><div><span>Insured shipping</span><b>Free</b></div><div className="summaryTotal"><span>Estimated total</span><b>{checking ? "Checking coupon…" : formatINR(couponTotal(subtotal, preview))}</b></div></div>
        <button className="button buttonDark checkoutButton" disabled={loading} type="submit">{loading ? "Please wait…" : "Place secure order"}</button>
        <p className="priceFootnote">Final price is recalculated securely using the latest configured metal rate.</p>
        {notice && <p className="integrationNotice" role="alert">{notice}</p>}
        {pendingOrderUuid && <p className="integrationNotice"><Link href={`/orders/${encodeURIComponent(pendingOrderUuid)}`}>View your order</Link></p>}
        {needsBagRefresh && <button className="button buttonOutline checkoutButton" type="button" onClick={() => { void removeUnavailable(); }}>Remove unavailable items</button>}
      </aside>
    </form>
  );
}
