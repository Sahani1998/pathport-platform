import type { Metadata } from "next";
import Image from "next/image";
import { Users, Quote, Briefcase, GraduationCap, Building2 } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { createAdminClient } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student Success Stories | PathPort",
  description: "Real stories from Indian students who studied in Singapore through PathPort — their application journey, internship, and life outcomes.",
  alternates: { canonical: "/success-stories" },
  openGraph: { title: "Student Success Stories | PathPort", description: "Real journeys from application to career — Indian students in Singapore." },
};

export default async function SuccessStoriesPage() {
  const adminDb = createAdminClient();

  // Pull published success stories from all colleges, joined with college name
  const { data: rawStories } = await adminDb
    .from("institution_success_stories")
    .select(`
      id, person_name, course_name, graduation_year,
      current_role, current_company, story_text, photo_url,
      colleges ( name, slug )
    `)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  const stories = rawStories ?? [];

  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Success Stories", url: "/success-stories" }])} />
      <Breadcrumbs trail={[{ name: "Success Stories", url: "/success-stories" }]} />

      <PageHero
        eyebrow="Student Success Stories"
        title="Real journeys, real outcomes."
        subtitle="Behind every PathPort application is a family making one of the most important decisions of their lives. These are stories of students who made it to Singapore, completed their programme, and built their future."
      />

      {stories.length > 0 ? (
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stories.map(s => {
              const college = Array.isArray(s.colleges) ? s.colleges[0] : s.colleges;
              return (
                <div key={s.id} className="flex flex-col p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                  {/* Person header */}
                  <div className="flex items-center gap-3 mb-4">
                    {s.photo_url ? (
                      <Image
                        src={s.photo_url}
                        alt={s.person_name}
                        width={48} height={48}
                        className="w-12 h-12 rounded-full object-cover border border-white/[0.10] flex-shrink-0"
                        unoptimized
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center flex-shrink-0">
                        <span className="font-display font-bold text-gold-400 text-base leading-none">
                          {s.person_name.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-body font-semibold text-white/90 text-sm">{s.person_name}</p>
                      <p className="text-gold-400/70 font-body text-xs">{s.course_name}</p>
                    </div>
                  </div>

                  {/* Story text */}
                  {s.story_text && (
                    <p className="text-white/55 font-body text-sm leading-relaxed mb-4 flex-1">
                      &ldquo;{s.story_text}&rdquo;
                    </p>
                  )}

                  {/* Outcome row */}
                  <div className="space-y-1.5 mt-auto pt-4 border-t border-white/[0.06]">
                    {(s.current_role || s.current_company) && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-gold-400/60 flex-shrink-0" />
                        <p className="text-white/60 font-body text-xs leading-tight">
                          {[s.current_role, s.current_company].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    )}
                    {s.graduation_year && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-gold-400/60 flex-shrink-0" />
                        <p className="text-white/45 font-body text-xs">Class of {s.graduation_year}</p>
                      </div>
                    )}
                    {college?.name && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-gold-400/60 flex-shrink-0" />
                        <p className="text-white/40 font-body text-xs">{college.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <>
          {/* Empty state — honest, no fake stories */}
          <section className="mb-10 p-5 rounded-2xl bg-gold-400/[0.06] border border-gold-400/20">
            <div className="flex items-start gap-3">
              <Quote className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
              <p className="text-white/75 font-body text-sm leading-relaxed">
                PathPort is in early operations. We are collecting stories from our first cohort of students with their consent. Full stories — with timelines, photos, and direct quotes — will be published here once students complete their programmes.
              </p>
            </div>
          </section>

          {/* Story format preview — shows what to expect */}
          <section className="mb-12">
            <h2 className="font-display text-2xl text-white mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-400" /> What each story will cover
            </h2>
            <p className="text-white/45 font-body text-sm mb-5">Each PathPort success story follows a structured format so you can understand the full journey — not just the highlight reel.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { title: "The student", desc: "Background, state in India, family context, why they considered Singapore." },
                { title: "The application journey", desc: "How they found PathPort, which college they chose, challenges during the process." },
                { title: "The internship", desc: "Which company, what role, what they learned, what they earned." },
                { title: "The outcome", desc: "Where they are now — employment, further study, or return to India with international experience." },
                { title: "For parents", desc: "A section specifically for parents: was it worth it? How did they support from afar?" },
                { title: "Advice", desc: "One piece of advice for a student considering the same path." },
              ].map(item => (
                <div key={item.title} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="font-body font-semibold text-white/85 text-sm mb-1">{item.title}</p>
                  <p className="text-white/45 font-body text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Share your story CTA — always visible */}
      <section className="bg-gradient-to-br from-gold-400/[0.08] to-transparent border border-gold-400/20 rounded-2xl p-8 text-center">
        <p className="font-display text-2xl text-white mb-3">Share your PathPort story</p>
        <p className="text-white/55 font-body text-sm mb-6 max-w-xl mx-auto leading-relaxed">
          Are you a PathPort student who has completed your programme or internship? We would love to feature your story. Stories are published with your full consent and reviewed by you before going live.
        </p>
        <a
          href="mailto:pathportsg@gmail.com?subject=Share%20my%20PathPort%20story"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-sm hover:shadow-gold-sm transition-all"
        >
          Share your story
        </a>
      </section>
    </MarketingShell>
  );
}
