export const ACCOUNT_TOKEN_KEY = "sonaro_customer_token_v1";

/** Checkout needs an account; this sends the shopper to sign in and brings them back. */
export const CHECKOUT_SIGN_IN_PATH = "/account?next=%2Fcheckout";

/** A same-site path from ?next=, or null. Blocks "//evil.com" and "/\evil.com" style open redirects. */
export function safeNextPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}
