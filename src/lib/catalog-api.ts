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

export const getCatalog = cache(async (): Promise<Product[]> => {
  const url = apiUrl("/products?per_page=60");
  if (!url) return [];

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { data: ApiProduct[] };
    return payload.data.map(mapProduct);
  } catch {
    return [];
  }
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
