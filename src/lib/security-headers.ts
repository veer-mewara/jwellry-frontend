/**
 * Response headers on every storefront page. The CSP only holds rules that cannot break Razorpay,
 * Firebase sign-in or analytics; a script allow-list needs per-request nonces first.
 */
export function securityHeaders(): Array<{ key: string; value: string }> {
  return [
    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
    {
      key: "Content-Security-Policy",
      value: ["frame-ancestors 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"].join("; "),
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ];
}
