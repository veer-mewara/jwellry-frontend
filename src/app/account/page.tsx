import type { Metadata } from "next";
import { AccountView } from "@/components/account-view";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };

export default function AccountPage() {
  return (
    <div className="pageShell accountPage">
      <div className="container pageIntro compactIntro"><span className="eyebrow">Customer account</span><h1>Welcome back</h1><p>Sign in to see saved addresses, order history and live order status.</p></div>
      <div className="container"><AccountView /></div>
    </div>
  );
}
