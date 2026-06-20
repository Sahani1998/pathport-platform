import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { BookOpen, Award, GraduationCap, Star, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin-client";

interface DbCard {
  id: string;
  icon_name: string;
  level: string;
  badge: string;
  what_it_is: string;
  who_its_for: string;
  typical_duration: string;
  subjects: string[];
  whats_next: string;
  filter_param: string;
  display_order: number;
}

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Award,
  GraduationCap,
  Star,
};

export default async function DiplomaTypesExplained() {
  const adminDb = createAdminClient();
  const { data } = await adminDb
    .from("public_pathway_cards")
    .select("id, icon_name, level, badge, what_it_is, who_its_for, typical_duration, subjects, whats_next, filter_param, display_order")
    .eq("status", "published")
    .order("display_order");

  const cards = (data ?? []) as DbCard[];

  if (cards.length === 0) return null;
  return (
    <section id="diploma-types" className="relative public-section-blue">
      <div className="layout-shell section-airy">
        <Reveal className="text-center mb-12">
          <p className="eyebrow text-gold-700 mb-4">
            Diploma Types Explained
          </p>
          <h2 className="display-3 text-navy-900 mb-4 max-w-2xl mx-auto">
            Four diploma tiers, four different stories.
          </h2>
          <p className="prose-lg text-navy-800/60 max-w-2xl mx-auto">
            Singapore&rsquo;s private college diploma ladder is built so you can enter at the level that fits your background — and stack qualifications over time.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {cards.map((card, i) => {
            const Icon = ICON_MAP[card.icon_name] ?? BookOpen;
            return (
              <Reveal key={card.id} delay={i * 80} className="h-full">
                <div className="h-full p-7 rounded-2.5xl public-card public-card-hover">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-pathBlue-500/10 border border-pathBlue-500/25 text-pathBlue-700 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl text-navy-900 leading-tight">{card.level}</h3>
                      <p className="font-body text-pathBlue-700 text-xs font-semibold tracking-wide uppercase mt-0.5">{card.badge}</p>
                    </div>
                  </div>

                  {/* What it is */}
                  <p className="text-navy-800/65 font-body text-sm leading-relaxed mb-5">{card.what_it_is}</p>

                  {/* Two-up grid: Who / Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    <div className="p-3 rounded-xl bg-navy-900/[0.03] border border-navy-900/10">
                      <p className="font-body text-navy-800/50 text-[10px] font-semibold uppercase tracking-wider mb-1">Who it&rsquo;s for</p>
                      <p className="font-body text-navy-800/75 text-xs leading-relaxed">{card.who_its_for}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gold-400/[0.10] border border-gold-400/25">
                      <p className="font-body text-gold-700 text-[10px] font-semibold uppercase tracking-wider mb-1">Typical duration</p>
                      <p className="font-body text-navy-900 text-sm font-bold leading-snug">{card.typical_duration}</p>
                      <p className="font-body text-navy-800/55 text-[10px] mt-1 italic">Varies by institution.</p>
                    </div>
                  </div>

                  {/* Typical subjects */}
                  <p className="font-body text-navy-800/50 text-[10px] font-semibold uppercase tracking-wider mb-2">Typical subject areas</p>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {(card.subjects ?? []).map(s => (
                      <span key={s} className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-navy-900/5 text-navy-800/65 border border-navy-900/10 font-body text-xs font-medium leading-none">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* What's next */}
                  <div className="p-3 rounded-xl bg-pathBlue-500/[0.06] border border-pathBlue-500/15 mb-5">
                    <p className="font-body text-pathBlue-700 text-[10px] font-semibold uppercase tracking-wider mb-1">What&rsquo;s next</p>
                    <p className="font-body text-navy-800/75 text-xs leading-relaxed">{card.whats_next}</p>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/courses?level=${card.filter_param}`}
                    className="inline-flex items-center gap-1.5 text-pathBlue-700 hover:text-pathBlue-600 font-body text-sm font-semibold transition-colors"
                  >
                    Browse {card.level.toLowerCase()} programmes
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
