import Link from "next/link";
import Image from "next/image";
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
          <div className="footerBrand">
            <Image src="/assets/img/sonaro-logo-white.png" alt={siteConfig.name} width={240} height={135} style={{ height: '60px', width: 'auto' }} />
          </div>
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
          <Link href="/privacy-policy">Privacy policy</Link>
          <Link href="/journal">Jewellery journal</Link>
        </div>
        <div>
          <h2>Concierge</h2>
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
          <a href={`tel:${siteConfig.supportPhone.replace(/\s/g, "")}`}>
            {siteConfig.supportPhone}
          </a>
          <p>Monday–Saturday, 10:00 AM–7:00 PM</p>
          <div className="footerSocial" style={{ display: 'flex', gap: '15px', marginTop: '15px', fontSize: '1.25rem' }}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="ri-instagram-line" /></a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="ri-facebook-circle-fill" /></a>
          </div>
        </div>
      </div>
      <div className="container footerBottom">
        <span>© {new Date().getFullYear()} {siteConfig.name}</span>
        <span>Secure checkout · Cash on delivery available</span>
      </div>
    </footer>
  );
}
