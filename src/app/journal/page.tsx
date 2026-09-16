import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBlogPosts } from "@/lib/catalog-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jewellery Journal",
  description: "Jewellery care, styling ideas and buying guidance from our experts.",
};

export default async function JournalPage() {
  const posts = await getBlogPosts();

  return (
    <div className="pageShell journalPage">
      <div className="container pageIntro">
        <span className="eyebrow">The journal</span>
        <h1>Notes on jewellery, craft and care.</h1>
        <p>Useful guidance from the people who make and curate every collection.</p>
      </div>
      <section className="container journalGrid">
        {posts.length ? posts.map((post) => (
          <article className="journalCard" key={post.id}>
            {post.featuredImage && <Image src={post.featuredImage} alt="" width={720} height={420} unoptimized />}
            <span className="eyebrow">{new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            <h2><Link href={`/journal/${post.slug}`}>{post.title}</Link></h2>
            {post.excerpt && <p>{post.excerpt}</p>}
            <Link className="textLink" href={`/journal/${post.slug}`}>Read article <span>→</span></Link>
          </article>
        )) : <div className="emptyState"><h2>No journal posts yet.</h2><p>Published articles from the administration panel will appear here.</p></div>}
      </section>
    </div>
  );
}
