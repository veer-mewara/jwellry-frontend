import type { Metadata } from "next";
import Image from "next/image";
import { ContactForm } from "@/components/contact-form";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the team for questions about our jewellery, your order or a custom piece. Visit us in Pali or send a message.",
};



export default function ContactPage() {
  return (
    <>

      <div className="contact-page-wrapper">
        <section className="hero-section">
          <Image src="/assets/img/hero-bg-2.jpg" alt="Contact us" fill priority sizes="100vw" className="hero-img" />
          <div className="hero-content">
            <h1>Contact Us</h1>
            <p>We&apos;re here to help you with any questions about our jewellery, your orders, or our services.</p>
          </div>
        </section>

        <section className="contact-container">
          <div className="contact-grid">
            <div className="contact-info">
              <div>
                <h2>Let&apos;s talk.</h2>
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
            
            <ContactForm />
          </div>
        </section>
      </div>
    </>
  );
}
