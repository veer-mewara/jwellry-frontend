import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shipping & Returns" };

export default function ShippingReturnsPage() {
  return <article className="container policyPage"><span className="eyebrow">Customer care</span><h1>Shipping & returns</h1><p className="policyLead">Final shipping, cancellation and return terms must be supplied and approved by the client before launch.</p><h2>Insured shipping</h2><p>Orders will be dispatched through the configured Shiprocket account after payment and inventory verification. Tracking details will be shared by email.</p><h2>Delivery checks</h2><p>Serviceability, estimated delivery dates, COD eligibility and shipping charges will be calculated using Shiprocket APIs.</p><h2>Returns and exchanges</h2><p>Return windows, exclusions for customised pieces, quality checks and refund timelines will be inserted from the client-approved policy.</p></article>;
}
