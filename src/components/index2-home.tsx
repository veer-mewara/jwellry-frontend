"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Product } from "@/types/commerce";
import type { StorefrontBanner, StorefrontBlogPost } from "@/lib/catalog-api";
import { formatINR, getProductPrice } from "@/lib/pricing";
import { siteConfig } from "@/lib/site";
import { useStore } from "@/components/store-provider";

interface CategoryCard {
  slug: string;
  name: string;
  image: string;
  count: number;
}

interface Index2HomeProps {
  banners: StorefrontBanner[];
  categories: CategoryCard[];
  featured: Product[];
  newArrivals: Product[];
  trending: Product[];
  journal: StorefrontBlogPost[];
}

export function Index2ProductTile({ product }: { product: Product }) {
  const { addToCart, isWishlisted, toggleWishlist } = useStore();
  const [added, setAdded] = useState(false);
  const wished = isWishlisted(product.id);
  const price = getProductPrice(product).total;

  function addProduct() {
    if (!product.stock) return;
    addToCart(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  }

  return (
    <article className="cs_product_style_1">
      <div className="cs_product_thumb cs_gray_bg">
        <Link href={`/products/${product.slug}`} aria-label={product.name}>
          <Image
            className="cs_product_img"
            src={product.images[0]}
            alt={product.name}
            width={560}
            height={560}
            sizes="(max-width: 575px) 50vw, (max-width: 991px) 33vw, 25vw"
          />
          {product.images[1] && (
            <Image
              className="cs_product_img"
              src={product.images[1]}
              alt={`${product.name} alternate view`}
              width={560}
              height={560}
              sizes="(max-width: 575px) 50vw, (max-width: 991px) 33vw, 25vw"
            />
          )}
        </Link>
        {(product.newArrival || product.discountPercentage > 0) && (
          <div className="cs_product_badges">
            <span className="cs_product_badge cs_accent_bg cs_fs_12 cs_white_color">
              {product.newArrival ? "New" : `${product.discountPercentage}% Off`}
            </span>
          </div>
        )}
        <div className="cs_action_btns cs_center">
          <button
            type="button"
            className={wished ? "cs_product_action cs_action_selected" : "cs_product_action"}
            onClick={() => toggleWishlist(product.id)}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wished}
          >
            <i className={wished ? "ri-heart-3-fill" : "ri-heart-3-line"} />
          </button>
          <Link className="cs_product_action" href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
            <i className="ri-eye-line" />
          </Link>
          <button
            type="button"
            className="cs_product_action"
            onClick={addProduct}
            disabled={product.stock === 0}
            aria-label={product.stock === 0 ? "Out of stock" : `Add ${product.name} to cart`}
          >
            <i className={added ? "ri-check-line" : "ri-shopping-cart-2-line"} />
          </button>
        </div>
      </div>
      <div className="cs_product_info text-center">
        <h3 className="cs_product_title cs_fs_22 cs_medium mb-0">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <div className="cs_rating" aria-label="5 out of 5 stars">
          <div className="cs_rating_percentage" />
        </div>
        <p className="cs_product_price cs_primary_color mb-0">{formatINR(price)}</p>
      </div>
    </article>
  );
}

function HeroProduct({ product }: { product?: Product }) {
  const { addToCart } = useStore();

  if (!product) return null;

  return (
    <article className="cs_product_style_1 cs_white_bg">
      <div className="cs_product_thumb cs_center">
        {product.newArrival && <span className="cs_product_badge cs_accent_bg cs_fs_12 cs_white_color">New</span>}
        <button
          type="button"
          className="cs_product_btn cs_center cs_primary_bg cs_white_color"
          onClick={() => addToCart(product)}
          aria-label={`Add ${product.name} to cart`}
        >
          <i className="ri-shopping-cart-2-line" />
        </button>
        <Image src={product.images[0]} alt={product.name} width={360} height={360} sizes="(max-width: 767px) 42vw, 230px" />
      </div>
      <div className="cs_product_info">
        <h2 className="cs_product_title cs_fs_22 cs_medium mb-0">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h2>
        <span className="cs_product_price cs_accent_color">{formatINR(getProductPrice(product).total)}</span>
      </div>
    </article>
  );
}

export function TemplateHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount, wishlist } = useStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("search")?.toString().trim();
    window.location.assign(value ? `/shop?search=${encodeURIComponent(value)}` : "/shop");
  }

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/shop?new=true", label: "New Arrivals" },
    { href: "/custom-jewellery", label: "Custom Jewellery" },
    { href: "/journal", label: "Journal" },
    { href: "/contact", label: "Contact Us" },
  ];

  return (
    <header className="cs_site_header cs_style_1">
      <div className="cs_topbar">
        <div className="container-fluid">
          <div className="cs_topbar_in">
            <div className="cs_topbar_social">
              <a href="#" aria-label="Facebook"><i className="ri-facebook-fill" /></a>
              <a href="#" aria-label="Instagram"><i className="ri-instagram-line" /></a>
            </div>
            <p className="cs_topbar_notice_text">Complimentary insured delivery across India. <Link href="/shop">Shop Now!</Link></p>
            <div className="cs_topbar_links">
              <Link href="/account"><i className="ri-truck-line" />Order Tracking</Link>
              <Link href="/custom-jewellery"><i className="ri-chat-1-line" />Custom Enquiry</Link>
            </div>
          </div>
        </div>
      </div>
      <div className="cs_main_header position-relative">
        <div className="container-fluid">
          <div className="cs_main_header_in">
            <div className="cs_main_header_left">
              <Link className="cs_site_branding" href="/" aria-label={`${siteConfig.name} home`}>
                <Image src="/assets/img/sonaro-logo.png" alt={siteConfig.name} width={240} height={135} style={{ height: '60px', width: 'auto', maxHeight: '100%' }} priority />
              </Link>
            </div>
            <div className="cs_main_header_center">
              <nav className="cs_nav cs_medium cs_primary_color">
                <div className={menuOpen ? "cs_nav_list_wrapper active" : "cs_nav_list_wrapper"}>
                  <button className="cs_close_nav" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><i className="ri-close-line" /></button>
                  <ul className="cs_nav_list cs_mp_0">
                    {navItems.map((item) => {
                      const itemPath = item.href.split('?')[0];
                      const itemQuery = item.href.includes('?') ? new URLSearchParams(item.href.split('?')[1]) : new URLSearchParams();
                      
                      let isActive = false;
                      if (item.href === "/") {
                        isActive = pathname === "/";
                      } else {
                        isActive = pathname === itemPath;
                        if (isActive && itemQuery.toString()) {
                           // If item has a specific query param (e.g. new=true), ensure it matches
                           for (const [key, value] of Array.from(itemQuery.entries())) {
                             if (searchParams?.get(key) !== value) {
                               isActive = false;
                               break;
                             }
                           }
                        }
                      }
                      
                      return (
                        <li className={isActive ? "cs_active" : ""} key={item.href}>
                          <Link href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </nav>
            </div>
            <div className="cs_main_header_right">
              <button type="button" className="cs_header_action mobile_hide" onClick={() => setSearchOpen(true)} aria-label="Search"><i className="ri-search-line" /></button>
              <Link href="/cart" className="cs_header_action cs_has_badge" aria-label="Cart">
                <i className="ri-shopping-cart-2-line" />
                <span className="cs_action_badge">{cartCount}</span>
              </Link>
              <Link href="/wishlist" className="cs_header_action cs_has_badge mobile_hide" aria-label="Wishlist">
                <i className="ri-heart-3-line" />
                <span className="cs_action_badge">{wishlist.length}</span>
              </Link>
              <Link href="/account" className="cs_header_action" aria-label="My Account"><i className="ri-user-3-line" /></Link>
              <button className={menuOpen ? "cs_menu_toggle active" : "cs_menu_toggle"} type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation"><span /></button>
            </div>
          </div>
        </div>
      </div>
      <div className={searchOpen ? "cs_header_search active" : "cs_header_search"}>
        <div className="cs_header_search_in">
          <form className="cs_search_form" onSubmit={submitSearch}>
            <input type="search" name="search" placeholder="Search for jewellery..." autoFocus={searchOpen} />
            <button type="submit" aria-label="Search"><i className="ri-search-line" /></button>
          </form>
          <button className="cs_close" type="button" onClick={() => setSearchOpen(false)} aria-label="Close search"><i className="ri-close-line" /></button>
        </div>
      </div>
    </header>
  );
}

export function TemplateFooter() {
  const currentYear = new Date().getFullYear();
  const instagramImages = [1, 2, 3, 4, 5, 6];

  return (
    <footer className="cs_footer_style_2 cs_black_bg cs_gray2_color">
      <div className="cs_footer_main">
        <div className="container">
          <div className="cs_footer_grid">
            <div className="cs_footer_widget cs_text_widget">
              <Link className="cs_footer_logo" href="/"><Image src="/assets/img/sonaro-logo-white.png" alt={siteConfig.name} width={240} height={135} style={{ height: '60px', width: 'auto' }} /></Link>
              <p>Heirloom-quality jewellery crafted with intention. Each gemstone tells a story, each setting is a promise.</p>
              <h3 className="cs_footer_widget_title cs_fs_22 cs_semibold cs_white_color">Join Us</h3>
              <div className="cs_social_btns_style_1 cs_mp_0">
                <a href="#" aria-label="Facebook"><i className="ri-facebook-fill" /></a>
                <a href="#" aria-label="Instagram"><i className="ri-instagram-line" /></a>
              </div>
            </div>
            <div className="cs_footer_widget">
              <h3 className="cs_footer_widget_title cs_fs_22 cs_semibold cs_white_color">Discover</h3>
              <ul className="cs_footer_links cs_mp_0">
                <li><Link href="/shop?new=true">New Arrivals</Link></li>
                <li><Link href="/shop?sort=popular">Bestsellers</Link></li>
                <li><Link href="/shop?category=rings">Rings</Link></li>
                <li><Link href="/shop?category=necklaces">Necklaces & Pendants</Link></li>
                <li><Link href="/shop?category=earrings">Earrings</Link></li>
              </ul>
            </div>
            <div className="cs_footer_widget">
              <h3 className="cs_footer_widget_title cs_fs_22 cs_semibold cs_white_color">About</h3>
              <ul className="cs_footer_links cs_mp_0">
                <li><Link href="/custom-jewellery">Our Story</Link></li>
                <li><Link href="/journal">Journal</Link></li>
                <li><Link href="/account">My Account</Link></li>
                <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/terms-and-conditions">Terms & Conditions</Link></li>
              </ul>
            </div>
            <div className="cs_footer_widget">
              <h3 className="cs_footer_widget_title cs_fs_22 cs_semibold cs_white_color">Contact Us</h3>
              <ul className="cs_footer_contact cs_mp_0">
                <li><span>Phone:</span> <a href={`tel:${siteConfig.supportPhone.replace(/\s/g, "")}`}>{siteConfig.supportPhone}</a></li>
                <li><span>Email:</span> <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a></li>
                <li><span>Opening:</span> Mon - Sat, 10:00 AM - 7:00 PM</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="cs_instagram_style_1 position-relative z-1">
        <div className="container-fluid">
          <div className="cs_section_heading_style_1 cs_center_column text-center">
            <p className="cs_section_subtitle">Exclusive Insider</p>
            <h2 className="cs_section_title cs_fs_36 cs_semibold cs_white_color mb-0">{siteConfig.name} Moments</h2>
          </div>
          <div className="index2InstagramGrid">
            {instagramImages.map((image) => (
              <a href="#" className="cs_instagram_link position-relative" aria-label="Instagram" key={image}>
                <Image src={`/assets/img/instagram-img-${image}.jpg`} alt="Jewellery inspiration" width={420} height={420} />
                <span className="cs_instagram_icon"><i className="ri-instagram-line" /></span>
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="cs_footer_bottom">
        <div className="container"><div className="cs_footer_bottom_in">
          <p className="cs_footer_copyright mb-0">© {currentYear} {siteConfig.name}. All rights reserved.</p>
          <div className="cs_footer_payments"><Image src="/assets/img/payment_logo.png" alt="Secure payment methods" width={248} height={28} /></div>
        </div></div>
      </div>
    </footer>
  );
}

function HeroSlider({
  banners,
  featured,
  newArrivals,
}: Pick<Index2HomeProps, "banners" | "featured" | "newArrivals">) {
  const slides = banners.filter((banner) => banner.placement === "homepage_hero");
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = slides.length;
  const currentIndex = slideCount ? activeIndex % slideCount : 0;
  const hero = slides[currentIndex];

  useEffect(() => {
    if (slideCount < 2) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slideCount);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [slideCount]);

  function previousSlide() {
    if (slideCount < 2) return;
    setActiveIndex((index) => (index + slideCount - 1) % slideCount);
  }

  function nextSlide() {
    if (slideCount < 2) return;
    setActiveIndex((index) => (index + 1) % slideCount);
  }

  return (
    <section className="cs_hero_style_1 cs_gray5_bg position-relative" aria-roledescription="carousel" aria-label="Featured jewellery collections">
      <div
        className="cs_hero_content_wrap cs_bg_filed index2HeroSlide"
        key={hero?.id || "default-hero"}
        style={{ backgroundImage: `url(${hero?.imagePath || "/assets/img/hero-bg-1.jpg"})` }}
      >
        <div className="cs_hero_content"><div className="container-fluid"><div className="cs_hero_slide_in">
          <div className="cs_hero_text">
            <p className="cs_hero_label cs_fs_14">{hero?.name || "New Heirloom Collection"}</p>
            <h1 className="cs_hero_title cs_fs_90 cs_semibold">{hero?.heading || "Timeless Elegance in Every Piece"}</h1>
            <p className="cs_hero_subtitle cs_fs_18">{hero?.copy || "Handcrafted masterpieces with brilliant diamonds and hallmarked gold."}</p>
            <div className="cs_hero_btns">
              <Link href={hero?.linkUrl || "/shop"} className="cs_btn_style_1 cs_primary_bg cs_white_color">Shop Now</Link>
              <Link href="/custom-jewellery" className="cs_btn_style_1 cs_hero_btn_outline">Explore Collection</Link>
            </div>
          </div>
          <div className="cs_hero_products_wrap"><HeroProduct product={featured[0]} /><HeroProduct product={featured[1] || newArrivals[0]} /></div>
        </div></div></div>
      </div>
      <div className="cs_slider_controller_1">
        <div className="container-fluid"><div className="cs_controller_in">
          <button type="button" className="cs_slider_nav" onClick={previousSlide} disabled={slideCount < 2} aria-label="Previous banner"><i className="ri-arrow-left-s-line" /><span>Prev</span></button>
          <div className="cs_slider_fraction" aria-live="polite"><span>{slideCount ? currentIndex + 1 : 1}</span> / <span>{Math.max(slideCount, 1)}</span></div>
          <button type="button" className="cs_slider_nav" onClick={nextSlide} disabled={slideCount < 2} aria-label="Next banner"><span>Next</span><i className="ri-arrow-right-s-line" /></button>
        </div></div>
      </div>
    </section>
  );
}

export function Index2Home({ banners, categories, featured, newArrivals, trending, journal }: Index2HomeProps) {
  const promo = banners.find((banner) => banner.placement === "homepage_promo");
  const promoImage = promo?.imagePath || "/assets/img/offer-banner-1.jpg";
  const allNew = newArrivals.length ? newArrivals : featured;
  const allTrending = trending.length ? trending : featured;

  return (
    <div className="index2Home">
      <HeroSlider banners={banners} featured={featured} newArrivals={allNew} />

      {categories.length > 0 && <section className="cs_shop_category pb-0 cs_section_padding"><div className="container">
        <div className="cs_section_heading_style_1 text-center mx-auto"><h2 className="cs_section_title cs_fs_36 cs_semibold mb-0">Shop by Category</h2></div>
        <div className="index2CategoryGrid">
          {categories.slice(0, 4).map((category) => <Link href={`/shop?category=${category.slug}`} className="cs_category_card" key={category.slug}>
            <div className="cs_category_thumb"><Image src={category.image} alt={category.name} width={480} height={560} sizes="(max-width: 575px) 50vw, 25vw" /></div>
            <div className="cs_category_meta"><h3 className="cs_category_name cs_fs_22 cs_medium mb-0">{category.name}</h3><span className="cs_category_count cs_fs_16">{category.count} Items</span></div>
          </Link>)}
        </div>
      </div></section>}

      <section className="cs_about_style_1 pb-0 cs_section_padding"><div className="container"><div className="cs_about_in">
        <div className="cs_about_thumb"><Image src="/assets/img/about-1.png" alt="Handcrafted jewellery" width={662} height={738} /></div>
        <div className="cs_about_content"><div className="cs_section_heading_style_1"><p className="cs_section_subtitle cs_fs_14">Our story</p><h2 className="cs_section_title cs_fs_36 cs_semibold mb-0">Where Timeless Craft Meets Modern Soul</h2></div>
          <div className="cs_about_band"><div className="cs_about_band_text"><p className="cs_about_desc">Every piece is made with care by skilled artisans. We pair transparent pricing with certified metals so that every celebration begins with confidence. <span className="cs_primary_color">We don&apos;t just make jewellery — we preserve memories.</span></p><Link href="/custom-jewellery" className="cs_about_link cs_medium cs_primary_color"><span>View Our Story</span></Link></div><div className="cs_about_band_thumb"><Image src="/assets/img/about-2.png" alt="Fine gold jewellery detail" width={262} height={293} /></div></div>
          <div className="cs_about_features"><div className="cs_iconbox_style_1"><span className="cs_iconbox_icon cs_center cs_gray_bg rounded-circle"><Image src="/assets/img/icons/ethically-sourced.svg" alt="Ethically sourced" width={32} height={32} /></span><div className="cs_iconbox_info"><h3 className="cs_iconbox_title cs_fs_22 cs_medium">Ethically Sourced</h3><p className="mb-0">Certified metals & thoughtfully chosen gems</p></div></div><div className="cs_iconbox_style_1"><span className="cs_iconbox_icon cs_center cs_gray_bg rounded-circle"><Image src="/assets/img/icons/lifetime-warranty.svg" alt="Lifetime support" width={32} height={32} /></span><div className="cs_iconbox_info"><h3 className="cs_iconbox_title cs_fs_22 cs_medium">Lifetime Support</h3><p className="mb-0">Care guidance for every special piece</p></div></div></div>
        </div>
      </div></div></section>

      {featured.length > 0 && <section className="cs_featured_section pb-0 cs_section_padding"><div className="container"><div className="cs_section_heading_style_1 text-center mx-auto"><h2 className="cs_section_title cs_fs_36 cs_semibold mb-0">Featured Masterpieces</h2></div><div className="cs_grid_col_4">{featured.slice(0, 4).map((product) => <Index2ProductTile product={product} key={product.id} />)}</div></div></section>}

      <section className="cs_offer_section pb-0 cs_section_padding"><div className="container"><div className="cs_product_promo_2"><div className="cs_promo_bg"><Image src={promoImage} alt={promo?.heading || "Jewellery special offer"} width={1320} height={480} sizes="100vw" /></div><div className="cs_promo_content"><span className="cs_promo_label cs_fs_22 cs_medium cs_primary_font cs_primary_color">Special Offer</span><h2 className="cs_promo_title cs_fs_36 cs_semibold"><Link href={promo?.linkUrl || "/shop"}>{promo?.heading || "Up to 20% Off"}</Link></h2><p className="cs_promo_desc cs_fs_18 mb-0">{promo?.copy || "Exclusive collection for your forever moment. Complimentary engraving."}</p><Link href={promo?.linkUrl || "/shop"} className="cs_promo_btn cs_medium">Shop Now</Link></div></div></div></section>

      {allNew.length > 0 && <section className="cs_new_collection pb-0 cs_section_padding"><div className="container"><div className="cs_section_heading_style_1 text-center mx-auto"><h2 className="cs_section_title cs_fs_36 cs_semibold mb-0">New Collection</h2></div><div className="cs_grid_col_4">{allNew.slice(0, 3).map((product) => <Index2ProductTile product={product} key={product.id} />)}<article className="cs_product_style_1 cs_card_banner"><Link href="/shop" className="cs_card_banner_link"><div className="cs_promo_bg"><Image src="/assets/img/product-img-41.jpg" alt="Special celebrations" width={560} height={560} /></div><div className="cs_card_banner_content"><h3 className="cs_card_banner_title cs_fs_22 cs_medium">Special Celebrations</h3><p className="cs_card_banner_sub cs_fs_18">15% Off</p><span className="cs_card_banner_btn cs_medium">Shop Now</span></div></Link></article>{allNew.slice(3, 6).map((product) => <Index2ProductTile product={product} key={product.id} />)}</div></div></section>}

      <section className="cs_why_different pb-0 cs_section_padding"><div className="container"><div className="cs_why_different_in cs_gray_bg"><div className="cs_why_different_content"><div className="cs_section_heading_style_1 mb-0"><h2 className="cs_section_title cs_fs_36 cs_semibold">Why {siteConfig.name} is different?</h2><p className="cs_why_different_desc mb-0">We don&apos;t just craft jewellery; we weave emotions into every piece. From ethically sourced gems to heirloom-quality finishing, we celebrate your unique story.</p></div><div className="cs_why_different_cards"><div className="cs_why_different_card cs_white_bg"><h3 className="cs_card_title cs_fs_22 cs_medium">Certified Authenticity</h3><p className="cs_card_text cs_fs_14 mb-0">Hallmarked gold and transparent product specifications.</p></div><div className="cs_why_different_card cs_white_bg"><h3 className="cs_card_title cs_fs_22 cs_medium">Handcrafted by Artisans</h3><p className="cs_card_text cs_fs_14 mb-0">Skilled jewellers creating pieces for life&apos;s milestones.</p></div></div><div className="cs_funfact_list cs_border_bg"><div className="cs_funfact"><div><span className="cs_funfact_number cs_fs_28 cs_semibold cs_primary_font">12k+</span><p className="cs_funfact_label cs_fs_14 mb-0">Happy Customers</p></div></div><div className="cs_funfact"><div><span className="cs_funfact_number cs_fs_28 cs_semibold cs_primary_font">98%</span><p className="cs_funfact_label cs_fs_14 mb-0">5-Star Reviews</p></div></div><div className="cs_funfact"><div><span className="cs_funfact_number cs_fs_28 cs_semibold cs_primary_font">30 <span className="cs_funfact_unit cs_fs_22 cs_medium">Days</span></span><p className="cs_funfact_label cs_fs_14 mb-0">Easy Returns</p></div></div></div></div><div className="cs_why_different_thumb"><Image src="/assets/img/why-different.jpg" alt="Woman wearing fine jewellery" width={620} height={665} /></div></div></div></section>

      <section className="cs_testimonial_section pb-0 cs_section_padding"><div className="container"><div className="cs_section_heading_style_1 text-center mx-auto"><h2 className="cs_section_title cs_fs_36 cs_semibold mb-0">What Our Customers Say</h2></div><div className="cs_testimonial_style_1"><div className="cs_testimonial_thumb cs_testimonial_thumb_left"><Image src="/assets/img/testimonial-1.jpg" alt="Happy customer" width={360} height={450} /></div><div className="cs_testimonial_body"><span className="cs_testimonial_quote"><Image src="/assets/img/icons/quote.svg" alt="Quote" width={45} height={38} /></span><blockquote>&quot;The craftsmanship is beautiful and the entire order experience felt considered from start to finish. My piece arrived exactly as expected and is already a treasured favourite.&quot;</blockquote><p className="cs_testimonial_name cs_medium cs_primary_color mb-0">A valued customer</p></div><div className="cs_testimonial_thumb cs_testimonial_thumb_right"><Image src="/assets/img/testimonial-2.jpg" alt="Jewellery customer" width={360} height={450} /></div></div></div></section>

      {allTrending.length > 0 && <section className="cs_trending_section pb-0 cs_section_padding"><div className="container"><div className="cs_section_heading_style_1 text-center mx-auto"><h2 className="cs_section_title cs_fs_36 cs_semibold mb-0">Trending Products</h2></div><div className="cs_grid_col_4"><div className="cs_product_promo_3"><div className="cs_promo_bg"><Image src="/assets/img/trending-promo.jpg" alt="Jewellery offer" width={560} height={560} /></div><div className="cs_promo_content"><span className="cs_promo_label cs_fs_22 cs_medium cs_primary_font cs_primary_color">Signature Edit</span><p className="cs_promo_price cs_primary_color mb-0"><span className="cs_fs_18">Discover</span><span className="cs_fs_36 cs_semibold cs_primary_font">New</span><span className="cs_fs_18">Favourites</span></p><Link href="/shop" className="cs_promo_btn cs_medium">Shop Now</Link></div></div>{allTrending.slice(0, 3).map((product) => <Index2ProductTile product={product} key={product.id} />)}</div></div></section>}

      {journal.length > 0 && <section className="cs_blog_journal_section pb-0 cs_section_padding"><div className="container"><div className="cs_section_heading_style_1 text-center mx-auto"><h2 className="cs_section_title cs_fs_36 cs_semibold mb-0">Heartfelt Stories From The World of Fine Jewellery Curated For The Modern Collector</h2></div><div className="cs_blog_journal_grid">{journal.slice(0, 1).map((post) => <article className="cs_post_style_4" key={post.id}><Link href={`/journal/${post.slug}`} className="cs_post_thumbnail"><Image src={post.featuredImage || "/assets/img/blog-16.jpg"} alt={post.title} width={560} height={440} /></Link><div className="cs_post_content"><ul className="cs_post_meta cs_fs_14 cs_mp_0"><li><span className="cs_meta_icon"><i className="ri-calendar-line" /></span><span className="cs_meta_text">{post.publishedAt.slice(0, 10)}</span></li></ul><h2 className="cs_post_title cs_fs_22 cs_medium"><Link href={`/journal/${post.slug}`}>{post.title}</Link></h2></div></article>)}<div className="cs_newsletter_style_1 cs_type_1"><div className="cs_newsletter_heading"><h2 className="cs_newsletter_title cs_fs_22 cs_medium cs_primary_color">Get the Journal</h2><p className="cs_newsletter_subtitle mb-0">Subscribe for weekly gems, style edits and exclusive offers.</p></div><div className="cs_newsletter_form_wrap"><form className="cs_newsletter_form" onSubmit={(event) => event.preventDefault()}><input type="email" name="email" placeholder="Your email address" required /><button type="submit" className="cs_btn_style_1 cs_primary_bg cs_white_color">Subscribe</button></form><p className="cs_newsletter_note mb-0">No spam, only stories that shine.</p></div></div>{journal.slice(1, 2).map((post) => <article className="cs_post_style_4" key={post.id}><Link href={`/journal/${post.slug}`} className="cs_post_thumbnail"><Image src={post.featuredImage || "/assets/img/blog-17.jpg"} alt={post.title} width={560} height={440} /></Link><div className="cs_post_content"><ul className="cs_post_meta cs_fs_14 cs_mp_0"><li><span className="cs_meta_icon"><i className="ri-calendar-line" /></span><span className="cs_meta_text">{post.publishedAt.slice(0, 10)}</span></li></ul><h2 className="cs_post_title cs_fs_22 cs_medium"><Link href={`/journal/${post.slug}`}>{post.title}</Link></h2></div></article>)}</div></div></section>}

      <section className="cs_feature_section cs_section_padding"><div className="container"><div className="cs_grid_col_4">{[["free-shipping.svg", "Insured Delivery", "Safe delivery across India"], ["secure-payment.svg", "Secure Payment", "Razorpay protected checkout"], ["easy-return.svg", "Easy Return", "Simple return assistance"], ["certified-jewelry.svg", "Certified Jewellery", "Purity details on every piece"]].map(([icon, title, description]) => <div className="cs_iconbox_style_1 cs_iconbox_center" key={title}><span className="cs_iconbox_icon cs_center cs_gray_bg rounded-circle"><Image src={`/assets/img/icons/${icon}`} alt={title} width={32} height={32} /></span><div className="cs_iconbox_info"><h3 className="cs_iconbox_title cs_fs_22 cs_medium">{title}</h3><p className="mb-0">{description}</p></div></div>)}</div></div></section>
    </div>
  );
}
