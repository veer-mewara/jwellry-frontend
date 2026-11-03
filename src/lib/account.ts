export const ACCOUNT_TOKEN_KEY = "sonaro_customer_token_v1";

/** Checkout needs an account; this sends the shopper to sign in and brings them back. */
export const CHECKOUT_SIGN_IN_PATH = "/account?next=%2Fcheckout";

// Browsers drop tabs/newlines and treat "\" as "/", which can turn "/\t/evil.com" into "//evil.com".
const UNSAFE_URL_CHARACTERS = /[\u0000-\u001f\u007f\\]/;

/** A same-site path from ?next=, or null: never a way to send the shopper to another site after sign-in. */
export function safeNextPath(value: string | null): string | null {
  if (!value || !value.startsWith("/")) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (UNSAFE_URL_CHARACTERS.test(value) || UNSAFE_URL_CHARACTERS.test(decoded)) return null;
  if (value.startsWith("//") || decoded.startsWith("//")) return null;

  const base = "https://shop.invalid";
  return new URL(value, base).origin === base ? value : null;
}

export function getCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCOUNT_TOKEN_KEY);
}

export function isCustomerLoggedIn(): boolean {
  return Boolean(getCustomerToken());
}

