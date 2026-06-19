// DB-driven server component — replaces hardcoded static data.
// Fetches published colleges from the database.
// Links through to /colleges/[slug] for the full public directory.

import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin-client";
import SectionHeader from "@/components/ui/SectionHeader";
import GoldButton from "@/components/ui/GoldButton";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { ChevronRight } from "lucide-react";

export default async function PrivateColleges() {
  const adminDb = createAdminClient();

  const { data: colleges } = await adminDb
    .from("colleges")
    .select("id, name, slug, description, short_description, logo_url")
    .eq("is_active",    true)
    .eq("is_published", true)
    .order("name")
    .limit(9);

  const list = colleges ?? [];

  return (
    <section id="colleges" className="relative py-24 cream-band">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <SectionHeader
          dark
          eyebrow="Singapore Private Colleges"
          title="Explore Your Singapore College Options"
          subtitle="Explore Singapore private college options for diploma, advanced diploma, higher diploma, and specialist diploma pathways. PathPort helps students compare programmes, prepare documents, and submit applications."
        />

        {/* Fee callout */}
        <div className="max-w-2xl mx-auto mb-10 text-center p-4 rounded-2xl bg-gold-50 border border-gold-400/30">
          <p className="text-navy-800/80 font-body text-sm">
            Course fees typically range from{" "}
            <strong className="text-gold-700">SGD 4,000 to SGD 8,000 per year</strong>
            {" "}— PathPort advisors help you find options that fit your budget.
          </p>
        </div>

        {/* College grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {list.map(college => (
            <Link key={college.id} href={`/colleges/${college.slug}`}>
              <div className="warm-panel-card rounded-2.5xl p-6 h-full group cursor-pointer hover:-translate-y-0.5 hover:shadow-warm-lg transition-all duration-300">
                <div className="flex items-start gap-3 mb-3">
                  {/* College logo or initials avatar */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pathBlue-700 to-pathBlue-900 border border-pathBlue-500/30 flex items-center justify-center flex-shrink-0 shadow-blue-sm overflow-hidden">
                    {(college as { logo_url?: string | null }).logo_url ? (
                      <Image
                        src={(college as { logo_url: string }).logo_url}
                        alt={`${college.name} logo`}
                        width={48} height={48}
                        className="object-contain w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <span className="font-display font-bold text-pathBlue-300 text-base leading-none">
                        {college.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-body font-semibold text-navy-900 text-sm leading-snug group-hover:text-navy-700 transition-colors mb-1">
                      {college.name}
                    </h3>
                    <VerifiedBadge size="sm" className="border-emerald-600/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" />
                  </div>
                </div>

                {((college as { short_description?: string | null }).short_description ?? college.description) ? (
                  <p className="text-navy-800/60 font-body text-xs leading-relaxed line-clamp-2 mb-3">
                    {(college as { short_description?: string | null }).short_description ?? college.description}
                  </p>
                ) : (
                  <p className="text-navy-800/45 font-body text-xs mb-3 italic">
                    EduTrust-certified Singapore private college
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-gold-700 group-hover:text-gold-800 font-body text-xs font-semibold transition-colors mt-auto">
                  View programmes <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View all CTA */}
        <div className="text-center">
          <p className="text-navy-800/55 font-body text-sm mb-4">
            Not sure which college is right for you? PathPort advisors help you compare options based on your budget, course interest, and background.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/colleges">
              <GoldButton variant="outline-gold" size="md">
                Browse All Colleges <ChevronRight className="w-4 h-4 inline-block" />
              </GoldButton>
            </Link>
            <Link href="/colleges">
              <GoldButton variant="solid-gold" size="md">
                Get a Free College Comparison
              </GoldButton>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
