// DB-driven success-stories teaser. Pulls up to 3 published stories from the
// database. If none exist yet, shows an honest "first stories coming" panel —
// never fabricated testimonials. Full directory lives at /success-stories.
// Light public theme (white section, navy text).

import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin-client";
import Reveal from "@/components/ui/Reveal";
import { Quote, ArrowRight, Briefcase, GraduationCap } from "lucide-react";

export default async function SuccessTeaser() {
  const adminDb = createAdminClient();

  const { data: rawStories } = await adminDb
    .from("institution_success_stories")
    .select(`
      id, person_name, course_name, graduation_year,
      current_role, current_company, story_text, photo_url
    `)
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .limit(3);

  const stories = rawStories ?? [];

  return (
    <section id="success-stories" className="relative py-20 public-section-white">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <Reveal className="text-center mb-12">
          <p className="inline-flex items-center gap-3 text-gold-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">
            <span className="w-8 h-px bg-gold-600/40 rounded-full" />
            Success Stories
            <span className="w-8 h-px bg-gold-600/40 rounded-full" />
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-navy-900 mb-4 leading-[1.08]">
            Real journeys,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
              real outcomes.
            </span>
          </h2>
          <p className="text-navy-800/60 font-body text-lg max-w-2xl mx-auto leading-relaxed">
            Behind every PathPort application is a family making an important decision. These are the students who made it to Singapore.
          </p>
        </Reveal>

        {stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {stories.map((s, i) => (
              <Reveal key={s.id} delay={i * 80} className="h-full">
                <div className="flex flex-col h-full p-6 rounded-2.5xl public-card">
                  <div className="flex items-center gap-3 mb-4">
                    {s.photo_url ? (
                      <Image
                        src={s.photo_url}
                        alt={s.person_name}
                        width={44} height={44}
                        className="w-11 h-11 rounded-full object-cover border border-navy-900/10 flex-shrink-0"
                        unoptimized
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gold-400/15 border border-gold-400/30 flex items-center justify-center flex-shrink-0">
                        <span className="font-display font-bold text-gold-600 text-base leading-none">
                          {s.person_name.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-body font-semibold text-navy-900 text-sm">{s.person_name}</p>
                      <p className="text-pathBlue-700/80 font-body text-xs">{s.course_name}</p>
                    </div>
                  </div>
                  {s.story_text && (
                    <p className="text-navy-800/65 font-body text-sm leading-relaxed mb-4 flex-1 line-clamp-4">
                      &ldquo;{s.story_text}&rdquo;
                    </p>
                  )}
                  <div className="space-y-1.5 mt-auto pt-4 border-t border-navy-900/10">
                    {(s.current_role || s.current_company) && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-gold-600/70 flex-shrink-0" />
                        <p className="text-navy-800/70 font-body text-xs leading-tight">
                          {[s.current_role, s.current_company].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    )}
                    {s.graduation_year && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-gold-600/70 flex-shrink-0" />
                        <p className="text-navy-800/55 font-body text-xs">Class of {s.graduation_year}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="max-w-2xl mx-auto mb-10 p-7 rounded-2.5xl public-card text-center">
            <div className="w-11 h-11 rounded-2xl bg-gold-400/15 border border-gold-400/30 text-gold-600 flex items-center justify-center mx-auto mb-4">
              <Quote className="w-5 h-5" />
            </div>
            <p className="font-display text-xl text-navy-900 mb-2 leading-snug">
              The first PathPort stories are coming.
            </p>
            <p className="font-body text-navy-800/60 text-sm leading-relaxed">
              PathPort is in early operations. We&apos;re collecting real stories from our first cohort — with their consent. We&apos;d rather wait for real ones than publish placeholders.
            </p>
          </Reveal>
        )}

        <div className="text-center">
          <Link
            href="/success-stories"
            className="inline-flex items-center gap-2 text-pathBlue-700 hover:text-pathBlue-600 font-body text-sm font-semibold transition-colors"
          >
            {stories.length > 0 ? "Read all success stories" : "Learn what each story will cover"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
