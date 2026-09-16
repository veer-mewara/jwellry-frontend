import type { Metadata } from "next";
import Image from "next/image";
import { EnquiryForm } from "@/components/enquiry-form";

export const metadata: Metadata = {
  title: "Custom Jewellery",
  description: "Start a custom jewellery consultation with our design concierge.",
};

export default function CustomJewelleryPage() {
  return (
    <div className="customPage">
      <section className="customHero">
        <Image src="/assets/img/about-12.jpg" alt="Custom jewellery design consultation" fill priority sizes="100vw" />
        <div className="customHeroCopy"><span className="eyebrow">Bespoke by you</span><h1>Let’s create a piece only you could imagine.</h1><p>From a first sketch to the final polish, our process is personal, considered and transparent.</p></div>
      </section>
      <section className="container customProcess">
        <div><span>01</span><h2>Share your idea</h2><p>Tell us the occasion, design direction, metal and preferred budget.</p></div>
        <div><span>02</span><h2>Review the concept</h2><p>We confirm feasibility, estimated pricing and the production timeline.</p></div>
        <div><span>03</span><h2>Approve & craft</h2><p>Production begins after design and payment approval, with progress updates.</p></div>
      </section>
      <section className="container enquirySection">
        <div className="enquiryIntro"><span className="eyebrow">Start here</span><h2>Tell us what you have in mind.</h2><p>A jewellery concierge will review the request and contact you within one business day after integration is live.</p><div className="enquiryPromise"><b>What happens next</b><span>Consultation and initial estimate</span><span>Design approval before production</span><span>Insured delivery on completion</span></div></div>
        <EnquiryForm />
      </section>
    </div>
  );
}
