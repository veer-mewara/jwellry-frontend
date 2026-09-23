import { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicy() {
  return (
    <article className="container policyPage" style={{ padding: "80px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <span className="eyebrow" style={{ color: "#d4af37", textTransform: "uppercase", fontWeight: "bold" }}>Legal</span>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "2rem" }}>Privacy Policy</h1>
      
      <p className="policyLead" style={{ fontSize: "1.2rem", marginBottom: "2rem", color: "#555" }}>
        At our jewelry store, your privacy is of utmost importance to us. This Privacy Policy outlines how we collect, use, and protect your information when you visit our website and make a purchase.
      </p>

      <h2 style={{ fontSize: "1.8rem", marginTop: "2rem", marginBottom: "1rem" }}>1. Information We Collect</h2>
      <p>We may collect personal information that you provide to us, such as your name, email address, phone number, shipping and billing address, and payment details when you create an account, place an order, or subscribe to our newsletter.</p>

      <h2 style={{ fontSize: "1.8rem", marginTop: "2rem", marginBottom: "1rem" }}>2. How We Use Your Information</h2>
      <p>Your information is used to process transactions, deliver products, provide customer support, and send promotional offers (if you have opted in). We also use data to improve our website experience.</p>

      <h2 style={{ fontSize: "1.8rem", marginTop: "2rem", marginBottom: "1rem" }}>3. Data Protection</h2>
      <p>We implement security measures to maintain the safety of your personal information. Your sensitive data (such as credit card information) is encrypted and transmitted securely via our payment gateways.</p>

      <h2 style={{ fontSize: "1.8rem", marginTop: "2rem", marginBottom: "1rem" }}>4. Third-Party Services</h2>
      <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.</p>

      <h2 style={{ fontSize: "1.8rem", marginTop: "2rem", marginBottom: "1rem" }}>5. Contact Us</h2>
      <p>If you have any questions regarding this Privacy Policy, please contact us through our Contact Form.</p>
    </article>
  );
}
