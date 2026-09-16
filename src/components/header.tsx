"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/components/store-provider";
import { siteConfig } from "@/lib/site";

const navItems = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?new=true", label: "New Arrivals" },
  { href: "/journal", label: "Journal" },
  { href: "/custom-jewellery", label: "Custom Jewellery" },
  { href: "/account", label: "My Account" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { cartCount, wishlist } = useStore();

  return (
    <>
      <div className="announcement">
        <span>Complimentary insured delivery across India</span>
        <span className="announcementSecondary">BIS hallmarked jewellery</span>
      </div>
      <header className="siteHeader">
        <div className="container headerInner">
          <button
            className="menuButton"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
          </button>
          <Link href="/" className="brand" aria-label={`${siteConfig.name} home`}>
            <span className="brandMark">J</span>
            <span>{siteConfig.name}</span>
          </Link>
          <nav className={open ? "mainNav mainNavOpen" : "mainNav"}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="headerActions">
            <Link href="/wishlist" aria-label="Wishlist" className="iconLink">
              <span aria-hidden="true">♡</span>
              {wishlist.length > 0 && <b>{wishlist.length}</b>}
            </Link>
            <Link href="/cart" aria-label="Shopping bag" className="iconLink">
              <span aria-hidden="true">Bag</span>
              {cartCount > 0 && <b>{cartCount}</b>}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
