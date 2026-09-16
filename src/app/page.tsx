import { Index2Home } from "@/components/index2-home";
import { getBanners, getBlogPosts, getCatalog } from "@/lib/catalog-api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [catalog, banners, journal] = await Promise.all([
    getCatalog(),
    getBanners(),
    getBlogPosts(),
  ]);
  const categoryMap = new Map<string, { slug: string; name: string; image: string; count: number }>();

  for (const product of catalog) {
    if (!product.category || !product.categoryImage) continue;
    const current = categoryMap.get(product.category);
    categoryMap.set(product.category, current
      ? { ...current, count: current.count + 1 }
      : {
          slug: product.category,
          name: product.categoryName || product.category,
          image: product.categoryImage,
          count: 1,
        });
  }

  return (
    <Index2Home
      banners={banners}
      categories={Array.from(categoryMap.values())}
      featured={catalog.filter((product) => product.featured).slice(0, 4)}
      newArrivals={catalog.filter((product) => product.newArrival).slice(0, 6)}
      trending={catalog.filter((product) => product.bestSeller).slice(0, 3)}
      journal={journal.slice(0, 2)}
    />
  );
}
