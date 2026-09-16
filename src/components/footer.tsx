import Link from "next/link";
import { getCatalog } from "@/lib/catalog-api";
import { siteConfig } from "@/lib/site";

export async function Footer() {
  const catalog = await getCatalog();
  const categories = Array.from(
    new Map(
      catalog
        .filter((product) => product.category)
        .map((product) => [
          product.category,
          { slug: product.category, name: product.categoryName || product.category },
        ]),
    ).values(),
  );

  return (
    <footer className="siteFooter">
      <div className="container footerGrid">
        <div>
          <div className="footerBrand">{siteConfig.name}</div>
          <p>
            Jewellery made with transparent pricing, thoughtful design and
            quality you can trust.
          </p>
        </div>
        {categories.length > 0 && <div>
          <h2>Shop</h2>
          {categories.slice(0, 6).map((category) => (
            <Link href={`/shop?category=${category.slug}`} key={category.slug}>{category.name}</Link>
          ))}
        </div>}
        <div>
          <h2>Help</h2>
          <Link href="/account">Orders & account</Link>
          <Link href="/custom-jewellery">Custom enquiry</Link>
          <Link href="/shipping-returns">Shipping & returns</Link>
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/journal">Jewellery journal</Link>
        </div>
        <div>
          <h2>Concierge</h2>
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
          <a href={`tel:${siteConfig.supportPhone.replace(/\s/g, "")}`}>
            {siteConfig.supportPhone}
          </a>
          <p>Monday–Saturday, 10:00 AM–7:00 PM</p>
        </div>
      </div>
      <div className="container footerBottom">
        <span>© {new Date().getFullYear()} {siteConfig.name}</span>
        <span>Secure checkout · Cash on delivery available</span>
      </div>
    </footer>
  );
}
