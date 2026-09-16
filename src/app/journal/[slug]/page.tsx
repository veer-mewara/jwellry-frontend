import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPost } from "@/lib/catalog-api";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
  };
}

export default async function JournalArticlePage({
  params,
}: PageProps<"/journal/[slug]">) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="container journalArticle">
      <Link className="textLink journalBack" href="/journal">← Back to journal</Link>
      <header>
        <span className="eyebrow">{new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
        <h1>{post.title}</h1>
        {post.excerpt && <p>{post.excerpt}</p>}
      </header>
      {post.featuredImage && <Image className="journalFeatureImage" src={post.featuredImage} alt={post.title} width={1200} height={700} unoptimized />}
      <div className="journalBody">
        {(post.body || "").split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
