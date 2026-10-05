"use client";

import { useEffect, useMemo, useState } from "react";
import type { CartLine } from "@/types/commerce";

export interface CouponPreview {
  code: string;
  valid: boolean;
  subtotal: number;
  discount: number;
  total: number;
  message: string | null;
}

interface PreviewState {
  code: string;
  key: string;
  preview: CouponPreview | null;
  error: string;
}

const DEBOUNCE_MS = 400;

/**
 * Asks the server what the coupon is worth for the current cart. The server is
 * the source of truth; this is only a preview. Responses for an outdated
 * code/cart are ignored.
 */
export function useCouponPreview(cart: CartLine[], couponCode: string) {
  const [state, setState] = useState<PreviewState | null>(null);
  const items = useMemo(
    () => cart.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
    [cart],
  );
  const key = `${couponCode}|${JSON.stringify(items)}`;
  const active = Boolean(couponCode && items.length);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!active || !base) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`${base}/api/checkout/coupon-preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ coupon_code: couponCode, items }),
          signal: controller.signal,
        });
        if (response.status === 429) {
          if (controller.signal.aborted) return;
          setState({
            code: couponCode,
            key,
            preview: null,
            error: "Too many attempts, please wait a minute.",
          });
          return;
        }
        const payload = (await response.json()) as {
          data?: CouponPreview;
          message?: string;
          errors?: Record<string, string[]>;
        };
        if (controller.signal.aborted) return;
        if (!response.ok || !payload.data) {
          const error =
            (payload.errors && Object.values(payload.errors).flat()[0]) ||
            payload.message ||
            "We could not check this coupon right now.";
          setState({ code: couponCode, key, preview: null, error });
          return;
        }
        setState({ code: couponCode, key, preview: payload.data, error: "" });
      } catch {
        if (controller.signal.aborted) return;
        setState({
          code: couponCode,
          key,
          preview: null,
          error: "We could not check this coupon right now. It will be verified when you place the order.",
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [active, couponCode, items, key]);

  const current = active && state && state.key === key ? state : null;
  return {
    preview: current?.preview ?? null,
    error: current?.error ?? "",
    checking: active && !current,
  };
}
