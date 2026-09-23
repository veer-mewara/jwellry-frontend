import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getProductPrice } from "@/lib/pricing";
import type { Metal, Purity } from "@/types/commerce";
import { getBanners, getCatalog } from "@/lib/catalog-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop Fine Jewellery",
  description:
    "Explore rings, earrings, necklaces and bracelets with transparent metal, purity and price details.",
};

type ShopSearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: ShopSearchParams;
}) {
  const query = await searchParams;
  const category = one(query.category);
  const collection = one(query.collection);
  const metal = one(query.metal) as Metal | undefined;
  const purity = one(query.purity) as Purity | undefined;
  const availability = one(query.availability);
  const maxPrice = Number(one(query.maxPrice)) || 0;
  const onlyNew = one(query.new) === "true";
  const [products, banners] = await Promise.all([getCatalog(), getBanners()]);
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

  const filtered = products.filter((product) => {
    const price = getProductPrice(product).total;
    return (
      (!category || product.category === category) &&
      (!collection || product.collectionSlug === collection) &&
      (!metal || product.metal === metal) &&
      (!purity || product.purity === purity) &&
      (!availability || availability !== "in-stock" || product.stock > 0) &&
      (!maxPrice || price <= maxPrice) &&
      (!onlyNew || product.newArrival)
    );
  });

  const sort = one(query.sort);
  if (sort === "price-asc") {
    filtered.sort((a, b) => getProductPrice(a).total - getProductPrice(b).total);
  } else if (sort === "price-desc") {
    filtered.sort((a, b) => getProductPrice(b).total - getProductPrice(a).total);
  } else if (sort === "newest") {
    filtered.sort((a, b) => (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0));
  }

  return (
    <div className="pageShell">
      <div className="pageIntro container">
        <span className="eyebrow">The collection</span>
        <h1>
          {category
            ? visibleCategories.find((item) => item.slug === category)?.name || "Fine jewellery"
            : onlyNew
              ? "New arrivals"
              : "Fine jewellery"}
        </h1>
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
          <form action="/shop">
            <div className="filterGroup">
              <label htmlFor="sort">Sort by</label>
              <select id="sort" name="sort" defaultValue={sort || ""}>
                <option value="">Featured</option>
                <option value="newest">New Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
            <div className="filterGroup">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" defaultValue={category || ""}>
                <option value="">All categories</option>
                {visibleCategories.map((item) => (
                  <option value={item.slug} key={item.slug}>{item.name}</option>
                ))}
              </select>
            </div>
            {visibleCollections.length > 0 && <div className="filterGroup">
              <label htmlFor="collection">Collection</label>
              <select id="collection" name="collection" defaultValue={collection || ""}>
                <option value="">All collections</option>
                {visibleCollections.map((item) => (
                  <option value={item.slug} key={item.slug}>{item.name}</option>
                ))}
              </select>
            </div>}
            <div className="filterGroup">
              <label htmlFor="metal">Metal</label>
              <select id="metal" name="metal" defaultValue={metal || ""}>
                <option value="">All metals</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>
            <div className="filterGroup">
              <label htmlFor="purity">Purity</label>
              <select id="purity" name="purity" defaultValue={purity || ""}>
                <option value="">All purities</option>
                <option value="24K">24K</option>
                <option value="22K">22K</option>
                <option value="18K">18K</option>
                <option value="14K">14K</option>
                <option value="925">925 Silver</option>
                <option value="950">950 Platinum</option>
              </select>
            </div>
            <div className="filterGroup">
              <label htmlFor="maxPrice">Maximum price</label>
              <select id="maxPrice" name="maxPrice" defaultValue={maxPrice || ""}>
                <option value="">Any price</option>
                <option value="10000">Up to ₹10,000</option>
                <option value="30000">Up to ₹30,000</option>
                <option value="75000">Up to ₹75,000</option>
                <option value="150000">Up to ₹1,50,000</option>
              </select>
            </div>
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
          </form>
        </aside>
        <section className="shopResults">
          <div className="resultsBar">
            <span>{filtered.length} pieces</span>
            <span>Prices include GST</span>
          </div>
          {filtered.length ? (
            <div className="productGrid shopProductGrid">
              {filtered.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          ) : (
            <div className="emptyState">
              <h2>No pieces match these filters.</h2>
              <p>Try removing one or more filters to see the full collection.</p>
              <Link href="/shop" className="button buttonDark">View all jewellery</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
