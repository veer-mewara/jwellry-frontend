import { afterEach, describe, expect, it } from "vitest";
import { RAZORPAY_SCRIPT, loadRazorpay, resetRazorpayLoader } from "./razorpay";

function scripts() {
  return document.querySelectorAll(`script[src="${RAZORPAY_SCRIPT}"]`);
}

afterEach(() => {
  resetRazorpayLoader();
  document.body.innerHTML = "";
  delete (window as { Razorpay?: unknown }).Razorpay;
});

describe("loadRazorpay", () => {
  it("is ready at once when the script is already there", async () => {
    (window as { Razorpay?: unknown }).Razorpay = function Razorpay() {};
    await expect(loadRazorpay()).resolves.toBe(true);
    expect(scripts()).toHaveLength(0);
  });

  it("adds the script once, even when asked twice at the same time", async () => {
    const first = loadRazorpay();
    const second = loadRazorpay();
    expect(scripts()).toHaveLength(1);

    (window as { Razorpay?: unknown }).Razorpay = function Razorpay() {};
    scripts()[0].dispatchEvent(new Event("load"));

    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(true);
  });

  it("can try again after the script failed to load (it never hangs)", async () => {
    const failed = loadRazorpay();
    scripts()[0].dispatchEvent(new Event("error"));
    await expect(failed).resolves.toBe(false);
    expect(scripts()).toHaveLength(0);

    const retry = loadRazorpay();
    expect(scripts()).toHaveLength(1);
    (window as { Razorpay?: unknown }).Razorpay = function Razorpay() {};
    scripts()[0].dispatchEvent(new Event("load"));
    await expect(retry).resolves.toBe(true);
  });
});
