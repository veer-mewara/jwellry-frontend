"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { PopupSettings } from "@/lib/public-settings";
import { NEWSLETTER_STORAGE_KEY, newsletterSeenThisVisit, rememberNewsletter, subscribeToNewsletter } from "@/lib/newsletter";

/** Closed popups come back after this long; once subscribed it never shows again. */
const SHOW_AGAIN_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/** Pages where a popup would get in the way of buying or signing in. */
const QUIET_PATHS = ["/cart", "/checkout", "/account", "/orders"];

function seenRecently() {
  if (newsletterSeenThisVisit()) return true;
  try {
    const saved = JSON.parse(window.localStorage.getItem(NEWSLETTER_STORAGE_KEY) || "null") as { state?: string; at?: number } | null;
    if (!saved) return false;
    return saved.state === "subscribed" || Date.now() - (saved.at ?? 0) < SHOW_AGAIN_AFTER_MS;
  } catch {
    return false;
  }
}

/** The sign-up popup set up in Admin → Settings → Newsletter popup. */
export function NewsletterPopup({ popup }: { popup: PopupSettings }) {
  const pathname = usePathname();
  const contactRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ message: string; couponCode: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const quietPage = QUIET_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    if (open || quietPage || seenRecently()) return;
    const timer = window.setTimeout(() => {
      if (!seenRecently()) setOpen(true);
    }, popup.delaySeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [open, quietPage, popup.delaySeconds]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    contactRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
    // close() only reads state through setters, so it is safe to leave out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    if (!done) rememberNewsletter("dismissed");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      setDone(await subscribeToNewsletter(contact, "popup"));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function copyCode() {
    if (!done?.couponCode) return;
    try {
      await navigator.clipboard.writeText(done.couponCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!open) return null;

  return (
    <div className="newsletterPopup" onClick={(event) => event.target === event.currentTarget && close()}>
      <div className="newsletterCard" role="dialog" aria-modal="true" aria-labelledby="newsletter-title">
        <button className="newsletterClose" type="button" onClick={close} aria-label="Close">
          <i className="ri-close-line" aria-hidden="true" />
        </button>

        {done ? (
          <div className="newsletterDone" role="status">
            <h2 id="newsletter-title">Thank you!</h2>
            {done.couponCode ? (
              <>
                <p>You are on the list. Use this code on your first order:</p>
                <div className="newsletterCode">
                  <strong>{done.couponCode}</strong>
                  <button type="button" onClick={copyCode}>{copied ? "Copied" : "Copy"}</button>
                </div>
              </>
            ) : (
              <p>You are on the list. Look out for new collections and offers from us.</p>
            )}
            <button className="newsletterSubmit" type="button" onClick={close}>Continue shopping</button>
          </div>
        ) : (
          <>
            <h2 id="newsletter-title">{popup.heading}</h2>
            <p className="newsletterText">{popup.text}</p>
            <form onSubmit={submit} noValidate>
              <label htmlFor="newsletter-contact">Email or Mobile Number</label>
              <input
                ref={contactRef}
                id="newsletter-contact"
                type="text"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={190}
                required
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="you@example.com or 98765 43210"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "newsletter-error" : undefined}
              />
              {error && <p className="newsletterError" id="newsletter-error" role="alert">{error}</p>}
              <button className="newsletterSubmit" type="submit" disabled={sending}>
                {sending ? "Please wait…" : popup.button}
              </button>
            </form>
            <p className="newsletterFine">{popup.finePrint}</p>
          </>
        )}
      </div>
    </div>
  );
}
