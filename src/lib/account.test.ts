import { describe, expect, it } from "vitest";
import { safeNextPath } from "./account";

describe("safeNextPath", () => {
  it.each([
    ["/checkout", "/checkout"],
    ["/orders/abc?email=a%40b.com", "/orders/abc?email=a%40b.com"],
    ["/shop?category=rings#top", "/shop?category=rings#top"],
  ])("keeps same-site path %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });

  it.each([
    null,
    "",
    "checkout",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    // Browsers drop tabs and newlines from URLs, so these become //evil.com.
    "/\t/evil.com",
    "/\n/evil.com",
    "/\r/evil.com",
    "/%09/evil.com",
    "/%5Cevil.com",
    "/%2F%2Fevil.com",
    "javascript:alert(1)",
    "/\u0000/evil.com",
  ])("refuses %j", (input) => {
    expect(safeNextPath(input)).toBeNull();
  });
});
