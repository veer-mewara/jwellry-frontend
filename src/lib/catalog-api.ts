import "server-only";
import { cache } from "react";
import type {
  Metal,
  Product,
  ProductCategory,
  Purity,
} from "@/types/commerce";

interface ApiProduct {
  id: number;
  slug: string;
  sku: string;
  name: string;
  summary: string | null;
  description: string | null;
  category: { name: string; slug: ProductCategory; image_path: string | null } | null;
  collection: { name: string; slug: string } | null;
  metal: Metal;
  purity: Purity;
  gross_weight: number;
  net_metal_weight: number;
  making_charge_type: "percentage" | "fixed";
  making_charge_value: number;
  stone_charge: number;
  discount_percentage: number;
  gst_rate: number;
  rate_override_per_gram: number | null;
  stock_quantity: number;
  images: Array<{ path: string }>;
  specifications: Record<string, string> | null;
  video_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  pricing: {
    reference_rate_per_gram: number;
    metal_value: number;
    making_charge: number;
    stone_charge: number;
    discount: number;
    taxable_value: number;
    gst: number;
    total: number;
  };
  flags: { featured: boolean; best_seller: boolean; new_arrival: boolean };
}

interface ApiBanner {
  id: number;
  name: string;
  placement: string;
  heading: string | null;
  copy: string | null;
  image_path: string;
  mobile_image_path: string | null;
  link_url: string | null;
}

export interface StorefrontBanner {
  id: number;
  name: string;
  placement: string;
  heading: string | null;
  copy: string | null;
  imagePath: string;
  mobileImagePath: string | null;
  linkUrl: string | null;
}

interface ApiBlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  body?: string;
  featured_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string;
}

export interface StorefrontBlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  body?: string;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: string;
}

function mapProduct(item: ApiProduct): Product {
  return {
    id: item.id,
    slug: item.slug,
    sku: item.sku,
    name: item.name,
    category: item.category?.slug || "",
    categoryName: item.category?.name || "",
    categoryImage: item.category?.image_path,
    collection: item.collection?.name || "",
    collectionSlug: item.collection?.slug,
    metal: item.metal,
    purity: item.purity,
    grossWeight: item.gross_weight,
    netMetalWeight: item.net_metal_weight,
    makingCharge: {
      type: item.making_charge_type,
      value: item.making_charge_value,
    },
    stoneCharge: item.stone_charge,
    discountPercentage: item.discount_percentage,
    gstRate: item.gst_rate,
    rateOverridePerGram:
      item.rate_override_per_gram ?? item.pricing.reference_rate_per_gram,
    images: item.images.map((image) => image.path),
    stock: item.stock_quantity,
    summary: item.summary || "Fine jewellery crafted for everyday distinction.",
    description: item.description || item.summary || "",
    specifications: item.specifications || {},
    videoUrl: item.video_url,
    metaTitle: item.meta_title,
    metaDescription: item.meta_description,
    pricing: {
      metalValue: item.pricing.metal_value,
      makingCharge: item.pricing.making_charge,
      stoneCharge: item.pricing.stone_charge,
      discount: item.pricing.discount,
      taxableValue: item.pricing.taxable_value,
      gst: item.pricing.gst,
      total: item.pricing.total,
    },
    featured: item.flags.featured,
    bestSeller: item.flags.best_seller,
    newArrival: item.flags.new_arrival,
  };
}

function apiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  return base ? `${base}/api${path}` : null;
}

const CATALOG_PAGE_SIZE = 500;
const CATALOG_MAX_PAGES = 20;
// Cached in the Next data cache so /shop (force-dynamic) does not refetch the
// whole catalogue from the API on every request.
const CATALOG_REVALIDATE_SECONDS = 60;

export interface CatalogResult {
  products: Product[];
  /** True when the catalogue could not be loaded at all (as opposed to being empty). */
  failed: boolean;
}

export const getCatalogResult = cache(async (): Promise<CatalogResult> => {
  const base = apiUrl("/products");
  if (!base) return { products: [], failed: true };

  const items: ApiProduct[] = [];
  try {
    for (let page = 1; page <= CATALOG_MAX_PAGES; page += 1) {
      const response = await fetch(`${base}?per_page=${CATALOG_PAGE_SIZE}&page=${page}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: CATALOG_REVALIDATE_SECONDS },
      });
      if (!response.ok) {
        if (page > 1) {
          console.warn(`Catalog page ${page} failed (${response.status}); using ${items.length} products already loaded.`);
          break;
        }
        return { products: [], failed: true };
      }
      const payload = (await response.json()) as {
        data: ApiProduct[];
        last_page?: number;
        next_page_url?: string | null;
      };
      items.push(...payload.data);
      const hasMore = payload.next_page_url ? true : page < (payload.last_page ?? 1);
      if (!hasMore || !payload.data.length) break;
    }
  } catch (error) {
    if (!items.length) return { products: [], failed: true };
    console.warn("Catalog fetch failed part-way; using products already loaded.", error);
  }
  return { products: items.map(mapProduct), failed: false };
});

export const getCatalog = cache(async (): Promise<Product[]> => {
  return (await getCatalogResult()).products;
});

export const getCatalogProduct = cache(
  async (slug: string): Promise<Product | undefined> => {
    const url = apiUrl(`/products/${encodeURIComponent(slug)}`);
    if (!url) return undefined;

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok) return undefined;
      const payload = (await response.json()) as { data: ApiProduct };
      return mapProduct(payload.data);
    } catch {
      return undefined;
    }
  },
);

export const getBanners = cache(async (): Promise<StorefrontBanner[]> => {
  const url = apiUrl("/banners");
  if (!url) return [];

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { data: ApiBanner[] };
    return payload.data.map((banner) => ({
      id: banner.id,
      name: banner.name,
      placement: banner.placement,
      heading: banner.heading,
      copy: banner.copy,
      imagePath: banner.image_path,
      mobileImagePath: banner.mobile_image_path,
      linkUrl: banner.link_url,
    }));
  } catch {
    return [];
  }
});

function mapBlogPost(post: ApiBlogPost): StorefrontBlogPost {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    featuredImage: post.featured_image,
    metaTitle: post.meta_title,
    metaDescription: post.meta_description,
    publishedAt: post.published_at,
  };
}

export const getBlogPosts = cache(async (): Promise<StorefrontBlogPost[]> => {
  const url = apiUrl("/blog?per_page=30");
  if (!url) return [];

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { data: ApiBlogPost[] };
    return payload.data.map(mapBlogPost);
  } catch {
    return [];
  }
});

export const getBlogPost = cache(async (slug: string): Promise<StorefrontBlogPost | undefined> => {
  const url = apiUrl(`/blog/${encodeURIComponent(slug)}`);
  if (!url) return undefined;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return undefined;
    const payload = (await response.json()) as { data: ApiBlogPost };
    return mapBlogPost(payload.data);
  } catch {
    return undefined;
  }
});
