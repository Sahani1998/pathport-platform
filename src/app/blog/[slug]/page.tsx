import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd, articleJsonLd } from "@/lib/jsonld";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: "Post not found" };
  return {
    title: `${post.title} | PathPort Blog`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <MarketingShell maxWidth="narrow">
      <JsonLd data={[
        breadcrumbJsonLd([{ name: "Blog", url: "/blog" }, { name: post.title, url: `/blog/${post.slug}` }]),
        articleJsonLd({
          title: post.title,
          description: post.excerpt,
          slug: `blog/${post.slug}`,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt ?? post.publishedAt,
          authorName: post.author,
          section: post.category,
        }),
      ]} />
      <Breadcrumbs trail={[{ name: "Blog", url: "/blog" }, { name: post.title, url: `/blog/${post.slug}` }]} />

      <article>
        <header className="mb-10">
          <span className="inline-block px-2.5 py-1 rounded-full bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-xs font-semibold mb-4">{post.category}</span>
          <h1 className="font-display text-3xl md:text-4xl text-white mb-4 leading-tight">{post.title}</h1>
          <p className="text-white/55 font-body text-lg leading-relaxed mb-6">{post.excerpt}</p>
          <div className="flex flex-wrap items-center gap-4 text-white/35 font-body text-sm border-t border-white/[0.07] pt-4">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {post.publishedAt}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {post.readingTime} min read</span>
            <span>By {post.author}</span>
          </div>
        </header>

        <div className="prose prose-invert prose-sm max-w-none mb-12 [&>p]:text-white/65 [&>p]:font-body [&>p]:leading-relaxed [&>p]:mb-4 [&>h2]:font-display [&>h2]:text-white [&>h2]:text-2xl [&>h2]:mt-8 [&>h2]:mb-4 [&>h3]:font-display [&>h3]:text-white [&>h3]:text-xl [&>h3]:mt-6 [&>h3]:mb-3 [&>ul]:text-white/65 [&>ul]:font-body [&>ul]:leading-relaxed [&>ul]:mb-4 [&>li]:mb-1.5">
          <p>This article is being prepared by the PathPort editorial team. Full content will be published shortly. In the meantime, contact PathPort on WhatsApp for any questions about {post.category.toLowerCase()} in Singapore.</p>
          <p>PathPort publishes practical, accurate guides for Indian students planning to study in Singapore. Every article is reviewed for accuracy against current Singapore government sources and CPE guidelines.</p>
        </div>

        <footer className="border-t border-white/[0.07] pt-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/40 font-body text-xs">{tag}</span>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4">
            <Link href="/blog" className="flex items-center gap-2 text-white/50 hover:text-white/80 font-body text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> All articles
            </Link>
            <a href={`https://wa.me/6583776492?text=I%20read%20the%20PathPort%20article:%20${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gold-400/70 hover:text-gold-400 font-body text-sm transition-colors">
              <Share2 className="w-4 h-4" /> Share on WhatsApp
            </a>
          </div>
        </footer>
      </article>
    </MarketingShell>
  );
}
