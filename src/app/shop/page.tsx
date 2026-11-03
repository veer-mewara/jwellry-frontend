import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { ShopFilterForm } from "@/components/shop-filter-form";
import { ShopMobileFilters, type FilterGroup, type FilterOption } from "@/components/shop-mobile-filters";
import { getProductPrice } from "@/lib/pricing";
import { getBanners, getCatalogResult } from "@/lib/catalog-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop Fine Jewellery",
  description:
    "Explore rings, earrings, necklaces and bracelets with transparent metal, purity and price details.",
};

const PAGE_SIZE = 24;

type ShopSearchParams = Promise<Record<string, string | string[] | undefined>>;

// Choices shared by the desktop sidebar and the mobile Filter sheet, so both always match.
const SORT_OPTIONS: FilterOption[] = [
  { value: "", label: "Featured" },
  { value: "newest", label: "New Arrivals" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];
const METAL_OPTIONS: FilterOption[] = [
  { value: "", label: "All metals" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "platinum", label: "Platinum" },
];
const PURITY_OPTIONS: FilterOption[] = [
  { value: "", label: "All purities" },
  { value: "24K", label: "24K" },
  { value: "22K", label: "22K" },
  { value: "18K", label: "18K" },
  { value: "14K", label: "14K" },
  { value: "925", label: "925 Silver" },
  { value: "950", label: "950 Platinum" },
];
const PRICE_OPTIONS: FilterOption[] = [
  { value: "", label: "Any price" },
  { value: "10000", label: "Up to ₹10,000" },
  { value: "30000", label: "Up to ₹30,000" },
  { value: "75000", label: "Up to ₹75,000" },
  { value: "150000", label: "Up to ₹1,50,000" },
];

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalise(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: ShopSearchParams;
}) {
  const query = await searchParams;
  const category = one(query.category) || "";
  const collection = one(query.collection) || "";
  const metal = one(query.metal) || "";
  const purity = one(query.purity) || "";
  const availability = one(query.availability);
  const maxPrice = Number(one(query.maxPrice)) || 0;
  const onlyNew = one(query.new) === "true";
  const search = (one(query.search) || "").trim().slice(0, 100);
  const sort = one(query.sort) || "";
  const requestedPage = Math.max(1, Math.floor(Number(one(query.page))) || 1);
  const [{ products, failed: catalogFailed }, banners] = await Promise.all([getCatalogResult(), getBanners()]);
  const shopBanner = banners.find((banner) => banner.placement === "shop_top");
  const visibleCategories = Array.from(
    new Map(
      products
        .filter((product) => product.category)
        .map((product) => [
          product.category,
          { slug: product.category, name: product.categoryName || product.category },
        ]),
    ).values(),
  );
  const visibleCollections = Array.from(
    new Map(
      products
        .filter((product) => product.collectionSlug)
        .map((product) => [
          product.collectionSlug as string,
          { slug: product.collectionSlug as string, name: product.collection },
        ]),
    ).values(),
  );
  const filterGroups: FilterGroup[] = [
    { name: "sort", label: "Sort by", value: sort, options: SORT_OPTIONS },
    {
      name: "category",
      label: "Category",
      value: category,
      options: [{ value: "", label: "All categories" }, ...visibleCategories.map((item) => ({ value: item.slug, label: item.name }))],
    },
    ...(visibleCollections.length > 0 ? [{
      name: "collection",
      label: "Collection",
      value: collection,
      options: [{ value: "", label: "All collections" }, ...visibleCollections.map((item) => ({ value: item.slug, label: item.name || item.slug }))],
    }] : []),
    { name: "metal", label: "Metal", value: metal, options: METAL_OPTIONS },
    { name: "purity", label: "Purity", value: purity, options: PURITY_OPTIONS },
    { name: "maxPrice", label: "Maximum price", value: maxPrice ? String(maxPrice) : "", options: PRICE_OPTIONS },
  ];

  const searchTerm = normalise(search);
  const filtered = products.filter((product) => {
    const price = getProductPrice(product).total;
    return (
      (!category || product.category === category) &&
      (!collection || product.collectionSlug === collection) &&
      (!metal || product.metal === metal) &&
      (!purity || product.purity === purity) &&
      (!availability || availability !== "in-stock" || product.stock > 0) &&
      (!maxPrice || price <= maxPrice) &&
      (!onlyNew || product.newArrival) &&
      (!searchTerm ||
        normalise(`${product.name} ${product.sku} ${product.categoryName}`).includes(searchTerm))
    );
  });

  if (sort === "price-asc") {
    filtered.sort((a, b) => getProductPrice(a).total - getProductPrice(b).total);
  } else if (sort === "price-desc") {
    filtered.sort((a, b) => getProductPrice(b).total - getProductPrice(a).total);
  } else if (sort === "newest") {
    filtered.sort((a, b) => (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0));
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /** The current address without the given keys. */
  function hrefWithout(skip: string[], extra?: [string, string]) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      const first = one(value);
      if (!skip.includes(key) && first) params.set(key, first);
    }
    if (extra) params.set(...extra);
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  }

  const pageHref = (target: number) => hrefWithout(["page"], target > 1 ? ["page", String(target)] : undefined);
  const clearSearchHref = hrefWithout(["page", "search"]);

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (number) => number === 1 || number === totalPages || Math.abs(number - page) <= 2,
  );

  return (
    <div className="pageShell">
      <div className="pageIntro container">
        <span className="eyebrow">The collection</span>
        <h1>
          {search
            ? <>Results for “{search}”</>
            : category
              ? visibleCategories.find((item) => item.slug === category)?.name || "Fine jewellery"
              : onlyNew
                ? "New arrivals"
                : "Fine jewellery"}
        </h1>
        {search && <p><Link className="clearFilters" href={clearSearchHref}>Clear search</Link></p>}
        <p>Use material, purity, price and availability filters to find your piece.</p>
      </div>
      {shopBanner && <section className="shopPromo container">
        <Image className="shopPromoDesktop" src={shopBanner.imagePath} alt={shopBanner.heading || shopBanner.name} fill sizes="(max-width: 1240px) 100vw, 1200px" />
        {shopBanner.mobileImagePath && <Image className="shopPromoMobile" src={shopBanner.mobileImagePath} alt={shopBanner.heading || shopBanner.name} fill sizes="(max-width: 1240px) 100vw, 1200px" />}
        <div className="shopPromoContent">
          <span className="eyebrow">Featured collection</span>
          <h2>{shopBanner.heading || shopBanner.name}</h2>
          {shopBanner.copy && <p>{shopBanner.copy}</p>}
          {shopBanner.linkUrl && <Link className="button buttonLight" href={shopBanner.linkUrl}>Explore now</Link>}
        </div>
      </section>}
      <div className="container shopLayout">
        <aside className="filters">
          <ShopFilterForm>
            {onlyNew && <input type="hidden" name="new" value="true" />}
            <div className="filterGroup">
              <label htmlFor="search">Search</label>
              <input id="search" className="shopSearchInput" type="search" name="search" maxLength={100} defaultValue={search} placeholder="Name, SKU or category" />
            </div>
            {filterGroups.map((group) => (
              <div className="filterGroup" key={group.name}>
                <label htmlFor={group.name}>{group.label}</label>
                <select id={group.name} name={group.name} defaultValue={group.value}>
                  {group.options.map((option) => (
                    <option value={option.value} key={option.value || "all"}>{option.label}</option>
                  ))}
                </select>
              </div>
            ))}
            <label className="checkFilter">
              <input
                type="checkbox"
                name="availability"
                value="in-stock"
                defaultChecked={availability === "in-stock"}
              />
              In stock only
            </label>
            <button className="button buttonDark filterSubmit" type="submit">Apply filters</button>
            <Link className="clearFilters" href="/shop">Clear all</Link>
          </ShopFilterForm>
        </aside>
        <section className="shopResults">
          <ShopMobileFilters groups={filterGroups} search={search} inStock={availability === "in-stock"} onlyNew={onlyNew} />
          <div className="resultsBar">
            <span>{filtered.length} {filtered.length === 1 ? "piece" : "pieces"}{totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}</span>
            <span>Prices include GST</span>
          </div>
          {filtered.length ? (
            <div className="productGrid shopProductGrid">
              {pageItems.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          ) : catalogFailed ? (
            <div className="emptyState" role="alert">
              <h2>We couldn’t load the collection right now.</h2>
              <p>Please try again in a moment.</p>
              <Link href={pageHref(page)} className="button buttonDark">Try again</Link>
            </div>
          ) : (
            <div className="emptyState">
              <h2>{search ? `No pieces found for “${search}”.` : "No pieces match these filters."}</h2>
              <p>{search ? "Check the spelling, try a more general word, or clear the search." : "Try removing one or more filters to see the full collection."}</p>
              <Link href="/shop" className="button buttonDark">View all jewellery</Link>
            </div>
          )}
          {totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              {page > 1 ? <Link href={pageHref(page - 1)} rel="prev">Previous</Link> : <span className="paginationDisabled">Previous</span>}
              {pageNumbers.map((number, index) => (
                <span key={number} className="paginationItem">
                  {index > 0 && number - pageNumbers[index - 1] > 1 && <span className="paginationGap">…</span>}
                  {number === page
                    ? <span className="paginationCurrent" aria-current="page">{number}</span>
                    : <Link href={pageHref(number)}>{number}</Link>}
                </span>
              ))}
              {page < totalPages ? <Link href={pageHref(page + 1)} rel="next">Next</Link> : <span className="paginationDisabled">Next</span>}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
