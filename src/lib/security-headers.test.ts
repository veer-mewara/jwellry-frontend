import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { securityHeaders } from "./security-headers";

function header(name: string) {
  return securityHeaders().find((item) => item.key.toLowerCase() === name.toLowerCase())?.value;
}

describe("security headers", () => {
  it("keeps browsers on HTTPS for a year", () => {
    expect(header("Strict-Transport-Security")).toBe("max-age=31536000; includeSubDomains");
  });

  it("stops other sites framing the shop, plugins, base-tag and form hijacks", () => {
    const csp = header("Content-Security-Policy") ?? "";
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  it("keeps the older protections", () => {
    expect(header("X-Content-Type-Options")).toBe("nosniff");
    expect(header("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(header("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    // Google / Facebook sign-in open a popup that must be able to report back.
    expect(header("Cross-Origin-Opener-Policy")).toBe("same-origin-allow-popups");
  });

  it("is what every page is served with", async () => {
    const rules = await nextConfig.headers!();
    const everyPage = rules.find((rule) => rule.source === "/(.*)");
    expect(everyPage?.headers).toEqual(securityHeaders());
  });
});
