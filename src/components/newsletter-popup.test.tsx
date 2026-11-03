import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { NewsletterPopup } from "./newsletter-popup";
import { resetNewsletterVisit } from "@/lib/newsletter";

const popup = {
  enabled: true,
  heading: "Join the Insider List",
  text: "News and offers.",
  button: "Subscribe",
  finePrint: "Unsubscribe any time.",
  delaySeconds: 2,
  hasCoupon: false,
};

beforeEach(() => {
  vi.useFakeTimers();
  pathname = "/";
  resetNewsletterVisit();
});

afterEach(() => {
  vi.useRealTimers();
});

function wait(seconds: number) {
  act(() => {
    vi.advanceTimersByTime(seconds * 1000);
  });
}

describe("newsletter popup", () => {
  it("opens after the delay and stays closed once closed", () => {
    render(<NewsletterPopup popup={popup} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    wait(2);
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    wait(30);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays closed even when the browser blocks storage (private mode)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    render(<NewsletterPopup popup={{ ...popup, delaySeconds: 0 }} />);
    wait(1);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    wait(30);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("never opens on the cart, checkout or account pages", () => {
    for (const path of ["/cart", "/checkout", "/account", "/orders/abc"]) {
      pathname = path;
      const { unmount } = render(<NewsletterPopup popup={popup} />);
      wait(10);
      expect(screen.queryByRole("dialog")).toBeNull();
      unmount();
    }
  });

  it("does not open again after the visitor subscribed", () => {
    window.localStorage.setItem("sonaro_newsletter_v1", JSON.stringify({ state: "subscribed", at: Date.now() - 30 * 86400000 }));
    render(<NewsletterPopup popup={popup} />);
    wait(10);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
