import { endpoint, jsonHeaders, requestJson, responseMessage } from "@/lib/account-api";

/** Remembers that this browser signed up (or closed the popup) so the popup is not shown again. */
export const NEWSLETTER_STORAGE_KEY = "sonaro_newsletter_v1";

export type NewsletterSource = "popup" | "footer";

export interface NewsletterResult {
  message: string;
  couponCode: string;
}

/** Also kept in memory for this visit, for browsers that block storage (private mode). */
let seenThisVisit = false;

export function newsletterSeenThisVisit() {
  return seenThisVisit;
}

/** Tests only: start a fresh visit. */
export function resetNewsletterVisit() {
  seenThisVisit = false;
}

export function rememberNewsletter(state: "subscribed" | "dismissed") {
  seenThisVisit = true;
  try {
    window.localStorage.setItem(NEWSLETTER_STORAGE_KEY, JSON.stringify({ state, at: Date.now() }));
  } catch {
    // Private mode or blocked storage: the popup may simply show again.
  }
}

/** Signs up an email address or Indian mobile number; throws an Error with a message fit to show the shopper. */
export async function subscribeToNewsletter(contact: string, source: NewsletterSource): Promise<NewsletterResult> {
  const url = endpoint("/newsletter");
  if (!url) throw new Error("Sign-up is not available right now. Please try again later.");
  const { response, payload } = await requestJson<{ message?: string; coupon_code?: string }>(url, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ contact: contact.trim(), source }),
  });
  if (!response.ok) throw new Error(responseMessage(response, payload));
  rememberNewsletter("subscribed");
  return { message: payload.message || "Thank you for subscribing.", couponCode: payload.coupon_code || "" };
}
