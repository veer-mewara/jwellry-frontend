import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { formatINR, getProductPrice } from "@/lib/pricing";
import { getCatalog, getCatalogProduct } from "@/lib/catalog-api";

export const dynamic = "force-dynamic";

function videoEmbedUrl(videoUrl: string) {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.summary,
    openGraph: { images: [product.images[0]] },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
  if (!product) notFound();
  const price = getProductPrice(product);
  const videoEmbed = product.videoUrl ? videoEmbedUrl(product.videoUrl) : null;
  const catalog = await getCatalog();
  const related = catalog
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  return (
    <div className="productPage container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span>
        <Link href={`/shop?category=${product.category}`}>{product.category}</Link><span>/</span>
        <span>{product.name}</span>
      </nav>
      <div className="productDetailGrid">
        <ProductGallery images={product.images} name={product.name} />
        <div className="productSummary">
          {product.collection && <span className="eyebrow">{product.collection} collection</span>}
          <h1>{product.name}</h1>
          <p className="sku">SKU {product.sku}</p>
          <div className="detailPrice">{formatINR(price.total)}</div>
          <p className="taxNote">Inclusive of making charges and GST</p>
          <p className="productLead">{product.summary}</p>
          <div className="specPills">
            <span>{product.purity} {product.metal}</span>
            <span>{product.netMetalWeight}g net weight</span>
            <span>{product.stock ? `${product.stock} in stock` : "Made to order"}</span>
          </div>
          <ProductPurchase product={product} />
          <div className="deliveryNote">
            <b>Insured delivery</b>
            <span>Estimated dispatch in 5–7 business days.</span>
          </div>
          <details open>
            <summary>Product details</summary>
            <p>{product.description}</p>
            <dl className="specList">
              {Object.entries(product.specifications).map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </details>
          {product.videoUrl && <details>
            <summary>Product video</summary>
            <div className="productVideo">
              {videoEmbed ? (
                <iframe
                  src={videoEmbed}
                  title={`${product.name} product video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video controls preload="metadata">
                  <source src={product.videoUrl} />
                  Your browser does not support this product video.
                </video>
              )}
            </div>
          </details>}
          <details>
            <summary>Transparent price breakdown</summary>
            <dl className="priceBreakdown">
              <div><dt>Metal value</dt><dd>{formatINR(price.metalValue)}</dd></div>
              <div><dt>Making charge</dt><dd>{formatINR(price.makingCharge)}</dd></div>
              <div><dt>Stone charge</dt><dd>{formatINR(price.stoneCharge)}</dd></div>
              {price.discount > 0 && <div><dt>Discount</dt><dd>−{formatINR(price.discount)}</dd></div>}
              <div><dt>GST ({product.gstRate}%)</dt><dd>{formatINR(price.gst)}</dd></div>
              <div className="priceTotal"><dt>Total</dt><dd>{formatINR(price.total)}</dd></div>
            </dl>
          </details>
        </div>
      </div>
      {related.length > 0 && (
        <section className="relatedSection">
          <h2>You may also like</h2>
          <div className="productGrid">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </div>
  );
}
