"use client";

import { useState, FormEvent } from "react";

export function ContactForm() {
  const [status, setStatus] = useState({ loading: false, message: "" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiBase) {
      setStatus({ loading: false, message: "Submission is disabled currently." });
      return;
    }

    setStatus({ loading: true, message: "" });
    try {
      const response = await fetch(`${apiBase}/api/contact`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to send message");
      
      setStatus({ loading: false, message: result.message });
      form.reset();
    } catch (error) {
      setStatus({ loading: false, message: error instanceof Error ? error.message : "Failed to send message" });
    }
  }

  return (
            <div className="contact-form-wrapper">
              <h3>Send a Message</h3>
              <p>Fill out the form below and we&apos;ll get back to you as soon as possible.</p>
              
              <form onSubmit={handleSubmit}>
                <div className="form-grid-contact">
                  <div className="form-group-contact">
                    <label>First Name</label>
                    <input required name="first_name" className="form-input-contact" placeholder="Jane" autoComplete="given-name" />
                  </div>
                  <div className="form-group-contact">
                    <label>Last Name</label>
                    <input required name="last_name" className="form-input-contact" placeholder="Doe" autoComplete="family-name" />
                  </div>
                  <div className="form-group-contact full">
                    <label>Email Address</label>
                    <input required type="email" name="email" className="form-input-contact" placeholder="jane@example.com" autoComplete="email" />
                  </div>
                  <div className="form-group-contact full">
                    <label>Message</label>
                    <textarea required name="message" className="form-input-contact" placeholder="How can we help you today?" />
                  </div>
                </div>
                <button type="submit" className="submit-btn-contact" disabled={status.loading}>
                  {status.loading ? "Sending..." : <>Send Message <i className="ri-arrow-right-line"></i></>}
                </button>
                {status.message && <p className="integrationNotice mt-4" style={{ marginTop: "1rem" }} role="status">{status.message}</p>}
              </form>
            </div>
  );
}
