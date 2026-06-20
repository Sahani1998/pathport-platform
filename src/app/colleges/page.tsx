// Public colleges directory — light theme (Sprint 30.1 PR-C).
// Hero + narrative content sections + EduTrust trust band + directory grid + FAQ.
// No auth required. Fetches from DB filtered by is_published + is_active.
// Pagination: 12 per page via ?page= param. Search: ?q= filters by name/description.

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { Building2, Globe, Search, ChevronRight } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import PhotoBand from "@/components/ui/PhotoBand";
import CollegesHeroImmersive from "@/components/colleges/CollegesHeroImmersive";
import CollegesWhyStory from "@/components/colleges/CollegesWhyStory";
import PrivateCollegeGuide from "@/components/colleges/PrivateCollegeGuide";
import EduTrustExplainer from "@/components/colleges/EduTrustExplainer";
import DiplomaProgressionPathway from "@/components/colleges/DiplomaProgressionPathway";
import UniversityProgressionOpportunities from "@/components/colleges/UniversityProgressionOpportunities";
import CollegesFAQ from "@/components/colleges/CollegesFAQ";

export const revalidate = 300; // 5-minute cache

const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title:       "Singapore Private Colleges | PathPort",
  description: "Explore EduTrust-certified Singapore private colleges offering diploma, advanced diploma, and higher diploma programmes. Compare colleges and apply through PathPort.",
  alternates:  { canonical: "/colleges" },
  openGraph: {
    title:       "Singapore Private Colleges | PathPort",
    description: "Compare EduTrust-certified Singapore private colleges for diploma programmes.",
    type:        "website",
  },
};

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function CollegesPage({ searchParams }: PageProps) {
  const { q, page: pageParam } = await searchParams;
  const page   = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const search = q?.trim() ?? "";

  const adminDb = createAdminClient();

  let query = adminDb
    .from("colleges")
    .select("id, name, slug, description, website, city, country, logo_url", { count: "exact" })
    .eq("is_active",    true)
    .eq("is_published", true)
    .order("name");

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data: colleges, count } = await query.range(offset, offset + PAGE_SIZE - 1);

  const total      = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (p > 1)  params.set("page", String(p));
    const qs = params.toString();
    return `/colleges${qs ? `?${qs}` : ""}`;
  }

  return (
    <>
      {/* ItemList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type":    "ItemList",
            name:       "Singapore Private Colleges on PathPort",
            url:        "https://pathport.sg/colleges",
            numberOfItems: total,
            itemListElement: (colleges ?? []).map((c, i) => ({
              "@type":    "ListItem",
              position:   offset + i + 1,
              name:       c.name,
              url:        `https://pathport.sg/colleges/${c.slug}`,
            })),
          }),
        }}
      />

      {/* Page body — white base; section bands handle their own backgrounds. */}
      <main className="bg-white">

        {/* 1 · Full-bleed photo hero */}
        <CollegesHeroImmersive search={search} />

        {/* 2 · Why Singapore — image-left story split */}
        <CollegesWhyStory />

        {/* 3 · Private College Guide — editorial passage */}
        <PrivateCollegeGuide />

        {/* 4 · Full-bleed photo band — Singapore campus aerial */}
        <PhotoBand
          src="https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=2400&q=75"
          alt="Singapore's Marina Bay and campus district from above"
          caption="Singapore — where you'll study"
          height="lg"
        />

        {/* 5 · EduTrust certification — cream rest beat */}
        <EduTrustExplainer />

        {/* 6 · Diploma Progression ladder */}
        <DiplomaProgressionPathway />

        {/* 7 · Full-bleed photo band — graduation */}
        <PhotoBand
          src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=2400&q=75"
          alt="A graduate holding a diploma certificate at a Singapore graduation ceremony"
          caption="After your diploma"
          height="md"
          captionPosition="right"
        />

        {/* 8 · After Your Diploma — image-left story split */}
        <UniversityProgressionOpportunities />

        {/* 9 · Directory — light cards */}
        <section id="directory" className="relative public-section-white py-20">
          <div className="layout-shell">

            <div className="max-w-3xl mb-12">
              <p className="eyebrow text-pathBlue-700 mb-5">The Directory</p>
              <h2 className="display-3 text-navy-900 mb-4">
                {total} verified college{total !== 1 ? "s" : ""}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
                  on PathPort.
                </span>
              </h2>
              <p className="prose-lg text-navy-800/65">
                Browse, search, and tap any college to see its full programme list.
              </p>
            </div>

            {/* Search */}
            <form method="GET" action="/colleges" className="max-w-xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-800/40 pointer-events-none" />
                <input
                  type="search"
                  name="q"
                  defaultValue={search}
                  placeholder="Search colleges…"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-navy-900 placeholder-navy-800/35 font-body text-sm focus:outline-none focus:border-pathBlue-500/60 focus:ring-2 focus:ring-pathBlue-500/15 transition-all"
                />
                {search && (
                  <Link
                    href="/colleges"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-800/50 hover:text-navy-900 font-body text-xs transition-colors"
                  >
                    Clear
                  </Link>
                )}
              </div>
            </form>

            {/* Results count */}
            <p className="text-navy-800/45 font-body text-sm text-center mb-8">
              {total === 0
                ? "No colleges found"
                : `Showing ${(colleges ?? []).length} of ${total}${search ? ` matching “${search}”` : ""}`
              }
            </p>

            {/* Advisor prompt */}
            {total > 0 && !search && (
              <div className="max-w-xl mx-auto mb-10 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-pathBlue-500/5 border border-pathBlue-500/15">
                <p className="text-navy-800/70 font-body text-sm text-center sm:text-left">Not sure which college suits you?</p>
                <a
                  href="https://wa.me/6583776492"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all"
                >
                  Ask a PathPort advisor →
                </a>
              </div>
            )}

            {/* Grid */}
            {(colleges ?? []).length === 0 ? (
              <div className="flex flex-col items-center py-20 text-navy-800/35">
                <Building2 className="w-12 h-12 mb-4" />
                <p className="font-display text-2xl text-navy-800/50 mb-1">No colleges found</p>
                {search && (
                  <Link href="/colleges" className="mt-3 text-pathBlue-700 font-body text-sm hover:text-pathBlue-600 transition-colors">
                    Clear search
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                {(colleges ?? []).map(college => (
                  <Link
                    key={college.id}
                    href={`/colleges/${college.slug}`}
                    className="group block p-7 rounded-2.5xl public-card public-card-hover"
                  >
                    {/* Logo / Avatar */}
                    <div className="w-14 h-14 rounded-2xl border border-slate-200 flex items-center justify-center flex-shrink-0 mb-5 overflow-hidden bg-gradient-to-br from-pathBlue-50 to-white">
                      {(college as { logo_url?: string | null }).logo_url ? (
                        <Image
                          src={(college as { logo_url: string }).logo_url}
                          alt={`${college.name} logo`}
                          width={56} height={56}
                          className="object-contain w-full h-full p-1"
                          unoptimized
                        />
                      ) : (
                        <span className="font-display font-bold text-pathBlue-700 text-lg leading-none">
                          {college.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-body font-semibold text-navy-900 text-sm leading-snug group-hover:text-pathBlue-700 transition-colors">
                        {college.name}
                      </h3>
                      <VerifiedBadge className="flex-shrink-0 mt-0.5" />
                    </div>

                    {college.description && (
                      <p className="text-navy-800/55 font-body text-xs leading-relaxed mb-3 line-clamp-2">
                        {college.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-navy-800/40 font-body text-[10px]">
                        <Globe className="w-3 h-3" />
                        {college.city}, {college.country}
                      </span>
                      <span className="flex items-center gap-1 text-pathBlue-700 group-hover:gap-1.5 font-body text-xs font-semibold transition-all">
                        View courses <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
                {page > 1 && (
                  <Link
                    href={pageHref(page - 1)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-navy-800/70 hover:text-navy-900 hover:border-pathBlue-500/40 font-body text-sm transition-all"
                  >
                    Previous
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Link
                    key={p}
                    href={pageHref(p)}
                    aria-current={p === page ? "page" : undefined}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-body text-sm transition-all ${
                      p === page
                        ? "bg-pathBlue-700 border border-pathBlue-700 text-white"
                        : "bg-white border border-slate-200 text-navy-800/70 hover:text-navy-900 hover:border-pathBlue-500/40"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                {page < totalPages && (
                  <Link
                    href={pageHref(page + 1)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-navy-800/70 hover:text-navy-900 hover:border-pathBlue-500/40 font-body text-sm transition-all"
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}
          </div>
        </section>

        {/* 10 · FAQ */}
        <CollegesFAQ />

        {/* 11 · Final CTA — dark for emphasis */}
        <section className="relative section-airy bg-[#06142E] overflow-hidden">
          <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold-400/[0.06] blur-[140px] pointer-events-none" />
          <div className="relative layout-shell text-center">
            <p className="eyebrow text-gold-400 mb-5">Apply with PathPort</p>
            <h2 className="display-2 text-white mb-6 max-w-3xl mx-auto">
              Ready to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
                apply?
              </span>
            </h2>
            <p className="lead text-white/65 mb-10 max-w-xl mx-auto">
              Create a free PathPort account and apply to any Singapore private college programme with full advisor guidance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup?role=student"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-base hover:shadow-gold-sm transition-all"
              >
                Register as Student — Free
              </Link>
              <a
                href="https://wa.me/6583776492"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-gold-400/60 text-gold-400 font-body font-bold text-base hover:border-gold-400 hover:bg-gold-400/[0.08] transition-all"
              >
                WhatsApp +65 8377 6492
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
