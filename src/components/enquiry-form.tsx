"use client";

import { FormEvent, useState } from "react";

export function EnquiryForm() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiBase) {
      setMessage("Submission will be enabled when the Laravel API URL is configured.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`${apiBase}/api/custom-enquiries`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      const result = (await response.json()) as {
        message?: string;
        reference_number?: string;
      };
      if (!response.ok) throw new Error(result.message || "Unable to submit enquiry.");
      setMessage(`${result.message} Reference: ${result.reference_number}`);
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit enquiry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="enquiryForm" onSubmit={submit}>
      <div className="formGrid">
        <label>Full name<input required name="name" autoComplete="name" /></label>
        <label>Mobile number<input required type="tel" name="phone" autoComplete="tel" /></label>
        <label className="fullField">Email address<input required type="email" name="email" autoComplete="email" /></label>
        <label>Jewellery type
          <select required name="jewellery_type" defaultValue="">
            <option value="" disabled>Select a type</option>
            <option>Ring</option><option>Earrings</option><option>Necklace</option><option>Bracelet</option><option>Other</option>
          </select>
        </label>
        <label>Preferred metal
          <select required name="preferred_metal" defaultValue="">
            <option value="" disabled>Select a metal</option>
            <option>Gold</option><option>Silver</option><option>Platinum</option><option>Need guidance</option>
          </select>
        </label>
        <label>Approximate budget<input name="budget" type="number" min="0" step="100" placeholder="e.g. 75000" /></label>
        <label>Needed by<input name="needed_by" type="date" /></label>
        <label className="fullField">Tell us about your idea<textarea required name="message" rows={6} placeholder="Share the occasion, style, gemstones, size or reference details." /></label>
        <label className="fullField fileField">Reference image<input name="reference" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" /><small>JPG, PNG, WebP or PDF. Maximum size will be validated by the API.</small></label>
      </div>
      <label className="consentField"><input required type="checkbox" />I agree to be contacted about this jewellery enquiry.</label>
      <button className="button buttonDark" type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send custom enquiry"}</button>
      {message && <p className="integrationNotice" role="status">{message}</p>}
    </form>
  );
}
