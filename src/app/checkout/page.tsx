import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout-view";

export const metadata: Metadata = { title: "Secure Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return <div className="pageShell"><div className="container pageIntro compactIntro"><span className="eyebrow">Secure checkout</span><h1>Complete your order</h1></div><div className="container"><CheckoutView /></div></div>;
}
