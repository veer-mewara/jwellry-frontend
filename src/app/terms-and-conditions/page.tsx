import { Metadata } from "next";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsAndConditions() {
  return (
    <article className="container policyPage" style={{ padding: "80px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <span className="eyebrow" style={{ color: "#d4af37", textTransform: "uppercase", fontWeight: "bold" }}>Legal</span>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "2rem" }}>Terms & Conditions</h1>
      
      <p className="policyLead" style={{ fontSize: "1.2rem", marginBottom: "2rem", color: "#555" }}>
        Welcome to our jewelry store. By accessing our website and purchasing our products, you agree to be bound by the following terms and conditions.
      </p>

      <h2 style={{ fontSize: "1.8rem", marginTop: "2rem", marginBottom: "1rem" }}>1. General</h2>
      <p>All products and services available on this website are subject to these Terms & Conditions. We reserve the right to update or modify these terms at any time without prior notice.</p>

      <h2 style={{ fontSize: "1.8rem", marginTop: "2rem", marginBottom: "1rem" }}>2. Product Information & Pricing</h2>
      <p>We make every effort to display our jewelry pieces accurately. However, colors and details may vary slightly due to screen settings. Prices are subject to change without notice. In the event of a pricing error, we reserve the right to cancel any orders placed at the incorrect price.</p>

      <h2 style={{ fontSize: "1.8rem", marginTop: "2rem", marginBottom: "1rem" }}>3. Custom Jewelry</h2>
      <p>Orders for custom-made jewelry require explicit approval of designs and are non-refundable once production begins. Estimated delivery times for custom pieces will be communicated during the consultation.</p>

      <h2 style={{ fontSize: "1.8rem", marginTop: "2rem", marginBottom: "1rem" }}>4. Shipping & Returns</h2>
      <p>Please refer to our Shipping & Returns policy page for detailed information on delivery times, shipping costs, and our return procedure.</p>

      <h2 style={{ fontSize: "1.8rem", marginTop: "2rem", marginBottom: "1rem" }}>5. Intellectual Property</h2>
      <p>All content, designs, and images on this website are the intellectual property of our brand. Unauthorized use or reproduction is strictly prohibited.</p>
    </article>
  );
}
