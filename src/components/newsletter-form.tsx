"use client";

import { FormEvent, useState } from "react";
import { subscribeToNewsletter } from "@/lib/newsletter";

/** The home page "Get the Journal" sign-up box. */
export function NewsletterForm() {
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    try {
      const result = await subscribeToNewsletter(contact, "footer");
      setMessage(result.couponCode ? `${result.message} Your code for the first order: ${result.couponCode}` : result.message);
      setFailed(false);
      setContact("");
    } catch (problem) {
      setMessage(problem instanceof Error ? problem.message : "Please try again.");
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <form className="cs_newsletter_form" onSubmit={submit}>
        <input
          type="text"
          name="contact"
          inputMode="email"
          placeholder="Email or mobile number"
          aria-label="Your email or mobile number"
          autoComplete="email"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={190}
          required
          value={contact}
          onChange={(event) => setContact(event.target.value)}
        />
        <button type="submit" className="cs_btn_style_1 cs_primary_bg cs_white_color" disabled={sending}>
          {sending ? "Please wait…" : "Subscribe"}
        </button>
      </form>
      {message ? (
        <p className={failed ? "cs_newsletter_note newsletterNoteError mb-0" : "cs_newsletter_note mb-0"} role={failed ? "alert" : "status"}>{message}</p>
      ) : (
        <p className="cs_newsletter_note mb-0">No spam, only stories that shine.</p>
      )}
    </>
  );
}
