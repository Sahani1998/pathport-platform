// Public colleges directory — no auth required
// Fetches from DB filtered by is_published + is_active.
// Pagination: 12 per page via ?page= param.
// Search: ?q= filters by name/description ilike.

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { Building2, Globe, Search, ChevronRight } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

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

  const total     = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Build pagination URL helper
  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (p > 1)  params.set("page", String(p));
    const qs = params.toString();
    return `/colleges${qs ? `?${qs}` : ""}`;
  }

  return (
    <>
      {/* JSON-LD */}
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

      <main className="min-h-screen py-24 px-5 md:px-10">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-pathBlue-400 font-body text-xs font-semibold tracking-[0.20em] uppercase mb-3">
              Singapore Private Colleges
            </p>
            <h1 className="font-display text-4xl sm:text-5xl text-white mb-4 leading-tight">
              Find Your Singapore College
            </h1>
            <p className="text-white/50 font-body text-lg max-w-2xl mx-auto">
              Compare EduTrust-certified private colleges offering diploma, advanced diploma, and higher diploma programmes for Indian students.
            </p>
          </div>

          {/* Search */}
          <form method="GET" action="/colleges" className="max-w-xl mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Search colleges…"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white placeholder-white/30 font-body text-sm focus:outline-none focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/10 transition-all"
              />
              {search && (
                <Link
                  href="/colleges"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 font-body text-xs transition-colors"
                >
                  Clear
                </Link>
              )}
            </div>
          </form>

          {/* Results count */}
          <p className="text-white/35 font-body text-sm text-center mb-8">
            {total === 0
              ? "No colleges found"
              : `${total} college${total !== 1 ? "s" : ""}${search ? ` matching "${search}"` : ""}`
            }
          </p>

          {/* Advisor prompt — shown when browsing (not searching) */}
          {total > 0 && !search && (
            <div className="max-w-xl mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <p className="text-white/55 font-body text-sm text-center sm:text-left">Not sure which college suits you?</p>
              <a
                href="https://wa.me/6583776492"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all"
              >
                Ask a PathPort advisor →
              </a>
            </div>
          )}

          {/* Grid */}
          {(colleges ?? []).length === 0 ? (
            <div className="flex flex-col items-center py-20 text-white/25">
              <Building2 className="w-12 h-12 mb-4" />
              <p className="font-display text-2xl text-white/40 mb-1">No colleges found</p>
              {search && (
                <Link href="/colleges" className="mt-3 text-pathBlue-400 font-body text-sm hover:text-pathBlue-300 transition-colors">
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
                  className="group block bg-white/[0.04] border border-white/[0.08] rounded-2.5xl p-7 hover:border-gold-400/35 hover:bg-gold-400/[0.04] hover:-translate-y-0.5 hover:shadow-warm transition-all duration-300"
                >
                  {/* Logo / Avatar */}
                  <div className="w-14 h-14 rounded-2xl border border-white/[0.08] flex items-center justify-center flex-shrink-0 mb-5 overflow-hidden bg-gradient-to-br from-pathBlue-700 to-pathBlue-900">
                    {(college as { logo_url?: string | null }).logo_url ? (
                      <Image
                        src={(college as { logo_url: string }).logo_url}
                        alt={`${college.name} logo`}
                        width={56} height={56}
                        className="object-contain w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <span className="font-display font-bold text-pathBlue-300 text-lg leading-none">
                        {college.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="font-body font-semibold text-white/90 text-sm leading-snug group-hover:text-white transition-colors">
                      {college.name}
                    </h2>
                    <VerifiedBadge className="flex-shrink-0 mt-0.5" />
                  </div>

                  {college.description && (
                    <p className="text-white/40 font-body text-xs leading-relaxed mb-3 line-clamp-2">
                      {college.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-white/25 font-body text-[10px]">
                      <Globe className="w-3 h-3" />
                      {college.city}, {college.country}
                    </span>
                    <span className="flex items-center gap-1 text-gold-400/70 group-hover:text-gold-400 font-body text-xs font-semibold transition-colors">
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
                  className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/60 hover:text-white hover:border-white/20 font-body text-sm transition-all"
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
                      ? "bg-gold-400/20 border border-gold-400/40 text-gold-300"
                      : "bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20"
                  }`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link
                  href={pageHref(page + 1)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/60 hover:text-white hover:border-white/20 font-body text-sm transition-all"
                >
                  Next
                </Link>
              )}
            </nav>
          )}

          {/* Bottom CTA */}
          <div className="mt-16 text-center p-8 rounded-2xl bg-pathBlue-500/[0.06] border border-pathBlue-500/20">
            <p className="font-display text-2xl text-white mb-2">Ready to Apply?</p>
            <p className="text-white/50 font-body text-sm mb-5 max-w-md mx-auto">
              Create a free PathPort account and apply to any Singapore private college programme with expert guidance.
            </p>
            <Link
              href="/signup?role=student"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-sm hover:shadow-gold-sm transition-all"
            >
              Register as Student
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
