"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { formatINR } from "@/lib/pricing";
import { useSiteSettings } from "@/components/site-settings-provider";
import { getSavedOrderEmail, orderStatusLabel, saveOrderEmail } from "@/lib/orders";

interface OrderData {
  uuid: string;
  order_number: string;
  status: string;
  payment_status: string;
  email: string;
  grand_total: number | string;
  created_at: string;
  items: Array<{
    id?: number;
    name: string;
    sku: string;
    quantity: number;
    unit_price: number | string;
    line_total: number | string;
  }>;
  timeline: Array<{ status: string; note?: string | null; created_at: string }>;
}

type State =
  | { kind: "loading" }
  | { kind: "needEmail"; error?: string }
  | { kind: "error"; message: string }
  | { kind: "ready"; order: OrderData };

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function OrderView({
  uuid,
  queryEmail,
  placed,
}: {
  uuid: string;
  queryEmail: string;
  placed: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { name: storeName } = useSiteSettings();
  const [email, setEmail] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const known = queryEmail || getSavedOrderEmail(uuid);
      if (queryEmail) {
        // Keep the email out of the address bar, history and referrers.
        saveOrderEmail(uuid, queryEmail);
        const params = new URLSearchParams(window.location.search);
        params.delete("email");
        const rest = params.toString();
        router.replace(rest ? `${pathname}?${rest}` : pathname, { scroll: false });
      }
      if (known) setEmail(known);
      else setState({ kind: "needEmail" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [uuid, queryEmail, router, pathname]);

  useEffect(() => {
    if (!email) return;
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!base) {
      const timer = window.setTimeout(
        () => setState({ kind: "error", message: "The store API is not configured." }),
        0,
      );
      return () => window.clearTimeout(timer);
    }

    const controller = new AbortController();
    void fetch(`${base}/api/orders/${encodeURIComponent(uuid)}?email=${encodeURIComponent(email)}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 404 || response.status === 422) {
          setState({
            kind: "needEmail",
            error: "We could not find an order with that email. Please check the address used at checkout.",
          });
          return;
        }
        if (!response.ok) throw new Error("failed");
        const payload = (await response.json()) as { data: OrderData };
        saveOrderEmail(uuid, email);
        setState({ kind: "ready", order: payload.data });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ kind: "error", message: "We could not load your order right now. Please try again shortly." });
      });

    return () => controller.abort();
  }, [email, uuid, attempt]);

  function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("email") || "").trim();
    if (!value) return;
    setState({ kind: "loading" });
    setEmail(value);
    setAttempt((count) => count + 1);
  }

  if (state.kind === "loading") {
    return <div className="emptyState cartEmpty"><p role="status">Loading your order…</p></div>;
  }

  if (state.kind === "error") {
    return (
      <div className="emptyState cartEmpty">
        <h2>Something went wrong.</h2>
        <p>{state.message}</p>
        <Link href="/shop" className="button buttonDark">Continue shopping</Link>
      </div>
    );
  }

  if (state.kind === "needEmail") {
    return (
      <div className="emptyState cartEmpty">
        <h2>Enter the email used for this order</h2>
        <p>We use it to confirm the order belongs to you.</p>
        <form className="orderEmailForm" onSubmit={submitEmail}>
          <input required type="email" name="email" autoComplete="email" placeholder="you@example.com" aria-label="Email address" />
          <button className="button buttonDark" type="submit">View order</button>
        </form>
        {state.error && <p className="integrationNotice" role="alert">{state.error}</p>}
      </div>
    );
  }

  const { order } = state;
  return (
    <div className="orderPage">
      {placed && (
        <p className="integrationNotice" role="status">
          Thank you for choosing {storeName}. Your order has been placed and we will send updates to {order.email}.
        </p>
      )}
      <section className="accountPanel">
        <h2>Order {order.order_number}</h2>
        <dl className="orderFacts">
          <div><dt>Placed on</dt><dd>{formatDate(order.created_at)}</dd></div>
          <div><dt>Order status</dt><dd>{orderStatusLabel(order.status)}</dd></div>
          <div><dt>Payment</dt><dd>{orderStatusLabel(order.payment_status)}</dd></div>
          <div><dt>Total</dt><dd>{formatINR(Number(order.grand_total))}</dd></div>
        </dl>
      </section>
      <section className="accountPanel">
        <h2>Items</h2>
        <div className="accountOrders">
          {order.items.map((item, index) => (
            <div key={item.id ?? `${item.sku}-${index}`}>
              <span><b>{item.name}</b><small>SKU {item.sku} · Qty {item.quantity} × {formatINR(Number(item.unit_price))}</small></span>
              <span><b>{formatINR(Number(item.line_total))}</b></span>
            </div>
          ))}
        </div>
      </section>
      {order.timeline.length > 0 && (
        <section className="accountPanel">
          <h2>Progress</h2>
          <ol className="orderTimeline">
            {order.timeline.map((event, index) => (
              <li key={`${event.status}-${event.created_at}-${index}`}>
                <b>{orderStatusLabel(event.status)}</b>
                <small>{formatDate(event.created_at)}</small>
                {event.note && <p>{event.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}
      <Link href="/shop" className="button buttonDark">Continue shopping</Link>
    </div>
  );
}
