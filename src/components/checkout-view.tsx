"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useStore } from "@/components/store-provider";
import { formatINR } from "@/lib/pricing";
import { ACCOUNT_TOKEN_KEY } from "@/lib/account";

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
  const { cart, subtotal, couponCode, clearCart, setCouponCode } = useStore();
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("cod");
  const [razorpayAvailable, setRazorpayAvailable] = useState(false);
  const [needsBagRefresh, setNeedsBagRefresh] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    number: string;
    payment: string;
  } | null>(null);
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

  async function verifyPayment(
    apiBase: string,
    order: OrderResult,
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

    clearCart();
    setCompletedOrder({ number: order.data.order_number, payment: "Payment confirmed" });
    setLoading(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
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
        clearCart();
        setCompletedOrder({
          number: result.data.order_number,
          payment: "Cash on delivery selected",
        });
        setLoading(false);
        return;
      }

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
          void verifyPayment(apiBase, result, payment).catch((error: unknown) => {
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

  if (completedOrder) {
    return (
      <div className="emptyState cartEmpty">
        <span className="eyebrow">Order received</span>
        <h2>Thank you for choosing Sonaro.</h2>
        <p>
          Your order <strong>{completedOrder.number}</strong> is confirmed. {completedOrder.payment}.
          We’ll send updates to your email and mobile number.
        </p>
        <Link href="/shop" className="button buttonDark">Continue shopping</Link>
      </div>
    );
  }

  if (!cart.length) {
    return <div className="emptyState cartEmpty"><h2>Your bag is empty.</h2>{notice && <p className="integrationNotice" role="status">{notice}</p>}<Link href="/shop" className="button buttonDark">Return to shop</Link></div>;
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
          <div className="formGrid"><label className="fullField">Coupon code <span className="mutedLabel">(optional)</span><input name="coupon_code" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Enter offer code" autoCapitalize="characters" /></label></div>
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
        <div className="checkoutTotals"><div><span>Estimated subtotal</span><b>{formatINR(subtotal)}</b></div><div><span>Insured shipping</span><b>Free</b></div><div className="summaryTotal"><span>Estimated total</span><b>{formatINR(subtotal)}</b></div></div>
        <button className="button buttonDark checkoutButton" disabled={loading} type="submit">{loading ? "Please wait…" : "Place secure order"}</button>
        <p className="priceFootnote">Final price is recalculated securely using the latest configured metal rate.</p>
        {notice && <p className="integrationNotice" role="alert">{notice}</p>}
        {needsBagRefresh && <button className="button buttonOutline checkoutButton" type="button" onClick={() => { clearCart(); setNeedsBagRefresh(false); setNotice("Unavailable items were removed. Please add currently available jewellery again."); }}>Remove unavailable items</button>}
      </aside>
    </form>
  );
}
