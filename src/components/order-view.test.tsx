import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }), usePathname: () => "/orders/abc" }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
vi.mock("@/components/site-settings-provider", () => ({ useSiteSettings: () => ({ name: "Sonaro" }) }));

import { OrderView } from "./order-view";
import { getSavedOrderEmail } from "@/lib/orders";

const order = {
  uuid: "abc",
  order_number: "JWL-1",
  status: "confirmed",
  payment_status: "paid",
  email: "asha+gold@example.com",
  grand_total: 1000,
  created_at: "2026-11-03T10:00:00Z",
  items: [],
  timeline: [],
};

const fetchMock = vi.fn((url: string, init?: RequestInit) => {
  void url;
  void init;
  return Promise.resolve(new Response(JSON.stringify({ data: order }), { status: 200 }));
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.test";
  vi.stubGlobal("fetch", fetchMock);
  window.history.replaceState(null, "", "/orders/abc");
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockClear();
  replace.mockClear();
  window.localStorage.clear();
});

function lookup() {
  const [url, init] = fetchMock.mock.calls[0];
  return { url, email: new Headers(init?.headers).get("X-Order-Email") };
}

describe("order page email", () => {
  it("reads the email after # in an emailed link and sends it in a header, not the URL", async () => {
    window.history.replaceState(null, "", "/orders/abc#email=asha%2Bgold%40example.com");

    render(<OrderView uuid="abc" queryEmail="" placed={false} />);

    await screen.findByText(/JWL-1/);
    expect(lookup()).toEqual({ url: "https://api.test/api/orders/abc", email: "asha+gold@example.com" });
    // Remembered for next time, and wiped from the address bar.
    expect(getSavedOrderEmail("abc")).toBe("asha+gold@example.com");
    expect(replace).toHaveBeenCalledWith("/orders/abc", { scroll: false });
  });

  it("still opens older links with ?email= but never puts it in the API URL", async () => {
    render(<OrderView uuid="abc" queryEmail="asha+gold@example.com" placed={false} />);

    await screen.findByText(/JWL-1/);
    expect(lookup()).toEqual({ url: "https://api.test/api/orders/abc", email: "asha+gold@example.com" });
  });

  it("asks for the email when the link has none", async () => {
    render(<OrderView uuid="abc" queryEmail="" placed={false} />);

    await waitFor(() => expect(document.querySelector('input[name="email"]')).toBeTruthy());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ignores a junk # value instead of crashing", async () => {
    window.history.replaceState(null, "", "/orders/abc#email=%E0%A4%A");

    render(<OrderView uuid="abc" queryEmail="" placed={false} />);

    await waitFor(() => expect(document.querySelector('input[name="email"]')).toBeTruthy());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
