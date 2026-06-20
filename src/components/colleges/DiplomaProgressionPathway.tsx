import { createAdminClient } from "@/lib/supabase/admin-client";
import Reveal from "@/components/ui/Reveal";
import { GraduationCap, ChevronRight } from "lucide-react";

interface DbLevel {
  id: string;
  code: string;
  label: string;
  duration: string;
  body: string;
  is_highlighted: boolean;
  display_order: number;
}

export default async function DiplomaProgressionPathway() {
  const adminDb = createAdminClient();
  const { data } = await adminDb
    .from("public_qualification_levels")
    .select("id, code, label, duration, body, is_highlighted, display_order")
    .eq("status", "published")
    .order("display_order");

  const levels = (data ?? []) as DbLevel[];

  if (levels.length === 0) return null;

  return (
    <section className="relative public-section-blue">
      <div className="layout-shell section-airy">
        <Reveal className="max-w-3xl mb-14">
          <p className="eyebrow text-gold-700 mb-5">Diploma Progression</p>
          <h2 className="display-3 text-navy-900 mb-5">
            Singapore&rsquo;s diploma ladder —{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
              at a glance.
            </span>
          </h2>
          <p className="prose-lg text-navy-800/65">
            Five recognised qualification tiers. Each one builds on the last and can stand on its own.
          </p>
        </Reveal>

        {/* Horizontal ladder on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {levels.map(({ id, code, label, duration, body, is_highlighted }, i) => (
            <Reveal key={id} delay={i * 70} className="h-full">
              <div
                className={`relative h-full p-5 rounded-2xl public-card public-card-hover ${
                  is_highlighted ? "ring-1 ring-gold-400/45" : ""
                }`}
              >
                {/* Connector arrow — desktop, between cards */}
                {i < levels.length - 1 && (
                  <div
                    aria-hidden
                    className="hidden lg:flex absolute top-1/2 -right-3 z-10 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 items-center justify-center"
                  >
                    <ChevronRight className="w-3 h-3 text-pathBlue-600" />
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <span className="font-display font-bold text-[10px] tracking-[0.18em] text-pathBlue-700">
                    {code}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-pathBlue-500/10 border border-pathBlue-500/25 text-pathBlue-700 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                </div>
                <p className="font-body font-bold text-navy-900 text-sm mb-1 leading-tight">{label}</p>
                <p className="font-body text-navy-800/55 text-xs mb-3">{duration}</p>
                <p className="font-body text-navy-800/65 text-xs leading-relaxed">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="text-center text-navy-800/55 font-body text-xs mt-8 italic">
          Actual duration varies by institution and intake. Speak to a PathPort advisor for the exact ranges at the colleges you are considering.
        </p>
      </div>
    </section>
  );
}
