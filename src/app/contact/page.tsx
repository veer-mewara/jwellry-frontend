"use client";

import { useState, FormEvent } from "react";
import { siteConfig } from "@/lib/site";
import Image from "next/image";



export default function ContactPage() {
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
    <>

      <div className="contact-page-wrapper">
        <section className="hero-section">
          <Image src="/assets/img/hero-bg-2.jpg" alt="Contact us" fill priority sizes="100vw" className="hero-img" />
          <div className="hero-content">
            <h1>Contact Us</h1>
            <p>We're here to help you with any questions about our jewellery, your orders, or our services.</p>
          </div>
        </section>

        <section className="contact-container">
          <div className="contact-grid">
            <div className="contact-info">
              <div>
                <h2>Let's talk.</h2>
                <p>Whether you have a question about our pieces, need help with an order, or just want to say hello, our team is always ready to assist.</p>
                
                <div className="info-item">
                  <i className="ri-map-pin-line"></i>
                  <div>
                    <h4>Visit Us</h4>
                    <p>Shop no 1, opp Aishwarya college,<br/>Naya Goan Road Pali 306401</p>
                  </div>
                </div>
                
                <div className="info-item">
                  <i className="ri-phone-line"></i>
                  <div>
                    <h4>Call Us</h4>
                    <a href={`tel:${siteConfig.supportPhone.replace(/\s/g, "")}`}>{siteConfig.supportPhone}</a>
                  </div>
                </div>
                
                <div className="info-item">
                  <i className="ri-mail-send-line"></i>
                  <div>
                    <h4>Email Us</h4>
                    <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
                  </div>
                </div>
                
                <div className="info-item">
                  <i className="ri-time-line"></i>
                  <div>
                    <h4>Hours</h4>
                    <p>Monday–Saturday<br/>10:00 AM – 7:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="contact-form-wrapper">
              <h3>Send a Message</h3>
              <p>Fill out the form below and we'll get back to you as soon as possible.</p>
              
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
          </div>
        </section>
      </div>
    </>
  );
}
