import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist-view";
import { getCatalog } from "@/lib/catalog-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const products = await getCatalog();
  return (
    <div className="pageShell savedPage">
      <div className="container pageIntro compactIntro">
        <span className="eyebrow">Saved for later</span><h1>Your wishlist</h1>
      </div>
      <div className="container"><WishlistView products={products} /></div>
    </div>
  );
}
