import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Get in touch with ${siteConfig.name} customer service and support.`,
};

export default function ContactPage() {
  return (
    <div className="customPage">
      <section className="customHero">
        <Image src="/assets/img/hero-bg-2.jpg" alt="Contact us" fill priority sizes="100vw" />
        <div className="customHeroCopy">
          <span className="eyebrow">Get in touch</span>
          <h1>Contact Us</h1>
          <p>We're here to help you with any questions about our jewellery, your orders, or our services.</p>
        </div>
      </section>
      <section className="container enquirySection">
        <div className="enquiryIntro">
          <span className="eyebrow">We're here for you</span>
          <h2>Let's talk.</h2>
          <p>Whether you have a question about our pieces, need help with an order, or just want to say hello, our team is always ready to assist.</p>
          <div className="enquiryPromise">
            <b>Our Contact Details</b>
            <span>
              <strong>Visit Us:</strong><br />
              Shop no1 , opp Aishwarya college,<br />
              Naya Goan Road Pali 306401
            </span>
            <span>
              <strong>Call Us:</strong><br />
              <a href={`tel:${siteConfig.supportPhone.replace(/\s/g, "")}`}>{siteConfig.supportPhone}</a>
            </span>
            <span>
              <strong>Email Us:</strong><br />
              <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
            </span>
            <span>
              <strong>Hours:</strong><br />
              Monday–Saturday, 10:00 AM–7:00 PM
            </span>
          </div>
        </div>
        <form className="enquiryForm" action={`mailto:${siteConfig.supportEmail}`} method="POST" encType="text/plain">
          <div className="formGrid">
            <label className="fullField">Full name<input required name="name" autoComplete="name" /></label>
            <label className="fullField">Email address<input required type="email" name="email" autoComplete="email" /></label>
            <label className="fullField">Message<textarea required name="message" rows={6} placeholder="How can we help you today?" /></label>
          </div>
          <button className="button buttonDark" type="submit">Send Message</button>
        </form>
      </section>
    </div>
  );
}
