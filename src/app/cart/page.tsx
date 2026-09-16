import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = { title: "Shopping Bag" };

export default function CartPage() {
  return (
    <div className="pageShell cartPage">
      <div className="container pageIntro compactIntro">
        <span className="eyebrow">Your selection</span>
        <h1>Shopping bag</h1>
      </div>
      <div className="container"><CartView /></div>
    </div>
  );
}
