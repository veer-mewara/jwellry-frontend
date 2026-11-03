import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---- the page's neighbours, replaced with simple stand-ins ----
const router = { push: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("next/image", () => ({ default: (props: { alt: string }) => <span>{props.alt}</span> }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

const clearCart = vi.fn();
vi.mock("@/components/store-provider", () => ({
  useStore: () => ({
    cart: [{ productId: 7, quantity: 1, name: "Ring", image: "/r.jpg", unitPrice: 25000, slug: "ring", stock: 3 }],
    subtotal: 25000,
    couponCode: "",
    clearCart,
    setCouponCode: vi.fn(),
    removeUnavailableItems: vi.fn(),
  }),
}));
vi.mock("@/components/site-settings-provider", () => ({ useSiteSettings: () => ({ name: "Sonaro" }) }));
vi.mock("@/lib/coupon-preview", () => ({ useCouponPreview: () => ({ preview: null, error: "", checking: false }) }));

import { CheckoutView } from "./checkout-view";
import { resetRazorpayLoader } from "@/lib/razorpay";

interface RazorpayOptions {
  handler: (payment: Record<string, string>) => void;
  modal: { ondismiss: () => void };
  order_id: string;
}

let opened: RazorpayOptions[] = [];
let verifyStatus = 200;
let ordersCreated = 0;

const ORDER = {
  data: { uuid: "order-uuid-1", order_number: "JWL-1", email: "buyer@example.com", status: "pending_payment", payment_status: "pending", grand_total: 25000 },
  payment: { method: "razorpay", key_id: "rzp_test", razorpay_order_id: "order_rzp_1", amount: 2500000, currency: "INR" },
};

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.test";
  window.localStorage.setItem("sonaro_customer_token_v1", "token-1");
  opened = [];
  verifyStatus = 200;
  ordersCreated = 0;
  router.push.mockReset();
  clearCart.mockReset();
  resetRazorpayLoader();
  (window as { Razorpay?: unknown }).Razorpay = class {
    constructor(private options: RazorpayOptions) {}
    open() {
      opened.push(this.options);
    }
  };
  vi.stubGlobal("fetch", vi.fn((url: string) => {
    if (url.endsWith("/api/integrations/status")) return json({ data: { razorpay: true } });
    if (url.endsWith("/api/account")) return json({ data: { name: "Asha", email: "buyer@example.com", addresses: [] } });
    if (url.endsWith("/api/checkout/orders")) {
      ordersCreated += 1;
      return json(ORDER, 201);
    }
    if (url.endsWith("/api/payments/razorpay/verify")) {
      return verifyStatus === 0 ? Promise.reject(new TypeError("Failed to fetch")) : json({ message: "x" }, verifyStatus);
    }
    return json({}, 404);
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as { Razorpay?: unknown }).Razorpay;
});

async function fillAndSubmit() {
  const form = await screen.findByRole("button", { name: "Place secure order" });
  const set = (name: string, value: string) => {
    const field = document.querySelector<HTMLInputElement>(`[name="${name}"]`);
    if (field) fireEvent.change(field, { target: { value } });
  };
  set("first_name", "Asha");
  set("phone", "9876543210");
  set("address", "12 Market Road");
  set("city", "Surat");
  set("state", "Gujarat");
  set("postcode", "395003");
  await waitFor(() => expect(document.querySelector<HTMLInputElement>('input[value="razorpay"]')?.checked).toBe(true));
  fireEvent.submit(form.closest("form")!);
}

describe("checkout payment", () => {
  it("once Razorpay takes the money, the shopper goes to the order even if confirming it fails", async () => {
    verifyStatus = 500;
    render(<CheckoutView />);
    await fillAndSubmit();
    await waitFor(() => expect(opened).toHaveLength(1));

    await act(async () => {
      opened[0].handler({ razorpay_order_id: "order_rzp_1", razorpay_payment_id: "pay_1", razorpay_signature: "sig" });
    });

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/orders/order-uuid-1?placed=1"));
    expect(clearCart).toHaveBeenCalled();
    // The pay button never comes back, so the same bag cannot be paid for twice.
    expect(screen.queryByRole("button", { name: "Place secure order" })).toBeNull();
  });

  it("the same happens when the network drops during confirmation", async () => {
    verifyStatus = 0;
    render(<CheckoutView />);
    await fillAndSubmit();
    await waitFor(() => expect(opened).toHaveLength(1));

    await act(async () => {
      opened[0].handler({ razorpay_order_id: "order_rzp_1", razorpay_payment_id: "pay_1", razorpay_signature: "sig" });
    });

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/orders/order-uuid-1?placed=1"));
  });

  it("closing the payment window and paying again reuses the same order", async () => {
    render(<CheckoutView />);
    await fillAndSubmit();
    await waitFor(() => expect(opened).toHaveLength(1));

    act(() => opened[0].modal.ondismiss());
    await fillAndSubmit();
    await waitFor(() => expect(opened).toHaveLength(2));

    expect(ordersCreated).toBe(1);
    expect(opened[1].order_id).toBe("order_rzp_1");
  });
});
