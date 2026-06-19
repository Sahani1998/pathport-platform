import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { getAllPosts, BLOG_CATEGORIES } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog | PathPort",
  description: "PathPort Blog — guides, news, and advice for Indian students planning to study in Singapore. Student Pass, courses, accommodation, internships, and student life.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "PathPort Blog", description: "Practical guides and news for Indian students studying in Singapore." },
};

export default function BlogPage() {
  const posts = getAllPosts();
  const featured = posts.find(p => p.featured) ?? posts[0];
  const rest = posts.filter(p => p !== featured);

  return (
    <MarketingShell maxWidth="wide">
      <JsonLd data={breadcrumbJsonLd([{ name: "Blog", url: "/blog" }])} />
      <Breadcrumbs trail={[{ name: "Blog", url: "/blog" }]} />

      <PageHero
        eyebrow="PathPort Blog"
        title="Guides for Indian students in Singapore."
        subtitle="Practical, accurate content written by the PathPort team — covering Student Pass, courses, internships, accommodation, banking, and more."
      />

      {featured && (
        <section className="mb-10">
          <Link href={`/blog/${featured.slug}`} className="group block p-6 rounded-2xl bg-white/[0.05] border border-white/[0.10] hover:border-gold-400/30 transition-all">
            <span className="inline-block px-2 py-0.5 rounded-full bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-xs font-semibold mb-3">Featured</span>
            <h2 className="font-display text-2xl md:text-3xl text-white mb-2 group-hover:text-gold-300 transition-colors">{featured.title}</h2>
            <p className="text-white/55 font-body text-base leading-relaxed mb-4">{featured.excerpt}</p>
            <div className="flex items-center gap-4 text-white/30 font-body text-xs">
              <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {featured.publishedAt}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {featured.readingTime} min read</span>
              <span>{featured.category}</span>
            </div>
          </Link>
        </section>
      )}

      <section className="mb-10">
        <div className="flex gap-2 flex-wrap mb-6">
          <span className="px-3 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-xs font-semibold">All</span>
          {BLOG_CATEGORIES.map(cat => (
            <span key={cat} className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 font-body text-xs hover:text-white/80 hover:border-white/[0.15] transition-all cursor-pointer">{cat}</span>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rest.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-gold-400/25 hover:bg-white/[0.05] transition-all">
              <span className="text-gold-400/70 font-body text-xs mb-2">{post.category}</span>
              <h3 className="font-display text-lg text-white mb-2 group-hover:text-gold-300 transition-colors leading-snug">{post.title}</h3>
              <p className="text-white/45 font-body text-sm leading-relaxed flex-1 mb-4">{post.excerpt}</p>
              <div className="flex items-center justify-between text-white/25 font-body text-xs">
                <span>{post.publishedAt}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readingTime} min</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {posts.length === 0 && (
        <div className="text-center py-16">
          <p className="font-display text-xl text-white mb-2">First posts coming soon.</p>
          <p className="text-white/45 font-body text-sm">Subscribe to be notified when PathPort publishes new guides.</p>
        </div>
      )}

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-display text-xl text-white mb-1">Get new articles by email</p>
          <p className="text-white/50 font-body text-sm">PathPort publishes 2–4 new guides per month for Indian students in Singapore.</p>
        </div>
        <a href="mailto:pathportsg@gmail.com?subject=Blog%20subscription" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all whitespace-nowrap flex-shrink-0">
          Subscribe <ArrowRight className="w-4 h-4" />
        </a>
      </section>
    </MarketingShell>
  );
}
