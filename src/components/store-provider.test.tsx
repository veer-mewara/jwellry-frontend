import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StoreProvider, useStore } from "./store-provider";

function Probe() {
  const { cartCount, couponCode, wishlist, forgetLocalData } = useStore();
  return (
    <div>
      <span data-testid="count">{cartCount}</span>
      <span data-testid="coupon">{couponCode}</span>
      <span data-testid="wishlist">{wishlist.length}</span>
      <button onClick={forgetLocalData}>forget</button>
    </div>
  );
}

const fetchMock = vi.fn(() => Promise.resolve(new Response("{}", { status: 200 })));

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockClear();
  window.localStorage.setItem("sonaro_cart_v1", JSON.stringify([{ productId: 7, slug: "ring", name: "Ring", price: 25000, quantity: 2, image: "/r.jpg", metal: "gold", purity: "22K" }]));
  window.localStorage.setItem("sonaro_coupon_v1", "WELCOME5");
  window.localStorage.setItem("sonaro_wishlist_v1", JSON.stringify([7]));
  window.localStorage.setItem("sonaro_order_emails_v1", JSON.stringify({ "order-1": "previous@example.com" }));
});

afterEach(() => vi.unstubAllGlobals());

describe("signing out on a shared device", () => {
  it("forgets the previous shopper's bag, coupon, wishlist and order emails on this device only", async () => {
    render(<StoreProvider><Probe /></StoreProvider>);
    await waitFor(() => expect(screen.getByTestId("count").textContent).toBe("2"));
    expect(screen.getByTestId("coupon").textContent).toBe("WELCOME5");

    act(() => screen.getByText("forget").click());

    await waitFor(() => expect(screen.getByTestId("count").textContent).toBe("0"));
    expect(screen.getByTestId("coupon").textContent).toBe("");
    expect(screen.getByTestId("wishlist").textContent).toBe("0");
    expect(JSON.parse(window.localStorage.getItem("sonaro_cart_v1") || "[]")).toEqual([]);
    expect(window.localStorage.getItem("sonaro_coupon_v1") || "").toBe("");
    expect(window.localStorage.getItem("sonaro_order_emails_v1")).toBeNull();
    // The bag saved on the account itself is kept for the next time that customer signs in.
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("/api/cart"), expect.objectContaining({ method: "DELETE" }));
  });
});
