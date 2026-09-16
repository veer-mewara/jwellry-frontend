import type { MetadataRoute } from "next";
import { getBlogPosts, getCatalog } from "@/lib/catalog-api";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts] = await Promise.all([getCatalog(), getBlogPosts()]);
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteConfig.url}/custom-jewellery`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteConfig.url}/shipping-returns`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteConfig.url}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteConfig.url}/journal`, changeFrequency: "weekly", priority: 0.6 },
  ];
  return [
    ...staticPages,
    ...products.map((product) => ({
      url: `${siteConfig.url}/products/${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: product.images.map((image) => `${siteConfig.url}${image}`),
    })),
    ...posts.map((post) => ({
      url: `${siteConfig.url}/journal/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
