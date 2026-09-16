import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return <article className="container policyPage"><span className="eyebrow">Legal</span><h1>Privacy policy</h1><p className="policyLead">This is a launch placeholder. Client-approved legal text and effective dates must replace it before production.</p><h2>Information collected</h2><p>Account, address, order, payment-reference and enquiry information required to operate the store.</p><h2>Service providers</h2><p>Relevant information may be processed by payment, shipping, email, analytics and hosting providers used by the store.</p><h2>Your choices</h2><p>Customers can request access, correction or deletion subject to legal and transaction-record requirements.</p></article>;
}
