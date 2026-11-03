import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

import { ProductReviews } from "./product-reviews";

const reviews = {
  data: [],
  meta: { current_page: 1, last_page: 1 },
  summary: { average: null, count: 0, breakdown: {} },
  viewer: { signed_in: true, can_review: true, review: null },
};

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.test";
  window.localStorage.setItem("sonaro_customer_token_v1", "expired-token");
  vi.stubGlobal("fetch", vi.fn((url: string, init?: RequestInit) => {
    if (url.includes("/reviews?page=")) return json(reviews);
    if (url.endsWith("/api/account/reviews") && init?.method === "POST") return json({ message: "Unauthenticated." }, 401);
    return json({}, 404);
  }));
});

afterEach(() => vi.unstubAllGlobals());

describe("posting a review with an expired sign-in", () => {
  it("asks the customer to sign in again and forgets the dead token", async () => {
    render(<ProductReviews productId={7} slug="ring" />);
    fireEvent.click(await screen.findByRole("button", { name: "Write a review" }));
    fireEvent.click(screen.getByRole("button", { name: "5 stars" }));
    fireEvent.change(document.querySelector('textarea[name="body"]')!, { target: { value: "Lovely finish and shine." } });
    fireEvent.submit(document.querySelector('textarea[name="body"]')!.closest("form")!);

    await waitFor(() => expect(screen.getByText("Your sign-in has expired. Please sign in again to post your review.")).toBeTruthy());
    expect(window.localStorage.getItem("sonaro_customer_token_v1")).toBeNull();
    expect(screen.queryByText("Unauthenticated.")).toBeNull();
  });
});
